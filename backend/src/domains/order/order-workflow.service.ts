import { Injectable } from '@nestjs/common';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { AppEventEmitter } from '@common/events/event-emitter.service';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

type PrismaServiceLike = PrismaService | Prisma.TransactionClient;

const ORDER_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['PACKING', 'CANCELLED'],
  PACKING: ['READY_TO_SHIP'],
  READY_TO_SHIP: ['SHIPPED'],
  SHIPPED: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: ['RETURN_REQUESTED'],
  RETURN_REQUESTED: ['RETURN_APPROVED', 'RETURN_REJECTED'],
  RETURN_APPROVED: ['RETURN_COMPLETED'],
  RETURN_REJECTED: [],
  RETURN_COMPLETED: [],
  CANCELLED: [],
};

const CANCELLABLE_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING'];
const RETURNABLE_STATUSES = ['DELIVERED'];

@Injectable()
export class OrderWorkflowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: AppEventEmitter,
  ) {}

  validateTransition(currentStatus: string, nextStatus: string): void {
    const allowed = ORDER_TRANSITIONS[currentStatus] ?? [];
    if (!allowed.includes(nextStatus)) {
      throw new BusinessException(
        `Cannot transition from ${currentStatus} to ${nextStatus}`,
        'ORDER_002',
      );
    }
  }

  canCancel(status: string): boolean {
    return CANCELLABLE_STATUSES.includes(status);
  }

  canReturn(status: string): boolean {
    return RETURNABLE_STATUSES.includes(status);
  }

  async transition(
    orderId: string,
    nextStatus: string,
    userId: string,
    message?: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new BusinessException('Order not found', 'ORDER_001');

    this.validateTransition(order.status, nextStatus);

    const [updated] = await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: { status: nextStatus, updatedBy: userId },
      }),
      this.prisma.orderTimeline.create({
        data: {
          orderId,
          status: nextStatus,
          message: message ?? `Status changed to ${nextStatus}`,
          createdBy: userId,
        },
      }),
    ]);

    await this.auditService.log({
      action: `ORDER_${nextStatus}`,
      module: 'orders',
      resource: 'order',
      resourceId: orderId,
      userId,
      oldValue: { status: order.status },
      newValue: { status: nextStatus },
    });

    return updated;
  }

  // ponytail: accept a transactional prisma client so payment capture/refund runs atomically
  private db(tx?: PrismaServiceLike): PrismaServiceLike {
    return tx ?? this.prisma;
  }

  async reserveInventory(orderId: string, tx?: PrismaServiceLike) {
    const db = this.db(tx);
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new BusinessException('Order not found', 'ORDER_001');

    const variantIds: string[] = [];
    await db.$transaction(async (t) => {
      for (const item of order.items) {
        if (!item.variantId) continue;
        const inventory = await t.inventory.findUnique({
          where: { variantId: item.variantId },
        });
        if (!inventory) continue;
        const available =
          inventory.availableQuantity - inventory.reservedQuantity;
        if (available < item.quantity && !inventory.allowBackorder) {
          throw new BusinessException(
            `Insufficient stock for ${item.productName}`,
            'ORDER_003',
          );
        }
        await t.inventory.update({
          where: { id: inventory.id },
          data: {
            reservedQuantity: inventory.reservedQuantity + item.quantity,
          },
        });
        variantIds.push(item.variantId);
      }
    });
    for (const variantId of variantIds) {
      this.eventEmitter.emit('cache.invalidate.variant.details', { variantId });
    }
  }

  async releaseInventory(orderId: string, tx?: PrismaServiceLike) {
    const db = this.db(tx);
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return;

    const variantIds: string[] = [];
    await db.$transaction(async (t) => {
      for (const item of order.items) {
        if (!item.variantId) continue;
        const inventory = await t.inventory.findUnique({
          where: { variantId: item.variantId },
        });
        if (!inventory) continue;
        const newReserved = Math.max(
          0,
          inventory.reservedQuantity - item.quantity,
        );
        await t.inventory.update({
          where: { id: inventory.id },
          data: { reservedQuantity: newReserved },
        });
        variantIds.push(item.variantId);
      }
    });
    for (const variantId of variantIds) {
      this.eventEmitter.emit('cache.invalidate.variant.details', { variantId });
    }
  }

  async deductInventory(orderId: string, tx?: PrismaServiceLike) {
    const db = this.db(tx);
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return;

    const variantIds: string[] = [];
    await db.$transaction(async (t) => {
      for (const item of order.items) {
        if (!item.variantId) continue;
        const inventory = await t.inventory.findUnique({
          where: { variantId: item.variantId },
        });
        if (!inventory) continue;
        // Idempotent: skip already-deducted quantity to prevent double-deduct on retry/webhook race.
        const alreadyDeducted = Math.min(
          inventory.reservedQuantity,
          item.quantity,
        );
        const remaining = item.quantity - alreadyDeducted;
        if (remaining <= 0) continue;
        await t.inventory.update({
          where: { id: inventory.id },
          data: {
            availableQuantity: Math.max(
              0,
              inventory.availableQuantity - remaining,
            ),
            reservedQuantity: Math.max(
              0,
              inventory.reservedQuantity - remaining,
            ),
          },
        });
        variantIds.push(item.variantId);
      }
    });
    for (const variantId of variantIds) {
      this.eventEmitter.emit('cache.invalidate.variant.details', { variantId });
    }
  }

  async restoreInventory(orderId: string, tx?: PrismaServiceLike) {
    const db = this.db(tx);
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return;

    const variantIds: string[] = [];
    await db.$transaction(async (t) => {
      for (const item of order.items) {
        if (!item.variantId) continue;
        const inventory = await t.inventory.findUnique({
          where: { variantId: item.variantId },
        });
        if (!inventory) continue;
        await t.inventory.update({
          where: { id: inventory.id },
          data: {
            availableQuantity: inventory.availableQuantity + item.quantity,
            reservedQuantity: Math.max(
              0,
              inventory.reservedQuantity - item.quantity,
            ),
          },
        });
        variantIds.push(item.variantId);
      }
    });
    for (const variantId of variantIds) {
      this.eventEmitter.emit('cache.invalidate.variant.details', { variantId });
    }
  }

  async generateOrderNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `ORD-${dateStr}-`;

    const lastOrder = await this.prisma.order.findFirst({
      where: { orderNumber: { startsWith: prefix } },
      orderBy: { orderNumber: 'desc' },
      select: { orderNumber: true },
    });

    let seq = 1;
    if (lastOrder) {
      const lastSeq = parseInt(lastOrder.orderNumber.slice(-6), 10);
      if (!isNaN(lastSeq)) seq = lastSeq + 1;
    }

    return `${prefix}${String(seq).padStart(6, '0')}`;
  }
}

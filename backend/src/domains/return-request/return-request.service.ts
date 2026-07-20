import { Injectable } from '@nestjs/common';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { OrderWorkflowService } from '@domains/order/order-workflow.service';
import { ReturnRequestRepository } from './return-request.repository';
import {
  CreateReturnDto,
  UpdateReturnStatusDto,
  ReturnQueryDto,
  ReturnRequestResponse,
  ReturnItemResponse,
} from './return-request.types';
import { PrismaService } from '@database/prisma.service';

@Injectable()
export class ReturnRequestService {
  constructor(
    private readonly returnRepo: ReturnRequestRepository,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
    private readonly workflow: OrderWorkflowService,
  ) {}

  private toResponse(r: any): ReturnRequestResponse {
    return {
      id: r.id,
      orderId: r.orderId,
      returnNumber: r.returnNumber,
      reason: r.reason,
      status: r.status,
      adminNotes: r.adminNotes ?? undefined,
      items: r.items?.map((i: any): ReturnItemResponse => ({
        id: i.id,
        orderItemId: i.orderItemId,
        quantity: i.quantity,
        reason: i.reason ?? undefined,
      })),
      createdAt: r.createdAt,
    };
  }

  async findAll(query: ReturnQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.returnRepo.findAll({
      status: query.status,
      orderId: query.orderId,
      page,
      limit,
    });
    return {
      data: result.data.map((r) => this.toResponse(r)),
      meta: result.meta,
    };
  }

  async findById(id: string, user?: { sub: string; roles?: string[] }) {
    const ret = await this.returnRepo.findById(id);
    if (!ret)
      throw new BusinessException('Return request not found', 'RETURN_001');
    const isAdmin = user?.roles?.some((r) =>
      ['super_admin', 'admin'].includes(r),
    );
    if (user && !isAdmin && ret.order?.customerId !== user.sub) {
      throw new BusinessException('Access denied', 'RETURN_006');
    }
    return this.toResponse(ret);
  }

  async create(userId: string, dto: CreateReturnDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { items: true },
    });
    if (!order) throw new BusinessException('Order not found', 'ORDER_001');

    if (!this.workflow.canReturn(order.status))
      throw new BusinessException(
        'Order must be delivered before requesting a return',
        'RETURN_002',
      );

    const orderItemMap = new Map(order.items.map((i) => [i.id, i]));
    for (const item of dto.items) {
      const orderItem = orderItemMap.get(item.orderItemId);
      if (!orderItem)
        throw new BusinessException(
          `Order item ${item.orderItemId} not found`,
          'RETURN_003',
        );
      if (item.quantity > orderItem.quantity)
        throw new BusinessException(
          'Return quantity exceeds order item quantity',
          'RETURN_004',
        );
    }

    const returnNumber = await this.returnRepo.generateReturnNumber();
    const ret = await this.returnRepo.create({
      order: { connect: { id: dto.orderId } },
      returnNumber,
      reason: dto.reason,
      createdBy: userId,
      items: {
        create: dto.items.map((i) => ({
          orderItem: { connect: { id: i.orderItemId } },
          quantity: i.quantity,
          reason: i.reason,
        })),
      },
    });

    await this.workflow.transition(
      dto.orderId,
      'RETURN_REQUESTED',
      userId,
      `Return requested: ${returnNumber}`,
    );

    await this.auditService.log({
      action: 'RETURN_REQUESTED',
      module: 'returns',
      resource: 'return_request',
      resourceId: ret.id,
      userId,
      newValue: { orderId: dto.orderId, returnNumber },
    });

    return this.toResponse(ret);
  }

  async updateStatus(id: string, dto: UpdateReturnStatusDto, userId: string) {
    const ret = await this.returnRepo.findById(id);
    if (!ret)
      throw new BusinessException('Return request not found', 'RETURN_001');

    const validTransitions: Record<string, string[]> = {
      REQUESTED: ['APPROVED', 'REJECTED'],
      APPROVED: ['COMPLETED'],
    };
    const allowed = validTransitions[ret.status] ?? [];
    if (!allowed.includes(dto.status))
      throw new BusinessException(
        `Cannot transition from ${ret.status} to ${dto.status}`,
        'RETURN_005',
      );

    const updated = await this.returnRepo.update(id, {
      status: dto.status,
      adminNotes: dto.adminNotes,
      updatedBy: userId,
    });

    if (dto.status === 'COMPLETED') {
      await this.workflow.restoreInventory(ret.orderId);
      await this.workflow.transition(
        ret.orderId,
        'RETURN_COMPLETED',
        userId,
        'Return completed',
      );
    } else if (dto.status === 'APPROVED') {
      await this.workflow.transition(
        ret.orderId,
        'RETURN_APPROVED',
        userId,
        'Return approved',
      );
    }

    const actionMap: Record<string, string> = {
      APPROVED: 'RETURN_APPROVED',
      REJECTED: 'RETURN_REJECTED',
      COMPLETED: 'RETURN_COMPLETED',
    };
    await this.auditService.log({
      action: actionMap[dto.status] ?? 'RETURN_STATUS_UPDATED',
      module: 'returns',
      resource: 'return_request',
      resourceId: id,
      userId,
      oldValue: { status: ret.status },
      newValue: { status: dto.status },
    });

    return this.toResponse(updated);
  }
}

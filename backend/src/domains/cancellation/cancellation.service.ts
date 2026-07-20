import { Injectable } from '@nestjs/common';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { OrderWorkflowService } from '@domains/order/order-workflow.service';
import { CancellationRepository } from './cancellation.repository';
import {
  CreateCancellationDto,
  UpdateCancellationDto,
  CancellationResponse,
} from './cancellation.types';
import { PrismaService } from '@database/prisma.service';

@Injectable()
export class CancellationService {
  constructor(
    private readonly cancelRepo: CancellationRepository,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
    private readonly workflow: OrderWorkflowService,
  ) {}

  private toResponse(c: any): CancellationResponse {
    return {
      id: c.id,
      orderId: c.orderId,
      reason: c.reason,
      status: c.status,
      refundStatus: c.refundStatus,
      adminNotes: c.adminNotes ?? undefined,
      createdAt: c.createdAt,
    };
  }

  async findByOrderId(orderId: string) {
    const cancel = await this.cancelRepo.findByOrderId(orderId);
    if (!cancel)
      throw new BusinessException('Cancellation not found', 'CANCEL_001');
    return this.toResponse(cancel);
  }

  async create(userId: string, dto: CreateCancellationDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });
    if (!order) throw new BusinessException('Order not found', 'ORDER_001');

    if (!this.workflow.canCancel(order.status))
      throw new BusinessException(
        'Cannot cancel order in current status',
        'CANCEL_002',
      );

    const existing = await this.cancelRepo.findByOrderId(dto.orderId);
    if (existing)
      throw new BusinessException('Cancellation already exists', 'CANCEL_003');

    const cancel = await this.cancelRepo.create({
      order: { connect: { id: dto.orderId } },
      reason: dto.reason,
      createdBy: userId,
    });

    await this.workflow.transition(
      dto.orderId,
      'CANCELLED',
      userId,
      `Cancelled: ${dto.reason}`,
    );
    await this.workflow.releaseInventory(dto.orderId);

    await this.auditService.log({
      action: 'ORDER_CANCELLED',
      module: 'cancellations',
      resource: 'cancellation_request',
      resourceId: cancel.id,
      userId,
      newValue: { orderId: dto.orderId },
    });

    return this.toResponse(cancel);
  }

  async update(id: string, dto: UpdateCancellationDto, userId: string) {
    const cancel = await this.prisma.cancellationRequest.findUnique({
      where: { id },
    });
    if (!cancel)
      throw new BusinessException('Cancellation not found', 'CANCEL_001');

    const updated = await this.cancelRepo.update(id, {
      ...dto,
      updatedBy: userId,
    });
    return this.toResponse(updated);
  }
}

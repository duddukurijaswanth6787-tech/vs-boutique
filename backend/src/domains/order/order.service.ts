import { Injectable } from '@nestjs/common';
import { BusinessException } from '@common/exceptions';
import { OrderRepository } from './order.repository';
import { OrderWorkflowService } from './order-workflow.service';
import {
  OrderQueryDto,
  OrderResponse,
  OrderStatisticsResponse,
} from './order.types';
import { StorageService } from '@infrastructure/storage/storage.service';

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly workflow: OrderWorkflowService,
    private readonly storageService: StorageService,
  ) {}

  private async toResponse(
    o: any,
    includeRelations = false,
  ): Promise<OrderResponse> {
    const customerName = o.customer?.user
      ? `${o.customer.user.firstName} ${o.customer.user.lastName ?? ''}`.trim()
      : undefined;
    const customerEmail = o.customer?.user?.email ?? undefined;
    const items =
      includeRelations && o.items
        ? await Promise.all(
            o.items.map(async (i: any) => {
              const media: any[] = i.product?.media ?? [];
              const primary = media.find((m: any) => m.isPrimary) ?? media[0];
              const primaryImageUrl = primary
                ? await this.storageService.getDisplayUrl(primary.url)
                : undefined;
              return {
                id: i.id,
                productId: i.productId,
                productName: i.productName,
                variantId: i.variantId ?? undefined,
                variantTitle: i.variantTitle ?? undefined,
                sku: i.sku,
                quantity: i.quantity,
                unitPrice: Number(i.unitPrice),
                totalPrice: Number(i.totalPrice),
                taxAmount: Number(i.taxAmount),
                discountAmount: Number(i.discountAmount),
                primaryImageUrl,
              };
            }),
          )
        : undefined;

    return {
      id: o.id,
      orderNumber: o.orderNumber,
      customerId: o.customerId,
      customerName,
      customerEmail,
      status: o.status,
      subtotal: Number(o.subtotal),
      discountTotal: Number(o.discountTotal),
      taxTotal: Number(o.taxTotal),
      shippingCharge: Number(o.shippingCharge),
      grandTotal: Number(o.grandTotal),
      currency: o.currency,
      notes: o.notes ?? undefined,
      items,
      addresses:
        includeRelations && o.addresses
          ? o.addresses.map((a: any) => ({
              id: a.id,
              addressType: a.addressType,
              fullName: a.fullName,
              phone: a.phone,
              addressLine1: a.addressLine1,
              addressLine2: a.addressLine2 ?? undefined,
              city: a.city,
              state: a.state,
              country: a.country,
              postalCode: a.postalCode,
              landmark: a.landmark ?? undefined,
            }))
          : undefined,
      timeline:
        includeRelations && o.timeline
          ? o.timeline.map((t: any) => ({
              id: t.id,
              status: t.status,
              message: t.message ?? undefined,
              createdBy: t.createdBy ?? undefined,
              createdAt: t.createdAt,
            }))
          : undefined,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    };
  }

  async findAll(query: OrderQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.orderRepository.findAll({
      search: query.search,
      status: query.status,
      customerId: query.customerId,
      startDate: query.startDate,
      endDate: query.endDate,
      createdBy: query.createdBy,
      updatedBy: query.updatedBy,
      createdAfter: query.createdAfter,
      createdBefore: query.createdBefore,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      page,
      limit,
      sortBy: query.sortBy ?? 'createdAt',
      sortOrder: query.sortOrder ?? 'desc',
    });
    return {
      data: await Promise.all(result.data.map((o) => this.toResponse(o))),
      meta: result.meta,
    };
  }

  async findById(id: string) {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new BusinessException('Order not found', 'ORDER_001');
    return await this.toResponse(order, true);
  }

  async findByOrderNumber(orderNumber: string) {
    const order = await this.orderRepository.findByOrderNumber(orderNumber);
    if (!order) throw new BusinessException('Order not found', 'ORDER_001');
    return await this.toResponse(order, true);
  }

  async findByCustomerId(customerId: string, query: OrderQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.orderRepository.findByCustomerId(
      customerId,
      page,
      limit,
    );
    return {
      data: await Promise.all(result.data.map((o) => this.toResponse(o))),
      meta: result.meta,
    };
  }

  async getStatistics(): Promise<OrderStatisticsResponse> {
    return this.orderRepository.getStatistics();
  }

  async updateStatus(
    id: string,
    status: string,
    userId: string,
    message?: string,
  ) {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new BusinessException('Order not found', 'ORDER_001');

    await this.workflow.transition(id, status, userId, message);

    if (status === 'CONFIRMED') {
      await this.workflow.deductInventory(id);
    } else if (status === 'CANCELLED') {
      // Release reserved stock so it can be sold again.
      await this.workflow.releaseInventory(id);
    }

    return this.findById(id);
  }
}

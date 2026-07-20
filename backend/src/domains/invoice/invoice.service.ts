import { Injectable } from '@nestjs/common';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { InvoiceRepository } from './invoice.repository';
import {
  CreateInvoiceDto,
  InvoiceQueryDto,
  InvoiceResponse,
  InvoiceItemResponse,
} from './invoice.types';
import { PrismaService } from '@database/prisma.service';

@Injectable()
export class InvoiceService {
  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  private toItemResponse(item: any): InvoiceItemResponse {
    return {
      id: item.id,
      productName: item.productName,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
      taxAmount: Number(item.taxAmount),
      discountAmount: Number(item.discountAmount),
    };
  }

  private toResponse(inv: any, includeItems = false): InvoiceResponse {
    return {
      id: inv.id,
      orderId: inv.orderId,
      invoiceNumber: inv.invoiceNumber,
      status: inv.status,
      subtotal: Number(inv.subtotal),
      taxTotal: Number(inv.taxTotal),
      discountTotal: Number(inv.discountTotal),
      grandTotal: Number(inv.grandTotal),
      currency: inv.currency,
      billingAddress: inv.billingAddress ?? undefined,
      shippingAddress: inv.shippingAddress ?? undefined,
      notes: inv.notes ?? undefined,
      items:
        includeItems && inv.items
          ? inv.items.map((i: any) => this.toItemResponse(i))
          : undefined,
      createdAt: inv.createdAt,
    };
  }

  async findAll(query: InvoiceQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.invoiceRepository.findAll({
      orderId: query.orderId,
      status: query.status,
      page,
      limit,
    });
    return {
      data: result.data.map((inv) => this.toResponse(inv)),
      meta: result.meta,
    };
  }

  async findById(id: string) {
    const invoice = await this.invoiceRepository.findById(id);
    if (!invoice)
      throw new BusinessException('Invoice not found', 'INVOICE_001');
    return this.toResponse(invoice, true);
  }

  async findByOrderId(orderId: string) {
    const invoices = await this.invoiceRepository.findByOrderId(orderId);
    return invoices.map((inv) => this.toResponse(inv, true));
  }

  async create(userId: string, dto: CreateInvoiceDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { items: true },
    });
    if (!order) throw new BusinessException('Order not found', 'ORDER_001');

    const invoiceNumber = await this.invoiceRepository.generateInvoiceNumber();

    const invoice = await this.invoiceRepository.create({
      order: { connect: { id: dto.orderId } },
      invoiceNumber,
      subtotal: order.subtotal,
      taxTotal: order.taxTotal,
      discountTotal: order.discountTotal,
      grandTotal: order.grandTotal,
      currency: order.currency,
      billingAddress: dto.billingAddress ?? undefined,
      shippingAddress: dto.shippingAddress ?? undefined,
      notes: dto.notes,
      createdBy: userId,
      items: {
        create: order.items.map((item) => ({
          productName: item.productName,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          taxAmount: item.taxAmount,
          discountAmount: item.discountAmount,
        })),
      },
    });

    await this.auditService.log({
      action: 'INVOICE_CREATED',
      module: 'invoice',
      resource: 'Invoice',
      resourceId: invoice.id,
      userId,
    });

    return this.toResponse(invoice, true);
  }
}

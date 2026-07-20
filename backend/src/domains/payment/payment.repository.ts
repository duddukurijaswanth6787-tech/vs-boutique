import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    orderId?: string;
    status?: string;
    page: number;
    limit: number;
  }) {
    const { orderId, status, page, limit } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.PaymentWhereInput = {};
    if (orderId) where.orderId = orderId;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.count({ where }),
    ]);
    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNext: page < Math.ceil(total / limit),
        hasPrevious: page > 1,
      },
    };
  }

  async findById(id: string) {
    return this.prisma.payment.findUnique({
      where: { id },
      include: {
        transactions: { orderBy: { createdAt: 'desc' } },
        order: { select: { customerId: true } },
      },
    });
  }

  async findByOrderId(orderId: string) {
    return this.prisma.payment.findMany({
      where: { orderId },
      include: {
        transactions: { orderBy: { createdAt: 'desc' } },
        order: { select: { customerId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: Prisma.PaymentCreateInput) {
    return this.prisma.payment.create({
      data,
      include: { transactions: true },
    });
  }

  async update(id: string, data: Prisma.PaymentUpdateInput) {
    return this.prisma.payment.update({ where: { id }, data });
  }

  async createTransaction(data: Prisma.PaymentTransactionCreateInput) {
    return this.prisma.paymentTransaction.create({ data });
  }

  async generatePaymentNumber(): Promise<string> {
    const count = await this.prisma.payment.count();
    return `PAY${String(count + 1).padStart(8, '0')}`;
  }
}

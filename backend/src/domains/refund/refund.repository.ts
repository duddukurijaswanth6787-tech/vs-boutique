import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class RefundRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    orderId?: string;
    status?: string;
    page: number;
    limit: number;
  }) {
    const { orderId, status, page, limit } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.RefundWhereInput = {};
    if (orderId) where.orderId = orderId;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.refund.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.refund.count({ where }),
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
    return this.prisma.refund.findUnique({ where: { id } });
  }

  async findByOrderId(orderId: string) {
    return this.prisma.refund.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: Prisma.RefundCreateInput) {
    return this.prisma.refund.create({ data });
  }

  async update(id: string, data: Prisma.RefundUpdateInput) {
    return this.prisma.refund.update({ where: { id }, data });
  }

  async findPaymentById(paymentId: string) {
    return this.prisma.payment.findUnique({ where: { id: paymentId } });
  }

  async generateRefundNumber(): Promise<string> {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `REF-${dateStr}-`;

    const lastRefund = await this.prisma.refund.findFirst({
      where: { refundNumber: { startsWith: prefix } },
      orderBy: { refundNumber: 'desc' },
      select: { refundNumber: true },
    });

    let seq = 1;
    if (lastRefund) {
      const lastSeq = parseInt(lastRefund.refundNumber.slice(-6), 10);
      if (!isNaN(lastSeq)) seq = lastSeq + 1;
    }

    return `${prefix}${String(seq).padStart(6, '0')}`;
  }
}

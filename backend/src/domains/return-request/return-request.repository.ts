import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReturnRequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    status?: string;
    orderId?: string;
    page: number;
    limit: number;
  }) {
    const { status, orderId, page, limit } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.ReturnRequestWhereInput = {};
    if (status) where.status = status;
    if (orderId) where.orderId = orderId;

    const [data, total] = await Promise.all([
      this.prisma.returnRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      }),
      this.prisma.returnRequest.count({ where }),
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
    return this.prisma.returnRequest.findUnique({
      where: { id },
      include: { items: true, order: { select: { customerId: true } } },
    });
  }

  async create(data: Prisma.ReturnRequestCreateInput) {
    return this.prisma.returnRequest.create({ data, include: { items: true } });
  }

  async update(id: string, data: Prisma.ReturnRequestUpdateInput) {
    return this.prisma.returnRequest.update({
      where: { id },
      data,
      include: { items: true },
    });
  }

  async generateReturnNumber(): Promise<string> {
    const count = await this.prisma.returnRequest.count();
    return `RET-${String(count + 1).padStart(6, '0')}`;
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class OfferRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    search?: string;
    isActive?: boolean;
    type?: string;
    page: number;
    limit: number;
  }) {
    const { search, isActive, type, page, limit } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.OfferWhereInput = { deletedAt: null };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (isActive !== undefined) where.isActive = isActive;
    if (type) where.type = type;

    const [data, total] = await Promise.all([
      this.prisma.offer.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.offer.count({ where }),
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
    return this.prisma.offer.findFirst({ where: { id, deletedAt: null } });
  }

  async findActiveOffers() {
    const now = new Date();
    return this.prisma.offer.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async create(data: Prisma.OfferCreateInput) {
    return this.prisma.offer.create({ data });
  }

  async update(id: string, data: Prisma.OfferUpdateInput) {
    return this.prisma.offer.update({ where: { id }, data });
  }
}

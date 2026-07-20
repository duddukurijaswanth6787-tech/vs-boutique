import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class TaxRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    type?: string;
    isActive?: boolean;
    page: number;
    limit: number;
  }) {
    const { type, isActive, page, limit } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.TaxRuleWhereInput = {};
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive;

    const [data, total] = await Promise.all([
      this.prisma.taxRule.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.taxRule.count({ where }),
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
    return this.prisma.taxRule.findUnique({ where: { id } });
  }

  async findActiveRules() {
    return this.prisma.taxRule.findMany({
      where: { isActive: true },
      orderBy: { priority: 'desc' },
    });
  }

  async create(data: Prisma.TaxRuleCreateInput) {
    return this.prisma.taxRule.create({ data });
  }

  async update(id: string, data: Prisma.TaxRuleUpdateInput) {
    return this.prisma.taxRule.update({ where: { id }, data });
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class FaqRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    search?: string;
    category?: string;
    isActive?: boolean;
    page: number;
    limit: number;
  }) {
    const { search, category, isActive, page, limit } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.FaqWhereInput = {};
    if (search) {
      where.OR = [
        { question: { contains: search, mode: 'insensitive' } },
        { answer: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive;

    const [data, total] = await Promise.all([
      this.prisma.faq.findMany({
        where,
        skip,
        take: limit,
        orderBy: { displayOrder: 'asc' },
      }),
      this.prisma.faq.count({ where }),
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
    return this.prisma.faq.findUnique({ where: { id } });
  }

  async create(data: Prisma.FaqCreateInput) {
    return this.prisma.faq.create({ data });
  }

  async update(id: string, data: Prisma.FaqUpdateInput) {
    return this.prisma.faq.update({ where: { id }, data });
  }

  async incrementHelpful(id: string) {
    return this.prisma.faq.update({
      where: { id },
      data: { helpfulCount: { increment: 1 } },
    });
  }
}

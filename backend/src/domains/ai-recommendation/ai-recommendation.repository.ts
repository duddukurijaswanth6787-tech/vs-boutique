import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AiRecommendationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByCustomer(
    customerId: string,
    type?: string,
    page = 1,
    limit = 20,
  ) {
    const skip = (page - 1) * limit;
    const where: Prisma.CustomerRecommendationWhereInput = { customerId };
    if (type) where.type = type;

    const [data, total] = await Promise.all([
      this.prisma.customerRecommendation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customerRecommendation.count({ where }),
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

  async create(data: Prisma.CustomerRecommendationCreateInput) {
    return this.prisma.customerRecommendation.create({ data });
  }

  async createHistory(data: Prisma.RecommendationHistoryCreateInput) {
    return this.prisma.recommendationHistory.create({ data });
  }

  async getHistory(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.recommendationHistory.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.recommendationHistory.count({ where: { userId } }),
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
}

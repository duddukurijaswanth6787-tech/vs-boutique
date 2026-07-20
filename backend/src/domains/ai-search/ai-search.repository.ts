import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AiSearchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createHistory(data: Prisma.SearchHistoryCreateInput) {
    return this.prisma.searchHistory.create({ data });
  }

  async getHistory(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.searchHistory.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.searchHistory.count({ where: { userId } }),
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

  async getTrendingSearches(limit: number) {
    const results = await this.prisma.searchHistory.groupBy({
      by: ['query'],
      _count: { query: true },
      orderBy: { _count: { query: 'desc' } },
      take: limit,
    });
    return results.map((r: any) => ({ query: r.query, count: r._count.query }));
  }

  async updateHistoryClicks(id: string, clickedProductIds: string[]) {
    return this.prisma.searchHistory.update({
      where: { id },
      data: { clickedProductIds },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { AnalyticsQueryDto } from './ai-analytics.types';

@Injectable()
export class AiAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAnalytics(query: AnalyticsQueryDto) {
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(new Date().setDate(new Date().getDate() - 30));
    const endDate = query.endDate ? new Date(query.endDate) : new Date();

    const [
      totalConversations,
      totalSearches,
      totalPrescriptions,
      totalRecommendations,
      popularSearches,
      popularProducts,
      usageByFeature,
    ] = await Promise.all([
      this.prisma.aiConversation.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      this.prisma.searchHistory.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      this.prisma.prescription.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      this.prisma.customerRecommendation.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      this.getPopularSearches(10),
      this.getPopularProducts(10),
      this.getUsageByFeature(query.startDate, query.endDate),
    ]);

    return {
      totalConversations,
      totalSearches,
      totalPrescriptions,
      totalRecommendations,
      popularSearches,
      popularProducts,
      usageByFeature,
    };
  }

  async getUsageByFeature(startDate?: string, endDate?: string) {
    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    const logs = await this.prisma.aiUsageLog.groupBy({
      by: ['feature'],
      where: { createdAt: { gte: start, lte: end } },
      _count: { id: true },
      _sum: { tokensUsed: true, cost: true },
    });

    return logs.map((log: any) => ({
      feature: log.feature,
      count: log._count.id,
      totalTokens: log._sum.tokensUsed ?? 0,
      totalCost: Number(log._sum.cost ?? 0),
    }));
  }

  async getPopularSearches(limit = 10) {
    const searches = await this.prisma.searchHistory.groupBy({
      by: ['query'],
      _count: { query: true },
      orderBy: { _count: { query: 'desc' } },
      take: limit,
    });

    return searches.map((s: any) => ({
      query: s.query,
      count: s._count.query,
    }));
  }

  async getPopularProducts(limit = 10) {
    const products = await this.prisma.customerRecommendation.groupBy({
      by: ['productId'],
      _count: { productId: true },
      orderBy: { _count: { productId: 'desc' } },
      take: limit,
    });

    return products.map((p: any) => ({
      productId: p.productId,
      count: p._count.productId,
    }));
  }
}

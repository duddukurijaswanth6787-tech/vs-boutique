import { Injectable } from '@nestjs/common';
import { AiRecommendationRepository } from './ai-recommendation.repository';
import { AiUnavailableException } from '@common/exceptions';
import {
  RecommendationQueryDto,
  RecommendationResponse,
  RecommendationType,
  RecommendationHistoryQueryDto,
} from './ai-recommendation.types';

@Injectable()
export class AiRecommendationService {
  constructor(
    private readonly repository: AiRecommendationRepository,
  ) {}

  private toResponse(r: any): RecommendationResponse {
    return {
      id: r.id,
      productId: r.productId,
      score: Number(r.score),
      reason: r.reason ?? undefined,
      type: r.type as RecommendationType,
      createdAt: r.createdAt,
    };
  }

  async getRecommendations(userId: string, query: RecommendationQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.repository.findByCustomer(
      userId,
      query.type,
      page,
      limit,
    );
    return {
      data: result.data.map((r: any) => this.toResponse(r)),
      meta: result.meta,
    };
  }

  async generateRecommendations(_userId: string) {
    // ponytail: Not implemented — requires AI provider integration
    throw new AiUnavailableException('AI recommendation generation is not implemented yet.', 'AI_NOT_IMPLEMENTED');
  }

  async getHistory(userId: string, query: RecommendationHistoryQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    return this.repository.getHistory(userId, page, limit);
  }

  async trackClick(userId: string) {
    await this.repository.createHistory({
      user: { connect: { id: userId } },
      type: 'CLICK',
    });
  }
}

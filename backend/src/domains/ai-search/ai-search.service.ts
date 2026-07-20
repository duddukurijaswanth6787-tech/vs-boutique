import { Injectable } from '@nestjs/common';
import { AuditService } from '@domains/audit/audit.service';
import { AiSearchRepository } from './ai-search.repository';
import {
  AiSearchDto,
  SearchSuggestionResponse,
  SearchHistoryResponse,
  TrendingSearchResponse,
} from './ai-search.types';

@Injectable()
export class AiSearchService {
  constructor(
    private readonly repository: AiSearchRepository,
    private readonly auditService: AuditService,
  ) {}

  async search(userId: string, dto: AiSearchDto) {
    const history = await this.repository.createHistory({
      user: { connect: { id: userId } },
      query: dto.query,
      resultCount: 0,
      clickedProductIds: [],
    });

    await this.auditService.log({
      action: 'SEARCH_COMPLETED',
      module: 'ai-search',
      resource: 'search',
      resourceId: history.id,
      userId,
      newValue: { query: dto.query },
    });

    return { historyId: history.id, query: dto.query, results: [] };
  }

  async getSuggestions(): Promise<SearchSuggestionResponse> {
    return { products: [], categories: [], brands: [] };
  }

  async getHistory(userId: string, page: number, limit: number) {
    const p = page ?? 1;
    const l = Math.min(limit ?? 20, 100);
    const result = await this.repository.getHistory(userId, p, l);
    return {
      data: result.data.map((h: any): SearchHistoryResponse => ({
        id: h.id,
        query: h.query,
        resultCount: h.resultCount,
        clickedProductIds: (h.clickedProductIds as string[]) ?? [],
        createdAt: h.createdAt,
      })),
      meta: result.meta,
    };
  }

  async getTrendingSearches(limit = 10): Promise<TrendingSearchResponse[]> {
    return this.repository.getTrendingSearches(limit);
  }
}

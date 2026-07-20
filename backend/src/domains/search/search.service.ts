import { Injectable } from '@nestjs/common';
import { AuditService } from '@domains/audit/audit.service';
import { SearchRepository } from './search.repository';
import { SearchProductsDto, AutocompleteDto } from './search.types';

@Injectable()
export class SearchService {
  constructor(
    private readonly searchRepository: SearchRepository,
    private readonly auditService: AuditService,
  ) {}

  private buildBaseWhere(query: SearchProductsDto) {
    const where: any = {
      deletedAt: null,
      isPublished: true,
      visibility: 'VISIBLE',
    };
    if (query.brandId) where.brandId = query.brandId;
    if (query.gender) where.gender = query.gender;
    if (query.ageGroup) where.ageGroup = query.ageGroup;
    if (query.occasion) where.occasion = query.occasion;
    if (query.season) where.season = query.season;
    if (query.type) where.type = query.type;
    if (query.isFeatured !== undefined) where.isFeatured = query.isFeatured;
    if (query.isNewArrival !== undefined)
      where.isNewArrival = query.isNewArrival;
    if (query.isBestSeller !== undefined)
      where.isBestSeller = query.isBestSeller;
    if (query.categoryId)
      where.categories = { some: { categoryId: query.categoryId } };
    return where;
  }

  async search(query: SearchProductsDto, userId?: string) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);

    const [result, availableFilters] = await Promise.all([
      this.searchRepository.search({
        q: query.q,
        brandId: query.brandId,
        categoryId: query.categoryId,
        gender: query.gender,
        ageGroup: query.ageGroup,
        occasion: query.occasion,
        season: query.season,
        type: query.type,
        isFeatured: query.isFeatured,
        isNewArrival: query.isNewArrival,
        isBestSeller: query.isBestSeller,
        inStock: query.inStock,
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
        tags: query.tags,
        collections: query.collections,
        attributeFilters: query.attributeFilters,
        sortBy: query.sortBy ?? 'relevance',
        sortOrder: query.sortOrder ?? 'desc',
        page,
        limit,
      }),
      this.searchRepository.getAvailableFilters(this.buildBaseWhere(query)),
    ]);

    if (userId && query.q) {
      await this.auditService.log({
        action: 'SEARCH_PERFORMED',
        module: 'search',
        resource: 'search',
        userId,
        newValue: {
          query: query.q,
          filters: { brandId: query.brandId, categoryId: query.categoryId },
        },
      });
    }

    return {
      data: result.data.map((p: any) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        shortDescription: p.shortDescription ?? undefined,
        brandId: p.brandId,
        brandName: p.brand?.name,
        basePrice: Number(p.basePrice),
        salePrice: p.salePrice ? Number(p.salePrice) : undefined,
        status: p.status,
        isFeatured: p.isFeatured,
        isNewArrival: p.isNewArrival,
        isBestSeller: p.isBestSeller,
        gender: p.gender ?? undefined,
        ageGroup: p.ageGroup ?? undefined,
        tags: p.tags?.length ? p.tags : undefined,
        collections: p.collections?.length ? p.collections : undefined,
        createdAt: p.createdAt,
      })),
      appliedFilters: {
        q: query.q,
        brandId: query.brandId,
        categoryId: query.categoryId,
        gender: query.gender,
        ageGroup: query.ageGroup,
        occasion: query.occasion,
        season: query.season,
        type: query.type,
        isFeatured: query.isFeatured,
        isNewArrival: query.isNewArrival,
        isBestSeller: query.isBestSeller,
        inStock: query.inStock,
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
        tags: query.tags,
        collections: query.collections,
        attributeFilters: query.attributeFilters,
      },
      availableFilters,
      meta: result.meta,
    };
  }

  async autocomplete(dto: AutocompleteDto) {
    return this.searchRepository.autocomplete(dto.q, dto.limit ?? 10);
  }
}

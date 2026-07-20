import { Injectable } from '@nestjs/common';
import { LoggerService } from '@common/logger/logger.service';
import { BusinessException } from '@common/exceptions';
import { SlugGenerator } from '@shared/commerce/commerce.utils';
import { AuditService } from '@domains/audit/audit.service';
import { AppEventEmitter } from '@common/events/event-emitter.service';
import { CacheService } from '@infrastructure/redis/cache.service';
import { sanitizePlainText } from '@common/utils/sanitize';
import { BrandsRepository } from './brands.repository';
import {
  CreateBrandDto,
  UpdateBrandDto,
  BrandQueryDto,
  BrandResponse,
} from './brands.types';
import { BulkOperationResult } from '@common/dto/bulk.dto';
import { runBulkOperation } from '@common/utils/bulk.helper';

@Injectable()
export class BrandsService {
  constructor(
    private readonly brandsRepository: BrandsRepository,
    private readonly auditService: AuditService,
    private readonly loggerService: LoggerService,
    private readonly cache: CacheService,
    private readonly eventEmitter: AppEventEmitter,
  ) {}

  private toResponse(b: any): BrandResponse {
    return {
      id: b.id,
      name: b.name,
      slug: b.slug,
      description: b.description ?? undefined,
      logo: b.logo ?? undefined,
      bannerImage: b.bannerImage ?? undefined,
      website: b.website ?? undefined,
      displayOrder: b.displayOrder,
      isFeatured: b.isFeatured,
      isVisible: b.isVisible,
      status: b.status,
      seoTitle: b.seoTitle ?? undefined,
      seoDescription: b.seoDescription ?? undefined,
      seoKeywords: b.seoKeywords ?? undefined,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    };
  }

  async findAll(query: BrandQueryDto) {
    // ponytail: rarely-changing catalog list; 60s TTL covers admin edits
    return this.cache.getOrSet(
      `brand:list:${JSON.stringify(query)}`,
      () => this.computeFindAll(query),
      60,
    );
  }

  private async computeFindAll(query: BrandQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.brandsRepository.findAll({
      search: query.search,
      status: query.status,
      isFeatured: query.isFeatured,
      isVisible: query.isVisible,
      deleted: query.deleted,
      page,
      limit,
      sortBy: query.sortBy ?? 'name',
      sortOrder: query.sortOrder ?? 'asc',
    });
    return {
      data: result.data.map((b: any) => this.toResponse(b)),
      meta: result.meta,
    };
  }

  async findById(id: string) {
    return this.cache.getOrSet(
      `brand:${id}`,
      () => this.computeFindById(id),
      300,
    );
  }

  private async computeFindById(id: string) {
    const brand = await this.brandsRepository.findById(id);
    if (!brand || brand.deletedAt)
      throw new BusinessException('Brand not found', 'BRAND_001');
    return this.toResponse(brand);
  }

  private async generateUniqueSlug(
    name: string,
    excludeId?: string,
  ): Promise<string> {
    let slug = SlugGenerator.generate(name);
    let existing = await this.brandsRepository.findBySlug(slug);
    let counter = 1;
    while (existing && existing.id !== excludeId) {
      slug = `${SlugGenerator.generate(name)}-${counter}`;
      existing = await this.brandsRepository.findBySlug(slug);
      counter++;
    }
    return slug;
  }

  async create(dto: CreateBrandDto, userId: string) {
    dto.name = sanitizePlainText(dto.name);
    if (dto.description) dto.description = sanitizePlainText(dto.description);
    const slug = await this.generateUniqueSlug(dto.slug || dto.name);
    const brand = await this.brandsRepository.create({
      name: dto.name,
      slug,
      description: dto.description,
      logo: dto.logo,
      bannerImage: dto.bannerImage,
      website: dto.website,
      displayOrder: dto.displayOrder ?? 0,
      isFeatured: dto.isFeatured ?? true,
      isVisible: dto.isVisible ?? true,
      status: dto.status ?? 'ACTIVE',
      seoTitle: dto.seoTitle,
      seoDescription: dto.seoDescription,
      seoKeywords: dto.seoKeywords,
      createdBy: userId,
    });
    await this.auditService.log({
      action: 'BRAND_CREATED',
      module: 'brands',
      resource: 'brand',
      resourceId: brand.id,
      userId,
      newValue: { name: dto.name, slug },
    });
    this.loggerService.log(
      { action: 'brand_created', brandId: brand.id, name: dto.name },
      'BrandsService',
    );
    // ponytail: invalidate brand cache on any mutation
    await this.cache.delPattern('brand:*');
    this.eventEmitter.emit('cache.invalidate.all.details');
    return this.findById(brand.id);
  }

  async update(id: string, dto: UpdateBrandDto, userId: string) {
    if (dto.name) dto.name = sanitizePlainText(dto.name);
    if (dto.description) dto.description = sanitizePlainText(dto.description);
    const brand = await this.brandsRepository.findById(id);
    if (!brand || brand.deletedAt)
      throw new BusinessException('Brand not found', 'BRAND_001');
    const updateData: any = { ...dto, updatedBy: userId };
    if (dto.slug) {
      updateData.slug = await this.generateUniqueSlug(dto.slug, id);
    } else if (dto.name) {
      updateData.slug = await this.generateUniqueSlug(dto.name, id);
    }
    await this.brandsRepository.update(id, updateData);
    await this.auditService.log({
      action: 'BRAND_UPDATED',
      module: 'brands',
      resource: 'brand',
      resourceId: id,
      userId,
      oldValue: { name: brand.name },
      newValue: { ...dto },
    });
    this.loggerService.log(
      { action: 'brand_updated', brandId: id },
      'BrandsService',
    );
    await this.cache.delPattern('brand:*');
    this.eventEmitter.emit('cache.invalidate.all.details');
    return this.findById(id);
  }

  async delete(id: string, userId: string) {
    const brand = await this.brandsRepository.findById(id);
    if (!brand || brand.deletedAt)
      throw new BusinessException('Brand not found', 'BRAND_001');
    await this.brandsRepository.softDelete(id);
    await this.auditService.log({
      action: 'BRAND_DELETED',
      module: 'brands',
      resource: 'brand',
      resourceId: id,
      userId,
      oldValue: { name: brand.name },
    });
    this.loggerService.log(
      { action: 'brand_deleted', brandId: id },
      'BrandsService',
    );
    await this.cache.delPattern('brand:*');
    this.eventEmitter.emit('cache.invalidate.all.details');
  }

  async restore(id: string, userId: string) {
    const brand = await this.brandsRepository.findById(id);
    if (!brand) throw new BusinessException('Brand not found', 'BRAND_001');
    if (!brand.deletedAt)
      throw new BusinessException('Brand is not deleted', 'BRAND_002');
    await this.brandsRepository.restore(id);
    await this.auditService.log({
      action: 'BRAND_RESTORED',
      module: 'brands',
      resource: 'brand',
      resourceId: id,
      userId,
    });
    this.loggerService.log(
      { action: 'brand_restored', brandId: id },
      'BrandsService',
    );
    await this.cache.delPattern('brand:*');
    this.eventEmitter.emit('cache.invalidate.all.details');
    return this.findById(id);
  }

  async bulk(
    dto: { ids: string[]; action: string },
    userId: string,
  ): Promise<BulkOperationResult> {
    const actionMap: Record<string, (id: string) => Promise<any>> = {
      delete: (id) => this.delete(id, userId).then(() => ({ id })),
      restore: (id) => this.restore(id, userId).then((r) => ({ id: r.id })),
    };
    const result = await runBulkOperation(dto.ids, actionMap, dto.action);
    if (result.successCount > 0) {
      await this.auditService.log({
        action: `BRAND_BULK_${dto.action.toUpperCase()}`,
        module: 'brands',
        resource: 'brand',
        userId,
        metadata: {
          action: dto.action,
          successCount: result.successCount,
          failureCount: result.failureCount,
          ids: dto.ids,
        },
      });
    }
    return result;
  }
}

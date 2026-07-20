import { Injectable } from '@nestjs/common';
import { LoggerService } from '@common/logger/logger.service';
import { BusinessException } from '@common/exceptions';
import { SlugGenerator } from '@shared/commerce/commerce.utils';
import { AuditService } from '@domains/audit/audit.service';
import { AppEventEmitter } from '@common/events/event-emitter.service';
import { StorageService } from '@infrastructure/storage/storage.service';
import { CacheService } from '@infrastructure/redis/cache.service';
import * as crypto from 'crypto';
import { sanitizePlainText } from '@common/utils/sanitize';
import { CategoriesRepository } from './categories.repository';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  MoveCategoryDto,
  ReorderCategoriesDto,
  CategoryQueryDto,
  CategoryTreeNode,
} from './categories.types';
import { BulkOperationResult } from '@common/dto/bulk.dto';
import { runBulkOperation } from '@common/utils/bulk.helper';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly categoriesRepository: CategoriesRepository,
    private readonly auditService: AuditService,
    private readonly loggerService: LoggerService,
    private readonly storageService: StorageService,
    private readonly cache: CacheService,
    private readonly eventEmitter: AppEventEmitter,
  ) {}

  private async toResponse(cat: any): Promise<any> {
    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? undefined,
      icon: cat.icon ?? undefined,
      image: cat.image
        ? await this.storageService.getDisplayUrl(cat.image)
        : undefined,
      bannerImage: cat.bannerImage
        ? await this.storageService.getDisplayUrl(cat.bannerImage)
        : undefined,
      parentId: cat.parentId ?? undefined,
      level: cat.level,
      path: cat.path,
      displayOrder: cat.displayOrder,
      isFeatured: cat.isFeatured,
      isVisible: cat.isVisible,
      isMenuVisible: cat.isMenuVisible,
      seoTitle: cat.seoTitle ?? undefined,
      seoDescription: cat.seoDescription ?? undefined,
      seoKeywords: cat.seoKeywords ?? undefined,
      status: cat.status,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
      parent: cat.parent
        ? { id: cat.parent.id, name: cat.parent.name }
        : undefined,
      productCount: cat._count?.productMappings ?? 0,
    };
  }

  async findAll(query: CategoryQueryDto) {
    const key = `category:list:${JSON.stringify(query)}`;
    // ponytail: paginated list of rarely-changing catalog data; 60s TTL covers admin edits
    return this.cache.getOrSet(key, () => this.computeFindAll(query), 60);
  }

  private async computeFindAll(query: CategoryQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.categoriesRepository.findAll({
      search: query.search,
      status: query.status,
      parentId: query.parentId,
      isFeatured: query.isFeatured,
      isMenuVisible: query.isMenuVisible,
      isVisible: query.isVisible,
      deleted: query.deleted,
      page,
      limit,
      sortBy: query.sortBy ?? 'displayOrder',
      sortOrder: query.sortOrder ?? 'asc',
    });
    return {
      data: await Promise.all(result.data.map((c) => this.toResponse(c))),
      meta: result.meta,
    };
  }

  async findById(id: string) {
    return this.cache.getOrSet(
      `category:${id}`,
      () => this.computeFindById(id),
      300,
    );
  }

  private async computeFindById(id: string) {
    const cat = await this.categoriesRepository.findById(id);
    if (!cat || cat.deletedAt)
      throw new BusinessException('Category not found', 'CAT_001');
    return await this.toResponse(cat);
  }

  async findChildren(id: string) {
    const children = await this.categoriesRepository.findChildren(id);
    return await Promise.all(children.map((c) => this.toResponse(c)));
  }

  async findAncestors(id: string) {
    const cat = await this.categoriesRepository.findById(id);
    if (!cat || cat.deletedAt)
      throw new BusinessException('Category not found', 'CAT_001');
    if (!cat.path) return [];
    const ancestorIds = cat.path.split('/').filter(Boolean);
    if (!ancestorIds.length) return [];
    const ancestors = await this.categoriesRepository.findByIds(ancestorIds);
    // ponytail: preserve path order since findMany doesn't guarantee it
    const orderMap = new Map(ancestorIds.map((aid, i) => [aid, i]));
    ancestors.sort(
      (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0),
    );
    return await Promise.all(ancestors.map((a) => this.toResponse(a)));
  }

  async getTree(): Promise<CategoryTreeNode[]> {
    // ponytail: most expensive category read — toResponse fires a storage signed-URL call per node (N+1); cache absorbs all of it
    return this.cache.getOrSet('category:tree', () => this.computeTree(), 300);
  }

  private async computeTree(): Promise<CategoryTreeNode[]> {
    const all = await this.categoriesRepository.findAllActive();
    const nodes = await Promise.all(
      all.map(async (cat) => ({
        ...(await this.toResponse(cat)),
        children: [] as CategoryTreeNode[],
      })),
    );
    const map = new Map<string, CategoryTreeNode>();
    const roots: CategoryTreeNode[] = [];

    for (const node of nodes) {
      map.set(node.id, node);
    }
    for (const cat of all) {
      const node = map.get(cat.id)!;
      if (cat.parentId && map.has(cat.parentId)) {
        map.get(cat.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  }

  async getSummary() {
    return this.categoriesRepository.getSummary();
  }

  async getUploadUrl(type: 'image' | 'banner', extension: string) {
    const uuid = crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(7);
    const folder = type === 'banner' ? 'banners' : 'images';
    const filePath = `categories/${folder}/${uuid}.${extension}`;

    let contentType = 'image/jpeg';
    if (extension === 'png') contentType = 'image/png';
    else if (extension === 'webp') contentType = 'image/webp';
    else if (extension === 'gif') contentType = 'image/gif';

    const signedUrl = await this.storageService.getSignedUploadUrl(
      filePath,
      contentType,
    );

    return {
      uploadUrl: signedUrl,
      s3Key: filePath,
      url: this.storageService.getPublicUrl(filePath),
    };
  }

  private async generateUniqueSlug(
    name: string,
    excludeId?: string,
  ): Promise<string> {
    let slug = SlugGenerator.generate(name);
    let existing = await this.categoriesRepository.findBySlug(slug);
    let counter = 1;
    while (existing && existing.id !== excludeId) {
      slug = `${SlugGenerator.generate(name)}-${counter}`;
      existing = await this.categoriesRepository.findBySlug(slug);
      counter++;
    }
    return slug;
  }

  async create(dto: CreateCategoryDto, userId: string) {
    dto.name = sanitizePlainText(dto.name);
    if (dto.description) dto.description = sanitizePlainText(dto.description);
    const slug = await this.generateUniqueSlug(dto.slug || dto.name);
    let level = 0;
    let path = '';

    if (dto.parentId) {
      const parent = await this.categoriesRepository.findById(dto.parentId);
      if (!parent || parent.deletedAt)
        throw new BusinessException('Parent category not found', 'CAT_002');
      level = parent.level + 1;
    }

    const cat = await this.categoriesRepository.create({
      name: dto.name,
      slug,
      description: dto.description,
      icon: dto.icon,
      image: dto.image,
      bannerImage: dto.bannerImage,
      parentId: dto.parentId,
      level,
      displayOrder: dto.displayOrder ?? 0,
      isFeatured: dto.isFeatured ?? true,
      isVisible: dto.isVisible ?? true,
      isMenuVisible: dto.isMenuVisible ?? true,
      seoTitle: dto.seoTitle,
      seoDescription: dto.seoDescription,
      seoKeywords: dto.seoKeywords,
      status: dto.status ?? 'ACTIVE',
      createdBy: userId,
    } as any);

    // ponytail: update path after create since we need the new id
    path = dto.parentId ? `${dto.parentId}/${cat.id}` : cat.id;
    await this.categoriesRepository.update(cat.id, { path });

    await this.auditService.log({
      action: 'CATEGORY_CREATED',
      module: 'categories',
      resource: 'category',
      resourceId: cat.id,
      userId,
      newValue: { name: dto.name, slug, parentId: dto.parentId },
    });
    this.loggerService.log(
      { action: 'category_created', categoryId: cat.id, name: dto.name },
      'CategoriesService',
    );
    // ponytail: invalidate category cache on any mutation
    await this.cache.delPattern('category:*');
    this.eventEmitter.emit('cache.invalidate.all.details');
    return this.findById(cat.id);
  }

  async update(id: string, dto: UpdateCategoryDto, userId: string) {
    if (dto.name) dto.name = sanitizePlainText(dto.name);
    if (dto.description) dto.description = sanitizePlainText(dto.description);
    const cat = await this.categoriesRepository.findById(id);
    if (!cat || cat.deletedAt)
      throw new BusinessException('Category not found', 'CAT_001');

    const updateData: any = { ...dto, updatedBy: userId };
    if (dto.slug) {
      updateData.slug = await this.generateUniqueSlug(dto.slug, id);
    } else if (dto.name) {
      updateData.slug = await this.generateUniqueSlug(dto.name, id);
    }

    await this.categoriesRepository.update(id, updateData);

    await this.auditService.log({
      action: 'CATEGORY_UPDATED',
      module: 'categories',
      resource: 'category',
      resourceId: id,
      userId,
      oldValue: { name: cat.name },
      newValue: { ...dto },
    });
    this.loggerService.log(
      { action: 'category_updated', categoryId: id },
      'CategoriesService',
    );
    await this.cache.delPattern('category:*');
    this.eventEmitter.emit('cache.invalidate.all.details');
    return this.findById(id);
  }

  async move(id: string, dto: MoveCategoryDto, userId: string) {
    const cat = await this.categoriesRepository.findById(id);
    if (!cat || cat.deletedAt)
      throw new BusinessException('Category not found', 'CAT_001');
    if (id === dto.newParentId)
      throw new BusinessException('Cannot move category to itself', 'CAT_003');

    const newParent = await this.categoriesRepository.findById(dto.newParentId);
    if (!newParent || newParent.deletedAt)
      throw new BusinessException('Target parent not found', 'CAT_004');

    const oldParentId = cat.parentId;
    const newLevel = newParent.level + 1;
    const levelDiff = newLevel - cat.level;
    const newPath = `${newParent.path}/${cat.id}`.replace(/^\//, '');

    await this.categoriesRepository.update(id, {
      parentId: dto.newParentId,
      level: newLevel,
      path: newPath,
      updatedBy: userId,
    } as any);

    // ponytail: update descendants' path and level
    const descendants = await this.categoriesRepository.findDescendants(
      `${cat.path}/`,
    );
    for (const desc of descendants) {
      const descNewPath = desc.path.replace(cat.path, newPath);
      const descNewLevel = desc.level + levelDiff;
      await this.categoriesRepository.update(desc.id, {
        path: descNewPath,
        level: descNewLevel,
      });
    }

    await this.auditService.log({
      action: 'CATEGORY_MOVED',
      module: 'categories',
      resource: 'category',
      resourceId: id,
      userId,
      oldValue: { parentId: oldParentId },
      newValue: { parentId: dto.newParentId },
    });
    this.loggerService.log(
      {
        action: 'category_moved',
        categoryId: id,
        newParentId: dto.newParentId,
      },
      'CategoriesService',
    );
    await this.cache.delPattern('category:*');
    this.eventEmitter.emit('cache.invalidate.all.details');
    return this.findById(id);
  }

  async reorder(dto: ReorderCategoriesDto, userId: string) {
    for (const item of dto.items) {
      await this.categoriesRepository.update(item.id, {
        displayOrder: item.displayOrder,
        updatedBy: userId,
      });
    }
    await this.auditService.log({
      action: 'CATEGORY_REORDERED',
      module: 'categories',
      resource: 'category',
      userId,
      metadata: { count: dto.items.length },
    });
    this.loggerService.log(
      { action: 'categories_reordered', count: dto.items.length },
      'CategoriesService',
    );
    await this.cache.delPattern('category:*');
    this.eventEmitter.emit('cache.invalidate.all.details');
  }

  async delete(id: string, userId: string) {
    const cat = await this.categoriesRepository.findById(id);
    if (!cat || cat.deletedAt)
      throw new BusinessException('Category not found', 'CAT_001');

    const childrenCount = await this.categoriesRepository.countByParentId(id);
    // ponytail: prevent deletion if children exist — force reassign first
    if (childrenCount > 0)
      throw new BusinessException(
        'Category has children. Move or delete them first.',
        'CAT_005',
      );

    await this.categoriesRepository.softDelete(id);

    await this.auditService.log({
      action: 'CATEGORY_DELETED',
      module: 'categories',
      resource: 'category',
      resourceId: id,
      userId,
      oldValue: { name: cat.name },
    });
    this.loggerService.log(
      { action: 'category_deleted', categoryId: id },
      'CategoriesService',
    );
    await this.cache.delPattern('category:*');
    this.eventEmitter.emit('cache.invalidate.all.details');
  }

  async restore(id: string, userId: string) {
    const cat = await this.categoriesRepository.findById(id);
    if (!cat) throw new BusinessException('Category not found', 'CAT_001');
    if (!cat.deletedAt)
      throw new BusinessException('Category is not deleted', 'CAT_006');

    if (cat.parentId) {
      const parent = await this.categoriesRepository.findById(cat.parentId);
      if (!parent || parent.deletedAt)
        throw new BusinessException(
          'Parent category is deleted. Restore parent first.',
          'CAT_007',
        );
    }

    await this.categoriesRepository.restore(id);

    await this.auditService.log({
      action: 'CATEGORY_RESTORED',
      module: 'categories',
      resource: 'category',
      resourceId: id,
      userId,
    });
    this.loggerService.log(
      { action: 'category_restored', categoryId: id },
      'CategoriesService',
    );
    await this.cache.delPattern('category:*');
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
        action: `CATEGORY_BULK_${dto.action.toUpperCase()}`,
        module: 'categories',
        resource: 'category',
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

  async clone(id: string, userId: string): Promise<any> {
    const original = await this.categoriesRepository.findById(id);
    if (!original || original.deletedAt)
      throw new BusinessException('Category not found', 'CAT_001');

    const slug = await this.generateUniqueSlug(`${original.name}-copy`);
    const cat = await this.categoriesRepository.create({
      name: `${original.name} (Copy)`,
      slug,
      description: original.description,
      icon: original.icon,
      image: original.image,
      bannerImage: original.bannerImage,
      parentId: original.parentId,
      level: original.parentId
        ? (await this.categoriesRepository.findById(original.parentId))!.level +
          1
        : 0,
      displayOrder: 0,
      isFeatured: false,
      isVisible: original.isVisible,
      isMenuVisible: original.isMenuVisible,
      seoTitle: original.seoTitle,
      seoDescription: original.seoDescription,
      seoKeywords: original.seoKeywords,
      status: 'ACTIVE',
      createdBy: userId,
    } as any);

    const path = cat.parentId ? `${cat.parentId}/${cat.id}` : cat.id;
    await this.categoriesRepository.update(cat.id, { path });

    await this.auditService.log({
      action: 'CATEGORY_CLONED',
      module: 'categories',
      resource: 'category',
      resourceId: cat.id,
      userId,
      newValue: { clonedFrom: id, name: cat.name },
    });
    await this.cache.delPattern('category:*');
    this.eventEmitter.emit('cache.invalidate.all.details');
    return this.findById(cat.id);
  }
}

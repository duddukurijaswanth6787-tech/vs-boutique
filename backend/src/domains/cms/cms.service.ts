import { Injectable } from '@nestjs/common';
import { LoggerService } from '@common/logger/logger.service';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { AppEventEmitter } from '@common/events/event-emitter.service';
import { sanitizePlainText, sanitizeRichText } from '@common/utils/sanitize';
import { CmsRepository } from './cms.repository';
import {
  CreateBannerDto,
  UpdateBannerDto,
  BannerQueryDto,
  BannerResponse,
  CreateCmsPageDto,
  UpdateCmsPageDto,
  CmsPageQueryDto,
  CmsPageResponse,
  CreateCmsSectionDto,
  CmsSectionResponse,
} from './cms.types';

@Injectable()
export class CmsService {
  constructor(
    private readonly cmsRepository: CmsRepository,
    private readonly auditService: AuditService,
    private readonly loggerService: LoggerService,
    private readonly eventEmitter: AppEventEmitter,
  ) {}

  private toBannerResponse(b: any): BannerResponse {
    return {
      id: b.id,
      title: b.title,
      description: b.description ?? undefined,
      imageUrl: b.imageUrl,
      linkUrl: b.linkUrl ?? undefined,
      placement: b.placement,
      displayOrder: b.displayOrder,
      isActive: b.isActive,
      startDate: b.startDate ?? undefined,
      endDate: b.endDate ?? undefined,
      createdAt: b.createdAt,
    };
  }

  private toPageResponse(p: any): CmsPageResponse {
    return {
      id: p.id,
      title: p.title,
      slug: p.slug,
      content: p.content ?? undefined,
      metaTitle: p.metaTitle ?? undefined,
      metaDescription: p.metaDescription ?? undefined,
      status: p.status,
      createdAt: p.createdAt,
    };
  }

  private toSectionResponse(s: any): CmsSectionResponse {
    return {
      id: s.id,
      name: s.name,
      slug: s.slug,
      type: s.type,
      content: s.content ?? undefined,
      displayOrder: s.displayOrder,
      isActive: s.isActive,
      createdAt: s.createdAt,
    };
  }

  async findBanners(query: BannerQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.cmsRepository.findBanners({
      placement: query.placement,
      isActive: query.isActive,
      page,
      limit,
    });
    return {
      data: result.data.map((b: any) => this.toBannerResponse(b)),
      meta: result.meta,
    };
  }

  async findBannerById(id: string) {
    const banner = await this.cmsRepository.findBannerById(id);
    if (!banner || banner.deletedAt)
      throw new BusinessException('Banner not found', 'BANNER_001');
    this.eventEmitter.emit('cache.invalidate.all.details');
    return this.toBannerResponse(banner);
  }

  async createBanner(dto: CreateBannerDto, userId: string) {
    dto.title = sanitizePlainText(dto.title);
    if (dto.description) dto.description = sanitizePlainText(dto.description);
    const banner = await this.cmsRepository.createBanner({
      title: dto.title,
      description: dto.description,
      imageUrl: dto.imageUrl,
      linkUrl: dto.linkUrl,
      placement: dto.placement,
      displayOrder: dto.displayOrder ?? 0,
      isActive: dto.isActive ?? true,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      createdBy: userId,
    });
    await this.auditService.log({
      action: 'BANNER_CREATED',
      module: 'cms',
      resource: 'banner',
      resourceId: banner.id,
      userId,
      newValue: { title: dto.title, placement: dto.placement },
    });
    this.loggerService.log(
      { action: 'banner_created', bannerId: banner.id, title: dto.title },
      'CmsService',
    );
    this.eventEmitter.emit('cache.invalidate.all.details');
    return this.toBannerResponse(banner);
  }

  async updateBanner(id: string, dto: UpdateBannerDto, userId: string) {
    if (dto.title) dto.title = sanitizePlainText(dto.title);
    if (dto.description) dto.description = sanitizePlainText(dto.description);
    const banner = await this.cmsRepository.findBannerById(id);
    if (!banner || banner.deletedAt)
      throw new BusinessException('Banner not found', 'BANNER_001');
    const updateData: any = { ...dto, updatedBy: userId };
    if (dto.startDate) updateData.startDate = new Date(dto.startDate);
    if (dto.endDate) updateData.endDate = new Date(dto.endDate);
    await this.cmsRepository.updateBanner(id, updateData);
    await this.auditService.log({
      action: 'CMS_UPDATED',
      module: 'cms',
      resource: 'banner',
      resourceId: id,
      userId,
      oldValue: { title: banner.title },
      newValue: { ...dto },
    });
    this.loggerService.log(
      { action: 'banner_updated', bannerId: id },
      'CmsService',
    );
    const updated = await this.cmsRepository.findBannerById(id);
    this.eventEmitter.emit('cache.invalidate.all.details');
    return this.toBannerResponse(updated);
  }

  async deleteBanner(id: string, userId: string) {
    const banner = await this.cmsRepository.findBannerById(id);
    if (!banner || banner.deletedAt)
      throw new BusinessException('Banner not found', 'BANNER_001');
    await this.cmsRepository.updateBanner(id, {
      deletedAt: new Date(),
      isActive: false,
    });
    await this.auditService.log({
      action: 'CMS_UPDATED',
      module: 'cms',
      resource: 'banner',
      resourceId: id,
      userId,
      oldValue: { title: banner.title },
    });
    this.loggerService.log(
      { action: 'banner_deleted', bannerId: id },
      'CmsService',
    );
  }

  async restoreBanner(id: string, userId: string) {
    const banner = await this.cmsRepository.findBannerById(id);
    if (!banner) throw new BusinessException('Banner not found', 'BANNER_001');
    // ponytail: only restore if already deleted
    if (!banner.deletedAt)
      throw new BusinessException('Banner is not deleted', 'BANNER_002');
    await this.cmsRepository.updateBanner(id, {
      deletedAt: null,
      isActive: true,
    });
    await this.auditService.log({
      action: 'CMS_UPDATED',
      module: 'cms',
      resource: 'banner',
      resourceId: id,
      userId,
      newValue: { deletedAt: null },
    });
    this.loggerService.log(
      { action: 'banner_restored', bannerId: id },
      'CmsService',
    );
    const updated = await this.cmsRepository.findBannerById(id);
    this.eventEmitter.emit('cache.invalidate.all.details');
    return this.toBannerResponse(updated);
  }

  async findPages(query: CmsPageQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.cmsRepository.findPages({
      search: query.search,
      status: query.status,
      page,
      limit,
    });
    return {
      data: result.data.map((p: any) => this.toPageResponse(p)),
      meta: result.meta,
    };
  }

  async findPageBySlug(slug: string) {
    const page = await this.cmsRepository.findPageBySlug(slug);
    if (!page || page.deletedAt)
      throw new BusinessException('Page not found', 'PAGE_001');
    return this.toPageResponse(page);
  }

  async createPage(dto: CreateCmsPageDto, userId: string) {
    dto.title = sanitizePlainText(dto.title);
    if (dto.content) dto.content = sanitizeRichText(dto.content);
    if (dto.metaTitle) dto.metaTitle = sanitizePlainText(dto.metaTitle);
    if (dto.metaDescription)
      dto.metaDescription = sanitizePlainText(dto.metaDescription);
    const existing = await this.cmsRepository.findPageBySlug(dto.slug);
    if (existing)
      throw new BusinessException('Slug already exists', 'PAGE_002');
    const page = await this.cmsRepository.createPage({
      title: dto.title,
      slug: dto.slug,
      content: dto.content,
      metaTitle: dto.metaTitle,
      metaDescription: dto.metaDescription,
      status: dto.status ?? 'DRAFT',
      createdBy: userId,
    });
    await this.auditService.log({
      action: 'CMS_UPDATED',
      module: 'cms',
      resource: 'page',
      resourceId: page.id,
      userId,
      newValue: { title: dto.title, slug: dto.slug },
    });
    this.loggerService.log(
      { action: 'page_created', pageId: page.id, title: dto.title },
      'CmsService',
    );
    return this.toPageResponse(page);
  }

  async updatePage(id: string, dto: UpdateCmsPageDto, userId: string) {
    if (dto.title) dto.title = sanitizePlainText(dto.title);
    if (dto.content) dto.content = sanitizeRichText(dto.content);
    if (dto.metaTitle) dto.metaTitle = sanitizePlainText(dto.metaTitle);
    if (dto.metaDescription)
      dto.metaDescription = sanitizePlainText(dto.metaDescription);
    const existing = await this.cmsRepository.findPageById(id);
    if (!existing || existing.deletedAt)
      throw new BusinessException('Page not found', 'PAGE_001');
    const updateData: any = { ...dto, updatedBy: userId };
    if (dto.slug && dto.slug !== existing.slug) {
      const slugTaken = await this.cmsRepository.findPageBySlug(dto.slug);
      if (slugTaken && slugTaken.id !== id)
        throw new BusinessException('Slug already exists', 'PAGE_002');
    }
    await this.cmsRepository.updatePage(id, updateData);
    await this.auditService.log({
      action: 'CMS_UPDATED',
      module: 'cms',
      resource: 'page',
      resourceId: id,
      userId,
      oldValue: { title: existing.title },
      newValue: { ...dto },
    });
    this.loggerService.log(
      { action: 'page_updated', pageId: id },
      'CmsService',
    );
    const updated = await this.cmsRepository.findPageById(id);
    return this.toPageResponse(updated);
  }

  async findSections() {
    const sections = await this.cmsRepository.findSections();
    return sections.map((s: any) => this.toSectionResponse(s));
  }

  async createSection(dto: CreateCmsSectionDto, userId: string) {
    dto.name = sanitizePlainText(dto.name);
    if (dto.content) dto.content = sanitizeRichText(dto.content);
    const section = await this.cmsRepository.createSection({
      name: dto.name,
      slug: dto.slug,
      type: dto.type,
      content: dto.content,
      displayOrder: dto.displayOrder ?? 0,
      isActive: dto.isActive ?? true,
    });
    await this.auditService.log({
      action: 'CMS_UPDATED',
      module: 'cms',
      resource: 'section',
      resourceId: section.id,
      userId,
      newValue: { name: dto.name, slug: dto.slug },
    });
    this.loggerService.log(
      { action: 'section_created', sectionId: section.id, name: dto.name },
      'CmsService',
    );
    return this.toSectionResponse(section);
  }

  async cloneBanner(id: string, userId: string): Promise<any> {
    const original = await this.cmsRepository.findBannerById(id);
    if (!original || original.deletedAt)
      throw new BusinessException('Banner not found', 'CMS_001');
    const banner = await this.cmsRepository.createBanner({
      title: `${original.title} (Copy)`,
      description: original.description,
      imageUrl: original.imageUrl,
      linkUrl: original.linkUrl,
      placement: original.placement,
      displayOrder: 0,
      isActive: false,
      startDate: original.startDate,
      endDate: original.endDate,
      createdBy: userId,
    });
    await this.auditService.log({
      action: 'BANNER_CLONED',
      module: 'cms',
      resource: 'banner',
      resourceId: banner.id,
      userId,
      newValue: { clonedFrom: id, name: banner.title },
    });
    this.loggerService.log(
      { action: 'banner_cloned', bannerId: banner.id },
      'CmsService',
    );
    return this.cmsRepository.findBannerById(banner.id);
  }

  async clonePage(id: string, userId: string): Promise<any> {
    const original = await this.cmsRepository.findPageById(id);
    if (!original || original.deletedAt)
      throw new BusinessException('Page not found', 'CMS_002');
    const slug = `${original.slug}-copy-${Date.now()}`;
    const page = await this.cmsRepository.createPage({
      title: `${original.title} (Copy)`,
      slug,
      content: original.content,
      metaTitle: original.metaTitle,
      metaDescription: original.metaDescription,
      status: 'DRAFT',
      createdBy: userId,
    });
    await this.auditService.log({
      action: 'PAGE_CLONED',
      module: 'cms',
      resource: 'cmsPage',
      resourceId: page.id,
      userId,
      newValue: { clonedFrom: id, name: page.title },
    });
    this.loggerService.log(
      { action: 'page_cloned', pageId: page.id },
      'CmsService',
    );
    return this.cmsRepository.findPageById(page.id);
  }
}

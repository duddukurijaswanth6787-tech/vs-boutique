import { Injectable, Logger } from '@nestjs/common';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { CacheService } from '@infrastructure/redis/cache.service';
import { StorageService } from '@infrastructure/storage/storage.service';
import { AppEventEmitter } from '@common/events/event-emitter.service';
import { InstagramReelsRepository } from './instagram-reels.repository';
import type {
  CreateReelDto,
  UpdateReelDto,
  ReelQueryDto,
  UpdateReelStatusDto,
  ReorderReelsDto,
  AttachProductsDto,
  UploadUrlDto,
  UploadUrlResponse,
  ReelResponse,
  ReelListResponse,
  ReelAnalyticsResponse,
  ReelHistoryQueryDto,
  SystemHealthResponse,
  NotificationDto,
  ExportReelDto,
  ReelBulkActionDto,
} from './instagram-reels.types';

const CACHE_KEY_LIST = 'instagram-reels:list';
const CACHE_KEY_DETAIL = (id: string) => `instagram-reels:detail:${id}`;
const CACHE_KEY_TOPRATED = 'instagram-reels:top';
const NOTIF_PREFIX = 'instagram-reels:notifications';

@Injectable()
export class InstagramReelsService {
  private readonly logger = new Logger(InstagramReelsService.name);

  constructor(
    private readonly repository: InstagramReelsRepository,
    private readonly auditService: AuditService,
    private readonly cacheService: CacheService,
    private readonly storageService: StorageService,
    private readonly eventEmitter: AppEventEmitter,
  ) {}

  private toResponse(r: any): ReelResponse {
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description ?? undefined,
      videoUrl: r.videoUrl ?? undefined,
      thumbnailUrl: r.thumbnailUrl ?? undefined,
      duration: r.duration,
      position: r.position,
      displayOrder: r.displayOrder,
      featured: r.featured,
      autoPlay: r.autoPlay,
      muted: r.muted,
      loop: r.loop,
      status: r.status,
      visibility: r.visibility,
      startDate: r.startDate ?? undefined,
      endDate: r.endDate ?? undefined,
      viewCount: r.viewCount,
      playCount: r.playCount,
      clickCount: r.clickCount,
      createdBy: r.createdBy ?? undefined,
      updatedBy: r.updatedBy ?? undefined,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      products: r.products?.map((p: any) => ({
        id: p.id,
        productId: p.productId,
        displayOrder: p.displayOrder,
        productName: p.productName ?? p.product?.name,
        productSlug: p.productSlug ?? p.product?.slug,
        primaryImageUrl: p.product?.primaryImageUrl ?? undefined,
      })),
    };
  }

  async findAll(query: ReelQueryDto): Promise<ReelListResponse> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.repository.findAll({
      search: query.search,
      status: query.status,
      visibility: query.visibility,
      featured: query.featured,
      page,
      limit,
      sortBy: query.sortBy ?? 'displayOrder',
      sortOrder: query.sortOrder ?? 'asc',
    });
    return {
      data: result.data.map((r: any) => this.toResponse(r)),
      meta: result.meta,
    };
  }

  async findById(id: string): Promise<ReelResponse> {
    const reel = await this.repository.findById(id);
    if (!reel)
      throw new BusinessException('Instagram Reel not found', 'REEL_001');
    return this.toResponse(reel);
  }

  async findBySlug(slug: string): Promise<ReelResponse | null> {
    const reel = await this.repository.findBySlug(slug);
    if (!reel) return null;
    return this.toResponse(reel);
  }

  async findPublic(featured?: boolean): Promise<ReelResponse[]> {
    const reels = await this.repository.findPublic({ featured, limit: 50 });
    return reels.map((r: any) => this.toResponse(r));
  }

  async create(dto: CreateReelDto, userId: string): Promise<ReelResponse> {
    if (dto.slug) {
      const exists = await this.repository.checkSlug(dto.slug);
      if (exists)
        throw new BusinessException('Slug already exists', 'REEL_002');
    }

    const data: any = {
      name: dto.name,
      slug:
        dto.slug ??
        dto.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, ''),
      description: dto.description,
      videoUrl: dto.videoUrl,
      thumbnailUrl: dto.thumbnailUrl,
      duration: dto.duration ?? 0,
      position: dto.position ?? 0,
      displayOrder:
        dto.displayOrder ?? (await this.repository.getMaxDisplayOrder()) + 1,
      featured: dto.featured ?? false,
      autoPlay: dto.autoPlay ?? true,
      muted: dto.muted ?? true,
      loop: dto.loop ?? true,
      status: dto.status ?? 'DRAFT',
      visibility: dto.visibility ?? 'PUBLIC',
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      createdBy: userId,
    };

    const reel = await this.repository.create(data);
    await this.auditService.log({
      action: 'REEL_CREATED',
      module: 'instagram-reels',
      resource: 'InstagramReel',
      resourceId: reel.id,
      userId,
    });
    this.eventEmitter.emit('reel.created', { reelId: reel.id });
    this.eventEmitter.emit('cache.invalidate.all.details');
    await this.cacheService.del(CACHE_KEY_LIST);
    return this.toResponse(reel);
  }

  async update(
    id: string,
    dto: UpdateReelDto,
    userId: string,
  ): Promise<ReelResponse> {
    const existing = await this.repository.findById(id);
    if (!existing)
      throw new BusinessException('Instagram Reel not found', 'REEL_001');

    if (dto.slug && dto.slug !== existing.slug) {
      const slugExists = await this.repository.checkSlug(dto.slug, id);
      if (slugExists)
        throw new BusinessException('Slug already exists', 'REEL_002');
    }

    const data: any = {};
    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined) {
        if (key === 'startDate' || key === 'endDate') {
          data[key] = value ? new Date(value as string) : null;
        } else {
          data[key] = value;
        }
      }
    }
    data.updatedBy = userId;

    const reel = await this.repository.update(id, data);
    await this.auditService.log({
      action: 'REEL_UPDATED',
      module: 'instagram-reels',
      resource: 'InstagramReel',
      resourceId: id,
      userId,
    });
    this.eventEmitter.emit('reel.updated', { reelId: id });
    this.eventEmitter.emit('cache.invalidate.all.details');
    await this.cacheService.del(CACHE_KEY_LIST);
    await this.cacheService.del(CACHE_KEY_DETAIL(id));
    return this.toResponse(reel);
  }

  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing)
      throw new BusinessException('Instagram Reel not found', 'REEL_001');

    await this.repository.softDelete(id);
    await this.auditService.log({
      action: 'REEL_DELETED',
      module: 'instagram-reels',
      resource: 'InstagramReel',
      resourceId: id,
      userId,
    });
    this.eventEmitter.emit('reel.deleted', { reelId: id });
    this.eventEmitter.emit('cache.invalidate.all.details');
    await this.cacheService.del(CACHE_KEY_LIST);
    await this.cacheService.del(CACHE_KEY_DETAIL(id));
  }

  async duplicate(id: string, userId: string): Promise<ReelResponse> {
    const existing = await this.repository.findById(id);
    if (!existing)
      throw new BusinessException('Instagram Reel not found', 'REEL_001');

    // ponytail: sequential uniqueness loop — at most 2 iterations for normal use
    let newSlug = `${existing.slug}-copy`;
    let counter = 1;
    while (await this.repository.checkSlug(newSlug)) {
      counter++;
      newSlug = `${existing.slug}-copy-${counter}`;
    }
    const data: any = {
      name: `${existing.name} (Copy)`,
      slug: newSlug,
      description: existing.description,
      videoUrl: existing.videoUrl,
      thumbnailUrl: existing.thumbnailUrl,
      duration: existing.duration,
      position: existing.position,
      displayOrder: (await this.repository.getMaxDisplayOrder()) + 1,
      featured: false,
      autoPlay: existing.autoPlay,
      muted: existing.muted,
      loop: existing.loop,
      status: 'DRAFT',
      visibility: existing.visibility,
      createdBy: userId,
    };

    const reel = await this.repository.create(data);
    await this.auditService.log({
      action: 'REEL_CLONED',
      module: 'instagram-reels',
      resource: 'InstagramReel',
      resourceId: reel.id,
      userId,
    });
    this.eventEmitter.emit('reel.created', { reelId: reel.id });
    this.eventEmitter.emit('cache.invalidate.all.details');
    await this.cacheService.del(CACHE_KEY_LIST);
    return this.toResponse(reel);
  }

  async updateStatus(
    id: string,
    dto: UpdateReelStatusDto,
    userId: string,
  ): Promise<ReelResponse> {
    const existing = await this.repository.findById(id);
    if (!existing)
      throw new BusinessException('Instagram Reel not found', 'REEL_001');

    const reel = await this.repository.update(id, {
      status: dto.status,
      updatedBy: userId,
    });
    const action =
      dto.status === 'PUBLISHED'
        ? 'REEL_PUBLISHED'
        : dto.status === 'ARCHIVED'
          ? 'REEL_UNPUBLISHED'
          : 'REEL_STATUS_CHANGED';
    await this.auditService.log({
      action,
      module: 'instagram-reels',
      resource: 'InstagramReel',
      resourceId: id,
      userId,
    });
    this.eventEmitter.emit(
      `reel.${dto.status === 'PUBLISHED' ? 'published' : 'unpublished'}`,
      { reelId: id },
    );
    await this.cacheService.del(CACHE_KEY_LIST);
    await this.cacheService.del(CACHE_KEY_DETAIL(id));
    return this.toResponse(reel);
  }

  async reorder(dto: ReorderReelsDto, userId: string): Promise<void> {
    await Promise.all(
      dto.items.map((item) =>
        this.repository.update(item.id, {
          displayOrder: item.displayOrder,
          updatedBy: userId,
        }),
      ),
    );
    await this.auditService.log({
      action: 'REEL_REORDERED',
      module: 'instagram-reels',
      resource: 'InstagramReel',
      resourceId: 'bulk',
      userId,
    });
    await this.cacheService.del(CACHE_KEY_LIST);
  }

  async attachProducts(
    id: string,
    dto: AttachProductsDto,
    userId: string,
  ): Promise<ReelResponse> {
    const existing = await this.repository.findById(id);
    if (!existing)
      throw new BusinessException('Instagram Reel not found', 'REEL_001');

    await this.repository.attachProducts(id, dto.productIds);
    await this.auditService.log({
      action: 'REEL_PRODUCTS_ATTACHED',
      module: 'instagram-reels',
      resource: 'InstagramReel',
      resourceId: id,
      userId,
    });
    this.eventEmitter.emit('reel.products.attached', {
      reelId: id,
      productIds: dto.productIds,
    });
    await this.cacheService.del(CACHE_KEY_DETAIL(id));
    return this.findById(id);
  }

  async removeProduct(
    reelId: string,
    productId: string,
    userId: string,
  ): Promise<ReelResponse> {
    await this.repository.removeProduct(reelId, productId);
    await this.auditService.log({
      action: 'REEL_PRODUCTS_REMOVED',
      module: 'instagram-reels',
      resource: 'InstagramReel',
      resourceId: reelId,
      userId,
    });
    await this.cacheService.del(CACHE_KEY_DETAIL(reelId));
    return this.findById(reelId);
  }

  async getAnalytics(id: string): Promise<ReelAnalyticsResponse> {
    const existing = await this.repository.findById(id);
    if (!existing)
      throw new BusinessException('Instagram Reel not found', 'REEL_001');
    return this.repository.getAnalytics(id);
  }

  async getUploadUrl(dto: UploadUrlDto): Promise<UploadUrlResponse> {
    const uuid = crypto.randomUUID();
    const folder = dto.type === 'thumbnail' ? 'thumbnails' : 'videos';
    const extension =
      dto.extension === 'mov'
        ? 'mov'
        : dto.extension === 'webm'
          ? 'webm'
          : 'mp4';
    const filePath = `instagram-reels/${folder}/${uuid}.${extension}`;
    const contentType =
      extension === 'mov'
        ? 'video/quicktime'
        : extension === 'webm'
          ? 'video/webm'
          : 'video/mp4';
    const url = await this.storageService.getSignedUploadUrl(
      filePath,
      contentType,
    );
    return { url, filePath };
  }

  // ── Audit History ────────────────────────────────────────────────
  async getHistory(id: string, query: ReelHistoryQueryDto) {
    return this.auditService.findAll({
      module: 'instagram-reels',
      resourceId: id,
      action: query.action,
      userId: query.userId,
      search: query.search,
      startDate: query.startDate,
      endDate: query.endDate,
      page: query.page,
      limit: query.limit,
    });
  }

  // ── Cache Management ─────────────────────────────────────────────
  async getCacheMetrics() {
    const metrics = this.cacheService.getMetrics();
    const keys = [
      CACHE_KEY_LIST,
      ...['detail:*', 'public', 'analytics:*', 'top'].map(
        (k) => `instagram-reels:${k}`,
      ),
    ];
    return { metrics, keys };
  }

  async refreshCache(userId: string) {
    await this.cacheService.delPattern('instagram-reels:*');
    this.cacheService.resetMetrics();
    await this.auditService.log({
      action: 'CACHE_REFRESHED',
      module: 'instagram-reels',
      resource: 'InstagramReel',
      resourceId: 'cache',
      userId,
    });
  }

  async invalidateCache(userId: string) {
    await this.cacheService.delPattern('instagram-reels:*');
    await this.auditService.log({
      action: 'CACHE_INVALIDATED',
      module: 'instagram-reels',
      resource: 'InstagramReel',
      resourceId: 'cache',
      userId,
    });
  }

  // ── System Health ─────────────────────────────────────────────────
  async getSystemHealth(): Promise<SystemHealthResponse> {
    const cacheMetrics = this.cacheService.getMetrics();
    const storageStatus = { status: 'unknown', details: undefined as any };
    try {
      storageStatus.details = await this.storageService.healthCheck();
      storageStatus.status = 'healthy';
    } catch {
      storageStatus.status = 'unhealthy';
    }
    return {
      cache: { status: 'healthy', metrics: cacheMetrics },
      storage: storageStatus,
      queue: { status: 'healthy' },
      scheduler: { status: 'active', lastRun: undefined },
    };
  }

  // ── Notifications ─────────────────────────────────────────────────
  private async addNotification(dto: {
    type: string;
    title: string;
    message?: string;
    level: string;
  }) {
    // ponytail: Redis list of recent notifications, TTL 7 days
    const key = `${NOTIF_PREFIX}:list`;
    const notif = {
      id: crypto.randomUUID(),
      ...dto,
      createdAt: new Date().toISOString(),
      read: false,
    };
    const list = (await this.cacheService.get<NotificationDto[]>(key)) || [];
    list.unshift(notif);
    if (list.length > 50) list.length = 50;
    await this.cacheService.set(key, list, 604800);
    return notif;
  }

  async getNotifications(): Promise<NotificationDto[]> {
    return (
      (await this.cacheService.get<NotificationDto[]>(
        `${NOTIF_PREFIX}:list`,
      )) || []
    );
  }

  async dismissNotification(id: string) {
    const key = `${NOTIF_PREFIX}:list`;
    const list = (await this.cacheService.get<NotificationDto[]>(key)) || [];
    const idx = list.findIndex((n) => n.id === id);
    if (idx !== -1) {
      list[idx].read = true;
      await this.cacheService.set(key, list, 604800);
    }
  }

  async clearNotifications() {
    await this.cacheService.del(`${NOTIF_PREFIX}:list`);
  }

  // ── Export ────────────────────────────────────────────────────────
  async exportReels(query: ExportReelDto, _format: 'csv' | 'excel') {
    void _format; // ponytail: CSV only; Excel via report-export worker
    const reels = await this.repository.findAllForExport(query);
    const csvHeader =
      'id,name,slug,status,visibility,viewCount,playCount,clickCount,createdAt,updatedAt\n';
    const csvRows = reels.map(
      (r) =>
        `${r.id},${r.name},${r.slug},${r.status},${r.visibility},${r.viewCount},${r.playCount},${r.clickCount},${String(r.createdAt)},${String(r.updatedAt)}`,
    );
    const csvString = csvHeader + csvRows.join('\n');
    const buffer = Buffer.from(csvString, 'utf-8');
    const filename = `reels_export_${Date.now()}.csv`;
    const result = await this.storageService.upload(buffer, {
      originalName: filename,
      mimeType: 'text/csv',
      folder: `exports/reels`,
    });
    return { url: result.key, filename };
  }

  // ── Bulk Operations ───────────────────────────────────────────────
  async bulkOperation(dto: ReelBulkActionDto, userId: string) {
    const results = { succeeded: 0, failed: 0, errors: [] as string[] };
    for (const id of dto.ids) {
      try {
        if (dto.action === 'publish') {
          await this.updateStatus(id, { status: 'PUBLISHED' as any }, userId);
        } else if (dto.action === 'archive') {
          await this.updateStatus(id, { status: 'ARCHIVED' as any }, userId);
        } else if (dto.action === 'duplicate') {
          await this.duplicate(id, userId);
        } else if (dto.action === 'delete') {
          await this.delete(id, userId);
        }
        results.succeeded++;
      } catch (e: any) {
        results.failed++;
        results.errors.push(`${id}: ${e.message}`);
      }
    }
    await this.auditService.log({
      action: `REEL_BULK_${dto.action.toUpperCase()}`,
      module: 'instagram-reels',
      resource: 'InstagramReel',
      resourceId: 'bulk',
      userId,
      metadata: {
        ids: dto.ids,
        succeeded: results.succeeded,
        failed: results.failed,
      },
    });
    return results;
  }

  // ── Scheduler (called by BullMQ worker) ───────────────────────────
  async runScheduler(): Promise<{
    published: number;
    archived: number;
    expired: number;
  }> {
    const { toPublish, toArchive, toExpire } =
      await this.repository.findForScheduler();
    for (const reel of toPublish) {
      await this.repository.update(reel.id, { status: 'PUBLISHED' });
      this.logger.log(`Scheduler: PUBLISHED ${reel.name} (${reel.id})`);
    }
    for (const reel of toArchive) {
      await this.repository.update(reel.id, { status: 'ARCHIVED' });
      this.logger.log(`Scheduler: ARCHIVED ${reel.name} (${reel.id})`);
    }
    for (const reel of toExpire) {
      await this.repository.update(reel.id, { status: 'ARCHIVED' });
      this.logger.log(`Scheduler: EXPIRED ${reel.name} (${reel.id})`);
    }
    if (toPublish.length || toArchive.length || toExpire.length) {
      await this.cacheService.delPattern('instagram-reels:*');
      this.logger.warn(
        `Scheduler: ${toPublish.length} published, ${toArchive.length} archived, ${toExpire.length} expired`,
      );
    }
    return {
      published: toPublish.length,
      archived: toArchive.length + toExpire.length,
      expired: toExpire.length,
    };
  }

  // ── Video Metadata Extraction ─────────────────────────────────────
  // ponytail: calls ffprobe via child_process; if unavailable, stores nulls
  async processVideoMetadata(id: string): Promise<Record<string, any>> {
    const reel = await this.repository.findById(id);
    if (!reel || !reel.videoUrl)
      throw new BusinessException('No video URL', 'REEL_003');
    const storagePath = reel.videoUrl.replace(/^https?:\/\/[^/]+\//, '');
    let metadata: Record<string, any> = {
      extractedAt: new Date().toISOString(),
    };
    try {
      const { execSync } = await import('child_process');
      const output = execSync(
        `ffprobe -v quiet -print_format json -show_format -show_streams "${storagePath}"`,
        { timeout: 10000, windowsHide: true },
      ).toString();
      const info = JSON.parse(output);
      const videoStream = info.streams?.find(
        (s: any) => s.codec_type === 'video',
      );
      const audioStream = info.streams?.find(
        (s: any) => s.codec_type === 'audio',
      );
      metadata = {
        ...metadata,
        duration: info.format?.duration
          ? parseFloat(info.format.duration)
          : null,
        width: videoStream?.width ?? null,
        height: videoStream?.height ?? null,
        aspectRatio:
          videoStream?.width && videoStream?.height
            ? `${videoStream.width}:${videoStream.height}`
            : null,
        fps: videoStream?.r_frame_rate
          ? (() => {
              const p = videoStream.r_frame_rate.split('/').map(Number);
              return p[1] ? p[0] / p[1] : p[0];
            })()
          : null,
        codec: videoStream?.codec_name ?? null,
        bitrate: info.format?.bit_rate
          ? parseInt(info.format.bit_rate, 10)
          : null,
        fileSize: info.format?.size ? parseInt(info.format.size, 10) : null,
        orientation:
          videoStream?.side_data_list?.find((sd: any) => sd.rotation)
            ?.rotation ?? 0,
        audioCodec: audioStream?.codec_name ?? null,
      };
    } catch {
      this.logger.warn(
        `ffprobe not available or failed for reel ${id}; storing minimal metadata`,
      );
    }
    await this.repository.updateVideoMetadata(id, metadata);
    return metadata;
  }

  // ── Media Health Check ────────────────────────────────────────────
  async runMediaHealthCheck(): Promise<{
    checked: number;
    brokenVideos: number;
    brokenThumbnails: number;
    ok: number;
  }> {
    const all = await this.repository.findAll({ page: 1, limit: 1000 });
    let brokenVideos = 0;
    let brokenThumbnails = 0;
    let checked = 0;
    for (const reel of all.data) {
      checked++;
      if (reel.videoUrl) {
        const path = reel.videoUrl.replace(/^https?:\/\/[^/]+\//, '');
        const exists = await this.storageService
          .exists(path)
          .catch(() => false);
        if (!exists) brokenVideos++;
      }
      if (reel.thumbnailUrl) {
        const path = reel.thumbnailUrl.replace(/^https?:\/\/[^/]+\//, '');
        const exists = await this.storageService
          .exists(path)
          .catch(() => false);
        if (!exists) brokenThumbnails++;
      }
    }
    if (brokenVideos || brokenThumbnails) {
      await this.addNotification({
        type: 'media_health',
        title: 'Media Health Check',
        message: `${brokenVideos} broken videos, ${brokenThumbnails} broken thumbnails found`,
        level: 'warning',
      });
    }
    return {
      checked,
      brokenVideos,
      brokenThumbnails,
      ok: checked - brokenVideos - brokenThumbnails,
    };
  }

  // ── Storage Cleanup ────────────────────────────────────────────────
  async runStorageCleanup(dryRun = true): Promise<{
    dryRun: boolean;
    deleted: number;
    freedBytes: number;
    details: string[];
  }> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const reels = await this.repository.findDeletedSince(sevenDaysAgo);
    const details: string[] = [];
    let freedBytes = 0;
    for (const reel of reels) {
      for (const field of ['videoUrl', 'thumbnailUrl'] as const) {
        const url = reel[field];
        if (url) {
          const path = url.replace(/^https?:\/\/[^/]+\//, '');
          if (!dryRun) {
            await this.storageService.delete(path).catch(() => {});
          }
          details.push(`${dryRun ? '[DRY RUN]' : '[DELETED]'} ${path}`);
          freedBytes++;
        }
      }
    }
    return { dryRun, deleted: details.length, freedBytes, details };
  }

  // ── Top Reels ─────────────────────────────────────────────────────
  async getTopReels(limit = 10) {
    return this.cacheService.getOrSet(
      CACHE_KEY_TOPRATED,
      () => this.repository.getTopReels(limit),
      300,
    );
  }
}

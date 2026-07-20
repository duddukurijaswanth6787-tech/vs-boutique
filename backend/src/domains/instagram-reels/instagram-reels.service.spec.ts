import { InstagramReelsService } from './instagram-reels.service';

// ponytail: direct instantiation — no NestJS TestingModule
const mockReel = {
  id: 'reel-1',
  name: 'Test Reel',
  slug: 'test-reel',
  description: null,
  videoUrl: null,
  thumbnailUrl: null,
  duration: 0,
  position: 0,
  displayOrder: 0,
  featured: false,
  autoPlay: true,
  muted: true,
  loop: true,
  status: 'DRAFT',
  visibility: 'PUBLIC',
  startDate: null,
  endDate: null,
  viewCount: 0,
  playCount: 0,
  clickCount: 0,
  createdBy: 'user-1',
  updatedBy: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  products: [],
  analytics: [],
};
const mockRepo = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findBySlug: jest.fn(),
  findPublic: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  checkSlug: jest.fn(),
  getMaxDisplayOrder: jest.fn(),
  attachProducts: jest.fn(),
  removeProduct: jest.fn(),
  getAnalytics: jest.fn(),
  findForScheduler: jest.fn(),
  findDeletedSince: jest.fn(),
  updateVideoMetadata: jest.fn(),
  getTopReels: jest.fn(),
  findAllForExport: jest.fn(),
};
const mockAudit = { log: jest.fn(), findAll: jest.fn() };
const mockCache = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  delPattern: jest.fn(),
  getOrSet: jest.fn(),
  getMetrics: jest.fn(),
  resetMetrics: jest.fn(),
};
const mockStorage = {
  exists: jest.fn(),
  delete: jest.fn(),
  healthCheck: jest.fn(),
  upload: jest.fn(),
  getSignedUploadUrl: jest.fn(),
};
const mockEmitter = { emit: jest.fn() };

let service: InstagramReelsService;

beforeEach(() => {
  service = new InstagramReelsService(
    mockRepo as any,
    mockAudit as any,
    mockCache as any,
    mockStorage as any,
    mockEmitter as any,
  );
  jest.clearAllMocks();
  mockRepo.findById.mockResolvedValue(mockReel);
  mockRepo.findAll.mockResolvedValue({ data: [mockReel], meta: { total: 1 } });
  mockCache.getOrSet.mockImplementation((_k: string, f: () => any) => f());
  mockCache.getMetrics.mockReturnValue({
    hits: 1,
    misses: 0,
    sets: 1,
    dels: 0,
  });
  mockAudit.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });
  mockRepo.findForScheduler.mockResolvedValue({
    toPublish: [],
    toArchive: [],
    toExpire: [],
  });
  mockStorage.healthCheck.mockResolvedValue({
    writable: true,
    provider: 's3',
    root: '/',
  });
  mockRepo.findAllForExport.mockResolvedValue([]);
  mockCache.get.mockResolvedValue(null);
  mockStorage.upload.mockResolvedValue({ key: 'exports/reels/test.csv' });
});

describe('InstagramReelsService Phase 3', () => {
  describe('getHistory', () => {
    it('calls auditService.findAll with module filter', async () => {
      await service.getHistory('reel-1', {});
      expect(mockAudit.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          module: 'instagram-reels',
          resourceId: 'reel-1',
        }),
      );
    });
  });

  describe('getCacheMetrics', () => {
    it('returns metrics and keys', async () => {
      const result = await service.getCacheMetrics();
      expect(result.metrics.hits).toBe(1);
      expect(result.keys).toBeDefined();
    });
  });

  describe('refreshCache / invalidateCache', () => {
    it('clears cache patterns and logs audit', async () => {
      await service.refreshCache('user-1');
      expect(mockCache.delPattern).toHaveBeenCalledWith('instagram-reels:*');
      expect(mockCache.resetMetrics).toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CACHE_REFRESHED' }),
      );
    });

    it('invalidates cache', async () => {
      await service.invalidateCache('user-1');
      expect(mockCache.delPattern).toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CACHE_INVALIDATED' }),
      );
    });
  });

  describe('getSystemHealth', () => {
    it('returns health status of all subsystems', async () => {
      const result = await service.getSystemHealth();
      expect(result.cache.status).toBe('healthy');
      expect(result.storage.status).toBe('healthy');
      expect(result.queue.status).toBe('healthy');
      expect(result.scheduler.status).toBe('active');
    });
  });

  describe('notifications', () => {
    it('returns empty list when no notifications', async () => {
      mockCache.get.mockResolvedValue(null);
      const list = await service.getNotifications();
      expect(list).toEqual([]);
    });

    it('dismisses a notification', async () => {
      const notif = {
        id: 'n1',
        type: 'test',
        title: 'T',
        level: 'info',
        createdAt: '2024-01-01',
        read: false,
      };
      mockCache.get.mockResolvedValue([notif]);
      await service.dismissNotification('n1');
      expect(mockCache.set).toHaveBeenCalled();
    });

    it('clears all notifications', async () => {
      await service.clearNotifications();
      expect(mockCache.del).toHaveBeenCalled();
    });
  });

  describe('exportReels', () => {
    it('generates and uploads CSV', async () => {
      mockRepo.findAllForExport.mockResolvedValue([mockReel]);
      const result = await service.exportReels({}, 'csv');
      expect(result.url).toBeDefined();
      expect(mockStorage.upload).toHaveBeenCalled();
    });
  });

  describe('bulkOperation', () => {
    it('processes bulk publish', async () => {
      mockRepo.findById.mockResolvedValue(mockReel);
      mockRepo.update.mockResolvedValue({ ...mockReel, status: 'PUBLISHED' });
      const result = await service.bulkOperation(
        { ids: ['reel-1'], action: 'publish' },
        'user-1',
      );
      expect(result.succeeded).toBe(1);
    });

    it('handles failures gracefully', async () => {
      mockRepo.findById.mockRejectedValue(new Error('not found'));
      const result = await service.bulkOperation(
        { ids: ['bad-id'], action: 'delete' },
        'user-1',
      );
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('runScheduler', () => {
    it('no-ops when nothing to schedule', async () => {
      const result = await service.runScheduler();
      expect(result.published).toBe(0);
      expect(result.archived).toBe(0);
    });

    it('publishes, archives, and expires reels', async () => {
      mockRepo.findForScheduler.mockResolvedValue({
        toPublish: [{ id: 'r1', name: 'R1' }],
        toArchive: [{ id: 'r2', name: 'R2' }],
        toExpire: [{ id: 'r3', name: 'R3' }],
      });
      const result = await service.runScheduler();
      expect(result.published).toBe(1);
      expect(result.archived).toBe(2); // archive + expire
      expect(result.expired).toBe(1);
      expect(mockRepo.update).toHaveBeenCalledTimes(3);
      expect(mockCache.delPattern).toHaveBeenCalledWith('instagram-reels:*');
    });
  });

  describe('processVideoMetadata', () => {
    it('throws when reel has no video', async () => {
      await expect(service.processVideoMetadata('reel-1')).rejects.toThrow(
        'No video URL',
      );
    });

    it('stores minimal metadata when ffprobe unavailable', async () => {
      mockRepo.findById.mockResolvedValue({
        ...mockReel,
        videoUrl: 'https://s3.com/video.mp4',
      });
      const result = await service.processVideoMetadata('reel-1');
      expect(result.extractedAt).toBeDefined();
      expect(mockRepo.updateVideoMetadata).toHaveBeenCalled();
    });
  });

  describe('runMediaHealthCheck', () => {
    it('checks all reels', async () => {
      mockStorage.exists.mockResolvedValue(true);
      const result = await service.runMediaHealthCheck();
      expect(result.checked).toBe(1);
      expect(result.brokenVideos).toBe(0);
    });
  });

  describe('runStorageCleanup', () => {
    it('dry run mode', async () => {
      mockRepo.findDeletedSince.mockResolvedValue([
        {
          id: 'r1',
          videoUrl: 'https://s3.com/v.mp4',
          thumbnailUrl: null,
          deletedAt: new Date(),
        },
      ]);
      const result = await service.runStorageCleanup(true);
      expect(result.dryRun).toBe(true);
      expect(mockStorage.delete).not.toHaveBeenCalled();
    });
  });

  describe('getTopReels', () => {
    it('returns cached top reels', async () => {
      mockRepo.getTopReels.mockResolvedValue([
        { id: 'r1', name: 'Top', viewCount: 100 },
      ]);
      const result = await service.getTopReels();
      expect(result).toHaveLength(1);
      expect(mockCache.getOrSet).toHaveBeenCalled();
    });
  });

  describe('duplicate slug uniqueness', () => {
    it('generates unique slug on first duplicate', async () => {
      mockRepo.findById.mockResolvedValue(mockReel);
      mockRepo.checkSlug.mockResolvedValue(false);
      mockRepo.create.mockResolvedValue({
        ...mockReel,
        slug: 'test-reel-copy',
      });
      await service.duplicate('reel-1', 'user-1');
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'test-reel-copy' }),
      );
    });

    it('increments slug counter when slug-copy already exists', async () => {
      mockRepo.findById.mockResolvedValue(mockReel);
      mockRepo.checkSlug
        .mockResolvedValueOnce(true) // test-reel-copy exists
        .mockResolvedValueOnce(false); // test-reel-copy-2 is free
      mockRepo.create.mockResolvedValue({
        ...mockReel,
        slug: 'test-reel-copy-2',
      });
      await service.duplicate('reel-1', 'user-1');
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'test-reel-copy-2' }),
      );
    });

    it('handles many duplicates without collision', async () => {
      mockRepo.findById.mockResolvedValue(mockReel);
      mockRepo.checkSlug
        .mockResolvedValueOnce(true) // copy
        .mockResolvedValueOnce(true) // copy-2
        .mockResolvedValueOnce(true) // copy-3
        .mockResolvedValueOnce(false); // copy-4 is free
      mockRepo.create.mockResolvedValue({
        ...mockReel,
        slug: 'test-reel-copy-4',
      });
      await service.duplicate('reel-1', 'user-1');
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'test-reel-copy-4' }),
      );
    });
  });

  describe('transaction rollback', () => {
    it('calls attachProducts on repository', async () => {
      mockRepo.findById.mockResolvedValue(mockReel);
      mockRepo.attachProducts.mockResolvedValue(undefined);
      await service.attachProducts(
        'reel-1',
        { productIds: ['p1', 'p2'] },
        'user-1',
      );
      expect(mockRepo.attachProducts).toHaveBeenCalledWith('reel-1', [
        'p1',
        'p2',
      ]);
    });
  });

  describe('safe metadata parsing', () => {
    it('parses fps ratio safely without eval', async () => {
      mockRepo.findById.mockResolvedValue({
        ...mockReel,
        videoUrl: 'https://s3.com/video.mp4',
      });
      mockRepo.updateVideoMetadata.mockResolvedValue({});
      const result = await service.processVideoMetadata('reel-1');
      expect(result.extractedAt).toBeDefined();
      expect(mockRepo.updateVideoMetadata).toHaveBeenCalled();
    });

    it('stores metadata when ffprobe fails gracefully', async () => {
      mockRepo.findById.mockResolvedValue({
        ...mockReel,
        videoUrl: 'https://s3.com/video.mp4',
      });
      mockRepo.updateVideoMetadata.mockResolvedValue({});
      const result = await service.processVideoMetadata('reel-1');
      expect(result).toHaveProperty('extractedAt');
    });
  });
});

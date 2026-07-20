import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { CategoriesRepository } from './categories.repository';
import { AuditService } from '@domains/audit/audit.service';
import { LoggerService } from '@common/logger/logger.service';
import { StorageService } from '@infrastructure/storage/storage.service';
import { CacheService } from '@infrastructure/redis/cache.service';
import { AppEventEmitter } from '@common/events/event-emitter.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let mockRepo: any;
  let mockAudit: any;
  let mockLogger: any;
  let mockStorage: any;
  let mockCache: any;

  beforeEach(async () => {
    mockRepo = {
      findAll: jest.fn().mockResolvedValue({ data: [], meta: {} }),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findAllActive: jest.fn().mockResolvedValue([]),
      findChildren: jest.fn().mockResolvedValue([]),
      findDescendants: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
      countByParentId: jest.fn().mockResolvedValue(0),
      getSummary: jest.fn().mockResolvedValue({
        totalCategories: 0,
        activeCategories: 0,
        activePercentage: 0,
        inactiveCategories: 0,
        inactivePercentage: 0,
        categoriesWithProducts: 0,
        categoriesWithProductsPercentage: 0,
        createdThisMonth: 0,
      }),
    };

    mockAudit = {
      log: jest.fn().mockResolvedValue(null),
    };

    mockLogger = {
      log: jest.fn(),
    };

    mockStorage = {
      getSignedUploadUrl: jest.fn().mockResolvedValue('https://signed-url.com'),
      getPublicUrl: jest.fn().mockReturnValue('https://public-url.com'),
    };

    // ponytail: stub CacheService so tests run factory logic without Redis
    mockCache = {
      getOrSet: jest.fn((_key: string, factory: () => any) => factory()),
      delPattern: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: CategoriesRepository, useValue: mockRepo },
        { provide: AuditService, useValue: mockAudit },
        { provide: LoggerService, useValue: mockLogger },
        { provide: StorageService, useValue: mockStorage },
        { provide: CacheService, useValue: mockCache },
        { provide: AppEventEmitter, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get summary stats', async () => {
    const res = await service.getSummary();
    expect(res.totalCategories).toBe(0);
    expect(mockRepo.getSummary).toHaveBeenCalled();
  });

  it('should generate signed upload URL', async () => {
    const res = await service.getUploadUrl('image', 'webp');
    expect(res.uploadUrl).toBe('https://signed-url.com');
    expect(res.url).toBe('https://public-url.com');
    expect(mockStorage.getSignedUploadUrl).toHaveBeenCalled();
  });
});

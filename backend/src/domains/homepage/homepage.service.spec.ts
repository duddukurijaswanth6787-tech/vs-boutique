import { Test, TestingModule } from '@nestjs/testing';
import { HomepageService } from './homepage.service';
import { CacheService } from '@infrastructure/redis/cache.service';
import { PrismaService } from '@database/prisma.service';
import { CategoriesService } from '@domains/categories/categories.service';
import { ProductsService } from '@domains/products/products.service';
import { BrandsService } from '@domains/brands/brands.service';
import { OfferService } from '@domains/offer/offer.service';
import { ReviewService } from '@domains/review/review.service';
import { CmsService } from '@domains/cms/cms.service';
import { InstagramReelsService } from '@domains/instagram-reels/instagram-reels.service';
import { AppSettingService } from '@domains/app-setting/app-setting.service';
import { RecentlyViewedService } from '@domains/recently-viewed/recently-viewed.service';
import { RecommendationService } from '@domains/recommendation/recommendation.service';

const makeCache = (store: Record<string, any> = {}) => {
  const s = { ...store };
  return {
    store: s,
    get: jest.fn(async (k: string) => s[k] ?? null),
    set: jest.fn(async (k: string, v: any) => {
      s[k] = v;
    }),
    del: jest.fn(async (k: string) => {
      delete s[k];
    }),
  };
};

const ok = (v: any) => ({
  findAll: jest.fn(async () => v),
  getTree: jest.fn(async () => v),
});
const fail = () => ({
  findAll: jest.fn(async () => {
    throw new Error('boom');
  }),
  getTree: jest.fn(async () => {
    throw new Error('boom');
  }),
});

const SERVICE_MAP: Record<string, any> = {
  CategoriesService,
  ProductsService,
  BrandsService,
  OfferService,
  ReviewService,
  CmsService,
  InstagramReelsService,
  AppSettingService,
  RecentlyViewedService,
  RecommendationService,
};

describe('HomepageService', () => {
  let service: HomepageService;
  let cache: ReturnType<typeof makeCache>;

  const build = async (
    overrides: Partial<Record<string, any>> = {},
    cached: Record<string, any> = {},
  ) => {
    cache = makeCache(cached);
    const providers: any[] = [
      HomepageService,
      { provide: CacheService, useValue: cache },
      { provide: PrismaService, useValue: { $queryRawUnsafe: jest.fn() } },
      { provide: CategoriesService, useValue: ok({ id: 'c1' }) },
      {
        provide: ProductsService,
        useValue: ok({ data: [{ id: 'p1', basePrice: 10 }] }),
      },
      { provide: BrandsService, useValue: ok({ data: [{ id: 'b1' }] }) },
      {
        provide: OfferService,
        useValue: { getActiveOffers: jest.fn(async () => [{ id: 'o1' }]) },
      },
      { provide: ReviewService, useValue: ok({ data: [{ id: 'r1' }] }) },
      {
        provide: CmsService,
        useValue: {
          findBanners: jest.fn(async () => ({ data: [{ id: 'bn1' }] })),
        },
      },
      {
        provide: InstagramReelsService,
        useValue: { findPublic: jest.fn(async () => [{ id: 'reel1' }]) },
      },
      {
        provide: AppSettingService,
        useValue: { getByKey: jest.fn(async () => 'x') },
      },
      {
        provide: RecentlyViewedService,
        useValue: { findAll: jest.fn(async () => ({ data: [] })) },
      },
      {
        provide: RecommendationService,
        useValue: {
          getRecommendations: jest.fn(async () => [{ id: 'rec1' }]),
        },
      },
    ];
    for (const [name, val] of Object.entries(overrides)) {
      providers.push({ provide: SERVICE_MAP[name], useValue: val });
    }
    const module: TestingModule = await Test.createTestingModule({
      providers,
    }).compile();
    service = module.get(HomepageService);
    return module;
  };

  it('aggregates all sections into typed DTOs', async () => {
    await build();
    const res = await service.getHomepage();
    expect(res.categories[0].id).toBe('c1');
    expect(res.newArrivals[0].id).toBe('p1');
    expect(res.brands[0].id).toBe('b1');
    expect(res.flashSale[0].id).toBe('o1');
    expect(res.testimonials[0].id).toBe('r1');
    expect(res.heroBanners[0].id).toBe('bn1');
    expect(res.instagramReels[0].id).toBe('reel1');
    expect(res.meta.version).toBe('v1');
    expect(Array.isArray(res.featuredCollections)).toBe(true);
  });

  it('isolates a failing section and continues', async () => {
    await build({
      CategoriesService: fail(),
      ProductsService: fail(),
    });
    const res = await service.getHomepage();
    expect(res.categories).toEqual([]);
    expect(res.newArrivals).toEqual([]);
    // unaffected sections still resolve
    expect(res.brands[0].id).toBe('b1');
  });

  it('returns cached payload on cache hit (no service calls)', async () => {
    const cached = {
      heroBanners: [{ id: 'cached' }],
      meta: { version: 'v1', generatedAt: new Date().toISOString() },
    };
    await build({}, { 'home:page': cached });
    const res = await service.getHomepage();
    expect(res).toEqual(cached);
    expect(cache.get).toHaveBeenCalledWith('home:page');
  });

  it('writes to cache on cache miss', async () => {
    await build();
    await service.getHomepage();
    expect(cache.set).toHaveBeenCalledWith(
      'home:page',
      expect.any(Object),
      300,
    );
  });

  it('handles empty database (undefined/null results → empty arrays)', async () => {
    const emptyOk = (v: any) => ({
      findAll: jest.fn(async () => v),
      getTree: jest.fn(async () => v),
    });
    await build({
      CategoriesService: emptyOk(undefined),
      ProductsService: emptyOk(undefined),
      BrandsService: emptyOk(undefined),
      OfferService: { getActiveOffers: jest.fn(async () => undefined) },
      ReviewService: emptyOk(undefined),
      CmsService: { findBanners: jest.fn(async () => undefined) },
      InstagramReelsService: { findPublic: jest.fn(async () => undefined) },
      RecentlyViewedService: { findAll: jest.fn(async () => undefined) },
    });
    const res = await service.getHomepage();
    expect(res.categories).toEqual([]);
    expect(res.newArrivals).toEqual([]);
    expect(res.brands).toEqual([]);
    expect(res.flashSale).toEqual([]);
    expect(res.testimonials).toEqual([]);
    expect(res.heroBanners).toEqual([]);
    expect(res.instagramReels).toEqual([]);
  });

  it('invalidate clears the cache key', async () => {
    await build();
    await service.invalidate();
    expect(cache.del).toHaveBeenCalledWith('home:page');
  });

  it('returns recommendations from RecommendationService (anonymous)', async () => {
    const recMock = {
      getRecommendations: jest.fn(async () => [{ id: 'rec1' }, { id: 'rec2' }]),
    };
    await build({ RecommendationService: recMock });
    const res = await service.getHomepage();
    expect(res.recommendedProducts[0].id).toBe('rec1');
    expect(res.recommendedProducts[1].id).toBe('rec2');
    expect(recMock.getRecommendations).toHaveBeenCalledWith(undefined);
  });

  it('passes userId to RecommendationService when authenticated', async () => {
    const recMock = { getRecommendations: jest.fn(async () => []) };
    await build({ RecommendationService: recMock });
    await service.getHomepage('user-123');
    expect(recMock.getRecommendations).toHaveBeenCalledWith('user-123');
  });

  it('recommendations fall back to empty array on failure', async () => {
    const recMock = {
      getRecommendations: jest.fn(async () => {
        throw new Error('down');
      }),
    };
    await build({ RecommendationService: recMock });
    const res = await service.getHomepage();
    expect(res.recommendedProducts).toEqual([]);
  });
});

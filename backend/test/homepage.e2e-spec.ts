import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Controller, Module } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { GlobalResponseInterceptor } from '@common/interceptors/global-response.interceptor';
import { HomepageController } from '@domains/homepage/homepage.controller';
import { HomepageService } from '@domains/homepage/homepage.service';
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

// ponytail: provider-overridden integration harness. Exercises the real HTTP
// pipeline (controller -> service -> GlobalResponseInterceptor) without a live
// database/redis, by swapping every downstream dependency for a fixture.

const cacheStore: Record<string, unknown> = {};
const cacheMock = {
  get: jest.fn(async (k: string) => cacheStore[k] ?? null),
  set: jest.fn(async (k: string, v: unknown) => {
    cacheStore[k] = v;
  }),
  del: jest.fn(async (k: string) => {
    delete cacheStore[k];
  }),
};

@Controller('home')
class TestHomeController extends HomepageController {}

@Module({
  controllers: [TestHomeController],
  providers: [
    HomepageService,
    CacheService,
    PrismaService,
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
  ],
})
class TestHomeModule {}

describe('Homepage API (integration)', () => {
  let app: INestApplication<App>;
  let recMock: { getRecommendations: jest.Mock };

  beforeAll(async () => {
    recMock = {
      getRecommendations: jest.fn(async () => [
        {
          id: 'rec1',
          slug: 'rec-1',
          name: 'Recommended One',
          basePrice: 20,
          isNewArrival: false,
          isBestSeller: true,
        },
      ]),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestHomeModule],
    })
      .overrideProvider(CacheService)
      .useValue(cacheMock)
      .overrideProvider(PrismaService)
      .useValue({ $queryRawUnsafe: jest.fn(async () => []) })
      .overrideProvider(CategoriesService)
      .useValue({
        getTree: jest.fn(async () => [
          { id: 'cat1', name: 'Cat', slug: 'cat' },
        ]),
      })
      .overrideProvider(ProductsService)
      .useValue({
        findAll: jest.fn(async () => ({
          data: [
            {
              id: 'p1',
              slug: 'p-1',
              name: 'Product One',
              basePrice: 10,
              brand: { id: 'b1', name: 'Brand' },
            },
            {
              id: 'p2',
              slug: 'p-2',
              name: 'Product Two',
              basePrice: 15,
              salePrice: 12,
            },
          ],
        })),
      })
      .overrideProvider(BrandsService)
      .useValue({
        findAll: jest.fn(async () => ({
          data: [{ id: 'b1', name: 'Brand', slug: 'brand' }],
        })),
      })
      .overrideProvider(OfferService)
      .useValue({
        getActiveOffers: jest.fn(async () => [
          {
            id: 'o1',
            name: 'Sale',
            type: 'percent',
            value: 10,
            startDate: new Date(),
            endDate: new Date(),
          },
        ]),
      })
      .overrideProvider(ReviewService)
      .useValue({
        findAll: jest.fn(async () => ({
          data: [
            {
              id: 'r1',
              productId: 'p1',
              rating: 5,
              title: 'Great',
              comment: 'Nice',
            },
          ],
        })),
      })
      .overrideProvider(CmsService)
      .useValue({
        findBanners: jest.fn(async () => ({
          data: [{ id: 'bn1', title: 'Hero', imageUrl: 'https://x/y.jpg' }],
        })),
      })
      .overrideProvider(InstagramReelsService)
      .useValue({
        findPublic: jest.fn(async () => [
          {
            id: 'reel1',
            name: 'Reel',
            slug: 'reel',
            thumbnailUrl: 'https://x/r.jpg',
            videoUrl: 'https://x/r.mp4',
            viewCount: 3,
          },
        ]),
      })
      .overrideProvider(AppSettingService)
      .useValue({ getByKey: jest.fn(async () => 'contact info') })
      .overrideProvider(RecentlyViewedService)
      .useValue({ findAll: jest.fn(async () => ({ data: [] })) })
      .overrideProvider(RecommendationService)
      .useValue(recMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalInterceptors(new GlobalResponseInterceptor());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const SECTION_KEYS = [
    'heroBanners',
    'categories',
    'featuredCollections',
    'newArrivals',
    'bestSellers',
    'trendingProducts',
    'instagramReels',
    'flashSale',
    'recommendedProducts',
    'recentlyViewed',
    'testimonials',
    'brands',
    'footer',
    'meta',
  ];

  it('GET /api/v1/home returns 200 with the standardized envelope', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/home')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.statusCode).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.meta).toBeDefined();
  });

  it('returns every homepage section with the correct shape', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/home');
    const data = res.body.data;

    for (const key of SECTION_KEYS) {
      expect(data[key]).toBeDefined();
    }
    for (const key of [
      'heroBanners',
      'categories',
      'featuredCollections',
      'newArrivals',
      'bestSellers',
      'trendingProducts',
      'instagramReels',
      'flashSale',
      'recommendedProducts',
      'recentlyViewed',
      'testimonials',
      'brands',
    ]) {
      expect(Array.isArray(data[key])).toBe(true);
    }
    expect(typeof data.footer).toBe('object');
    expect(typeof data.meta).toBe('object');
    expect(data.meta.version).toBe('v1');
    expect(typeof data.meta.generatedAt).toBe('string');
  });

  it('maps product cards to typed DTO fields', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/home');
    const data = res.body.data;

    expect(data.newArrivals[0].id).toBe('p1');
    expect(data.newArrivals[0].name).toBe('Product One');
    expect(data.newArrivals[0].brand.id).toBe('b1');
    expect(data.bestSellers.some((p: any) => p.salePrice === 12)).toBe(true);
    expect(data.instagramReels[0].title).toBe('Reel');
    expect(data.flashSale[0].type).toBe('percent');
    expect(data.testimonials[0].rating).toBe(5);
  });

  it('surfaces recommendations from RecommendationService', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/home');
    expect(res.body.data.recommendedProducts[0].id).toBe('rec1');
    expect(recMock.getRecommendations).toHaveBeenCalledWith(undefined);
  });

  it('writes to cache on miss and serves a cached second request', async () => {
    await request(app.getHttpServer()).get('/api/v1/home');
    const firstSetCalls = cacheMock.set.mock.calls.length;
    await request(app.getHttpServer()).get('/api/v1/home');
    // second request should be a cache hit -> no additional set
    expect(cacheMock.set.mock.calls.length).toBe(firstSetCalls);
  });

  it('is reachable anonymously (no auth header required)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/home')
      .expect(200);
    expect(Array.isArray(res.body.data.recentlyViewed)).toBe(true);
  });
});

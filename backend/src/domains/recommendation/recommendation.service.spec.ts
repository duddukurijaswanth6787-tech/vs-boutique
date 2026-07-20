import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationService } from './recommendation.service';
import { ProductsService } from '@domains/products/products.service';
import { RecentlyViewedService } from '@domains/recently-viewed/recently-viewed.service';
import { OrderService } from '@domains/order/order.service';
import { WishlistService } from '@domains/wishlist/wishlist.service';

const product = (id: string, over: any = {}) => ({
  id,
  name: `p-${id}`,
  basePrice: 100,
  salePrice: 90,
  categoryIds: ['cat-1'],
  brandId: 'brand-1',
  inStock: true,
  ...over,
});

describe('RecommendationService', () => {
  let service: RecommendationService;
  const products = {
    findById: jest.fn(),
    findAll: jest.fn(),
  };
  const recentlyViewed = { findAll: jest.fn() };
  const orders = { findByCustomerId: jest.fn() };
  const wishlist = { getItems: jest.fn() };

  const build = async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationService,
        { provide: ProductsService, useValue: products },
        { provide: RecentlyViewedService, useValue: recentlyViewed },
        { provide: OrderService, useValue: orders },
        { provide: WishlistService, useValue: wishlist },
      ],
    }).compile();
    service = module.get(RecommendationService);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    products.findAll.mockResolvedValue({ data: [product('a'), product('b')] });
    products.findById.mockResolvedValue(product('seed'));
    recentlyViewed.findAll.mockResolvedValue({ data: [] });
    orders.findByCustomerId.mockResolvedValue({ data: [] });
    wishlist.getItems.mockResolvedValue({ data: [] });
  });

  it('anonymous returns best-sellers + new-arrivals pool', async () => {
    await build();
    products.findAll
      .mockResolvedValueOnce({ data: [product('bs1'), product('bs2')] }) // bestSellers
      .mockResolvedValueOnce({ data: [product('na1')] }); // newArrivals
    const res = await service.getRecommendations();
    expect(res.length).toBeGreaterThan(0);
    expect(products.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ isBestSeller: true, isPublished: true }),
    );
  });

  it('logged-in with history returns similar-by-category products', async () => {
    await build();
    recentlyViewed.findAll.mockResolvedValue({ data: [{ productId: 'seed' }] });
    products.findById.mockResolvedValue(
      product('seed', { categoryIds: ['cat-x'] }),
    );
    products.findAll.mockResolvedValue({
      data: [product('sim1'), product('sim2')],
    });
    const res = await service.getRecommendations('user-1');
    expect(res.some((p: any) => p.id === 'sim1' || p.id === 'sim2')).toBe(true);
    expect(products.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: 'cat-x', isPublished: true }),
    );
  });

  it('no history / empty DB returns empty-safe array (no crash)', async () => {
    await build();
    products.findAll.mockResolvedValue({ data: [] });
    products.findById.mockResolvedValue(null);
    const res = await service.getRecommendations('user-2');
    expect(Array.isArray(res)).toBe(true);
  });

  it('dedupes and respects limit', async () => {
    await build();
    products.findAll
      .mockResolvedValueOnce({ data: [product('x'), product('y')] })
      .mockResolvedValueOnce({ data: [product('y'), product('z')] });
    const res = await service.getRecommendations(undefined, undefined, 2);
    const ids = res.map((p: any) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(res.length).toBeLessThanOrEqual(2);
  });

  it('excludes the current product', async () => {
    await build();
    products.findAll
      .mockResolvedValueOnce({ data: [product('cur'), product('other')] })
      .mockResolvedValueOnce({ data: [product('other2')] });
    const res = await service.getRecommendations(undefined, 'cur');
    expect(res.find((p: any) => p.id === 'cur')).toBeUndefined();
  });
});

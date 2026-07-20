import { Injectable, Logger } from '@nestjs/common';
import { ProductsService } from '@domains/products/products.service';
import { RecentlyViewedService } from '@domains/recently-viewed/recently-viewed.service';
import { OrderService } from '@domains/order/order.service';
import { WishlistService } from '@domains/wishlist/wishlist.service';

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(
    private readonly products: ProductsService,
    private readonly recentlyViewed: RecentlyViewedService,
    private readonly orders: OrderService,
    private readonly wishlist: WishlistService,
  ) {}

  async getRecommendations(
    userId?: string,
    excludeProductId?: string,
    limit = 12,
  ): Promise<any[]> {
    const seeds = userId ? await this.collectSeeds(userId) : [];

    let candidates: any[] = [];
    if (seeds.length > 0) {
      candidates = await this.similarTo(seeds, excludeProductId);
    }

    // backfill with best-sellers + new arrivals when not enough signal
    if (candidates.length < limit) {
      const fill = await this.anonymousPool(excludeProductId);
      candidates = this.mergeUnique(candidates, fill);
    }

    return candidates.slice(0, limit);
  }

  // Gather product signals for a logged-in user
  private async collectSeeds(userId: string): Promise<any[]> {
    const seeds: any[] = [];
    try {
      const rv = await this.recentlyViewed.findAll(userId, 1, 20);
      for (const item of rv?.data ?? []) seeds.push({ id: item.productId });
    } catch (err: any) {
      this.logger.warn(`recently-viewed seed failed: ${err?.message}`);
    }
    try {
      const orders = await this.orders.findByCustomerId(userId, {
        page: 1,
        limit: 10,
      });
      for (const o of orders?.data ?? []) {
        for (const it of (o as any)?.items ?? []) {
          if (it?.productId) seeds.push({ id: it.productId });
        }
      }
    } catch (err: any) {
      this.logger.warn(`order-history seed failed: ${err?.message}`);
    }
    try {
      const wl = await this.wishlist.getItems(userId, {
        page: 1,
        limit: 20,
      });
      for (const it of wl?.data ?? []) {
        const pid = it?.productId ?? (it as any)?.product?.id;
        if (pid) seeds.push({ id: pid });
      }
    } catch (err: any) {
      this.logger.warn(`wishlist seed failed: ${err?.message}`);
    }
    return seeds;
  }

  // Fetch products similar to the seed set: same category -> brand -> price range
  private async similarTo(seeds: any[], excludeId?: string): Promise<any[]> {
    const out: any[] = [];
    const seen = new Set<string>();
    if (excludeId) seen.add(excludeId);

    for (const seed of seeds.slice(0, 8)) {
      const base = await this.safeFind(() => this.products.findById(seed.id));
      if (!base) continue;
      const price = Number(
        (base as any).salePrice ?? (base as any).basePrice ?? 0,
      );
      const categoryId = (base as any).categoryIds?.[0];

      const queries: Record<string, any>[] = [
        { categoryId, isPublished: true },
        { brandId: (base as any).brandId, isPublished: true },
        {
          isPublished: true,
          minPrice: Math.max(0, Math.round(price * 0.7)),
          maxPrice: Math.round(price * 1.3),
        },
      ];

      for (const q of queries) {
        // ponytail: excludeId not a DTO field; filter in JS after fetch
        const res = await this.safeFind(() =>
          this.products.findAll({ ...q, page: 1, limit: 8 }),
        );
        for (const p of res?.data ?? []) {
          if (seen.has(p.id) || p.id === excludeId) continue;
          seen.add(p.id);
          out.push(p);
        }
        if (out.length >= 12) break;
      }
      if (out.length >= 12) break;
    }
    return out;
  }

  private async anonymousPool(excludeId?: string): Promise<any[]> {
    const [bs, na] = await Promise.all([
      this.safeFind(() =>
        this.products.findAll({
          isBestSeller: true,
          isPublished: true,
          page: 1,
          limit: 8,
        }),
      ),
      this.safeFind(() =>
        this.products.findAll({
          isNewArrival: true,
          isPublished: true,
          page: 1,
          limit: 8,
        }),
      ),
    ]);
    const merged = this.mergeUnique(bs?.data ?? [], na?.data ?? []);
    return excludeId ? merged.filter((x) => x.id !== excludeId) : merged;
  }

  private mergeUnique(a: any[], b: any[]): any[] {
    const seen = new Set(a.map((x) => x.id));
    const out = [...a];
    for (const x of b) {
      if (!seen.has(x.id)) {
        seen.add(x.id);
        out.push(x);
      }
    }
    return out;
  }

  private async safeFind<T>(fn: () => Promise<T>): Promise<T | null> {
    try {
      return await fn();
    } catch (err: any) {
      this.logger.warn(`recommendation source failed: ${err?.message}`);
      return null;
    }
  }
}

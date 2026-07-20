import { Injectable, Logger } from '@nestjs/common';
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
import { ProductQueryDto } from '@domains/products/products.types';
import { CategoryTreeNode } from '@domains/categories/categories.types';
import { BrandDto } from '@domains/products/dtos/product-details-response.dto';
import { ReelResponse } from '@domains/instagram-reels/instagram-reels.types';
import { OfferResponse } from '@domains/offer/offer.types';

// ponytail: ProductResponse is not exported by the products dtos; declare only
// the fields the homepage actually maps to.
interface HomeProductSource {
  id: string;
  slug?: string;
  name?: string;
  basePrice?: number;
  salePrice?: number;
  rating?: number;
  reviewCount?: number;
  stockStatus?: string;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  brand?: { id: string; name?: string; slug?: string } | null | undefined;
  category?:
    | {
        categoryId?: string;
        categoryName?: string;
        categorySlug?: string;
      }
    | null
    | undefined;
  media?:
    | Array<{ url?: string | null; thumbnailUrl?: string | null }>
    | null
    | undefined;
  primaryImageUrl?: string | null;
  thumbnailUrl?: string | null;
}
import {
  HomepageResponseDto,
  HeroBannerCardDto,
  CategoryCardDto,
  ProductCardDto,
  InstagramReelCardDto,
  OfferCardDto,
  ReviewCardDto,
  BrandCardDto,
  FooterDto,
} from './homepage.response.dto';

const CACHE_KEY = 'home:page';
const CACHE_TTL = 300; // 5 minutes

@Injectable()
export class HomepageService {
  private readonly logger = new Logger(HomepageService.name);

  constructor(
    private readonly cache: CacheService,
    private readonly prisma: PrismaService,
    private readonly categories: CategoriesService,
    private readonly products: ProductsService,
    private readonly brands: BrandsService,
    private readonly offers: OfferService,
    private readonly reviews: ReviewService,
    private readonly cms: CmsService,
    private readonly reels: InstagramReelsService,
    private readonly settings: AppSettingService,
    private readonly recentlyViewed: RecentlyViewedService,
    private readonly recommendations: RecommendationService,
  ) {}

  async getHomepage(userId?: string): Promise<HomepageResponseDto> {
    const cached = await this.cache.get<HomepageResponseDto>(CACHE_KEY);
    if (cached) return cached;

    const sections = await Promise.all([
      this.safe('heroBanners', () => this.getHeroBanners()),
      this.safe('categories', () => this.getCategories()),
      this.safe('featuredCollections', () => this.getFeaturedCollections()),
      this.safe('newArrivals', () =>
        this.getProducts({ isNewArrival: true }, 12),
      ),
      this.safe('bestSellers', () =>
        this.getProducts({ isBestSeller: true }, 12),
      ),
      this.safe('trendingProducts', () => this.getTrendingProducts(12)),
      this.safe('instagramReels', () => this.getReels()),
      this.safe('flashSale', () => this.getOffers()),
      this.safe('recommendedProducts', () =>
        this.recommendations.getRecommendations(userId),
      ),
      this.safe('recentlyViewed', () => this.getRecentlyViewed(userId)),
      this.safe('testimonials', () => this.getTestimonials()),
      this.safe('brands', () => this.getBrands()),
      this.safe('footer', () => this.getFooter()),
    ]);

    const data = new HomepageResponseDto();
    for (const s of sections)
      (data as unknown as Record<string, unknown>)[s.key] = s.value;

    data.meta = { generatedAt: new Date().toISOString(), version: 'v1' };
    await this.cache.set(CACHE_KEY, data, CACHE_TTL);
    return data;
  }

  async invalidate(): Promise<void> {
    await this.cache.del(CACHE_KEY);
  }

  // ponytail: per-section isolation - one failing source never takes down the homepage
  private async safe<T>(
    key: string,
    fn: () => Promise<T>,
  ): Promise<{ key: string; value: T | [] | Record<string, unknown> }> {
    try {
      return { key, value: await fn() };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.stack : String(err);
      this.logger.error(`Homepage section "${key}" failed`, msg);
      return { key, value: this.emptyFor(key) };
    }
  }

  private emptyFor(key: string): [] | Record<string, unknown> {
    if (key === 'categories' || key === 'footer')
      return key === 'footer' ? {} : [];
    return [];
  }

  private async getHeroBanners(): Promise<HeroBannerCardDto[]> {
    const res = await this.cms.findBanners({
      placement: 'hero',
      isActive: true,
      limit: 10,
    });
    return (res?.data ?? []).map((b) => this.toBannerCard(b));
  }

  private toBannerCard(b: {
    id: string;
    title: string;
    description?: string | null;
    imageUrl: string;
    linkUrl?: string | null;
    placement?: string | null;
  }): HeroBannerCardDto {
    return {
      id: b.id,
      title: b.title,
      description: b.description ?? undefined,
      imageUrl: b.imageUrl,
      linkUrl: b.linkUrl ?? undefined,
      placement: b.placement ?? undefined,
    };
  }

  private async getCategories(): Promise<CategoryCardDto[]> {
    const tree = (await this.categories.getTree()) as
      CategoryTreeNode[] | CategoryTreeNode | null;
    const nodes = Array.isArray(tree) ? tree : tree ? [tree] : [];
    return nodes.map((n) => ({
      id: n.id,
      name: n.name,
      slug: n.slug ?? undefined,
      icon: n.icon ?? undefined,
      image: n.image ?? undefined,
    }));
  }

  // ponytail: no dedicated collection service exists; surface empty until one lands
  private async getFeaturedCollections(): Promise<ProductCardDto[]> {
    return [];
  }

  private async getProducts(
    filter: ProductQueryDto,
    limit: number,
  ): Promise<ProductCardDto[]> {
    const res = await this.products.findAll({
      ...filter,
      isPublished: true,
      page: 1,
      limit,
    });
    return (res?.data ?? []).map((p) =>
      this.toProductCard(p as HomeProductSource),
    );
  }

  // ponytail: real trending = weighted business signals, NOT createdAt.
  // Single query aggregates purchases/wishlist/cart-adds/views/review quality
  // into one score, then we fetch those products.
  // ceiling: returns have no productId link in schema -> excluded; add when modeled.
  private async getTrendingProducts(limit: number): Promise<ProductCardDto[]> {
    const rows = await this.prisma.$queryRawUnsafe<
      { productId: string; score: number }[]
    >(
      `
      SELECT p.id AS "productId",
        COALESCE(s.purchases,0) * 5
        + COALESCE(w.wishlist,0) * 3
        + COALESCE(c.cart_adds,0) * 2
        + COALESCE(v.views,0) * 1
        + COALESCE(r.review_count,0) * 2
        + COALESCE(r.avg_rating,0) * COALESCE(r.review_count,0) * 1.5
        AS score
      FROM "products" p
      LEFT JOIN (
        SELECT "productId", SUM(quantity) AS purchases
        FROM "order_items" GROUP BY "productId"
      ) s ON s."productId" = p.id
      LEFT JOIN (
        SELECT "productId", COUNT(*) AS wishlist
        FROM "wishlist_items" GROUP BY "productId"
      ) w ON w."productId" = p.id
      LEFT JOIN (
        SELECT "productId", SUM(quantity) AS cart_adds
        FROM "shopping_cart_items" GROUP BY "productId"
      ) c ON c."productId" = p.id
      LEFT JOIN (
        SELECT "productId", COUNT(*) AS views
        FROM "recently_viewed" GROUP BY "productId"
      ) v ON v."productId" = p.id
      LEFT JOIN (
        SELECT "productId", COUNT(*) AS review_count, AVG(rating) AS avg_rating
        FROM "reviews" WHERE status = 'approved' GROUP BY "productId"
      ) r ON r."productId" = p.id
      WHERE p."deletedAt" IS NULL AND p."status" = 'ACTIVE'
      ORDER BY score DESC
      LIMIT $1
      `,
      limit,
    );

    const ids = (rows ?? []).map((r) => r.productId);
    if (!ids.length) return [];
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids }, deletedAt: null, status: 'ACTIVE' },
    });
    // preserve score ordering
    const byId = new Map(
      products.map((p) => [p.id, p as unknown as HomeProductSource]),
    );
    return ids
      .map((id) => byId.get(id))
      .filter((p): p is HomeProductSource => Boolean(p))
      .map((p) => this.toProductCard(p));
  }

  private toProductCard(p: HomeProductSource): ProductCardDto {
    const discount =
      p.basePrice && p.salePrice && p.salePrice < p.basePrice
        ? Math.round(((p.basePrice - p.salePrice) / p.basePrice) * 100)
        : undefined;
    const badges: string[] = [];
    // ponytail: badges intentionally minimal; extend when badge service lands
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      thumbnail: this.pickThumbnail(p),
      price: p.basePrice,
      salePrice: p.salePrice ?? undefined,
      discount,
      rating: p.rating ?? undefined,
      reviewCount: p.reviewCount ?? undefined,
      stockStatus: p.stockStatus ?? undefined,
      brand: p.brand
        ? {
            id: p.brand.id,
            name: p.brand.name,
            slug: p.brand.slug ?? undefined,
          }
        : undefined,
      category: p.category
        ? {
            id: p.category.categoryId ?? '',
            name: p.category.categoryName,
            slug: p.category.categorySlug ?? undefined,
          }
        : undefined,
      badges: badges.length ? badges : undefined,
      isNewArrival: p.isNewArrival,
      isBestSeller: p.isBestSeller,
    };
  }

  private pickThumbnail(p: HomeProductSource): string | undefined {
    if (Array.isArray(p.media) && p.media.length) {
      return p.media[0]?.thumbnailUrl ?? p.media[0]?.url ?? undefined;
    }
    return p.primaryImageUrl ?? p.thumbnailUrl ?? undefined;
  }

  private async getReels(): Promise<InstagramReelCardDto[]> {
    const reels = (await this.reels.findPublic(true)) as ReelResponse[] | null;
    return (reels ?? []).map((r) => ({
      id: r.id,
      slug: r.slug ?? undefined,
      title: r.name ?? undefined,
      thumbnail: r.thumbnailUrl ?? undefined,
      videoUrl: r.videoUrl ?? undefined,
      viewCount: r.viewCount,
      products: Array.isArray(r.products)
        ? r.products.map((pr) => ({ id: pr.id }))
        : undefined,
    }));
  }

  private async getOffers(): Promise<OfferCardDto[]> {
    const offers = (await this.offers.getActiveOffers()) as
      OfferResponse[] | null;
    return (offers ?? []).map((o) => ({
      id: o.id,
      name: o.name,
      description: o.description ?? undefined,
      type: o.type,
      value: o.value,
      startDate:
        o.startDate instanceof Date ? o.startDate.toISOString() : o.startDate,
      endDate: o.endDate instanceof Date ? o.endDate.toISOString() : o.endDate,
    }));
  }

  private async getRecentlyViewed(userId?: string): Promise<ProductCardDto[]> {
    if (!userId) return [];
    const res = await this.recentlyViewed.findAll(userId, 1, 12);
    return (res?.data ?? [])
      .map((item) => (item as { product?: HomeProductSource }).product)
      .filter((p): p is HomeProductSource => Boolean(p))
      .map((p) => this.toProductCard(p));
  }

  private async getTestimonials(): Promise<ReviewCardDto[]> {
    const res = await this.reviews.findAll({
      status: 'approved',
      limit: 10,
      page: 1,
    });
    return (res?.data ?? []).map((rv) => ({
      id: rv.id,
      productId: rv.productId ?? undefined,
      rating: rv.rating,
      title: rv.title ?? undefined,
      comment: rv.comment ?? undefined,
    }));
  }

  private async getBrands(): Promise<BrandCardDto[]> {
    const res = await this.brands.findAll({ page: 1, limit: 20 });
    return (res?.data ?? []).map((b: BrandDto) => ({
      id: b.id,
      name: b.name,
      logo: b.logo ?? undefined,
      slug: b.slug ?? undefined,
    }));
  }

  private async getFooter(): Promise<FooterDto> {
    const s = (k: string) => this.settings.getByKey(k).catch(() => null);

    const [
      about,
      email,
      phone,
      address,
      facebook,
      instagram,
      youtube,
      twitter,
      copyright,
      newsletterTitle,
      newsletterText,
    ] = await Promise.all([
      s('footer_about'),
      s('contact_email'),
      s('contact_phone'),
      s('contact_address'),
      s('social_facebook'),
      s('social_instagram'),
      s('social_youtube'),
      s('social_twitter'),
      s('footer_copyright'),
      s('newsletter_title'),
      s('newsletter_text'),
    ]);

    const pagesRes = this.cms?.findPages
      ? await this.cms.findPages({ page: 1, limit: 50 }).catch(() => null)
      : null;
    const pages = (pagesRes?.data ?? []) as Array<{
      slug: string;
      title: string;
    }>;
    const policySlugs = ['privacy', 'terms', 'refund', 'shipping'];
    const policies = pages
      .filter((p) => policySlugs.includes(p.slug))
      .map((p) => ({ slug: p.slug, title: p.title, href: `/${p.slug}` }));

    const cats = await this.categories.getTree().catch(() => null);

    return {
      about: about ?? null,
      contact: {
        email: email ?? null,
        phone: phone ?? null,
        address: address ?? null,
      },
      social: {
        facebook: facebook ?? null,
        instagram: instagram ?? null,
        youtube: youtube ?? null,
        twitter: twitter ?? null,
      },
      company: [
        { title: 'About Us', href: '/about' },
        { title: 'Contact', href: '/contact' },
        { title: 'Careers', href: '/careers' },
      ],
      support: [
        { title: 'Help Center', href: '/support' },
        { title: 'Track Order', href: '/orders/track' },
        { title: 'Returns', href: '/returns' },
        { title: 'Size Guide', href: '/size-guide' },
      ],
      policies,
      quickLinks: {
        categories:
          (cats ?? []).slice(0, 8).map((c: any) => ({
            title: c.name,
            href: `/category/${c.slug ?? c.id}`,
          })) ?? [],
        support: [
          { title: 'Help Center', href: '/support' },
          { title: 'Contact', href: '/contact' },
        ],
      },
      newsletter: {
        enabled: true,
        title: newsletterTitle ?? 'Subscribe to our newsletter',
        text: newsletterText ?? 'Get the latest trends and exclusive offers.',
      },
      copyright:
        copyright ??
        `© ${new Date().getFullYear()} Vasanthi Designers. All rights reserved.`,
    };
  }
}

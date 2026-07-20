import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@common/logger/logger.service';
import { BusinessException, ValidationException } from '@common/exceptions';
import { CacheService } from '@infrastructure/redis/cache.service';
import {
  SlugGenerator,
  SkuGenerator,
  BarcodeGenerator,
} from '@shared/commerce/commerce.utils';
import { AuditService } from '@domains/audit/audit.service';
import { StorageService } from '@infrastructure/storage/storage.service';
import { AppEventEmitter } from '@common/events/event-emitter.service';
import { PrismaService } from '@database/prisma.service';
import { sanitizePlainText, sanitizeRichText } from '@common/utils/sanitize';
import { ProductsRepository } from './products.repository';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
  ProductResponse,
  AssignCategoriesDto,
  AssignAttributesDto,
  AssignTagsDto,
  AssignCollectionsDto,
  AssignRelatedProductsDto,
  ProductDetailsResponse,
  ProductSummaryResponse,
  VariantDetails,
  PricingDetails,
  InventorySummary,
  ProductCard,
  ReviewItem,
  ReviewSummary,
  MediaGroup,
  BreadcrumbItem,
  SeoDetails,
  WishlistStatus,
  CartStatus,
  OfferDetails,
  DeliveryInfo,
} from './products.types';
import { BulkOperationResult } from '@common/dto/bulk.dto';
import { runBulkOperation } from '@common/utils/bulk.helper';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly auditService: AuditService,
    private readonly loggerService: LoggerService,
    private readonly storageService: StorageService,
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly eventEmitter: AppEventEmitter,
    private readonly configService: ConfigService,
  ) {}

  private async toResponse(p: any): Promise<ProductResponse> {
    const media: any[] = p.media ?? [];
    const primary = media.find((m) => m.isPrimary) ?? media[0];
    const primaryImageUrl = primary
      ? await this.storageService.getDisplayUrl(primary.url)
      : undefined;

    return {
      id: p.id,
      sku: p.sku,
      barcode: p.barcode,
      name: p.name,
      slug: p.slug,
      shortDescription: p.shortDescription ?? undefined,
      description: p.description ?? undefined,
      brandId: p.brandId,
      brandName: p.brand?.name,
      type: p.type,
      status: p.status,
      visibility: p.visibility,
      basePrice: Number(p.basePrice),
      salePrice: p.salePrice ? Number(p.salePrice) : undefined,
      wholesalePrice: p.wholesalePrice ? Number(p.wholesalePrice) : undefined,
      costPrice: p.costPrice ? Number(p.costPrice) : undefined,
      taxPercentage: p.taxPercentage ? Number(p.taxPercentage) : undefined,
      discountType: p.discountType ?? undefined,
      discountValue: p.discountValue ? Number(p.discountValue) : undefined,
      trackInventory: p.trackInventory,
      allowBackorder: p.allowBackorder,
      minimumOrderQuantity: p.minimumOrderQuantity,
      maximumOrderQuantity: p.maximumOrderQuantity,
      weight: p.weight ? Number(p.weight) : undefined,
      length: p.length ? Number(p.length) : undefined,
      width: p.width ? Number(p.width) : undefined,
      height: p.height ? Number(p.height) : undefined,
      isFeatured: p.isFeatured,
      isNewArrival: p.isNewArrival,
      isBestSeller: p.isBestSeller,
      isPublished: p.isPublished,
      publishedAt: p.publishedAt ?? undefined,
      displayOrder: p.displayOrder,
      seoTitle: p.seoTitle ?? undefined,
      seoDescription: p.seoDescription ?? undefined,
      seoKeywords: p.seoKeywords ?? undefined,
      canonicalUrl: p.canonicalUrl ?? undefined,
      searchKeywords: p.searchKeywords ?? undefined,
      gender: p.gender ?? undefined,
      ageGroup: p.ageGroup ?? undefined,
      occasion: p.occasion ?? undefined,
      season: p.season ?? undefined,
      tags: p.tags?.length ? p.tags : undefined,
      collections: p.collections?.length ? p.collections : undefined,
      categories: p.categories?.map((pc: any) => ({
        categoryId: pc.categoryId,
        categoryName: pc.category?.name ?? pc.categoryId,
        categorySlug: pc.category?.slug ?? '',
      })),
      primaryImageUrl,
      attributes: p.attributeValues?.map((pa: any) => ({
        attributeId: pa.attributeId,
        attributeName: pa.attribute?.name ?? pa.attributeId,
        attributeType: pa.attribute?.type ?? 'TEXT',
        value: pa.value ?? undefined,
      })),
      relatedProducts: [
        ...(p.relatedTo?.map((r: any) => ({
          productId: r.relatedProductId,
          productName: r.relatedProduct?.name ?? r.relatedProductId,
        })) ?? []),
      ],
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  async findAll(query: ProductQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.productsRepository.findAll({
      search: query.search,
      brandId: query.brandId,
      status: query.status,
      visibility: query.visibility,
      type: query.type,
      gender: query.gender,
      ageGroup: query.ageGroup,
      occasion: query.occasion,
      season: query.season,
      isFeatured: query.isFeatured,
      isNewArrival: query.isNewArrival,
      isBestSeller: query.isBestSeller,
      isPublished: query.isPublished,
      deleted: query.deleted,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      categoryId: query.categoryId,
      createdBy: query.createdBy,
      updatedBy: query.updatedBy,
      tags: query.tags,
      createdAfter: query.createdAfter,
      createdBefore: query.createdBefore,
      page,
      limit,
      sortBy: query.sortBy ?? 'createdAt',
      sortOrder: query.sortOrder ?? 'desc',
    });
    return {
      data: await Promise.all(result.data.map((p: any) => this.toResponse(p))),
      meta: result.meta,
    };
  }

  async getStats() {
    return this.productsRepository.getStats();
  }

  async findById(id: string) {
    const product = await this.productsRepository.findById(id);
    if (!product || product.deletedAt)
      throw new BusinessException('Product not found', 'PRODUCT_001');
    return this.toResponse(product);
  }

  // ponytail: primaryImageUrl signed on read via StorageService; list + detail share one source

  // ─── Product Details (aggregate endpoint) ───────────────

  // ponytail: cached orchestration — Redis stores non-user DB results, wishlist/cart always fresh
  async getDetails(
    id: string,
    userId?: string,
    guestId?: string,
    pincode?: string,
    summaryMode?: boolean,
  ): Promise<ProductDetailsResponse | ProductSummaryResponse> {
    const frontendUrl =
      this.configService.get<string>('app.frontendUrl') ??
      process.env.FRONTEND_URL;

    const dbResults = await this.cacheService.getOrSet<{
      product: any;
      reviewsData: any;
      reviewSummary: any;
      activeOffers: any;
      similarProducts: any;
    }>(
      `product:details:${id}`,
      async (): Promise<{
        product: any;
        reviewsData: any;
        reviewSummary: any;
        activeOffers: any;
        similarProducts: any;
      }> => {
        const p = await this.productsRepository.findDetailsById(id);
        if (!p || p.deletedAt) throw new NotFoundException('Product not found');
        const [reviews, agg, offers, similar] = await Promise.all([
          this.prisma.review.findMany({
            where: { productId: id, deletedAt: null, isApproved: true },
            include: {
              images: true,
              customer: {
                include: {
                  user: {
                    select: { firstName: true, lastName: true, avatar: true },
                  },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          }),
          this.prisma.review.aggregate({
            where: { productId: id, deletedAt: null, isApproved: true },
            _avg: { rating: true },
            _count: true,
          }),
          this.prisma.offer.findMany({
            where: {
              isActive: true,
              deletedAt: null,
              startDate: { lte: new Date() },
              endDate: { gte: new Date() },
              OR: [
                { applicableTo: null },
                { applicableTo: 'ALL' },
                { applicableTo: 'PRODUCT', applicableIds: { has: id } },
              ],
            },
            orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
          }),
          this.productsRepository.findSimilarProducts(
            id,
            p.categories.map((pc: any) => pc.categoryId),
            8,
          ),
        ]);

        return {
          product: p,
          reviewsData: reviews,
          reviewSummary: agg,
          activeOffers: offers,
          similarProducts: similar,
        };
      },
      60,
    );

    const {
      product,
      reviewsData,
      reviewSummary,
      activeOffers,
      similarProducts,
    } = dbResults;

    // Wishlist + cart status (never cached)
    let wishlistStatus: WishlistStatus = {
      inWishlist: false,
      wishlistItemId: null,
    };
    let cartStatus: CartStatus = {
      inCart: false,
      cartItemId: null,
      quantity: null,
    };

    if (userId) {
      const profile = await this.prisma.customerProfile.findUnique({
        where: { userId },
      });
      if (profile) {
        const [wishlist, cart] = await Promise.all([
          this.prisma.wishlist.findFirst({ where: { customerId: profile.id } }),
          this.prisma.shoppingCart.findFirst({
            where: { customerId: profile.id, status: 'ACTIVE' },
            include: { items: { where: { productId: id }, take: 1 } },
          }),
        ]);
        if (wishlist) {
          const item = await this.prisma.wishlistItem.findUnique({
            where: {
              wishlistId_productId: { wishlistId: wishlist.id, productId: id },
            },
          });
          if (item) {
            wishlistStatus = { inWishlist: true, wishlistItemId: item.id };
          }
        }
        if (cart?.items?.length) {
          const ci = cart.items[0];
          cartStatus = {
            inCart: true,
            cartItemId: ci.id,
            quantity: ci.quantity,
          };
        }
      }
    } else if (guestId) {
      const cart = await this.prisma.shoppingCart.findFirst({
        where: { guestId, status: 'ACTIVE' },
        include: { items: { where: { productId: id }, take: 1 } },
      });
      if (cart?.items?.length) {
        const ci = cart.items[0];
        cartStatus = { inCart: true, cartItemId: ci.id, quantity: ci.quantity };
      }
    }

    // ponytail: shared toResponse for the product block
    const productData = await this.toResponse(product);

    const brand = product.brand
      ? {
          id: product.brand.id,
          name: product.brand.name,
          slug: product.brand.slug,
          description: product.brand.description ?? undefined,
          logo: product.brand.logo ?? undefined,
          banner: product.brand.bannerImage ?? undefined,
          website: product.brand.website ?? undefined,
          brandStory: undefined, // ponytail: no brandStory field in schema yet
        }
      : {
          id: '',
          name: '',
          slug: '',
          description: undefined,
          logo: undefined,
          banner: undefined,
          website: undefined,
          brandStory: undefined,
        };

    const categories = (product.categories ?? []).map((pc: any) => ({
      categoryId: pc.categoryId,
      categoryName: pc.category?.name ?? '',
      categorySlug: pc.category?.slug ?? '',
      parentId: pc.category?.parent?.id ?? undefined,
      parentName: pc.category?.parent?.name ?? undefined,
    }));

    // ponytail: batch breadcrumb fetch — max 4 queries regardless of category count
    const breadcrumbs: BreadcrumbItem[] = [];
    const seenBc = new Set<string>();
    let batchIds: string[] = (product.categories ?? [])
      .map((c: any) => c.categoryId)
      .filter(Boolean);
    const levels: { id: string; name: string; slug: string }[][] = [];
    for (let depth = 0; depth < 4 && batchIds.length > 0; depth++) {
      const cats = await this.prisma.category.findMany({
        where: { id: { in: batchIds } },
        select: { id: true, name: true, slug: true, parentId: true },
      });
      levels.push(cats);
      batchIds = [
        ...new Set(cats.map((c) => c.parentId).filter(Boolean)),
      ] as string[];
    }
    for (let i = levels.length - 1; i >= 0; i--) {
      for (const c of levels[i]) {
        if (!seenBc.has(c.id)) {
          seenBc.add(c.id);
          breadcrumbs.push({ label: c.name, slug: c.slug, categoryId: c.id });
        }
      }
    }

    // ponytail: use getDisplayUrl for media (handles public/private/CDN/signed)
    const media: MediaGroup = { images: [], videos: [], threeSixtyImages: [] };
    for (const m of product.media ?? []) {
      const [url, thumb] = await Promise.all([
        this.storageService.getDisplayUrl(m.url),
        m.thumbnailUrl
          ? this.storageService.getDisplayUrl(m.thumbnailUrl)
          : Promise.resolve(undefined),
      ]);
      if (m.mediaType === 'VIDEO') {
        media.videos.push({
          id: m.id,
          url,
          thumbnailUrl: thumb,
          title: m.title ?? undefined,
        });
      } else if (m.mediaType === '360_IMAGE') {
        media.threeSixtyImages.push({ id: m.id, url });
      } else {
        media.images.push({
          id: m.id,
          url,
          thumbnailUrl: thumb,
          altText: m.altText ?? undefined,
          displayOrder: m.displayOrder,
          isPrimary: m.isPrimary,
        });
      }
    }

    const variants: VariantDetails[] = await Promise.all(
      (product.variants ?? []).map(async (v: any) => {
        const inv = v.inventory;
        const price = v.priceOverride
          ? Number(v.priceOverride)
          : (productData.salePrice ?? productData.basePrice);
        const salePrice = v.salePriceOverride
          ? Number(v.salePriceOverride)
          : productData.salePrice;
        const images = await Promise.all(
          (v.media ?? []).map(async (vm: any) => ({
            url: await this.storageService.getDisplayUrl(vm.url),
            thumbnailUrl: vm.thumbnailUrl
              ? await this.storageService.getDisplayUrl(vm.thumbnailUrl)
              : undefined,
            altText: vm.altText ?? undefined,
            isPrimary: vm.isPrimary,
          })),
        );
        return {
          id: v.id,
          sku: v.sku,
          barcode: v.barcode,
          title: v.title,
          price,
          salePrice,
          weight: v.weight ? Number(v.weight) : undefined,
          isDefault: v.isDefault,
          isActive: v.isActive,
          stockStatus: inv?.stockStatus ?? 'OUT_OF_STOCK',
          availableQuantity: inv?.availableQuantity ?? 0,
          reservedQuantity: inv?.reservedQuantity ?? 0,
          allowBackorder: inv?.allowBackorder ?? product.allowBackorder,
          attributeValues: (v.attributeValues ?? []).map((av: any) => ({
            attributeId: av.attributeId,
            attributeName: av.attribute?.name ?? '',
            attributeType: av.attribute?.type ?? 'TEXT',
            value: av.value ?? undefined,
            optionLabel: av.option?.label ?? undefined,
          })),
          images,
        };
      }),
    );

    const bp = Number(product.basePrice);
    const sp = product.salePrice ? Number(product.salePrice) : undefined;
    const taxPct = product.taxPercentage ? Number(product.taxPercentage) : 0;
    const effectivePrice = sp ?? bp;
    const taxAmount = (effectivePrice * taxPct) / 100;

    const pricing: PricingDetails = {
      mrp: bp,
      salePrice: sp,
      discountPercent: sp ? Math.round(((bp - sp) / bp) * 100) : undefined,
      discountAmount: sp ? bp - sp : undefined,
      taxPercentage: taxPct,
      taxAmount,
      youSave: sp ? bp - sp : 0,
      finalPrice: effectivePrice + taxAmount,
    };

    // ponytail: aggregate across all variants; warehouse-level breakdown YAGNI
    const allVariants = product.variants ?? [];
    const totalAvailable = allVariants.reduce(
      (sum: number, v: any) => sum + (v.inventory?.availableQuantity ?? 0),
      0,
    );
    const totalReserved = allVariants.reduce(
      (sum: number, v: any) => sum + (v.inventory?.reservedQuantity ?? 0),
      0,
    );
    const anyInStock = allVariants.some(
      (v: any) =>
        (v.inventory?.availableQuantity ?? 0) -
          (v.inventory?.reservedQuantity ?? 0) >
        0,
    );
    const anyLowStock = allVariants.some(
      (v: any) => v.inventory?.stockStatus === 'LOW_STOCK',
    );
    const anyBackorder = allVariants.some(
      (v: any) => v.inventory?.allowBackorder ?? product.allowBackorder,
    );
    const allOutOfStock = allVariants.every(
      (v: any) => (v.inventory?.availableQuantity ?? 0) <= 0,
    );

    const inventory: InventorySummary = {
      totalAvailable,
      totalReserved,
      inStock: anyInStock,
      lowStock: anyLowStock,
      outOfStock: allOutOfStock,
      allowBackorder: anyBackorder,
      trackInventory: product.trackInventory,
      minOrderQty: product.minimumOrderQuantity,
      maxOrderQty: product.maximumOrderQuantity,
    };

    const ratingDist: Record<string, number> = {
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0,
    };
    const allReviews = reviewsData ?? [];
    for (const r of allReviews) {
      const key = String(r.rating);
      ratingDist[key] = (ratingDist[key] ?? 0) + 1;
    }

    const reviewSummaryData: ReviewSummary = {
      averageRating: reviewSummary._avg.rating
        ? Math.round(reviewSummary._avg.rating * 10) / 10
        : 0,
      totalReviews: reviewSummary._count,
      ratingDistribution: ratingDist,
    };

    const reviewItems: ReviewItem[] = allReviews.map((r: any) => {
      const u = r.customer?.user;
      return {
        id: r.id,
        rating: r.rating,
        title: r.title ?? undefined,
        comment: r.comment ?? undefined,
        customerName: u
          ? [u.firstName, u.lastName].filter(Boolean).join(' ')
          : undefined,
        customerAvatarUrl: u?.avatar ?? r.customer?.profileImage ?? undefined,
        images: (r.images ?? []).map((i: any) => ({
          url: i.url,
          altText: i.altText ?? undefined,
        })),
        isVerifiedPurchase: r.isVerifiedPurchase,
        helpfulCount: r.helpfulCount,
        createdAt: r.createdAt.toISOString(),
      };
    });

    // ponytail: single review groupBy for all card product IDs
    const cardProductIds = [
      ...(product.relatedTo ?? [])
        .map((r: any) => r.relatedProduct?.id)
        .filter(Boolean),
      ...(similarProducts ?? []).map((s: any) => s.id).filter(Boolean),
    ];
    const reviewAggs = cardProductIds.length
      ? await this.prisma.review.groupBy({
          by: ['productId'],
          where: {
            productId: { in: cardProductIds },
            deletedAt: null,
            isApproved: true,
          },
          _avg: { rating: true },
          _count: true,
        })
      : [];
    const reviewMap = new Map(
      reviewAggs.map((r: any) => [
        r.productId,
        { avg: r._avg.rating, count: r._count },
      ]),
    );

    const toCard = async (rp: any): Promise<ProductCard> => {
      const pd = rp.relatedProduct ?? rp;
      const img = pd.media?.[0];
      const imgUrl = img
        ? await this.storageService.getDisplayUrl(img.url)
        : undefined;
      const agg = reviewMap.get(pd.id);
      return {
        id: pd.id,
        name: pd.name,
        slug: pd.slug,
        basePrice: Number(pd.basePrice),
        salePrice: pd.salePrice ? Number(pd.salePrice) : undefined,
        brandName: pd.brand?.name,
        brandId: pd.brandId,
        primaryImageUrl: imgUrl,
        stockStatus: pd.variants?.[0]?.inventory?.stockStatus ?? undefined,
        rating: agg ? Math.round(Number(agg.avg) * 10) / 10 : undefined,
        reviewCount: agg?.count ?? undefined,
      };
    };

    const [relatedProducts, similarCards] = await Promise.all([
      Promise.all((product.relatedTo ?? []).map((r: any) => toCard(r))),
      Promise.all(
        (similarProducts ?? []).map((s: any) => toCard({ relatedProduct: s })),
      ),
    ]);

    const offers: OfferDetails[] = (activeOffers ?? []).map((o: any) => ({
      id: o.id,
      name: o.name,
      description: o.description ?? undefined,
      type: o.type,
      value: Number(o.value),
      applicableTo: o.applicableTo ?? undefined,
    }));

    const seo: SeoDetails = {
      title: product.seoTitle ?? undefined,
      description: product.seoDescription ?? undefined,
      keywords: product.seoKeywords ?? undefined,
      canonicalUrl: product.canonicalUrl ?? undefined,
      ogImage: productData.primaryImageUrl,
    };

    // ponytail: delivery lookup by pincode — single Prisma query, no module dependency
    let delivery: DeliveryInfo | undefined;
    if (pincode) {
      const zone = await this.prisma.shippingZone.findFirst({
        where: { pincodes: { has: pincode }, isActive: true },
        include: { method: true },
      });
      if (zone) {
        delivery = {
          serviceable: true,
          estimatedDays: zone.method?.estimatedDays ?? null,
          shippingCharge: Number(zone.rate),
          freeShipping: false,
          codAvailable: true,
          shippingMethod: zone.method?.name ?? null,
        };
      } else {
        delivery = {
          serviceable: false,
          estimatedDays: null,
          shippingCharge: 0,
          freeShipping: false,
          codAvailable: false,
          shippingMethod: null,
        };
      }
    }

    // ponytail: shareUrl uses config service, not hardcoded localhost fallback
    const shareUrl = frontendUrl
      ? `${frontendUrl}/products/${product.slug}`
      : `/products/${product.slug}`;

    if (summaryMode) {
      return {
        product: productData,
        pricing,
        inventory,
        reviews: {
          summary: reviewSummaryData,
          items: reviewItems,
          totalCount: reviewSummary._count,
        },
        wishlist: wishlistStatus,
        cart: cartStatus,
        shareUrl,
      } satisfies ProductSummaryResponse;
    }

    return {
      product: productData,
      brand,
      categories,
      breadcrumbs,
      media,
      variants,
      pricing,
      attributes: (product.attributeValues ?? []).map((av: any) => ({
        attributeId: av.attributeId,
        attributeName: av.attribute?.name ?? '',
        attributeType: av.attribute?.type ?? 'TEXT',
        value: av.value ?? undefined,
      })),
      inventory,
      reviews: {
        summary: reviewSummaryData,
        items: reviewItems,
        totalCount: reviewSummary._count,
      },
      offers,
      relatedProducts,
      similarProducts: similarCards,
      seo,
      wishlist: wishlistStatus,
      cart: cartStatus,
      ...(delivery && { delivery }),
      shareUrl,
    };
  }

  private async generateUniqueSlug(
    name: string,
    excludeId?: string,
  ): Promise<string> {
    let slug = SlugGenerator.generate(name);
    let existing = await this.productsRepository.findBySlug(slug);
    let counter = 1;
    while (existing && existing.id !== excludeId) {
      slug = `${SlugGenerator.generate(name)}-${counter}`;
      existing = await this.productsRepository.findBySlug(slug);
      counter++;
    }
    return slug;
  }

  private async generateUniqueSku(): Promise<string> {
    let sku = SkuGenerator.generate();
    let existing = await this.productsRepository.findBySku(sku);
    while (existing) {
      sku = SkuGenerator.generate();
      existing = await this.productsRepository.findBySku(sku);
    }
    return sku;
  }

  private async generateUniqueBarcode(): Promise<string> {
    let barcode = BarcodeGenerator.generate();
    let existing = await this.productsRepository.findByBarcode(barcode);
    while (existing) {
      barcode = BarcodeGenerator.generate();
      existing = await this.productsRepository.findByBarcode(barcode);
    }
    return barcode;
  }

  private validatePrices(dto: CreateProductDto | UpdateProductDto) {
    if (dto.basePrice !== undefined && dto.basePrice < 0)
      throw new ValidationException(
        'Base price cannot be negative',
        'PRODUCT_PRICE_001',
      );
    if (dto.salePrice !== undefined && dto.salePrice < 0)
      throw new ValidationException(
        'Sale price cannot be negative',
        'PRODUCT_PRICE_002',
      );
    if (dto.wholesalePrice !== undefined && dto.wholesalePrice < 0)
      throw new ValidationException(
        'Wholesale price cannot be negative',
        'PRODUCT_PRICE_003',
      );
    if (dto.costPrice !== undefined && dto.costPrice < 0)
      throw new ValidationException(
        'Cost price cannot be negative',
        'PRODUCT_PRICE_004',
      );
  }

  private validateWeightDimensions(dto: CreateProductDto | UpdateProductDto) {
    if (dto.weight !== undefined && dto.weight < 0)
      throw new ValidationException(
        'Weight cannot be negative',
        'PRODUCT_DIM_001',
      );
    if (dto.length !== undefined && dto.length < 0)
      throw new ValidationException(
        'Length cannot be negative',
        'PRODUCT_DIM_002',
      );
    if (dto.width !== undefined && dto.width < 0)
      throw new ValidationException(
        'Width cannot be negative',
        'PRODUCT_DIM_003',
      );
    if (dto.height !== undefined && dto.height < 0)
      throw new ValidationException(
        'Height cannot be negative',
        'PRODUCT_DIM_004',
      );
  }

  async create(dto: CreateProductDto, userId: string) {
    dto.name = sanitizePlainText(dto.name);
    if (dto.description) dto.description = sanitizeRichText(dto.description);
    if (dto.seoTitle) dto.seoTitle = sanitizePlainText(dto.seoTitle);
    if (dto.seoDescription)
      dto.seoDescription = sanitizePlainText(dto.seoDescription);
    this.validatePrices(dto);
    this.validateWeightDimensions(dto);

    const slug = await this.generateUniqueSlug(dto.slug || dto.name);
    const sku = dto.sku || (await this.generateUniqueSku());
    const barcode = await this.generateUniqueBarcode();

    const product = await this.productsRepository.create({
      name: dto.name,
      slug,
      sku,
      barcode,
      shortDescription: dto.shortDescription,
      description: dto.description,
      brand: { connect: { id: dto.brandId } },
      type: dto.type ?? 'READYMADE',
      status: dto.status ?? 'DRAFT',
      visibility: dto.visibility ?? 'VISIBLE',
      basePrice: dto.basePrice,
      salePrice: dto.salePrice,
      wholesalePrice: dto.wholesalePrice,
      costPrice: dto.costPrice,
      taxPercentage: dto.taxPercentage ?? 0,
      discountType: dto.discountType,
      discountValue: dto.discountValue,
      trackInventory: dto.trackInventory ?? true,
      allowBackorder: dto.allowBackorder ?? false,
      minimumOrderQuantity: dto.minimumOrderQuantity ?? 1,
      maximumOrderQuantity: dto.maximumOrderQuantity ?? 0,
      weight: dto.weight,
      length: dto.length,
      width: dto.width,
      height: dto.height,
      isFeatured: dto.isFeatured ?? false,
      isNewArrival: dto.isNewArrival ?? false,
      isBestSeller: dto.isBestSeller ?? false,
      displayOrder: dto.displayOrder ?? 0,
      seoTitle: dto.seoTitle,
      seoDescription: dto.seoDescription,
      seoKeywords: dto.seoKeywords,
      canonicalUrl: dto.canonicalUrl,
      searchKeywords: dto.searchKeywords,
      gender: dto.gender,
      ageGroup: dto.ageGroup,
      occasion: dto.occasion,
      season: dto.season,
      tags: dto.tags ?? [],
      collections: dto.collections ?? [],
      createdBy: userId,
    });

    if (dto.categoryIds?.length) {
      await this.productsRepository.assignCategories(
        product.id,
        dto.categoryIds,
      );
    }
    if (dto.attributes?.length) {
      await this.productsRepository.assignAttributes(
        product.id,
        dto.attributes,
      );
    }

    await this.auditService.log({
      action: 'PRODUCT_CREATED',
      module: 'products',
      resource: 'product',
      resourceId: product.id,
      userId,
      newValue: { name: dto.name, sku, slug },
    });
    this.loggerService.log(
      { action: 'product_created', productId: product.id, name: dto.name },
      'ProductsService',
    );
    this.eventEmitter.emit('cache.invalidate.product.details', {
      productId: product.id,
    });
    return this.findById(product.id);
  }

  async update(id: string, dto: UpdateProductDto, userId: string) {
    if (dto.name) dto.name = sanitizePlainText(dto.name);
    if (dto.description) dto.description = sanitizeRichText(dto.description);
    if (dto.seoTitle) dto.seoTitle = sanitizePlainText(dto.seoTitle);
    if (dto.seoDescription)
      dto.seoDescription = sanitizePlainText(dto.seoDescription);
    const product = await this.productsRepository.findById(id);
    if (!product || product.deletedAt)
      throw new BusinessException('Product not found', 'PRODUCT_001');

    this.validatePrices(dto);
    this.validateWeightDimensions(dto);

    const updateData: any = { ...dto, updatedBy: userId };
    if (dto.slug) {
      updateData.slug = await this.generateUniqueSlug(dto.slug, id);
    } else if (dto.name) {
      updateData.slug = await this.generateUniqueSlug(dto.name, id);
    }
    if (dto.brandId) updateData.brand = { connect: { id: dto.brandId } };
    // ponytail: Prisma rejects the scalar FK alongside the relation; drop it
    delete updateData.brandId;

    await this.productsRepository.update(id, updateData);
    await this.auditService.log({
      action: 'PRODUCT_UPDATED',
      module: 'products',
      resource: 'product',
      resourceId: id,
      userId,
      oldValue: { name: product.name },
      newValue: { ...dto },
    });
    this.loggerService.log(
      { action: 'product_updated', productId: id },
      'ProductsService',
    );
    this.eventEmitter.emit('cache.invalidate.product.details', {
      productId: id,
    });
    return this.findById(id);
  }

  async delete(id: string, userId: string) {
    const product = await this.productsRepository.findById(id);
    if (!product || product.deletedAt)
      throw new BusinessException('Product not found', 'PRODUCT_001');
    await this.productsRepository.softDelete(id);
    await this.auditService.log({
      action: 'PRODUCT_DELETED',
      module: 'products',
      resource: 'product',
      resourceId: id,
      userId,
      oldValue: { name: product.name },
    });
    this.loggerService.log(
      { action: 'product_deleted', productId: id },
      'ProductsService',
    );
    this.eventEmitter.emit('cache.invalidate.product.details', {
      productId: id,
    });
  }

  async restore(id: string, userId: string) {
    const product = await this.productsRepository.findById(id);
    if (!product)
      throw new BusinessException('Product not found', 'PRODUCT_001');
    if (!product.deletedAt)
      throw new BusinessException('Product is not deleted', 'PRODUCT_002');
    await this.productsRepository.restore(id);
    await this.auditService.log({
      action: 'PRODUCT_RESTORED',
      module: 'products',
      resource: 'product',
      resourceId: id,
      userId,
    });
    this.loggerService.log(
      { action: 'product_restored', productId: id },
      'ProductsService',
    );
    this.eventEmitter.emit('cache.invalidate.product.details', {
      productId: id,
    });
    return this.findById(id);
  }

  async publish(id: string, userId: string) {
    const product = await this.productsRepository.findById(id);
    if (!product || product.deletedAt)
      throw new BusinessException('Product not found', 'PRODUCT_001');
    if (product.isPublished)
      throw new BusinessException(
        'Product is already published',
        'PRODUCT_003',
      );
    await this.productsRepository.update(id, {
      isPublished: true,
      publishedAt: new Date(),
      status: 'ACTIVE',
      updatedBy: userId,
    });
    await this.auditService.log({
      action: 'PRODUCT_PUBLISHED',
      module: 'products',
      resource: 'product',
      resourceId: id,
      userId,
    });
    this.loggerService.log(
      { action: 'product_published', productId: id },
      'ProductsService',
    );
    this.eventEmitter.emit('cache.invalidate.product.details', {
      productId: id,
    });
    return this.findById(id);
  }

  async unpublish(id: string, userId: string) {
    const product = await this.productsRepository.findById(id);
    if (!product || product.deletedAt)
      throw new BusinessException('Product not found', 'PRODUCT_001');
    if (!product.isPublished)
      throw new BusinessException('Product is not published', 'PRODUCT_004');
    await this.productsRepository.update(id, {
      isPublished: false,
      status: 'DRAFT',
      updatedBy: userId,
    });
    await this.auditService.log({
      action: 'PRODUCT_UNPUBLISHED',
      module: 'products',
      resource: 'product',
      resourceId: id,
      userId,
    });
    this.loggerService.log(
      { action: 'product_unpublished', productId: id },
      'ProductsService',
    );
    this.eventEmitter.emit('cache.invalidate.product.details', {
      productId: id,
    });
    return this.findById(id);
  }

  async feature(id: string, userId: string) {
    const product = await this.productsRepository.findById(id);
    if (!product || product.deletedAt)
      throw new BusinessException('Product not found', 'PRODUCT_001');
    await this.productsRepository.update(id, {
      isFeatured: true,
      updatedBy: userId,
    });
    await this.auditService.log({
      action: 'PRODUCT_FEATURED',
      module: 'products',
      resource: 'product',
      resourceId: id,
      userId,
    });
    this.loggerService.log(
      { action: 'product_featured', productId: id },
      'ProductsService',
    );
    this.eventEmitter.emit('cache.invalidate.product.details', {
      productId: id,
    });
    return this.findById(id);
  }

  async unfeature(id: string, userId: string) {
    const product = await this.productsRepository.findById(id);
    if (!product || product.deletedAt)
      throw new BusinessException('Product not found', 'PRODUCT_001');
    await this.productsRepository.update(id, {
      isFeatured: false,
      updatedBy: userId,
    });
    this.loggerService.log(
      { action: 'product_unfeatured', productId: id },
      'ProductsService',
    );
    this.eventEmitter.emit('cache.invalidate.product.details', {
      productId: id,
    });
    return this.findById(id);
  }

  async assignCategories(id: string, dto: AssignCategoriesDto, userId: string) {
    const product = await this.productsRepository.findById(id);
    if (!product || product.deletedAt)
      throw new BusinessException('Product not found', 'PRODUCT_001');
    await this.productsRepository.assignCategories(id, dto.categoryIds);
    await this.auditService.log({
      action: 'PRODUCT_CATEGORY_ASSIGNED',
      module: 'products',
      resource: 'product',
      resourceId: id,
      userId,
      newValue: { categoryIds: dto.categoryIds },
    });
    this.eventEmitter.emit('cache.invalidate.product.details', {
      productId: id,
    });
    return this.findById(id);
  }

  async removeCategory(id: string, categoryId: string) {
    const product = await this.productsRepository.findById(id);
    if (!product || product.deletedAt)
      throw new BusinessException('Product not found', 'PRODUCT_001');
    await this.productsRepository.removeCategory(id, categoryId);
    this.eventEmitter.emit('cache.invalidate.product.details', {
      productId: id,
    });
    return this.findById(id);
  }

  async assignAttributes(id: string, dto: AssignAttributesDto, userId: string) {
    const product = await this.productsRepository.findById(id);
    if (!product || product.deletedAt)
      throw new BusinessException('Product not found', 'PRODUCT_001');
    await this.productsRepository.assignAttributes(id, dto.attributes);
    await this.auditService.log({
      action: 'PRODUCT_ATTRIBUTE_ASSIGNED',
      module: 'products',
      resource: 'product',
      resourceId: id,
      userId,
      newValue: { attributes: dto.attributes },
    });
    this.eventEmitter.emit('cache.invalidate.product.details', {
      productId: id,
    });
    return this.findById(id);
  }

  async removeAttribute(id: string, attributeId: string) {
    const product = await this.productsRepository.findById(id);
    if (!product || product.deletedAt)
      throw new BusinessException('Product not found', 'PRODUCT_001');
    await this.productsRepository.removeAttribute(id, attributeId);
    this.eventEmitter.emit('cache.invalidate.product.details', {
      productId: id,
    });
    return this.findById(id);
  }

  async assignRelatedProducts(id: string, dto: AssignRelatedProductsDto) {
    const product = await this.productsRepository.findById(id);
    if (!product || product.deletedAt)
      throw new BusinessException('Product not found', 'PRODUCT_001');
    await this.productsRepository.assignRelatedProducts(
      id,
      dto.relatedProductIds,
    );
    this.eventEmitter.emit('cache.invalidate.product.details', {
      productId: id,
    });
    return this.findById(id);
  }

  async removeRelatedProduct(id: string, relatedProductId: string) {
    const product = await this.productsRepository.findById(id);
    if (!product || product.deletedAt)
      throw new BusinessException('Product not found', 'PRODUCT_001');
    await this.productsRepository.removeRelatedProduct(id, relatedProductId);
    this.eventEmitter.emit('cache.invalidate.product.details', {
      productId: id,
    });
    return this.findById(id);
  }

  // ponytail: tags/collections are String[] columns on Product; assign/remove via update
  async assignTags(id: string, dto: AssignTagsDto, userId: string) {
    const product = await this.productsRepository.findById(id);
    if (!product || product.deletedAt)
      throw new BusinessException('Product not found', 'PRODUCT_001');
    const merged = [...new Set([...(product.tags ?? []), ...dto.tags])];
    await this.productsRepository.update(id, {
      tags: merged,
      updatedBy: userId,
    });
    this.eventEmitter.emit('cache.invalidate.product.details', {
      productId: id,
    });
    return this.findById(id);
  }

  async removeTag(id: string, tag: string, userId: string) {
    const product = await this.productsRepository.findById(id);
    if (!product || product.deletedAt)
      throw new BusinessException('Product not found', 'PRODUCT_001');
    const filtered = (product.tags ?? []).filter((t) => t !== tag);
    await this.productsRepository.update(id, {
      tags: filtered,
      updatedBy: userId,
    });
    this.eventEmitter.emit('cache.invalidate.product.details', {
      productId: id,
    });
    return this.findById(id);
  }

  async assignCollections(
    id: string,
    dto: AssignCollectionsDto,
    userId: string,
  ) {
    const product = await this.productsRepository.findById(id);
    if (!product || product.deletedAt)
      throw new BusinessException('Product not found', 'PRODUCT_001');
    const merged = [
      ...new Set([...(product.collections ?? []), ...dto.collections]),
    ];
    await this.productsRepository.update(id, {
      collections: merged,
      updatedBy: userId,
    });
    this.eventEmitter.emit('cache.invalidate.product.details', {
      productId: id,
    });
    return this.findById(id);
  }

  async removeCollection(id: string, collection: string, userId: string) {
    const product = await this.productsRepository.findById(id);
    if (!product || product.deletedAt)
      throw new BusinessException('Product not found', 'PRODUCT_001');
    const filtered = (product.collections ?? []).filter(
      (c) => c !== collection,
    );
    await this.productsRepository.update(id, {
      collections: filtered,
      updatedBy: userId,
    });
    this.eventEmitter.emit('cache.invalidate.product.details', {
      productId: id,
    });
    return this.findById(id);
  }

  async bulk(
    dto: { ids: string[]; action: string },
    userId: string,
  ): Promise<BulkOperationResult> {
    const actionMap: Record<string, (id: string) => Promise<any>> = {
      delete: (id) => this.delete(id, userId).then(() => ({ id })),
      restore: (id) => this.restore(id, userId).then((r) => ({ id: r.id })),
      publish: (id) => this.publish(id, userId).then((r) => ({ id: r.id })),
      unpublish: (id) => this.unpublish(id, userId).then((r) => ({ id: r.id })),
      feature: (id) => this.feature(id, userId).then((r) => ({ id: r.id })),
      unfeature: (id) => this.unfeature(id, userId).then((r) => ({ id: r.id })),
    };
    const result = await runBulkOperation(dto.ids, actionMap, dto.action);
    if (result.successCount > 0) {
      await this.auditService.log({
        action: `PRODUCT_BULK_${dto.action.toUpperCase()}`,
        module: 'products',
        resource: 'product',
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

  async clone(id: string, userId: string): Promise<ProductResponse> {
    const original = await this.productsRepository.findById(id);
    if (!original || original.deletedAt)
      throw new BusinessException('Product not found', 'PRODUCT_001');

    const slug = await this.generateUniqueSlug(`${original.name}-copy`);
    const sku = await this.generateUniqueSku();
    const barcode = await this.generateUniqueBarcode();

    const product = await this.productsRepository.create({
      name: `${original.name} (Copy)`,
      slug,
      sku,
      barcode,
      shortDescription: original.shortDescription,
      description: original.description,
      brand: { connect: { id: original.brandId } },
      type: original.type,
      status: 'DRAFT',
      visibility: original.visibility,
      basePrice: original.basePrice,
      salePrice: original.salePrice,
      wholesalePrice: original.wholesalePrice,
      costPrice: original.costPrice,
      taxPercentage: original.taxPercentage ?? 0,
      discountType: original.discountType,
      discountValue: original.discountValue,
      trackInventory: original.trackInventory,
      allowBackorder: original.allowBackorder,
      minimumOrderQuantity: original.minimumOrderQuantity,
      maximumOrderQuantity: original.maximumOrderQuantity,
      weight: original.weight,
      length: original.length,
      width: original.width,
      height: original.height,
      isFeatured: false,
      isNewArrival: false,
      isBestSeller: false,
      displayOrder: original.displayOrder,
      seoTitle: original.seoTitle,
      seoDescription: original.seoDescription,
      seoKeywords: original.seoKeywords,
      tags: original.tags ?? [],
      collections: original.collections ?? [],
      createdBy: userId,
    });

    // ponytail: category cloning skipped — repository has no getCategories method

    await this.auditService.log({
      action: 'PRODUCT_CLONED',
      module: 'products',
      resource: 'product',
      resourceId: product.id,
      userId,
      newValue: { clonedFrom: id, name: product.name },
    });

    this.eventEmitter.emit('cache.invalidate.product.details', {
      productId: id,
    });
    this.eventEmitter.emit('cache.invalidate.product.details', {
      productId: product.id,
    });
    return this.findById(product.id);
  }
}

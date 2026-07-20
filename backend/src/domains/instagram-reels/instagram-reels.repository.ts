import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class InstagramReelsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    search?: string;
    status?: string;
    visibility?: string;
    featured?: boolean;
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const {
      search,
      status,
      visibility,
      featured,
      page,
      limit,
      sortBy,
      sortOrder,
    } = params;
    const where: Prisma.InstagramReelWhereInput = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (visibility) where.visibility = visibility;
    if (featured !== undefined) where.featured = featured;

    const orderBy: Prisma.InstagramReelOrderByWithRelationInput = {};
    const field = sortBy ?? 'displayOrder';
    orderBy[field as keyof Prisma.InstagramReelOrderByWithRelationInput] =
      sortOrder ?? 'asc';

    const [data, total] = await Promise.all([
      this.prisma.instagramReel.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          products: {
            include: {
              product: { select: { id: true, name: true, slug: true } },
            },
            orderBy: { displayOrder: 'asc' },
          },
          _count: { select: { products: true } },
        },
      }),
      this.prisma.instagramReel.count({ where }),
    ]);

    return {
      data: data.map((r) => ({
        ...r,
        productCount: r._count.products,
        products: r.products.map((p) => ({
          id: p.id,
          productId: p.productId,
          displayOrder: p.displayOrder,
          productName: p.product.name,
          productSlug: p.product.slug,
        })),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrevious: page > 1,
      },
    };
  }

  async findById(id: string) {
    return this.prisma.instagramReel.findFirst({
      where: { id, deletedAt: null },
      include: {
        products: {
          include: {
            product: { select: { id: true, name: true, slug: true } },
          },
          orderBy: { displayOrder: 'asc' },
        },
        analytics: { orderBy: { date: 'desc' }, take: 90 },
      },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.instagramReel.findFirst({
      where: { slug, deletedAt: null },
      include: {
        products: {
          include: {
            product: {
              select: { id: true, name: true, slug: true, basePrice: true },
            },
          },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });
  }

  async findPublic(params: { featured?: boolean; limit?: number }) {
    const { featured, limit } = params;
    const now = new Date();
    const where: Prisma.InstagramReelWhereInput = {
      deletedAt: null,
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      AND: [
        { OR: [{ startDate: null }, { startDate: { lte: now } }] },
        { OR: [{ endDate: null }, { endDate: { gte: now } }] },
      ],
    };
    if (featured !== undefined) where.featured = featured;

    return this.prisma.instagramReel.findMany({
      where,
      orderBy: { displayOrder: 'asc' },
      take: limit ?? 50,
      include: {
        products: {
          include: {
            product: {
              select: { id: true, name: true, slug: true, basePrice: true },
            },
          },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });
  }

  async create(data: Prisma.InstagramReelCreateInput) {
    return this.prisma.instagramReel.create({ data });
  }

  async update(id: string, data: Prisma.InstagramReelUpdateInput) {
    return this.prisma.instagramReel.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    return this.prisma.instagramReel.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ARCHIVED' },
    });
  }

  async attachProducts(reelId: string, productIds: string[]) {
    await this.prisma.$transaction(async (tx) => {
      await tx.instagramReelProduct.deleteMany({ where: { reelId } });
      if (productIds.length) {
        await tx.instagramReelProduct.createMany({
          data: productIds.map((productId, i) => ({
            reelId,
            productId,
            displayOrder: i,
          })),
        });
      }
    });
  }

  async removeProduct(reelId: string, productId: string) {
    await this.prisma.instagramReelProduct.deleteMany({
      where: { reelId, productId },
    });
  }

  async getAnalytics(reelId: string) {
    const rows = await this.prisma.instagramReelAnalytics.findMany({
      where: { reelId },
      orderBy: { date: 'desc' },
    });
    const n = rows.length;
    const summary = {
      totalViews: rows.reduce((s, r) => s + r.views, 0),
      totalUniqueViews: rows.reduce((s, r) => s + r.uniqueViews, 0),
      totalPlays: rows.reduce((s, r) => s + r.plays, 0),
      averageWatchTime: n
        ? rows.reduce((s, r) => s + r.averageWatchTime, 0) / n
        : 0,
      averageCompletionRate: n
        ? rows.reduce((s, r) => s + r.completionRate, 0) / n
        : 0,
      totalProductClicks: rows.reduce((s, r) => s + r.productClicks, 0),
      totalWishlistClicks: rows.reduce((s, r) => s + r.wishlistClicks, 0),
      totalCartClicks: rows.reduce((s, r) => s + r.cartClicks, 0),
      totalOrdersGenerated: rows.reduce((s, r) => s + r.ordersGenerated, 0),
      totalRevenue: rows.reduce((s, r) => s + r.revenue, 0),
      averageConversionRate: n
        ? rows.reduce((s, r) => s + r.conversionRate, 0) / n
        : 0,
    };
    return { summary, daily: rows };
  }

  async checkSlug(slug: string, excludeId?: string): Promise<boolean> {
    const where: Prisma.InstagramReelWhereInput = { slug, deletedAt: null };
    if (excludeId) where.id = { not: excludeId };
    const count = await this.prisma.instagramReel.count({ where });
    return count > 0;
  }

  async getMaxDisplayOrder(): Promise<number> {
    const result = await this.prisma.instagramReel.findFirst({
      where: { deletedAt: null },
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true },
    });
    return result?.displayOrder ?? 0;
  }

  async findForScheduler(): Promise<{
    toPublish: any[];
    toArchive: any[];
    toExpire: any[];
  }> {
    const now = new Date();
    const [toPublish, toArchive, toExpire] = await Promise.all([
      this.prisma.instagramReel.findMany({
        where: {
          status: 'SCHEDULED',
          startDate: { lte: now },
          deletedAt: null,
        },
        select: { id: true, name: true, startDate: true },
      }),
      this.prisma.instagramReel.findMany({
        where: {
          status: { not: 'ARCHIVED' },
          endDate: { lte: now },
          deletedAt: null,
        },
        select: { id: true, name: true, endDate: true },
      }),
      this.prisma.instagramReel.findMany({
        where: {
          status: 'PUBLISHED',
          endDate: { not: null, lte: now },
          deletedAt: null,
        },
        select: { id: true, name: true, endDate: true },
      }),
    ]);
    return { toPublish, toArchive, toExpire };
  }

  async findDeletedSince(since: Date) {
    return this.prisma.instagramReel.findMany({
      where: { deletedAt: { not: null, gte: since } },
      select: { id: true, videoUrl: true, thumbnailUrl: true, deletedAt: true },
    });
  }

  async updateVideoMetadata(id: string, metadata: Record<string, any>) {
    return this.prisma.instagramReel.update({
      where: { id },
      data: { videoMetadata: metadata as any },
    });
  }

  async getTopReels(limit = 10) {
    return this.prisma.instagramReel.findMany({
      where: { deletedAt: null, status: 'PUBLISHED' },
      orderBy: { viewCount: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        viewCount: true,
        playCount: true,
        clickCount: true,
        thumbnailUrl: true,
      },
    });
  }

  async findAllForExport(params: {
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: Prisma.InstagramReelWhereInput = { deletedAt: null };
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { slug: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params.status) where.status = params.status;
    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = new Date(params.startDate);
      if (params.endDate) where.createdAt.lte = new Date(params.endDate);
    }
    return this.prisma.instagramReel.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        products: {
          include: {
            product: { select: { id: true, name: true, slug: true } },
          },
          orderBy: { displayOrder: 'asc' },
        },
        analytics: { orderBy: { date: 'desc' }, take: 90 },
      },
    });
  }
}

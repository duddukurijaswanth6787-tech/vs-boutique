import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { RecentlyViewedRepository } from './recently-viewed.repository';
import type { RecentlyViewedProductDto } from './recently-viewed.types';

const MAX_ITEMS = 20;

@Injectable()
export class RecentlyViewedService {
  private readonly logger = new Logger(RecentlyViewedService.name);

  constructor(
    private readonly repo: RecentlyViewedRepository,
    private readonly prisma: PrismaService,
  ) {}

  async record(userId: string, productId: string): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        deletedAt: true,
        isPublished: true,
        status: true,
        visibility: true,
      },
    });
    if (
      !product ||
      product.deletedAt ||
      !product.isPublished ||
      product.status === 'DRAFT' ||
      product.visibility !== 'VISIBLE'
    )
      return;

    await this.prisma.$transaction(async (tx) => {
      await this.repo.upsert(userId, productId, tx);
      const count = await this.repo.count(userId, tx);
      if (count > MAX_ITEMS) await this.repo.trimToLimit(userId, MAX_ITEMS, tx);
    });
  }

  async findAll(userId: string, page: number, limit: number) {
    const { data, total } = await this.repo.findWithProduct(
      userId,
      page,
      limit,
    );
    return {
      data: data.map((item): RecentlyViewedProductDto => ({
        productId: item.productId,
        name: item.product.name,
        slug: item.product.slug ?? undefined,
        basePrice: item.product.basePrice
          ? Number(item.product.basePrice)
          : undefined,
        salePrice: item.product.salePrice
          ? Number(item.product.salePrice)
          : undefined,
        viewedAt: item.viewedAt,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNext: page < Math.ceil(total / limit),
        hasPrevious: page > 1,
      },
    };
  }

  async deleteAll(userId: string): Promise<void> {
    await this.repo.deleteAll(userId);
  }

  async deleteOne(userId: string, productId: string): Promise<void> {
    const existing = await this.repo.findByUserAndProduct(userId, productId);
    if (!existing)
      throw new NotFoundException('Recently viewed item not found');
    await this.repo.deleteOne(userId, productId);
  }

  async mergeFromGuest(
    userId: string,
    items: { productId: string; viewedAt: string }[],
  ) {
    if (!items.length) return;
    try {
      const parsed = items.map((i) => ({
        userId,
        productId: i.productId,
        viewedAt: new Date(i.viewedAt),
      }));
      await this.prisma.$transaction(async (tx) => {
        await this.repo.mergeMany(parsed, tx);
        const count = await this.repo.count(userId, tx);
        if (count > MAX_ITEMS)
          await this.repo.trimToLimit(userId, MAX_ITEMS, tx);
      });
    } catch (error) {
      this.logger.error(
        { userId, itemCount: items.length, error },
        'Guest merge failed',
      );
      throw error;
    }
  }
}

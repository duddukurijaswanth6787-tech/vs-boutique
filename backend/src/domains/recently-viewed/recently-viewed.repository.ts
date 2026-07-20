import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';

// ponytail: optional tx param on transactional methods — service passes tx client for atomicity
type TxClient = any;

@Injectable()
export class RecentlyViewedRepository {
  constructor(private readonly prisma: PrismaService) {}

  findWithProduct(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where = {
      userId,
      product: {
        deletedAt: null,
        isPublished: true,
        status: { not: 'DRAFT' },
        visibility: 'VISIBLE',
      },
    };
    return this.prisma.$transaction(async (tx) => {
      const [data, total] = await Promise.all([
        tx.recentlyViewed.findMany({
          where,
          skip,
          take: limit,
          orderBy: { viewedAt: 'desc' },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                basePrice: true,
                salePrice: true,
              },
            },
          },
        }),
        tx.recentlyViewed.count({ where }),
      ]);
      return { data, total };
    });
  }

  findByUserAndProduct(userId: string, productId: string) {
    return this.prisma.recentlyViewed.findUnique({
      where: { userId_productId: { userId, productId } },
    });
  }

  upsert(userId: string, productId: string, tx?: TxClient) {
    const c = tx || this.prisma;
    return c.recentlyViewed.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId },
      update: { viewedAt: new Date() },
    });
  }

  deleteAll(userId: string) {
    return this.prisma.recentlyViewed.deleteMany({ where: { userId } });
  }

  deleteOne(userId: string, productId: string) {
    return this.prisma.recentlyViewed.delete({
      where: { userId_productId: { userId, productId } },
    });
  }

  count(userId: string, tx?: TxClient) {
    const c = tx || this.prisma;
    return c.recentlyViewed.count({ where: { userId } });
  }

  trimToLimit(userId: string, limit: number, tx: TxClient) {
    return tx.$executeRaw`
      DELETE FROM recently_viewed
      WHERE id IN (
        SELECT id FROM (
          SELECT id, ROW_NUMBER() OVER (ORDER BY viewed_at DESC) AS rn
          FROM recently_viewed
          WHERE user_id = ${userId}::uuid
        ) sub
        WHERE sub.rn > ${limit}
      )
    `;
  }

  mergeMany(
    data: { userId: string; productId: string; viewedAt: Date }[],
    tx: TxClient,
  ) {
    if (!data.length) return;
    const rows = data
      .map(
        (_, i) => `($${i * 3 + 1}::uuid, $${i * 3 + 2}::uuid, $${i * 3 + 3})`,
      )
      .join(', ');
    const params = data.flatMap((d) => [d.userId, d.productId, d.viewedAt]);
    return tx.$executeRawUnsafe(
      `INSERT INTO recently_viewed (user_id, product_id, viewed_at) VALUES ${rows} ON CONFLICT (user_id, product_id) DO UPDATE SET viewed_at = GREATEST(recently_viewed.viewed_at, EXCLUDED.viewed_at)`,
      ...params,
    );
  }
}

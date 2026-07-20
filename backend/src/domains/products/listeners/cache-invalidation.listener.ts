import { Injectable, OnModuleInit } from '@nestjs/common';
import { AppEventEmitter } from '@common/events/event-emitter.service';
import { CacheService } from '@infrastructure/redis/cache.service';
import { PrismaService } from '@database/prisma.service';

@Injectable()
export class CacheInvalidationListener implements OnModuleInit {
  constructor(
    private readonly eventEmitter: AppEventEmitter,
    private readonly cacheService: CacheService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit(): void {
    this.eventEmitter.on(
      'cache.invalidate.product.details',
      (payload: { productId: string }) => {
        if (payload?.productId) {
          void this.cacheService.del(`product:details:${payload.productId}`);
        }
      },
    );

    this.eventEmitter.on(
      'cache.invalidate.variant.details',
      async (payload: { variantId: string }) => {
        try {
          if (payload?.variantId) {
            const variant = await this.prisma.productVariant.findUnique({
              where: { id: payload.variantId },
              select: { productId: true },
            });
            if (variant?.productId) {
              void this.cacheService.del(
                `product:details:${variant.productId}`,
              );
            }
          }
        } catch {
          // ponytail: fire-and-forget, cache miss on next read is acceptable
        }
      },
    );

    this.eventEmitter.on('cache.invalidate.all.details', () => {
      try {
        void this.cacheService.delPattern('product:details:*');
        // ponytail: homepage aggregation depends on many entities; wipe on any write
        void this.cacheService.del('home:page');
      } catch {
        // ponytail: fire-and-forget
      }
    });

    this.eventEmitter.on('cache.invalidate.product.details', () => {
      try {
        // ponytail: product writes also affect homepage product sections
        void this.cacheService.del('home:page');
      } catch {
        // ponytail: fire-and-forget
      }
    });
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class WishlistRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByCustomerId(customerId: string) {
    return this.prisma.wishlist.findFirst({
      where: { customerId },
      include: { _count: { select: { items: true } } },
    });
  }

  async createDefault(customerId: string) {
    return this.prisma.wishlist.create({
      data: { customerId, name: 'Default' },
      include: { _count: { select: { items: true } } },
    });
  }

  async findItems(
    wishlistId: string,
    params: { search?: string; page: number; limit: number },
  ) {
    const { search, page, limit } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.WishlistItemWhereInput = { wishlistId };
    if (search) {
      where.product = {
        name: { contains: search, mode: 'insensitive' },
      };
    }
    const [data, total] = await Promise.all([
      this.prisma.wishlistItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { product: { select: { id: true, name: true } } },
      }),
      this.prisma.wishlistItem.count({ where }),
    ]);
    return {
      data,
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

  async findItem(wishlistId: string, productId: string) {
    return this.prisma.wishlistItem.findUnique({
      where: { wishlistId_productId: { wishlistId, productId } },
    });
  }

  async addItem(data: {
    wishlistId: string;
    productId: string;
    variantId?: string;
    notes?: string;
  }) {
    return this.prisma.wishlistItem.create({ data });
  }

  async removeItem(wishlistId: string, productId: string) {
    return this.prisma.wishlistItem.delete({
      where: { wishlistId_productId: { wishlistId, productId } },
    });
  }

  async getItemCount(wishlistId: string) {
    return this.prisma.wishlistItem.count({ where: { wishlistId } });
  }
}

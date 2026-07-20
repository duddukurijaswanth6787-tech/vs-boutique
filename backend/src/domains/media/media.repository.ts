import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class MediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    productId?: string;
    variantId?: string;
    mediaType?: string;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) {
    const { productId, variantId, mediaType, page, limit, sortBy, sortOrder } =
      params;
    const where: Prisma.ProductMediaWhereInput = { deletedAt: null };
    if (productId) where.productId = productId;
    if (variantId) where.variantId = variantId;
    if (mediaType) where.mediaType = mediaType;

    const [data, total] = await Promise.all([
      this.prisma.productMedia.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.productMedia.count({ where }),
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

  async findById(id: string) {
    return this.prisma.productMedia.findUnique({ where: { id } });
  }

  async findPrimary(productId: string, variantId?: string) {
    const where: Prisma.ProductMediaWhereInput = {
      productId,
      isPrimary: true,
      deletedAt: null,
    };
    if (variantId) where.variantId = variantId;
    return this.prisma.productMedia.findFirst({ where });
  }

  async create(data: Prisma.ProductMediaCreateInput) {
    return this.prisma.productMedia.create({ data });
  }

  async update(id: string, data: Prisma.ProductMediaUpdateInput) {
    return this.prisma.productMedia.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    return this.prisma.productMedia.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ARCHIVED' },
    });
  }

  async restore(id: string) {
    return this.prisma.productMedia.update({
      where: { id },
      data: { deletedAt: null, status: 'ACTIVE' },
    });
  }

  async clearPrimary(productId: string, variantId?: string) {
    const where: Prisma.ProductMediaWhereInput = { productId, isPrimary: true };
    if (variantId) where.variantId = variantId;
    await this.prisma.productMedia.updateMany({
      where,
      data: { isPrimary: false },
    });
  }

  async reorder(items: { id: string; displayOrder: number }[]) {
    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.productMedia.update({
          where: { id: item.id },
          data: { displayOrder: item.displayOrder },
        }),
      ),
    );
  }
}

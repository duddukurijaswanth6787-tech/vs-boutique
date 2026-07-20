import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductVariantsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    productId?: string;
    status?: string;
    isActive?: boolean;
    isDefault?: boolean;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) {
    const {
      productId,
      status,
      isActive,
      isDefault,
      page,
      limit,
      sortBy,
      sortOrder,
    } = params;
    const where: Prisma.ProductVariantWhereInput = { deletedAt: null };
    if (productId) where.productId = productId;
    if (status) where.status = status;
    if (isActive !== undefined) where.isActive = isActive;
    if (isDefault !== undefined) where.isDefault = isDefault;

    const include: Prisma.ProductVariantInclude = {
      attributeValues: {
        include: {
          attribute: { select: { id: true, name: true, type: true } },
          option: { select: { id: true, label: true, value: true } },
        },
      },
    };

    const [data, total] = await Promise.all([
      this.prisma.productVariant.findMany({
        where,
        include,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.productVariant.count({ where }),
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
    return this.prisma.productVariant.findUnique({
      where: { id },
      include: {
        attributeValues: {
          include: {
            attribute: { select: { id: true, name: true, type: true } },
            option: { select: { id: true, label: true, value: true } },
          },
        },
        inventory: true,
      },
    });
  }

  async findBySku(sku: string) {
    return this.prisma.productVariant.findUnique({ where: { sku } });
  }
  async findByBarcode(barcode: string) {
    return this.prisma.productVariant.findUnique({ where: { barcode } });
  }

  async findDefaultByProduct(productId: string) {
    return this.prisma.productVariant.findFirst({
      where: { productId, isDefault: true, deletedAt: null },
    });
  }

  async create(data: Prisma.ProductVariantCreateInput) {
    return this.prisma.productVariant.create({ data });
  }

  async update(id: string, data: Prisma.ProductVariantUpdateInput) {
    return this.prisma.productVariant.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    return this.prisma.productVariant.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ARCHIVED', isActive: false },
    });
  }

  async restore(id: string) {
    return this.prisma.productVariant.update({
      where: { id },
      data: { deletedAt: null, status: 'ACTIVE', isActive: true },
    });
  }

  async assignAttributeValues(
    variantId: string,
    entries: {
      attributeId: string;
      attributeOptionId?: string;
      value?: string;
    }[],
  ) {
    await this.prisma.variantAttributeValue.createMany({
      data: entries.map((e) => ({
        variantId,
        attributeId: e.attributeId,
        attributeOptionId: e.attributeOptionId,
        value: e.value,
      })),
      skipDuplicates: true,
    });
  }

  async removeAttributeValue(variantId: string, attributeId: string) {
    await this.prisma.variantAttributeValue.delete({
      where: { variantId_attributeId: { variantId, attributeId } },
    });
  }

  async clearDefaultForProduct(productId: string) {
    await this.prisma.productVariant.updateMany({
      where: { productId, isDefault: true },
      data: { isDefault: false },
    });
  }
}

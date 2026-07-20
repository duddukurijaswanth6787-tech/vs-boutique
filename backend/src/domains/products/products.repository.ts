import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Product CRUD ───────────────────────────────────────

  async findAll(params: {
    search?: string;
    brandId?: string;
    status?: string;
    visibility?: string;
    type?: string;
    gender?: string;
    ageGroup?: string;
    occasion?: string;
    season?: string;
    isFeatured?: boolean;
    isNewArrival?: boolean;
    isBestSeller?: boolean;
    isPublished?: boolean;
    minPrice?: number;
    maxPrice?: number;
    categoryId?: string;
    createdBy?: string;
    updatedBy?: string;
    tags?: string;
    createdAfter?: Date;
    createdBefore?: Date;
    deleted?: string;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) {
    const {
      search,
      brandId,
      status,
      visibility,
      type,
      gender,
      ageGroup,
      occasion,
      season,
      isFeatured,
      isNewArrival,
      isBestSeller,
      isPublished,
      minPrice,
      maxPrice,
      categoryId,
      createdBy,
      updatedBy,
      tags,
      createdAfter,
      createdBefore,
      page,
      limit,
      sortBy,
      sortOrder,
    } = params;
    const where: Prisma.ProductWhereInput = {};
    if (!params.deleted) where.deletedAt = null;
    else if (params.deleted === 'only') where.deletedAt = { not: null };

    if (search)
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
        { searchKeywords: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    if (brandId) where.brandId = brandId;
    if (status) where.status = status;
    if (visibility) where.visibility = visibility;
    if (type) where.type = type;
    if (gender) where.gender = gender;
    if (ageGroup) where.ageGroup = ageGroup;
    if (occasion) where.occasion = occasion;
    if (season) where.season = season;
    if (isFeatured !== undefined) where.isFeatured = isFeatured;
    if (isNewArrival !== undefined) where.isNewArrival = isNewArrival;
    if (isBestSeller !== undefined) where.isBestSeller = isBestSeller;
    if (isPublished !== undefined) where.isPublished = isPublished;
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.basePrice = {};
      if (minPrice !== undefined) where.basePrice.gte = minPrice;
      if (maxPrice !== undefined) where.basePrice.lte = maxPrice;
    }
    if (categoryId) {
      where.categories = { some: { categoryId } };
    }
    if (createdBy) where.createdBy = createdBy;
    if (updatedBy) where.updatedBy = updatedBy;
    if (tags) where.tags = { hasSome: tags.split(',') };
    if (createdAfter)
      where.createdAt = { ...(where.createdAt as any), gte: createdAfter };
    if (createdBefore)
      where.createdAt = { ...(where.createdAt as any), lte: createdBefore };

    const include: Prisma.ProductInclude = {
      brand: { select: { id: true, name: true, slug: true } },
      media: {
        where: { deletedAt: null },
        orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }],
      },
    };

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.product.count({ where }),
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
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        brand: { select: { id: true, name: true, slug: true } },
        media: {
          where: { deletedAt: null },
          orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }],
        },
        categories: {
          include: {
            category: { select: { id: true, name: true, slug: true } },
          },
        },
        attributeValues: {
          include: {
            attribute: { select: { id: true, name: true, type: true } },
          },
        },
        relatedTo: {
          include: { relatedProduct: { select: { id: true, name: true } } },
        },
        relatedFrom: {
          include: { product: { select: { id: true, name: true } } },
        },
      },
    });
  }

  async findBySku(sku: string) {
    return this.prisma.product.findUnique({ where: { sku } });
  }
  async findBySlug(slug: string) {
    return this.prisma.product.findUnique({ where: { slug } });
  }
  async findByBarcode(barcode: string) {
    return this.prisma.product.findUnique({ where: { barcode } });
  }

  // ponytail: single round-trip aggregate for admin product stat cards
  async getStats() {
    const base: Prisma.ProductWhereInput = { deletedAt: null };
    const [total, active, draft, outOfStock, lowStock] = await Promise.all([
      this.prisma.product.count({ where: base }),
      this.prisma.product.count({ where: { ...base, status: 'ACTIVE' } }),
      this.prisma.product.count({ where: { ...base, status: 'DRAFT' } }),
      this.prisma.product.count({
        where: { ...base, trackInventory: true, minimumOrderQuantity: 0 },
      }),
      this.prisma.product.count({
        where: {
          ...base,
          trackInventory: true,
          minimumOrderQuantity: { gt: 0, lt: 20 },
        },
      }),
    ]);
    return { total, active, draft, outOfStock, lowStock };
  }

  async create(data: Prisma.ProductCreateInput) {
    return this.prisma.product.create({ data });
  }

  async update(id: string, data: Prisma.ProductUpdateInput) {
    return this.prisma.product.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ARCHIVED' },
    });
  }

  async restore(id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: null, status: 'DRAFT' },
    });
  }

  // ─── Category assignments ───────────────────────────────

  async assignCategories(productId: string, categoryIds: string[]) {
    await this.prisma.productCategory.createMany({
      data: categoryIds.map((categoryId) => ({ productId, categoryId })),
      skipDuplicates: true,
    });
  }

  async removeCategory(productId: string, categoryId: string) {
    await this.prisma.productCategory.delete({
      where: { productId_categoryId: { productId, categoryId } },
    });
  }

  // ─── Attribute assignments ──────────────────────────────

  async assignAttributes(
    productId: string,
    entries: { attributeId: string; value?: string }[],
  ) {
    await this.prisma.productAttribute.createMany({
      data: entries.map((e) => ({
        productId,
        attributeId: e.attributeId,
        value: e.value,
      })),
      skipDuplicates: true,
    });
  }

  async removeAttribute(productId: string, attributeId: string) {
    await this.prisma.productAttribute.delete({
      where: { productId_attributeId: { productId, attributeId } },
    });
  }

  // ─── Related products ───────────────────────────────────

  async assignRelatedProducts(productId: string, relatedProductIds: string[]) {
    await this.prisma.productRelatedProduct.createMany({
      data: relatedProductIds.map((rpid) => ({
        productId,
        relatedProductId: rpid,
      })),
      skipDuplicates: true,
    });
  }

  async removeRelatedProduct(productId: string, relatedProductId: string) {
    await this.prisma.productRelatedProduct.delete({
      where: { productId_relatedProductId: { productId, relatedProductId } },
    });
  }

  // ─── Product Details (aggregate) ────────────────────────

  // ponytail: one query with all includes — Prisma joins beat N+1 round trips
  async findDetailsById(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        brand: true,
        categories: {
          include: {
            category: {
              include: {
                parent: { select: { id: true, name: true, slug: true } },
              },
            },
          },
        },
        media: {
          where: { deletedAt: null },
          orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }],
        },
        attributeValues: {
          include: { attribute: true },
        },
        variants: {
          where: { deletedAt: null },
          orderBy: [{ isDefault: 'desc' }, { displayOrder: 'asc' }],
          include: {
            attributeValues: {
              include: { attribute: true, option: true },
            },
            inventory: true,
            media: {
              where: { deletedAt: null },
              orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }],
            },
          },
        },
        relatedTo: {
          include: {
            relatedProduct: {
              include: {
                brand: { select: { id: true, name: true, slug: true } },
                media: {
                  where: { isPrimary: true, deletedAt: null },
                  take: 1,
                },
                variants: {
                  where: { isDefault: true, deletedAt: null },
                  include: { inventory: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });
  }

  // ponytail: simple category-based similar products; upgrade to ML-based when catalog > 10k SKUs
  async findSimilarProducts(
    productId: string,
    categoryIds: string[],
    limit = 8,
  ) {
    if (!categoryIds.length) return [];
    return this.prisma.product.findMany({
      where: {
        id: { not: productId },
        deletedAt: null,
        isPublished: true,
        categories: { some: { categoryId: { in: categoryIds } } },
      },
      include: {
        brand: { select: { id: true, name: true, slug: true } },
        media: {
          where: { isPrimary: true, deletedAt: null },
          take: 1,
        },
        variants: {
          where: { isDefault: true, deletedAt: null },
          include: { inventory: true },
          take: 1,
        },
      },
      take: limit,
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    });
  }

  // ponytail: walks parent chain up to 3 levels; deeper hierarchies need recursive CTE
  async getBreadcrumbs(
    categoryId: string,
  ): Promise<{ id: string; name: string; slug: string }[]> {
    const crumbs: { id: string; name: string; slug: string }[] = [];
    let current = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, name: true, slug: true, parentId: true },
    });
    let depth = 0;
    while (current && depth < 4) {
      crumbs.unshift({
        id: current.id,
        name: current.name,
        slug: current.slug,
      });
      if (current.parentId) {
        current = await this.prisma.category.findUnique({
          where: { id: current.parentId },
          select: { id: true, name: true, slug: true, parentId: true },
        });
      } else {
        current = null;
      }
      depth++;
    }
    return crumbs;
  }
}

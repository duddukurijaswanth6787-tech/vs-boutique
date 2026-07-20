import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    search?: string;
    status?: string;
    parentId?: string;
    isFeatured?: boolean;
    isMenuVisible?: boolean;
    isVisible?: boolean;
    deleted?: string;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) {
    const {
      page,
      limit,
      sortBy,
      sortOrder,
      search,
      status,
      parentId,
      isFeatured,
      isMenuVisible,
      isVisible,
    } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.CategoryWhereInput = {};
    if (!params.deleted) where.deletedAt = null;
    else if (params.deleted === 'only') where.deletedAt = { not: null };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (parentId !== undefined && parentId !== '') {
      if (parentId === 'ROOT' || parentId === 'null') {
        where.parentId = null;
      } else {
        where.parentId = parentId;
      }
    }
    if (isFeatured !== undefined) where.isFeatured = isFeatured;
    if (isMenuVisible !== undefined) where.isMenuVisible = isMenuVisible;
    if (isVisible !== undefined) where.isVisible = isVisible;

    const [data, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          parent: {
            select: { id: true, name: true },
          },
          _count: {
            select: { productMappings: true },
          },
        },
      }),
      this.prisma.category.count({ where }),
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

  async getSummary() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [total, active, inactive, createdThisMonth, withProducts] =
      await Promise.all([
        this.prisma.category.count({ where: { deletedAt: null } }),
        this.prisma.category.count({
          where: { deletedAt: null, status: 'ACTIVE' },
        }),
        this.prisma.category.count({
          where: { deletedAt: null, status: 'INACTIVE' },
        }),
        this.prisma.category.count({
          where: { deletedAt: null, createdAt: { gte: startOfMonth } },
        }),
        this.prisma.category.count({
          where: {
            deletedAt: null,
            productMappings: { some: {} },
          },
        }),
      ]);

    const activePercentage =
      total > 0 ? parseFloat(((active / total) * 100).toFixed(1)) : 0;
    const inactivePercentage =
      total > 0 ? parseFloat(((inactive / total) * 100).toFixed(1)) : 0;
    const withProductsPercentage =
      total > 0 ? parseFloat(((withProducts / total) * 100).toFixed(1)) : 0;

    return {
      totalCategories: total,
      activeCategories: active,
      activePercentage,
      inactiveCategories: inactive,
      inactivePercentage,
      categoriesWithProducts: withProducts,
      categoriesWithProductsPercentage: withProductsPercentage,
      createdThisMonth,
    };
  }

  async findById(id: string) {
    return this.prisma.category.findUnique({ where: { id } });
  }

  async findByIds(ids: string[]) {
    return this.prisma.category.findMany({
      where: { id: { in: ids }, deletedAt: null },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.category.findUnique({ where: { slug } });
  }

  async findAllActive() {
    return this.prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: [{ level: 'asc' }, { displayOrder: 'asc' }],
    });
  }

  async findChildren(parentId: string) {
    return this.prisma.category.findMany({
      where: { parentId, deletedAt: null },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findDescendants(path: string) {
    return this.prisma.category.findMany({
      where: { path: { startsWith: path }, deletedAt: null },
    });
  }

  async create(data: Prisma.CategoryCreateInput) {
    return this.prisma.category.create({ data });
  }

  async update(id: string, data: Prisma.CategoryUpdateInput) {
    return this.prisma.category.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    return this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ARCHIVED' },
    });
  }

  async restore(id: string) {
    return this.prisma.category.update({
      where: { id },
      data: { deletedAt: null, status: 'ACTIVE' },
    });
  }

  async countByParentId(parentId: string) {
    return this.prisma.category.count({ where: { parentId, deletedAt: null } });
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class BrandsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    search?: string;
    status?: string;
    isFeatured?: boolean;
    isVisible?: boolean;
    deleted?: string;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) {
    const {
      search,
      status,
      isFeatured,
      isVisible,
      page,
      limit,
      sortBy,
      sortOrder,
    } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.BrandWhereInput = {};
    if (!params.deleted) where.deletedAt = null;
    else if (params.deleted === 'only') where.deletedAt = { not: null };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (isFeatured !== undefined) where.isFeatured = isFeatured;
    if (isVisible !== undefined) where.isVisible = isVisible;

    const [data, total] = await Promise.all([
      this.prisma.brand.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.brand.count({ where }),
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
    return this.prisma.brand.findUnique({ where: { id } });
  }

  async findBySlug(slug: string) {
    return this.prisma.brand.findUnique({ where: { slug } });
  }

  async create(data: Prisma.BrandCreateInput) {
    return this.prisma.brand.create({ data });
  }

  async update(id: string, data: Prisma.BrandUpdateInput) {
    return this.prisma.brand.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    return this.prisma.brand.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ARCHIVED' },
    });
  }

  async restore(id: string) {
    return this.prisma.brand.update({
      where: { id },
      data: { deletedAt: null, status: 'ACTIVE' },
    });
  }
}

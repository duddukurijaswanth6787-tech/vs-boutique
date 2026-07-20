import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CmsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBanners(params: {
    placement?: string;
    isActive?: boolean;
    page: number;
    limit: number;
  }) {
    const { placement, isActive, page, limit } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.BannerWhereInput = { deletedAt: null };
    if (placement) where.placement = placement;
    if (isActive !== undefined) where.isActive = isActive;

    const [data, total] = await Promise.all([
      this.prisma.banner.findMany({
        where,
        skip,
        take: limit,
        orderBy: { displayOrder: 'asc' },
      }),
      this.prisma.banner.count({ where }),
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

  async findBannerById(id: string) {
    return this.prisma.banner.findUnique({ where: { id } });
  }

  async createBanner(data: Prisma.BannerCreateInput) {
    return this.prisma.banner.create({ data });
  }

  async updateBanner(id: string, data: Prisma.BannerUpdateInput) {
    return this.prisma.banner.update({ where: { id }, data });
  }

  async findPages(params: {
    search?: string;
    status?: string;
    page: number;
    limit: number;
  }) {
    const { search, status, page, limit } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.CmsPageWhereInput = { deletedAt: null };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.cmsPage.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.cmsPage.count({ where }),
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

  async findPageById(id: string) {
    return this.prisma.cmsPage.findUnique({ where: { id } });
  }

  async findPageBySlug(slug: string) {
    return this.prisma.cmsPage.findUnique({ where: { slug } });
  }

  async createPage(data: Prisma.CmsPageCreateInput) {
    return this.prisma.cmsPage.create({ data });
  }

  async updatePage(id: string, data: Prisma.CmsPageUpdateInput) {
    return this.prisma.cmsPage.update({ where: { id }, data });
  }

  async findSections() {
    return this.prisma.cmsSection.findMany({
      orderBy: { displayOrder: 'asc' },
    });
  }

  async createSection(data: Prisma.CmsSectionCreateInput) {
    return this.prisma.cmsSection.create({ data });
  }
}

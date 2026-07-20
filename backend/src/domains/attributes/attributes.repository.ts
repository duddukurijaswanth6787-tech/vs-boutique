import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AttributesRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Groups ─────────────────────────────────────────────

  async findAllGroups(params: {
    search?: string;
    status?: string;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) {
    const { search, status, page, limit, sortBy, sortOrder } = params;
    const where: Prisma.AttributeGroupWhereInput = { deletedAt: null };
    if (search)
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    if (status) where.status = status;
    const [data, total] = await Promise.all([
      this.prisma.attributeGroup.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.attributeGroup.count({ where }),
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

  async findGroupById(id: string) {
    return this.prisma.attributeGroup.findUnique({ where: { id } });
  }

  async findGroupBySlug(slug: string) {
    return this.prisma.attributeGroup.findUnique({ where: { slug } });
  }

  async createGroup(data: Prisma.AttributeGroupCreateInput) {
    return this.prisma.attributeGroup.create({ data });
  }

  async updateGroup(id: string, data: Prisma.AttributeGroupUpdateInput) {
    return this.prisma.attributeGroup.update({ where: { id }, data });
  }

  async softDeleteGroup(id: string) {
    return this.prisma.attributeGroup.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ARCHIVED' },
    });
  }

  async restoreGroup(id: string) {
    return this.prisma.attributeGroup.update({
      where: { id },
      data: { deletedAt: null, status: 'ACTIVE' },
    });
  }

  // ─── Attributes ─────────────────────────────────────────

  async findAllAttributes(params: {
    groupId?: string;
    search?: string;
    status?: string;
    type?: string;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) {
    const { groupId, search, status, type, page, limit, sortBy, sortOrder } =
      params;
    const where: Prisma.AttributeWhereInput = { deletedAt: null };
    if (groupId) where.groupId = groupId;
    if (search)
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    if (status) where.status = status;
    if (type) where.type = type;
    const [data, total] = await Promise.all([
      this.prisma.attribute.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.attribute.count({ where }),
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

  async findAttributeById(id: string) {
    return this.prisma.attribute.findUnique({ where: { id } });
  }

  async findAttributeBySlug(groupId: string, slug: string) {
    return this.prisma.attribute.findFirst({ where: { groupId, slug } });
  }

  async createAttribute(data: Prisma.AttributeCreateInput) {
    return this.prisma.attribute.create({ data });
  }

  async updateAttribute(id: string, data: Prisma.AttributeUpdateInput) {
    return this.prisma.attribute.update({ where: { id }, data });
  }

  async softDeleteAttribute(id: string) {
    return this.prisma.attribute.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ARCHIVED' },
    });
  }

  async restoreAttribute(id: string) {
    return this.prisma.attribute.update({
      where: { id },
      data: { deletedAt: null, status: 'ACTIVE' },
    });
  }

  // ─── Options ────────────────────────────────────────────

  async findAllOptions(params: {
    attributeId?: string;
    page: number;
    limit: number;
  }) {
    const { attributeId, page, limit } = params;
    const where: Prisma.AttributeOptionWhereInput = {
      ...(attributeId ? { attributeId } : {}),
      deletedAt: null,
    };
    const [data, total] = await Promise.all([
      this.prisma.attributeOption.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { displayOrder: 'asc' },
      }),
      this.prisma.attributeOption.count({ where }),
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

  async findOptionById(id: string) {
    return this.prisma.attributeOption.findUnique({ where: { id } });
  }

  async createOption(data: Prisma.AttributeOptionCreateInput) {
    return this.prisma.attributeOption.create({ data });
  }

  async updateOption(id: string, data: Prisma.AttributeOptionUpdateInput) {
    return this.prisma.attributeOption.update({ where: { id }, data });
  }

  async softDeleteOption(id: string) {
    return this.prisma.attributeOption.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ARCHIVED' },
    });
  }

  async restoreOption(id: string) {
    return this.prisma.attributeOption.update({
      where: { id },
      data: { deletedAt: null, status: 'ACTIVE' },
    });
  }

  // ─── Category Mappings ──────────────────────────────────

  async findAllCategoryMappings(categoryId: string) {
    const data = await this.prisma.categoryAttribute.findMany({
      where: { categoryId },
      orderBy: { displayOrder: 'asc' },
    });
    return { data };
  }

  async findCategoryMapping(categoryId: string, attributeId: string) {
    return this.prisma.categoryAttribute.findUnique({
      where: { categoryId_attributeId: { categoryId, attributeId } },
    });
  }

  async createCategoryMapping(data: Prisma.CategoryAttributeCreateInput) {
    return this.prisma.categoryAttribute.create({ data });
  }

  async updateCategoryMapping(
    categoryId: string,
    attributeId: string,
    data: Prisma.CategoryAttributeUpdateInput,
  ) {
    return this.prisma.categoryAttribute.update({
      where: { categoryId_attributeId: { categoryId, attributeId } },
      data,
    });
  }

  async deleteCategoryMapping(categoryId: string, attributeId: string) {
    return this.prisma.categoryAttribute.delete({
      where: { categoryId_attributeId: { categoryId, attributeId } },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AiAdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findTemplates(params: {
    search?: string;
    isActive?: boolean;
    page: number;
    limit: number;
  }) {
    const { search, isActive, page, limit } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.AiPromptTemplateWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (isActive !== undefined) where.isActive = isActive;

    const [data, total] = await Promise.all([
      this.prisma.aiPromptTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.aiPromptTemplate.count({ where }),
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

  async findTemplateById(id: string) {
    return this.prisma.aiPromptTemplate.findUnique({ where: { id } });
  }

  async findTemplateByName(name: string) {
    return this.prisma.aiPromptTemplate.findFirst({ where: { name } });
  }

  async createTemplate(data: Prisma.AiPromptTemplateCreateInput) {
    return this.prisma.aiPromptTemplate.create({ data });
  }

  async updateTemplate(id: string, data: Prisma.AiPromptTemplateUpdateInput) {
    return this.prisma.aiPromptTemplate.update({ where: { id }, data });
  }

  async getUsageLogs(params: { page: number; limit: number }) {
    const { page, limit } = params;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.aiUsageLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.aiUsageLog.count(),
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

  async createUsageLog(data: Prisma.AiUsageLogCreateInput) {
    return this.prisma.aiUsageLog.create({ data });
  }
}

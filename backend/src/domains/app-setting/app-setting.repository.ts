import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AppSettingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { group?: string; page: number; limit: number }) {
    const { group, page, limit } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.AppSettingWhereInput = {};
    if (group) where.group = group;

    const [data, total] = await Promise.all([
      this.prisma.appSetting.findMany({
        where,
        skip,
        take: limit,
        orderBy: { key: 'asc' },
      }),
      this.prisma.appSetting.count({ where }),
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

  async findByKey(key: string) {
    return this.prisma.appSetting.findUnique({ where: { key } });
  }

  async create(data: Prisma.AppSettingCreateInput) {
    return this.prisma.appSetting.create({ data });
  }

  async update(id: string, data: Prisma.AppSettingUpdateInput) {
    return this.prisma.appSetting.update({ where: { id }, data });
  }

  async findById(id: string) {
    return this.prisma.appSetting.findUnique({ where: { id } });
  }

  async getByKey(key: string): Promise<string | null> {
    const setting = await this.prisma.appSetting.findUnique({
      where: { key },
      select: { value: true },
    });
    return setting?.value ?? null;
  }
}

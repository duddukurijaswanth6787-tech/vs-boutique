import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';

@Injectable()
export class PermissionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(module?: string) {
    return this.prisma.permission.findMany({
      where: module ? { module } : undefined,
      orderBy: { module: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.permission.findUnique({ where: { id } });
  }

  async findByCode(code: string) {
    return this.prisma.permission.findUnique({ where: { code } });
  }

  async create(data: {
    code: string;
    name: string;
    description?: string;
    module: string;
    scope?: string;
  }) {
    return this.prisma.permission.create({ data: data as any });
  }

  async update(
    id: string,
    data: { name?: string; description?: string; isActive?: boolean },
  ) {
    return this.prisma.permission.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.permission.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

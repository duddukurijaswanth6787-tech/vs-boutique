import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';

@Injectable()
export class RolesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.role.findMany({
      include: { rolePermissions: { include: { permission: true } } },
      orderBy: { hierarchy: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.role.findUnique({
      where: { id },
      include: { rolePermissions: { include: { permission: true } } },
    });
  }

  async findByName(name: string) {
    return this.prisma.role.findUnique({ where: { name } });
  }

  async create(data: {
    name: string;
    displayName: string;
    description?: string;
    scope?: string;
    hierarchy?: number;
  }) {
    return this.prisma.role.create({ data: data as any });
  }

  async update(
    id: string,
    data: {
      displayName?: string;
      description?: string;
      hierarchy?: number;
      isActive?: boolean;
    },
  ) {
    return this.prisma.role.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.role.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async assignPermissions(roleId: string, permissionIds: string[]) {
    await this.prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
      skipDuplicates: true,
    });
  }

  async removePermission(roleId: string, permissionId: string) {
    await this.prisma.rolePermission.delete({
      where: { roleId_permissionId: { roleId, permissionId } },
    });
  }
}

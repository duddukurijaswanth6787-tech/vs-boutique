import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class WarehouseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    search?: string;
    status?: string;
    isDefault?: boolean;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) {
    const { search, status, isDefault, page, limit, sortBy, sortOrder } =
      params;
    const where: Prisma.WarehouseWhereInput = { deletedAt: null };
    if (search)
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    if (status) where.status = status;
    if (isDefault !== undefined) where.isDefault = isDefault;

    const [data, total] = await Promise.all([
      this.prisma.warehouse.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.warehouse.count({ where }),
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
    return this.prisma.warehouse.findUnique({
      where: { id },
      include: {
        locations: true,
        inventories: {
          include: {
            variant: { select: { id: true, sku: true, title: true } },
          },
        },
      },
    });
  }

  async findByCode(code: string) {
    return this.prisma.warehouse.findUnique({ where: { code } });
  }

  async create(data: Prisma.WarehouseCreateInput) {
    return this.prisma.warehouse.create({ data });
  }

  async update(id: string, data: Prisma.WarehouseUpdateInput) {
    return this.prisma.warehouse.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    return this.prisma.warehouse.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ARCHIVED' },
    });
  }

  async restore(id: string) {
    return this.prisma.warehouse.update({
      where: { id },
      data: { deletedAt: null, status: 'ACTIVE' },
    });
  }

  async clearDefault() {
    await this.prisma.warehouse.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });
  }

  // ─── Locations ──────────────────────────────────────────

  async createLocation(data: Prisma.WarehouseLocationCreateInput) {
    return this.prisma.warehouseLocation.create({ data });
  }

  async findLocations(warehouseId: string) {
    return this.prisma.warehouseLocation.findMany({
      where: { warehouseId, status: 'ACTIVE' },
    });
  }

  // ─── Warehouse Inventory ────────────────────────────────

  async findWarehouseInventory(warehouseId: string, variantId: string) {
    return this.prisma.variantWarehouseInventory.findUnique({
      where: { warehouseId_variantId: { warehouseId, variantId } },
    });
  }

  async createWarehouseInventory(
    data: Prisma.VariantWarehouseInventoryCreateInput,
  ) {
    return this.prisma.variantWarehouseInventory.create({ data });
  }

  async updateWarehouseInventory(
    id: string,
    data: Prisma.VariantWarehouseInventoryUpdateInput,
  ) {
    return this.prisma.variantWarehouseInventory.update({
      where: { id },
      data,
    });
  }

  async findWarehouseInventories(warehouseId: string) {
    return this.prisma.variantWarehouseInventory.findMany({
      where: { warehouseId },
      include: { variant: { select: { id: true, sku: true, title: true } } },
    });
  }
}

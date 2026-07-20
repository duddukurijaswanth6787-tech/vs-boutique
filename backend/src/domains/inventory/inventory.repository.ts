import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class InventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    variantId?: string;
    stockStatus?: string;
    lowStock?: boolean;
    outOfStock?: boolean;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) {
    const {
      variantId,
      stockStatus,
      lowStock,
      outOfStock,
      page,
      limit,
      sortBy,
      sortOrder,
    } = params;
    const where: Prisma.InventoryWhereInput = {};
    if (variantId) where.variantId = variantId;
    if (stockStatus) where.stockStatus = stockStatus;
    if (lowStock) where.stockStatus = 'LOW_STOCK';
    if (outOfStock) where.stockStatus = 'OUT_OF_STOCK';

    const include: Prisma.InventoryInclude = {
      variant: {
        select: { id: true, sku: true, title: true, productId: true },
      },
    };

    const [data, total] = await Promise.all([
      this.prisma.inventory.findMany({
        where,
        include,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.inventory.count({ where }),
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
    return this.prisma.inventory.findUnique({
      where: { id },
      include: {
        variant: {
          select: { id: true, sku: true, title: true, productId: true },
        },
      },
    });
  }

  async findByVariantId(variantId: string) {
    return this.prisma.inventory.findUnique({ where: { variantId } });
  }

  async create(data: Prisma.InventoryCreateInput) {
    return this.prisma.inventory.create({ data });
  }

  async update(id: string, data: Prisma.InventoryUpdateInput) {
    return this.prisma.inventory.update({ where: { id }, data });
  }

  async updateStock(
    id: string,
    data: {
      availableQuantity?: number;
      reservedQuantity?: number;
      damagedQuantity?: number;
      returnedQuantity?: number;
      stockStatus?: string;
    },
  ) {
    return this.prisma.inventory.update({ where: { id }, data });
  }

  // ─── Movements ──────────────────────────────────────────

  async createMovement(data: Prisma.InventoryMovementCreateInput) {
    return this.prisma.inventoryMovement.create({ data });
  }

  async findMovements(params: {
    inventoryId?: string;
    variantId?: string;
    movementType?: string;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) {
    const {
      inventoryId,
      variantId,
      movementType,
      page,
      limit,
      sortBy,
      sortOrder,
    } = params;
    const where: Prisma.InventoryMovementWhereInput = {};
    if (inventoryId) where.inventoryId = inventoryId;
    if (variantId) where.variantId = variantId;
    if (movementType) where.movementType = movementType;

    const [data, total] = await Promise.all([
      this.prisma.inventoryMovement.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.inventoryMovement.count({ where }),
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

  async getStockSummary() {
    const inventories = await this.prisma.inventory.findMany({
      select: {
        stockStatus: true,
        availableQuantity: true,
        reservedQuantity: true,
      },
    });
    return {
      totalItems: inventories.length,
      inStock: inventories.filter((i) => i.stockStatus === 'IN_STOCK').length,
      lowStock: inventories.filter((i) => i.stockStatus === 'LOW_STOCK').length,
      outOfStock: inventories.filter((i) => i.stockStatus === 'OUT_OF_STOCK')
        .length,
      totalAvailable: inventories.reduce(
        (sum, i) => sum + i.availableQuantity,
        0,
      ),
      totalReserved: inventories.reduce(
        (sum, i) => sum + i.reservedQuantity,
        0,
      ),
    };
  }
}

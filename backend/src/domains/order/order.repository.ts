import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    search?: string;
    status?: string;
    customerId?: string;
    startDate?: string;
    endDate?: string;
    createdBy?: string;
    updatedBy?: string;
    createdAfter?: Date;
    createdBefore?: Date;
    minPrice?: number;
    maxPrice?: number;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) {
    const {
      search,
      status,
      customerId,
      startDate,
      endDate,
      createdBy,
      updatedBy,
      createdAfter,
      createdBefore,
      minPrice,
      maxPrice,
      page,
      limit,
      sortBy,
      sortOrder,
    } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.OrderWhereInput = { deletedAt: null };
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    if (createdBy) where.createdBy = createdBy;
    if (updatedBy) where.updatedBy = updatedBy;
    if (createdAfter)
      where.createdAt = { ...(where.createdAt as any), gte: createdAfter };
    if (createdBefore)
      where.createdAt = { ...(where.createdAt as any), lte: createdBefore };
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.grandTotal = {};
      if (minPrice !== undefined) where.grandTotal.gte = minPrice;
      if (maxPrice !== undefined) where.grandTotal.lte = maxPrice;
    }

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          customer: {
            include: {
              user: {
                select: { firstName: true, lastName: true, email: true },
              },
            },
          },
        },
      }),
      this.prisma.order.count({ where }),
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
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: {
                media: {
                  where: { deletedAt: null },
                  orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }],
                },
              },
            },
          },
        },
        addresses: true,
        timeline: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async findByOrderNumber(orderNumber: string) {
    return this.prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            product: {
              include: {
                media: {
                  where: { deletedAt: null },
                  orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }],
                },
              },
            },
          },
        },
        addresses: true,
        timeline: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async findByCustomerId(customerId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where: Prisma.OrderWhereInput = { customerId, deletedAt: null };
    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
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

  async getStatistics() {
    const statuses = [
      'PENDING',
      'PROCESSING',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
    ];
    const counts = await Promise.all(
      statuses.map((s) =>
        this.prisma.order.count({ where: { status: s, deletedAt: null } }),
      ),
    );
    const total = counts.reduce((a, b) => a + b, 0);
    return {
      total,
      pending: counts[0],
      processing: counts[1],
      shipped: counts[2],
      delivered: counts[3],
      cancelled: counts[4],
    };
  }

  async create(data: Prisma.OrderCreateInput) {
    return this.prisma.order.create({
      data,
      include: { items: true, addresses: true },
    });
  }

  async update(id: string, data: Prisma.OrderUpdateInput) {
    return this.prisma.order.update({ where: { id }, data });
  }

  async createTimeline(
    orderId: string,
    status: string,
    message?: string,
    createdBy?: string,
    metadata?: any,
  ) {
    return this.prisma.orderTimeline.create({
      data: { orderId, status, message, createdBy, metadata },
    });
  }

  async updateStatus(orderId: string, status: string, userId?: string) {
    const [order] = await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: { status },
      }),
      this.prisma.orderTimeline.create({
        data: {
          orderId,
          status,
          message: `Status changed to ${status}`,
          createdBy: userId,
        },
      }),
    ]);
    return order;
  }
}

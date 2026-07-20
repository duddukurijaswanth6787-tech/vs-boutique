import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';

@Injectable()
export class AuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId?: string;
    staffId?: string;
    action: string;
    module: string;
    resource: string;
    resourceId?: string;
    oldValue?: any;
    newValue?: any;
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
    correlationId?: string;
    status?: string;
    message?: string;
    metadata?: any;
  }) {
    return this.prisma.auditLog.create({ data: data as any });
  }

  async createMany(data: any[]) {
    return this.prisma.auditLog.createMany({ data: data as any });
  }

  async findAll(params: {
    module?: string;
    action?: string;
    userId?: string;
    staffId?: string;
    resourceId?: string;
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) {
    const {
      page,
      limit,
      sortBy,
      sortOrder,
      module,
      action,
      userId,
      staffId,
      resourceId,
      status,
      search,
      startDate,
      endDate,
    } = params;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (module) where.module = module;
    if (action) where.action = action;
    if (userId) where.userId = userId;
    if (staffId) where.staffId = staffId;
    if (resourceId) where.resourceId = resourceId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    if (search) {
      where.OR = [
        { message: { contains: search, mode: 'insensitive' } },
        { resource: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          userId: true,
          staffId: true,
          action: true,
          module: true,
          resource: true,
          resourceId: true,
          ipAddress: true,
          userAgent: true,
          status: true,
          message: true,
          createdAt: true,
        },
      }),
      this.prisma.auditLog.count({ where }),
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
    return this.prisma.auditLog.findUnique({ where: { id } });
  }
}

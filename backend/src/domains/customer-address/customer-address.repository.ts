import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CustomerAddressRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    customerId: string;
    search?: string;
    status?: string;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) {
    const { customerId, search, status, page, limit, sortBy, sortOrder } =
      params;
    const skip = (page - 1) * limit;
    const where: Prisma.CustomerAddressWhereInput = { customerId };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { addressLine1: { contains: search, mode: 'insensitive' } },
        { addressLine2: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { landmark: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.customerAddress.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.customerAddress.count({ where }),
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
    return this.prisma.customerAddress.findUnique({ where: { id } });
  }

  async create(data: Prisma.CustomerAddressCreateInput) {
    return this.prisma.customerAddress.create({ data });
  }

  async update(id: string, data: Prisma.CustomerAddressUpdateInput) {
    return this.prisma.customerAddress.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.customerAddress.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  }

  async clearDefaultBilling(customerId: string) {
    return this.prisma.customerAddress.updateMany({
      where: { customerId, isDefaultBilling: true },
      data: { isDefaultBilling: false },
    });
  }

  async clearDefaultShipping(customerId: string) {
    return this.prisma.customerAddress.updateMany({
      where: { customerId, isDefaultShipping: true },
      data: { isDefaultShipping: false },
    });
  }

  async findCustomerByUserId(userId: string) {
    return this.prisma.customerProfile.findUnique({ where: { userId } });
  }
}

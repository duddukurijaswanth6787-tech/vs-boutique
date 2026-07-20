import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CustomerProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string) {
    return this.prisma.customerProfile.findUnique({ where: { userId } });
  }

  async findById(id: string) {
    return this.prisma.customerProfile.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  async create(data: Prisma.CustomerProfileCreateInput) {
    return this.prisma.customerProfile.create({ data });
  }

  async update(id: string, data: Prisma.CustomerProfileUpdateInput) {
    return this.prisma.customerProfile.update({ where: { id }, data });
  }
}

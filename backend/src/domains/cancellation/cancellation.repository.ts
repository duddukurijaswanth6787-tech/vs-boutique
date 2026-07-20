import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CancellationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByOrderId(orderId: string) {
    return this.prisma.cancellationRequest.findUnique({ where: { orderId } });
  }

  async create(data: Prisma.CancellationRequestCreateInput) {
    return this.prisma.cancellationRequest.create({ data });
  }

  async update(id: string, data: Prisma.CancellationRequestUpdateInput) {
    return this.prisma.cancellationRequest.update({ where: { id }, data });
  }
}

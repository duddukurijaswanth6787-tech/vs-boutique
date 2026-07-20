import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SupportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findContacts(params: { status?: string; page: number; limit: number }) {
    const { status, page, limit } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.ContactMessageWhereInput = {};
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.contactMessage.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contactMessage.count({ where }),
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

  async createContact(data: Prisma.ContactMessageCreateInput) {
    return this.prisma.contactMessage.create({ data });
  }

  async findContactById(id: string) {
    return this.prisma.contactMessage.findUnique({ where: { id } });
  }

  async updateContact(id: string, data: Prisma.ContactMessageUpdateInput) {
    return this.prisma.contactMessage.update({ where: { id }, data });
  }

  async findTickets(params: {
    status?: string;
    priority?: string;
    customerId?: string;
    page: number;
    limit: number;
  }) {
    const { status, priority, customerId, page, limit } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.SupportTicketWhereInput = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (customerId) where.customerId = customerId;

    const [data, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.supportTicket.count({ where }),
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

  async findTicketById(id: string) {
    return this.prisma.supportTicket.findUnique({
      where: { id },
      include: { replies: { orderBy: { createdAt: 'asc' } } },
    });
  }

  async createTicket(data: Prisma.SupportTicketCreateInput) {
    return this.prisma.supportTicket.create({ data });
  }

  async updateTicket(id: string, data: Prisma.SupportTicketUpdateInput) {
    return this.prisma.supportTicket.update({ where: { id }, data });
  }

  async createReply(data: Prisma.SupportReplyCreateInput) {
    return this.prisma.supportReply.create({ data });
  }

  async generateTicketNumber(): Promise<string> {
    const count = await this.prisma.supportTicket.count();
    return `TKT-${String(count + 1).padStart(6, '0')}`;
  }
}

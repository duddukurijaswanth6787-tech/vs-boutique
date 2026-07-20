import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AiChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    userId: string;
    status?: string;
    page: number;
    limit: number;
  }) {
    const { userId, status, page, limit } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.AiConversationWhereInput = { userId };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.aiConversation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.aiConversation.count({ where }),
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
    return this.prisma.aiConversation.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
  }

  async create(data: Prisma.AiConversationCreateInput) {
    return this.prisma.aiConversation.create({ data });
  }

  async update(id: string, data: Prisma.AiConversationUpdateInput) {
    return this.prisma.aiConversation.update({ where: { id }, data });
  }

  async createMessage(data: Prisma.AiMessageCreateInput) {
    return this.prisma.aiMessage.create({ data });
  }

  async getMessages(conversationId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where: Prisma.AiMessageWhereInput = { conversationId };

    const [data, total] = await Promise.all([
      this.prisma.aiMessage.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.aiMessage.count({ where }),
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
}

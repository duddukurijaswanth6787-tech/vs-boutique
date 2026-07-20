import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class RagAgentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { page: number; limit: number }) {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.ragAgent.findMany({
        where: { deletedAt: null },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { conversations: true },
          },
        },
      }),
      this.prisma.ragAgent.count({ where: { deletedAt: null } }),
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
    return this.prisma.ragAgent.findFirst({
      where: { id, deletedAt: null },
      include: {
        knowledgeSources: {
          include: {
            knowledgeSource: true,
          },
        },
      },
    });
  }

  async findByKey(agentKey: string) {
    return this.prisma.ragAgent.findFirst({
      where: { agentKey, deletedAt: null },
      include: {
        knowledgeSources: {
          include: {
            knowledgeSource: true,
          },
        },
      },
    });
  }

  async create(data: Prisma.RagAgentCreateInput) {
    return this.prisma.ragAgent.create({
      data,
    });
  }

  async update(id: string, data: Prisma.RagAgentUpdateInput) {
    return this.prisma.ragAgent.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string) {
    return this.prisma.ragAgent.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: string) {
    return this.prisma.ragAgent.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  async assignKnowledgeSources(agentId: string, sourceIds: string[]) {
    // ponytail: clear and assign atomically using transaction
    return this.prisma.$transaction(async (tx) => {
      await tx.ragAgentKnowledgeSource.deleteMany({
        where: { agentId },
      });

      if (sourceIds.length > 0) {
        await tx.ragAgentKnowledgeSource.createMany({
          data: sourceIds.map((sid, idx) => ({
            agentId,
            knowledgeSourceId: sid,
            priority: idx,
          })),
        });
      }

      return tx.ragAgent.findUnique({
        where: { id: agentId },
        include: {
          knowledgeSources: {
            include: { knowledgeSource: true },
          },
        },
      });
    });
  }

  // ─── Conversations ────────────────────────────────────────
  async findConversationById(id: string) {
    return this.prisma.ragConversation.findUnique({
      where: { id },
      include: { agent: true, toolExecutions: true },
    });
  }

  async findConversations(params: {
    customerId?: string;
    guestId?: string;
    agentId?: string;
    page: number;
    limit: number;
  }) {
    const { customerId, guestId, agentId, page, limit } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.RagConversationWhereInput = {};
    if (customerId) where.customerId = customerId;
    if (guestId) where.guestId = guestId;
    if (agentId) where.agentId = agentId;

    const [data, total] = await Promise.all([
      this.prisma.ragConversation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { lastMessageAt: 'desc' },
        include: { agent: true },
      }),
      this.prisma.ragConversation.count({ where }),
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

  async createConversation(data: Prisma.RagConversationCreateInput) {
    return this.prisma.ragConversation.create({ data });
  }

  async updateConversation(
    id: string,
    data: Prisma.RagConversationUpdateInput,
  ) {
    return this.prisma.ragConversation.update({ where: { id }, data });
  }

  async getConversationMessages(params: {
    conversationId: string;
    page: number;
    limit: number;
  }) {
    const { conversationId, page, limit } = params;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.ragMessage.findMany({
        where: { conversationId },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: { citations: true },
      }),
      this.prisma.ragMessage.count({ where: { conversationId } }),
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

  async createMessage(data: Prisma.RagMessageCreateInput) {
    return this.prisma.ragMessage.create({
      data,
      include: { citations: true },
    });
  }

  async createMessageCitation(data: Prisma.RagMessageCitationCreateInput) {
    return this.prisma.ragMessageCitation.create({ data });
  }

  async createToolExecution(data: Prisma.RagToolExecutionCreateInput) {
    return this.prisma.ragToolExecution.create({ data });
  }

  async addFeedback(
    messageId: string,
    data: {
      rating?: number;
      isHelpful?: boolean;
      comment?: string;
      userId?: string;
    },
  ) {
    return this.prisma.ragFeedback.create({
      data: {
        messageId,
        userId: data.userId,
        rating: data.rating,
        isHelpful: data.isHelpful,
        comment: data.comment,
      },
    });
  }

  // ─── Metrics & Analytics ──────────────────────────────────
  async incrementMetrics(params: {
    agentId: string;
    isSuccessful: boolean;
    responseTimeMs: number;
    confidence: number;
    promptTokens: number;
    completionTokens: number;
  }) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const record = await this.prisma.ragAgentMetric.findUnique({
      where: {
        agentId_date: {
          agentId: params.agentId,
          date: today,
        },
      },
    });

    if (!record) {
      await this.prisma.ragAgentMetric.create({
        data: {
          agentId: params.agentId,
          date: today,
          conversations: 1,
          messages: 1,
          successfulResponses: params.isSuccessful ? 1 : 0,
          failedResponses: params.isSuccessful ? 0 : 1,
          averageResponseTimeMs: params.responseTimeMs,
          averageConfidence: params.confidence,
          totalPromptTokens: params.promptTokens,
          totalCompletionTokens: params.completionTokens,
        },
      });
    } else {
      const messagesCount = record.messages + 1;
      const avgResponseTime = Math.round(
        (record.averageResponseTimeMs * record.messages +
          params.responseTimeMs) /
          messagesCount,
      );
      const avgConfidence =
        (Number(record.averageConfidence) * record.messages +
          params.confidence) /
        messagesCount;

      await this.prisma.ragAgentMetric.update({
        where: { id: record.id },
        data: {
          messages: messagesCount,
          successfulResponses:
            record.successfulResponses + (params.isSuccessful ? 1 : 0),
          failedResponses:
            record.failedResponses + (params.isSuccessful ? 0 : 1),
          averageResponseTimeMs: avgResponseTime,
          averageConfidence: avgConfidence,
          totalPromptTokens: record.totalPromptTokens + params.promptTokens,
          totalCompletionTokens:
            record.totalCompletionTokens + params.completionTokens,
        },
      });
    }
  }

  async getSummaryAnalytics() {
    const [totalAgents, totalSources, indexedSources, totalConversations] =
      await Promise.all([
        this.prisma.ragAgent.count({ where: { deletedAt: null } }),
        this.prisma.ragKnowledgeSource.count({ where: { deletedAt: null } }),
        this.prisma.ragKnowledgeSource.count({
          where: { deletedAt: null, status: 'INDEXED' },
        }),
        this.prisma.ragConversation.count(),
      ]);

    const metricsAgg = await this.prisma.ragAgentMetric.aggregate({
      _sum: {
        messages: true,
        successfulResponses: true,
        failedResponses: true,
        totalPromptTokens: true,
        totalCompletionTokens: true,
      },
      _avg: {
        averageResponseTimeMs: true,
        averageConfidence: true,
      },
    });

    const feedbackAgg = await this.prisma.ragFeedback.aggregate({
      _avg: { rating: true },
    });

    const successRate = metricsAgg._sum.messages
      ? (metricsAgg._sum.successfulResponses ?? 0) / metricsAgg._sum.messages
      : 1.0;

    return {
      totalAgents,
      activeAgents: totalAgents,
      totalKnowledgeSources: totalSources,
      indexedKnowledgeSources: indexedSources,
      totalConversations,
      conversationsThisMonth: totalConversations, // fallback simple count
      averageResponseTimeMs: Math.round(
        metricsAgg._avg.averageResponseTimeMs ?? 0,
      ),
      successRate,
      averageRating: Number(feedbackAgg._avg.rating ?? 0.0),
    };
  }

  async getAgentPerformanceSummary(agentId: string) {
    const metrics = await this.prisma.ragAgentMetric.findMany({
      where: { agentId },
      orderBy: { date: 'desc' },
      take: 30,
    });

    // aggregate values
    let totalMessages = 0;
    let totalSuccess = 0;
    let totalPrompt = 0;
    let totalCompletion = 0;
    let totalDuration = 0;
    let totalConf = 0;

    metrics.forEach((m) => {
      totalMessages += m.messages;
      totalSuccess += m.successfulResponses;
      totalPrompt += m.totalPromptTokens;
      totalCompletion += m.totalCompletionTokens;
      totalDuration += m.averageResponseTimeMs * m.messages;
      totalConf += Number(m.averageConfidence) * m.messages;
    });

    const avgResponseTime = totalMessages
      ? Math.round(totalDuration / totalMessages)
      : 0;
    const avgConfidence = totalMessages ? totalConf / totalMessages : 1.0;
    const successRate = totalMessages ? totalSuccess / totalMessages : 1.0;

    return {
      conversations: metrics.length,
      messages: totalMessages,
      successRate,
      averageResponseTimeMs: avgResponseTime,
      averageConfidence: avgConfidence,
      tokenUsage: {
        prompt: totalPrompt,
        completion: totalCompletion,
        total: totalPrompt + totalCompletion,
      },
    };
  }
}

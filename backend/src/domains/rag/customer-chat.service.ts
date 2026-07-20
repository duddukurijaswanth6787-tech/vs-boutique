import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIOrchestratorService } from './orchestrator.service';
import { RagRepository } from './rag.repository';
import { AuditService } from '@domains/audit/audit.service';
import { MetricsService } from '@infrastructure/monitoring/metrics.service';
import { Counter, Histogram } from 'prom-client';
import { TypingState } from './customer-chat.types';
import type {
  CreateChatSessionDto,
  ChatMessageDto,
  ChatHistoryQueryDto,
  RenameSessionDto,
  SubmitChatFeedbackDto,
} from './customer-chat.types';

// ponytail: naive prompt-injection heuristic. Flags obvious instruction-override attempts.
// Upgrade to a classifier / profanity+leak filter when abuse is measured in production.
const INJECTION_PATTERNS = [
  /ignore (all|previous|above|your) (instructions|prompt)/i,
  /disregard (your|the) (system|prior) prompt/i,
  /you are now/i,
  /reveal (your )?(system )?prompt/i,
];

@Injectable()
export class CustomerChatService {
  private readonly maxMessageLength: number;
  private readonly feedbackEnabled: boolean;
  private readonly suggestionsEnabled: boolean;

  // ponytail: one registry, two counters/histograms. Add labels when dashboards need breakdowns.
  private readonly chatCounter: Counter<string>;
  private readonly feedbackCounter: Counter<string>;
  private readonly responseTime: Histogram<string>;

  constructor(
    private readonly orchestrator: AIOrchestratorService,
    private readonly ragRepository: RagRepository,
    private readonly audit: AuditService,
    private readonly metrics: MetricsService,
    config: ConfigService,
  ) {
    this.maxMessageLength = config.get<number>(
      'rag.chatMaxMessageLength',
      4000,
    );
    this.feedbackEnabled = config.get<boolean>('rag.chatFeedbackEnabled', true);
    this.suggestionsEnabled = config.get<boolean>(
      'rag.chatSuggestionsEnabled',
      true,
    );

    this.chatCounter = new Counter({
      name: 'vasanthi_rag_chat_messages_total',
      help: 'Total customer chat messages',
      labelNames: ['type'],
      registers: [this.metrics.registry],
    });
    this.feedbackCounter = new Counter({
      name: 'vasanthi_rag_chat_feedback_total',
      help: 'Total customer chat feedback',
      labelNames: ['isHelpful'],
      registers: [this.metrics.registry],
    });
    this.responseTime = new Histogram({
      name: 'vasanthi_rag_chat_response_seconds',
      help: 'Customer chat response time',
      registers: [this.metrics.registry],
    });
  }

  async createSession(
    dto: CreateChatSessionDto,
    userId?: string,
  ): Promise<{ conversationId: string }> {
    const conversationId = dto.sessionId;
    if (conversationId) {
      await this.assertOwnership(conversationId, userId, dto.guestId);
      return { conversationId };
    }
    const conv = await this.ragRepository.conversation.create({
      data: {
        agentId: 'default',
        userId: userId ?? null,
        guestId: userId ? null : (dto.guestId ?? null),
        title: dto.title ?? 'New chat',
        status: 'ACTIVE',
      },
    });
    this.chatCounter.inc({ type: 'session_created' });
    this.audit.log({
      action: 'chat.session.create',
      module: 'rag',
      resource: 'RagConversation',
      resourceId: conv.id,
      userId,
    });
    return { conversationId: conv.id };
  }

  async sendMessage(
    dto: ChatMessageDto,
    userId?: string,
  ): Promise<{
    conversationId: string;
    response: string;
    model: string;
    provider: string;
    totalTokens: number;
    responseTimeMs: number;
    typing: TypingState;
    citations: Array<{
      chunkId: string;
      documentId: string;
      knowledgeSourceId: string;
      documentTitle: string;
      score: number;
    }>;
  }> {
    if (!dto.message || dto.message.trim().length === 0)
      throw new BadRequestException('Message cannot be empty');
    if (dto.message.length > this.maxMessageLength) {
      throw new BadRequestException(
        `Message exceeds maximum length of ${this.maxMessageLength}`,
      );
    }
    if (INJECTION_PATTERNS.some((p) => p.test(dto.message))) {
      // ponytail: reject obvious injection rather than silently passing to the LLM.
      throw new BadRequestException(
        'Message rejected: potential prompt injection detected',
      );
    }

    let conversationId = dto.sessionId;
    if (!conversationId) {
      const session = await this.createSession(
        { guestId: dto.guestId },
        userId,
      );
      conversationId = session.conversationId;
    } else {
      await this.assertOwnership(conversationId, userId, dto.guestId);
    }

    const start = Date.now();
    const result = await this.orchestrator.orchestrate({
      message: dto.message,
      conversationId,
      sessionId: dto.sessionId,
      systemPrompt: dto.systemPrompt,
    });
    const seconds = (Date.now() - start) / 1000;
    this.responseTime.observe(seconds);
    this.chatCounter.inc({ type: 'message' });

    this.audit.log({
      action: 'chat.message.send',
      module: 'rag',
      resource: 'RagConversation',
      resourceId: conversationId,
      userId,
    });

    return {
      conversationId: result.conversationId,
      response: result.response,
      model: result.model,
      provider: result.provider,
      totalTokens: result.totalTokens,
      responseTimeMs: result.responseTimeMs,
      typing: TypingState.COMPLETED,
      citations: result.citations ?? [],
    };
  }

  async getHistory(
    conversationId: string,
    dto: ChatHistoryQueryDto,
    userId?: string,
  ): Promise<{ items: Array<Record<string, unknown>>; total: number }> {
    await this.assertOwnership(conversationId, userId, undefined);
    const where = { conversationId, deletedAt: null };
    const [items, total] = await Promise.all([
      this.ragRepository.message.findMany({
        where,
        skip: ((dto.page ?? 1) - 1) * (dto.limit ?? 50),
        take: dto.limit ?? 50,
        orderBy: { createdAt: 'asc' },
      }),
      this.ragRepository.message.count({ where }),
    ]);
    return { items: items, total };
  }

  async renameSession(
    conversationId: string,
    dto: RenameSessionDto,
    userId?: string,
  ): Promise<{ id: string; title: string }> {
    await this.assertOwnership(conversationId, userId, undefined);
    await this.ragRepository.conversation.update({
      where: { id: conversationId },
      data: { title: dto.title },
    });
    return { id: conversationId, title: dto.title };
  }

  async archiveSession(conversationId: string, userId?: string): Promise<void> {
    await this.assertOwnership(conversationId, userId, undefined);
    await this.ragRepository.conversation.update({
      where: { id: conversationId },
      data: { status: 'ARCHIVED', deletedAt: new Date() },
    });
    this.audit.log({
      action: 'chat.session.archive',
      module: 'rag',
      resource: 'RagConversation',
      resourceId: conversationId,
      userId,
    });
  }

  async deleteSession(conversationId: string, userId?: string): Promise<void> {
    await this.assertOwnership(conversationId, userId, undefined);
    await this.ragRepository.conversation.update({
      where: { id: conversationId },
      data: { status: 'DELETED', deletedAt: new Date() },
    });
    this.audit.log({
      action: 'chat.session.delete',
      module: 'rag',
      resource: 'RagConversation',
      resourceId: conversationId,
      userId,
    });
  }

  async getSuggestions(
    conversationId?: string,
    userId?: string,
  ): Promise<{ questions: string[] }> {
    if (!this.suggestionsEnabled) return { questions: [] };
    const base = [
      'What products do you offer?',
      'How can I track my order?',
      'What is your return policy?',
      'Can you help me choose a design?',
    ];
    if (conversationId) {
      await this.assertOwnership(conversationId, userId, undefined);
      const recent = await this.ragRepository.message.findMany({
        where: { conversationId, role: 'user', deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { content: true },
      });
      const topics = recent
        .map((m: { content: string }) => m.content)
        .filter(Boolean);
      return { questions: [...topics, ...base].slice(0, 6) };
    }
    return { questions: base };
  }

  async submitFeedback(
    dto: SubmitChatFeedbackDto,
    userId?: string,
  ): Promise<{ messageId: string; recorded: boolean }> {
    if (!this.feedbackEnabled)
      throw new BadRequestException('Feedback is disabled');
    const msg = await this.ragRepository.message.findFirst({
      where: { id: dto.messageId, deletedAt: null },
    });
    if (!msg) throw new NotFoundException('Message not found');
    await this.ragRepository.createFeedback({
      messageId: dto.messageId,
      userId: userId ?? null,
      isHelpful: dto.isHelpful,
      rating: dto.rating,
      comment: dto.comment,
    });
    this.feedbackCounter.inc({ isHelpful: String(dto.isHelpful) });
    return { messageId: dto.messageId, recorded: true };
  }

  // ponytail: ownership = conversation.userId matches auth user, or guestId matches for anon sessions.
  private async assertOwnership(
    conversationId: string,
    userId?: string,
    guestId?: string,
  ): Promise<void> {
    const conv = await this.ragRepository.conversation.findFirst({
      where: { id: conversationId, deletedAt: null },
      select: { userId: true, guestId: true },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    if (userId) {
      if (conv.userId !== userId)
        throw new ForbiddenException('You do not own this conversation');
    } else {
      if (!guestId || conv.guestId !== guestId)
        throw new ForbiddenException('Invalid guest session');
    }
  }
}

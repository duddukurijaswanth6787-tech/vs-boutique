import { Injectable } from '@nestjs/common';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { AiChatRepository } from './ai-chat.repository';
import {
  CreateConversationDto,
  SendMessageDto,
  ConversationQueryDto,
  AiConversationResponse,
  AiMessageResponse,
  AddFeedbackDto,
} from './ai-chat.types';

@Injectable()
export class AiChatService {
  constructor(
    private readonly aiChatRepository: AiChatRepository,
    private readonly auditService: AuditService,
  ) {}

  private toConversationResponse(c: any): AiConversationResponse {
    return {
      id: c.id,
      userId: c.userId,
      title: c.title ?? undefined,
      status: c.status,
      tokenCount: c.tokenCount,
      messages: c.messages?.map((m: any) => this.toMessageResponse(m)),
      createdAt: c.createdAt,
    };
  }

  private toMessageResponse(m: any): AiMessageResponse {
    return {
      id: m.id,
      role: m.role,
      content: m.content,
      tokenCount: m.tokenCount,
      createdAt: m.createdAt,
    };
  }

  async findAll(userId: string, query: ConversationQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.aiChatRepository.findAll({
      userId,
      status: query.status,
      page,
      limit,
    });
    return {
      data: result.data.map((c) => this.toConversationResponse(c)),
      meta: result.meta,
    };
  }

  async findById(id: string, userId: string) {
    const conversation = await this.aiChatRepository.findById(id);
    if (!conversation)
      throw new BusinessException('Conversation not found', 'AICHAT_001');
    if (conversation.userId !== userId)
      throw new BusinessException('Access denied', 'AICHAT_002');
    return this.toConversationResponse(conversation);
  }

  async create(userId: string, dto: CreateConversationDto) {
    const conversation = await this.aiChatRepository.create({
      user: { connect: { id: userId } },
      title: dto.title,
      status: 'ACTIVE',
      tokenCount: 0,
    });
    await this.auditService.log({
      action: 'AI_CHAT_STARTED',
      module: 'ai-chat',
      resource: 'ai_conversation',
      resourceId: conversation.id,
      userId,
      newValue: { title: dto.title },
    });
    return this.toConversationResponse(conversation);
  }

  async sendMessage(
    conversationId: string,
    userId: string,
    dto: SendMessageDto,
  ) {
    const conversation = await this.aiChatRepository.findById(conversationId);
    if (!conversation)
      throw new BusinessException('Conversation not found', 'AICHAT_001');
    if (conversation.userId !== userId)
      throw new BusinessException('Access denied', 'AICHAT_002');

    await this.aiChatRepository.createMessage({
      conversation: { connect: { id: conversationId } },
      role: 'USER',
      content: dto.content,
      tokenCount: 0,
    });

    const aiMessage = await this.aiChatRepository.createMessage({
      conversation: { connect: { id: conversationId } },
      role: 'ASSISTANT',
      content: 'AI chat is not yet connected to a provider. No response can be generated.',
      tokenCount: 0,
    });

    await this.auditService.log({
      action: 'AI_CHAT_COMPLETED',
      module: 'ai-chat',
      resource: 'ai_conversation',
      resourceId: conversationId,
      userId,
    });

    return this.toMessageResponse(aiMessage);
  }

  async getMessages(
    conversationId: string,
    userId: string,
    page = 1,
    limit = 20,
  ) {
    const conversation = await this.aiChatRepository.findById(conversationId);
    if (!conversation)
      throw new BusinessException('Conversation not found', 'AICHAT_001');
    if (conversation.userId !== userId)
      throw new BusinessException('Access denied', 'AICHAT_002');

    const result = await this.aiChatRepository.getMessages(
      conversationId,
      page,
      Math.min(limit, 100),
    );
    return {
      data: result.data.map((m) => this.toMessageResponse(m)),
      meta: result.meta,
    };
  }

  async addFeedback(userId: string, dto: AddFeedbackDto) {
    const conversation = await this.aiChatRepository.findById(dto.referenceId);
    if (!conversation)
      throw new BusinessException('Conversation not found', 'AICHAT_001');
    if (conversation.userId !== userId)
      throw new BusinessException('Access denied', 'AICHAT_002');

    await this.auditService.log({
      action: 'AI_CHAT_FEEDBACK',
      module: 'ai-chat',
      resource: 'ai_conversation',
      resourceId: dto.referenceId,
      userId,
      newValue: { type: dto.type, rating: dto.rating, comment: dto.comment },
    });
  }
}

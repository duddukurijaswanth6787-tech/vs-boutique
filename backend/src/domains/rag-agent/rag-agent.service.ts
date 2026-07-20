import {
  Injectable,
  OnModuleInit,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { RagAgentRepository } from './rag-agent.repository';
import {
  CreateAgentDto,
  UpdateAgentDto,
  AssignKnowledgeDto,
  ConfigureToolsDto,
  TestAgentDto,
} from './rag-agent.types';
import { AuditService } from '@domains/audit/audit.service';
import { RagOrchestratorService } from './rag-orchestrator.service';

@Injectable()
export class RagAgentService implements OnModuleInit {
  private readonly logger = new Logger('RagAgentService');

  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: RagAgentRepository,
    private readonly orchestrator: RagOrchestratorService,
    private readonly auditService: AuditService,
  ) {}

  async onModuleInit() {
    await this.seedDefaultAgents();
  }

  private async seedDefaultAgents() {
    const defaultAgents = [
      {
        agentKey: 'customer_support_agent',
        name: 'Customer Support Agent',
        description:
          'Handles support questions, order updates, returns, and general inquiries.',
        systemPrompt:
          'You are the customer support representative. Assist with order statuses, delivery, returns, and store policies.',
        toolConfig: {
          tools: [
            'ORDER_STATUS',
            'ORDER_TRACKING',
            'RETURN_STATUS',
            'REFUND_STATUS',
          ],
        },
      },
      {
        agentKey: 'product_recommendation_agent',
        name: 'Product Recommendation Agent',
        description:
          'Helps customers discover products, compare styles, and search catalog items.',
        systemPrompt:
          'You are a product shopping guide. Recommend outfits, search sizes/colors, and find products.',
        toolConfig: {
          tools: ['PRODUCT_SEARCH', 'PRODUCT_DETAILS', 'PRODUCT_AVAILABILITY'],
        },
      },
      {
        agentKey: 'order_tracking_agent',
        name: 'Order Tracking Agent',
        description:
          'Exclusively tracks order shipments, delivery timelines, and transit updates.',
        systemPrompt:
          'You are the shipping assistant. Guide customers on where their package is and when it will arrive.',
        toolConfig: { tools: ['ORDER_STATUS', 'ORDER_TRACKING'] },
      },
      {
        agentKey: 'faq_agent',
        name: 'FAQ & Policies Agent',
        description:
          'Answers policy inquiries, payment methods, shipping fees, and general FAQs.',
        systemPrompt:
          'You are a general knowledge base helper. Guide customers on store procedures, payment rules, and FAQ listings.',
        toolConfig: { tools: [] },
      },
      {
        agentKey: 'returns_refunds_agent',
        name: 'Returns & Refunds Specialist',
        description:
          'Validates return requests, return eligibility, and refund timeline updates.',
        systemPrompt:
          'You are the returns validator. Answer eligibility details and look up return request status records.',
        toolConfig: { tools: ['RETURN_STATUS', 'REFUND_STATUS'] },
      },
      {
        agentKey: 'styling_fashion_agent',
        name: 'Styling & Fashion Expert',
        description:
          'Provides personalized styling, occasion wear matching, and trend advice.',
        systemPrompt:
          'You are a premium luxury fashion designer assistant. Advise on styling matching colors, bridal themes, and luxury kurtis.',
        toolConfig: { tools: ['PRODUCT_SEARCH', 'PRODUCT_DETAILS'] },
      },
    ];

    for (const agent of defaultAgents) {
      const existing = await this.prisma.ragAgent.findUnique({
        where: { agentKey: agent.agentKey },
      });

      if (!existing) {
        await this.prisma.ragAgent.create({
          data: {
            ...agent,
            isDefault: true,
            status: 'ACTIVE',
            createdBy: 'SYSTEM',
            behaviorConfig: {},
            guardrailConfig: {},
          },
        });
        this.logger.log(`Seeded default RAG agent: ${agent.agentKey}`);
      }
    }
  }

  async findAll(page: number, limit: number) {
    return this.repository.findAll({ page, limit });
  }

  async findById(id: string) {
    const agent = await this.repository.findById(id);
    if (!agent) throw new NotFoundException('RAG Agent not found');
    return agent;
  }

  async create(dto: CreateAgentDto, userId: string) {
    const agent = await this.repository.create({
      ...dto,
      temperature: dto.temperature ?? 0.7,
      behaviorConfig: dto.behaviorConfig || {},
      toolConfig: dto.toolConfig || {},
      guardrailConfig: dto.guardrailConfig || {},
      createdBy: userId,
    });

    await this.auditService.log({
      userId,
      action: 'CREATE',
      module: 'RAG_AGENT',
      resource: 'RAG',
      resourceId: agent.id,
      metadata: { agentKey: agent.agentKey },
    });

    return agent;
  }

  async update(id: string, dto: UpdateAgentDto, userId: string) {
    await this.findById(id);

    const updated = await this.repository.update(id, {
      ...dto,
      temperature: dto.temperature !== undefined ? dto.temperature : undefined,
      behaviorConfig: dto.behaviorConfig || undefined,
      toolConfig: dto.toolConfig || undefined,
      guardrailConfig: dto.guardrailConfig || undefined,
      updatedBy: userId,
    });

    await this.auditService.log({
      userId,
      action: 'UPDATE',
      module: 'RAG_AGENT',
      resource: 'RAG',
      resourceId: id,
    });

    return updated;
  }

  async softDelete(id: string, userId: string) {
    await this.findById(id);
    const agent = await this.repository.softDelete(id);

    await this.auditService.log({
      userId,
      action: 'DELETE',
      module: 'RAG_AGENT',
      resource: 'RAG',
      resourceId: id,
    });

    return agent;
  }

  async restore(id: string, userId: string) {
    await this.repository.restore(id);

    await this.auditService.log({
      userId,
      action: 'RESTORE',
      module: 'RAG_AGENT',
      resource: 'RAG',
      resourceId: id,
    });

    return { success: true };
  }

  async updateStatus(
    id: string,
    action: 'ACTIVATE' | 'DEACTIVATE',
    userId: string,
  ) {
    await this.findById(id);
    const status = action === 'ACTIVATE' ? 'ACTIVE' : 'INACTIVE';
    const agent = await this.repository.update(id, {
      status,
      updatedBy: userId,
    });

    await this.auditService.log({
      userId,
      action: 'UPDATE_STATUS',
      module: 'RAG_AGENT',
      resource: 'RAG',
      resourceId: id,
      metadata: { status },
    });

    return agent;
  }

  async assignKnowledgeSources(
    id: string,
    dto: AssignKnowledgeDto,
    userId: string,
  ) {
    await this.findById(id);
    const agent = await this.repository.assignKnowledgeSources(
      id,
      dto.knowledgeSourceIds,
    );

    await this.auditService.log({
      userId,
      action: 'ASSIGN_KNOWLEDGE',
      module: 'RAG_AGENT',
      resource: 'RAG',
      resourceId: id,
      metadata: { sourceIds: dto.knowledgeSourceIds },
    });

    return agent;
  }

  async configureTools(id: string, dto: ConfigureToolsDto, userId: string) {
    await this.findById(id);
    const agent = await this.repository.update(id, {
      toolConfig: { tools: dto.tools },
      updatedBy: userId,
    });

    await this.auditService.log({
      userId,
      action: 'CONFIGURE_TOOLS',
      module: 'RAG_AGENT',
      resource: 'RAG',
      resourceId: id,
      metadata: { tools: dto.tools },
    });

    return agent;
  }

  async testAgent(id: string, dto: TestAgentDto) {
    const agent = await this.findById(id);
    return this.orchestrator.orchestrate({
      agentKey: agent.agentKey,
      message: dto.message,
      context: { isAdmin: true },
    });
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { RagAgentRepository } from './rag-agent.repository';
import { RagIntentService } from './rag-intent.service';
import { RagToolRegistry, RagToolContext } from './rag-tool.registry';
import { RagRetrievalService } from './rag-retrieval.service';
import { RagPromptBuilder } from './rag-prompt.builder';
import {
  LlmProviderRegistry,
  EmbeddingProviderRegistry,
} from './rag-providers.service';
import { BusinessException, AiUnavailableException } from '@common/exceptions';

@Injectable()
export class RagOrchestratorService {
  private readonly logger = new Logger('RagOrchestratorService');

  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: RagAgentRepository,
    private readonly intentService: RagIntentService,
    private readonly toolRegistry: RagToolRegistry,
    private readonly retrievalService: RagRetrievalService,
    private readonly promptBuilder: RagPromptBuilder,
    private readonly llmRegistry: LlmProviderRegistry,
    private readonly embeddingRegistry: EmbeddingProviderRegistry,
  ) {}

  async orchestrate(params: {
    agentKey: string;
    conversationId?: string;
    message: string;
    context: RagToolContext;
  }) {
    const startTime = Date.now();
    const { agentKey, message } = params;
    let { conversationId } = params;

    // 1. Retrieve and validate Agent config
    const agent = await this.repository.findByKey(agentKey);
    if (!agent) {
      throw new BusinessException('RAG Agent not found', 'RAG_AGENT_001');
    }
    if (agent.status !== 'ACTIVE') {
      throw new BusinessException(
        'RAG Agent is currently inactive',
        'RAG_AGENT_002',
      );
    }

    // 2. Resolve or Create Conversation
    let conversation: any;
    if (conversationId) {
      conversation = await this.repository.findConversationById(conversationId);
      if (!conversation) {
        throw new BusinessException('Conversation not found', 'RAG_CONV_001');
      }
      // Ownership check
      if (params.context.userId && conversation.customerId) {
        const customer = await this.prisma.customerProfile.findUnique({
          where: { userId: params.context.userId },
        });
        if (
          customer &&
          conversation.customerId !== customer.id &&
          !params.context.isAdmin
        ) {
          throw new BusinessException(
            'Access denied for this conversation',
            'RAG_CONV_002',
          );
        }
      }
    } else {
      let customerId: string | null = null;
      if (params.context.userId) {
        const customer = await this.prisma.customerProfile.findUnique({
          where: { userId: params.context.userId },
        });
        customerId = customer?.id || null;
      }
      conversation = await this.repository.createConversation({
        agent: { connect: { id: agent.id } },
        customer: customerId ? { connect: { id: customerId } } : undefined,
        guestId: params.context.guestId || undefined,
        title: message.substring(0, 40) + '...',
      });
      conversationId = conversation.id;
    }

    // 3. Save user message to database
    const userMsg = await this.prisma.ragMessage.create({
      data: {
        conversationId: conversationId!,
        role: 'user',
        content: message,
      },
    });

    // 4. Load bounded conversation history (limit 12)
    const historyPage = await this.repository.getConversationMessages({
      conversationId: conversationId!,
      page: 1,
      limit: 12,
    });
    const history = historyPage.data;

    // 5. Detect user intent
    const intent = this.intentService.routeIntent(message);

    // 6. Map intent to allowed tools and execute
    const toolResults: any[] = [];
    const matchedTools: string[] = [];

    // Map intents to matching tools in the registry
    if (intent === 'ORDER_TRACKING') {
      matchedTools.push('ORDER_STATUS', 'ORDER_TRACKING');
    } else if (intent === 'PRODUCT_SEARCH') {
      matchedTools.push('PRODUCT_SEARCH');
    } else if (intent === 'PRODUCT_AVAILABILITY') {
      matchedTools.push('PRODUCT_AVAILABILITY');
    } else if (intent === 'RETURN_STATUS') {
      matchedTools.push('RETURN_STATUS');
    } else if (intent === 'REFUND_STATUS') {
      matchedTools.push('REFUND_STATUS');
    }

    // Parse input fields from query (e.g. order tracking order number)
    const orderNumMatch = message.match(/ord-\d{8}-\d{6}/i);
    const parsedOrderNumber = orderNumMatch
      ? orderNumMatch[0].toUpperCase()
      : null;

    // Check if the agent config permits these tools
    const configuredTools = (agent.toolConfig as any)?.tools || [];

    for (const toolName of matchedTools) {
      if (!configuredTools.includes(toolName)) {
        continue;
      }

      const tool = this.toolRegistry.getTool(toolName);
      if (!tool) continue;

      const toolStartTime = Date.now();
      let input: any = {};

      if (toolName === 'ORDER_STATUS' || toolName === 'ORDER_TRACKING') {
        input = { orderNumber: parsedOrderNumber || 'UNKNOWN' };
      } else if (toolName === 'PRODUCT_SEARCH') {
        input = { query: message, limit: 3 };
      }

      try {
        const result = await tool.execute(params.context, input);
        const duration = Date.now() - toolStartTime;

        toolResults.push({
          name: toolName,
          status: 'SUCCESS',
          result,
        });

        // Record execution in DB
        await this.prisma.ragToolExecution.create({
          data: {
            conversationId: conversationId!,
            messageId: userMsg.id,
            toolName,
            status: 'SUCCESS',
            input: input,
            output: result,
            durationMs: duration,
          },
        });
      } catch (err: any) {
        toolResults.push({
          name: toolName,
          status: 'FAILED',
          result: { error: err.message },
        });

        await this.prisma.ragToolExecution.create({
          data: {
            conversationId: conversationId!,
            messageId: userMsg.id,
            toolName,
            status: 'FAILED',
            input: input,
            errorCode: 'TOOL_ERROR',
            errorMessage: err.message,
          },
        });
      }
    }

    // 7. Embed query and retrieve knowledge chunks
    let retrievedChunks: any[] = [];
    const embeddingProvider = this.embeddingRegistry.getProvider(
      agent.modelProvider,
    );

    try {
      const embedding = await embeddingProvider.embed(message, agent.model);
      retrievedChunks = await this.retrievalService.retrieve({
        agentId: agent.id,
        query: message,
        queryEmbedding: embedding,
        limit: 5,
        minScore: 0.6,
      });
    } catch (err: any) {
      this.logger.error(`Knowledge retrieval failed: ${err.message}`);
    }

    // 8. Construct grounding prompts
    const systemPrompt = this.promptBuilder.buildSystemPrompt({
      agentName: agent.name,
      systemPrompt: agent.systemPrompt,
      instructions: agent.instructions || undefined,
    });

    const userPrompt = this.promptBuilder.buildUserPrompt({
      userMessage: message,
      retrievedChunks,
      toolResults,
    });

    // Mapped LlmMessage structure for history
    const llmHistory: any[] = [
      { role: 'system', content: systemPrompt },
      ...history
        .filter((m) => m.id !== userMsg.id)
        .map((m) => ({
          role: m.role as any,
          content: m.content,
        })),
      { role: 'user', content: userPrompt },
    ];

    // 9. Call LLM Provider
    const llmProvider = this.llmRegistry.getProvider(agent.modelProvider);
    let response: any;
    try {
      response = await llmProvider.chat(llmHistory, {
        model: agent.model,
        temperature: Number(agent.temperature),
        maxTokens: agent.maxTokens,
      });
    } catch (err: any) {
      this.logger.error(`LLM call failed for agent ${agent.key}`, err.stack);
      throw new AiUnavailableException(
        'The AI assistant is temporarily unavailable. Please try again later.',
        'RAG_LLM_FAILED',
      );
    }

    const duration = Date.now() - startTime;

    // 10. Save assistant message and citations in transaction
    const savedMsg = await this.prisma.$transaction(async (tx) => {
      const msg = await tx.ragMessage.create({
        data: {
          conversationId: conversationId!,
          role: 'assistant',
          content: response.content,
          intent,
          modelProvider: agent.modelProvider,
          model: agent.model,
          promptTokens: response.promptTokens,
          completionTokens: response.completionTokens,
          totalTokens: response.promptTokens + response.completionTokens,
          responseTimeMs: duration,
          confidence: response.confidence ?? null,
        },
      });

      // Save citations
      if (retrievedChunks.length > 0) {
        await tx.ragMessageCitation.createMany({
          data: retrievedChunks.map((chunk, idx) => ({
            messageId: msg.id,
            knowledgeSourceId: chunk.knowledgeSourceId,
            documentId: chunk.documentId,
            chunkId: chunk.chunkId,
            citationIndex: idx + 1,
            label: chunk.metadata?.title || 'Knowledge Doc',
            excerpt: chunk.content.substring(0, 100),
            relevanceScore: chunk.finalScore,
          })),
        });
      }

      await tx.ragConversation.update({
        where: { id: conversationId! },
        data: { lastMessageAt: new Date() },
      });

      return msg;
    });

    // 11. Record performance metrics (async/background)
    this.repository
      .incrementMetrics({
        agentId: agent.id,
        isSuccessful: true,
        responseTimeMs: duration,
        confidence: response.confidence ?? null,
        promptTokens: response.promptTokens,
        completionTokens: response.completionTokens,
      })
      .catch((err) =>
        this.logger.error(`Failed to increment metrics: ${err.message}`),
      );

    // 12. Return structured RAG response
    const citations = retrievedChunks.map((chunk, idx) => ({
      index: idx + 1,
      label: chunk.metadata?.title || 'Knowledge Base',
      sourceId: chunk.knowledgeSourceId,
      excerpt: chunk.content,
      relevanceScore: chunk.finalScore,
    }));

    return {
      conversationId: conversationId!,
      messageId: savedMsg.id,
      answer: response.content,
      intent,
      confidence: response.confidence ?? null,
      citations,
      products: [], // Mapped when search tools find products
      toolsUsed: toolResults.map((tr) => ({
        name: tr.name,
        status: tr.status,
      })),
      suggestedActions: parsedOrderNumber
        ? [
            {
              type: 'VIEW_ORDER',
              label: 'View Order',
              entityId: parsedOrderNumber,
            },
          ]
        : [],
      responseTimeMs: duration,
    };
  }
}

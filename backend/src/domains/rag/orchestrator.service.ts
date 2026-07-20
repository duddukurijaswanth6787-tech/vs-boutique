import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RagRepository } from './rag.repository';
import { RetrievalService } from './retrieval.service';
import {
  GeminiLLMProvider,
  MockLLMProvider,
  type LLMProvider,
  type LLMResult,
} from './llm-provider.interface';
import type {
  OrchestrateDto,
  OrchestrateResponseDto,
  OrchestratorHealthDto,
  ProviderInfoDto,
  ToolInfoDto,
} from './orchestrator.types';

export interface Tool {
  name: string;
  description: string;
  execute(input: string): Promise<string>;
}

// ponytail: RetrievalTool is the only concrete tool.
// Product/Inventory/Order tools require business modules that don't exist yet.
// Add them as new Tool classes when the modules exist — no orchestrator changes needed.
class RetrievalTool implements Tool {
  name = 'retrieval';
  description = 'Search knowledge base for relevant context';

  constructor(private readonly retrievalService: RetrievalService) {}

  async execute(input: string): Promise<string> {
    try {
      const result = await this.retrievalService.retrieve({
        query: input,
        topK: 5,
        threshold: 0.7,
      });
      // ponytail: return rich metadata so citations can surface chunkId/docId/sourceId/score.
      // Content is kept for the prompt; embeddings are never included.
      return JSON.stringify(
        result.chunks.map((c) => ({
          chunkId: c.chunkId,
          documentId: c.documentId,
          knowledgeSourceId: c.knowledgeSourceId,
          score: c.score,
          content: c.content,
        })),
      );
    } catch {
      return '[]';
    }
  }
}

@Injectable()
export class AIOrchestratorService {
  private readonly provider: LLMProvider;
  private readonly tools: Map<string, Tool>;
  private readonly maxHistoryMessages: number;
  private readonly promptMaxTokens: number;
  private readonly defaultSystemPrompt: string;

  constructor(
    private readonly retrievalService: RetrievalService,
    private readonly ragRepository: RagRepository,
    config: ConfigService,
    geminiProvider: GeminiLLMProvider,
    mockProvider: MockLLMProvider,
  ) {
    const llmProvider = config.get<string>('rag.llmProvider', 'gemini');
    // ponytail: provider selection by config string. Switch to factory pattern when >2 providers coexist.
    this.provider = llmProvider === 'mock' ? mockProvider : geminiProvider;
    this.maxHistoryMessages = config.get<number>('rag.memoryMaxMessages', 20);
    this.promptMaxTokens = config.get<number>('rag.promptMaxTokens', 4000);
    this.defaultSystemPrompt =
      "You are a helpful AI assistant for Vasanthi Designers. Answer questions based on the provided context. If you don't know the answer, say so.";

    this.tools = new Map();
    this.tools.set('retrieval', new RetrievalTool(this.retrievalService));
  }

  async orchestrate(dto: OrchestrateDto): Promise<OrchestrateResponseDto> {
    if (!dto.message || dto.message.trim().length === 0)
      throw new BadRequestException('Message cannot be empty');
    if (dto.message.length > 10000)
      throw new BadRequestException('Message exceeds maximum length');

    const start = Date.now();

    let conversationId = dto.conversationId;
    if (!conversationId) {
      const conv = await this.ragRepository.conversation.create({
        data: {
          agentId: 'default',
          sessionId: dto.sessionId,
          title: dto.message.slice(0, 80),
          status: 'ACTIVE',
        },
      });
      conversationId = conv.id;
    }

    await this.ragRepository.message.create({
      data: { conversationId, role: 'user', content: dto.message },
    });

    const history = await this.ragRepository.message.findMany({
      where: { conversationId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      take: this.maxHistoryMessages,
    });

    const built = await this.buildPrompt(
      dto.message,
      history,
      dto.systemPrompt,
    );
    const systemPrompt = built.systemPrompt;
    const retrievalCount = built.retrievalCount;
    const fullPrompt = built.fullPrompt;

    const citations = await this.buildCitations(built.retrievalResults);

    let llmResult: LLMResult;
    try {
      llmResult = await this.provider.generate(systemPrompt, [
        { role: 'user', content: fullPrompt },
      ]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'LLM call failed';
      await this.ragRepository.message.create({
        data: {
          conversationId,
          role: 'assistant',
          content: `Error: ${errMsg}`,
          modelProvider: this.provider.model(),
          model: this.provider.model(),
        },
      });
      throw new BadRequestException(errMsg);
    }

    if (!llmResult.content || llmResult.content.trim().length === 0) {
      llmResult.content =
        'I apologize, but I was unable to generate a response. Please try rephrasing your question.';
    }

    await this.ragRepository.message.create({
      data: {
        conversationId,
        role: 'assistant',
        content: llmResult.content,
        modelProvider: llmResult.provider,
        model: llmResult.model,
        promptTokens: llmResult.promptTokens,
        completionTokens: llmResult.completionTokens,
        totalTokens: llmResult.totalTokens,
        responseTimeMs: llmResult.responseTimeMs,
      },
    });

    await this.ragRepository.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    return {
      message: dto.message,
      conversationId,
      response: llmResult.content,
      model: llmResult.model,
      provider: llmResult.provider,
      totalTokens: llmResult.totalTokens,
      responseTimeMs: Date.now() - start,
      retrievalCount,
      citations,
    };
  }

  // ponytail: build citations from retrieval tool output + batch title lookup.
  // One query for all doc titles — avoids N+1. Embeddings never leave the tool.
  private async buildCitations(retrievalResults: string): Promise<
    Array<{
      chunkId: string;
      documentId: string;
      knowledgeSourceId: string;
      documentTitle: string;
      score: number;
    }>
  > {
    let raw: Array<{
      chunkId: string;
      documentId: string;
      knowledgeSourceId: string;
      score: number;
      content: string;
    }> = [];
    try {
      raw = JSON.parse(retrievalResults);
    } catch {
      return [];
    }
    if (!Array.isArray(raw) || raw.length === 0) return [];
    const docIds = [...new Set(raw.map((r) => r.documentId).filter(Boolean))];
    const titles = new Map<string, string>();
    if (docIds.length) {
      const docs = await this.ragRepository.document.findMany({
        where: { id: { in: docIds }, deletedAt: null },
        select: { id: true, title: true },
      });
      for (const d of docs) titles.set(d.id, String(d.title ?? ''));
    }
    return raw.map((r) => ({
      chunkId: r.chunkId,
      documentId: r.documentId,
      knowledgeSourceId: r.knowledgeSourceId,
      documentTitle: titles.get(r.documentId) ?? '',
      score: r.score,
    }));
  }

  // ponytail: single source of truth for prompt assembly — reused by previewPrompt to avoid duplication
  private async buildPrompt(
    message: string,
    history: Array<{ role: string; content: string }>,
    systemPromptOverride?: string,
  ): Promise<{
    systemPrompt: string;
    retrievalResults: string;
    retrievalCount: number;
    fullPrompt: string;
    messages: Array<{ role: string; content: string }>;
  }> {
    const systemPrompt = systemPromptOverride ?? this.defaultSystemPrompt;
    const retrievalResults = await this.tools
      .get('retrieval')!
      .execute(message);
    const retrievalCount = JSON.parse(retrievalResults).length;
    const messages = history.map((m) => ({ role: m.role, content: m.content }));

    const promptParts: string[] = [];
    if (retrievalResults !== '[]') {
      promptParts.push('Relevant context:\n' + retrievalResults);
    }
    promptParts.push(...messages.map((m) => `${m.role}: ${m.content}`));
    const fullPrompt = promptParts
      .join('\n\n')
      .slice(0, this.promptMaxTokens * 4);

    return {
      systemPrompt,
      retrievalResults,
      retrievalCount,
      fullPrompt,
      messages,
    };
  }

  // Preview the assembled prompt without calling the LLM. Reuses buildPrompt.
  async previewPrompt(dto: {
    message: string;
    conversationId?: string;
    systemPrompt?: string;
  }): Promise<{
    systemPrompt: string;
    retrievedContext: string;
    conversation: Array<{ role: string; content: string }>;
    toolOutput: string;
    finalPrompt: string;
  }> {
    if (!dto.message || dto.message.trim().length === 0)
      throw new BadRequestException('Message cannot be empty');
    if (dto.message.length > 10000)
      throw new BadRequestException('Message exceeds maximum length');

    let history: Array<{ role: string; content: string }> = [];
    if (dto.conversationId) {
      const msgs = await this.ragRepository.message.findMany({
        where: { conversationId: dto.conversationId, deletedAt: null },
        orderBy: { createdAt: 'asc' },
        take: this.maxHistoryMessages,
      });
      history = msgs.map((m) => ({ role: m.role, content: m.content }));
    }

    const built = await this.buildPrompt(
      dto.message,
      history,
      dto.systemPrompt,
    );
    return {
      systemPrompt: built.systemPrompt,
      retrievedContext: built.retrievalResults,
      conversation: built.messages,
      toolOutput: built.retrievalResults,
      finalPrompt: built.fullPrompt,
    };
  }

  async getProviders(): Promise<ProviderInfoDto[]> {
    const health = await this.provider.health();
    return [
      {
        name: this.provider.constructor.name
          .replace('LLMProvider', '')
          .toLowerCase(),
        model: this.provider.model(),
        ok: health.ok,
        message: health.message,
      },
    ];
  }

  async getTools(): Promise<ToolInfoDto[]> {
    return Array.from(this.tools.values()).map((t) => ({
      name: t.name,
      description: t.description,
    }));
  }

  async health(): Promise<OrchestratorHealthDto> {
    const llmHealth = await this.provider.health();

    let retrievalOk = false;
    try {
      const retrievalHealth = await this.retrievalService.health();
      retrievalOk = retrievalHealth.status === 'healthy';
    } catch {
      /* degrade */
    }

    const healthy = llmHealth.ok && retrievalOk;
    return {
      llmProvider: this.provider.model(),
      llmOk: llmHealth.ok,
      retrievalOk,
      memoryOk: true,
      toolsAvailable: this.tools.size,
      status: healthy ? 'healthy' : 'degraded',
    };
  }
}

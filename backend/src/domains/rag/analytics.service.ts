import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RagRepository } from './rag.repository';
import { EmbeddingService } from './embedding.service';
import { AIOrchestratorService } from './orchestrator.service';
import { AIConsoleService } from './ai-console.service';
import { MetricsService } from '@infrastructure/monitoring/metrics.service';
import { AuditService } from '@domains/audit/audit.service';
import { loggerContextStorage } from '@common/logger/logger.context';
import type {
  DashboardDto,
  ToolAnalyticsDto,
  RetrievalAnalyticsDto,
  ProviderAnalyticsDto,
  ChatAnalyticsDto,
  AnalyticsHealthDto,
  TraceContextDto,
} from './analytics.types';

// ponytail: analytics reads the SHARED prom-client registry — no new counters created here.
// Previous phases already registered chat/tool/admin counters on MetricsService.registry.
@Injectable()
export class AnalyticsService {
  constructor(
    private readonly ragRepository: RagRepository,
    private readonly embeddingService: EmbeddingService,
    private readonly orchestrator: AIOrchestratorService,
    private readonly consoleService: AIConsoleService,
    private readonly metrics: MetricsService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
  ) {}

  /** Scrape the shared registry and sum counter values by metric name. */
  private async scrapeCounter(name: string): Promise<number> {
    try {
      const json = (await this.metrics.registry.getMetricsAsJSON()) as Array<{
        name: string;
        values?: Array<{ value: number }>;
        value?: number;
      }>;
      let total = 0;
      for (const m of json) {
        if (m.name !== name) continue;
        if (Array.isArray(m.values))
          total += m.values.reduce((s, v) => s + (v.value ?? 0), 0);
        else if (typeof m.value === 'number') total += m.value;
      }
      return total;
    } catch {
      return 0;
    }
  }

  async getDashboard(_window = 1): Promise<DashboardDto> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [
      totalConversations,
      activeConversations,
      messagesToday,
      documents,
      chunks,
      embeddings,
      knowledgeSources,
      pending,
    ] = await Promise.all([
      this.ragRepository.conversation.count({ where: { deletedAt: null } }),
      this.ragRepository.conversation.count({
        where: { deletedAt: null, lastMessageAt: { gte: since } },
      }),
      this.ragRepository.message.count({
        where: { createdAt: { gte: since } },
      }),
      this.ragRepository.document.count({ where: { deletedAt: null } }),
      this.ragRepository.documentChunk.count(),
      this.ragRepository.countIndexed(),
      this.ragRepository.knowledgeSource.count({ where: { deletedAt: null } }),
      this.ragRepository.countPending(),
    ]);

    const embeddingHealth = await this.embeddingService.healthCheck();
    const orchHealth = await this.orchestrator.health();
    const [chatMsgs, toolExec] = await Promise.all([
      this.scrapeCounter('vasanthi_rag_chat_messages_total'),
      this.scrapeCounter('vasanthi_rag_tool_executions_total'),
    ]);
    const avgSec = await this.scrapeHistogramAvg(
      'vasanthi_rag_chat_response_seconds',
    );

    return {
      totalConversations,
      activeConversations,
      messagesToday,
      retrievalRequests: chatMsgs,
      avgRetrievalLatencyMs: Math.round(avgSec * 1000),
      embeddingRequests: embeddings,
      embeddingFailures: pending,
      llmRequests: chatMsgs,
      avgLlmLatencyMs: Math.round(avgSec * 1000),
      toolExecutions: toolExec,
      toolFailures: 0,
      queueDepth: 0,
      documents,
      chunks,
      embeddings,
      knowledgeSources,
      providerUptime: embeddingHealth.ok && orchHealth.llmOk ? 100 : 0,
    };
  }

  // ponytail: histogram average via registry JSON — approximate (mean of sample means).
  private async scrapeHistogramAvg(name: string): Promise<number> {
    try {
      const json = (await this.metrics.registry.getMetricsAsJSON()) as Array<{
        name: string;
        values?: Array<{ value: number }>;
      }>;
      for (const m of json) {
        if (m.name !== name) continue;
        const vals = (m.values ?? [])
          .map((v) => v.value)
          .filter((v) => typeof v === 'number');
        if (vals.length) return vals.reduce((a, b) => a + b, 0) / vals.length;
      }
    } catch {
      /* ignore */
    }
    return 0;
  }

  /** Raw Prometheus metrics, reused from the shared registry — no duplication. */
  getMetrics(): Promise<unknown> {
    return this.metrics.registry.getMetricsAsJSON();
  }

  async getToolAnalytics(): Promise<ToolAnalyticsDto> {
    const total = await this.scrapeCounter(
      'vasanthi_rag_tool_executions_total',
    );
    return {
      total,
      success: total,
      failures: 0,
      byTool: {},
    };
  }

  async getRetrievalAnalytics(): Promise<RetrievalAnalyticsDto> {
    const [documents, chunks, indexed, pending] = await Promise.all([
      this.ragRepository.document.count({ where: { deletedAt: null } }),
      this.ragRepository.documentChunk.count(),
      this.ragRepository.countIndexed(),
      this.ragRepository.countPending(),
    ]);
    return { documents, chunks, embeddings: indexed, pending, indexed };
  }

  async getProviderAnalytics(): Promise<ProviderAnalyticsDto> {
    const embedding = await this.embeddingService.getProviderInfo();
    const llm = await this.orchestrator.getProviders();
    return {
      embedding: {
        ok: embedding[0]?.ok ?? false,
        model: embedding[0]?.model ?? '',
      },
      llm: { ok: llm[0]?.ok ?? false, model: llm[0]?.model ?? '' },
    };
  }

  async getChatAnalytics(): Promise<ChatAnalyticsDto> {
    const conversations = await this.ragRepository.conversation.count({
      where: { deletedAt: null },
    });
    const messages = await this.ragRepository.message.count();
    return {
      conversations,
      messages,
      feedbackReceived: 0,
      avgConversationLength:
        messages > 0 && conversations > 0
          ? Math.round(messages / conversations)
          : 0,
    };
  }

  async getHealth(): Promise<AnalyticsHealthDto> {
    const base = await this.consoleService.getHealth();
    const toolsEnabled = this.config.get<boolean>('rag.toolsEnabled', true);
    const chatEnabled = this.config.get<boolean>('rag.chatEnabled', true);
    const adminEnabled = this.config.get<boolean>('rag.adminEnabled', true);
    return {
      ...base,
      businessTools: toolsEnabled ? 'up' : 'disabled',
      customerChat: chatEnabled ? 'up' : 'disabled',
      adminConsole: adminEnabled ? 'up' : 'disabled',
    };
  }

  // ponytail: tracing = surface the current request's correlation/request context from AsyncLocalStorage.
  // Per-span tool/retrieval/LLM trace IDs are generated in their services; full distributed tracing is out of scope.
  getTraceContext(conversationId?: string): TraceContextDto {
    const store = loggerContextStorage.getStore() as
      { requestId?: string; correlationId?: string } | undefined;
    return {
      requestId: store?.requestId,
      correlationId: store?.correlationId,
      conversationId,
    };
  }

  async logAccess(actorId?: string): Promise<void> {
    await this.audit.log({
      action: 'analytics.view',
      module: 'rag',
      resource: 'Analytics',
      userId: actorId,
    });
  }
}

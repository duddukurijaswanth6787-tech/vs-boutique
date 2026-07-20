import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { RagService } from './rag.service';
import { RetrievalService } from './retrieval.service';
import { EmbeddingService } from './embedding.service';
import { AIOrchestratorService } from './orchestrator.service';
import { RagRepository } from './rag.repository';
import { PrismaService } from '@database/prisma.service';
import { RedisService } from '@infrastructure/redis/redis.service';
import { StorageService } from '@infrastructure/storage/storage.service';
import { MetricsService } from '@infrastructure/monitoring/metrics.service';
import { Counter } from 'prom-client';
import { VectorDistance } from './rag.types';
import type {
  AdminDashboardDto,
  AdminHealthDto,
  AdminProviderDto,
} from './ai-console.types';

@Injectable()
export class AIConsoleService {
  // ponytail: single admin-actions counter on shared registry. Add per-action labels when dashboards need them.
  private readonly adminActions: Counter<string>;

  constructor(
    private readonly ragService: RagService,
    private readonly retrievalService: RetrievalService,
    private readonly embeddingService: EmbeddingService,
    private readonly orchestratorService: AIOrchestratorService,
    private readonly ragRepository: RagRepository,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly storage: StorageService,
    private readonly metrics: MetricsService,
    private readonly config: ConfigService,
    @InjectQueue('embedding-generation') private readonly queue: Queue,
  ) {
    this.adminActions = new Counter({
      name: 'vasanthi_rag_admin_actions_total',
      help: 'Total admin console actions',
      labelNames: ['action'],
      registers: [this.metrics.registry],
    });
  }

  async getDashboard(): Promise<AdminDashboardDto> {
    const [
      docCount,
      sourceCount,
      chunkCount,
      conversationCount,
      indexedCount,
      pendingCount,
    ] = await Promise.all([
      this.ragRepository.document.count({ where: { deletedAt: null } }),
      this.ragRepository.knowledgeSource.count({ where: { deletedAt: null } }),
      this.ragRepository.documentChunk.count(),
      this.ragRepository.conversation.count({ where: { deletedAt: null } }),
      this.ragRepository.countIndexed(),
      this.ragRepository.countPending(),
      this.ragService.getKnowledgeSourceStats(),
    ]);

    const providerInfo = await this.embeddingService.getProviderInfo();
    const llmHealth = await this.orchestratorService.health();

    let queueStatus = 'down';
    try {
      const client = (await this.queue.client) as unknown as {
        ping(): Promise<string>;
      };
      queueStatus = (await client.ping()) === 'PONG' ? 'up' : 'down';
    } catch {
      /* degrade */
    }

    // ponytail: average latency + retrieval requests approximated from message responseTimeMs.
    // Wire real metrics when a dedicated analytics store exists.
    const recent = await this.ragRepository.message.findMany({
      where: { role: 'assistant', responseTimeMs: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: { responseTimeMs: true },
    });
    const latencies = recent.map(
      (m: { responseTimeMs: number | null }) => m.responseTimeMs ?? 0,
    );
    const averageLatencyMs = latencies.length
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : 0;
    const retrievalRequests = recent.length;

    return {
      totalDocuments: docCount,
      totalKnowledgeSources: sourceCount,
      totalChunks: chunkCount,
      totalEmbeddings: indexedCount,
      totalConversations: conversationCount,
      retrievalRequests,
      providerStatus: {
        embedding: providerInfo[0]?.ok ? 'up' : 'down',
        llm: llmHealth.llmOk ? 'up' : 'down',
      },
      queueStatus,
      averageLatencyMs,
      recentFailures: pendingCount,
    };
  }

  async getKnowledge(dto: {
    page: number;
    limit: number;
    enabled?: boolean;
    syncStatus?: string;
  }) {
    this.adminActions.inc({ action: 'knowledge_list' });
    const where: Record<string, unknown> = { deletedAt: null };
    if (dto.enabled !== undefined) where.enabled = dto.enabled;
    if (dto.syncStatus) where.syncStatus = dto.syncStatus;
    const [items, total] = await Promise.all([
      this.ragRepository.knowledgeSource.findMany({
        where,
        skip: (dto.page - 1) * dto.limit,
        take: dto.limit,
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
      }),
      this.ragRepository.knowledgeSource.count({ where }),
    ]);
    return { items, total };
  }

  async toggleKnowledgeSource(id: string, enabled: boolean) {
    this.adminActions.inc({ action: 'knowledge_toggle' });
    const source = await this.ragRepository.knowledgeSource.findFirst({
      where: { id, deletedAt: null },
    });
    if (!source) throw new NotFoundException('Knowledge source not found');
    await this.ragRepository.knowledgeSource.update({
      where: { id },
      data: { enabled },
    });
    return { id, enabled };
  }

  async getDocuments(dto: {
    page: number;
    limit: number;
    filename?: string;
    knowledgeSourceId?: string;
    status?: string;
  }) {
    this.adminActions.inc({ action: 'document_list' });
    const where: Record<string, unknown> = { deletedAt: null };
    if (dto.filename)
      where.filename = { contains: dto.filename, mode: 'insensitive' };
    if (dto.knowledgeSourceId) where.knowledgeSourceId = dto.knowledgeSourceId;
    if (dto.status) where.status = dto.status;
    const [items, total] = await Promise.all([
      this.ragRepository.document.findMany({
        where,
        skip: (dto.page - 1) * dto.limit,
        take: dto.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.ragRepository.document.count({ where }),
    ]);
    return { items, total };
  }

  async getDocumentChunks(documentId: string, page: number, limit: number) {
    this.adminActions.inc({ action: 'chunk_preview' });
    return this.ragRepository.findChunksByDocument(documentId, page, limit);
  }

  async getConversations(dto: {
    page: number;
    limit: number;
    userId?: string;
    sessionId?: string;
    search?: string;
  }) {
    this.adminActions.inc({ action: 'conversation_list' });
    const where: Record<string, unknown> = { deletedAt: null };
    if (dto.userId) where.userId = dto.userId;
    if (dto.sessionId) where.sessionId = dto.sessionId;
    if (dto.search) {
      where.messages = {
        some: {
          content: { contains: dto.search, mode: 'insensitive' },
          deletedAt: null,
        },
      };
    }
    const [items, total] = await Promise.all([
      this.ragRepository.conversation.findMany({
        where,
        skip: (dto.page - 1) * dto.limit,
        take: dto.limit,
        orderBy: { updatedAt: 'desc' },
        include: { _count: { select: { messages: true } } },
      }),
      this.ragRepository.conversation.count({ where }),
    ]);
    return { items, total };
  }

  async getProviders(): Promise<AdminProviderDto[]> {
    this.adminActions.inc({ action: 'provider_list' });
    const current = this.config.get<string>('rag.llmProvider', 'gemini');
    const embeddingInfo = await this.embeddingService.getProviderInfo();
    const llmProviders = await this.orchestratorService.getProviders();
    const all = [
      ...embeddingInfo.map((p) => ({
        name: `embedding:${p.name}`,
        model: p.model,
        enabled: p.ok,
        current: false,
      })),
      ...llmProviders.map((p) => ({
        name: `llm:${p.name}`,
        model: p.model,
        enabled: p.ok,
        current: p.name === current,
      })),
    ];
    return all;
  }

  async testRetrieval(dto: {
    query: string;
    topK?: number;
    threshold?: number;
    distance?: 'cosine' | 'l2' | 'inner';
    knowledgeSourceId?: string;
    documentId?: string;
  }) {
    this.adminActions.inc({ action: 'retrieval_test' });
    const maxLen = this.config.get<number>('rag.maxTestQueryLength', 2000);
    if (dto.query.length > maxLen)
      throw new BadRequestException(`Query exceeds max length of ${maxLen}`);
    // ponytail: reuse RetrievalService.retrieve — no duplicated retrieval logic (TASK 5, no LLM call)
    return this.retrievalService.retrieve({
      query: dto.query,
      topK: dto.topK ?? 5,
      threshold: dto.threshold ?? 0.7,
      distance: dto.distance ? (dto.distance as VectorDistance) : undefined,
      knowledgeSourceId: dto.knowledgeSourceId,
      documentId: dto.documentId,
    });
  }

  async previewPrompt(dto: {
    message: string;
    conversationId?: string;
    systemPrompt?: string;
  }) {
    this.adminActions.inc({ action: 'prompt_preview' });
    const preview = await this.orchestratorService.previewPrompt(dto);
    const limit = this.config.get<number>('rag.promptPreviewLimit', 4000);
    return {
      systemPrompt: preview.systemPrompt,
      retrievedContext: preview.retrievedContext.slice(0, limit),
      conversation: preview.conversation,
      toolOutput: preview.toolOutput.slice(0, limit),
      finalPrompt: this.maskSecrets(preview.finalPrompt).slice(0, limit),
    };
  }

  // ponytail: minimal secret/key masking for console output. Extend the regex list when new secret patterns appear.
  private maskSecrets(text: string): string {
    return text
      .replace(/AIza[0-9A-Za-z_-]{35}/g, '***GEMINI_KEY***')
      .replace(/sk-[A-Za-z0-9]{20,}/g, '***OPENAI_KEY***')
      .replace(/AKIA[0-9A-Z]{16}/g, '***AWS_KEY***');
  }

  async syncKnowledgeSource(id: string) {
    this.adminActions.inc({ action: 'knowledge_sync' });
    return this.ragService.syncKnowledgeSource(id);
  }

  async syncAllKnowledgeSources() {
    this.adminActions.inc({ action: 'knowledge_sync_all' });
    return this.ragService.syncAllKnowledgeSources();
  }

  async getHealth(): Promise<AdminHealthDto> {
    this.adminActions.inc({ action: 'health' });
    const checks: Record<string, { status: string; weight: number }> = {};

    const dbUp = await this.prisma.ping().catch(() => false);
    checks.database = { status: dbUp ? 'up' : 'down', weight: 2 };

    let redisUp = false;
    try {
      redisUp = await this.redis.ping();
    } catch {
      /* degrade */
    }
    checks.redis = { status: redisUp ? 'up' : 'down', weight: 1 };

    let bullUp = false;
    try {
      const client = (await this.queue.client) as unknown as {
        ping(): Promise<string>;
      };
      bullUp = (await client.ping()) === 'PONG';
    } catch {
      /* degrade */
    }
    checks.bullmq = { status: bullUp ? 'up' : 'down', weight: 1 };

    const embedHealth = await this.embeddingService.healthCheck();
    checks.embedding = { status: embedHealth.ok ? 'up' : 'down', weight: 2 };

    const retrievalHealth = await this.retrievalService.health();
    checks.retrieval = {
      status: retrievalHealth.status === 'healthy' ? 'up' : 'degraded',
      weight: 2,
    };

    const orchHealth = await this.orchestratorService.health();
    checks.orchestrator = {
      status: orchHealth.status === 'healthy' ? 'up' : 'degraded',
      weight: 1,
    };

    let storageUp = false;
    try {
      storageUp = (await this.storage.healthCheck()).writable;
    } catch {
      /* degrade */
    }
    checks.storage = { status: storageUp ? 'up' : 'down', weight: 1 };

    const totalWeight = Object.values(checks).reduce((s, c) => s + c.weight, 0);
    const healthyWeight = Object.values(checks)
      .filter((c) => c.status === 'up')
      .reduce((s, c) => s + c.weight, 0);
    const score = Math.round((healthyWeight / totalWeight) * 100);

    const anyDown = Object.values(checks).some((c) => c.status === 'down');
    const overall = anyDown
      ? 'unhealthy'
      : score === 100
        ? 'healthy'
        : 'degraded';

    return {
      overall,
      score,
      database: checks.database.status,
      redis: checks.redis.status,
      bullmq: checks.bullmq.status,
      embedding: checks.embedding.status,
      retrieval: checks.retrieval.status,
      orchestrator: checks.orchestrator.status,
      storage: checks.storage.status,
    };
  }
}

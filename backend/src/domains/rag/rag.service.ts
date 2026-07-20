import {
  Injectable,
  NotImplementedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RagRepository } from './rag.repository';
import {
  VectorHealthDto,
  VectorSearchDto,
  KnowledgeSourceHealthDto,
  KnowledgeSourceStatsDto,
  SyncResultDto,
} from './rag.types';
import { DocumentAdapter } from './knowledge-source.adapter';

@Injectable()
export class RagService {
  constructor(
    private readonly configService: ConfigService,
    private readonly ragRepository: RagRepository,
    private readonly documentAdapter: DocumentAdapter,
  ) {}

  // ponytail: agent CRUD deferred — RagAgentModule has schema mismatches (customerId, behaviorConfig, ragToolExecution, ragAgentMetric).
  // These will be resolved when the rag-agent schema is aligned. For now, agent endpoints return 501.
  async findAgents(_page: number, _limit: number) {
    throw new NotImplementedException('RAG agent management requires RagAgentModule (schema alignment pending)');
  }

  async findAgentById(_id: string) {
    throw new NotImplementedException('RAG agent management requires RagAgentModule (schema alignment pending)');
  }

  async createAgent(_dto: any, _userId: string) {
    throw new NotImplementedException('RAG agent management requires RagAgentModule (schema alignment pending)');
  }

  async updateAgent(_id: string, _dto: any, _userId: string) {
    throw new NotImplementedException('RAG agent management requires RagAgentModule (schema alignment pending)');
  }

  async deleteAgent(_id: string, _userId: string) {
    throw new NotImplementedException('RAG agent management requires RagAgentModule (schema alignment pending)');
  }

  async findKnowledgeSources(page: number, limit: number) {
    return this.ragRepository.findKnowledgeSources(page, limit);
  }

  async findKnowledgeSourceById(id: string) {
    return this.ragRepository.findKnowledgeSourceById(id);
  }

  async createKnowledgeSource(dto: any, userId: string) {
    return this.ragRepository.createKnowledgeSource({
      name: dto.name,
      sourceType: dto.sourceType,
      sourceUrl: dto.sourceUrl,
      rawText: dto.rawText,
      enabled: dto.enabled ?? true,
      priority: dto.priority ?? 5,
      syncMode: dto.syncMode ?? 'manual',
      createdBy: userId,
    });
  }

  async updateKnowledgeSource(id: string, dto: any, userId: string) {
    const source = await this.ragRepository.findKnowledgeSourceById(id);
    if (!source) throw new BadRequestException('Knowledge source not found');
    await this.ragRepository.updateKnowledgeSource(id, {
      ...dto,
      updatedBy: userId,
    });
    return this.ragRepository.findKnowledgeSourceById(id);
  }

  async deleteKnowledgeSource(id: string, _userId: string) {
    const source = await this.ragRepository.findKnowledgeSourceById(id);
    if (!source) throw new BadRequestException('Knowledge source not found');
    await this.ragRepository.deleteKnowledgeSource(id);
  }

  async syncKnowledgeSource(id: string): Promise<SyncResultDto> {
    const source = await this.ragRepository.findKnowledgeSourceById(id);
    if (!source) throw new BadRequestException('Knowledge source not found');
    if (!source['enabled'])
      throw new BadRequestException('Knowledge source is disabled');

    await this.ragRepository.updateKnowledgeSourceSync(id, {
      syncStatus: 'SYNCING',
      lastSyncAt: new Date(),
      lastSyncDuration: 0,
    });

    // ponytail: DocumentAdapter handles all source types for now.
    // Add adapter routing (sourceType → adapter) when non-document adapters exist.
    return this.documentAdapter.sync(id);
  }

  async syncAllKnowledgeSources(): Promise<{
    results: SyncResultDto[];
    total: number;
    failed: number;
  }> {
    const { items } = await this.ragRepository.findKnowledgeSources(1, 1000);
    const enabled = items.filter((s: Record<string, unknown>) => s['enabled']);
    const results = await Promise.allSettled(
      enabled.map((s: Record<string, unknown>) =>
        this.syncKnowledgeSource(s['id'] as string),
      ),
    );
    const succeeded = results
      .filter((r) => r.status === 'fulfilled')
      .map((r: any) => r.value);
    const failed = results.filter((r) => r.status === 'rejected').length;
    return { results: succeeded, total: results.length, failed };
  }

  async getKnowledgeSourceStats(): Promise<KnowledgeSourceStatsDto> {
    return this.ragRepository.getKnowledgeSourceStats();
  }

  async getKnowledgeSourceHealth(): Promise<KnowledgeSourceHealthDto> {
    const health = await this.ragRepository.getKnowledgeSourceHealth();
    return {
      ...health,
      status:
        health.failedSyncs > 0
          ? 'degraded'
          : health.registeredAdapters === 0
            ? 'unhealthy'
            : 'healthy',
      message:
        health.failedSyncs > 0
          ? `${health.failedSyncs} knowledge source(s) have failed sync`
          : 'All knowledge sources operational',
    };
  }

  async findConversations(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.ragRepository.conversation.findMany({
        where: { deletedAt: null },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: { _count: { select: { messages: true } } },
      }),
      this.ragRepository.conversation.count({ where: { deletedAt: null } }),
    ]);
    return { items, total };
  }

  async findConversationById(id: string) {
    return this.ragRepository.conversation.findFirst({
      where: { id, deletedAt: null },
      include: {
        messages: { where: { deletedAt: null }, orderBy: { createdAt: 'asc' } },
      },
    });
  }

  async deleteConversation(id: string, _userId: string) {
    await this.ragRepository.conversation.update({
      where: { id },
      data: { status: 'ARCHIVED', deletedAt: new Date() },
    });
  }

  async findDocumentsBySource(
    sourceId: string,
    page: number,
    limit: number,
  ) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.ragRepository.document.findMany({
        where: { knowledgeSourceId: sourceId, deletedAt: null },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.ragRepository.document.count({
        where: { knowledgeSourceId: sourceId, deletedAt: null },
      }),
    ]);
    return { items, total };
  }

  async findDocumentById(id: string) {
    const doc = await this.ragRepository.document.findFirst({
      where: { id, deletedAt: null },
      include: { chunks: { orderBy: { chunkIndex: 'asc' } } },
    });
    if (!doc) throw new BadRequestException('Document not found');
    return doc;
  }

  async findChunksByDocument(
    documentId: string,
    page: number,
    limit: number,
  ) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.ragRepository.documentChunk.findMany({
        where: { documentId },
        skip,
        take: limit,
        orderBy: { chunkIndex: 'asc' },
      }),
      this.ragRepository.documentChunk.count({
        where: { documentId },
      }),
    ]);
    return { items, total };
  }

  async submitFeedback(messageId: string, dto: any, userId: string) {
    return this.ragRepository.createFeedback({
      messageId,
      userId,
      rating: dto.rating,
      comment: dto.comment,
      isHelpful: dto.isHelpful,
    });
  }

  async findEmbeddingJobs(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.ragRepository.embeddingJob.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.ragRepository.embeddingJob.count(),
    ]);
    return { items, total };
  }

  async findEmbeddingJobById(id: string) {
    const job = await this.ragRepository.embeddingJob.findFirst({
      where: { id },
    });
    if (!job) throw new BadRequestException('Embedding job not found');
    return job;
  }

  // ── Vector search ────────────────────────────────────────────

  async vectorSearch(
    dto: VectorSearchDto,
  ): Promise<Array<Record<string, unknown>>> {
    const distance = dto.distance ?? 'cosine';
    const topK =
      dto.topK ?? this.configService.get<number>('rag.vectorTopK', 10);
    const threshold =
      dto.threshold ??
      this.configService.get<number>('rag.vectorThreshold', 0.7);

    return this.ragRepository.findNearest(dto.vector, {
      distance,
      topK,
      threshold,
      knowledgeSourceId: dto.knowledgeSourceId,
      documentId: dto.documentId,
    });
  }

  async vectorHealth(): Promise<VectorHealthDto> {
    const health = new VectorHealthDto();
    const dimension = this.configService.get('rag.vectorDimension', 1536);
    health.dimension = dimension;

    try {
      const pgvector = await this.ragRepository.checkPgvectorInstalled();
      const indexes = await this.ragRepository.checkIndexesExist();
      const totalChunks = await this.ragRepository.countIndexed();
      const pendingChunks = await this.ragRepository.countPending();
      const latency = await this.ragRepository.pingVectorQuery();

      health.pgvectorInstalled = pgvector.installed;
      health.pgvectorVersion = pgvector.version;
      health.indexesExist = indexes.exists;
      health.indexNames = indexes.names;
      health.queryable = pgvector.installed && indexes.exists;
      health.latencyMs = latency;
      health.totalChunks = totalChunks + pendingChunks;
      health.indexedChunks = totalChunks;

      if (!pgvector.installed) {
        health.status = 'unhealthy';
      } else if (!indexes.exists || latency > 1000) {
        health.status = 'degraded';
      } else {
        health.status = 'healthy';
      }
    } catch {
      health.status = 'unhealthy';
    }

    return health;
  }

  async countIndexed(): Promise<number> {
    return this.ragRepository.countIndexed();
  }

  async countPending(): Promise<number> {
    return this.ragRepository.countPending();
  }
}

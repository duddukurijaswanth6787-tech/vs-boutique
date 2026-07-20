import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';

@Injectable()
export class RagRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ponytail: Phase 1 accessors — pure Prisma delegates, zero business logic
  get agent() {
    return this.prisma.ragAgent;
  }
  get conversation() {
    return this.prisma.ragConversation;
  }

  async createFeedback(data: {
    messageId: string;
    userId: string | null;
    isHelpful: boolean;
    rating?: number;
    comment?: string;
  }): Promise<void> {
    await this.prisma.ragFeedback.create({ data });
  }
  get message() {
    return this.prisma.ragMessage;
  }
  get knowledgeSource() {
    return this.prisma.ragKnowledgeSource;
  }
  get document() {
    return this.prisma.ragDocument;
  }
  get documentChunk() {
    return this.prisma.ragDocumentChunk;
  }
  get embeddingJob() {
    return this.prisma.ragEmbeddingJob;
  }
  get feedback() {
    return this.prisma.ragFeedback;
  }

  // ── Document operations ──────────────────────────────────────

  async ping(): Promise<void> {
    await this.prisma.$queryRawUnsafe(`SELECT 1`);
  }

  async findByHash(hash: string): Promise<{ id: string } | null> {
    return this.prisma.ragDocument.findFirst({
      where: { contentHash: hash, deletedAt: null },
      select: { id: true },
    });
  }

  async createDocument(data: {
    knowledgeSourceId: string;
    title: string;
    filename: string;
    size: number;
    mimeType: string;
    contentHash: string;
    status: string;
    createdBy?: string;
  }): Promise<{ id: string; createdAt: Date }> {
    return this.prisma.ragDocument.create({
      data,
      select: { id: true, createdAt: true },
    });
  }

  async updateStoragePath(id: string, storagePath: string): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `UPDATE rag_documents SET "storagePath" = $1 WHERE id = $2`,
      storagePath,
      id,
    );
  }

  async updateMetadata(
    id: string,
    data: { language?: string | null; pageCount?: number | null },
  ): Promise<void> {
    if (data.language !== undefined || data.pageCount !== undefined) {
      const setClauses: string[] = [];
      const params: unknown[] = [];
      let idx = 1;
      if (data.language !== undefined) {
        setClauses.push(`"language" = $${idx++}`);
        params.push(data.language);
      }
      if (data.pageCount !== undefined) {
        setClauses.push(`"pageCount" = $${idx++}`);
        params.push(data.pageCount);
      }
      params.push(id);
      await this.prisma.$executeRawUnsafe(
        `UPDATE rag_documents SET ${setClauses.join(', ')} WHERE id = $${idx}`,
        ...params,
      );
    }
  }

  async updateDocumentStatus(
    id: string,
    status: string,
    errorMessage?: string,
  ): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `UPDATE rag_documents SET "status" = $1, "errorMessage" = $2 WHERE id = $3`,
      status,
      errorMessage ?? null,
      id,
    );
  }

  async insertChunks(
    chunks: Array<{
      documentId: string;
      knowledgeSourceId: string;
      chunkIndex: number;
      content: string;
      characterCount: number;
      startOffset?: number;
      endOffset?: number;
    }>,
  ): Promise<void> {
    await this.prisma.ragDocumentChunk.createMany({ data: chunks });
  }

  async listDocuments(
    page: number,
    limit: number,
  ): Promise<{ items: Array<Record<string, unknown>>; total: number }> {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.ragDocument.findMany({
        where: { deletedAt: null },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.ragDocument.count({ where: { deletedAt: null } }),
    ]);
    return { items, total };
  }

  async getDocument(id: string): Promise<Record<string, unknown> | null> {
    return this.prisma.ragDocument.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async deleteDocument(id: string): Promise<void> {
    await this.prisma.ragDocument.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findChunksByDocument(
    documentId: string,
    page: number,
    limit: number,
  ): Promise<{ items: Array<Record<string, unknown>>; total: number }> {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.ragDocumentChunk.findMany({
        where: { documentId },
        skip,
        take: limit,
        orderBy: { chunkIndex: 'asc' },
      }),
      this.prisma.ragDocumentChunk.count({ where: { documentId } }),
    ]);
    return { items, total };
  }

  async findJobsByDocument(
    documentId: string,
  ): Promise<Array<Record<string, unknown>>> {
    return this.prisma.ragEmbeddingJob.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Vector operations (raw SQL via pgvector extension) ────────
  // ponytail: Prisma doesn't support vector type — use $queryRawUnsafe for all vector ops

  private operator(distance: string): string {
    return distance === 'l2' ? '<->' : distance === 'inner' ? '<#>' : '<=>';
  }

  async findNearest(
    vector: number[],
    options: {
      distance: string;
      topK: number;
      threshold: number;
      knowledgeSourceId?: string;
      documentId?: string;
    },
  ): Promise<Array<Record<string, unknown>>> {
    const op = this.operator(options.distance);
    const dim = vector.length;
    const vec = `[${vector.join(',')}]`;
    const params: unknown[] = [vec, options.threshold, options.topK];
    let paramIdx = 4;

    let where = `WHERE embedding IS NOT NULL AND embedding ${op} $1::vector(${dim}) < $2`;
    if (options.knowledgeSourceId) {
      where += ` AND "knowledgeSourceId" = $${paramIdx++}`;
      params.push(options.knowledgeSourceId);
    }
    if (options.documentId) {
      where += ` AND "documentId" = $${paramIdx++}`;
      params.push(options.documentId);
    }

    const sql = `
      SELECT id, "documentId", "knowledgeSourceId", content, "chunkIndex",
             embedding ${op} $1::vector(${dim}) AS score, metadata
      FROM rag_document_chunks
      ${where}
      ORDER BY score
      LIMIT $3`;

    return this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      sql,
      ...params,
    );
  }

  async insertVector(
    chunkId: string,
    vector: number[],
    dimension: number,
    model: string,
    version: number,
  ): Promise<void> {
    const vec = `[${vector.join(',')}]`;
    await this.prisma.$executeRawUnsafe(
      `UPDATE rag_document_chunks
       SET embedding = $1::vector($2), "embeddingModel" = $3, "embeddingDimension" = $2,
           "embeddingVersion" = $4, "indexedAt" = NOW()
       WHERE id = $5`,
      vec,
      dimension,
      model,
      version,
      chunkId,
    );
  }

  async updateVector(
    chunkId: string,
    vector: number[],
    dimension: number,
  ): Promise<void> {
    const vec = `[${vector.join(',')}]`;
    await this.prisma.$executeRawUnsafe(
      `UPDATE rag_document_chunks
       SET embedding = $1::vector($2), "embeddingDimension" = $2, "indexedAt" = NOW()
       WHERE id = $3`,
      vec,
      dimension,
      chunkId,
    );
  }

  async deleteVector(chunkId: string): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `UPDATE rag_document_chunks SET embedding = NULL, "indexedAt" = NULL WHERE id = $1`,
      chunkId,
    );
  }

  async findByDocument(
    documentId: string,
  ): Promise<Array<Record<string, unknown>>> {
    return this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT id, "chunkIndex", content, tokenCount, 
              "embeddingVersion", "embeddingModel", "embeddingDimension", "indexedAt",
              metadata
       FROM rag_document_chunks
       WHERE "documentId" = $1
       ORDER BY "chunkIndex"`,
      documentId,
    );
  }

  async findByKnowledgeSource(
    knowledgeSourceId: string,
  ): Promise<Array<Record<string, unknown>>> {
    return this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT id, "documentId", "chunkIndex", content, tokenCount,
              "embeddingVersion", "embeddingModel", "embeddingDimension", "indexedAt",
              metadata
       FROM rag_document_chunks
       WHERE "knowledgeSourceId" = $1
       ORDER BY "documentId", "chunkIndex"`,
      knowledgeSourceId,
    );
  }

  async countIndexed(): Promise<number> {
    const result = await this.prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) as count FROM rag_document_chunks WHERE embedding IS NOT NULL`,
    );
    return Number(result[0]?.count ?? 0);
  }

  async countPending(): Promise<number> {
    const result = await this.prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) as count FROM rag_document_chunks WHERE embedding IS NULL`,
    );
    return Number(result[0]?.count ?? 0);
  }

  // ── Knowledge Source operations ──────────────────────────────

  async findKnowledgeSourceById(
    id: string,
  ): Promise<Record<string, unknown> | null> {
    return this.prisma.ragKnowledgeSource.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findKnowledgeSources(
    page: number,
    limit: number,
  ): Promise<{ items: Array<Record<string, unknown>>; total: number }> {
    const skip = (page - 1) * limit;
    // ponytail: raw SQL because Prisma types don't know about new 'priority' and 'syncStatus' fields
    const items = await this.prisma.$queryRawUnsafe<
      Array<Record<string, unknown>>
    >(
      `SELECT * FROM rag_knowledge_sources WHERE "deletedAt" IS NULL
       ORDER BY "priority" ASC, "createdAt" DESC LIMIT $1 OFFSET $2`,
      limit,
      skip,
    );
    const countResult = await this.prisma.$queryRawUnsafe<
      Array<{ count: bigint }>
    >(
      `SELECT COUNT(*) as count FROM rag_knowledge_sources WHERE "deletedAt" IS NULL`,
    );
    return { items, total: Number(countResult[0]?.count ?? 0) };
  }

  async createKnowledgeSource(data: {
    name: string;
    sourceType: string;
    sourceUrl?: string;
    rawText?: string;
    enabled?: boolean;
    priority?: number;
    syncMode?: string;
    createdBy: string;
  }): Promise<{ id: string; createdAt: Date }> {
    return this.prisma.ragKnowledgeSource.create({
      data,
      select: { id: true, createdAt: true },
    });
  }

  async updateKnowledgeSource(
    id: string,
    data: {
      name?: string;
      sourceUrl?: string;
      rawText?: string;
      enabled?: boolean;
      priority?: number;
      syncMode?: string;
      updatedBy: string;
    },
  ): Promise<void> {
    await this.prisma.ragKnowledgeSource.update({ where: { id }, data });
  }

  async deleteKnowledgeSource(id: string): Promise<void> {
    await this.prisma.ragKnowledgeSource.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async updateKnowledgeSourceSync(
    id: string,
    data: {
      syncStatus: string;
      lastSyncAt: Date;
      lastSyncDuration: number;
      documentsSynced?: number;
    },
  ): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `UPDATE rag_knowledge_sources
       SET "syncStatus" = $1, "lastSyncAt" = $2, "lastSyncDuration" = $3,
           "documentsSynced" = COALESCE($4, "documentsSynced"),
           "version" = "version" + 1
       WHERE id = $5`,
      data.syncStatus,
      data.lastSyncAt,
      data.lastSyncDuration,
      data.documentsSynced ?? null,
      id,
    );
  }

  async findDocumentsBySourceId(
    knowledgeSourceId: string,
  ): Promise<Array<Record<string, unknown>>> {
    return this.prisma.ragDocument.findMany({
      where: { knowledgeSourceId, deletedAt: null },
      select: {
        id: true,
        title: true,
        status: true,
        contentHash: true,
        createdAt: true,
      },
    });
  }

  async getKnowledgeSourceStats(): Promise<{
    total: number;
    enabled: number;
    syncing: number;
    failed: number;
    totalDocuments: number;
  }> {
    const rows = await this.prisma.$queryRawUnsafe<
      Array<Record<string, unknown>>
    >(
      `SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE enabled IS TRUE) AS enabled,
        COUNT(*) FILTER (WHERE "syncStatus" = 'SYNCING') AS syncing,
        COUNT(*) FILTER (WHERE "syncStatus" = 'FAILED') AS failed
       FROM rag_knowledge_sources WHERE "deletedAt" IS NULL`,
    );
    const docCount = await this.prisma.ragDocument.count({
      where: { deletedAt: null },
    });
    const r = rows[0] ?? {};
    return {
      total: Number(r['total'] ?? 0),
      enabled: Number(r['enabled'] ?? 0),
      syncing: Number(r['syncing'] ?? 0),
      failed: Number(r['failed'] ?? 0),
      totalDocuments: docCount,
    };
  }

  async getKnowledgeSourceHealth(): Promise<{
    registeredAdapters: number;
    enabledAdapters: number;
    failedSyncs: number;
    pendingSources: number;
  }> {
    const rows = await this.prisma.$queryRawUnsafe<
      Array<Record<string, unknown>>
    >(
      `SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE enabled IS TRUE) AS enabled,
        COUNT(*) FILTER (WHERE "syncStatus" = 'FAILED') AS failed,
        COUNT(*) FILTER (WHERE "syncStatus" IS NULL) AS pending
       FROM rag_knowledge_sources WHERE "deletedAt" IS NULL`,
    );
    const r = rows[0] ?? {};
    return {
      registeredAdapters: Number(r['total'] ?? 0),
      enabledAdapters: Number(r['enabled'] ?? 0),
      failedSyncs: Number(r['failed'] ?? 0),
      pendingSources: Number(r['pending'] ?? 0),
    };
  }

  // ── Vector health ────────────────────────────────────────────

  async checkPgvectorInstalled(): Promise<{
    installed: boolean;
    version: string;
  }> {
    try {
      const result = await this.prisma.$queryRawUnsafe<
        Array<{ extname: string; extversion: string }>
      >(
        `SELECT extname, extversion FROM pg_extension WHERE extname = 'vector'`,
      );
      return {
        installed: result.length > 0,
        version: result[0]?.extversion ?? '',
      };
    } catch {
      return { installed: false, version: '' };
    }
  }

  async checkIndexesExist(): Promise<{ exists: boolean; names: string[] }> {
    const result = await this.prisma.$queryRawUnsafe<
      Array<{ indexname: string }>
    >(
      `SELECT indexname FROM pg_indexes
       WHERE tablename = 'rag_document_chunks' AND indexdef ILIKE '%hnsw%'`,
    );
    return {
      exists: result.length > 0,
      names: result.map((r) => r.indexname),
    };
  }

  async pingVectorQuery(): Promise<number> {
    const start = Date.now();
    await this.prisma.$queryRawUnsafe(
      `SELECT COUNT(*) FROM rag_document_chunks WHERE embedding IS NOT NULL LIMIT 1`,
    );
    return Date.now() - start;
  }

  // ── Hybrid search: keyword (full-text via tsvector) ────────
  // ponytail: populate searchVector from content using PostgreSQL's to_tsvector.
  // Called after chunk creation. Uses 'english' config — add language detection when multilingual matters.

  async populateSearchVectors(documentId: string): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `UPDATE rag_document_chunks
       SET "searchVector" = to_tsvector('english', content)
       WHERE "documentId" = $1 AND content IS NOT NULL`,
      documentId,
    );
  }

  async searchKeyword(
    query: string,
    options: {
      topK: number;
      knowledgeSourceId?: string;
      documentId?: string;
    },
  ): Promise<Array<Record<string, unknown>>> {
    const params: unknown[] = [query, options.topK];
    let paramIdx = 3;
    let where = `WHERE "searchVector" IS NOT NULL AND "searchVector" @@ plainto_tsquery('english', $1)`;
    if (options.knowledgeSourceId) {
      where += ` AND "knowledgeSourceId" = $${paramIdx++}`;
      params.push(options.knowledgeSourceId);
    }
    if (options.documentId) {
      where += ` AND "documentId" = $${paramIdx++}`;
      params.push(options.documentId);
    }
    return this.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT id, "documentId", "knowledgeSourceId", content, "chunkIndex",
              ts_rank("searchVector", plainto_tsquery('english', $1)) AS score, metadata
       FROM rag_document_chunks
       ${where}
       ORDER BY score DESC
       LIMIT $2`,
      ...params,
    );
  }

  // ── Retrieval logging ────────

  async logRetrieval(data: {
    query: string;
    topK: number;
    distanceOp?: string;
    scoreThreshold?: number;
    totalResults: number;
    queryTimeMs: number;
    conversationId?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.prisma.ragRetrievalLog.create({ data: data as any });
  }

  // ── Collection CRUD ────────
  // ponytail: thin wrappers — collections are a simple grouping layer over existing sources.

  async createCollection(data: {
    name: string;
    description?: string;
    createdBy?: string;
  }): Promise<Record<string, unknown>> {
    return this.prisma.ragCollection.create({ data });
  }

  async listCollections(): Promise<Array<Record<string, unknown>>> {
    return this.prisma.ragCollection.findMany({
      where: { deletedAt: null },
      include: { sources: { include: { knowledgeSource: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addToCollection(collectionId: string, knowledgeSourceId: string): Promise<void> {
    await this.prisma.ragCollectionSource.create({
      data: { collectionId, knowledgeSourceId },
    });
  }

  async removeFromCollection(collectionId: string, knowledgeSourceId: string): Promise<void> {
    await this.prisma.ragCollectionSource.deleteMany({
      where: { collectionId, knowledgeSourceId },
    });
  }

  // ── Tag CRUD ────────

  async addTag(knowledgeSourceId: string, tagName: string): Promise<void> {
    const tag = await this.prisma.ragTag.upsert({
      where: { name: tagName },
      update: {},
      create: { name: tagName },
    });
    await this.prisma.ragSourceTag.create({
      data: { tagId: tag.id, knowledgeSourceId },
    });
  }

  async removeTag(knowledgeSourceId: string, tagName: string): Promise<void> {
    const tag = await this.prisma.ragTag.findUnique({ where: { name: tagName } });
    if (tag) {
      await this.prisma.ragSourceTag.deleteMany({
        where: { tagId: tag.id, knowledgeSourceId },
      });
    }
  }

  async getTagsForSource(knowledgeSourceId: string): Promise<string[]> {
    const tags = await this.prisma.ragSourceTag.findMany({
      where: { knowledgeSourceId },
      include: { tag: true },
    });
    return tags.map((t) => t.tag.name);
  }

  // ── Document version tracking ────────

  async createDocumentVersion(data: {
    documentId: string;
    version: number;
    contentHash?: string;
    title?: string;
    metadata?: Record<string, unknown>;
    createdBy?: string;
  }): Promise<void> {
    await this.prisma.ragDocumentVersion.create({
      data: {
        ...data,
        metadata: data.metadata as any, // ponytail: Prisma Json type compatibility
      },
    });
  }

  async getDocumentVersions(documentId: string): Promise<Array<Record<string, unknown>>> {
    return this.prisma.ragDocumentVersion.findMany({
      where: { documentId },
      orderBy: { version: 'desc' },
    });
  }
}

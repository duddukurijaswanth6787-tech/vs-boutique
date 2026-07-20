import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmbeddingService } from './embedding.service';
import { RagRepository } from './rag.repository';
import type {
  RetrieveDto,
  RetrievedChunkDto,
  RetrieveResponseDto,
  RetrieveHealthDto,
} from './retrieval.types';
import { RetrievalMode } from './retrieval.types';
import { VectorDistance } from './rag.types';

@Injectable()
export class RetrievalService {
  private readonly defaultTopK: number;
  private readonly defaultThreshold: number;
  private readonly maxContextChars: number;

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly ragRepository: RagRepository,
    private readonly configService: ConfigService,
  ) {
    this.defaultTopK = this.configService.get<number>('rag.topK', 10);
    this.defaultThreshold = this.configService.get<number>(
      'rag.vectorThreshold',
      0.7,
    );
    this.maxContextChars = this.configService.get<number>(
      'rag.maxContextChars',
      10000,
    );
  }

  async retrieve(dto: RetrieveDto): Promise<RetrieveResponseDto> {
    if (!dto.query || dto.query.trim().length === 0)
      throw new BadRequestException('Query cannot be empty');
    if (dto.query.length > 5000)
      throw new BadRequestException(
        'Query exceeds maximum length of 5000 characters',
      );

    const start = Date.now();
    const topK = dto.topK ?? this.defaultTopK;
    const threshold = dto.threshold ?? this.defaultThreshold;
    const mode = dto.mode ?? RetrievalMode.VECTOR;

    let chunks: RetrievedChunkDto[] = [];
    let queryEmbeddingTimeMs = 0;

    if (mode === RetrievalMode.KEYWORD) {
      // ponytail: keyword-only — no embedding needed, fast path.
      const raw = await this.ragRepository.searchKeyword(dto.query, {
        topK: topK * 2,
        knowledgeSourceId: dto.knowledgeSourceId,
        documentId: dto.documentId,
      });
      chunks = this.toChunks(raw);
    } else {
      // VECTOR or HYBRID — both need an embedding.
      const embedStart = Date.now();
      const embedding = await this.embeddingService.generateEmbedding(dto.query);
      queryEmbeddingTimeMs = Date.now() - embedStart;

      const vectorRaw = await this.ragRepository.findNearest(embedding.vector, {
        distance: dto.distance ?? VectorDistance.COSINE,
        topK: topK * 2,
        threshold,
        knowledgeSourceId: dto.knowledgeSourceId,
        documentId: dto.documentId,
      });
      const vectorChunks = this.toChunks(vectorRaw);

      if (mode === RetrievalMode.HYBRID) {
        // ponytail: hybrid = union of vector + keyword results, merged by score.
        // Vector weight 0.7, keyword weight 0.3 — configurable when it matters.
        const keywordRaw = await this.ragRepository.searchKeyword(dto.query, {
          topK: topK * 2,
          knowledgeSourceId: dto.knowledgeSourceId,
          documentId: dto.documentId,
        });
        const keywordChunks = this.toChunks(keywordRaw);
        chunks = this.mergeHybrid(vectorChunks, keywordChunks, 0.7, 0.3);
      } else {
        chunks = vectorChunks;
      }
    }

    if (dto.dedupEnabled !== false) {
      chunks = this.deduplicate(chunks);
    }

    chunks = this.buildContext(
      chunks,
      dto.maxContextChars ?? this.maxContextChars,
    );

    const result = chunks.slice(0, topK);
    const totalTime = Date.now() - start;

    // ponytail: fire-and-forget retrieval log — don't slow down the response.
    this.ragRepository.logRetrieval({
      query: dto.query,
      topK,
      distanceOp: dto.distance,
      scoreThreshold: threshold,
      totalResults: result.length,
      queryTimeMs: totalTime,
      conversationId: undefined, // ponytail: conversation tracking added at orchestrator level
    }).catch(() => {/* ignore log failures */});

    return {
      chunks: result,
      totalResults: result.length,
      queryTimeMs: totalTime,
      queryEmbeddingTimeMs,
      query: dto.query,
    };
  }

  async batchRetrieve(
    queries: string[],
    topK: number,
    threshold: number,
  ): Promise<{ results: RetrieveResponseDto[]; totalTimeMs: number }> {
    const start = Date.now();
    const results = await Promise.all(
      queries.map((query) =>
        this.retrieve({ query, topK, threshold }).catch(() => ({
          chunks: [],
          totalResults: 0,
          queryTimeMs: 0,
          queryEmbeddingTimeMs: 0,
          query,
        })),
      ),
    );
    return { results, totalTimeMs: Date.now() - start };
  }

  async health(): Promise<RetrieveHealthDto> {
    const start = Date.now();
    const embedHealth = await this.embeddingService.healthCheck();
    const latencyMs = Date.now() - start;

    let pgvectorOk = false;
    let indexAvailable = false;
    try {
      const pgv = await this.ragRepository.checkPgvectorInstalled();
      pgvectorOk = pgv.installed;
      const idx = await this.ragRepository.checkIndexesExist();
      indexAvailable = idx.exists;
    } catch {
      /* degrade */
    }

    const healthy = embedHealth.ok && pgvectorOk && indexAvailable;
    return {
      embeddingProvider: embedHealth.providers[0]?.name ?? 'unknown',
      embeddingOk: embedHealth.ok,
      pgvectorOk,
      indexAvailable,
      topK: this.defaultTopK,
      threshold: this.defaultThreshold,
      latencyMs,
      status: healthy ? 'healthy' : 'degraded',
    };
  }

  private toChunks(raw: Array<Record<string, unknown>>): RetrievedChunkDto[] {
    return raw.map((r) => ({
      chunkId: String(r['id'] ?? ''),
      documentId: String(r['documentId'] ?? ''),
      knowledgeSourceId: String(r['knowledgeSourceId'] ?? ''),
      content: String(r['content'] ?? ''),
      score: Number(r['score'] ?? 0),
      chunkIndex: Number(r['chunkIndex'] ?? 0),
      characterCount: String(r['content'] ?? '').length,
    }));
  }

  // ponytail: exact dedup by chunkId. No overlap merging — chunks are non-overlapping from Phase 4.
  // Add fuzzy dedup (cosine distance between chunks) when near-duplicate chunks are measured in results.
  private deduplicate(chunks: RetrievedChunkDto[]): RetrievedChunkDto[] {
    const seen = new Set<string>();
    return chunks.filter((c) => {
      if (seen.has(c.chunkId)) return false;
      seen.add(c.chunkId);
      return true;
    });
  }

  // ponytail: hybrid merge = union by chunkId, weighted score sum.
  // Vector results get vectorWeight, keyword results get keywordWeight.
  // Chunks appearing in both lists get the sum of their weighted scores.
  private mergeHybrid(
    vectorChunks: RetrievedChunkDto[],
    keywordChunks: RetrievedChunkDto[],
    vectorWeight: number,
    keywordWeight: number,
  ): RetrievedChunkDto[] {
    const merged = new Map<string, RetrievedChunkDto>();
    for (const c of vectorChunks) {
      merged.set(c.chunkId, { ...c, score: c.score * vectorWeight });
    }
    for (const c of keywordChunks) {
      const existing = merged.get(c.chunkId);
      if (existing) {
        existing.score += c.score * keywordWeight;
      } else {
        merged.set(c.chunkId, { ...c, score: c.score * keywordWeight });
      }
    }
    return Array.from(merged.values()).sort((a, b) => b.score - a.score);
  }

  private buildContext(
    chunks: RetrievedChunkDto[],
    maxChars: number,
  ): RetrievedChunkDto[] {
    let totalChars = 0;
    const result: RetrievedChunkDto[] = [];
    for (const chunk of chunks) {
      if (totalChars + chunk.characterCount > maxChars) break;
      result.push(chunk);
      totalChars += chunk.characterCount;
    }
    return result;
  }
}

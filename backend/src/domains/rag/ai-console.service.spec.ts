import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AIConsoleService } from './ai-console.service';
import { RagService } from './rag.service';
import { RetrievalService } from './retrieval.service';
import { EmbeddingService } from './embedding.service';
import { AIOrchestratorService } from './orchestrator.service';
import { RagRepository } from './rag.repository';
import { PrismaService } from '@database/prisma.service';
import { RedisService } from '@infrastructure/redis/redis.service';
import { StorageService } from '@infrastructure/storage/storage.service';
import { MetricsService } from '@infrastructure/monitoring/metrics.service';
import { ConfigService } from '@nestjs/config';
import { getQueueToken } from '@nestjs/bullmq';
import { Registry } from 'prom-client';

const mockQueue = {
  client: Promise.resolve({ ping: () => Promise.resolve('PONG') }),
};

function build() {
  const ragService = {
    getKnowledgeSourceStats: jest.fn().mockResolvedValue({
      total: 1,
      enabled: 1,
      syncing: 0,
      failed: 0,
      totalDocuments: 1,
    }),
    syncKnowledgeSource: jest.fn().mockResolvedValue({ status: 'completed' }),
    syncAllKnowledgeSources: jest
      .fn()
      .mockResolvedValue({ results: [], total: 0, failed: 0 }),
  };
  const retrievalService = {
    retrieve: jest.fn().mockResolvedValue({
      chunks: [{ chunkId: 'c1', content: 'ctx', score: 0.9 }],
      totalResults: 1,
      queryTimeMs: 10,
      queryEmbeddingTimeMs: 5,
      query: 'q',
    }),
    health: jest.fn().mockResolvedValue({ status: 'healthy' }),
  };
  const embeddingService = {
    getProviderInfo: jest
      .fn()
      .mockResolvedValue([
        { name: 'gemini', model: 'm', dimension: 768, ok: true, message: 'ok' },
      ]),
    healthCheck: jest.fn().mockResolvedValue({
      ok: true,
      providers: [{ name: 'gemini', ok: true }],
    }),
  };
  const orchestratorService = {
    health: jest.fn().mockResolvedValue({
      llmOk: true,
      retrievalOk: true,
      status: 'healthy',
      llmProvider: 'gemini',
    }),
    getProviders: jest
      .fn()
      .mockResolvedValue([
        { name: 'gemini', model: 'gemini-1.5-flash', ok: true, message: 'ok' },
      ]),
    previewPrompt: jest.fn().mockResolvedValue({
      systemPrompt: 'sys',
      retrievedContext: 'ctx',
      conversation: [],
      toolOutput: 'ctx',
      finalPrompt: 'AIza1234567890abcdefghijklmnopqrstuvwxyz12345secret',
    }),
  };
  const ragRepository = {
    document: {
      count: jest.fn().mockResolvedValue(3),
      findMany: jest.fn().mockResolvedValue([{ id: 'd1' }]),
    },
    knowledgeSource: {
      count: jest.fn().mockResolvedValue(2),
      findMany: jest.fn().mockResolvedValue([{ id: 'ks1', enabled: true }]),
      findFirst: jest.fn().mockResolvedValue({ id: 'ks1', enabled: true }),
      update: jest.fn().mockResolvedValue({ id: 'ks1', enabled: false }),
    },
    documentChunk: { count: jest.fn().mockResolvedValue(10) },
    conversation: {
      count: jest.fn().mockResolvedValue(5),
      findMany: jest.fn().mockResolvedValue([{ id: 'c1' }]),
    },
    message: {
      findMany: jest.fn().mockResolvedValue([{ responseTimeMs: 100 }]),
      count: jest.fn().mockResolvedValue(1),
    },
    countIndexed: jest.fn().mockResolvedValue(8),
    countPending: jest.fn().mockResolvedValue(2),
    findChunksByDocument: jest
      .fn()
      .mockResolvedValue({ items: [{ id: 'ch1' }], total: 1 }),
  };
  const prisma = { ping: jest.fn().mockResolvedValue(true) };
  const redis = { ping: jest.fn().mockResolvedValue(true) };
  const storage = {
    healthCheck: jest
      .fn()
      .mockResolvedValue({ writable: true, provider: 'local', root: '/tmp' }),
  };
  const config = {
    get: jest.fn().mockImplementation((_k: string, d: unknown) => d),
  };

  return {
    ragService,
    retrievalService,
    embeddingService,
    orchestratorService,
    ragRepository,
    prisma,
    redis,
    storage,
    config,
  };
}

describe('AIConsoleService', () => {
  let service: AIConsoleService;
  let m: ReturnType<typeof build>;

  beforeEach(async () => {
    m = build();
    const mockMetrics = {
      registry: new Registry(),
    } as unknown as MetricsService;
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIConsoleService,
        { provide: RagService, useValue: m.ragService },
        { provide: RetrievalService, useValue: m.retrievalService },
        { provide: EmbeddingService, useValue: m.embeddingService },
        { provide: AIOrchestratorService, useValue: m.orchestratorService },
        { provide: RagRepository, useValue: m.ragRepository },
        { provide: PrismaService, useValue: m.prisma },
        { provide: RedisService, useValue: m.redis },
        { provide: StorageService, useValue: m.storage },
        { provide: MetricsService, useValue: mockMetrics },
        { provide: ConfigService, useValue: m.config },
        { provide: getQueueToken('embedding-generation'), useValue: mockQueue },
      ],
    }).compile();
    service = module.get(AIConsoleService);
  });

  it('getDashboard aggregates counts and statuses', async () => {
    const r = await service.getDashboard();
    expect(r.totalDocuments).toBe(3);
    expect(r.totalKnowledgeSources).toBe(2);
    expect(r.totalChunks).toBe(10);
    expect(r.totalEmbeddings).toBe(8);
    expect(r.totalConversations).toBe(5);
    expect(r.queueStatus).toBe('up');
    expect(r.providerStatus.embedding).toBe('up');
  });

  it('getKnowledge applies filters', async () => {
    const r = await service.getKnowledge({
      page: 1,
      limit: 10,
      enabled: true,
      syncStatus: 'FAILED',
    });
    expect(r.items).toHaveLength(1);
    expect(r.total).toBe(2);
  });

  it('toggleKnowledgeSource throws when missing', async () => {
    m.ragRepository.knowledgeSource.findFirst.mockResolvedValue(null);
    await expect(service.toggleKnowledgeSource('x', true)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('toggleKnowledgeSource updates enabled', async () => {
    const r = await service.toggleKnowledgeSource('ks1', false);
    expect(r.enabled).toBe(false);
  });

  it('getDocuments supports filename filter', async () => {
    const r = await service.getDocuments({
      page: 1,
      limit: 10,
      filename: 'a.pdf',
    });
    expect(r.total).toBe(3);
  });

  it('getDocumentChunks delegates', async () => {
    const r = await service.getDocumentChunks('d1', 1, 10);
    expect(r.total).toBe(1);
  });

  it('getConversations supports search', async () => {
    const r = await service.getConversations({
      page: 1,
      limit: 10,
      search: 'hello',
    });
    expect(r.items).toHaveLength(1);
  });

  it('getProviders marks current', async () => {
    const r = await service.getProviders();
    expect(r.some((p) => p.current)).toBe(true);
  });

  it('testRetrieval delegates to retrieval service', async () => {
    const r = await service.testRetrieval({ query: 'q', topK: 3 });
    expect(r.totalResults).toBe(1);
  });

  it('testRetrieval rejects oversized query', async () => {
    await expect(
      service.testRetrieval({ query: 'x'.repeat(3000) }),
    ).rejects.toThrow(BadRequestException);
  });

  it('previewPrompt masks secrets', async () => {
    const r = await service.previewPrompt({ message: 'hi' });
    expect(r.finalPrompt).toContain('***GEMINI_KEY***');
    expect(r.finalPrompt).not.toContain('AIza');
  });

  it('getHealth computes score and overall', async () => {
    const r = await service.getHealth();
    expect(r.score).toBe(100);
    expect(r.overall).toBe('healthy');
  });

  it('getHealth reports unhealthy when db down', async () => {
    m.prisma.ping.mockResolvedValue(false);
    const res = await service.getHealth();
    expect(res.database).toBe('down');
    expect(res.overall).toBe('unhealthy');
  });
});

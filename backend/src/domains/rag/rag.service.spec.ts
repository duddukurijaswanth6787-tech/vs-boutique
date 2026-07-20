import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RagService } from './rag.service';
import { RagRepository } from './rag.repository';
import { DocumentAdapter } from './knowledge-source.adapter';
import { VectorDistance } from './rag.types';

describe('RagService', () => {
  let service: RagService;

  const mockConfig = { get: jest.fn((_key: string, def?: unknown) => def) };
  const mockAdapter = {
    sync: jest.fn(),
    health: jest.fn(),
    supportsRealtime: jest.fn(),
  };
  const mockRepo = {
    findNearest: jest.fn(),
    checkPgvectorInstalled: jest.fn(),
    checkIndexesExist: jest.fn(),
    countIndexed: jest.fn(),
    countPending: jest.fn(),
    pingVectorQuery: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RagService,
        { provide: ConfigService, useValue: mockConfig },
        { provide: RagRepository, useValue: mockRepo },
        { provide: DocumentAdapter, useValue: mockAdapter },
      ],
    }).compile();

    service = module.get<RagService>(RagService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw NotImplementedException for findAgents', async () => {
    await expect(service.findAgents(1, 10)).rejects.toThrow();
  });

  describe('vectorHealth', () => {
    it('should return healthy when all checks pass', async () => {
      mockRepo.checkPgvectorInstalled.mockResolvedValue({
        installed: true,
        version: '0.8.3',
      });
      mockRepo.checkIndexesExist.mockResolvedValue({
        exists: true,
        names: ['rag_document_chunks_embedding_idx'],
      });
      mockRepo.countIndexed.mockResolvedValue(5);
      mockRepo.countPending.mockResolvedValue(2);
      mockRepo.pingVectorQuery.mockResolvedValue(10);

      const result = await service.vectorHealth();
      expect(result.status).toBe('healthy');
      expect(result.pgvectorInstalled).toBe(true);
      expect(result.pgvectorVersion).toBe('0.8.3');
      expect(result.indexesExist).toBe(true);
      expect(result.indexNames).toContain('rag_document_chunks_embedding_idx');
      expect(result.dimension).toBe(1536);
    });

    it('should return unhealthy when pgvector is not installed', async () => {
      mockRepo.checkPgvectorInstalled.mockResolvedValue({
        installed: false,
        version: '',
      });
      mockRepo.checkIndexesExist.mockResolvedValue({
        exists: false,
        names: [],
      });
      mockRepo.countIndexed.mockResolvedValue(0);
      mockRepo.countPending.mockResolvedValue(0);
      mockRepo.pingVectorQuery.mockResolvedValue(0);

      const result = await service.vectorHealth();
      expect(result.status).toBe('unhealthy');
      expect(result.pgvectorInstalled).toBe(false);
    });
  });

  describe('vectorSearch', () => {
    it('should delegate to repository', async () => {
      mockRepo.findNearest.mockResolvedValue([{ id: 'c1', score: 0.95 }]);
      const result = await service.vectorSearch({
        vector: [0.1, 0.2, 0.3],
        distance: VectorDistance.COSINE,
        topK: 5,
        threshold: 0.7,
      });
      expect(result).toEqual([{ id: 'c1', score: 0.95 }]);
      expect(mockRepo.findNearest).toHaveBeenCalledWith([0.1, 0.2, 0.3], {
        distance: 'cosine',
        topK: 5,
        threshold: 0.7,
        knowledgeSourceId: undefined,
        documentId: undefined,
      });
    });
  });
});

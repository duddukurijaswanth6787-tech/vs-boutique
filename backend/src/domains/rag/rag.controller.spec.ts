import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@domains/auth/services/jwt.service';
import { JwtAuthGuard } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@domains/auth/guards/roles.guard';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';
import { EmbeddingService } from './embedding.service';
import { UploadService } from './upload.service';
import { RetrievalService } from './retrieval.service';
import { AIOrchestratorService } from './orchestrator.service';

describe('RagController', () => {
  let controller: RagController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RagController],
      providers: [
        {
          provide: RagService,
          useValue: {
            findAgents: jest.fn(),
            findAgentById: jest.fn(),
            createAgent: jest.fn(),
            updateAgent: jest.fn(),
            deleteAgent: jest.fn(),
            findKnowledgeSources: jest.fn(),
            findKnowledgeSourceById: jest.fn(),
            createKnowledgeSource: jest.fn(),
            updateKnowledgeSource: jest.fn(),
            deleteKnowledgeSource: jest.fn(),
            findDocumentsBySource: jest.fn(),
            findDocumentById: jest.fn(),
            findChunksByDocument: jest.fn(),
            findConversations: jest.fn(),
            findConversationById: jest.fn(),
            deleteConversation: jest.fn(),
            submitFeedback: jest.fn(),
            findEmbeddingJobs: jest.fn(),
            findEmbeddingJobById: jest.fn(),
            vectorSearch: jest.fn(),
            vectorHealth: jest.fn(),
            countIndexed: jest.fn(),
            countPending: jest.fn(),
            syncKnowledgeSource: jest.fn(),
            syncAllKnowledgeSources: jest.fn(),
            getKnowledgeSourceStats: jest.fn(),
            getKnowledgeSourceHealth: jest.fn(),
          },
        },
        {
          provide: UploadService,
          useValue: {
            upload: jest.fn(),
            listDocuments: jest.fn(),
            getDocument: jest.fn(),
            deleteDocument: jest.fn(),
            reprocessDocument: jest.fn(),
            getChunksByDocument: jest.fn(),
            getJobsByDocument: jest.fn(),
            health: jest.fn(),
          },
        },
        {
          provide: RetrievalService,
          useValue: {
            retrieve: jest.fn(),
            batchRetrieve: jest.fn(),
            health: jest.fn(),
          },
        },
        {
          provide: EmbeddingService,
          useValue: {
            generateEmbedding: jest.fn(),
            generateBatch: jest.fn(),
            getProviderInfo: jest.fn(),
            healthCheck: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn().mockReturnValue({ sub: 'u1', email: 'a@b.com' }),
          },
        },
        {
          provide: AIOrchestratorService,
          useValue: {
            orchestrate: jest.fn(),
            health: jest.fn(),
            getTools: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<RagController>(RagController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

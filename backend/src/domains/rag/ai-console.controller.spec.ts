import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@domains/auth/services/jwt.service';
import { JwtAuthGuard } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@domains/auth/guards/roles.guard';
import { AIConsoleController } from './ai-console.controller';
import { AIConsoleService } from './ai-console.service';

describe('AIConsoleController', () => {
  let controller: AIConsoleController;
  const console = {
    getDashboard: jest.fn().mockResolvedValue({ totalDocuments: 0 }),
    getKnowledge: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    toggleKnowledgeSource: jest
      .fn()
      .mockResolvedValue({ id: '1', enabled: true }),
    syncKnowledgeSource: jest.fn().mockResolvedValue({ status: 'completed' }),
    syncAllKnowledgeSources: jest
      .fn()
      .mockResolvedValue({ total: 0, failed: 0 }),
    getDocuments: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    getDocumentChunks: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    getConversations: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    getProviders: jest.fn().mockResolvedValue([]),
    testRetrieval: jest.fn().mockResolvedValue({ chunks: [] }),
    previewPrompt: jest.fn().mockResolvedValue({ finalPrompt: '' }),
    getHealth: jest.fn().mockResolvedValue({ overall: 'healthy', score: 100 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AIConsoleController],
      providers: [
        { provide: AIConsoleService, useValue: console },
        {
          provide: JwtService,
          useValue: { verify: jest.fn().mockReturnValue({ sub: 'u1' }) },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();
    controller = module.get(AIConsoleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('dashboard delegates', async () => {
    await controller.dashboard();
    expect(console.getDashboard).toHaveBeenCalled();
  });

  it('knowledge delegates with filters', async () => {
    await controller.knowledge({ page: 1, limit: 20, enabled: true });
    expect(console.getKnowledge).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      enabled: true,
      syncStatus: undefined,
    });
  });

  it('toggle delegates', async () => {
    await controller.toggleKnowledge('1', { enabled: true });
    expect(console.toggleKnowledgeSource).toHaveBeenCalledWith('1', true);
  });

  it('retrieval test delegates', async () => {
    await controller.retrievalTest({ query: 'q' });
    expect(console.testRetrieval).toHaveBeenCalled();
  });

  it('prompt preview delegates', async () => {
    await controller.promptPreview({ message: 'hi' });
    expect(console.previewPrompt).toHaveBeenCalled();
  });

  it('health delegates', async () => {
    await controller.health();
    expect(console.getHealth).toHaveBeenCalled();
  });
});

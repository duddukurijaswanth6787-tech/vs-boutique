import { Test, TestingModule } from '@nestjs/testing';
import { RagAgentService } from './rag-agent.service';
import { RagAgentRepository } from './rag-agent.repository';
import { RagOrchestratorService } from './rag-orchestrator.service';
import { RagIntentService } from './rag-intent.service';
import { RagToolRegistry } from './rag-tool.registry';
import { RagRetrievalService } from './rag-retrieval.service';
import { RagPromptBuilder } from './rag-prompt.builder';
import {
  GeminiLlmProvider,
  OpenAiLlmProvider,
  GeminiEmbeddingProvider,
  OpenAiEmbeddingProvider,
  LlmProviderRegistry,
  EmbeddingProviderRegistry,
} from './rag-providers.service';
import { PrismaService } from '@database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { StorageService } from '@infrastructure/storage/storage.service';
import { AuditService } from '@domains/audit/audit.service';
import { SearchService } from '@domains/search/search.service';
import { ProductsService } from '@domains/products/products.service';
import { UnauthorizedException } from '@nestjs/common';

describe('RAG Agent Platform Tests', () => {
  let orchestrator: RagOrchestratorService;
  let toolRegistry: RagToolRegistry;
  let intentService: RagIntentService;

  const mockPrisma = {
    ragAgent: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    ragConversation: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    ragMessage: {
      create: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    ragToolExecution: {
      create: jest.fn(),
    },
    ragAgentKnowledgeSource: {
      findMany: jest.fn(),
    },
    ragAgentMetric: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
    },
    customerProfile: {
      findUnique: jest
        .fn()
        .mockResolvedValue({ id: 'cust-123', userId: 'user-123' }),
    },
    order: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation((cb) => cb(mockPrisma)),
    $queryRaw: jest.fn(),
  };

  const mockStorageService = {
    get: jest.fn(),
    exists: jest.fn(),
    getSignedUploadUrl: jest.fn(),
  };

  const mockAuditService = {
    create: jest.fn(),
  };

  const mockSearchService = {
    search: jest.fn(),
  };

  const mockProductsService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RagAgentService,
        RagAgentRepository,
        RagOrchestratorService,
        RagIntentService,
        RagToolRegistry,
        RagRetrievalService,
        RagPromptBuilder,
        {
          provide: GeminiLlmProvider,
          useValue: {
            getProviderName: () => 'gemini',
            chat: jest.fn().mockImplementation((messages) => {
              const lastMessage = messages[messages.length - 1]?.content || '';
              return Promise.resolve({
                content: `[Simulated Gemini Response] Having analyzed the store policies and catalogs, here is the resolution for: "${lastMessage}".`,
                promptTokens: messages.length * 10,
                completionTokens: 20,
              });
            }),
            healthCheck: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: OpenAiLlmProvider,
          useValue: {
            getProviderName: () => 'openai',
            chat: jest.fn().mockImplementation((messages) => {
              const lastMessage = messages[messages.length - 1]?.content || '';
              return Promise.resolve({
                content: `[Simulated OpenAI Response] Verified transactional credentials. Mapped details for: "${lastMessage}".`,
                promptTokens: messages.length * 15,
                completionTokens: 25,
              });
            }),
            healthCheck: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: GeminiEmbeddingProvider,
          useValue: {
            getProviderName: () => 'gemini',
            dimensions: 3072,
            embed: jest
              .fn()
              .mockImplementation(() =>
                Promise.resolve(new Array(3072).fill(0.1)),
              ),
            embedBatch: jest
              .fn()
              .mockImplementation((_texts) =>
                Promise.resolve(_texts.map(() => new Array(3072).fill(0.1))),
              ),
            healthCheck: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: OpenAiEmbeddingProvider,
          useValue: {
            getProviderName: () => 'openai',
            dimensions: 1536,
            embed: jest
              .fn()
              .mockImplementation(() =>
                Promise.resolve(new Array(1536).fill(0.1)),
              ),
            embedBatch: jest
              .fn()
              .mockImplementation((_texts) =>
                Promise.resolve(_texts.map(() => new Array(1536).fill(0.1))),
              ),
            healthCheck: jest.fn().mockResolvedValue(true),
          },
        },
        LlmProviderRegistry,
        EmbeddingProviderRegistry,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorageService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: SearchService, useValue: mockSearchService },
        { provide: ProductsService, useValue: mockProductsService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key, val) => val),
          },
        },
      ],
    }).compile();

    orchestrator = module.get<RagOrchestratorService>(RagOrchestratorService);
    toolRegistry = module.get<RagToolRegistry>(RagToolRegistry);
    intentService = module.get<RagIntentService>(RagIntentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // 1. Intent Routing Tests
  describe('Intent Routing', () => {
    it('should classify order tracking queries', () => {
      const intent = intentService.routeIntent(
        'Where is my order ORD-12345678-123456?',
      );
      expect(intent).toBe('ORDER_TRACKING');
    });

    it('should classify product searches', () => {
      const intent = intentService.routeIntent(
        'Do you have blue cotton kurtis?',
      );
      expect(intent).toBe('PRODUCT_SEARCH');
    });

    it('should classify return status queries', () => {
      const intent = intentService.routeIntent(
        'Check return status for my kurtis',
      );
      expect(intent).toBe('RETURN_STATUS');
    });

    it('should return UNKNOWN for arbitrary chatters', () => {
      const intent = intentService.routeIntent('Hello world');
      expect(intent).toBe('UNKNOWN');
    });
  });

  // 2. Tool Registry Security & Ownership Verification
  describe('Tool Security Controls', () => {
    it('should block guest users from accessing order status details', async () => {
      const tool = toolRegistry.getTool('ORDER_STATUS');
      expect(tool).toBeDefined();

      const run = () =>
        tool!.execute(
          { guestId: 'guest-999' },
          { orderNumber: 'ORD-20260712-000001' },
        );
      await expect(run()).rejects.toThrow(UnauthorizedException);
    });

    it('should block customers from accessing orders belonging to others', async () => {
      const tool = toolRegistry.getTool('ORDER_STATUS');
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'ord-999',
        orderNumber: 'ORD-20260712-000001',
        customer: { userId: 'different-customer-id' },
        items: [],
      });

      const run = () =>
        tool!.execute(
          { userId: 'user-123' },
          { orderNumber: 'ORD-20260712-000001' },
        );
      await expect(run()).rejects.toThrow(UnauthorizedException);
    });

    it('should allow customer to access their own order details', async () => {
      const tool = toolRegistry.getTool('ORDER_STATUS');
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'ord-123',
        orderNumber: 'ORD-20260712-000001',
        customer: { userId: 'user-123' },
        items: [],
      });

      const result = await tool!.execute(
        { userId: 'user-123' },
        { orderNumber: 'ORD-20260712-000001' },
      );
      expect(result).toBeDefined();
      expect(result.orderNumber).toBe('ORD-20260712-000001');
    });
  });

  // 3. RAG Orchestration Flow
  describe('RAG Orchestrator', () => {
    it('should process user prompts and return simulated grounded replies', async () => {
      mockPrisma.ragAgent.findFirst.mockResolvedValue({
        id: 'agent-123',
        name: 'Support Pro',
        agentKey: 'customer_support_agent',
        status: 'ACTIVE',
        modelProvider: 'gemini',
        model: 'gemini-1.5-flash',
        temperature: 0.7,
        maxTokens: 1000,
        systemPrompt: 'Ground instructions',
        toolConfig: { tools: [] },
      });

      mockPrisma.ragConversation.findUnique.mockResolvedValue({
        id: 'conv-123',
      });
      mockPrisma.ragMessage.create.mockResolvedValue({ id: 'msg-user-1' });
      mockPrisma.ragAgentKnowledgeSource.findMany.mockResolvedValue([]);

      const response = await orchestrator.orchestrate({
        agentKey: 'customer_support_agent',
        conversationId: 'conv-123',
        message: 'What is the return window?',
        context: { userId: 'user-123' },
      });

      expect(response).toBeDefined();
      expect(response.conversationId).toBe('conv-123');
      expect(response.answer).toContain('[Simulated Gemini Response]');
    });
  });

  // 4. Provider and Registry Tests
  describe('Provider and Registry Tests', () => {
    let originalFetch: any;

    beforeAll(() => {
      originalFetch = global.fetch;
    });

    afterAll(() => {
      global.fetch = originalFetch;
    });

    it('Gemini LLM provider success', async () => {
      const config = {
        get: jest.fn().mockImplementation((key) => {
          if (key === 'app.gemini.apiKey') return 'real_key';
          return undefined;
        }),
      } as any;
      const provider = new GeminiLlmProvider(config);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [{ content: { parts: [{ text: 'Gemini reply' }] } }],
            usageMetadata: { promptTokenCount: 15, candidatesTokenCount: 20 },
          }),
      });

      const res = await provider.chat([{ role: 'user', content: 'hello' }], {
        model: 'gemini-1.5-flash',
        temperature: 0.7,
        maxTokens: 100,
      });
      expect(res.content).toBe('Gemini reply');
      expect(res.promptTokens).toBe(15);
      expect(res.completionTokens).toBe(20);
    });

    it('Gemini LLM provider error', async () => {
      const config = {
        get: jest.fn().mockImplementation((key) => {
          if (key === 'app.gemini.apiKey') return 'real_key';
          return undefined;
        }),
      } as any;
      const provider = new GeminiLlmProvider(config);

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Bad Request Error details'),
      });

      await expect(
        provider.chat([{ role: 'user', content: 'hello' }], {
          model: 'gemini-1.5-flash',
          temperature: 0.7,
          maxTokens: 100,
        }),
      ).rejects.toThrow('Gemini API Error');
    });

    it('Gemini timeout', async () => {
      const config = {
        get: jest.fn().mockImplementation((key) => {
          if (key === 'app.gemini.apiKey') return 'real_key';
          return undefined;
        }),
      } as any;
      const provider = new GeminiLlmProvider(config);

      global.fetch = jest.fn().mockImplementation(() => {
        const err = new Error('AbortError');
        err.name = 'AbortError';
        return Promise.reject(err);
      });

      await expect(
        provider.chat([{ role: 'user', content: 'hello' }], {
          model: 'gemini-1.5-flash',
          temperature: 0.7,
          maxTokens: 100,
        }),
      ).rejects.toThrow('timed out');
    });

    it('missing API key throws unconfigured error', async () => {
      const config = {
        get: jest.fn().mockReturnValue(''),
      } as any;
      const provider = new GeminiLlmProvider(config);
      await expect(
        provider.chat([{ role: 'user', content: 'hello' }], {
          model: 'gemini-1.5-flash',
          temperature: 0.7,
          maxTokens: 100,
        }),
      ).rejects.toThrow('unconfigured');
    });

    it('Gemini embedding success', async () => {
      const config = {
        get: jest.fn().mockImplementation((key) => {
          if (key === 'app.gemini.apiKey') return 'real_key';
          return undefined;
        }),
      } as any;
      const provider = new GeminiEmbeddingProvider(config);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            embeddings: [{ values: new Array(3072).fill(0.5) }],
          }),
      });

      const res = await provider.embed('hello');
      expect(res).toHaveLength(3072);
      expect(res[0]).toBe(0.5);
    });

    it('embedding batch success', async () => {
      const config = {
        get: jest.fn().mockImplementation((key) => {
          if (key === 'app.gemini.apiKey') return 'real_key';
          return undefined;
        }),
      } as any;
      const provider = new GeminiEmbeddingProvider(config);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            embeddings: [
              { values: new Array(3072).fill(0.5) },
              { values: new Array(3072).fill(0.6) },
            ],
          }),
      });

      const res = await provider.embedBatch(['hello', 'world']);
      expect(res).toHaveLength(2);
      expect(res[0]).toHaveLength(3072);
      expect(res[1]).toHaveLength(3072);
    });

    it('embedding dimension mismatch throws error', async () => {
      const config = {
        get: jest.fn().mockImplementation((key) => {
          if (key === 'app.gemini.apiKey') return 'real_key';
          return undefined;
        }),
      } as any;
      const provider = new GeminiEmbeddingProvider(config);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            embeddings: [{ values: new Array(512).fill(0.5) }],
          }),
      });

      await expect(provider.embed('hello')).rejects.toThrow(
        'dimension mismatch',
      );
    });

    it('provider registry resolves Gemini and OpenAi', () => {
      const geminiLlm = { getProviderName: () => 'gemini' } as any;
      const openaiLlm = { getProviderName: () => 'openai' } as any;
      const registry = new LlmProviderRegistry(geminiLlm, openaiLlm);

      expect(registry.getProvider('gemini')).toBe(geminiLlm);
      expect(registry.getProvider('openai')).toBe(openaiLlm);
    });

    it('unknown provider blocked in registry', () => {
      const geminiLlm = { getProviderName: () => 'gemini' } as any;
      const openaiLlm = { getProviderName: () => 'openai' } as any;
      const registry = new LlmProviderRegistry(geminiLlm, openaiLlm);

      expect(() => registry.getProvider('anthropic')).toThrow(
        'unknown or unsupported',
      );
    });
  });
});

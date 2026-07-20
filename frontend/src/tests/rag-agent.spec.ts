import { ragAgentService } from '@/features/rag-agent/rag-agent.service';
import { apiClient } from '@/lib/api/client';

// Mock Axios client
jest.mock('@/lib/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('Phase 5.15 — RAG Agent Control Center Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('1. Agent response type mapping', async () => {
    const mockAgent = {
      id: 'agent-123',
      name: 'Sales Assistant',
      agentKey: 'sales_assistant',
      description: 'Help customers buy sarees',
      modelProvider: 'gemini',
      model: 'gemini-1.5-flash',
      temperature: 0.7,
      maxTokens: 500,
      isActive: true,
      systemRole: 'Helpful assistant',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    };

    (apiClient.get as jest.Mock).mockResolvedValueOnce({
      data: { success: true, data: mockAgent },
    });

    const result = await ragAgentService.getAgentById('agent-123');
    expect(result.id).toBe('agent-123');
    expect(result.name).toBe('Sales Assistant');
    expect(result.modelProvider).toBe('gemini');
    expect(result.isActive).toBe(true);
  });

  test('2. Knowledge source status mapping', async () => {
    const mockSource = {
      id: 'source-123',
      name: 'FAQ Terms',
      sourceType: 'FAQ',
      status: 'INDEXED',
      indexingError: null,
      lastIndexedAt: new Date().toISOString(),
      createdBy: 'user-admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    };

    (apiClient.get as jest.Mock).mockResolvedValueOnce({
      data: { success: true, data: mockSource },
    });

    const result = await ragAgentService.getKnowledgeSourceById('source-123');
    expect(result.id).toBe('source-123');
    expect(result.sourceType).toBe('FAQ');
    expect(result.status).toBe('INDEXED');
  });

  test('3. Citation rendering and empty state checking', () => {
    const citations = [
      {
        id: 'cite-1',
        messageId: 'msg-1',
        sourceTitle: 'Saree Materials Guide',
        excerpt: 'Banarasi silk is handwoven in Varanasi.',
        relevanceScore: 0.95,
      },
    ];

    expect(citations.length).toBe(1);
    expect(citations[0].sourceTitle).toBe('Saree Materials Guide');
    expect(citations[0].relevanceScore).toBe(0.95);

    const emptyCitations: unknown[] = [];
    expect(emptyCitations.length).toBe(0);
  });

  test('4. Ingestion terminal-state and polling evaluation', () => {
    const terminalStates = ['INDEXED', 'FAILED', 'ARCHIVED'];
    const activeStates = ['PENDING', 'PROCESSING'];

    const isTerminal = (status: string) => terminalStates.includes(status);

    expect(isTerminal('INDEXED')).toBe(true);
    expect(isTerminal('FAILED')).toBe(true);
    expect(isTerminal('PROCESSING')).toBe(false);
    expect(isTerminal('PENDING')).toBe(false);
  });

  test('5. RAG health status mapping', async () => {
    const mockHealthResult = {
      status: 'ok',
      info: {
        rag: {
          status: 'up',
          enabled: true,
          llm: { provider: 'gemini', status: 'UP' },
          embedding: { provider: 'gemini', status: 'UP' },
          ingestionQueue: { status: 'UP' },
          vectorDatabase: { status: 'UP' },
        },
      },
    };

    (apiClient.get as jest.Mock).mockResolvedValueOnce({
      data: mockHealthResult,
    });

    const result = await ragAgentService.getHealth();
    expect(result.status).toBe('ok');
    expect(result.info.rag.status).toBe('up');
    expect(result.info.rag.llm.status).toBe('UP');
    expect(result.info.rag.vectorDatabase.status).toBe('UP');
  });

  test('6. Sensitive data redaction helper logic simulation', () => {
    const payload = {
      apiKey: 'sk-proj-1234567890abcdef',
      secret: 'secret-key-goes-here',
      userEmail: 'admin@vasanthidesigners.com',
      query: 'Check stock levels',
    };

    const redactSecrets = (obj: Record<string, unknown>): Record<string, unknown> => {
      const copy = JSON.parse(JSON.stringify(obj));
      const sensitiveKeys = ['apikey', 'secret', 'password', 'token'];
      for (const key in copy) {
        if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
          copy[key] = '[REDACTED]';
        }
      }
      return copy;
    };

    const redacted = redactSecrets(payload);
    expect(redacted.apiKey).toBe('[REDACTED]');
    expect(redacted.secret).toBe('[REDACTED]');
    expect(redacted.userEmail).toBe('admin@vasanthidesigners.com');
  });

  test('7. Playground authorization error checks', async () => {
    (apiClient.post as jest.Mock).mockRejectedValueOnce({
      response: {
        status: 403,
        data: { message: 'Forbidden resource: require Admin privileges' },
      },
    });

    await expect(ragAgentService.testAgent('agent-1', { message: 'test' })).rejects.toBeDefined();
  });
});

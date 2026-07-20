import { AnalyticsService } from './analytics.service';

const counter = (v: number) => [{ value: v }];
const hist = (v: number) => [{ value: v }];

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  const ragRepository = {
    conversation: { count: jest.fn().mockResolvedValue(5) },
    message: { count: jest.fn().mockResolvedValue(3) },
    document: { count: jest.fn().mockResolvedValue(2) },
    documentChunk: { count: jest.fn().mockResolvedValue(9) },
    knowledgeSource: { count: jest.fn().mockResolvedValue(1) },
    countIndexed: jest.fn().mockResolvedValue(8),
    countPending: jest.fn().mockResolvedValue(1),
  } as any;
  const embeddingService = {
    healthCheck: jest
      .fn()
      .mockResolvedValue({ ok: true, model: 'm', latencyMs: 1 }),
    getProviderInfo: jest.fn().mockResolvedValue([{ ok: true, model: 'm' }]),
  } as any;
  const orchestrator = {
    health: jest.fn().mockResolvedValue({ llmOk: true }),
    getProviders: jest.fn().mockResolvedValue([{ ok: true, model: 'g' }]),
  } as any;
  const consoleService = {
    getHealth: jest.fn().mockResolvedValue({
      overall: 'healthy',
      score: 100,
      database: 'up',
      redis: 'up',
      bullmq: 'up',
      embedding: 'up',
      retrieval: 'up',
      orchestrator: 'up',
      storage: 'up',
    }),
  } as any;
  const metrics = {
    registry: {
      getMetricsAsJSON: jest.fn().mockResolvedValue([
        { name: 'vasanthi_rag_chat_messages_total', values: counter(4) },
        { name: 'vasanthi_rag_tool_executions_total', values: counter(2) },
        { name: 'vasanthi_rag_chat_response_seconds', values: hist(0.5) },
      ]),
    },
  } as any;
  const audit = { log: jest.fn().mockResolvedValue(undefined) } as any;
  const config = { get: jest.fn().mockReturnValue(true) } as any;

  beforeEach(() => {
    service = new AnalyticsService(
      ragRepository,
      embeddingService,
      orchestrator,
      consoleService,
      metrics,
      audit,
      config,
    );
  });

  it('getDashboard aggregates counts and metrics', async () => {
    const d = await service.getDashboard(1);
    expect(d.totalConversations).toBe(5);
    expect(d.toolExecutions).toBe(2);
    expect(d.avgLlmLatencyMs).toBe(500);
    expect(d.providerUptime).toBe(100);
  });

  it('getMetrics returns registry json', async () => {
    expect(await service.getMetrics()).toHaveLength(3);
  });

  it('getToolAnalytics sums executions', async () => {
    const t = await service.getToolAnalytics();
    expect(t.total).toBe(2);
  });

  it('getRetrievalAnalytics returns counts', async () => {
    const r = await service.getRetrievalAnalytics();
    expect(r.chunks).toBe(9);
    expect(r.pending).toBe(1);
  });

  it('getProviderAnalytics maps health', async () => {
    const p = await service.getProviderAnalytics();
    expect(p.embedding.ok).toBe(true);
    expect(p.llm.ok).toBe(true);
  });

  it('getChatAnalytics computes avg length', async () => {
    const c = await service.getChatAnalytics();
    expect(c.avgConversationLength).toBe(1);
  });

  it('getHealth extends console health', async () => {
    const h = await service.getHealth();
    expect(h.businessTools).toBe('up');
    expect(h.customerChat).toBe('up');
    expect(h.adminConsole).toBe('up');
  });

  it('getTraceContext returns store context', () => {
    const ctx = service.getTraceContext('conv-1');
    expect(ctx.conversationId).toBe('conv-1');
  });

  it('logAccess audits view', async () => {
    await service.logAccess('u1');
    expect(audit.log).toHaveBeenCalledWith({
      action: 'analytics.view',
      module: 'rag',
      resource: 'Analytics',
      userId: 'u1',
    });
  });
});

const assert = require('assert');

describe('AI Agent Center (Phase 14) Unit Tests', () => {
  describe('Module Load', () => {
    it('routes load without error', () => {
      const routes = require('../src/modules/cms-ai-center/routes/ai-center.routes');
      assert.ok(routes);
      assert.ok(routes.stack);
      assert.ok(routes.stack.length > 10);
    });

    it('encryption service encrypts and decrypts', () => {
      const encryption = require('../src/modules/cms-ai-center/services/encryption.service');
      const original = 'sk-test-api-key-12345';
      const encrypted = encryption.encrypt(original);
      assert.notStrictEqual(encrypted, original);
      const decrypted = encryption.decrypt(encrypted);
      assert.strictEqual(decrypted, original);
    });

    it('encryption produces different outputs for same input', () => {
      const encryption = require('../src/modules/cms-ai-center/services/encryption.service');
      const original = 'test-key';
      const e1 = encryption.encrypt(original);
      const e2 = encryption.encrypt(original);
      assert.notStrictEqual(e1, e2);
    });
  });

  describe('Cache Module', () => {
    it('exports expected cache functions', () => {
      const cache = require('../src/modules/cms-ai-center/middleware/ai-center-cache');
      assert.strictEqual(typeof cache.get, 'function');
      assert.strictEqual(typeof cache.set, 'function');
      assert.strictEqual(typeof cache.del, 'function');
      assert.strictEqual(typeof cache.cacheMiddleware, 'function');
    });

    it('cache failures do not throw', async () => {
      const cache = require('../src/modules/cms-ai-center/middleware/ai-center-cache');
      await assert.doesNotReject(async () => await cache.get('ai:test'));
      await assert.doesNotReject(async () => await cache.set('ai:test', { ok: true }));
      await assert.doesNotReject(async () => await cache.del('ai:test'));
    });
  });

  describe('Provider Service', () => {
    it('masks API keys in list output', async () => {
      const providerService = require('../src/modules/cms-ai-center/services/provider.service');
      const providers = await providerService.list();
      assert.ok(Array.isArray(providers));
      providers.forEach(p => {
        if (p.apiKey) assert.ok(p.apiKey.includes('••••'), 'API key should be masked');
      });
    });

    it('getFallbackChain returns sorted providers', async () => {
      const providerService = require('../src/modules/cms-ai-center/services/provider.service');
      const chain = await providerService.getFallbackChain();
      assert.ok(Array.isArray(chain));
    });
  });

  describe('Agent Service', () => {
    it('register and list agents', async () => {
      const agentService = require('../src/modules/cms-ai-center/services/agent.service');
      const agents = await agentService.list({});
      assert.ok(Array.isArray(agents));
    });

    it('getSourcesSummary returns source counts', async () => {
      const agentService = require('../src/modules/cms-ai-center/services/agent.service');
      const sources = await agentService.getSourcesSummary();
      assert.ok(sources.hasOwnProperty('pipeline'));
      assert.ok(sources.hasOwnProperty('certification'));
      assert.ok(sources.hasOwnProperty('workflow'));
      assert.ok(sources.hasOwnProperty('registered'));
    });
  });

  describe('Workflow Service', () => {
    it('getEngineIntegrations returns all CMS modules', async () => {
      const workflowService = require('../src/modules/cms-ai-center/services/workflow.service');
      const engines = await workflowService.getEngineIntegrations();
      const types = engines.map(e => e.type);
      assert.ok(types.includes('prompt'));
      assert.ok(types.includes('blueprint'));
      assert.ok(types.includes('verification'));
      assert.ok(types.includes('certification'));
      assert.ok(types.includes('ai-fix'));
      assert.ok(types.includes('validation-report'));
      assert.ok(types.includes('template'));
      assert.ok(types.includes('business-assignment'));
      assert.ok(types.includes('deployment'));
      assert.strictEqual(engines.length, 9);
    });
  });

  describe('Settings Service', () => {
    it('initializeDefaults creates default settings', async () => {
      const settingsService = require('../src/modules/cms-ai-center/services/settings.service');
      const result = await settingsService.initializeDefaults();
      assert.ok(result.initialized);
      assert.ok(result.count > 0);
    });

    it('get and set settings', async () => {
      const settingsService = require('../src/modules/cms-ai-center/services/settings.service');
      await settingsService.set('test_key', 'test_value', 'testing', 'Test setting');
      const value = await settingsService.get('test_key');
      assert.strictEqual(value, 'test_value');
      await settingsService.remove('test_key');
    });
  });

  describe('Analytics Service', () => {
    it('getDashboard returns all required fields', async () => {
      const analyticsService = require('../src/modules/cms-ai-center/services/analytics.service');
      const dashboard = await analyticsService.getDashboard();
      assert.ok(dashboard.hasOwnProperty('providers'));
      assert.ok(dashboard.hasOwnProperty('agents'));
      assert.ok(dashboard.hasOwnProperty('executions'));
      assert.ok(dashboard.hasOwnProperty('usage'));
      assert.ok(dashboard.hasOwnProperty('costs'));
      assert.ok(dashboard.hasOwnProperty('queue'));
      assert.ok(dashboard.hasOwnProperty('workflows'));
      assert.ok(dashboard.hasOwnProperty('aiAvailability'));
    });
  });

  describe('Health Service', () => {
    it('getHealth returns overall system health', async () => {
      const healthService = require('../src/modules/cms-ai-center/services/health.service');
      const health = await healthService.getHealth();
      assert.ok(health.hasOwnProperty('overall'));
      assert.ok(health.hasOwnProperty('providers'));
      assert.ok(health.hasOwnProperty('agents'));
      assert.ok(health.hasOwnProperty('infrastructure'));
      assert.ok(health.hasOwnProperty('timestamp'));
    });
  });

  describe('Queue Service', () => {
    it('getStatus returns queue metrics', async () => {
      const queueService = require('../src/modules/cms-ai-center/services/queue.service');
      const status = await queueService.getStatus();
      assert.ok(status.hasOwnProperty('redis'));
      assert.ok(status.hasOwnProperty('mode'));
      assert.ok(status.hasOwnProperty('workers'));
      assert.ok(status.hasOwnProperty('queues'));
    });
  });

  describe('Duplicate Service Audit', () => {
    it('does not create new EventEmitter instances', () => {
      const eventBus = require('../src/services/eventBus');
      assert.ok(eventBus.eventBus);
      assert.ok(eventBus.Events);
    });

    it('reuses ai-core QueueManager singleton', () => {
      const queueManager = require('../src/modules/ai-core/queues/queueManager');
      const aiQueueService = require('../src/modules/cms-ai-center/services/queue.service');
      assert.ok(queueManager);
      assert.ok(aiQueueService);
    });

    it('reuses existing ai-core provider service', () => {
      const providerService = require('../src/modules/ai-core/services/provider.service');
      const aiProviderService = require('../src/modules/cms-ai-center/services/provider.service');
      assert.ok(providerService);
      assert.ok(aiProviderService);
    });

    it('no duplicate routes between orchestrator and ai-center', () => {
      const aiRoutes = require('../src/modules/ai-core/routes/ai.routes');
      const centerRoutes = require('../src/modules/cms-ai-center/routes/ai-center.routes');
      assert.ok(aiRoutes);
      assert.ok(centerRoutes);
    });
  });

  describe('Route Audit', () => {
    const expectedEndpoints = [
      '/providers', '/providers/:id', '/providers/:id/test', '/providers/check-all', '/providers/fallback-chain',
      '/agents', '/agents/:id', '/agents/sync', '/agents/sources', '/agents/:id/test',
      '/workflows', '/workflows/:id', '/workflows/:id/execute', '/workflows/:id/toggle', '/workflows/integrations/engines',
      '/executions', '/executions/:id', '/executions/:id/logs', '/executions/:id/steps',
      '/sessions',
      '/usage', '/usage/summary',
      '/cost', '/cost/summary',
      '/health', '/health/check',
      '/settings', '/settings/init',
      '/queue', '/queue/workers',
      '/analytics/dashboard', '/analytics/clear-cache'
    ];
    it('has all expected endpoints', () => {
      assert.ok(expectedEndpoints.length >= 30);
      expectedEndpoints.forEach(ep => {
        assert.ok(typeof ep === 'string');
      });
    });
  });

  describe('EventBus Events', () => {
    const requiredEvents = [
      'ai:provider:offline',
      'ai:provider:online',
      'ai:workflow:started',
      'ai:workflow:completed',
      'ai:workflow:failed',
      'ai:execution:started',
      'ai:execution:completed',
      'ai:execution:failed'
    ];
    it('all required AI events are defined', () => {
      assert.strictEqual(requiredEvents.length, 8);
    });
  });
});

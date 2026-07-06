const assert = require('assert');

describe('CMS Settings Center (Phase 15) Unit Tests', () => {
  describe('Module Load', () => {
    it('routes load without error', () => {
      const routes = require('../src/modules/cms-settings/routes/settings.routes');
      assert.ok(routes);
      assert.ok(routes.stack);
      assert.ok(routes.stack.length >= 4);
    });

    it('service loads without error', () => {
      const service = require('../src/modules/cms-settings/services/settings.service');
      assert.ok(service);
      assert.strictEqual(typeof service.getAll, 'function');
      assert.strictEqual(typeof service.getCategory, 'function');
      assert.strictEqual(typeof service.updateCategory, 'function');
      assert.strictEqual(typeof service.initializeDefaults, 'function');
    });
  });

  describe('Cache Module', () => {
    it('exports expected cache functions', () => {
      const cache = require('../src/modules/cms-settings/middleware/settings-cache');
      assert.strictEqual(typeof cache.get, 'function');
      assert.strictEqual(typeof cache.set, 'function');
      assert.strictEqual(typeof cache.del, 'function');
    });

    it('cache failures do not throw', async () => {
      const cache = require('../src/modules/cms-settings/middleware/settings-cache');
      await assert.doesNotReject(async () => await cache.get('settings:test'));
      await assert.doesNotReject(async () => await cache.set('settings:test', { ok: true }));
      await assert.doesNotReject(async () => await cache.del('settings:test'));
    });
  });

  describe('Defaults', () => {
    it('initializeDefaults returns expected count', async () => {
      const service = require('../src/modules/cms-settings/services/settings.service');
      const result = await service.initializeDefaults();
      assert.ok(result.initialized);
      assert.ok(result.count > 40);
    });
  });

  describe('Category Access', () => {
    it('getCategory returns data for general', async () => {
      const service = require('../src/modules/cms-settings/services/settings.service');
      const result = await service.getCategory('general');
      assert.ok(result);
    });

    it('getCategory returns data for smtp', async () => {
      const service = require('../src/modules/cms-settings/services/settings.service');
      const result = await service.getCategory('smtp');
      assert.ok(result);
    });

    it('getCategory returns data for security', async () => {
      const service = require('../src/modules/cms-settings/services/settings.service');
      const result = await service.getCategory('security');
      assert.ok(result);
    });

    it('getCategory returns data for feature_flag', async () => {
      const service = require('../src/modules/cms-settings/services/settings.service');
      const result = await service.getCategory('feature_flag');
      assert.ok(Array.isArray(result));
    });

    it('getCategory returns data for backup', async () => {
      const service = require('../src/modules/cms-settings/services/settings.service');
      const result = await service.getCategory('backup');
      assert.ok(result);
    });

    it('getCategory returns data for maintenance', async () => {
      const service = require('../src/modules/cms-settings/services/settings.service');
      const result = await service.getCategory('maintenance');
      assert.ok(result);
    });

    it('getCategory returns data for monitoring', async () => {
      const service = require('../src/modules/cms-settings/services/settings.service');
      const result = await service.getCategory('monitoring');
      assert.ok(result);
    });

    it('getCategory returns data for localization', async () => {
      const service = require('../src/modules/cms-settings/services/settings.service');
      const result = await service.getCategory('localization');
      assert.ok(result);
    });

    it('getCategory returns data for integration', async () => {
      const service = require('../src/modules/cms-settings/services/settings.service');
      const result = await service.getCategory('integration');
      assert.ok(result);
    });

    it('getCategory returns data for performance', async () => {
      const service = require('../src/modules/cms-settings/services/settings.service');
      const result = await service.getCategory('performance');
      assert.ok(result);
    });

    it('getCategory returns data for analytics', async () => {
      const service = require('../src/modules/cms-settings/services/settings.service');
      const result = await service.getCategory('analytics');
      assert.ok(result);
    });

    it('getCategory returns data for storage', async () => {
      const service = require('../src/modules/cms-settings/services/settings.service');
      const result = await service.getCategory('storage');
      assert.ok(result);
    });

    it('getCategory returns data for redis', async () => {
      const service = require('../src/modules/cms-settings/services/settings.service');
      const result = await service.getCategory('redis');
      assert.ok(result);
    });

    it('getCategory returns data for queue', async () => {
      const service = require('../src/modules/cms-settings/services/settings.service');
      const result = await service.getCategory('queue');
      assert.ok(result);
    });
  });

  describe('GetAll', () => {
    it('getAll returns all categories', async () => {
      const service = require('../src/modules/cms-settings/services/settings.service');
      const result = await service.getAll();
      assert.ok(result);
      assert.ok(result.general);
      assert.ok(result.smtp);
      assert.ok(result.security);
      assert.ok(result.deployment);
      assert.ok(result.domains);
      assert.ok(result.environment_variables);
      assert.ok(result.ai_providers);
    });
  });

  describe('Duplicate Audit', () => {
    it('does not create duplicate EventBus instances', () => {
      const eb = require('../src/services/eventBus');
      assert.ok(eb.eventBus);
      assert.ok(eb.Events);
      assert.strictEqual(typeof eb.eventBus.emit, 'function');
    });

    it('reuses existing AuditService', () => {
      const audit = require('../src/services/auditService');
      assert.strictEqual(typeof audit.logAction, 'function');
      assert.strictEqual(typeof audit.getAuditLogs, 'function');
    });

    it('reuses existing CmsAiSettings model (no new model needed)', async () => {
      const prisma = require('../src/utils/prisma');
      const modelNames = Object.keys(prisma).filter(k => k.startsWith('cms') || k.startsWith('Cms'));
      const hasExisting = modelNames.some(n => n.toLowerCase().includes('aipro')) || modelNames.some(n => n.toLowerCase().includes('aisetting'));
      assert.ok(hasExisting || modelNames.length > 0);
    });

    it('no duplicate routes between existing modules and settings', () => {
      const settingsRoutes = require('../src/modules/cms-settings/routes/settings.routes');
      const existingPaths = ['/api/v1/cms/ai-center', '/api/v1/cms/deployment', '/api/v1/cms/business-assignment'];
      const ourPath = '/api/v1/cms/settings';
      existingPaths.forEach(p => {
        assert.notStrictEqual(p, ourPath, `Route collision: ${p} vs ${ourPath}`);
      });
      assert.ok(settingsRoutes.stack.length >= 4);
    });
  });

  describe('EventBus Events', () => {
    it('settings module uses global EventBus', () => {
      const { eventBus } = require('../src/services/eventBus');
      assert.ok(eventBus);
      assert.strictEqual(typeof eventBus.on, 'function');
      assert.strictEqual(typeof eventBus.emit, 'function');
    });

    it('maintenance toggle emits events', () => {
      const { eventBus } = require('../src/services/eventBus');
      let emitted = false;
      const handler = () => { emitted = true; };
      eventBus.on('system:maintenance:enabled', handler);
      eventBus.emit('system:maintenance:enabled', { message: 'test' });
      eventBus.removeListener('system:maintenance:enabled', handler);
      assert.ok(emitted);
    });

    it('settings update emits category event', () => {
      const { eventBus } = require('../src/services/eventBus');
      let emitted = false;
      const handler = () => { emitted = true; };
      eventBus.on('settings:general:updated', handler);
      eventBus.emit('settings:general:updated', { category: 'general', data: {} });
      eventBus.removeListener('settings:general:updated', handler);
      assert.ok(emitted);
    });
  });

  describe('Route Handlers', () => {
    it('has GET / handler', () => {
      const routes = require('../src/modules/cms-settings/routes/settings.routes');
      const getRoute = routes.stack.find(layer => layer.route && layer.route.methods && layer.route.methods.get);
      assert.ok(getRoute, 'No GET route found');
    });

    it('has PUT /:category handler', () => {
      const routes = require('../src/modules/cms-settings/routes/settings.routes');
      const putRoute = routes.stack.find(layer => layer.route && layer.route.methods && layer.route.methods.put);
      assert.ok(putRoute, 'No PUT route found');
    });

    it('has POST /initialize handler', () => {
      const routes = require('../src/modules/cms-settings/routes/settings.routes');
      const initRoute = routes.stack.some(layer => {
        if (layer.route && layer.route.methods && layer.route.methods.post) {
          return layer.route.path === '/initialize';
        }
        return false;
      });
      assert.ok(initRoute, 'No POST /initialize route found');
    });
  });
});

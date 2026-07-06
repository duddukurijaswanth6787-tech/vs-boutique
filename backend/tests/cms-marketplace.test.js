const assert = require('assert');

describe('CMS Marketplace & Extensions (Phase 17) Unit Tests', () => {
  describe('Module Load', () => {
    it('routes load without error', () => {
      const routes = require('../src/modules/cms-marketplace/routes/marketplace.routes');
      assert.ok(routes);
      assert.ok(routes.stack);
      assert.ok(routes.stack.length >= 5);
    });

    it('service loads without error', () => {
      const service = require('../src/modules/cms-marketplace/services/marketplace.service');
      assert.ok(service);
      assert.strictEqual(typeof service.getAll, 'function');
      assert.strictEqual(typeof service.getCategory, 'function');
      assert.strictEqual(typeof service.updateCategory, 'function');
      assert.strictEqual(typeof service.initializeDefaults, 'function');
      assert.strictEqual(typeof service.searchPackages, 'function');
      assert.strictEqual(typeof service.publishPackage, 'function');
      assert.strictEqual(typeof service.installPackage, 'function');
    });
  });

  describe('Cache Module', () => {
    it('exports expected cache functions', () => {
      const cache = require('../src/modules/cms-marketplace/middleware/marketplace-cache');
      assert.strictEqual(typeof cache.get, 'function');
      assert.strictEqual(typeof cache.set, 'function');
      assert.strictEqual(typeof cache.del, 'function');
      assert.strictEqual(typeof cache.delPattern, 'function');
    });

    it('cache failures do not throw', async () => {
      const cache = require('../src/modules/cms-marketplace/middleware/marketplace-cache');
      await assert.doesNotReject(async () => await cache.get('marketplace:test'));
      await assert.doesNotReject(async () => await cache.set('marketplace:test', { ok: true }));
      await assert.doesNotReject(async () => await cache.del('marketplace:test'));
      await assert.doesNotReject(async () => await cache.delPattern('test:*'));
    });
  });

  describe('Defaults', () => {
    it('initializeDefaults returns expected count', async () => {
      const service = require('../src/modules/cms-marketplace/services/marketplace.service');
      const result = await service.initializeDefaults();
      assert.ok(result.initialized);
      assert.ok(result.count >= 10);
    });
  });

  describe('Category Access', () => {
    it('getCategory returns data for config', async () => {
      const service = require('../src/modules/cms-marketplace/services/marketplace.service');
      const result = await service.getCategory('config');
      assert.ok(result);
      assert.ok(result.settings);
    });

    it('getCategory returns data for categories', async () => {
      const service = require('../src/modules/cms-marketplace/services/marketplace.service');
      const result = await service.getCategory('categories');
      assert.ok(result);
      assert.ok(Array.isArray(result));
    });

    it('getCategory returns data for analytics', async () => {
      const service = require('../src/modules/cms-marketplace/services/marketplace.service');
      const result = await service.getCategory('analytics');
      assert.ok(result);
    });

    it('getAll returns all marketplace data', async () => {
      const service = require('../src/modules/cms-marketplace/services/marketplace.service');
      const result = await service.getAll();
      assert.ok(result);
      assert.ok(result.config);
      assert.ok(result.categories);
      assert.ok(Array.isArray(result.categories));
      assert.ok(result.stats);
    });
  });

  describe('Manifest Validator', () => {
    it('validates correct manifest', () => {
      const { validateManifest } = require('../src/modules/cms-marketplace/validators/manifest.validator');
      const result = validateManifest({
        id: 'test-package',
        version: '1.0.0',
        name: 'Test Package',
        type: 'extension',
        permissions: ['analytics:read'],
        capabilities: [{ type: 'web-component', entrypoint: '/handler.js' }]
      });
      assert.ok(result.valid);
    });

    it('rejects invalid manifest', () => {
      const { validateManifest } = require('../src/modules/cms-marketplace/validators/manifest.validator');
      const result = validateManifest({});
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.length > 0);
    });

    it('rejects root:write permission', () => {
      const { validateManifest } = require('../src/modules/cms-marketplace/validators/manifest.validator');
      const result = validateManifest({
        id: 'test',
        version: '1.0.0',
        name: 'Test',
        permissions: ['root:write']
      });
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('root:write')));
    });
  });

  describe('Edges', () => {
    it('getCategory for unknown category returns empty', async () => {
      const service = require('../src/modules/cms-marketplace/services/marketplace.service');
      const result = await service.getCategory('nonexistent');
      assert.ok(result);
    });

    it('server.js registers the route', () => {
      const server = require('fs').readFileSync('./src/server.js', 'utf8');
      assert.ok(server.includes("/api/v1/cms/marketplace"));
    });

    it('updateCategory with unknown throws', async () => {
      const service = require('../src/modules/cms-marketplace/services/marketplace.service');
      await assert.rejects(async () => {
        await service.updateCategory('nonexistent', {}, 'TEST', '127.0.0.1');
      });
    });
  });
});

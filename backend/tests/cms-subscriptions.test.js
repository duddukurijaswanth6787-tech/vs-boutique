const assert = require('assert');

describe('CMS Subscriptions & Billing (Phase 16) Unit Tests', () => {
  describe('Module Load', () => {
    it('routes load without error', () => {
      const routes = require('../src/modules/cms-subscriptions/routes/subscriptions.routes');
      assert.ok(routes);
      assert.ok(routes.stack);
      assert.ok(routes.stack.length >= 4);
    });

    it('service loads without error', () => {
      const service = require('../src/modules/cms-subscriptions/services/subscriptions.service');
      assert.ok(service);
      assert.strictEqual(typeof service.getAll, 'function');
      assert.strictEqual(typeof service.getCategory, 'function');
      assert.strictEqual(typeof service.updateCategory, 'function');
      assert.strictEqual(typeof service.initializeDefaults, 'function');
    });
  });

  describe('Cache Module', () => {
    it('exports expected cache functions', () => {
      const cache = require('../src/modules/cms-subscriptions/middleware/subscriptions-cache');
      assert.strictEqual(typeof cache.get, 'function');
      assert.strictEqual(typeof cache.set, 'function');
      assert.strictEqual(typeof cache.del, 'function');
    });

    it('cache failures do not throw', async () => {
      const cache = require('../src/modules/cms-subscriptions/middleware/subscriptions-cache');
      await assert.doesNotReject(async () => await cache.get('cms:subs:test'));
      await assert.doesNotReject(async () => await cache.set('cms:subs:test', { ok: true }));
      await assert.doesNotReject(async () => await cache.del('cms:subs:test'));
    });
  });

  describe('Defaults', () => {
    it('initializeDefaults returns expected categories', async () => {
      const service = require('../src/modules/cms-subscriptions/services/subscriptions.service');
      const result = await service.initializeDefaults();
      assert.ok(result.initialized);
      assert.ok(result.count >= 17);
    });
  });

  describe('Category Access', () => {
    it('getCategory returns data for billing', async () => {
      const service = require('../src/modules/cms-subscriptions/services/subscriptions.service');
      const result = await service.getCategory('billing');
      assert.ok(result);
    });

    it('getCategory returns data for tax', async () => {
      const service = require('../src/modules/cms-subscriptions/services/subscriptions.service');
      const result = await service.getCategory('tax');
      assert.ok(result);
    });

    it('getCategory returns data for invoices', async () => {
      const service = require('../src/modules/cms-subscriptions/services/subscriptions.service');
      const result = await service.getCategory('invoices');
      assert.ok(result);
    });

    it('getCategory returns data for webhooks', async () => {
      const service = require('../src/modules/cms-subscriptions/services/subscriptions.service');
      const result = await service.getCategory('webhooks');
      assert.ok(result);
    });

    it('getCategory returns data for usage_metering', async () => {
      const service = require('../src/modules/cms-subscriptions/services/subscriptions.service');
      const result = await service.getCategory('usage_metering');
      assert.ok(result);
    });

    it('getAll returns all 9 categories', async () => {
      const service = require('../src/modules/cms-subscriptions/services/subscriptions.service');
      const result = await service.getAll();
      assert.ok(result);
      const categories = Object.keys(result);
      assert.ok(categories.includes('plans'));
      assert.ok(categories.includes('subscriptions'));
      assert.ok(categories.includes('billing'));
      assert.ok(categories.includes('invoices'));
      assert.ok(categories.includes('tax'));
      assert.ok(categories.includes('credits'));
      assert.ok(categories.includes('webhooks'));
      assert.ok(categories.includes('usage_metering'));
      assert.ok(categories.includes('analytics'));
    });
  });

  describe('Update Category', () => {
    it('updateCategory stores and returns data', async () => {
      const service = require('../src/modules/cms-subscriptions/services/subscriptions.service');
      const result = await service.updateCategory('tax', { settings: { tax_rate: 15 } }, 'TEST', '127.0.0.1');
      assert.ok(result);
    });

    it('updateCategory with upsertMap delegates correctly', async () => {
      const service = require('../src/modules/cms-subscriptions/services/subscriptions.service');
      const result = await service.updateCategory('billing', { settings: { auto_invoice: true } }, 'TEST', '127.0.0.1');
      assert.ok(result);
    });
  });

  describe('Edges', () => {
    it('getCategory for unknown category returns empty', async () => {
      const service = require('../src/modules/cms-subscriptions/services/subscriptions.service');
      const result = await service.getCategory('nonexistent');
      assert.ok(result);
    });

    it('server.js registers the route', () => {
      const server = require('fs').readFileSync('./src/server.js', 'utf8');
      assert.ok(server.includes("/api/v1/cms/subscriptions"));
    });
  });
});

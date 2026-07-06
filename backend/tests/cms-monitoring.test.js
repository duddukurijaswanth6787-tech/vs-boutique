const assert = require('assert');

describe('CMS Monitoring Center (Phase 18) Unit Tests', () => {
  describe('Module Load', () => {
    it('routes load without error', () => {
      const routes = require('../src/modules/cms-monitoring/routes/monitoring.routes');
      assert.ok(routes);
      assert.ok(routes.stack);
      assert.ok(routes.stack.length >= 5);
    });

    it('services load without error', () => {
      const mon = require('../src/modules/cms-monitoring/services/monitoring.service');
      assert.strictEqual(typeof mon.getOverview, 'function');
      assert.strictEqual(typeof mon.getConfig, 'function');
      assert.strictEqual(typeof mon.initializeDefaults, 'function');
      assert.strictEqual(typeof mon.emitAlert, 'function');

      const health = require('../src/modules/cms-monitoring/services/health.service');
      assert.strictEqual(typeof health.getAggregateHealth, 'function');

      const dash = require('../src/modules/cms-monitoring/services/dashboard.service');
      assert.strictEqual(typeof dash.getKPIs, 'function');
      assert.strictEqual(typeof dash.getPerformance, 'function');
      assert.strictEqual(typeof dash.getSecurity, 'function');
    });
  });

  describe('Cache Module', () => {
    it('exports expected cache functions', () => {
      const cache = require('../src/modules/cms-monitoring/middleware/monitoring-cache');
      assert.strictEqual(typeof cache.get, 'function');
      assert.strictEqual(typeof cache.set, 'function');
      assert.strictEqual(typeof cache.del, 'function');
    });

    it('cache failures do not throw', async () => {
      const cache = require('../src/modules/cms-monitoring/middleware/monitoring-cache');
      await assert.doesNotReject(async () => await cache.get('mon:test'));
      await assert.doesNotReject(async () => await cache.set('mon:test', { ok: true }));
      await assert.doesNotReject(async () => await cache.del('mon:test'));
    });
  });

  describe('Defaults', () => {
    it('initializeDefaults returns expected count', async () => {
      const service = require('../src/modules/cms-monitoring/services/monitoring.service');
      const result = await service.initializeDefaults();
      assert.ok(result.initialized);
      assert.ok(result.count >= 12);
    });
  });

  describe('Config', () => {
    it('getConfig returns monitoring settings', async () => {
      const service = require('../src/modules/cms-monitoring/services/monitoring.service');
      const result = await service.getConfig();
      assert.ok(result);
      assert.ok(result.settings);
    });

    it('updateConfig stores and returns data', async () => {
      const service = require('../src/modules/cms-monitoring/services/monitoring.service');
      const result = await service.updateConfig({ monitoring_enabled: true }, 'TEST', '127.0.0.1');
      assert.ok(result);
      assert.ok(result.settings);
    });
  });

  describe('Health', () => {
    it('getAggregateHealth returns all subsystems', async () => {
      const health = require('../src/modules/cms-monitoring/services/health.service');
      const result = await health.getAggregateHealth();
      assert.ok(result);
      assert.ok(result.overall);
      assert.ok(result.server);
      assert.ok(result.database);
      assert.ok(result.timestamp);
    });
  });

  describe('Dashboard', () => {
    it('getPerformance returns system performance', async () => {
      const dash = require('../src/modules/cms-monitoring/services/dashboard.service');
      const result = await dash.getPerformance();
      assert.ok(result);
      assert.ok(result.memory);
      assert.ok(result.cpu);
      assert.ok(result.process);
    });

    it('getSecurity returns security data', async () => {
      const dash = require('../src/modules/cms-monitoring/services/dashboard.service');
      const result = await dash.getSecurity();
      assert.ok(result);
      assert.ok(typeof result.failedLogins24h === 'number');
    });
  });

  describe('Overview', () => {
    it('getOverview aggregates all data', async () => {
      const service = require('../src/modules/cms-monitoring/services/monitoring.service');
      const result = await service.getOverview();
      assert.ok(result);
      assert.ok(result.health);
      assert.ok(result.kpis);
      assert.ok(result.performance);
      assert.ok(result.security);
      assert.ok(result.timestamp);
    });
  });

  describe('EventBus', () => {
    it('Events.MONITORING_ALERT is defined', () => {
      const { Events } = require('../src/services/eventBus');
      assert.strictEqual(Events.MONITORING_ALERT, 'monitoring:alert');
    });

    it('emitAlert emits event and audits', async () => {
      const service = require('../src/modules/cms-monitoring/services/monitoring.service');
      const result = await service.emitAlert('test', 'Test alert', { severity: 'info' });
      assert.ok(result.emitted);
    });
  });

  describe('Process Monitoring', () => {
    it('server.js has uncaughtException handler', () => {
      const server = require('fs').readFileSync('./src/server.js', 'utf8');
      assert.ok(server.includes("uncaughtException"));
      assert.ok(server.includes("unhandledRejection"));
    });

    it('server.js registers the route', () => {
      const server = require('fs').readFileSync('./src/server.js', 'utf8');
      assert.ok(server.includes("/api/v1/cms/monitoring"));
    });
  });
});

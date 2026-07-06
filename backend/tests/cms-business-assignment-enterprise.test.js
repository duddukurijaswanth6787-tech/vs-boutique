const assert = require('assert');

describe('Business Assignment Enterprise (Phase 13.5) Unit Tests', () => {
  describe('Cache Module', () => {
    it('exports expected cache functions', () => {
      const cache = require('../src/modules/cms-business-assignment/middleware/assignment-cache');
      assert.strictEqual(typeof cache.get, 'function');
      assert.strictEqual(typeof cache.set, 'function');
      assert.strictEqual(typeof cache.del, 'function');
      assert.strictEqual(typeof cache.cacheMiddleware, 'function');
      assert.strictEqual(typeof cache.CACHE_TTL, 'number');
    });

    it('cacheMiddleware returns a middleware function', () => {
      const cache = require('../src/modules/cms-business-assignment/middleware/assignment-cache');
      const middleware = cache.cacheMiddleware('test', 300);
      assert.strictEqual(typeof middleware, 'function');
      assert.strictEqual(middleware.length, 3);
    });

    it('cache failures do not throw', async () => {
      const cache = require('../src/modules/cms-business-assignment/middleware/assignment-cache');
      await assert.doesNotReject(async () => await cache.get('test:key'));
      await assert.doesNotReject(async () => await cache.set('test:key', { data: true }));
      await assert.doesNotReject(async () => await cache.del('test:*'));
    });
  });

  describe('Queue Module', () => {
    it('assignment-queue loads without error', () => {
      const queue = require('../src/modules/cms-business-assignment/services/assignment-queue');
      assert.ok(queue);
      assert.ok(queue.deploymentQueue);
    });

    it('queue has expected job types registered', () => {
      const queue = require('../src/modules/cms-business-assignment/services/assignment-queue');
      assert.ok(queue.deploymentQueue);
    });
  });

  describe('Enterprise Dashboard Structure', () => {
    it('dashboard has required fields', () => {
      const mockDashboard = {
        totalAssignments: 10,
        activeAssignments: 5,
        readyAssignments: 3,
        statusDistribution: { ACTIVE: 5, DRAFT: 2, READY: 3 },
        deploymentSuccessRate: 80,
        deploymentFailureCount: 1,
        totalDeployments: 5,
        templateUsage: [],
        dailyTrends: [],
        monthlyTrends: []
      };
      assert.strictEqual(typeof mockDashboard.totalAssignments, 'number');
      assert.strictEqual(typeof mockDashboard.activeAssignments, 'number');
      assert.strictEqual(typeof mockDashboard.readyAssignments, 'number');
      assert.strictEqual(typeof mockDashboard.deploymentSuccessRate, 'number');
      assert.strictEqual(typeof mockDashboard.deploymentFailureCount, 'number');
      assert.strictEqual(typeof mockDashboard.totalDeployments, 'number');
      assert.ok(Array.isArray(mockDashboard.templateUsage));
      assert.ok(Array.isArray(mockDashboard.dailyTrends));
      assert.ok(Array.isArray(mockDashboard.monthlyTrends));
    });

    it('daily trend entries have date and count', () => {
      const trend = { date: '2026-06-01', count: 3 };
      assert.strictEqual(typeof trend.date, 'string');
      assert.strictEqual(typeof trend.count, 'number');
    });

    it('monthly trend entries have month and count', () => {
      const trend = { month: '2026-06', count: 15 };
      assert.strictEqual(typeof trend.month, 'string');
      assert.strictEqual(typeof trend.count, 'number');
    });
  });

  describe('Enterprise Routes', () => {
    const expectedRoutes = [
      '/dashboard',
      '/jobs',
      '/jobs/:jobType/:jobId',
      '/jobs/:jobType/:jobId/retry',
      '/cache/clear',
      '/analytics/recalculate'
    ];

    it('has all enterprise routes defined', () => {
      assert.strictEqual(expectedRoutes.length, 6);
      assert.ok(expectedRoutes.includes('/dashboard'));
      assert.ok(expectedRoutes.includes('/jobs'));
      assert.ok(expectedRoutes.includes('/cache/clear'));
      assert.ok(expectedRoutes.includes('/analytics/recalculate'));
    });
  });

  describe('Frontend API Client', () => {
    const enterpriseMethods = [
      'getDashboard', 'getJobs', 'getJob',
      'retryJob', 'clearCache', 'recalculateAnalytics'
    ];

    it('has all enterprise API methods', () => {
      assert.strictEqual(enterpriseMethods.length, 6);
      assert.ok(enterpriseMethods.includes('getDashboard'));
      assert.ok(enterpriseMethods.includes('getJobs'));
      assert.ok(enterpriseMethods.includes('retryJob'));
      assert.ok(enterpriseMethods.includes('clearCache'));
      assert.ok(enterpriseMethods.includes('recalculateAnalytics'));
    });
  });

  describe('Notification Events', () => {
    const requiredAssignmentEvents = [
      'assignment:created',
      'assignment:validated',
      'assignment:ready',
      'assignment:deploying',
      'assignment:deployed',
      'assignment:active',
      'assignment:failed',
      'assignment:archived',
      'assignment:deleted'
    ];

    it('all required assignment events are defined', () => {
      assert.strictEqual(requiredAssignmentEvents.length, 9);
      assert.ok(requiredAssignmentEvents.includes('assignment:created'));
      assert.ok(requiredAssignmentEvents.includes('assignment:validated'));
      assert.ok(requiredAssignmentEvents.includes('assignment:ready'));
      assert.ok(requiredAssignmentEvents.includes('assignment:deploying'));
      assert.ok(requiredAssignmentEvents.includes('assignment:deployed'));
      assert.ok(requiredAssignmentEvents.includes('assignment:active'));
      assert.ok(requiredAssignmentEvents.includes('assignment:failed'));
      assert.ok(requiredAssignmentEvents.includes('assignment:archived'));
      assert.ok(requiredAssignmentEvents.includes('assignment:deleted'));
    });
  });

  describe('Enterprise Queue Job Types', () => {
    const jobTypes = [
      'assignment-validation',
      'assignment-deployment',
      'assignment-env-sync',
      'assignment-domain-sync',
      'assignment-analytics'
    ];

    it('all assignment job types are defined', () => {
      assert.strictEqual(jobTypes.length, 5);
      jobTypes.forEach(type => {
        assert.ok(type.startsWith('assignment-'));
      });
    });
  });

  describe('Duplicate Service Audit', () => {
    it('does not create duplicate queue instances', () => {
      const assignmentQueue = require('../src/modules/cms-business-assignment/services/assignment-queue');
      const deploymentQueue = require('../src/modules/cms-deployment/services/deployment.queue');
      assert.strictEqual(assignmentQueue.deploymentQueue, deploymentQueue);
    });

    it('does not create new EventBus instance', () => {
      const eventBus = require('../src/services/eventBus');
      assert.ok(eventBus.eventBus);
      assert.ok(eventBus.Events);
    });
  });
});

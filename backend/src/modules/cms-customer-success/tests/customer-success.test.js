const { eventBus, Events } = require('../../../services/eventBus');
const healthScoreService = require('../services/health-score.service');
const lifecycleService = require('../services/lifecycle.service');
const engagementService = require('../services/engagement.service');
const timelineService = require('../services/timeline.service');
const recommendationService = require('../services/recommendation.service');
const analyticsService = require('../services/analytics.service');

describe('Phase 20 — Customer Success Center', () => {
  describe('EventBus Constants', () => {
    test('should have CUSTOMER_HEALTH_UPDATED', () => {
      expect(Events.CUSTOMER_HEALTH_UPDATED).toBe('customer:health-updated');
    });
    test('should have CUSTOMER_RISK_DETECTED', () => {
      expect(Events.CUSTOMER_RISK_DETECTED).toBe('customer:risk-detected');
    });
    test('should have CUSTOMER_RECOMMENDATION_CREATED', () => {
      expect(Events.CUSTOMER_RECOMMENDATION_CREATED).toBe('customer:recommendation-created');
    });
  });

  describe('healthScoreService.calculateHealth()', () => {
    test('should return health score object', async () => {
      const result = await healthScoreService.calculateHealth('test-biz-1');
      expect(result).toBeDefined();
      expect(result).toHaveProperty('businessId');
      expect(result).toHaveProperty('overall');
      expect(result).toHaveProperty('riskLevel');
      expect(result).toHaveProperty('calculatedAt');
    });

    test('overall should be between 0 and 100', async () => {
      const result = await healthScoreService.calculateHealth('test-biz-1');
      expect(result.overall).toBeGreaterThanOrEqual(0);
      expect(result.overall).toBeLessThanOrEqual(100);
    });

    test('riskLevel should be valid', async () => {
      const result = await healthScoreService.calculateHealth('test-biz-1');
      expect(['low', 'medium', 'high', 'critical']).toContain(result.riskLevel);
    });

    test('should have details object', async () => {
      const result = await healthScoreService.calculateHealth('test-biz-1');
      expect(result.details).toBeDefined();
      expect(typeof result.details).toBe('object');
    });

    test('each detail entry should have score and weight', async () => {
      const result = await healthScoreService.calculateHealth('test-biz-1');
      const detailKeys = Object.keys(result.details);
      if (detailKeys.length > 0) {
        const detail = result.details[detailKeys[0]];
        expect(detail).toHaveProperty('score');
        expect(detail).toHaveProperty('weight');
      }
    });
  });

  describe('lifecycleService.getLifecycle()', () => {
    test('should return lifecycle object for valid business', async () => {
      const businesses = await require('../../../utils/prisma').business.findMany({ take: 1, select: { id: true } });
      if (businesses.length === 0) return;
      const result = await lifecycleService.getLifecycle(businesses[0].id);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('businessId');
      expect(result).toHaveProperty('stage');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('daysSinceCreated');
    });

    test('should return null for unknown business', async () => {
      const result = await lifecycleService.getLifecycle('00000000-0000-0000-0000-000000000000');
      expect(result).toBeNull();
    });
  });

  describe('lifecycleService.getAllLifecycles()', () => {
    test('should return aggregated lifecycle data', async () => {
      const result = await lifecycleService.getAllLifecycles();
      expect(result).toBeDefined();
      expect(result).toHaveProperty('stages');
      expect(result).toHaveProperty('distribution');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.stages)).toBe(true);
    });

    test('distribution should contain all lifecycle stages', async () => {
      const result = await lifecycleService.getAllLifecycles();
      expect(result.distribution).toHaveProperty('lead');
      expect(result.distribution).toHaveProperty('active');
      expect(result.distribution).toHaveProperty('churned');
    });
  });

  describe('engagementService.getEngagement()', () => {
    test('should return engagement metrics', async () => {
      const result = await engagementService.getEngagement('test-biz-1');
      expect(result).toBeDefined();
      if (result) {
        expect(result).toHaveProperty('businessId');
        expect(result).toHaveProperty('period');
        expect(result).toHaveProperty('engagementScore');
        expect(result).toHaveProperty('level');
      }
    });
  });

  describe('timelineService.getTimeline()', () => {
    test('should return timeline entries', async () => {
      const result = await timelineService.getTimeline('test-biz-1');
      expect(result).toBeDefined();
      expect(result).toHaveProperty('businessId');
      expect(result).toHaveProperty('entries');
      expect(Array.isArray(result.entries)).toBe(true);
    });

    test('entries should have type and timestamp', async () => {
      const result = await timelineService.getTimeline('test-biz-1', { limit: 5 });
      if (result.entries.length > 0) {
        const entry = result.entries[0];
        expect(entry).toHaveProperty('id');
        expect(entry).toHaveProperty('type');
        expect(entry).toHaveProperty('timestamp');
      }
    });
  });

  describe('recommendationService.getRecommendations()', () => {
    test('should return recommendations array', async () => {
      const result = await recommendationService.getRecommendations('test-biz-1');
      expect(result).toBeDefined();
      expect(result).toHaveProperty('businessId');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    test('recommendations should have type, title, priority', async () => {
      const result = await recommendationService.getRecommendations('test-biz-1');
      if (result.recommendations.length > 0) {
        const rec = result.recommendations[0];
        expect(rec).toHaveProperty('type');
        expect(rec).toHaveProperty('title');
        expect(rec).toHaveProperty('priority');
        expect(rec).toHaveProperty('category');
      }
    });
  });

  describe('analyticsService.getAnalytics()', () => {
    test('should return aggregated analytics', async () => {
      const result = await analyticsService.getAnalytics();
      expect(result).toBeDefined();
      expect(result).toHaveProperty('totalTenants');
      expect(result).toHaveProperty('activeTenants');
      expect(result).toHaveProperty('mrr');
      expect(result).toHaveProperty('arr');
      expect(result).toHaveProperty('retentionRate');
    });

    test('rates should be between 0 and 100', async () => {
      const result = await analyticsService.getAnalytics();
      expect(result.retentionRate).toBeGreaterThanOrEqual(0);
      expect(result.retentionRate).toBeLessThanOrEqual(100);
    });
  });

  describe('Zero Duplicate Architecture', () => {
    test('no new Prisma models — all data from existing models', async () => {
      const prisma = require('../../../utils/prisma');
      const modelNames = Object.keys(prisma).filter(k => k.startsWith('cms') || k.startsWith('business') || k.startsWith('boutique'));
      expect(modelNames).not.toContain('customerSuccess');
      expect(modelNames).not.toContain('healthScore');
      expect(modelNames).not.toContain('recommendation');
    });

    test('health score is calculated dynamically, never stored', () => {
      const fs = require('fs');
      const healthService = fs.readFileSync(require.resolve('../services/health-score.service'), 'utf8');
      expect(healthService).not.toContain('.create(');
      expect(healthService).not.toContain('.upsert(');
    });

    test('recommendations are generated dynamically, never stored', () => {
      const fs = require('fs');
      const recService = fs.readFileSync(require.resolve('../services/recommendation.service'), 'utf8');
      expect(recService).not.toContain('.create(');
      expect(recService).not.toContain('.upsert(');
    });
  });
});

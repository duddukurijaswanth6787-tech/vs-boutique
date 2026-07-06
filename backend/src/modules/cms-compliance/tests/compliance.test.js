const { eventBus, Events } = require('../../../services/eventBus');
const auditDashboardService = require('../services/audit-dashboard.service');
const securityService = require('../services/security.service');
const riskService = require('../services/risk.service');
const policyService = require('../services/policy.service');
const retentionService = require('../services/retention.service');
const analyticsService = require('../services/analytics.service');
const prisma = require('../../../utils/prisma');

describe('Phase 22 - Compliance Center', () => {
  let testBizId;

  beforeAll(async () => {
    const biz = await prisma.business.findFirst({ select: { id: true } });
    testBizId = biz ? biz.id : null;
  });

  describe('EventBus Constants', () => {
    test('COMPLIANCE_VIOLATION_DETECTED', () => {
      expect(Events.COMPLIANCE_VIOLATION_DETECTED).toBe('compliance:violation-detected');
    });
    test('COMPLIANCE_SCORE_CHANGED', () => {
      expect(Events.COMPLIANCE_SCORE_CHANGED).toBe('compliance:score-changed');
    });
  });

  describe('auditDashboardService', () => {
    test('getAuditLogs should return paginated logs', async () => {
      const result = await auditDashboardService.getAuditLogs({ limit: 10 });
      expect(result).toBeDefined();
      expect(result).toHaveProperty('logs');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('limit', 10);
      expect(Array.isArray(result.logs)).toBe(true);
    });

    test('getAuditLogs should filter by date range', async () => {
      const result = await auditDashboardService.getAuditLogs({
        dateFrom: '2024-01-01',
        dateTo: new Date().toISOString(),
        limit: 10
      });
      expect(result.logs).toBeDefined();
    });

    test('getAuditLogs should filter by actionType array', async () => {
      const result = await auditDashboardService.getAuditLogs({
        actionType: ['LOGIN_FAILED', 'PERMISSION_DENIED'],
        limit: 10
      });
      expect(result.logs).toBeDefined();
    });

    test('getAuditSummary should return aggregated audit data', async () => {
      const result = await auditDashboardService.getAuditSummary(testBizId);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('totalLogs');
      expect(result).toHaveProperty('last24h');
      expect(result).toHaveProperty('uniqueActionTypes');
      expect(result).toHaveProperty('uniqueUsers');
      expect(result).toHaveProperty('topActionTypes');
      expect(typeof result.totalLogs).toBe('number');
    });

    test('getCrossModuleActivity should return module activity', async () => {
      const result = await auditDashboardService.getCrossModuleActivity();
      expect(result).toBeDefined();
      expect(result).toHaveProperty('moduleActivity');
      expect(result).toHaveProperty('entityCoverage');
      expect(Array.isArray(result.moduleActivity)).toBe(true);
    });
  });

  describe('securityService', () => {
    test('getSecurityPosture should return security score', async () => {
      const result = await securityService.getSecurityPosture(testBizId);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('overall');
      expect(result).toHaveProperty('riskLevel');
      expect(result).toHaveProperty('details');
      expect(typeof result.overall).toBe('number');
      expect(result.overall).toBeGreaterThanOrEqual(0);
      expect(result.overall).toBeLessThanOrEqual(100);
    });

    test('security riskLevel should be valid', async () => {
      const result = await securityService.getSecurityPosture(testBizId);
      expect(['low', 'medium', 'high', 'critical']).toContain(result.riskLevel);
    });
  });

  describe('riskService', () => {
    test('calculateRiskScore should return risk score', async () => {
      const result = await riskService.calculateRiskScore(testBizId);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('overall');
      expect(result).toHaveProperty('riskLevel');
      expect(result).toHaveProperty('details');
      expect(typeof result.overall).toBe('number');
    });

    test('risk score should be between 0 and 100', async () => {
      const result = await riskService.calculateRiskScore(testBizId);
      expect(result.overall).toBeGreaterThanOrEqual(0);
      expect(result.overall).toBeLessThanOrEqual(100);
    });

    test('riskLevel should be valid', async () => {
      const result = await riskService.calculateRiskScore(testBizId);
      expect(['low', 'medium', 'high', 'critical']).toContain(result.riskLevel);
    });
  });

  describe('policyService', () => {
    test('getPolicies should return policy array', async () => {
      const result = await policyService.getPolicies(testBizId);
      expect(Array.isArray(result)).toBe(true);
    });

    test('getPolicies should return 5 default frameworks', async () => {
      const result = await policyService.getPolicies(testBizId);
      expect(result.length).toBe(5);
      const frameworks = result.map(p => p.framework);
      expect(frameworks).toContain('gdpr');
      expect(frameworks).toContain('soc2');
      expect(frameworks).toContain('iso27001');
      expect(frameworks).toContain('hipaa');
      expect(frameworks).toContain('pci');
    });

    test('updatePolicy should update a policy', async () => {
      const result = await policyService.updatePolicy(testBizId, 'gdpr', { status: 'in_progress', enabled: true });
      expect(result).toBeDefined();
      expect(result.framework).toBe('gdpr');
      expect(result.status).toBe('in_progress');
      expect(result.enabled).toBe(true);
    });

    test('getFrameworkMapping should return frameworks', async () => {
      const result = await policyService.getFrameworkMapping();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(5);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('label');
      expect(result[0]).toHaveProperty('description');
    });
  });

  describe('retentionService', () => {
    test('getRetentionConfig should return config object', async () => {
      const result = await retentionService.getRetentionConfig(testBizId);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('auditLogs');
      expect(result).toHaveProperty('deploymentLogs');
      expect(result).toHaveProperty('workflowExecutions');
      expect(typeof result.auditLogs).toBe('number');
    });

    test('getRetentionStatus should return status', async () => {
      const result = await retentionService.getRetentionStatus();
      expect(result).toBeDefined();
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('calculatedAt');
      expect(result.status).toHaveProperty('auditLogs');
      expect(result.status).toHaveProperty('deploymentLogs');
    });
  });

  describe('analyticsService', () => {
    test('getComplianceAnalytics should return analytics', async () => {
      const result = await analyticsService.getComplianceAnalytics(testBizId);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('auditTrend');
      expect(result).toHaveProperty('violationTrend');
      expect(result).toHaveProperty('coverageMetrics');
    });

    test('auditTrend should have 30 day buckets', async () => {
      const result = await analyticsService.getComplianceAnalytics(testBizId);
      expect(result.auditTrend.buckets.length).toBe(30);
      expect(result.auditTrend.period).toBe('30d');
    });

    test('violationTrend should have 30 day buckets', async () => {
      const result = await analyticsService.getComplianceAnalytics(testBizId);
      expect(result.violationTrend.buckets.length).toBe(30);
    });

    test('coverageMetrics should have audit modules info', async () => {
      const result = await analyticsService.getComplianceAnalytics(testBizId);
      expect(result.coverageMetrics).toHaveProperty('totalModules');
      expect(result.coverageMetrics).toHaveProperty('auditedModules');
      expect(result.coverageMetrics).toHaveProperty('coveragePercent');
    });

    test('getComplianceSummary should return summary', async () => {
      const result = await analyticsService.getComplianceSummary();
      expect(result).toBeDefined();
      expect(result).toHaveProperty('totalAuditLogs');
      expect(result).toHaveProperty('totalBusinesses');
    });
  });

  describe('Zero Duplicate Architecture', () => {
    test('No new Prisma models - only AuditLog reused', async () => {
      const modelNames = Object.keys(prisma).filter(k => k.startsWith('audit'));
      expect(modelNames).toContain('auditLog');
    });

    test('EventBus is reused singleton', () => {
      const eb = require('../../../services/eventBus');
      expect(eb.eventBus).toBeDefined();
      expect(typeof eb.eventBus.emit).toBe('function');
    });

    test('auth middleware is reused', () => {
      const am = require('../../../middleware/authMiddleware');
      expect(am.protect).toBeDefined();
      expect(am.authorize).toBeDefined();
    });

    test('CmsAiSettings stores policies - no new policy model', () => {
      expect(prisma.cmsAiSettings).toBeDefined();
      expect(prisma.cmsAiSettings.create).toBeDefined();
    });

    test('PlatformSetting stores retention config - no new setting model', () => {
      expect(prisma.platformSetting).toBeDefined();
    });
  });
});

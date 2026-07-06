const auditDashboardService = require('./audit-dashboard.service');
const securityService = require('./security.service');
const riskService = require('./risk.service');
const policyService = require('./policy.service');
const retentionService = require('./retention.service');
const analyticsService = require('./analytics.service');

async function getOverview(businessId) {
  const [auditSummary, security, risk, policies, retention, analytics] = await Promise.all([
    auditDashboardService.getAuditSummary(businessId).catch(() => null),
    securityService.getSecurityPosture(businessId).catch(() => null),
    riskService.calculateRiskScore(businessId).catch(() => null),
    policyService.getPolicies(businessId).catch(() => []),
    retentionService.getRetentionConfig(businessId).catch(() => null),
    analyticsService.getComplianceAnalytics(businessId).catch(() => null)
  ]);

  return {
    businessId,
    auditSummary,
    security,
    risk,
    policies: { total: policies.length, frameworks: [...new Set(policies.map(p => p.framework))] },
    retention,
    analytics,
    calculatedAt: new Date().toISOString()
  };
}

async function initializeDefaults() {
  return { status: 'ok', timestamp: new Date().toISOString() };
}

module.exports = {
  getOverview,
  initializeDefaults,
  audit: auditDashboardService,
  security: securityService,
  risk: riskService,
  policy: policyService,
  retention: retentionService,
  analytics: analyticsService
};

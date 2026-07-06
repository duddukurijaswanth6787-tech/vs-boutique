const prisma = require('../../../utils/prisma');

async function getComplianceAnalytics(businessId) {
  const now = new Date();
  const [auditTrend, violationTrend, coverageMetrics] = await Promise.all([
    _getAuditTrend(),
    _getViolationTrend(),
    _getCoverageMetrics()
  ]);

  return {
    businessId,
    auditTrend,
    violationTrend,
    coverageMetrics,
    calculatedAt: now.toISOString()
  };
}

async function _getAuditTrend() {
  const days = 30;
  const buckets = [];

  for (let i = days - 1; i >= 0; i--) {
    const start = new Date(Date.now() - (i + 1) * 864e5);
    const end = new Date(Date.now() - i * 864e5);
    try {
      const count = await prisma.auditLog.count({
        where: { timestamp: { gte: start, lt: end } }
      });
      buckets.push({ date: start.toISOString().split('T')[0], count });
    } catch {
      buckets.push({ date: start.toISOString().split('T')[0], count: -1 });
    }
  }

  return { period: '30d', buckets };
}

async function _getViolationTrend() {
  const days = 30;
  const buckets = [];

  for (let i = days - 1; i >= 0; i--) {
    const start = new Date(Date.now() - (i + 1) * 864e5);
    const end = new Date(Date.now() - i * 864e5);
    try {
      const count = await prisma.auditLog.count({
        where: {
          actionType: { in: ['PERMISSION_DENIED', 'RATE_LIMIT_EXCEEDED', 'LOGIN_FAILED', 'UNAUTHORIZED_ACCESS'] },
          timestamp: { gte: start, lt: end }
        }
      });
      buckets.push({ date: start.toISOString().split('T')[0], count });
    } catch {
      buckets.push({ date: start.toISOString().split('T')[0], count: -1 });
    }
  }

  return { period: '30d', buckets };
}

async function _getCoverageMetrics() {
  const totalModules = 12;
  let auditedModules = 0;

  try {
    const entityTypes = await prisma.auditLog.groupBy({ by: ['entityType'] });
    auditedModules = entityTypes.length;
  } catch (e) { console.error('[ComplianceAnalyticsService] groupBy error:', e); }

  return {
    totalModules,
    auditedModules,
    coveragePercent: totalModules > 0 ? Math.round((auditedModules / totalModules) * 100) : 0,
    missingModules: Math.max(0, totalModules - auditedModules)
  };
}

async function getComplianceSummary() {
  try {
    const [totalLogs, businesses, policies] = await Promise.all([
      prisma.auditLog.count(),
      prisma.business.count(),
      prisma.cmsAiSettings.count({
        where: { key: { startsWith: 'compliance:policies:' } }
      })
    ]);

    return {
      totalAuditLogs: totalLogs,
      totalBusinesses: businesses,
      businessesWithPolicies: policies,
      policyCoveragePercent: businesses > 0 ? Math.round((policies / businesses) * 100) : 0
    };
  } catch { return null; }
}

module.exports = { getComplianceAnalytics, getComplianceSummary };

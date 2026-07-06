const prisma = require('../../../utils/prisma');

async function getCustomerAnalytics(businessId) {
  const [businessCounts, lifecycleData, boutiqueCount, ticketAnalytics, notificationStats, reportStats] = await Promise.all([
    _getBusinessCounts(),
    _getLifecycleDistribution(),
    prisma.boutique.count().catch(() => 0),
    _getTicketAnalytics(),
    _getNotificationAnalytics(),
    _getReportAnalytics()
  ]);

  return {
    businesses: businessCounts,
    boutiques: boutiqueCount,
    lifecycles: lifecycleData,
    tickets: ticketAnalytics,
    notifications: notificationStats,
    reports: reportStats,
    timestamp: new Date().toISOString()
  };
}

async function getBusinessAnalytics() {
  const [total, byStatus, byTenant, recent] = await Promise.all([
    prisma.business.count(),
    prisma.business.groupBy({ by: ['status'], _count: true }),
    prisma.business.groupBy({ by: ['tenantId'], _count: true, _max: { createdAt: true } }),
    prisma.business.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, name: true, status: true, createdAt: true } })
  ]);

  return {
    total,
    byStatus: Object.fromEntries(byStatus.map(s => [s.status, s._count])),
    byTenant: byTenant.length,
    recentBusinesses: recent,
    timestamp: new Date().toISOString()
  };
}

async function getMarketplaceAnalytics() {
  try {
    const marketplace = require('../../cms-marketplace/services/marketplace.service');
    const analytics = await marketplace.getCategory('analytics');
    return analytics;
  } catch {
    const [totalInstallations, totalPackages, totalPublishers] = await Promise.all([
      prisma.marketplaceInstallation.count(),
      prisma.marketplacePackage.count().catch(() => 0),
      prisma.marketplacePublisher.count().catch(() => 0)
    ]);
    return { totalInstallations, totalPackages, totalPublishers };
  }
}

async function getComplianceAnalytics(businessId) {
  try {
    const compliance = require('../../cms-compliance/services/analytics.service');
    const analytics = await compliance.getComplianceAnalytics(businessId);
    return analytics;
  } catch {
    return { auditTrend: { buckets: [] } };
  }
}

async function _getBusinessCounts() {
  const [total, active, inactive, trial] = await Promise.all([
    prisma.business.count(),
    prisma.business.count({ where: { status: 'ACTIVE' } }),
    prisma.business.count({ where: { status: { not: 'ACTIVE' } } }),
    prisma.business.count({ where: { boutique: { subscriptions: { some: { status: 'TRIAL' } } } } }).catch(() => 0)
  ]);
  return { total, active, inactive, trial };
}

async function _getLifecycleDistribution() {
  try {
    const lifecycle = require('../../cms-customer-success/services/lifecycle.service');
    const all = await lifecycle.getAllLifecycles();
    const distribution = {};
    for (const l of all || []) {
      const stage = l.stage || 'unknown';
      distribution[stage] = (distribution[stage] || 0) + 1;
    }
    return { stages: distribution, total: all?.length || 0 };
  } catch {
    const businesses = await prisma.business.findMany({ select: { status: true, createdAt: true } });
    const stages = {};
    for (const b of businesses) {
      const stage = b.status === 'ACTIVE' ? 'active' : b.status === 'TRIAL' ? 'trial' : 'churned';
      stages[stage] = (stages[stage] || 0) + 1;
    }
    return { stages, total: businesses.length };
  }
}

async function _getTicketAnalytics() {
  const [total, open, resolved, byPriority] = await Promise.all([
    prisma.supportTicket.count(),
    prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    prisma.supportTicket.count({ where: { status: 'RESOLVED' } }),
    prisma.supportTicket.groupBy({ by: ['priority'], _count: true }).catch(() => [])
  ]);
  return { total, open, resolved, byPriority: Object.fromEntries(byPriority.map(p => [p.priority, p._count])) };
}

async function _getNotificationAnalytics() {
  const [total, sent, read] = await Promise.all([
    prisma.notification.count(),
    prisma.notification.count({ where: { status: 'sent' } }),
    prisma.notification.count({ where: { isRead: true } })
  ]);
  return { total, sent, read, readRate: total > 0 ? Math.round((read / total) * 100) : 0 };
}

async function _getReportAnalytics() {
  const [total, avgScore, passCount] = await Promise.all([
    prisma.cmsValidationReport.count(),
    prisma.cmsValidationReport.aggregate({ _avg: { overallScore: true } }).catch(() => ({ _avg: { overallScore: null } })),
    prisma.cmsValidationReport.count({ where: { overallScore: { gte: 80 } } })
  ]);
  return { total, avgScore: Math.round((avgScore._avg?.overallScore || 0) * 100) / 100, passCount };
}

module.exports = { getCustomerAnalytics, getBusinessAnalytics, getMarketplaceAnalytics, getComplianceAnalytics };

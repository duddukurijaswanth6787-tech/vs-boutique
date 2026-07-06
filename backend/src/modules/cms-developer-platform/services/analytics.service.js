const prisma = require('../../../utils/prisma');

async function getAnalytics(businessId) {
  const [apiKeys, auditLogs, activeKeys] = await Promise.all([
    prisma.developerApiKey.findMany({
      where: { businessId },
      select: { id: true, status: true, environment: true, usageCount: true, createdAt: true }
    }),
    prisma.auditLog.findMany({
      where: { entityId: businessId },
      select: { actionType: true, timestamp: true },
      orderBy: { timestamp: 'desc' },
      take: 1000
    }),
    prisma.developerApiKey.count({ where: { businessId, status: 'ACTIVE' } })
  ]);

  const totalKeys = apiKeys.length;
  const revokedKeys = apiKeys.filter(k => k.status === 'REVOKED').length;
  const totalUsage = apiKeys.reduce((sum, k) => sum + (k.usageCount || 0), 0);
  const envBreakdown = {};
  apiKeys.forEach(k => {
    envBreakdown[k.environment] = (envBreakdown[k.environment] || 0) + 1;
  });

  const last7Days = auditLogs.filter(a =>
    new Date(a.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;
  const last30Days = auditLogs.filter(a =>
    new Date(a.timestamp) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ).length;

  return {
    businessId,
    totalKeys,
    activeKeys,
    revokedKeys,
    totalUsage,
    environmentBreakdown: envBreakdown,
    apiCalls: { last7Days, last30Days },
    keysByEnvironment: { ...envBreakdown },
    timestamp: new Date().toISOString()
  };
}

async function getGlobalAnalytics() {
  const [totalKeys, activeKeys, totalUsageAgg] = await Promise.all([
    prisma.developerApiKey.count(),
    prisma.developerApiKey.count({ where: { status: 'ACTIVE' } }),
    prisma.developerApiKey.aggregate({ _sum: { usageCount: true } })
  ]);

  return {
    totalKeys,
    activeKeys,
    revokedKeys: totalKeys - activeKeys,
    totalUsage: totalUsageAgg._sum.usageCount || 0,
    timestamp: new Date().toISOString()
  };
}

module.exports = { getAnalytics, getGlobalAnalytics };

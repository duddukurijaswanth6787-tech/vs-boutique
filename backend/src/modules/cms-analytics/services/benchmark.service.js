const prisma = require('../../../utils/prisma');

async function getBenchmarks() {
  const [totalBusinesses, totalDeployments, totalAIUsage, totalReports, totalCommerce] = await Promise.all([
    prisma.business.count(),
    prisma.deployment.count({ where: { isDeleted: false } }),
    prisma.cmsAiUsage.aggregate({ _sum: { totalTokens: true, cost: true } }).catch(() => ({ _sum: { totalTokens: 0, cost: 0 } })),
    prisma.cmsValidationReport.aggregate({ _avg: { overallScore: true } }).catch(() => ({ _avg: { overallScore: null } })),
    prisma.commerceOrder.aggregate({ _sum: { totalAmount: true }, _count: true }).catch(() => ({ _sum: { totalAmount: 0 }, _count: 0 }))
  ]);

  const avgRevenuePerBusiness = totalBusinesses > 0
    ? Math.round(Number(totalCommerce._sum.totalAmount || 0) / totalBusinesses) : 0;

  return {
    platform: {
      totalBusinesses,
      totalDeployments,
      totalAIUsage: { tokens: totalAIUsage._sum.totalTokens || 0, cost: Number(totalAIUsage._sum.cost || 0) },
      avgReportScore: Math.round((totalReports._avg?.overallScore || 0) * 100) / 100,
      totalCommerceRevenue: Number(totalCommerce._sum.totalAmount || 0),
      totalCommerceOrders: totalCommerce._count,
      avgRevenuePerBusiness
    },
    computedAt: new Date().toISOString()
  };
}

async function getBusinessBenchmark(businessId) {
  const platform = await getBenchmarks();
  const bizDeployments = await prisma.deployment.count({ where: { businessId, isDeleted: false } });
  const bizAIUsage = await prisma.cmsAiUsage.aggregate({ where: { }, _sum: { totalTokens: true, cost: true } }).catch(() => ({ _sum: { totalTokens: 0, cost: 0 } }));
  const bizCommerce = await prisma.commerceOrder.aggregate({ where: { }, _sum: { totalAmount: true }, _count: true }).catch(() => ({ _sum: { totalAmount: 0 }, _count: 0 }));

  const avgDeployments = platform.platform.totalBusinesses > 0
    ? Math.round(platform.platform.totalDeployments / platform.platform.totalBusinesses) : 0;

  return {
    business: {
      deployments: bizDeployments,
      aiTokens: bizAIUsage._sum.totalTokens || 0,
      aiCost: Number(bizAIUsage._sum.cost || 0),
      commerceRevenue: Number(bizCommerce._sum.totalAmount || 0),
      commerceOrders: bizCommerce._count
    },
    platform: platform.platform,
    comparison: {
      deploymentVsAvg: avgDeployments > 0 ? Math.round((bizDeployments / avgDeployments) * 100) : 0,
      revenueVsAvg: platform.platform.avgRevenuePerBusiness > 0
        ? Math.round((Number(bizCommerce._sum.totalAmount || 0) / platform.platform.avgRevenuePerBusiness) * 100) : 0
    },
    computedAt: platform.computedAt
  };
}

async function getPerformanceMetrics() {
  const thirtyDaysAgo = new Date(Date.now() - 86400000 * 30);

  const [deployments, usage, commerce] = await Promise.all([
    prisma.deployment.aggregate({
      where: { createdAt: { gte: thirtyDaysAgo }, isDeleted: false },
      _avg: { duration: true },
      _count: true,
      _max: { createdAt: true }
    }).catch(() => ({ _avg: { duration: null }, _count: 0, _max: { createdAt: null } })),
    prisma.cmsAiUsage.aggregate({
      where: { date: { gte: thirtyDaysAgo } },
      _avg: { completionTokens: true, promptTokens: true },
      _count: true
    }).catch(() => ({ _avg: { completionTokens: null, promptTokens: null }, _count: 0 })),
    prisma.commerceOrder.aggregate({
      where: { createdAt: { gte: thirtyDaysAgo } },
      _avg: { totalAmount: true },
      _count: true
    }).catch(() => ({ _avg: { totalAmount: null }, _count: 0 }))
  ]);

  return {
    deployments: {
      total30d: deployments._count,
      avgDurationSec: Math.round(deployments._avg?.duration || 0),
      lastDeployment: deployments._max?.createdAt
    },
    ai: {
      totalRequests30d: usage._count,
      avgCompletionTokens: Math.round(usage._avg?.completionTokens || 0),
      avgPromptTokens: Math.round(usage._avg?.promptTokens || 0)
    },
    commerce: {
      totalOrders30d: commerce._count,
      avgOrderValue: Number(commerce._avg?.totalAmount || 0)
    }
  };
}

module.exports = { getBenchmarks, getBusinessBenchmark, getPerformanceMetrics };

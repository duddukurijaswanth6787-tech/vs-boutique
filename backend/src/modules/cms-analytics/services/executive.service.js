const prisma = require('../../../utils/prisma');

async function getExecutiveDashboard(businessId) {
  const [totalBusinesses, activeBusinesses, totalTenants, monthlyRevenue, annualRevenue, growthRate] = await Promise.all([
    prisma.business.count(),
    prisma.business.count({ where: { status: 'ACTIVE' } }),
    prisma.tenant.count(),
    _calculateMonthlyRevenue(),
    _calculateAnnualRevenue(),
    _calculateGrowthRate()
  ]);

  const trialBusinesses = await prisma.business.count({
    where: { boutique: { subscriptions: { some: { status: 'TRIAL' } } } }
  }).catch(() => 0);

  const conversionRate = totalBusinesses > 0
    ? Math.round(((totalBusinesses - trialBusinesses) / totalBusinesses) * 100) : 0;

  const mrr = await _getMRR();
  const arr = mrr * 12;

  const churnedBusinesses = await prisma.business.count({
    where: { status: { not: 'ACTIVE' } }
  }).catch(() => 0);

  return {
    totalBusinesses,
    activeBusinesses,
    inactiveBusinesses: totalBusinesses - activeBusinesses,
    trialBusinesses,
    churnedBusinesses,
    totalTenants,
    revenue: { monthly: monthlyRevenue, annual: annualRevenue },
    mrr,
    arr,
    growthRate,
    conversionRate,
    retentionRate: totalBusinesses > 0 ? Math.round(((totalBusinesses - churnedBusinesses) / totalBusinesses) * 100) : 0,
    timestamp: new Date().toISOString()
  };
}

async function getKpiScorecard(businessId) {
  const [exec, deployments, aiUsage, avgScore] = await Promise.all([
    getExecutiveDashboard(businessId),
    prisma.deployment.aggregate({ where: { isDeleted: false }, _count: true }).catch(() => ({ _count: 0 })),
    prisma.cmsAiUsage.aggregate({ _sum: { cost: true, totalTokens: true } }).catch(() => ({ _sum: { cost: 0, totalTokens: 0 } })),
    prisma.cmsValidationReport.aggregate({ _avg: { overallScore: true } }).catch(() => ({ _avg: { overallScore: 0 } }))
  ]);

  return {
    totalRevenue: exec.revenue.monthly,
    mrr: exec.mrr,
    arr: exec.arr,
    activeBusinesses: exec.activeBusinesses,
    totalDeployments: deployments._count,
    aiCost: aiUsage._sum.cost || 0,
    aiTokens: aiUsage._sum.totalTokens || 0,
    avgReportScore: Math.round((avgScore._avg.overallScore || 0) * 100) / 100,
    growthRate: exec.growthRate,
    retentionRate: exec.retentionRate,
    conversionRate: exec.conversionRate
  };
}

async function _calculateMonthlyRevenue() {
  const [subscriptionRevenue, commerceRevenue, paymentRevenue] = await Promise.all([
    prisma.subscriptionBillingHistory.aggregate({
      where: { createdAt: { gte: new Date(new Date().setDate(1)) }, paymentStatus: 'PAID' },
      _sum: { amount: true }
    }).catch(() => ({ _sum: { amount: null } })),
    prisma.commerceOrder.aggregate({
      where: { createdAt: { gte: new Date(new Date().setDate(1)) }, paymentStatus: 'COMPLETED' },
      _sum: { totalAmount: true }
    }).catch(() => ({ _sum: { totalAmount: null } })),
    prisma.payment.aggregate({
      where: { createdAt: { gte: new Date(new Date().setDate(1)) }, status: 'captured' },
      _sum: { amount: true }
    }).catch(() => ({ _sum: { amount: null } }))
  ]);

  return Number(subscriptionRevenue._sum?.amount || 0) +
         Number(commerceRevenue._sum?.totalAmount || 0) +
         Number(paymentRevenue._sum?.amount || 0);
}

async function _calculateAnnualRevenue() {
  const monthly = await _calculateMonthlyRevenue();
  return monthly * 12;
}

async function _calculateGrowthRate() {
  const thisMonth = new Date(new Date().setDate(1));
  const lastMonth = new Date(thisMonth);
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  const [currentBusinesses, previousBusinesses] = await Promise.all([
    prisma.business.count({ where: { createdAt: { gte: thisMonth } } }),
    prisma.business.count({ where: { createdAt: { gte: lastMonth, lt: thisMonth } } })
  ]);

  if (previousBusinesses === 0) return currentBusinesses > 0 ? 100 : 0;
  return Math.round(((currentBusinesses - previousBusinesses) / previousBusinesses) * 100);
}

async function _getMRR() {
  try {
    const subscriptions = require('../../cms-subscriptions/services/subscriptions.service');
    const analytics = await subscriptions.getCategory('analytics');
    return analytics?.mrr || 0;
  } catch {
    const result = await prisma.$queryRaw`
      SELECT COALESCE(SUM(sp.monthly_price), 0) as mrr
      FROM boutique_subscriptions bs
      JOIN subscription_plans sp ON bs.plan_id = sp.id
      WHERE bs.status = 'ACTIVE'
    `.catch(() => [{ mrr: 0 }]);
    return Number(result[0]?.mrr || 0);
  }
}

module.exports = { getExecutiveDashboard, getKpiScorecard };

const prisma = require('../../../utils/prisma');

async function getFinancialAnalytics() {
  const [subscriptionRevenue, commerceRevenue, paymentRevenue, costs] = await Promise.all([
    _getSubscriptionRevenue(),
    _getCommerceRevenue(),
    _getPaymentRevenue(),
    _getCosts()
  ]);

  const totalRevenue = subscriptionRevenue + commerceRevenue + paymentRevenue;
  const netRevenue = totalRevenue - costs.total;

  return {
    revenue: {
      total: totalRevenue,
      subscription: subscriptionRevenue,
      commerce: commerceRevenue,
      payments: paymentRevenue,
      net: netRevenue
    },
    costs,
    profitability: totalRevenue > 0 ? Math.round((netRevenue / totalRevenue) * 100) : 0,
    timestamp: new Date().toISOString()
  };
}

async function getRevenueBreakdown() {
  const thirtyDaysAgo = new Date(Date.now() - 86400000 * 30);

  const [subscriptions, commerce, payments] = await Promise.all([
    prisma.subscriptionBillingHistory.findMany({
      where: { createdAt: { gte: thirtyDaysAgo }, paymentStatus: 'PAID' },
      select: { amount: true, createdAt: true, paymentMethod: true }
    }),
    prisma.commerceOrder.findMany({
      where: { createdAt: { gte: thirtyDaysAgo }, paymentStatus: 'PAID' },
      select: { totalAmount: true, createdAt: true, paymentMethod: true }
    }),
    prisma.payment.findMany({
      where: { createdAt: { gte: thirtyDaysAgo }, status: 'captured' },
      select: { amount: true, createdAt: true, method: true }
    })
  ]);

  return {
    subscriptions: subscriptions.map(s => ({ amount: Number(s.amount), date: s.createdAt, method: s.paymentMethod })),
    commerce: commerce.map(c => ({ amount: Number(c.totalAmount), date: c.createdAt, method: c.paymentMethod })),
    payments: payments.map(p => ({ amount: Number(p.amount), date: p.createdAt, method: p.method })),
    revenueByDay: _aggregateByDay([...subscriptions, ...commerce, ...payments])
  };
}

async function getSubscriptionAnalytics() {
  try {
    const subscriptions = require('../../cms-subscriptions/services/subscriptions.service');
    const analytics = await subscriptions.getCategory('analytics');
    return analytics;
  } catch {
    const [plans, subscriptionsList, billing] = await Promise.all([
      prisma.subscriptionPlan.findMany({ select: { id: true, name: true, monthlyPrice: true, yearlyPrice: true, isActive: true } }),
      prisma.boutiqueSubscription.groupBy({ by: ['status'], _count: true }),
      prisma.subscriptionBillingHistory.aggregate({ _sum: { amount: true }, _count: true })
    ]);

    const byStatus = {};
    for (const s of subscriptionsList) byStatus[s.status] = s._count;

    return {
      totalPlans: plans.length,
      activePlans: plans.filter(p => p.isActive).length,
      totalSubs: subscriptionsList.reduce((s, x) => s + x._count, 0),
      activeSubs: byStatus['ACTIVE'] || 0,
      trialSubs: byStatus['TRIAL'] || 0,
      expiredSubs: byStatus['EXPIRED'] || 0,
      totalBilled: Number(billing._sum?.amount || 0),
      plans
    };
  }
}

async function _getSubscriptionRevenue() {
  const r = await prisma.subscriptionBillingHistory.aggregate({
    where: { createdAt: { gte: new Date(new Date().setDate(1)) }, paymentStatus: 'PAID' },
    _sum: { amount: true }
  }).catch(() => ({ _sum: { amount: null } }));
  return Number(r._sum?.amount || 0);
}

async function _getCommerceRevenue() {
  const r = await prisma.commerceOrder.aggregate({
    where: { createdAt: { gte: new Date(new Date().setDate(1)) }, paymentStatus: 'COMPLETED' },
    _sum: { totalAmount: true }
  }).catch(() => ({ _sum: { totalAmount: null } }));
  return Number(r._sum?.totalAmount || 0);
}

async function _getPaymentRevenue() {
  const r = await prisma.payment.aggregate({
    where: { createdAt: { gte: new Date(new Date().setDate(1)) }, status: 'captured' },
    _sum: { amount: true }
  }).catch(() => ({ _sum: { amount: null } }));
  return Number(r._sum?.amount || 0);
}

async function _getCosts() {
  const [aiCost, aiUsageCost] = await Promise.all([
    prisma.cmsAiCost.aggregate({
      where: { createdAt: { gte: new Date(new Date().setDate(1)) } },
      _sum: { cost: true }
    }).catch(() => ({ _sum: { cost: null } })),
    prisma.cmsAiUsage.aggregate({
      where: { date: { gte: new Date(new Date().setDate(1)) } },
      _sum: { cost: true }
    }).catch(() => ({ _sum: { cost: null } }))
  ]);

  const total = Number(aiCost._sum?.cost || 0) + Number(aiUsageCost._sum?.cost || 0);
  return { total, aiCost: Number(aiCost._sum?.cost || 0), aiUsage: Number(aiUsageCost._sum?.cost || 0) };
}

function _aggregateByDay(records) {
  const byDay = {};
  for (const r of records) {
    const day = new Date(r.createdAt || r.date).toISOString().split('T')[0];
    byDay[day] = (byDay[day] || 0) + Number(r.amount || r.totalAmount || 0);
  }
  return Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0])).map(([date, revenue]) => ({ date, revenue }));
}

module.exports = { getFinancialAnalytics, getRevenueBreakdown, getSubscriptionAnalytics };

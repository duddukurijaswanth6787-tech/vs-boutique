const prisma = require('../../../utils/prisma');
const { eventBus, Events } = require('../../../services/eventBus');

async function getForecasts(businessId) {
  const [revenueForecast, growthForecast, deploymentForecast, usageForecast] = await Promise.all([
    _forecastRevenue(),
    _forecastGrowth(),
    _forecastDeployments(businessId),
    _forecastUsage()
  ]);

  const result = {
    revenue: revenueForecast,
    growth: growthForecast,
    deployments: deploymentForecast,
    usage: usageForecast,
    generatedAt: new Date().toISOString()
  };

  try { eventBus.emit(Events.FORECAST_UPDATED, { businessId, forecast: result }); } catch (e) { console.error('[ForecastService] forecast-updated emit error:', e); }

  return result;
}

async function _forecastRevenue() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [subscriptionTrend, commerceTrend, paymentTrend] = await Promise.all([
    _getMonthlyTrend('subscriptionBillingHistory', 'amount', sixMonthsAgo),
    _getMonthlyTrend('commerceOrder', 'totalAmount', sixMonthsAgo),
    _getMonthlyTrend('payment', 'amount', sixMonthsAgo)
  ]);

  const totalTrend = _combineTrends([subscriptionTrend, commerceTrend, paymentTrend]);
  const averageMonthly = totalTrend.length > 0
    ? Math.round(totalTrend.reduce((s, m) => s + m.total, 0) / totalTrend.length) : 0;

  const growthRate = totalTrend.length >= 2
    ? ((totalTrend[totalTrend.length - 1].total - totalTrend[0].total) / totalTrend[0].total) * 100 : 0;

  const nextMonth = averageMonthly;
  const nextQuarter = averageMonthly * 3;
  const nextYear = averageMonthly * 12;

  return {
    currentMonthly: averageMonthly,
    nextMonth,
    nextQuarter,
    nextYear,
    growthRate: Math.round(growthRate),
    trend: totalTrend,
    confidence: totalTrend.length >= 3 ? 'medium' : totalTrend.length >= 6 ? 'high' : 'low'
  };
}

async function _forecastGrowth() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const businesses = await prisma.business.findMany({
    where: { createdAt: { gte: sixMonthsAgo } },
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' }
  });

  const monthlyGrowth = {};
  for (const b of businesses) {
    const month = b.createdAt.toISOString().substring(0, 7);
    monthlyGrowth[month] = (monthlyGrowth[month] || 0) + 1;
  }

  const trend = Object.entries(monthlyGrowth).sort().map(([month, count]) => ({ month, count }));
  const averageMonthlyGrowth = trend.length > 0
    ? Math.round(trend.reduce((s, m) => s + m.count, 0) / trend.length) : 0;

  const growthRate = trend.length >= 2
    ? ((trend[trend.length - 1].count - trend[0].count) / Math.max(trend[0].count, 1)) * 100 : 0;

  return {
    currentMonthlyGrowth: averageMonthlyGrowth,
    nextMonth: averageMonthlyGrowth,
    nextQuarter: averageMonthlyGrowth * 3,
    growthRate: Math.round(growthRate),
    trend,
    confidence: trend.length >= 3 ? 'medium' : trend.length >= 6 ? 'high' : 'low'
  };
}

async function _forecastDeployments(businessId) {
  const thirtyDaysAgo = new Date(Date.now() - 86400000 * 30);

  const recentDeployments = await prisma.deployment.findMany({
    where: { businessId, createdAt: { gte: thirtyDaysAgo }, isDeleted: false },
    select: { createdAt: true }
  });

  const dailyDeployments = {};
  for (const d of recentDeployments) {
    const day = d.createdAt.toISOString().split('T')[0];
    dailyDeployments[day] = (dailyDeployments[day] || 0) + 1;
  }

  const trend = Object.entries(dailyDeployments).sort().map(([date, count]) => ({ date, count }));
  const averageDaily = trend.length > 0
    ? Math.round(trend.reduce((s, d) => s + d.count, 0) / Math.max(trend.length, 1)) : 0;

  return {
    currentDailyRate: averageDaily,
    nextWeek: averageDaily * 7,
    nextMonth: averageDaily * 30,
    trend,
    confidence: trend.length >= 7 ? 'medium' : trend.length >= 21 ? 'high' : 'low'
  };
}

async function _forecastUsage() {
  const thirtyDaysAgo = new Date(Date.now() - 86400000 * 30);

  const recentUsage = await prisma.cmsAiUsage.findMany({
    where: { date: { gte: thirtyDaysAgo } },
    select: { totalTokens: true, cost: true, date: true }
  });

  const dailyUsage = {};
  for (const u of recentUsage) {
    const day = u.date.toISOString().split('T')[0];
    if (!dailyUsage[day]) dailyUsage[day] = { tokens: 0, cost: 0 };
    dailyUsage[day].tokens += u.totalTokens || 0;
    dailyUsage[day].cost += Number(u.cost || 0);
  }

  const trend = Object.entries(dailyUsage).sort().map(([date, data]) => ({ date, ...data }));
  const avgDailyTokens = trend.length > 0
    ? Math.round(trend.reduce((s, d) => s + d.tokens, 0) / trend.length) : 0;
  const avgDailyCost = trend.length > 0
    ? trend.reduce((s, d) => s + d.cost, 0) / trend.length : 0;

  return {
    currentDailyTokens: avgDailyTokens,
    currentDailyCost: Math.round(avgDailyCost * 100) / 100,
    nextMonth: { tokens: avgDailyTokens * 30, cost: Math.round(avgDailyCost * 30 * 100) / 100 },
    trend,
    confidence: trend.length >= 7 ? 'medium' : trend.length >= 21 ? 'high' : 'low'
  };
}

async function _getMonthlyTrend(model, field, since) {
  const modelMap = {
    subscriptionBillingHistory: prisma.subscriptionBillingHistory,
    commerceOrder: prisma.commerceOrder,
    payment: prisma.payment
  };
  const prismaModel = modelMap[model];
  if (!prismaModel) return [];

  const records = await prismaModel.findMany({
    where: { createdAt: { gte: since } },
    select: { [field]: true, createdAt: true }
  }).catch(() => []);

  const monthly = {};
  for (const r of records) {
    const month = r.createdAt.toISOString().substring(0, 7);
    monthly[month] = (monthly[month] || 0) + Number(r[field] || 0);
  }

  return Object.entries(monthly).sort().map(([month, total]) => ({ month, total: Math.round(total) }));
}

function _combineTrends(trends) {
  const combined = {};
  for (const trend of trends) {
    for (const entry of trend) {
      combined[entry.month] = (combined[entry.month] || 0) + (entry.total || 0);
    }
  }
  return Object.entries(combined).sort().map(([month, total]) => ({ month, total: Math.round(total) }));
}

module.exports = { getForecasts };

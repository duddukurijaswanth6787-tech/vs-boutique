const partnerService = require('./partner.service');
const cache = require('../middleware/partner-cache');

async function getPartnerAnalyticsOverview(businessId) {
  const cacheKey = `analytics-overview:${businessId}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const partners = await partnerService.getPartners(businessId);
  const totalPartners = partners.length;
  const byType = {};
  for (const p of partners) {
    byType[p.partnerType] = (byType[p.partnerType] || 0) + 1;
  }

  let totalAnalytics = {
    executive: { totalBusinesses: 0, mrr: 0, arr: 0 },
    financial: { revenue: { total: 0 } },
    operations: { deployments: { total: 0 }, storage: { totalMB: 0 } }
  };

  const sampled = partners.slice(0, 5);
  for (const p of sampled) {
    try {
      const pa = await partnerService.getPartnerAnalytics(p.id);
      if (pa?.executive) {
        totalAnalytics.executive.totalBusinesses += pa.executive.totalBusinesses || 0;
        totalAnalytics.executive.mrr += pa.executive.mrr || 0;
      }
      if (pa?.financial?.revenue) {
        totalAnalytics.financial.revenue.total += pa.financial.revenue.total || 0;
      }
      if (pa?.operations?.deployments) {
        totalAnalytics.operations.deployments.total += pa.operations.deployments.total || 0;
      }
    } catch (e) { console.error('[PartnerAnalytics] getPartnerAnalytics error:', e); }
  }

  const result = { totalPartners, byType, sampledAnalytics: totalAnalytics, timestamp: new Date().toISOString() };
  await cache.set(cacheKey, result, 300);
  return result;
}

async function getPartnerRevenueAnalytics(businessId) {
  try {
    const financialService = require('../../cms-analytics/services/financial.service');
    const analytics = await financialService.getFinancialAnalytics();
    return analytics;
  } catch {
    return { revenue: { total: 0, subscription: 0, commerce: 0 }, profitability: 0 };
  }
}

async function getPartnerGrowthAnalytics(businessId) {
  try {
    const executiveService = require('../../cms-analytics/services/executive.service');
    const dashboard = await executiveService.getExecutiveDashboard(businessId);
    return { growthRate: dashboard.growthRate, conversionRate: dashboard.conversionRate, mrr: dashboard.mrr };
  } catch {
    return { growthRate: 0, conversionRate: 0, mrr: 0 };
  }
}

module.exports = { getPartnerAnalyticsOverview, getPartnerRevenueAnalytics, getPartnerGrowthAnalytics };

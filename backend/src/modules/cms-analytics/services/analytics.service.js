const executiveService = require('./executive.service');
const financialService = require('./financial.service');
const operationsService = require('./operations.service');
const customerService = require('./customer.service');
const aiService = require('./ai.service');
const forecastService = require('./forecast.service');
const benchmarkService = require('./benchmark.service');

async function getOverview(businessId) {
  const [exec, financial, ops, customers, ai, forecast, benchmark, perf] = await Promise.all([
    executiveService.getExecutiveDashboard(businessId).catch(() => ({ totalBusinesses: 0, mrr: 0 })),
    financialService.getFinancialAnalytics().catch(() => ({ revenue: { total: 0 }, profitability: 0 })),
    operationsService.getOperationsAnalytics(businessId).catch(() => ({ deployments: { total: 0 }, storage: { totalMB: 0 } })),
    customerService.getCustomerAnalytics(businessId).catch(() => ({ businesses: { total: 0 } })),
    aiService.getAIMetrics().catch(() => ({ thisMonth: { tokens: 0, cost: 0 } })),
    forecastService.getForecasts(businessId).catch(() => ({ revenue: { nextMonth: 0 } })),
    benchmarkService.getBenchmarks().catch(() => ({ platform: { totalBusinesses: 0 } })),
    benchmarkService.getPerformanceMetrics().catch(() => ({ deployments: { total30d: 0 } }))
  ]);

  return {
    executive: {
      totalBusinesses: exec.totalBusinesses,
      activeBusinesses: exec.activeBusinesses,
      mrr: exec.mrr,
      arr: exec.arr,
      growthRate: exec.growthRate,
      revenue: exec.revenue
    },
    financial,
    operations: {
      deployments: ops.deployments,
      storage: ops.storage,
      queue: ops.queue
    },
    customers: {
      total: customers.businesses.total,
      active: customers.businesses.active
    },
    ai: {
      monthlyTokens: ai.thisMonth.tokens,
      monthlyCost: ai.thisMonth.cost
    },
    forecast: {
      nextMonthRevenue: forecast.revenue.nextMonth,
      nextMonthGrowth: forecast.growth.nextMonth
    },
    benchmarks: {
      totalBusinesses: benchmark.platform.totalBusinesses,
      avgDeployments: benchmark.platform.totalDeployments
    },
    performance: perf,
    timestamp: new Date().toISOString()
  };
}

async function getExecutive(businessId) {
  return executiveService.getExecutiveDashboard(businessId);
}

async function getFinancial(businessId) {
  return financialService.getFinancialAnalytics();
}

async function getOperations(businessId) {
  return operationsService.getOperationsAnalytics(businessId);
}

async function getCustomers(businessId) {
  return customerService.getCustomerAnalytics(businessId);
}

async function getAI(businessId) {
  return aiService.getAIAnalytics(businessId);
}

async function getForecast(businessId) {
  return forecastService.getForecasts(businessId);
}

async function getBenchmark(businessId) {
  return benchmarkService.getBenchmarks();
}

async function getKPIs(businessId) {
  return executiveService.getKpiScorecard(businessId);
}

async function getReports(businessId) {
  try {
    const reportsService = require('../../cms-reports/services/reports.service');
    const [stats, trends] = await Promise.all([
      reportsService.getStats(businessId).catch(() => null),
      reportsService.getTrends(businessId).catch(() => [])
    ]);
    return { stats, trends };
  } catch {
    return { stats: null, trends: [] };
  }
}

async function getHealth() {
  try {
    const monitoringHealth = require('../../cms-monitoring/services/health.service');
    const health = await monitoringHealth.getAggregateHealth();
    return { status: health.overall, ...health };
  } catch {
    return { status: 'unknown', overall: 'unknown' };
  }
}

async function refreshCache() {
  const cache = require('../middleware/analytics-cache');
  await cache.delPattern('*');
  try {
    const { eventBus, Events } = require('../../../services/eventBus');
    eventBus.emit(Events.ANALYTICS_REFRESHED, { timestamp: new Date().toISOString() });
  } catch (e) { console.error('[AnalyticsService] refreshCache emit error:', e); }
  return { cleared: true };
}

module.exports = {
  getOverview, getExecutive, getFinancial, getOperations, getCustomers, getAI,
  getForecast, getBenchmark, getKPIs, getReports, getHealth, refreshCache,
  executive: executiveService, financial: financialService,
  operations: operationsService, customer: customerService,
  ai: aiService, forecast: forecastService, benchmark: benchmarkService
};

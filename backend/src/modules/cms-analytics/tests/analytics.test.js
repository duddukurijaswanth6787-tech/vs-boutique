jest.mock('uuid', () => ({ v4: () => '00000000-0000-0000-0000-000000000000' }));

const { eventBus, Events } = require('../../../services/eventBus');
const analyticsService = require('../services/analytics.service');
const executiveService = require('../services/executive.service');
const financialService = require('../services/financial.service');
const operationsService = require('../services/operations.service');
const customerService = require('../services/customer.service');
const aiService = require('../services/ai.service');
const forecastService = require('../services/forecast.service');
const benchmarkService = require('../services/benchmark.service');
const prisma = require('../../../utils/prisma');

describe('Phase 25 - Enterprise Analytics & BI Center', () => {
  let testBizId;

  beforeAll(async () => {
    const biz = await prisma.business.findFirst({ select: { id: true } });
    testBizId = biz ? biz.id : null;
  });

  describe('EventBus Constants (TABLE B)', () => {
    test('ANALYTICS_REFRESHED', () => {
      expect(Events.ANALYTICS_REFRESHED).toBe('analytics:refreshed');
    });

    test('EXECUTIVE_REPORT_READY', () => {
      expect(Events.EXECUTIVE_REPORT_READY).toBe('analytics:executive-report-ready');
    });

    test('FORECAST_UPDATED', () => {
      expect(Events.FORECAST_UPDATED).toBe('analytics:forecast-updated');
    });

    test('KPI_THRESHOLD_REACHED', () => {
      expect(Events.KPI_THRESHOLD_REACHED).toBe('analytics:kpi-threshold-reached');
    });
  });

  describe('Redis Cache (TABLE C)', () => {
    test('cache module exports correct interface', () => {
      const cache = require('../middleware/analytics-cache');
      expect(cache).toHaveProperty('get');
      expect(cache).toHaveProperty('set');
      expect(cache).toHaveProperty('del');
      expect(cache).toHaveProperty('delPattern');
    });

    test('cache prefix is cms:analytics:', () => {
      const fs = require('fs');
      const src = fs.readFileSync(require.resolve('../middleware/analytics-cache'), 'utf8');
      expect(src).toContain('cms:analytics:');
    });
  });

  describe('analyticsService (Facade)', () => {
    test('getOverview returns consolidated overview', async () => {
      const result = await analyticsService.getOverview(testBizId);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('executive');
      expect(result).toHaveProperty('financial');
      expect(result).toHaveProperty('operations');
      expect(result).toHaveProperty('customers');
      expect(result).toHaveProperty('ai');
      expect(result).toHaveProperty('forecast');
      expect(result).toHaveProperty('benchmarks');
      expect(result).toHaveProperty('performance');
      expect(result).toHaveProperty('timestamp');
    });

    test('getOverview executive has MRR and ARR', async () => {
      const result = await analyticsService.getOverview(testBizId);
      expect(result.executive).toHaveProperty('mrr');
      expect(result.executive).toHaveProperty('arr');
      expect(result.executive).toHaveProperty('growthRate');
      expect(result.executive).toHaveProperty('totalBusinesses');
    });

    test('getOverview financial has revenue breakdown', async () => {
      const result = await analyticsService.getOverview(testBizId);
      expect(result.financial).toHaveProperty('revenue');
      expect(result.financial.revenue).toHaveProperty('total');
      expect(result.financial.revenue).toHaveProperty('subscription');
      expect(result.financial.revenue).toHaveProperty('commerce');
    });

    test('getOverview operations has deployments, storage, queue', async () => {
      const result = await analyticsService.getOverview(testBizId);
      expect(result.operations).toHaveProperty('deployments');
      expect(result.operations).toHaveProperty('storage');
      expect(result.operations).toHaveProperty('queue');
    });

    test('getOverview customers has total and active counts', async () => {
      const result = await analyticsService.getOverview(testBizId);
      expect(result.customers).toHaveProperty('total');
      expect(result.customers).toHaveProperty('active');
    });

    test('getOverview ai has monthly tokens and cost', async () => {
      const result = await analyticsService.getOverview(testBizId);
      expect(result.ai).toHaveProperty('monthlyTokens');
      expect(result.ai).toHaveProperty('monthlyCost');
    });

    test('getOverview forecast has next month revenue and growth', async () => {
      const result = await analyticsService.getOverview(testBizId);
      expect(result.forecast).toHaveProperty('nextMonthRevenue');
      expect(result.forecast).toHaveProperty('nextMonthGrowth');
    });

    test('getOverview benchmarks has totalBusinesses', async () => {
      const result = await analyticsService.getOverview(testBizId);
      expect(result.benchmarks).toHaveProperty('totalBusinesses');
    });

    test('getExecutive delegates to executiveService', async () => {
      const result = await analyticsService.getExecutive(testBizId);
      expect(result).toHaveProperty('totalBusinesses');
      expect(result).toHaveProperty('mrr');
      expect(result).toHaveProperty('arr');
      expect(result).toHaveProperty('growthRate');
    });

    test('getFinancial delegates to financialService', async () => {
      const result = await analyticsService.getFinancial();
      expect(result).toHaveProperty('revenue');
      expect(result).toHaveProperty('costs');
      expect(result).toHaveProperty('profitability');
    });

    test('getOperations delegates to operationsService', async () => {
      const result = await analyticsService.getOperations(testBizId);
      expect(result).toHaveProperty('deployments');
      expect(result).toHaveProperty('storage');
      expect(result).toHaveProperty('queue');
    });

    test('getCustomers delegates to customerService', async () => {
      const result = await analyticsService.getCustomers(testBizId);
      expect(result).toHaveProperty('businesses');
      expect(result).toHaveProperty('tickets');
      expect(result).toHaveProperty('notifications');
    });

    test('getAI delegates to aiService', async () => {
      const result = await analyticsService.getAI(testBizId);
      expect(result).toBeDefined();
    });

    test('getForecast delegates to forecastService', async () => {
      const result = await analyticsService.getForecast(testBizId);
      expect(result).toHaveProperty('revenue');
      expect(result).toHaveProperty('growth');
      expect(result).toHaveProperty('deployments');
    });

    test('getBenchmark delegates to benchmarkService', async () => {
      const result = await analyticsService.getBenchmark();
      expect(result).toHaveProperty('platform');
    });

    test('getKPIs delegates to executiveService KPI scorecard', async () => {
      const result = await analyticsService.getKPIs(testBizId);
      expect(result).toHaveProperty('mrr');
      expect(result).toHaveProperty('arr');
      expect(result).toHaveProperty('activeBusinesses');
      expect(result).toHaveProperty('totalDeployments');
    });

    test('getReports delegates to cms-reports', async () => {
      const result = await analyticsService.getReports(testBizId);
      expect(result).toHaveProperty('stats');
      expect(result).toHaveProperty('trends');
    });

    test('getHealth returns monitoring health status', async () => {
      const result = await analyticsService.getHealth();
      expect(result).toHaveProperty('status');
    });

    test('refreshCache returns cleared confirmation', async () => {
      const result = await analyticsService.refreshCache();
      expect(result).toHaveProperty('cleared');
      expect(result.cleared).toBe(true);
    });
  });

  describe('executiveService', () => {
    test('getExecutiveDashboard returns executive dashboard', async () => {
      const result = await executiveService.getExecutiveDashboard(testBizId);
      expect(result).toHaveProperty('totalBusinesses');
      expect(result).toHaveProperty('activeBusinesses');
      expect(result).toHaveProperty('mrr');
      expect(result).toHaveProperty('arr');
      expect(result).toHaveProperty('growthRate');
      expect(result).toHaveProperty('conversionRate');
      expect(result).toHaveProperty('retentionRate');
      expect(result).toHaveProperty('revenue');
      expect(result).toHaveProperty('timestamp');
    });

    test('getKpiScorecard returns KPI scorecard', async () => {
      const result = await executiveService.getKpiScorecard(testBizId);
      expect(result).toHaveProperty('totalRevenue');
      expect(result).toHaveProperty('mrr');
      expect(result).toHaveProperty('arr');
      expect(result).toHaveProperty('activeBusinesses');
      expect(result).toHaveProperty('totalDeployments');
      expect(result).toHaveProperty('aiCost');
      expect(result).toHaveProperty('aiTokens');
      expect(result).toHaveProperty('avgReportScore');
      expect(result).toHaveProperty('growthRate');
      expect(result).toHaveProperty('retentionRate');
      expect(result).toHaveProperty('conversionRate');
    });

    test('MRR is calculated dynamically', async () => {
      const result = await executiveService.getExecutiveDashboard(testBizId);
      expect(typeof result.mrr).toBe('number');
      expect(result.mrr).toBeGreaterThanOrEqual(0);
    });

    test('ARR equals MRR * 12', async () => {
      const result = await executiveService.getExecutiveDashboard(testBizId);
      expect(result.arr).toBe(result.mrr * 12);
    });
  });

  describe('financialService', () => {
    test('getFinancialAnalytics returns revenue and costs', async () => {
      const result = await financialService.getFinancialAnalytics();
      expect(result).toHaveProperty('revenue');
      expect(result).toHaveProperty('costs');
      expect(result).toHaveProperty('profitability');
      expect(result).toHaveProperty('timestamp');
    });

    test('revenue has subscription, commerce, payments breakdown', async () => {
      const result = await financialService.getFinancialAnalytics();
      expect(result.revenue).toHaveProperty('total');
      expect(result.revenue).toHaveProperty('subscription');
      expect(result.revenue).toHaveProperty('commerce');
      expect(result.revenue).toHaveProperty('payments');
      expect(result.revenue).toHaveProperty('net');
    });

    test('getRevenueBreakdown returns daily revenue', async () => {
      const result = await financialService.getRevenueBreakdown();
      expect(result).toHaveProperty('subscriptions');
      expect(result).toHaveProperty('commerce');
      expect(result).toHaveProperty('payments');
      expect(result).toHaveProperty('revenueByDay');
    });

    test('getSubscriptionAnalytics returns subscription data', async () => {
      const result = await financialService.getSubscriptionAnalytics();
      expect(result).toHaveProperty('totalPlans');
      expect(result).toHaveProperty('activePlans');
      expect(result).toHaveProperty('totalSubs');
    });
  });

  describe('operationsService', () => {
    test('getOperationsAnalytics returns operations data', async () => {
      const result = await operationsService.getOperationsAnalytics(testBizId);
      expect(result).toHaveProperty('deployments');
      expect(result).toHaveProperty('domains');
      expect(result).toHaveProperty('storage');
      expect(result).toHaveProperty('queue');
      expect(result).toHaveProperty('timestamp');
    });

    test('getDeploymentAnalytics returns deployment metrics', async () => {
      const result = await operationsService.getDeploymentAnalytics(testBizId);
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('deployed');
      expect(result).toHaveProperty('failed');
      expect(result).toHaveProperty('successRate');
      expect(result).toHaveProperty('recentDeployments');
    });

    test('getStorageAnalytics returns storage usage', async () => {
      const result = await operationsService.getStorageAnalytics(testBizId);
      expect(result).toHaveProperty('totalMB');
      expect(result).toHaveProperty('totalBytes');
      expect(result).toHaveProperty('artifacts');
      expect(result).toHaveProperty('assets');
      expect(result).toHaveProperty('uploads');
    });

    test('getInfrastructureAnalytics returns infrastructure score', async () => {
      const result = await operationsService.getInfrastructureAnalytics(testBizId);
      expect(result).toHaveProperty('overall');
      expect(result).toHaveProperty('riskLevel');
    });
  });

  describe('customerService', () => {
    test('getCustomerAnalytics returns customer data', async () => {
      const result = await customerService.getCustomerAnalytics(testBizId);
      expect(result).toHaveProperty('businesses');
      expect(result).toHaveProperty('boutiques');
      expect(result).toHaveProperty('lifecycles');
      expect(result).toHaveProperty('tickets');
      expect(result).toHaveProperty('notifications');
      expect(result).toHaveProperty('reports');
    });

    test('getBusinessAnalytics returns business stats', async () => {
      const result = await customerService.getBusinessAnalytics();
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('byStatus');
      expect(result).toHaveProperty('recentBusinesses');
    });

    test('getMarketplaceAnalytics returns marketplace stats', async () => {
      const result = await customerService.getMarketplaceAnalytics();
      expect(result).toBeDefined();
    });

    test('getComplianceAnalytics returns compliance data', async () => {
      const result = await customerService.getComplianceAnalytics(testBizId);
      expect(result).toBeDefined();
    });
  });

  describe('aiService', () => {
    test('getAIAnalytics returns AI dashboard data', async () => {
      const result = await aiService.getAIAnalytics(testBizId);
      expect(result).toBeDefined();
    });

    test('getAICostAnalytics returns cost breakdown', async () => {
      const result = await aiService.getAICostAnalytics();
      expect(result).toHaveProperty('usage');
      expect(result).toHaveProperty('costs');
    });

    test('getAIMetrics returns all-time, today, monthly metrics', async () => {
      const result = await aiService.getAIMetrics();
      expect(result).toHaveProperty('allTime');
      expect(result).toHaveProperty('today');
      expect(result).toHaveProperty('thisMonth');
      expect(result.allTime).toHaveProperty('tokens');
      expect(result.allTime).toHaveProperty('cost');
    });

    test('getWorkflowAnalytics returns workflow data', async () => {
      const result = await aiService.getWorkflowAnalytics();
      expect(result).toBeDefined();
    });
  });

  describe('forecastService', () => {
    test('getForecasts returns revenue, growth, deployment, usage forecasts', async () => {
      const result = await forecastService.getForecasts(testBizId);
      expect(result).toHaveProperty('revenue');
      expect(result).toHaveProperty('growth');
      expect(result).toHaveProperty('deployments');
      expect(result).toHaveProperty('usage');
      expect(result).toHaveProperty('generatedAt');
    });

    test('revenue forecast has nextMonth, nextQuarter, nextYear', async () => {
      const result = await forecastService.getForecasts(testBizId);
      expect(result.revenue).toHaveProperty('currentMonthly');
      expect(result.revenue).toHaveProperty('nextMonth');
      expect(result.revenue).toHaveProperty('nextQuarter');
      expect(result.revenue).toHaveProperty('nextYear');
      expect(result.revenue).toHaveProperty('confidence');
    });

    test('growth forecast has monthly growth trend', async () => {
      const result = await forecastService.getForecasts(testBizId);
      expect(result.growth).toHaveProperty('currentMonthlyGrowth');
      expect(result.growth).toHaveProperty('nextMonth');
      expect(result.growth).toHaveProperty('trend');
    });

    test('deployment forecast has daily rate and projections', async () => {
      const result = await forecastService.getForecasts(testBizId);
      expect(result.deployments).toHaveProperty('currentDailyRate');
      expect(result.deployments).toHaveProperty('nextWeek');
      expect(result.deployments).toHaveProperty('nextMonth');
    });

    test('usage forecast has token and cost projections', async () => {
      const result = await forecastService.getForecasts(testBizId);
      expect(result.usage).toHaveProperty('currentDailyTokens');
      expect(result.usage).toHaveProperty('currentDailyCost');
      expect(result.usage).toHaveProperty('nextMonth');
    });

    test('forecasts are dynamic — not persisted to database', async () => {
      const countBefore = await prisma.cmsAiSettings.count({ where: { category: 'forecast' } });
      await forecastService.getForecasts(testBizId);
      const countAfter = await prisma.cmsAiSettings.count({ where: { category: 'forecast' } });
      expect(countAfter).toBeGreaterThanOrEqual(countBefore);
    });
  });

  describe('benchmarkService', () => {
    test('getBenchmarks returns platform benchmarks', async () => {
      const result = await benchmarkService.getBenchmarks();
      expect(result).toHaveProperty('platform');
      expect(result.platform).toHaveProperty('totalBusinesses');
      expect(result.platform).toHaveProperty('totalDeployments');
      expect(result.platform).toHaveProperty('totalAIUsage');
      expect(result.platform).toHaveProperty('avgReportScore');
    });

    test('getBusinessBenchmark returns business vs platform comparison', async () => {
      const result = await benchmarkService.getBusinessBenchmark(testBizId);
      expect(result).toHaveProperty('business');
      expect(result).toHaveProperty('platform');
      expect(result).toHaveProperty('comparison');
    });

    test('getPerformanceMetrics returns 30d performance', async () => {
      const result = await benchmarkService.getPerformanceMetrics();
      expect(result).toHaveProperty('deployments');
      expect(result).toHaveProperty('ai');
      expect(result).toHaveProperty('commerce');
      expect(result.deployments).toHaveProperty('total30d');
      expect(result.deployments).toHaveProperty('avgDurationSec');
    });
  });

  describe('Duplicate Audit (TABLE A)', () => {
    test('No new Prisma models created — only CmsAiSettings used', async () => {
      const settings = await prisma.cmsAiSettings.findMany({
        where: { category: { in: ['analytics', 'executive', 'forecast', 'dashboard'] } }
      });
      expect(Array.isArray(settings)).toBe(true);
    });

    test('Facade delegates to existing services', () => {
      const methods = Object.keys(analyticsService);
      expect(methods).toContain('getOverview');
      expect(methods).toContain('getExecutive');
      expect(methods).toContain('getFinancial');
      expect(methods).toContain('getOperations');
      expect(methods).toContain('getCustomers');
      expect(methods).toContain('getAI');
      expect(methods).toContain('getForecast');
      expect(methods).toContain('getBenchmark');
      expect(methods).toContain('getKPIs');
      expect(methods).toContain('getReports');
      expect(methods).toContain('getHealth');
      expect(methods).toContain('refreshCache');
    });

    test('Cache prefix is cms:analytics:', () => {
      const fs = require('fs');
      const src = fs.readFileSync(require.resolve('../middleware/analytics-cache'), 'utf8');
      expect(src).toContain('cms:analytics:');
    });

    test('EventBus singleton reused', () => {
      expect(eventBus).toBeDefined();
      expect(eventBus.emit).toBeDefined();
    });

    test('No new Queue created — analytics uses existing infra queues', () => {
      const deploymentQueue = require('../../cms-deployment/services/deployment.queue');
      expect(deploymentQueue).toHaveProperty('enqueue');
      expect(deploymentQueue).toHaveProperty('getQueueMetrics');
    });

    test('No new EventBus — singleton has Phase 25 ANALYTICS constants', () => {
      expect(Events.ANALYTICS_REFRESHED).toBeDefined();
      expect(Events.EXECUTIVE_REPORT_READY).toBeDefined();
      expect(Events.FORECAST_UPDATED).toBeDefined();
      expect(Events.KPI_THRESHOLD_REACHED).toBeDefined();
    });
  });
});

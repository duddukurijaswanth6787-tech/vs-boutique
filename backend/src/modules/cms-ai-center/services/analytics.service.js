const prisma = require('../../../utils/prisma');
const cache = require('../middleware/ai-center-cache');

class AiAnalyticsService {
  async getDashboard() {
    const cached = await cache.get('ai:dashboard');
    if (cached) return cached;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalProviders, activeProviders, providers,
      totalAgents, runningAgents, agents,
      totalExecutions, todayExecutions, failedExecutions,
      executionAgg, aiCoreExecutions,
      usageAgg, todayUsage, monthUsage,
      costAgg, todayCost, monthCost,
      queueStatus, workflowStatus
    ] = await Promise.all([
      prisma.cmsAiProvider.count(),
      prisma.cmsAiProvider.count({ where: { isEnabled: true, healthStatus: 'healthy' } }),
      prisma.cmsAiProvider.findMany({ select: { id: true, name: true, healthStatus: true, isEnabled: true, lastHealthCheck: true } }),
      prisma.cmsAiAgent.count(),
      prisma.cmsAiAgent.count({ where: { isEnabled: true, healthStatus: 'healthy' } }),
      prisma.cmsAiAgent.findMany({ select: { id: true, name: true, healthStatus: true, isEnabled: true, category: true } }),
      prisma.aIExecution.count(),
      prisma.aIExecution.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.aIExecution.count({ where: { status: 'FAILED' } }),
      prisma.aIExecution.aggregate({ _avg: { latencyMs: true }, _count: { id: true } }),
      prisma.aIExecution.count(),
      prisma.cmsAiUsage.aggregate({ _sum: { totalTokens: true, cost: true } }),
      prisma.cmsAiUsage.aggregate({ _sum: { totalTokens: true, cost: true }, where: { date: { gte: todayStart } } }),
      prisma.cmsAiUsage.aggregate({ _sum: { totalTokens: true, cost: true }, where: { date: { gte: monthStart } } }),
      prisma.cmsAiCost.aggregate({ _sum: { cost: true } }),
      prisma.cmsAiCost.aggregate({ _sum: { cost: true }, where: { createdAt: { gte: todayStart } } }),
      prisma.cmsAiCost.aggregate({ _sum: { cost: true }, where: { createdAt: { gte: monthStart } } }),
      Promise.resolve(0),
      prisma.cmsAiWorkflow.count({ where: { status: 'active' } })
    ]);

    const result = {
      providers: {
        total: totalProviders,
        active: activeProviders,
        offline: totalProviders - activeProviders,
        list: providers
      },
      agents: {
        total: totalAgents,
        running: runningAgents,
        list: agents
      },
      executions: {
        total: totalExecutions,
        today: todayExecutions,
        failed: failedExecutions,
        avgResponseTime: Math.round(executionAgg._avg?.latencyMs || 0),
        aiCoreTotal: aiCoreExecutions
      },
      usage: {
        totalTokens: usageAgg._sum?.totalTokens || 0,
        todayTokens: todayUsage._sum?.totalTokens || 0,
        monthTokens: monthUsage._sum?.totalTokens || 0,
        totalCost: usageAgg._sum?.cost || 0
      },
      costs: {
        total: costAgg._sum?.cost || 0,
        today: todayCost._sum?.cost || 0,
        thisMonth: monthCost._sum?.cost || 0
      },
      queue: { length: queueStatus },
      workflows: { active: workflowStatus },
      aiAvailability: totalProviders > 0 ? Math.round((activeProviders / totalProviders) * 100) : 0,
      timestamp: new Date().toISOString()
    };

    await cache.set('ai:dashboard', result);
    return result;
  }

  async getUsage(filters = {}) {
    const { startDate, endDate, providerId, agentKey, groupBy = 'day', page = 1, limit = 50 } = filters;
    const cacheKey = `ai:usage:${startDate || ''}:${endDate || ''}:${providerId || ''}:${groupBy}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const where = {};
    if (startDate) where.date = { ...where.date, gte: new Date(startDate) };
    if (endDate) where.date = { ...where.date, lte: new Date(endDate) };
    if (providerId) where.providerId = providerId;
    if (agentKey) where.agentKey = agentKey;

    const [records, totals] = await Promise.all([
      prisma.cmsAiUsage.findMany({
        where,
        include: { provider: { select: { id: true, name: true, provider: true } } },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.cmsAiUsage.aggregate({ where, _sum: { promptTokens: true, completionTokens: true, totalTokens: true, cost: true } })
    ]);

    const result = {
      records,
      summary: {
        promptTokens: totals._sum?.promptTokens || 0,
        completionTokens: totals._sum?.completionTokens || 0,
        totalTokens: totals._sum?.totalTokens || 0,
        cost: totals._sum?.cost || 0
      },
      page, limit
    };

    await cache.set(cacheKey, result);
    return result;
  }

  async getCost(filters = {}) {
    const { startDate, endDate, providerId, category, page = 1, limit = 50 } = filters;
    const cacheKey = `ai:cost:${startDate || ''}:${endDate || ''}:${providerId || ''}:${category || ''}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const where = {};
    if (startDate) where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    if (providerId) where.providerId = providerId;
    if (category) where.category = category;

    const [records, totals] = await Promise.all([
      prisma.cmsAiCost.findMany({
        where,
        include: { provider: { select: { id: true, name: true, provider: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.cmsAiCost.aggregate({ where, _sum: { cost: true }, _count: { id: true } })
    ]);

    const result = {
      records,
      summary: { totalCost: totals._sum?.cost || 0, totalRecords: totals._count?.id || 0 },
      page, limit
    };

    await cache.set(cacheKey, result);
    return result;
  }

  async getUsageSummary() {
    const cacheKey = 'ai:usage:summary';
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [allTime, today, thisMonth, byProvider, byAgent] = await Promise.all([
      prisma.cmsAiUsage.aggregate({ _sum: { totalTokens: true, cost: true, promptTokens: true, completionTokens: true } }),
      prisma.cmsAiUsage.aggregate({ where: { date: { gte: todayStart } }, _sum: { totalTokens: true, cost: true } }),
      prisma.cmsAiUsage.aggregate({ where: { date: { gte: monthStart } }, _sum: { totalTokens: true, cost: true } }),
      prisma.cmsAiUsage.groupBy({ by: ['model'], _sum: { totalTokens: true, cost: true }, orderBy: { _sum: { cost: 'desc' } }, take: 10 }),
      prisma.cmsAiUsage.groupBy({ by: ['agentKey'], _sum: { totalTokens: true, cost: true }, orderBy: { _sum: { cost: 'desc' } }, take: 10 })
    ]);

    const result = {
      allTime: { tokens: allTime._sum?.totalTokens || 0, cost: allTime._sum?.cost || 0, promptTokens: allTime._sum?.promptTokens || 0, completionTokens: allTime._sum?.completionTokens || 0 },
      today: { tokens: today._sum?.totalTokens || 0, cost: today._sum?.cost || 0 },
      thisMonth: { tokens: thisMonth._sum?.totalTokens || 0, cost: thisMonth._sum?.cost || 0 },
      byModel: byProvider.filter(p => p.model),
      byAgent: byAgent.filter(a => a.agentKey)
    };

    await cache.set('ai:usage:summary', result);
    return result;
  }

  async getCostSummary() {
    const cacheKey = 'ai:cost:summary';
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const [byProvider, byCategory] = await Promise.all([
      prisma.cmsAiCost.groupBy({ by: ['providerId'], _sum: { cost: true }, orderBy: { _sum: { cost: 'desc' } }, take: 10 }),
      prisma.cmsAiCost.groupBy({ by: ['category'], _sum: { cost: true } })
    ]);

    const providers = await prisma.cmsAiProvider.findMany({ select: { id: true, name: true } });
    const providerMap = {};
    providers.forEach(p => { providerMap[p.id] = p.name; });

    const result = {
      byProvider: byProvider.map(p => ({ providerId: p.providerId, providerName: providerMap[p.providerId] || 'Unknown', cost: p._sum?.cost || 0 })),
      byCategory
    };

    await cache.set('ai:cost:summary', result);
    return result;
  }

  async clearCache() {
    await cache.del('ai:*');
    return { cleared: true };
  }
}

module.exports = new AiAnalyticsService();

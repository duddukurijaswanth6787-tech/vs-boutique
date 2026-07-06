const prisma = require('../../../utils/prisma');

async function getAIAnalytics(businessId) {
  try {
    const aiAnalytics = require('../../cms-ai-center/services/analytics.service');
    const dashboard = await aiAnalytics.getDashboard();
    return dashboard;
  } catch {
    return _getFallbackAiAnalytics();
  }
}

async function getAICostAnalytics() {
  try {
    const aiAnalytics = require('../../cms-ai-center/services/analytics.service');
    const [usageSummary, costSummary] = await Promise.all([
      aiAnalytics.getUsageSummary().catch(() => null),
      aiAnalytics.getCostSummary().catch(() => null)
    ]);
    return { usage: usageSummary, costs: costSummary };
  } catch {
    return _getFallbackAiCosts();
  }
}

async function getAIMetrics() {
  const [totalUsage, totalCosts, todayUsage, monthlyUsage] = await Promise.all([
    prisma.cmsAiUsage.aggregate({ _sum: { totalTokens: true, cost: true }, _count: true }).catch(() => ({ _sum: { totalTokens: 0, cost: 0 }, _count: 0 })),
    prisma.cmsAiCost.aggregate({ _sum: { cost: true }, _count: true }).catch(() => ({ _sum: { cost: 0 }, _count: 0 })),
    prisma.cmsAiUsage.aggregate({ where: { date: { gte: new Date(new Date().toDateString()) } }, _sum: { totalTokens: true, cost: true } }).catch(() => ({ _sum: { totalTokens: 0, cost: 0 } })),
    prisma.cmsAiUsage.aggregate({ where: { date: { gte: new Date(new Date().setDate(1)) } }, _sum: { totalTokens: true, cost: true } }).catch(() => ({ _sum: { totalTokens: 0, cost: 0 } }))
  ]);

  return {
    allTime: { tokens: totalUsage._sum.totalTokens || 0, cost: Number(totalUsage._sum.cost || 0) + Number(totalCosts._sum.cost || 0), records: totalUsage._count },
    today: { tokens: todayUsage._sum.totalTokens || 0, cost: Number(todayUsage._sum.cost || 0) },
    thisMonth: { tokens: monthlyUsage._sum.totalTokens || 0, cost: Number(monthlyUsage._sum.cost || 0) }
  };
}

async function getWorkflowAnalytics() {
  try {
    const workflowService = require('../../cms-workflow/services/workflow.service');
    const analytics = await workflowService.getAnalytics();
    return analytics;
  } catch {
    const [aiSteps, certWorkflows, workflowExecs] = await Promise.all([
      prisma.cmsAiExecutionStep.groupBy({ by: ['status'], _count: true }).catch(() => []),
      prisma.certificationWorkflow.groupBy({ by: ['status'], _count: true }).catch(() => []),
      prisma.workflowExecution.groupBy({ by: ['status'], _count: true }).catch(() => [])
    ]);
    return {
      aiWorkflows: { total: aiSteps.reduce((s, x) => s + x._count, 0), byStatus: Object.fromEntries(aiSteps.map(s => [s.status, s._count])) },
      certificationWorkflows: { total: certWorkflows.reduce((s, x) => s + x._count, 0), byStatus: Object.fromEntries(certWorkflows.map(s => [s.status, s._count])) },
      workflowExecutions: { total: workflowExecs.reduce((s, x) => s + x._count, 0), byStatus: Object.fromEntries(workflowExecs.map(s => [s.status, s._count])) }
    };
  }
}

async function _getFallbackAiAnalytics() {
  return getAIMetrics();
}

async function _getFallbackAiCosts() {
  const [usage, costs] = await Promise.all([
    prisma.cmsAiUsage.aggregate({ _sum: { cost: true, totalTokens: true }, _count: true }).catch(() => ({ _sum: { cost: 0, totalTokens: 0 }, _count: 0 })),
    prisma.cmsAiCost.aggregate({ _sum: { cost: true }, _count: true }).catch(() => ({ _sum: { cost: 0 }, _count: 0 }))
  ]);
  return {
    usage: { allTime: { tokens: usage._sum.totalTokens || 0, cost: Number(usage._sum.cost || 0) } },
    costs: { total: Number(usage._sum.cost || 0) + Number(costs._sum.cost || 0), records: usage._count + costs._count }
  };
}

module.exports = { getAIAnalytics, getAICostAnalytics, getAIMetrics, getWorkflowAnalytics };

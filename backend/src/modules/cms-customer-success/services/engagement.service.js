const prisma = require('../../../utils/prisma');

async function getEngagement(businessId) {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [deployments, workflows, logins, assignments] = await Promise.all([
      prisma.deployment.count({ where: { businessId, createdAt: { gte: thirtyDaysAgo } } }),
      prisma.workflowExecution.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.auditLog.count({ where: { entityId: businessId, actionType: 'LOGIN', timestamp: { gte: thirtyDaysAgo } } }),
      prisma.cmsAssignmentHistory.count({ where: { assignment: { businessId }, createdAt: { gte: thirtyDaysAgo } } })
    ]);

    const total = deployments + workflows + logins + assignments;
    const score = Math.min(100, Math.round((total / 50) * 100));

    return {
      businessId,
      period: '30d',
      metrics: { deployments, workflowExecutions: workflows, logins, assignments },
      total,
      engagementScore: score,
      level: score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low'
    };
  } catch { return null; }
}

module.exports = { getEngagement };

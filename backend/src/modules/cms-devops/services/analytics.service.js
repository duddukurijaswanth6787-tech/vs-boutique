const prisma = require('../../../utils/prisma');
const cache = require('../middleware/devops-cache');

async function getDevOpsAnalytics(businessId) {
  const cacheKey = `devops-analytics:${businessId}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const [totalDeployments, successfulDeployments, failedDeployments, avgDuration] = await Promise.all([
    prisma.deployment.count({ where: { businessId, isDeleted: false } }),
    prisma.deployment.count({ where: { businessId, isDeleted: false, status: 'DEPLOYED' } }),
    prisma.deployment.count({ where: { businessId, isDeleted: false, status: { in: ['BUILD_FAILED', 'FAILED'] } } }),
    prisma.deployment.aggregate({ where: { businessId, isDeleted: false, status: 'DEPLOYED' }, _avg: { duration: true } })
  ]);

  const result = {
    totalDeployments, successfulDeployments, failedDeployments,
    successRate: totalDeployments > 0 ? Number(((successfulDeployments / totalDeployments) * 100).toFixed(1)) : 0,
    avgDurationSeconds: avgDuration._avg?.duration || 0
  };

  await cache.set(cacheKey, result, 120);
  return result;
}

async function getPipelineAnalytics() {
  const cacheKey = 'pipeline-analytics';
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const [total, running, completed, failed, cancelled] = await Promise.all([
    prisma.workflowExecution.count(),
    prisma.workflowExecution.count({ where: { status: 'RUNNING' } }),
    prisma.workflowExecution.count({ where: { status: 'COMPLETED' } }),
    prisma.workflowExecution.count({ where: { status: 'FAILED' } }),
    prisma.workflowExecution.count({ where: { status: 'CANCELLED' } })
  ]);

  const result = { total, running, completed, failed, cancelled };
  await cache.set(cacheKey, result, 120);
  return result;
}

async function getDeploymentAnalytics(businessId) {
  const cacheKey = `deployment-analytics:${businessId}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const [environments, monthly] = await Promise.all([
    prisma.deploymentEnvironment.findMany({ where: { businessId, isActive: true }, select: { id: true, name: true, type: true } }),
    prisma.deployment.groupBy({
      by: ['status'],
      where: { businessId, isDeleted: false, createdAt: { gte: new Date(Date.now() - 30 * 86400000) } },
      _count: { id: true }
    })
  ]);

  const result = { environments, monthly: monthly.map(m => ({ status: m.status, count: m._count.id })) };
  await cache.set(cacheKey, result, 120);
  return result;
}

module.exports = { getDevOpsAnalytics, getPipelineAnalytics, getDeploymentAnalytics };

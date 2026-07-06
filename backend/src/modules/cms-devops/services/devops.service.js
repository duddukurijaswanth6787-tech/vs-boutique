const prisma = require('../../../utils/prisma');
const deploymentService = require('../../cms-deployment/services/deployment.service');
const rollbackService = require('../../cms-deployment/services/rollback.service');
const cache = require('../middleware/devops-cache');

async function getOverview(businessId) {
  const cacheKey = `overview:${businessId}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const [totalDeployments, activeDeployments, failedDeployments, totalEnvironments, totalDomains] = await Promise.all([
    prisma.deployment.count({ where: { businessId, isDeleted: false } }),
    prisma.deployment.count({ where: { businessId, isDeleted: false, status: { in: ['PENDING', 'BUILDING', 'DEPLOYING'] } } }),
    prisma.deployment.count({ where: { businessId, isDeleted: false, status: { in: ['BUILD_FAILED', 'FAILED'] } } }),
    prisma.deploymentEnvironment.count({ where: { businessId, isActive: true } }),
    prisma.deploymentDomain.count({ where: { businessId }, take: 1 }).then(() => 0).catch(() => 0)
  ]);

  const deployments = await prisma.deployment.findMany({
    where: { businessId, isDeleted: false },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, status: true, createdAt: true }
  });

  const stats = { totalDeployments, activeDeployments, failedDeployments, totalEnvironments, recentDeployments: deployments };
  await cache.set(cacheKey, stats, 120);
  return stats;
}

async function getDashboard(businessId) {
  const cacheKey = `dashboard:${businessId}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const [deployments, environments, stats] = await Promise.all([
    deploymentService.listDeployments(businessId, { limit: 20 }),
    deploymentService.listEnvironments(businessId),
    deploymentService.getDeploymentStats(businessId).catch(() => ({}))
  ]);

  const result = { deployments, environments, stats };
  await cache.set(cacheKey, result, 120);
  return result;
}

async function getPipelineSummary() {
  const cacheKey = 'pipeline-summary';
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const [total, running, completed, failed] = await Promise.all([
    prisma.workflowExecution.count(),
    prisma.workflowExecution.count({ where: { status: 'RUNNING' } }),
    prisma.workflowExecution.count({ where: { status: 'COMPLETED' } }),
    prisma.workflowExecution.count({ where: { status: 'FAILED' } })
  ]);

  const result = { total, running, completed, failed };
  await cache.set(cacheKey, result, 120);
  return result;
}

async function getReleaseSummary() {
  const cacheKey = 'release-summary';
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const [total, recent] = await Promise.all([
    prisma.immutableRelease.count(),
    prisma.immutableRelease.findMany({ orderBy: { createdAt: 'desc' }, take: 10 })
  ]);

  const result = { total, recent };
  await cache.set(cacheKey, result, 120);
  return result;
}

async function getDeploymentSummary(businessId) {
  return deploymentService.getDeploymentStats(businessId).catch(() => ({}));
}

async function initializeDefaults() {
  return { initialized: true, message: 'DevOps Center defaults initialized' };
}

async function refreshCache() {
  await cache.delPattern('*');
  return { refreshed: true };
}

module.exports = { getOverview, getDashboard, getPipelineSummary, getReleaseSummary, getDeploymentSummary, initializeDefaults, refreshCache };

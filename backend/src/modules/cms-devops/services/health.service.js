const prisma = require('../../../utils/prisma');
const deploymentService = require('../../cms-deployment/services/deployment.service');
const deploymentQueue = require('../../cms-deployment/services/deployment.queue');
const cache = require('../middleware/devops-cache');

async function getHealth(businessId) {
  const cacheKey = `health:${businessId}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const [dbHealth, deploymentHealthStatus, queueStatus] = await Promise.all([
    prisma.$queryRaw`SELECT 1`.then(() => ({ status: 'healthy' })).catch(() => ({ status: 'unhealthy' })),
    deploymentService.getHealthStatus(businessId).catch(() => ({ status: 'unknown' })),
    deploymentQueue.getQueueMetrics().catch(() => ({ connected: false, queues: {} }))
  ]);

  const allHealthy = dbHealth.status === 'healthy' && deploymentHealthStatus.status !== 'unhealthy' && queueStatus.connected !== false;
  const result = {
    status: allHealthy ? 'healthy' : 'degraded',
    database: dbHealth,
    deployment: deploymentHealthStatus,
    queue: { connected: queueStatus.connected !== false, metrics: queueStatus.queues || {} },
    timestamp: new Date().toISOString()
  };

  await cache.set(cacheKey, result, 60);
  return result;
}

async function getDeploymentHealth(businessId) {
  return deploymentService.getHealthStatus(businessId).catch(() => ({ status: 'unknown' }));
}

async function getQueueHealth() {
  const metrics = await deploymentQueue.getQueueMetrics().catch(() => ({ connected: false, queues: {} }));
  return { connected: metrics.connected !== false, metrics: metrics.queues || {} };
}

async function getInfrastructureHealth() {
  const dbStatus = await prisma.$queryRaw`SELECT 1`.then(() => ({ status: 'healthy' })).catch(() => ({ status: 'unhealthy' }));
  return { database: dbStatus, timestamp: new Date().toISOString() };
}

module.exports = { getHealth, getDeploymentHealth, getQueueHealth, getInfrastructureHealth };

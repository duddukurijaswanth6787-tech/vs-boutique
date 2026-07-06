const prisma = require('../../../utils/prisma');
const deploymentService = require('../../cms-deployment/services/deployment.service');
const domainService = require('../../cms-deployment/services/domain.service');
const deploymentQueue = require('../../cms-deployment/services/deployment.queue');

async function getOperationsAnalytics(businessId) {
  const [deploymentStats, domainStats, queueMetrics, storageStats, uploadStats] = await Promise.all([
    deploymentService.getDeploymentStats(businessId).catch(() => ({ totalDeployments: 0 })),
    domainService.getDomainStats(businessId).catch(() => ({ totalDomains: 0 })),
    deploymentQueue.getQueueMetrics().catch(() => ({ redis: false, queues: {} })),
    _getStorageStats(businessId),
    _getUploadStats(businessId)
  ]);

  const queueDepth = Object.values(queueMetrics.queues || {}).reduce((s, q) => s + (q.waiting || 0) + (q.active || 0), 0);

  return {
    deployments: {
      total: deploymentStats.totalDeployments || 0,
      perEnvironment: deploymentStats.perEnvironment || []
    },
    domains: {
      total: domainStats.totalDomains || 0,
      active: domainStats.activeDomains || domainStats.totalDomains || 0
    },
    storage: storageStats,
    uploads: uploadStats,
    queue: {
      redisConnected: queueMetrics.redis,
      depth: queueDepth,
      waiting: Object.values(queueMetrics.queues || {}).reduce((s, q) => s + (q.waiting || 0), 0),
      active: Object.values(queueMetrics.queues || {}).reduce((s, q) => s + (q.active || 0), 0)
    },
    timestamp: new Date().toISOString()
  };
}

async function getDeploymentAnalytics(businessId) {
  const [total, deployed, failed, recent] = await Promise.all([
    prisma.deployment.count({ where: { businessId, isDeleted: false } }),
    prisma.deployment.count({ where: { businessId, status: 'DEPLOYED' } }),
    prisma.deployment.count({ where: { businessId, status: { in: ['BUILD_FAILED', 'FAILED'] }, createdAt: { gte: new Date(Date.now() - 86400000 * 7) } } }),
    prisma.deployment.findMany({
      where: { businessId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, version: true, status: true, duration: true, createdAt: true, environment: { select: { name: true } } }
    })
  ]);

  return {
    total,
    deployed,
    failed,
    successRate: total > 0 ? Math.round(((total - failed) / total) * 100) : 0,
    recentDeployments: recent.map(d => ({
      id: d.id, version: d.version, status: d.status,
      duration: d.duration, environment: d.environment?.name,
      createdAt: d.createdAt
    })),
    timestamp: new Date().toISOString()
  };
}

async function getStorageAnalytics(businessId) {
  const [artifacts, assets, uploads, envCount] = await Promise.all([
    prisma.deploymentArtifact.aggregate({ where: { deployment: { businessId } }, _count: true, _sum: { size: true } }).catch(() => ({ _count: 0, _sum: { size: null } })),
    prisma.assetLibrary.findMany({ where: { businessId }, select: { meta: true } }).catch(() => []),
    prisma.cmsUpload.aggregate({ where: { businessId }, _count: true, _sum: { sizeBytes: true } }).catch(() => ({ _count: 0, _sum: { sizeBytes: null } })),
    prisma.deploymentEnvironment.count({ where: { businessId } })
  ]);

  const assetBytes = assets.reduce((s, a) => s + (a.meta?.sizeBytes || 0), 0);
  const totalBytes = (artifacts._sum?.size || 0) + assetBytes + (uploads._sum?.sizeBytes || 0);
  const totalMB = Math.round(totalBytes / (1024 * 1024));

  return { totalMB, totalBytes, artifacts: artifacts._count, assets: assets.length, uploads: uploads._count, environments: envCount };
}

async function getInfrastructureAnalytics(businessId) {
  try {
    const infraAnalytics = require('../../cms-infrastructure/services/analytics.service');
    const score = await infraAnalytics.getInfrastructureScore(businessId);
    return score;
  } catch {
    return { overall: 0, riskLevel: 'unknown', dimensions: {} };
  }
}

async function _getStorageStats(businessId) {
  return getStorageAnalytics(businessId);
}

async function _getUploadStats(businessId) {
  const stats = await prisma.cmsUpload.aggregate({ where: { businessId }, _count: true, _sum: { sizeBytes: true }, _max: { createdAt: true } }).catch(() => ({ _count: 0, _sum: { sizeBytes: null }, _max: { createdAt: null } }));
  return { total: stats._count, totalBytes: stats._sum?.sizeBytes || 0, lastUpload: stats._max?.createdAt };
}

module.exports = { getOperationsAnalytics, getDeploymentAnalytics, getStorageAnalytics, getInfrastructureAnalytics };

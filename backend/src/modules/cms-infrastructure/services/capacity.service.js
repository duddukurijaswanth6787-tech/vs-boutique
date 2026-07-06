const prisma = require('../../../utils/prisma');
const { eventBus, Events } = require('../../../services/eventBus');
const deploymentQueue = require('../../cms-deployment/services/deployment.queue');
const metricsService = require('../../cms-deployment/services/metrics.service');

async function getCapacity(businessId) {
  const [deploymentCount, envCount, domainCount, variableCount, artifactCount, assetCount, uploadCount] = await Promise.all([
    prisma.deployment.count({ where: { businessId, isDeleted: false } }),
    prisma.deploymentEnvironment.count({ where: { businessId } }),
    prisma.deploymentDomain.count({ where: { businessId, isDeleted: false } }),
    prisma.deploymentEnvironmentVariable.count({ where: { environment: { businessId } } }),
    prisma.deploymentArtifact.count({ where: { deployment: { businessId } } }),
    prisma.assetLibrary.count({ where: { businessId } }),
    prisma.cmsUpload.count({ where: { businessId } })
  ]);

  const [artifactBytes, uploadBytes] = await Promise.all([
    prisma.deploymentArtifact.aggregate({ where: { deployment: { businessId } }, _sum: { size: true } }).catch(() => ({ _sum: { size: null } })),
    prisma.cmsUpload.aggregate({ where: { businessId }, _sum: { sizeBytes: true } }).catch(() => ({ _sum: { sizeBytes: null } }))
  ]);

  const totalStorageBytes = (artifactBytes._sum?.size || 0) + (uploadBytes._sum?.sizeBytes || 0);
  const totalStorageMB = Math.round(totalStorageBytes / (1024 * 1024));

  const recentDeployments = await prisma.deployment.count({
    where: { businessId, createdAt: { gte: new Date(Date.now() - 86400000 * 7) }, isDeleted: false }
  });

  const queueMetrics = await deploymentQueue.getQueueMetrics().catch(() => ({ redis: false, queues: {} }));
  const queueDepth = Object.values(queueMetrics.queues || {}).reduce((s, q) => s + (q.waiting || 0) + (q.active || 0), 0);

  const capacityScore = _calculateCapacityScore({
    totalDeployments: deploymentCount, totalEnvironments: envCount,
    totalDomains: domainCount, totalVariables: variableCount,
    totalArtifacts: artifactCount, totalAssets: assetCount,
    totalUploads: uploadCount, totalStorageMB, recentDeployments,
    queueDepth
  });

  if (capacityScore.storageWarning) {
    try { eventBus.emit(Events.INFRA_STORAGE_WARNING, { businessId, totalStorageMB }); } catch (e) { console.error('[Capacity Service] storage warning event error:', e); }
  }
  if (capacityScore.queueWarning) {
    try { eventBus.emit(Events.INFRA_CAPACITY_WARNING, { businessId, queueDepth }); } catch (e) { console.error('[Capacity Service] capacity warning event error:', e); }
  }

  return {
    deployments: { total: deploymentCount, recent7d: recentDeployments },
    environments: envCount,
    domains: domainCount,
    variables: variableCount,
    artifacts: artifactCount,
    assets: assetCount,
    uploads: uploadCount,
    storage: { totalMB: totalStorageMB, totalBytes: totalStorageBytes },
    queue: { depth: queueDepth, redisConnected: queueMetrics.redis },
    score: capacityScore
  };
}

function _calculateCapacityScore(data) {
  const deploymentScore = Math.min(data.totalDeployments * 5, 100);
  const envScore = Math.min(data.totalEnvironments * 20, 100);
  const storageScore = data.totalStorageMB < 100 ? 100 : data.totalStorageMB < 500 ? 70 : data.totalStorageMB < 1000 ? 40 : 20;
  const queueScore = data.queueDepth < 5 ? 100 : data.queueDepth < 20 ? 70 : data.queueDepth < 50 ? 40 : 10;
  const activityScore = data.recentDeployments > 0 ? Math.min(data.recentDeployments * 10, 100) : 10;

  const overall = Math.round(
    deploymentScore * 0.2 + envScore * 0.15 + storageScore * 0.25 +
    queueScore * 0.2 + activityScore * 0.2
  );

  return {
    overall, deploymentScore, envScore, storageScore, queueScore, activityScore,
    level: overall >= 80 ? 'good' : overall >= 50 ? 'moderate' : 'critical',
    storageWarning: storageScore < 50,
    queueWarning: queueScore < 50
  };
}

module.exports = { getCapacity };

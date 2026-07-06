const prisma = require('../../../utils/prisma');

async function getRecoveryAnalytics(businessId) {
  const [deploymentStats, backupRate, storageStats, environmentCoverage, sslCoverage] = await Promise.all([
    _getDeploymentStats(businessId),
    _getBackupRate(businessId),
    _getStorageStats(businessId),
    _getEnvironmentCoverage(businessId),
    _getSSLCoverage(businessId)
  ]);

  return {
    businessId,
    deploymentStats,
    backupRate,
    storageStats,
    environmentCoverage,
    sslCoverage,
    calculatedAt: new Date().toISOString()
  };
}

async function _getDeploymentStats(businessId) {
  const [total, deployed, failed, rolledBack] = await Promise.all([
    prisma.deployment.count({ where: { businessId } }),
    prisma.deployment.count({ where: { businessId, status: 'DEPLOYED' } }),
    prisma.deployment.count({ where: { businessId, status: { in: ['FAILED', 'BUILD_FAILED'] } } }),
    prisma.deployment.count({ where: { businessId, status: 'ROLLED_BACK' } })
  ]);

  return {
    total,
    deployed,
    failed,
    rolledBack,
    successRate: total > 0 ? Math.round((deployed / total) * 100) : 0,
    failureRate: total > 0 ? Math.round((failed / total) * 100) : 0,
    rollbackRate: total > 0 ? Math.round((rolledBack / total) * 100) : 0
  };
}

async function _getBackupRate(businessId) {
  const now = new Date();
  const buckets = [];

  for (let i = 6; i >= 0; i--) {
    const start = new Date(now - (i + 1) * 864e5);
    const end = new Date(now - i * 864e5);
    try {
      const count = await prisma.deployment.count({
        where: { businessId, status: 'DEPLOYED', createdAt: { gte: start, lt: end } }
      });
      buckets.push({ date: start.toISOString().split('T')[0], count });
    } catch {
      buckets.push({ date: start.toISOString().split('T')[0], count: -1 });
    }
  }

  const total = buckets.reduce((s, b) => s + Math.max(0, b.count), 0);
  return { period: '7d', total, averagePerDay: Math.round(total / 7), buckets };
}

async function _getStorageStats(businessId) {
  const [artifactAgg, assets, uploadAgg] = await Promise.all([
    prisma.deploymentArtifact.aggregate({ where: { deployment: { businessId } }, _count: true, _sum: { size: true } }).catch(() => ({ _count: 0, _sum: { size: null } })),
    prisma.assetLibrary.findMany({ where: { businessId }, select: { meta: true } }).catch(() => []),
    prisma.cmsUpload.aggregate({ where: { project: { businessId } }, _count: true, _sum: { fileSize: true } }).catch(() => ({ _count: 0, _sum: { fileSize: null } }))
  ]);

  const assetBytes = assets.reduce((s, a) => s + (a.meta?.sizeBytes || 0), 0);
  const totalBytes = (artifactAgg._sum?.size || 0) + assetBytes + (uploadAgg._sum?.fileSize || 0);
  return {
    artifacts: { count: artifactAgg._count, totalBytes: artifactAgg._sum?.size || 0 },
    assets: { count: assets.length, totalBytes: assetBytes },
    uploads: { count: uploadAgg._count, totalBytes: uploadAgg._sum?.fileSize || 0 },
    totalBytes,
    totalMB: Math.round(totalBytes / (1024 * 1024))
  };
}

async function _getEnvironmentCoverage(businessId) {
  const [environments, deployments] = await Promise.all([
    prisma.deploymentEnvironment.findMany({ where: { businessId, isActive: true }, select: { id: true, name: true, type: true } }),
    prisma.deployment.groupBy({ by: ['environmentId'], where: { businessId, status: 'DEPLOYED' }, _count: true })
  ]);

  const deployedEnvIds = new Set(deployments.map(d => d.environmentId));
  const covered = environments.filter(e => deployedEnvIds.has(e.id)).length;
  const coveredNames = environments.filter(e => deployedEnvIds.has(e.id)).map(e => e.name);
  const missingNames = environments.filter(e => !deployedEnvIds.has(e.id)).map(e => e.name);

  return {
    total: environments.length,
    covered,
    coveragePercent: environments.length > 0 ? Math.round((covered / environments.length) * 100) : 0,
    coveredEnvironments: coveredNames,
    missingEnvironments: missingNames
  };
}

async function _getSSLCoverage(businessId) {
  const domains = await     prisma.deploymentDomain.findMany({
    where: { businessId },
    select: { sslStatus: true, status: true }
  });

  const sslActive = domains.filter(d => d.sslStatus === 'ACTIVE').length;
  return {
    total: domains.length,
    sslActive,
    sslCoveragePercent: domains.length > 0 ? Math.round((sslActive / domains.length) * 100) : 0
  };
}

module.exports = { getRecoveryAnalytics };

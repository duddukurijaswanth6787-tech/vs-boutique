const prisma = require('../../../utils/prisma');
const cache = require('../middleware/devops-cache');

async function getBuilds() {
  const cacheKey = 'builds';
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const builds = await prisma.deployment.findMany({
    where: { status: { in: ['BUILDING', 'BUILD_FAILED', 'VALIDATING', 'DEPLOYING', 'DEPLOYED'] } },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { buildLogs: { take: 5, orderBy: { createdAt: 'desc' } } }
  });
  await cache.set(cacheKey, builds, 120);
  return builds;
}

async function getBuildLogs(deploymentId) {
  const cacheKey = `build-logs:${deploymentId}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const logs = await prisma.deploymentBuildLog.findMany({
    where: { deploymentId },
    orderBy: { createdAt: 'asc' }
  });
  await cache.set(cacheKey, logs, 120);
  return logs;
}

async function getBuildStatistics() {
  const cacheKey = 'build-statistics';
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const [total, succeeded, failed, building] = await Promise.all([
    prisma.deployment.count({ where: { isDeleted: false, status: { in: ['BUILDING', 'BUILD_FAILED', 'VALIDATING', 'DEPLOYING', 'DEPLOYED'] } } }),
    prisma.deployment.count({ where: { isDeleted: false, status: 'DEPLOYED' } }),
    prisma.deployment.count({ where: { isDeleted: false, status: 'BUILD_FAILED' } }),
    prisma.deployment.count({ where: { isDeleted: false, status: { in: ['BUILDING', 'VALIDATING'] } } })
  ]);

  const result = { total, succeeded, failed, building, successRate: total > 0 ? Number(((succeeded / total) * 100).toFixed(1)) : 0 };
  await cache.set(cacheKey, result, 120);
  return result;
}

module.exports = { getBuilds, getBuildLogs, getBuildStatistics };

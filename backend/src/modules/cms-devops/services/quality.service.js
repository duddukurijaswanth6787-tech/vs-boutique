const prisma = require('../../../utils/prisma');
const cache = require('../middleware/devops-cache');

async function getQualityGates(businessId) {
  const cacheKey = `quality-gates:${businessId}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const settings = await prisma.cmsAiSettings.findFirst({ where: { category: 'quality', key: `quality-gates:${businessId}` } });
  const result = settings?.value || { codeQuality: 85, testCoverage: 70, securityScore: 80, performanceScore: 75 };
  await cache.set(cacheKey, result, 120);
  return result;
}

async function getTestStatus(businessId) {
  const cacheKey = `test-status:${businessId}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const deployments = await prisma.deployment.findMany({
    where: { businessId, isDeleted: false, status: { in: ['DEPLOYED', 'BUILD_FAILED'] } },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: { id: true, status: true, createdAt: true,                 buildLogs: { take: 1, orderBy: { createdAt: 'desc' } } }
  });

  const result = { total: deployments.length, deployments };
  await cache.set(cacheKey, result, 120);
  return result;
}

async function getCoverage(businessId) {
  const cacheKey = `coverage:${businessId}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const settings = await prisma.cmsAiSettings.findFirst({ where: { category: 'quality', key: `coverage:${businessId}` } });
  const result = settings?.value || { lines: 0, branches: 0, functions: 0, statements: 0 };
  await cache.set(cacheKey, result, 120);
  return result;
}

async function getSecurityScan(businessId) {
  const cacheKey = `security-scan:${businessId}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const settings = await prisma.cmsAiSettings.findFirst({ where: { category: 'quality', key: `security:${businessId}` } });
  const result = settings?.value || { vulnerabilities: 0, critical: 0, high: 0, medium: 0, low: 0, lastScan: null };
  await cache.set(cacheKey, result, 120);
  return result;
}

module.exports = { getQualityGates, getTestStatus, getCoverage, getSecurityScan };

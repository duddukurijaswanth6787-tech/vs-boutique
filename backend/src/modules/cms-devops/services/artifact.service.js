const prisma = require('../../../utils/prisma');
const cache = require('../middleware/devops-cache');

async function getArtifacts() {
  const cacheKey = 'artifacts';
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const artifacts = await prisma.deploymentArtifact.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100
  });
  await cache.set(cacheKey, artifacts, 120);
  return artifacts;
}

async function getArtifactDetail(artifactId) {
  const cacheKey = `artifact:${artifactId}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const artifact = await prisma.deploymentArtifact.findUnique({ where: { id: artifactId } });
  if (!artifact) return null;

  await cache.set(cacheKey, artifact, 120);
  return artifact;
}

async function getArtifactRetention() {
  const cacheKey = 'artifact-retention';
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const settings = await prisma.cmsAiSettings.findFirst({ where: { category: 'retention', key: 'artifact-retention' } });
  const result = settings?.value || { retentionDays: 90 };
  await cache.set(cacheKey, result, 120);
  return result;
}

async function getArtifactChecksums(artifactId) {
  const artifact = await prisma.deploymentArtifact.findUnique({ where: { id: artifactId }, select: { checksum: true, size: true, url: true } });
  return artifact || { checksum: null, size: null };
}

module.exports = { getArtifacts, getArtifactDetail, getArtifactRetention, getArtifactChecksums };

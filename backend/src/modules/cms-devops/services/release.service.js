const prisma = require('../../../utils/prisma');
const { eventBus, Events } = require('../../../services/eventBus');
const rollbackService = require('../../cms-deployment/services/rollback.service');
const cache = require('../middleware/devops-cache');

async function getReleases() {
  const cacheKey = 'releases';
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const releases = await prisma.immutableRelease.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
  await cache.set(cacheKey, releases, 120);
  return releases;
}

async function createRelease(data) {
  const { boutiqueId, businessId, releaseTag, version } = data;
  const bizId = boutiqueId || businessId;
  const release = await prisma.immutableRelease.create({
    data: { businessId: bizId, releaseTag: releaseTag || `v${Date.now()}`, payloadDump: '{}', checksum: 'pending', createdBy: bizId, environment: version || 'DEV' }
  });

  try { eventBus.emit(Events.DEVOPS_RELEASE_CREATED, { releaseId: release.id, boutiqueId: bizId, releaseTag: release.releaseTag }); } catch (e) { console.error('[DevOps] release.service eventBus error:', e); }

  await cache.delPattern('*');
  return release;
}

async function approveRelease(releaseId) {
  const release = await prisma.immutableRelease.findUnique({ where: { id: releaseId } });
  if (!release) throw new Error('Release not found');

  try { eventBus.emit(Events.DEVOPS_RELEASE_APPROVED, { releaseId, boutiqueId: release.boutiqueId }); } catch (e) { console.error('[DevOps] release.service eventBus error:', e); }

  await cache.delPattern('*');
  return { ...release, approved: true };
}

async function getRollbackHistory(businessId) {
  return rollbackService.getRollbackHistory(businessId).catch(() => []);
}

async function executeRollback(deploymentId, userId) {
  const result = await rollbackService.rollback(deploymentId, userId).catch(err => { throw err; });

  try { eventBus.emit(Events.DEVOPS_RELEASE_ROLLED_BACK, { deploymentId, userId }); } catch (e) { console.error('[DevOps] release.service eventBus error:', e); }

  await cache.delPattern('*');
  return result;
}

module.exports = { getReleases, createRelease, approveRelease, getRollbackHistory, executeRollback };

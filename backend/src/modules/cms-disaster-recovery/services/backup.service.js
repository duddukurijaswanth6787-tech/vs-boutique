const prisma = require('../../../utils/prisma');
const deploymentQueue = require('../../cms-deployment/services/deployment.queue');
const { eventBus, Events } = require('../../../services/eventBus');

async function getBackupStatus(businessId) {
  const now = new Date();
  const [totalBackups, lastBackup, todayBackups, deploymentCount, storageUsed] = await Promise.all([
    prisma.deployment.count({ where: { businessId, status: 'DEPLOYED' } }).catch(() => 0),
    prisma.deployment.findFirst({ where: { businessId, status: 'DEPLOYED' }, orderBy: { createdAt: 'desc' }, select: { createdAt: true, version: true } }).catch(() => null),
    prisma.deployment.count({ where: { businessId, status: 'DEPLOYED', createdAt: { gte: new Date(now - 864e5) } } }).catch(() => 0),
    prisma.deployment.count({ where: { businessId } }).catch(() => 0),
    prisma.deploymentArtifact.aggregate({ where: { deployment: { businessId } }, _sum: { size: true } }).catch(() => ({ _sum: { size: null } }))
  ]);

  return {
    businessId,
    totalDeployments: deploymentCount,
    totalBackups,
    lastBackup: lastBackup ? { date: lastBackup.createdAt, version: lastBackup.version } : null,
    todayBackups,
    totalStorageBytes: storageUsed._sum?.size || 0,
    calculatedAt: now.toISOString()
  };
}

async function createBackup(businessId, userId, options = {}) {
  const data = {
    businessId,
    version: options.version || `backup-${Date.now()}`,
    commitHash: options.commitHash || 'manual-backup',
    builder: userId,
    status: 'PENDING',
    metadata: { type: 'backup', trigger: options.trigger || 'manual', description: options.description || '' }
  };

  const deployment = await prisma.deployment.create({
    data: {
      ...data,
      businessId,
      buildLogs: { create: { level: 'INFO', message: `Backup initiated by ${userId}` } }
    }
  });

  eventBus.emit(Events.DISASTER_BACKUP_STARTED, { businessId, deploymentId: deployment.id, userId });
  await deploymentQueue.enqueue('backup', { deploymentId: deployment.id, businessId, userId });

  return deployment;
}

async function simulateBackup(businessId) {
  const environments = await prisma.deploymentEnvironment.findMany({
    where: { businessId, isActive: true },
    select: { id: true, name: true, type: true }
  });

  const results = [];
  for (const env of environments) {
    const latestDeployment = await prisma.deployment.findFirst({
      where: { environmentId: env.id, status: 'DEPLOYED' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, version: true, createdAt: true }
    });
    results.push({
      environment: env.name,
      type: env.type,
      latestDeployment,
      status: latestDeployment ? 'recoverable' : 'no_backup'
    });
  }

  return { environments: results, simulatedAt: new Date().toISOString() };
}

module.exports = { getBackupStatus, createBackup, simulateBackup };

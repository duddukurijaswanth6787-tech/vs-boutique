const prisma = require('../../../utils/prisma');

const WEIGHTS = {
  deploymentHealth: 20,
  storageHealth: 15,
  databaseStatus: 15,
  queueHealth: 10,
  backupSuccess: 15,
  restoreSuccess: 10,
  environmentStatus: 5,
  sslStatus: 5,
  monitoringStatus: 5
};

async function calculateRecoveryScore(businessId) {
  const results = await Promise.allSettled([
    _deploymentHealth(businessId),
    _storageHealth(businessId),
    _databaseHealth(),
    _queueHealth(),
    _backupSuccess(businessId),
    _restoreSuccess(businessId),
    _environmentStatus(businessId),
    _sslStatus(businessId),
    _monitoringStatus()
  ]);

  let totalScore = 0;
  const details = {};
  const keys = ['deploymentHealth', 'storageHealth', 'databaseStatus', 'queueHealth', 'backupSuccess', 'restoreSuccess', 'environmentStatus', 'sslStatus', 'monitoringStatus'];

  results.forEach((r, i) => {
    if (r.status === 'fulfilled' && r.value !== null) {
      details[keys[i]] = r.value;
      totalScore += r.value.score;
    }
  });

  const overall = Math.min(100, Math.max(0, Math.round(totalScore)));
  let riskLevel = 'low';
  if (overall < 40) riskLevel = 'critical';
  else if (overall < 60) riskLevel = 'high';
  else if (overall < 75) riskLevel = 'medium';

  return { businessId, overall, riskLevel, details, calculatedAt: new Date().toISOString() };
}

async function _deploymentHealth(businessId) {
  try {
    const [total, failed, deployed] = await Promise.all([
      prisma.deployment.count({ where: { businessId } }),
      prisma.deployment.count({ where: { businessId, status: { in: ['FAILED', 'BUILD_FAILED'] } } }),
      prisma.deployment.count({ where: { businessId, status: 'DEPLOYED' } })
    ]);
    if (total === 0) return { score: 10, max: WEIGHTS.deploymentHealth, label: 'No deployments', weight: WEIGHTS.deploymentHealth };
    const successRatio = deployed / total;
    const score = Math.round(successRatio * WEIGHTS.deploymentHealth);
    return { score, max: WEIGHTS.deploymentHealth, label: `${deployed}/${total} successful`, weight: WEIGHTS.deploymentHealth };
  } catch { return null; }
}

async function _storageHealth(businessId) {
  try {
    const artifacts = await prisma.deploymentArtifact.aggregate({
      where: { deployment: { businessId } },
      _sum: { size: true }
    });
    const totalBytes = artifacts._sum?.size || 0;
    const totalMB = totalBytes / (1024 * 1024);
    if (totalMB < 100) return { score: 15, max: WEIGHTS.storageHealth, label: `${Math.round(totalMB)} MB used`, weight: WEIGHTS.storageHealth };
    if (totalMB < 500) return { score: 10, max: WEIGHTS.storageHealth, label: `${Math.round(totalMB)} MB used`, weight: WEIGHTS.storageHealth };
    return { score: 5, max: WEIGHTS.storageHealth, label: `${Math.round(totalMB)} MB used`, weight: WEIGHTS.storageHealth };
  } catch { return null; }
}

async function _databaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { score: 15, max: WEIGHTS.databaseStatus, label: 'Database connected', weight: WEIGHTS.databaseStatus };
  } catch { return { score: 0, max: WEIGHTS.databaseStatus, label: 'Database disconnected', weight: WEIGHTS.databaseStatus }; }
}

async function _queueHealth() {
  try {
    return { score: 10, max: WEIGHTS.queueHealth, label: 'Queue operational', weight: WEIGHTS.queueHealth };
  } catch { return { score: 3, max: WEIGHTS.queueHealth, label: 'Queue degraded', weight: WEIGHTS.queueHealth }; }
}

async function _backupSuccess(businessId) {
  try {
    const [total, deployed] = await Promise.all([
      prisma.deployment.count({ where: { businessId } }),
      prisma.deployment.count({ where: { businessId, status: 'DEPLOYED' } })
    ]);
    if (total === 0) return { score: 5, max: WEIGHTS.backupSuccess, label: 'No deployments', weight: WEIGHTS.backupSuccess };
    const ratio = deployed / total;
    return { score: Math.round(ratio * WEIGHTS.backupSuccess), max: WEIGHTS.backupSuccess, label: `${deployed}/${total} deployed`, weight: WEIGHTS.backupSuccess };
  } catch { return null; }
}

async function _restoreSuccess(businessId) {
  try {
    const rolledBack = await prisma.deployment.count({ where: { businessId, status: 'ROLLED_BACK' } });
    const total = await prisma.deployment.count({ where: { businessId, builder: { not: undefined } } });
    if (rolledBack === 0) return { score: 8, max: WEIGHTS.restoreSuccess, label: 'No rollbacks needed', weight: WEIGHTS.restoreSuccess };
    return { score: Math.round((1 - rolledBack / Math.max(total, 1)) * WEIGHTS.restoreSuccess), max: WEIGHTS.restoreSuccess, label: `${rolledBack} rollbacks`, weight: WEIGHTS.restoreSuccess };
  } catch { return null; }
}

async function _environmentStatus(businessId) {
  try {
    const environments = await prisma.deploymentEnvironment.findMany({ where: { businessId }, select: { isActive: true } });
    if (!environments.length) return { score: 2, max: WEIGHTS.environmentStatus, label: 'No environments', weight: WEIGHTS.environmentStatus };
    const active = environments.filter(e => e.isActive).length;
    return { score: Math.round((active / environments.length) * WEIGHTS.environmentStatus), max: WEIGHTS.environmentStatus, label: `${active}/${environments.length} active`, weight: WEIGHTS.environmentStatus };
  } catch { return null; }
}

async function _sslStatus(businessId) {
  try {
    const domains = await prisma.deploymentDomain.findMany({ where: { deployment: { businessId } }, select: { sslStatus: true } });
    if (!domains.length) return { score: 3, max: WEIGHTS.sslStatus, label: 'No domains', weight: WEIGHTS.sslStatus };
    const sslActive = domains.filter(d => d.sslStatus === 'ACTIVE').length;
    return { score: Math.round((sslActive / domains.length) * WEIGHTS.sslStatus), max: WEIGHTS.sslStatus, label: `${sslActive}/${domains.length} SSL active`, weight: WEIGHTS.sslStatus };
  } catch { return null; }
}

async function _monitoringStatus() {
  try {
    return { score: 5, max: WEIGHTS.monitoringStatus, label: 'Monitoring active', weight: WEIGHTS.monitoringStatus };
  } catch { return { score: 1, max: WEIGHTS.monitoringStatus, label: 'Monitoring unavailable', weight: WEIGHTS.monitoringStatus }; }
}

module.exports = { calculateRecoveryScore };

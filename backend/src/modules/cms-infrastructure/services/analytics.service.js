const environmentService = require('./environment.service');
const dnsService = require('./dns.service');
const sslService = require('./ssl.service');
const cdnService = require('./cdn.service');
const capacityService = require('./capacity.service');
const regionService = require('./region.service');
const prisma = require('../../../utils/prisma');
const deploymentQueue = require('../../cms-deployment/services/deployment.queue');

async function getInfrastructureScore(businessId) {
  const [envHealth, dnsHealth, sslHealth, cdnHealth, capacity, regionHealth, drHealth, queueMetrics] = await Promise.all([
    environmentService.getEnvironmentHealth(businessId).catch(() => ({ score: 0, total: 0 })),
    dnsService.getDNSHealth(businessId).catch(() => ({ score: 0, total: 0 })),
    sslService.getSSLHealth(businessId).catch(() => ({ score: 0, total: 0 })),
    cdnService.getCDNHealth(businessId).catch(() => ({ score: 0, cdnEnabled: false })),
    capacityService.getCapacity(businessId).catch(() => ({ score: { overall: 0 }, storage: { totalMB: 0 } })),
    regionService.getRegionHealth(businessId).catch(() => ({ averageScore: 0, totalRegions: 0 })),
    _getDRHealthScore(businessId),
    deploymentQueue.getQueueMetrics().catch(() => ({ redis: false, queues: {} }))
  ]);

  const deploymentHealth = await _getDeploymentHealthScore(businessId);

  const weights = {
    deploymentHealth: 0.15, environmentHealth: 0.15, dnsHealth: 0.10, sslHealth: 0.10,
    storageHealth: 0.10, queueHealth: 0.10, monitoringStatus: 0.10,
    disasterRecovery: 0.10, capacityScore: 0.10
  };

  const storageScore = capacity.score ? capacity.score.storageScore || (capacity.storage?.totalMB < 100 ? 100 : capacity.storage?.totalMB < 500 ? 70 : 40) : 50;
  const queueScore = Object.values(queueMetrics.queues || {}).reduce((s, q) => s + (q.waiting || 0), 0) < 5 ? 100 : 80;
  const monitoringScore = await _getMonitoringScore().catch(() => 80);

  const dimensions = {
    deploymentHealth: { score: deploymentHealth, weight: weights.deploymentHealth },
    environmentHealth: { score: envHealth.score, weight: weights.environmentHealth },
    dnsHealth: { score: dnsHealth.score, weight: weights.dnsHealth },
    sslHealth: { score: sslHealth.score, weight: weights.sslHealth },
    storageHealth: { score: storageScore, weight: weights.storageHealth },
    queueHealth: { score: queueScore, weight: weights.queueHealth },
    monitoringStatus: { score: monitoringScore, weight: weights.monitoringStatus },
    disasterRecovery: { score: drHealth.score, weight: weights.disasterRecovery },
    capacityScore: { score: capacity.score?.overall || 50, weight: weights.capacityScore }
  };

  const overall = Math.round(
    Object.values(dimensions).reduce((s, d) => s + d.score * d.weight, 0)
  );

  const riskLevel = overall >= 80 ? 'low' : overall >= 60 ? 'medium' : overall >= 40 ? 'high' : 'critical';

  return { overall, riskLevel, dimensions, timestamp: new Date().toISOString() };
}

async function getInfrastructureAnalytics(businessId) {
  const [envs, dns, ssl, capacity, score] = await Promise.all([
    environmentService.getEnvironmentStats(businessId).catch(() => ({ totalEnvironments: 0 })),
    dnsService.getDNSCoverage(businessId).catch(() => ({})),
    sslService.getSSLCoverage(businessId).catch(() => ({})),
    capacityService.getCapacity(businessId).catch(() => ({ storage: { totalMB: 0 }, deployments: { total: 0 } })),
    getInfrastructureScore(businessId)
  ]);
  return { environments: envs, dns, ssl, capacity, score };
}

async function _getDeploymentHealthScore(businessId) {
  const stats = await prisma.deployment.aggregate({
    where: { businessId, isDeleted: false },
    _count: true,
    _max: { createdAt: true }
  }).catch(() => ({ _count: 0, _max: { createdAt: null } }));

  const recentFailures = await prisma.deployment.count({
    where: { businessId, status: { in: ['BUILD_FAILED', 'FAILED'] }, createdAt: { gte: new Date(Date.now() - 86400000 * 7) } }
  }).catch(() => 0);

  if (stats._count === 0) return 50;
  if (recentFailures === 0 && stats._count > 5) return 100;
  if (recentFailures > stats._count * 0.3) return 20;
  if (recentFailures > stats._count * 0.1) return 60;
  return 85;
}

async function _getDRHealthScore(businessId) {
  try {
    const drHealth = require('../../cms-disaster-recovery/services/health.service');
    const result = await drHealth.calculateRecoveryScore(businessId);
    return { score: result?.overall || 50 };
  } catch {
    return { score: 50 };
  }
}

async function _getMonitoringScore() {
  try {
    const monitoringHealth = require('../../cms-monitoring/services/health.service');
    const result = await monitoringHealth.getAggregateHealth();
    return result?.overall === 'healthy' ? 100 : result?.overall === 'degraded' ? 60 : 30;
  } catch {
    return 80;
  }
}

module.exports = { getInfrastructureScore, getInfrastructureAnalytics };

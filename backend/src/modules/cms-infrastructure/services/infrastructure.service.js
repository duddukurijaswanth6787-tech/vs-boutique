const regionService = require('./region.service');
const environmentService = require('./environment.service');
const dnsService = require('./dns.service');
const sslService = require('./ssl.service');
const cdnService = require('./cdn.service');
const capacityService = require('./capacity.service');
const analyticsService = require('./analytics.service');
const prisma = require('../../../utils/prisma');
const { eventBus, Events } = require('../../../services/eventBus');

async function getOverview(businessId) {
  const [envHealth, dnsHealth, sslHealth, cdn, cap, regionHealth, infraScore] = await Promise.all([
    environmentService.getEnvironmentHealth(businessId).catch(() => ({ total: 0, healthy: 0, score: 0 })),
    dnsService.getDNSHealth(businessId).catch(() => ({ total: 0, verified: 0, score: 0 })),
    sslService.getSSLHealth(businessId).catch(() => ({ total: 0, active: 0, score: 0 })),
    cdnService.getCDNHealth(businessId).catch(() => ({ cdnEnabled: false, score: 0 })),
    capacityService.getCapacity(businessId).catch(() => ({ deployments: { total: 0 }, storage: { totalMB: 0 }, score: { overall: 0 } })),
    regionService.getRegionHealth(businessId).catch(() => ({ totalRegions: 0, averageScore: 0 })),
    analyticsService.getInfrastructureScore(businessId).catch(() => ({ overall: 0, riskLevel: 'unknown' }))
  ]);

  return {
    infrastructureScore: infraScore.overall,
    riskLevel: infraScore.riskLevel,
    environments: { total: envHealth.total, healthy: envHealth.healthy, score: envHealth.score },
    dns: { total: dnsHealth.total, verified: dnsHealth.verified, score: dnsHealth.score },
    ssl: { total: sslHealth.total, active: sslHealth.active, score: sslHealth.score },
    cdn: { enabled: cdn.cdnEnabled, score: cdn.score },
    capacity: { deployments: cap.deployments?.total || 0, storageMB: cap.storage?.totalMB || 0, score: cap.score?.overall || 0 },
    regions: { total: regionHealth.totalRegions, score: regionHealth.averageScore },
    timestamp: new Date().toISOString()
  };
}

async function getRegions(businessId) {
  return regionService.getRegions(businessId);
}

async function getEnvironments(businessId) {
  return environmentService.getEnvironments(businessId);
}

async function getServers(businessId) {
  const envs = await environmentService.getEnvironments(businessId);
  return envs.map(e => ({
    id: e.id, name: e.name, type: e.type, status: e.health,
    deploymentCount: e.deploymentCount, domainCount: e.domainCount,
    lastDeployment: e.latestDeployment, recentFailures: e.recentFailures,
    isActive: e.isActive, createdAt: e.createdAt
  }));
}

async function getStorage(businessId) {
  const cap = await capacityService.getCapacity(businessId).catch(() => null);
  return {
    totalMB: cap?.storage?.totalMB || 0,
    totalBytes: cap?.storage?.totalBytes || 0,
    deployments: cap?.deployments?.total || 0,
    environments: cap?.environments || 0,
    artifacts: cap?.artifacts || 0,
    assets: cap?.assets || 0,
    uploads: cap?.uploads || 0,
    score: cap?.score?.storageScore || 0
  };
}

async function getDNS(businessId) {
  return dnsService.getDNSStatus(businessId);
}

async function getSSL(businessId) {
  return sslService.getSSLStatus(businessId);
}

async function getCapacity(businessId) {
  return capacityService.getCapacity(businessId);
}

async function getAnalytics(businessId) {
  return analyticsService.getInfrastructureAnalytics(businessId);
}

async function getHealth(businessId) {
  return analyticsService.getInfrastructureScore(businessId);
}

async function initializeDefaults() {
  const defaults = [
    { key: 'default-region', value: JSON.stringify({ name: 'Default Region', provider: 'aws', locations: ['us-east-1'], status: 'active' }), category: 'region', description: 'Default region for infrastructure' },
    { key: 'default-cdn', value: JSON.stringify({ name: 'Default CDN', provider: 'cloudflare', enabled: true, endpoint: '', regions: ['default'] }), category: 'cdn', description: 'Default CDN configuration' },
    { key: 'max-storage-gb', value: JSON.stringify({ limit: 10, alertThresholdPercent: 80 }), category: 'capacity', description: 'Maximum storage capacity limit' },
    { key: 'max-environments', value: JSON.stringify({ limit: 10 }), category: 'capacity', description: 'Maximum environment limit' },
    { key: 'max-domains', value: JSON.stringify({ limit: 50 }), category: 'capacity', description: 'Maximum domain limit' },
    { key: 'ssl-auto-renew', value: JSON.stringify({ enabled: true, daysBeforeExpiry: 30 }), category: 'ssl', description: 'Auto-renew SSL certificates before expiry' },
    { key: 'dns-propagation-timeout', value: JSON.stringify({ hours: 48 }), category: 'dns', description: 'DNS propagation timeout' },
    { key: 'monitoring-enabled', value: JSON.stringify({ enabled: true, interval: 60 }), category: 'infrastructure', description: 'Enable infrastructure monitoring' }
  ];

  const created = [];
  for (const d of defaults) {
    const existing = await prisma.cmsAiSettings.findFirst({ where: { key: d.key, category: d.category } });
    if (!existing) {
      const s = await prisma.cmsAiSettings.create({ data: d });
      created.push(s);
    }
  }
  return { initialized: true, created: created.length };
}

async function refreshCache() {
  const cache = require('../middleware/infrastructure-cache');
  await cache.delPattern('*');
  return { cleared: true };
}

module.exports = {
  getOverview, getRegions, getEnvironments, getServers, getStorage,
  getDNS, getSSL, getCapacity, getAnalytics, getHealth,
  initializeDefaults, refreshCache,
  region: regionService, environment: environmentService,
  dns: dnsService, ssl: sslService, cdn: cdnService,
  capacity: capacityService, analytics: analyticsService
};

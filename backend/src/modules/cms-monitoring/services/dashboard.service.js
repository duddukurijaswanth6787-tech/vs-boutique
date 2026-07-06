const prisma = require('../../../utils/prisma');
const cache = require('../middleware/monitoring-cache');

class MonitoringDashboardService {
  async getKPIs() {
    const cached = await cache.get('kpis');
    if (cached) return cached;

    const result = {
      deployments: await this._getDeploymentKPIs(),
      queue: await this._getQueueKPIs(),
      subscriptions: await this._getSubscriptionKPIs(),
      marketplace: await this._getMarketplaceKPIs(),
      storage: await this._getStorageKPIs(),
    };

    await cache.set('kpis', result, 60);
    return result;
  }

  async getPerformance() {
    const cached = await cache.get('performance');
    if (cached) return cached;

    const os = require('os');
    const memMB = Math.round(process.memoryUsage().rss / 1024 / 1024);
    const heapMB = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    const totalMemMB = Math.round(os.totalmem() / 1024 / 1024);
    const freeMemMB = Math.round(os.freemem() / 1024 / 1024);

    let activeReqs = 0;
    try {
      const logger = require('../../../middleware/logger');
      activeReqs = logger.activeRequestsCount || 0;
    } catch (e) { console.error('[MonitoringDashboard Service] logger require error:', e); }

    const result = {
      memory: { rssMB: memMB, heapMB, totalMB: totalMemMB, freeMB: freeMemMB, usagePercent: Math.round((1 - freeMemMB / totalMemMB) * 100) },
      cpu: { loadAvg: os.loadavg(), cpus: os.cpus().length },
      process: { uptime: process.uptime(), pid: process.pid, nodeVersion: process.version },
      activeRequests: activeReqs,
      os: { platform: os.platform(), hostname: os.hostname(), uptime: os.uptime() }
    };

    await cache.set('performance', result, 60);
    return result;
  }

  async getSecurity() {
    const cached = await cache.get('security');
    if (cached) return cached;

    const oneDayAgo = new Date(Date.now() - 86400000);

    const [failedLogins, permissionDenied, recentErrors] = await Promise.all([
      prisma.auditLog.count({ where: { actionType: { contains: 'LOGIN_FAILED' }, timestamp: { gte: oneDayAgo } } }).catch(() => 0),
      prisma.auditLog.count({ where: { actionType: { contains: 'PERMISSION_DENIED' }, timestamp: { gte: oneDayAgo } } }).catch(() => 0),
      prisma.auditLog.findMany({ where: { actionType: { in: ['AUTH_FAILED', 'TOKEN_EXPIRED', 'UNAUTHORIZED'] }, timestamp: { gte: oneDayAgo } }, orderBy: { timestamp: 'desc' }, take: 50 }).catch(() => [])
    ]);

    const result = {
      failedLogins24h: failedLogins,
      permissionDenied24h: permissionDenied,
      recentAuthErrors: recentErrors.map(e => ({ action: e.actionType, entityId: e.entityId, performedBy: e.performedBy, ip: e.ipAddress, time: e.timestamp })),
      timestamp: new Date().toISOString()
    };

    await cache.set('security', result, 120);
    return result;
  }

  async _getDeploymentKPIs() {
    try {
      const dep = require('../../cms-deployment/services/deployment.service');
      return await dep.getDeploymentStats();
    } catch { return {}; }
  }

  async _getQueueKPIs() {
    try {
      const dq = require('../../cms-deployment/services/deployment.queue');
      const metrics = dq.getQueueMetrics ? await dq.getQueueMetrics() : {};
      return { queues: metrics };
    } catch { return {}; }
  }

  async _getSubscriptionKPIs() {
    try {
      const subs = require('../../cms-subscriptions/services/subscriptions.service');
      const analytics = await subs.getCategory('analytics');
      return analytics || {};
    } catch { return {}; }
  }

  async _getMarketplaceKPIs() {
    try {
      const mp = require('../../cms-marketplace/services/marketplace.service');
      return await mp.getCategory('analytics');
    } catch { return {}; }
  }

  async _getStorageKPIs() {
    try {
      const metricsService = require('../../cms-deployment/services/metrics.service');
      const metrics = await metricsService.getMetrics();
      const match = metrics.match(/deployment_storage_bytes (\d+)/);
      const bytes = match ? parseInt(match[1]) : 0;
      return { storageBytes: bytes, storageGB: (bytes / 1073741824).toFixed(2) };
    } catch { return {}; }
  }
}

module.exports = new MonitoringDashboardService();

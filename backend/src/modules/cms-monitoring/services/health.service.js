const prisma = require('../../../utils/prisma');
const cache = require('../middleware/monitoring-cache');
const os = require('os');

class MonitoringHealthService {
  async getAggregateHealth() {
    const cached = await cache.get('health');
    if (cached) return cached;

    const [server, db, redis, queue, ssl, ai] = await Promise.all([
      this._getServerHealth(),
      this._getDatabaseHealth(),
      this._getRedisHealth(),
      this._getQueueHealth(),
      this._getSSLHealth(),
      this._getAIHealth()
    ]);

    const statuses = [server, db, redis, queue, ssl, ai].map(s => s.status);
    const allHealthy = statuses.every(s => s === 'healthy' || s === 'connected' || s === 'active');
    const degraded = statuses.some(s => s === 'degraded' || s === 'disconnected');

    const result = {
      overall: allHealthy ? 'healthy' : degraded ? 'degraded' : 'unhealthy',
      server, database: db, redis, queue, ssl, ai,
      timestamp: new Date().toISOString()
    };

    await cache.set('health', result, 30);
    return result;
  }

  async _getServerHealth() {
    try {
      const memMB = Math.round(process.memoryUsage().rss / 1024 / 1024);
      const cpuAvg = os.loadavg ? os.loadavg()[0] : 0;
      return {
        status: 'healthy',
        uptime: process.uptime(),
        memory: `${memMB}MB`,
        cpuLoad: cpuAvg,
        hostname: os.hostname(),
        platform: os.platform(),
        nodeVersion: process.version
      };
    } catch { return { status: 'degraded' }; }
  }

  async _getDatabaseHealth() {
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;
      return { status: 'connected', latencyMs: latency };
    } catch (err) {
      return { status: 'disconnected', error: err.message };
    }
  }

  async _getRedisHealth() {
    try {
      const cacheMod = require('../middleware/monitoring-cache');
      await cacheMod.get('ping');
      return { status: 'connected' };
    } catch { return { status: 'disconnected' }; }
  }

  async _getQueueHealth() {
    try {
      const dq = require('../../cms-deployment/services/deployment.queue');
      const metrics = dq.getQueueMetrics ? await dq.getQueueMetrics() : {};
      const hasActive = Object.values(metrics).some(q => q.active > 0 || q.completed > 0);
      return { status: hasActive ? 'active' : 'idle', queues: metrics };
    } catch { return { status: 'unknown' }; }
  }

  async _getSSLHealth() {
    try {
      const acme = require('../../cms-deployment/services/acme.service');
      const certs = [];
      const domains = await prisma.deploymentDomain.findMany({ where: { isActive: true } });
      for (const d of domains.slice(0, 50)) {
        try {
          const info = await acme.checkCertificateStatus(d.domain);
          certs.push({ domain: d.domain, ...info });
        } catch (e) { console.error('[MonitoringHealth] checkCertificateStatus error:', e); }
      }
      const expired = certs.filter(c => c.status === 'EXPIRED' || (c.daysRemaining !== undefined && c.daysRemaining < 30)).length;
      return { status: expired > 0 ? 'degraded' : 'healthy', total: certs.length, expiringSoon: expired };
    } catch { return { status: 'unknown' }; }
  }

  async _getAIHealth() {
    try {
      const aiHealth = require('../../cms-ai-center/services/health.service');
      const health = await aiHealth.getHealth();
      return { status: health.overall || 'unknown', ...health };
    } catch { return { status: 'unknown' }; }
  }
}

module.exports = new MonitoringHealthService();

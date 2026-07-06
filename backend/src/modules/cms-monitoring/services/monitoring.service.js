const prisma = require('../../../utils/prisma');
const cache = require('../middleware/monitoring-cache');
const healthService = require('./health.service');
const dashboardService = require('./dashboard.service');
const { eventBus, Events } = require('../../../services/eventBus');
const auditService = require('../../../services/auditService');

class MonitoringService {
  async getOverview() {
    const cached = await cache.get('overview');
    if (cached) return cached;

    const [health, kpis, performance, security] = await Promise.all([
      healthService.getAggregateHealth(),
      dashboardService.getKPIs(),
      dashboardService.getPerformance(),
      dashboardService.getSecurity()
    ]);

    const result = { health, kpis, performance, security, timestamp: new Date().toISOString() };
    await cache.set('overview', result, 30);
    return result;
  }

  async getConfig() {
    const rows = await prisma.cmsAiSettings.findMany({
      where: { category: 'monitoring' },
      orderBy: { key: 'asc' }
    });
    const settings = {};
    for (const r of rows) settings[r.key] = r.value;
    return { settings };
  }

  async updateConfig(data, userId = 'SYSTEM', ipAddress = null) {
    const upsertMap = data.settings || data;
    for (const [key, value] of Object.entries(upsertMap)) {
      if (value === null || value === undefined) continue;
      try {
        await prisma.cmsAiSettings.upsert({
          where: { key },
          create: { key, value, category: 'monitoring', description: '' },
          update: { value }
        });
      } catch (e) { console.error('[Monitoring Service] updateConfig upsert error:', e); }
    }
    auditService.logAction('UPDATE_MONITORING_CONFIG', 'monitoring', 'config', userId, { data: upsertMap }, ipAddress);
    await cache.del('overview');
    return this.getConfig();
  }

  async initializeDefaults() {
    const defaults = [
      { key: 'monitoring_enabled', value: true, category: 'monitoring', description: 'Enable monitoring dashboard' },
      { key: 'monitoring_retention_days', value: 90, category: 'monitoring', description: 'Metrics retention in days' },
      { key: 'dashboard_refresh_interval', value: 30, category: 'monitoring', description: 'Dashboard auto-refresh interval (seconds)' },
      { key: 'alert_threshold_cpu', value: 90, category: 'monitoring', description: 'CPU alert threshold (%)' },
      { key: 'alert_threshold_memory', value: 85, category: 'monitoring', description: 'Memory alert threshold (%)' },
      { key: 'alert_threshold_disk', value: 90, category: 'monitoring', description: 'Disk usage alert threshold (%)' },
      { key: 'alert_threshold_slow_requests', value: 1000, category: 'monitoring', description: 'Slow request threshold (ms)' },
      { key: 'alert_threshold_failed_logins', value: 10, category: 'monitoring', description: 'Failed login alert threshold per hour' },
      { key: 'ssl_expiry_alert_days', value: 30, category: 'monitoring', description: 'SSL expiry warning (days)' },
      { key: 'enable_security_monitoring', value: true, category: 'monitoring', description: 'Track security events' },
      { key: 'enable_performance_monitoring', value: true, category: 'monitoring', description: 'Track performance metrics' },
      { key: 'enable_realtime_events', value: true, category: 'monitoring', description: 'Show real-time system events' },
    ];

    let count = 0;
    for (const d of defaults) {
      try {
        await prisma.cmsAiSettings.upsert({ where: { key: d.key }, create: d, update: {} });
        count++;
      } catch (e) { console.error('[Monitoring Service] initializeDefaults upsert error:', e); }
    }

    await cache.del('overview');
    return { initialized: true, count };
  }

  async emitAlert(type, message, data = {}) {
    eventBus.emit(Events.MONITORING_ALERT, { type, message, ...data, timestamp: new Date().toISOString() });
    auditService.logAction(`MONITORING_ALERT_${type.toUpperCase()}`, 'monitoring', type, 'SYSTEM', { message, data });
    return { emitted: true };
  }
}

module.exports = new MonitoringService();

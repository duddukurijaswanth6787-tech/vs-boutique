const prisma = require('../../../utils/prisma');
const cache = require('../middleware/notification-cache');

async function getHealth(businessId) {
  const cacheKey = `health:${businessId}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const [notificationCount, queueStatus, redisStatus, eventBusStatus] = await Promise.all([
    prisma.notification.count(),
    getQueueHealth().catch(() => ({ status: 'unknown' })),
    getRedisHealth().catch(() => ({ status: 'unknown' })),
    getEventBusHealth().catch(() => ({ status: 'unknown' }))
  ]);

  const result = {
    overall: notificationCount >= 0 ? 'healthy' : 'degraded',
    notifications: { status: 'healthy', count: notificationCount },
    queue: queueStatus,
    redis: redisStatus,
    eventBus: eventBusStatus,
    timestamp: new Date().toISOString()
  };

  await cache.set(cacheKey, result, 120);
  return result;
}

async function getQueueHealth() {
  try {
    const queueManager = require('../../ai-core/queues/queueManager');
    const metrics = await queueManager.getQueueMetrics();
    const failed = metrics?.failed || 0;
    return { status: failed > 10 ? 'degraded' : 'healthy', waiting: metrics?.waiting || 0, active: metrics?.active || 0, failed };
  } catch {
    return { status: 'unknown' };
  }
}

async function getRedisHealth() {
  try {
    const Redis = require('ioredis');
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    const testRedis = new Redis(redisUrl, { lazyConnect: true, connectTimeout: 2000, maxRetriesPerRequest: 1 });
    await testRedis.connect();
    await testRedis.ping();
    await testRedis.quit();
    return { status: 'healthy' };
  } catch {
    return { status: 'degraded' };
  }
}

async function getEventBusHealth() {
  try {
    const { eventBus } = require('../../../services/eventBus');
    const listenerCount = eventBus.listenerCount('notification:sent') + eventBus.listenerCount('notification:failed');
    return { status: 'healthy', listenerCount };
  } catch {
    return { status: 'unknown' };
  }
}

async function getProviderHealth(businessId) {
  const configs = await prisma.cmsAiSettings.findMany({
    where: { category: { in: ['email', 'sms', 'push', 'webhook'] } }
  });
  const providers = {};
  for (const cfg of configs) {
    try { providers[cfg.category] = JSON.parse(cfg.value); } catch { providers[cfg.category] = { enabled: false }; }
  }
  return {
    email: providers.email || { enabled: false },
    sms: providers.sms || { enabled: false },
    push: providers.push || { enabled: false },
    webhook: providers.webhook || { enabled: true }
  };
}

async function getDeliveryHealth(businessId) {
  const [totalFailed, totalBounced, pendingCount] = await Promise.all([
    prisma.notification.count({ where: { status: 'failed' } }),
    prisma.notification.count({ where: { status: 'bounced' } }),
    prisma.notification.count({ where: { status: 'pending' } })
  ]);
  return {
    failed: totalFailed,
    bounced: totalBounced,
    pending: pendingCount,
    status: totalFailed > 50 ? 'degraded' : totalFailed > 0 ? 'warning' : 'healthy'
  };
}

async function getMonitoringHealth(businessId) {
  try {
    const monitoringService = require('../../cms-monitoring/services/health.service');
    const health = await monitoringService.getAggregateHealth();
    return health;
  } catch {
    return { overall: 'unknown' };
  }
}

module.exports = { getHealth, getQueueHealth, getRedisHealth, getEventBusHealth, getProviderHealth, getDeliveryHealth, getMonitoringHealth };

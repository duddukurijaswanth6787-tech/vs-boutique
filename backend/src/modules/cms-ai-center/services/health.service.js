const prisma = require('../../../utils/prisma');
const cache = require('../middleware/ai-center-cache');
const providerService = require('./provider.service');

class AiHealthService {
  async getHealth() {
    const cached = await cache.get('ai:health:overview');
    if (cached) return cached;

    const providers = await prisma.cmsAiProvider.findMany({
      select: { id: true, name: true, provider: true, key: true, model: true, isEnabled: true, priority: true, healthStatus: true, healthMessage: true, lastHealthCheck: true, timeout: true }
    });

    const agents = await prisma.cmsAiAgent.findMany({
      select: { id: true, name: true, key: true, category: true, isEnabled: true, healthStatus: true, version: true, providerId: true }
    });

    const redisStatus = await this._checkRedis();
    const queueStatus = await this._checkQueue();

    const result = {
      overall: providers.some(p => p.healthStatus === 'healthy' || p.healthStatus === 'online') ? 'healthy' : 'degraded',
      providers,
      agents,
      infrastructure: {
        redis: redisStatus,
        queue: queueStatus
      },
      timestamp: new Date().toISOString()
    };

    await cache.set('ai:health:overview', result, 60);
    return result;
  }

  async runHealthCheck() {
    await providerService.checkAll();
    await cache.del('ai:health:*');
    return this.getHealth();
  }

  async _checkRedis() {
    try {
      const Redis = require('ioredis');
      const client = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
        lazyConnect: true, maxRetriesPerRequest: 1, connectTimeout: 2000, retryStrategy: () => null
      });
      await client.ping();
      client.disconnect();
      return { status: 'connected', latency: 'low' };
    } catch {
      return { status: 'disconnected', latency: 'n/a' };
    }
  }

  async _checkQueue() {
    try {
      const queueManager = require('../../ai-core/queues/queueManager');
      return { status: queueManager.useRedis ? 'bullmq' : 'in-memory', mode: queueManager.useRedis ? 'redis' : 'fallback' };
    } catch {
      return { status: 'unknown', mode: 'error' };
    }
  }
}

module.exports = new AiHealthService();

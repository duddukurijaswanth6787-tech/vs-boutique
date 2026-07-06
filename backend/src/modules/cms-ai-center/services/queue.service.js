const cache = require('../middleware/ai-center-cache');
const queueManager = require('../../ai-core/queues/queueManager');
const eventBus = require('../../../services/eventBus').eventBus;

class AiQueueService {
  async getStatus() {
    const cached = await cache.get('ai:queue:status');
    if (cached) return cached;

    const workerCount = queueManager.workersMap?.size || 0;
    const queueNames = Array.from(queueManager.workersMap?.keys() || []);
    const redisConnected = queueManager.useRedis;

    const queueMetrics = {};
    for (const [name, queue] of Object.entries(queueManager.queues || {})) {
      try {
        const [waiting, active, completed, failed] = await Promise.all([
          queue.getWaitingCount(),
          queue.getActiveCount(),
          queue.getCompletedCount(),
          queue.getFailedCount()
        ]).catch(() => [0, 0, 0, 0]);
        queueMetrics[name] = { waiting, active, completed, failed };
      } catch {
        queueMetrics[name] = { waiting: 0, active: 0, completed: 0, failed: 0 };
      }
    }

    const result = {
      redis: redisConnected,
      mode: redisConnected ? 'bullmq' : 'in-memory',
      workers: workerCount,
      queues: queueMetrics,
      queueNames
    };

    await cache.set('ai:queue:status', result, 30);
    return result;
  }

  async getJobDetails(queueName, jobId) {
    const queue = queueManager.queues?.[queueName];
    if (!queue) return null;
    try {
      const job = await queue.getJob(jobId);
      if (!job) return null;
      return {
        id: job.id,
        name: job.name,
        data: job.data,
        status: await job.getState(),
        progress: job.progress,
        attemptsMade: job.attemptsMade,
        failedReason: job.failedReason,
        timestamp: job.timestamp,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        returnvalue: job.returnvalue
      };
    } catch {
      return null;
    }
  }

  async retryJob(queueName, jobId) {
    const queue = queueManager.queues?.[queueName];
    if (!queue) return false;
    try {
      const job = await queue.getJob(jobId);
      if (!job) return false;
      await job.retry();
      return true;
    } catch {
      return false;
    }
  }

  async getWorkers() {
    return Array.from(queueManager.workersMap?.entries() || []).map(([name, fn]) => ({
      queue: name,
      registered: true,
      hasHandler: typeof fn === 'function'
    }));
  }
}

module.exports = new AiQueueService();

const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');

class DeploymentQueue {
  constructor() {
    this.useRedis = false;
    this.redisClient = null;
    this.queues = {};
    this.redisWorkers = {};
    this._handlers = {};
    this._initializeRedis();
  }

  _initializeRedis() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
      this.redisClient = new IORedis(redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        connectTimeout: 1000
      });

      this.redisClient.on('error', (err) => {
        if (!this.useRedis && err.code === 'ECONNREFUSED') {
          this.useRedis = false;
        }
      });

      this.redisClient.on('connect', () => {
        this.useRedis = true;
      });
    } catch (err) {
      this.useRedis = false;
    }
  }

  get connected() {
    return this.useRedis;
  }

  async enqueue(jobType, data) {
    const queueName = `deployment-${jobType}`;
    if (this.useRedis && this.redisClient) {
      try {
        if (!this.queues[queueName]) {
          this.queues[queueName] = new Queue(queueName, { connection: this.redisClient });
        }
        await this.queues[queueName].add(jobType, data, {
          attempts: data.retries || 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: 100,
          removeOnFail: 50
        });
        return true;
      } catch (err) {
        console.warn(`[DeploymentQueue] BullMQ enqueue failed: ${err.message}. Using in-memory.`);
      }
    }
    setImmediate(() => this._processInMemory(jobType, data));
    return false;
  }

  registerWorker(jobType, handler) {
    this._handlers[jobType] = handler;
    const queueName = `deployment-${jobType}`;
    if (this.useRedis && this.redisClient) {
      try {
        const worker = new Worker(queueName, async (job) => {
          return handler(job.data);
        }, { connection: this.redisClient, concurrency: 3 });

        worker.on('failed', (job, err) => {
          console.error(`[DeploymentQueue] Job ${job.id} on ${queueName} failed: ${err.message}`);
        });

        worker.on('completed', (job) => {
          console.warn(`[DeploymentQueue] Job ${job.id} on ${queueName} completed`);
        });

        this.redisWorkers[queueName] = worker;
      } catch (err) {
        console.error(`[DeploymentQueue] Failed to register BullMQ worker: ${err.message}`);
      }
    }
  }

  async getQueueMetrics() {
    const metrics = { redis: this.useRedis, queues: {} };
    for (const [name, queue] of Object.entries(this.queues)) {
      try {
        const [waiting, active, completed, failed] = await Promise.all([
          queue.getWaitingCount(),
          queue.getActiveCount(),
          queue.getCompletedCount(),
          queue.getFailedCount()
        ]);
        metrics.queues[name] = { waiting, active, completed, failed };
      } catch {
        metrics.queues[name] = { waiting: 0, active: 0, completed: 0, failed: 0 };
      }
    }
    return metrics;
  }

  async _processInMemory(jobType, data) {
    const handler = this._handlers?.[jobType];
    if (handler) {
      try {
        await handler(data);
      } catch (err) {
        console.error(`[DeploymentQueue] In-memory job ${jobType} failed: ${err.message}`);
      }
    }
  }
}

module.exports = new DeploymentQueue();

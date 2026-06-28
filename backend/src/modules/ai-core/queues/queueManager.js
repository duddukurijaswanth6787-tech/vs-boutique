const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const eventBus = require('../utils/eventBus');
const logger = require('../utils/logger');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class QueueManager {
  constructor() {
    this.workersMap = new Map();
    this.useRedis = false;
    this.redisClient = null;
    this.queues = {};
    this.redisWorkers = {};
    this._initializeRedis();
  }

  _initializeRedis() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
      logger.info(`Attempting to connect to Redis at: ${redisUrl}`);
      
      this.redisClient = new IORedis(redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        connectTimeout: 1000 // 1s timeout to check local presence
      });

      this.redisClient.on('error', (err) => {
        if (!this.useRedis && err.code === 'ECONNREFUSED') {
          logger.warn(`Redis connection refused on ${redisUrl}. Falling back to InMemory queue processing.`);
          this.useRedis = false;
        }
      });

      this.redisClient.on('connect', () => {
        logger.info('Successfully established connection to Redis. Enabling BullMQ pipeline queues.');
        this.useRedis = true;
      });
    } catch (err) {
      logger.warn(`Redis initialization failed: ${err.message}. Defaulting to InMemory Queue.`);
      this.useRedis = false;
    }
  }

  registerWorker(queueName, workerFn) {
    logger.info(`Registering pipeline worker for queue: ${queueName}`);
    this.workersMap.set(queueName, workerFn);

    // If Redis is online, register a real BullMQ worker thread
    if (this.useRedis && this.redisClient) {
      try {
        const worker = new Worker(queueName, async (job) => {
          logger.info(`[BullMQ Worker] Executing task on queue '${queueName}' for job: ${job.id}`);
          return workerFn(job.data);
        }, {
          connection: this.redisClient
        });

        worker.on('failed', (job, err) => {
          logger.error(`[BullMQ Worker Error] Job ${job.id} on queue ${queueName} failed: ${err.message}`);
        });

        this.redisWorkers[queueName] = worker;
      } catch (err) {
        logger.error(`Failed to register BullMQ worker for ${queueName}: ${err.message}`);
      }
    }
  }

  async enqueue(queueName, jobData) {
    const { sessionId, executionId, retryPolicy = { maxRetries: 3, backoffMs: 50 } } = jobData;

    logger.info(`Enqueue requested on queue '${queueName}' (Active Redis Pipeline: ${this.useRedis})`);

    if (this.useRedis && this.redisClient) {
      try {
        if (!this.queues[queueName]) {
          this.queues[queueName] = new Queue(queueName, { connection: this.redisClient });
        }
        await this.queues[queueName].add('task', jobData, {
          attempts: retryPolicy.maxRetries,
          backoff: {
            type: 'exponential',
            delay: retryPolicy.backoffMs
          }
        });
        return;
      } catch (err) {
        logger.warn(`BullMQ queue enqueue failed: ${err.message}. Falling back to InMemory processing.`);
      }
    }

    // Local In-Memory Fallback Processor
    setImmediate(async () => {
      await this._processJobInMemory(queueName, jobData, retryPolicy);
    });
  }

  async _processJobInMemory(queueName, jobData, retryPolicy, attempt = 1) {
    const { sessionId, executionId } = jobData;
    const workerFn = this.workersMap.get(queueName);

    if (!workerFn) {
      const errMsg = `No worker registered for queue: ${queueName}`;
      logger.error(errMsg);
      await this._failJob(executionId, errMsg);
      return;
    }

    try {
      await prisma.aIExecution.update({
        where: { id: executionId },
        data: { status: 'PROCESSING' }
      });

      await prisma.aIExecutionLog.create({
        data: {
          executionId,
          level: 'INFO',
          message: `Worker started processing queue: ${queueName} (Attempt ${attempt}/${retryPolicy.maxRetries})`
        }
      });

      eventBus.publish('AgentStarted', sessionId, { queueName, executionId });

      const startTime = Date.now();
      const output = await workerFn(jobData);
      const latencyMs = Date.now() - startTime;

      await prisma.aIExecution.update({
        where: { id: executionId },
        data: {
          status: 'COMPLETED',
          outputPayload: output,
          latencyMs,
          retryCount: attempt - 1
        }
      });

      await prisma.aIExecutionLog.create({
        data: {
          executionId,
          level: 'INFO',
          message: `Worker completed processing queue: ${queueName} successfully in ${latencyMs}ms.`
        }
      });

      eventBus.publish('AgentCompleted', sessionId, { queueName, executionId, output });
    } catch (err) {
      logger.warn(`Job failed on queue '${queueName}': ${err.message}`);

      await prisma.aIExecutionLog.create({
        data: {
          executionId,
          level: 'WARN',
          message: `Execution failed: ${err.message}.`
        }
      });

      if (attempt < retryPolicy.maxRetries) {
        const nextAttempt = attempt + 1;
        const delay = retryPolicy.backoffMs * Math.pow(2, attempt - 1);

        await prisma.aIExecution.update({
          where: { id: executionId },
          data: { status: 'RETRYING' }
        });

        await prisma.aIExecutionLog.create({
          data: {
            executionId,
            level: 'INFO',
            message: `Retrying queue ${queueName} in ${delay}ms...`
          }
        });

        eventBus.publish('AgentRetrying', sessionId, { queueName, executionId, attempt: nextAttempt });

        setTimeout(async () => {
          await this._processJobInMemory(queueName, jobData, retryPolicy, nextAttempt);
        }, delay);
      } else {
        await this._failJob(executionId, err.message, attempt - 1);
        eventBus.publish('AgentFailed', sessionId, { queueName, executionId, error: err.message });
      }
    }
  }

  async _failJob(executionId, errorMessage, retryCount = 0) {
    await prisma.aIExecution.update({
      where: { id: executionId },
      data: {
        status: 'FAILED',
        retryCount
      }
    });

    await prisma.aIExecutionLog.create({
      data: {
        executionId,
        level: 'ERROR',
        message: `Execution permanently failed: ${errorMessage}`
      }
    });
  }
}

module.exports = new QueueManager();

import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

/**
 * Service to manage the connection to Redis.
 * Handles client lifecycle and health checks.
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const isRedisEnabled = this.configService.get<boolean>(
      'app.features.redis',
      true,
    );
    const isProduction =
      this.configService.get<string>('app.env') === 'production';
    if (!isRedisEnabled) {
      if (isProduction) {
        throw new Error('Redis must be enabled in production environment.');
      }
      this.logger.log(
        'Redis is disabled by configuration. Initializing in-memory mock client.',
      );
      const localStore = new Map<string, string>();
      this.client = {
        get: async (key: string) => localStore.get(key) || null,
        set: async (key: string, value: string) => {
          localStore.set(key, value);
          return 'OK';
        },
        del: async (...keys: any[]) => {
          let count = 0;
          const flatKeys = keys.flat();
          for (const key of flatKeys) {
            if (localStore.delete(key)) count++;
          }
          return count;
        },
        keys: async (pattern: string) => {
          const regexStr = pattern.replace(/\*/g, '.*');
          const regex = new RegExp(`^${regexStr}$`);
          return Array.from(localStore.keys()).filter((k) => regex.test(k));
        },
        ping: async () => 'PONG',
        on: (event: string, callback: (...args: any[]) => void) => {
          if (event === 'connect') {
            setTimeout(callback, 0);
          }
          return this.client;
        },
        quit: async () => 'OK',
      } as unknown as Redis;
      return;
    }

    this.logger.log('Initializing Redis client...');
    const host = this.configService.get<string>('app.redis.host', 'localhost');
    const port = this.configService.get<number>('app.redis.port', 6379);
    const password = this.configService.get<string>('app.redis.password', '');
    const db = this.configService.get<number>('app.redis.db', 0);

    // ponytail: configure standard Redis client with proper settings
    this.client = new Redis({
      host,
      port,
      password: password || undefined,
      db,
      maxRetriesPerRequest: null, // Required configuration for compatibility with BullMQ
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('connect', () => {
      this.logger.log('Successfully connected to Redis.');
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis Client Error:', err);
    });
  }

  async onModuleDestroy() {
    this.logger.log('Closing Redis connection...');
    try {
      await this.client.quit();
      this.logger.log('Redis connection closed successfully.');
    } catch (err) {
      this.logger.error('Error closing Redis connection:', err);
    }
  }

  /**
   * Retrieves the raw Redis client.
   */
  getClient(): Redis {
    return this.client;
  }

  /**
   * Checks the health of the Redis connection.
   */
  async ping(): Promise<boolean> {
    try {
      const response = await this.client.ping();
      return response === 'PONG';
    } catch (error) {
      this.logger.error('Redis health check ping failed:', error);
      return false;
    }
  }
}

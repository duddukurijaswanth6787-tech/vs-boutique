import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

// ponytail: global counters for cache hit/miss telemetry
export interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  dels: number;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private hits = 0;
  private misses = 0;
  private sets = 0;
  private dels = 0;

  constructor(private readonly redisService: RedisService) {}

  getMetrics(): CacheMetrics {
    return {
      hits: this.hits,
      misses: this.misses,
      sets: this.sets,
      dels: this.dels,
    };
  }

  resetMetrics(): void {
    this.hits = 0;
    this.misses = 0;
    this.sets = 0;
    this.dels = 0;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redisService.getClient().get(key);
      if (data !== null) {
        this.hits++;
        return JSON.parse(data);
      }
      this.misses++;
      return null;
    } catch {
      this.misses++;
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds = 300): Promise<void> {
    try {
      await this.redisService
        .getClient()
        .set(key, JSON.stringify(value), 'EX', ttlSeconds);
      this.sets++;
    } catch {
      this.logger.warn(`Cache set failed for key ${key}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redisService.getClient().del(key);
      this.dels++;
    } catch {
      this.logger.warn(`Cache delete failed for key ${key}`);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      const client = this.redisService.getClient();
      let cursor = '0';
      const batch: string[] = [];
      do {
        const result = await client.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100,
        );
        cursor = result[0];
        batch.push(...result[1]);
      } while (cursor !== '0');
      if (batch.length) {
        await client.del(...batch);
        this.dels += batch.length;
      }
    } catch {
      this.logger.warn(`Cache pattern delete failed for ${pattern}`);
    }
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds = 300,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const value = await factory();
    await this.set(key, value, ttlSeconds);
    return value;
  }
}

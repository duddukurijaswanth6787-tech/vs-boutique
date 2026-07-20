import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { LoggerService } from '@common/logger/logger.service';
import { DATABASE_CONSTANTS } from './database.constants';

/**
 * Service for interacting with the database using Prisma.
 * Handles database connection initialization, event-based logging, and
 * graceful clean disconnection on application shutdown.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private connected = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
  ) {
    const url = configService.get<string>('app.database.url') || '';
    // ponytail: driver default pool is 10; bump for concurrent admin/report queries
    const adapter = new PrismaPg({ connectionString: url, max: 20 });
    const env = configService.get<string>('app.env', 'development');
    super({
      adapter,
      log: [
        // ponytail: query-level logging only in non-production
        ...(env !== 'production'
          ? [{ emit: 'event' as const, level: 'query' as const }]
          : []),
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
    });
  }

  async onModuleInit() {
    this.loggerService.log('Connecting to PostgreSQL database via Prisma...');
    const maxRetries = DATABASE_CONSTANTS.RETRY_COUNT;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await this.$connect();
        this.connected = true;
        this.loggerService.log(
          'Successfully connected to PostgreSQL database.',
        );
        this.setupEventListeners();
        return;
      } catch (error) {
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10_000);
          this.loggerService.warn(
            `Database connection attempt ${attempt + 1} failed. Retrying in ${delay}ms...`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          this.loggerService.error(
            'Failed to connect to PostgreSQL database after retries:',
            error instanceof Error ? error.message : String(error),
          );
          // ponytail: exit process on DB connection failure after all retries
          process.exit(1);
        }
      }
    }
  }

  private setupEventListeners() {
    const client = this as unknown as {
      $on(
        event: 'query' | 'info' | 'warn' | 'error',
        callback: (event: {
          query?: string;
          params?: string;
          duration?: number;
          message?: string;
        }) => void,
      ): void;
    };
    const slowQueryThreshold = this.configService.get<number>(
      'app.database.slowQueryThreshold',
      DATABASE_CONSTANTS.SLOW_QUERY_THRESHOLD,
    );

    client.$on('query', (e) => {
      const duration = e.duration || 0;
      if (duration > slowQueryThreshold) {
        this.loggerService.warn(
          {
            query: e.query,
            params: e.params,
            duration,
            threshold: slowQueryThreshold,
          },
          'PrismaSlowQuery',
        );
      }
      const env = this.configService.get<string>('app.env', 'development');
      if (env !== 'production') {
        this.loggerService.debug(
          `Query: ${e.query || ''} | Params: ${e.params || ''} | Duration: ${duration}ms`,
          'PrismaQuery',
        );
      }
    });
    client.$on('error', (e) => {
      this.loggerService.error(`Prisma Error: ${e.message || ''}`);
    });
    client.$on('warn', (e) => {
      this.loggerService.warn(`Prisma Warning: ${e.message || ''}`);
    });
    client.$on('info', (e) => {
      this.loggerService.log(`Prisma Info: ${e.message || ''}`);
    });
  }

  async onModuleDestroy() {
    this.loggerService.log('Disconnecting from PostgreSQL database...');
    await this.$disconnect();
    this.connected = false;
  }

  /**
   * Performs a simple database query to verify connection health.
   */
  async ping(): Promise<boolean> {
    try {
      await this.$executeRawUnsafe('SELECT 1');
      return true;
    } catch (error) {
      this.loggerService.error(
        'Database ping failed:',
        error instanceof Error ? error.message : String(error),
      );
      return false;
    }
  }

  get isConnected(): boolean {
    return this.connected;
  }
}

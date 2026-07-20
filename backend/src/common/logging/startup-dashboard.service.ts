import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../logger/logger.service';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class StartupDashboardService {
  constructor(
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
    private readonly prismaService: PrismaService,
  ) {}

  async printDashboard() {
    const env = this.configService.get<string>('app.env', 'development');
    const port = this.configService.get<number>('app.port', 4000);
    const apiBase = `http://localhost:${port}/api/v1`;
    const swagger = `http://localhost:${port}/api/docs`;
    const health = `http://localhost:${port}/health`;

    // Database status
    const dbConnected = this.prismaService.isConnected;
    const databaseStatus = dbConnected ? 'CONNECTED' : 'DISCONNECTED';

    // Redis status
    const isRedisEnabled = this.configService.get<boolean>(
      'app.features.redis',
      true,
    );
    const redisStatus = isRedisEnabled ? 'CONNECTED' : 'DISABLED';

    // Queue status
    const isBullMQEnabled = this.configService.get<boolean>(
      'app.features.bullmq',
      true,
    );
    const queueStatus = isBullMQEnabled ? 'READY' : 'DISABLED';

    // Storage status
    const storageProvider = this.configService.get<string>(
      'app.storage.provider',
      'local',
    );
    const storageStatus = storageProvider === 's3' ? 'AWS S3' : 'LOCAL';

    this.loggerService.logStartupDashboard({
      env,
      port,
      apiBase,
      swagger,
      health,
      database: databaseStatus,
      redis: redisStatus,
      queue: queueStatus,
      storage: storageStatus,
    });
  }
}

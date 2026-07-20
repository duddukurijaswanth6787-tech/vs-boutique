import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_METADATA } from '@common/constants';

@Injectable()
export class MonitoringService {
  readonly startTime = Date.now();
  readonly slowRequestThreshold: number;

  requestCount = 0;
  successCount = 0;
  errorCount = 0;
  totalResponseTime = 0;
  slowRequestCount = 0;

  constructor(private readonly configService: ConfigService) {
    this.slowRequestThreshold = this.configService.get<number>(
      'app.monitoring.slowRequestThreshold',
      1000,
    );
  }

  getSnapshot(): Record<string, unknown> {
    const elapsed = Date.now() - this.startTime;
    const mem = process.memoryUsage();
    const totalReqs = this.requestCount;

    return {
      app: {
        name: APP_METADATA.NAME,
        version: APP_METADATA.VERSION,
        environment: this.configService.get<string>('app.env'),
        uptime: process.uptime(),
        startTime: new Date(this.startTime).toISOString(),
        elapsed: `${(elapsed / 1000 / 60).toFixed(1)} minutes`,
      },
      process: {
        pid: process.pid,
        nodeVersion: process.version,
        platform: process.platform,
        hostname: this.configService.get<string>('app.hostname', 'localhost'),
        memory: {
          rss: `${(mem.rss / 1024 / 1024).toFixed(2)} MB`,
          heapTotal: `${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`,
          heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        },
      },
      http: {
        totalRequests: totalReqs,
        successCount: this.successCount,
        errorCount: this.errorCount,
        successRate:
          totalReqs > 0
            ? `${((this.successCount / totalReqs) * 100).toFixed(2)}%`
            : '0%',
        avgResponseTime:
          totalReqs > 0
            ? `${(this.totalResponseTime / totalReqs).toFixed(0)}ms`
            : '0ms',
        slowRequests: this.slowRequestCount,
      },
    };
  }
}

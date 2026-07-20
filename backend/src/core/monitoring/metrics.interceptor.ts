import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MonitoringService } from './monitoring.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly monitoringService: MonitoringService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    // ponytail: skip metrics endpoint to avoid self-inflation
    if (
      typeof request.url === 'string' &&
      request.url.includes('/health/metrics')
    ) {
      return next.handle();
    }

    const start = Date.now();
    this.monitoringService.requestCount++;

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - start;
          this.monitoringService.totalResponseTime += duration;
          this.monitoringService.successCount++;
          if (duration > this.monitoringService.slowRequestThreshold) {
            this.monitoringService.slowRequestCount++;
          }
        },
        error: () => {
          this.monitoringService.errorCount++;
        },
      }),
    );
  }
}

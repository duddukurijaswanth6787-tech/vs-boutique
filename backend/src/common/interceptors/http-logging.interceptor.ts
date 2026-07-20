import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as http from 'http';
import crypto from 'crypto';
import { LoggerService } from '../logger/logger.service';
import {
  HTTP_LOG_CONTEXT_SYMBOL,
  HttpLoggingContext,
} from '../logging/http-log-context';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();

    // Skip interception if not an HTTP request (e.g. microservice/ws/etc)
    if (!request || !request.method) {
      return next.handle();
    }

    let logCtx = request[HTTP_LOG_CONTEXT_SYMBOL] as HttpLoggingContext;
    if (!logCtx) {
      logCtx = {
        requestId: crypto.randomUUID(),
        startTime: process.hrtime.bigint(),
        incomingLogged: false,
        errorLogged: false,
      };
      request[HTTP_LOG_CONTEXT_SYMBOL] = logCtx;
    }

    logCtx.controller = context.getClass().name;
    logCtx.handler = context.getHandler().name;

    const isLogEnabled = this.configService.get<boolean>(
      'app.httpLog.enabled',
      true,
    );
    const path = request.originalUrl || request.url;
    const isHealthPath =
      path.includes('/health') || path.includes('/api/v1/health');
    const isHealthLogged = this.configService.get<boolean>(
      'app.httpLog.healthRequests',
      false,
    );
    const shouldLog = isLogEnabled && (!isHealthPath || isHealthLogged);

    if (shouldLog && !logCtx.incomingLogged) {
      this.loggerService.logHttpRequest(logCtx, request);
      logCtx.incomingLogged = true;
    }

    return next.handle().pipe(
      tap({
        next: (body) => {
          if (shouldLog) {
            const response = ctx.getResponse();
            const durationNs = process.hrtime.bigint() - logCtx.startTime;
            const durationMs = Number(durationNs) / 1_000_000;
            const statusCode = response.statusCode || 200;
            const statusText = http.STATUS_CODES[statusCode] || '';

            this.loggerService.logHttpResponse(
              logCtx,
              request,
              statusCode,
              statusText,
              body,
              Math.round(durationMs),
            );

            // ponytail: flag slow requests at 500ms threshold — same logger, separate level
            if (durationMs > 500) {
              this.loggerService.warn(
                `Slow request: ${request.method} ${request.originalUrl || request.url} took ${Math.round(durationMs)}ms (${statusCode})`,
                'SlowRequest',
              );
            }
          }
        },
      }),
    );
  }
}

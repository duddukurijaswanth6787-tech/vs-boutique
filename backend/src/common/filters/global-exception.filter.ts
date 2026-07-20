import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  Injectable,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import * as http from 'http';
import crypto from 'crypto';
import { GlobalExceptionMapper, BaseException } from '../exceptions';
import { LoggerService } from '../logger/logger.service';
import {
  HTTP_LOG_CONTEXT_SYMBOL,
  HttpLoggingContext,
} from '../logging/http-log-context';
import { validateAndSanitizeRequestId } from '../logging/http-log-serializer';

/**
 * Global exception filter capturing all runtime exceptions.
 * Uses GlobalExceptionMapper to normalize exceptions and outputs them in the enterprise standard JSON format.
 * Coordinates with HTTP logging interceptor to log exactly one request / error block.
 */
@Catch()
@Injectable()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Special handling for Terminus health check ServiceUnavailableException
    if (
      exception instanceof HttpException &&
      (exception.getStatus() === 503 ||
        (request.url && request.url.includes('/health')))
    ) {
      const status = exception.getStatus();
      const resObj = exception.getResponse();

      // Set correlation ID response headers
      const correlationId =
        (request as any)[HTTP_LOG_CONTEXT_SYMBOL]?.requestId ||
        crypto.randomUUID();
      response.setHeader('x-correlation-id', correlationId);
      response.setHeader('x-request-id', correlationId);
      response.status(status).json(resObj);
      return;
    }

    // Map any low-level exception to our enterprise BaseException
    const baseException: BaseException = GlobalExceptionMapper.map(exception);
    const status = baseException.getStatus();
    const errorCode = baseException.errorCode;
    const message = baseException.message;
    const metadata = baseException.metadata;

    // Retrieve or initialize correlation ID / context
    let logCtx = (request as any)[
      HTTP_LOG_CONTEXT_SYMBOL
    ] as HttpLoggingContext;
    if (!logCtx) {
      const rawIncomingId =
        (request.headers['x-correlation-id'] as string) ||
        (request.headers['x-request-id'] as string) ||
        '';
      const validatedId = validateAndSanitizeRequestId(rawIncomingId);
      const correlationId = validatedId || crypto.randomUUID();
      logCtx = {
        requestId: correlationId,
        startTime: process.hrtime.bigint(),
        incomingLogged: false,
        errorLogged: false,
      };
      (request as any)[HTTP_LOG_CONTEXT_SYMBOL] = logCtx;
    }

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

    // If incoming request block was not logged (e.g. error in middleware/guard), log it now
    if (shouldLog && !logCtx.incomingLogged) {
      this.loggerService.logHttpRequest(logCtx, request);
      logCtx.incomingLogged = true;
    }

    const durationNs = process.hrtime.bigint() - logCtx.startTime;
    const durationMs = Number(durationNs) / 1_000_000;
    const statusText = http.STATUS_CODES[status] || '';

    // Standard Enterprise Error Response format
    const errorResponse = {
      success: false,
      error: baseException.name || 'HttpException',
      code: errorCode,
      message,
      timestamp: baseException.timestamp,
      correlationId: logCtx.requestId,
      path: request.url,
      metadata: metadata || {},
    };

    const isProd = this.configService.get<string>('app.env') === 'production';

    // Log the exception details in the unified format (only once)
    if (shouldLog && !logCtx.errorLogged) {
      this.loggerService.logHttpError(
        logCtx,
        request,
        status,
        statusText,
        baseException.name || 'HttpException',
        message,
        errorResponse,
        Math.round(durationMs),
        isProd ? undefined : baseException.stack,
      );
      logCtx.errorLogged = true;
    }

    // Set the standard request-id response header just in case
    response.setHeader('x-correlation-id', logCtx.requestId);
    response.setHeader('x-request-id', logCtx.requestId);

    response.status(status).json(errorResponse);
  }
}

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { loggerContextStorage } from '../logger/logger.context';
import { RequestContext } from '../types';
import { validateAndSanitizeRequestId } from '../logging/http-log-serializer';
import {
  HTTP_LOG_CONTEXT_SYMBOL,
  HttpLoggingContext,
} from '../logging/http-log-context';

/**
 * Middleware that extracts or generates a Correlation ID for each request.
 * Validates incoming correlation IDs (rejects malformed ones by generating a fresh UUID).
 * Sets the Correlation ID on response headers and initializes request-scoped metadata
 * in AsyncLocalStorage.
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const rawIncomingId =
      (req.headers['x-correlation-id'] as string) ||
      (req.headers['x-request-id'] as string) ||
      '';

    const validatedId = validateAndSanitizeRequestId(rawIncomingId);
    const correlationId = validatedId || crypto.randomUUID();

    // Attach correlation ID to response headers
    res.setHeader('x-correlation-id', correlationId);
    res.setHeader('x-request-id', correlationId);

    // Initialize HTTP Logging Context
    const logCtx: HttpLoggingContext = {
      requestId: correlationId,
      startTime: process.hrtime.bigint(),
      incomingLogged: false,
      errorLogged: false,
    };
    (req as any)[HTTP_LOG_CONTEXT_SYMBOL] = logCtx;

    const context: RequestContext = {
      requestId: correlationId,
      ip: req.ip || req.socket.remoteAddress || '',
      userAgent: req.headers['user-agent'] || '',
    };

    // ponytail: store context in AsyncLocalStorage and execute the next hook
    loggerContextStorage.run(context, () => {
      next();
    });
  }
}

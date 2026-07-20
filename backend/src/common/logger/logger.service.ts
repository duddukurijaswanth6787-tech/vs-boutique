import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { pino, Logger } from 'pino';
import { loggerContextStorage } from './logger.context';
import { maskSensitiveData } from '../utils/logger.utils';
import { HttpLoggingContext } from '../logging/http-log-context';
import {
  formatAndTruncate,
  redactObject,
} from '../logging/http-log-serializer';

/**
 * Enterprise structured Logger Service that implements NestJS LoggerService.
 * Wraps pino to provide context tracking, correlation IDs, parameter masking, and configuration flags.
 */
@Injectable()
export class LoggerService implements NestLoggerService {
  private pinoLogger!: Logger;
  private isLoggerEnabled = true;

  constructor(private readonly configService: ConfigService) {
    this.init();
  }

  /**
   * Initializes the Pino client using runtime configs.
   */
  private init() {
    this.isLoggerEnabled = this.configService.get<boolean>(
      'app.features.logger',
      true,
    );
    const env = this.configService.get<string>('app.env', 'development');
    const isProd = env === 'production';

    // ponytail: use pretty-print in dev and standard JSON in production
    this.pinoLogger = pino({
      level: isProd ? 'info' : 'debug',
      enabled: this.isLoggerEnabled,
      transport: isProd
        ? undefined
        : {
            target: 'pino-pretty',
            options: {
              singleLine: true,
              colorize: true,
              translateTime: 'SYS:standard',
            },
          },
    });
  }

  /**
   * Assembles context metadata by pulling details from AsyncLocalStorage.
   */
  private getContextData(context?: string) {
    const store = loggerContextStorage.getStore();
    return {
      requestId: store?.requestId,
      ip: store?.ip,
      userAgent: store?.userAgent,
      context: context || 'Application',
      environment: this.configService.get<string>('app.env', 'development'),
      version: '1.0.0',
    };
  }

  private shouldSuppress(context?: string): boolean {
    if (!context) return false;
    const env = this.configService.get<string>('app.env', 'development');
    if (env !== 'development') return false;
    const suppressed = [
      'InstanceLoader',
      'RoutesResolver',
      'RouterExplorer',
      'LegacyRouteConverter',
      'NestFactory',
      'NestApplication',
    ];
    return suppressed.includes(context);
  }

  /**
   * Logs an info level message.
   */
  log(message: any, context?: string) {
    if (this.shouldSuppress(context)) return;
    if (!this.isLoggerEnabled) return;
    const ctxData = this.getContextData(context);
    const masked = maskSensitiveData(message);
    const isStr = typeof masked === 'string';
    this.pinoLogger.info({
      ...ctxData,
      msg: isStr ? masked : undefined,
      data: !isStr ? masked : undefined,
    });
  }

  /**
   * Logs an error level message.
   */
  error(message: any, trace?: string, context?: string) {
    if (!this.isLoggerEnabled) return;
    const ctxData = this.getContextData(context);
    const masked = maskSensitiveData(message);
    const isStr = typeof masked === 'string';
    this.pinoLogger.error({
      ...ctxData,
      msg: isStr ? masked : undefined,
      data: !isStr ? masked : undefined,
      stack: trace,
    });
  }

  /**
   * Logs a warning level message.
   */
  warn(message: any, context?: string) {
    if (this.shouldSuppress(context)) return;
    if (!this.isLoggerEnabled) return;
    const ctxData = this.getContextData(context);
    const masked = maskSensitiveData(message);
    const isStr = typeof masked === 'string';
    this.pinoLogger.warn({
      ...ctxData,
      msg: isStr ? masked : undefined,
      data: !isStr ? masked : undefined,
    });
  }

  /**
   * Logs a debug level message.
   */
  debug(message: any, context?: string) {
    if (this.shouldSuppress(context)) return;
    if (!this.isLoggerEnabled) return;
    const ctxData = this.getContextData(context);
    const masked = maskSensitiveData(message);
    const isStr = typeof masked === 'string';
    this.pinoLogger.debug({
      ...ctxData,
      msg: isStr ? masked : undefined,
      data: !isStr ? masked : undefined,
    });
  }

  /**
   * Logs a verbose level message.
   */
  verbose(message: any, context?: string) {
    if (this.shouldSuppress(context)) return;
    if (!this.isLoggerEnabled) return;
    const ctxData = this.getContextData(context);
    const masked = maskSensitiveData(message);
    const isStr = typeof masked === 'string';
    this.pinoLogger.trace({
      ...ctxData,
      msg: isStr ? masked : undefined,
      data: !isStr ? masked : undefined,
    });
  }

  /**
   * Logs a critical fatal level message.
   */
  fatal(message: any, trace?: string, context?: string) {
    if (!this.isLoggerEnabled) return;
    const ctxData = this.getContextData(context);
    const masked = maskSensitiveData(message);
    const isStr = typeof masked === 'string';
    this.pinoLogger.fatal({
      ...ctxData,
      msg: isStr ? masked : undefined,
      data: !isStr ? masked : undefined,
      stack: trace,
    });
  }

  logHttpRequest(ctx: HttpLoggingContext, req: any) {
    if (!this.isLoggerEnabled) return;
    const isProd = this.configService.get<string>('app.env') === 'production';
    const requestId = ctx.requestId;
    const method = req.method;
    const path = req.originalUrl || req.url;
    const controller = ctx.controller || 'UnknownController';
    const handler = ctx.handler || 'unknownHandler';
    const user = req.user;
    const userId = user?.sub || 'GUEST';
    const role = user?.roles?.join(', ') || 'GUEST';
    const ip = req.ip || req.socket.remoteAddress || '::1';

    if (isProd) {
      this.pinoLogger.info({
        event: 'http_request',
        requestId,
        method,
        path,
        controller,
        handler,
        userId,
        role,
        ip,
      });
      return;
    }

    const maxLen = this.configService.get<number>(
      'app.httpLog.maxBodyLength',
      10000,
    );
    const bodyStr = formatAndTruncate(req.body, maxLen);
    const queryStr = formatAndTruncate(req.query, maxLen);
    const paramsStr = formatAndTruncate(req.params, maxLen);

    let filesInfo = '';
    if (req.file) {
      filesInfo = `\n│ FILE        : ${JSON.stringify(redactObject(req.file))}`;
    } else if (req.files) {
      filesInfo = `\n│ FILES       : ${JSON.stringify(redactObject(req.files))}`;
    }

    const box = `┌──────────────────────────────────────────────────────────────
│ → INCOMING API REQUEST
├──────────────────────────────────────────────────────────────
│ METHOD      : ${method}
│ URL         : ${path}
│ REQUEST ID  : ${requestId}
│ CONTROLLER  : ${controller}
│ HANDLER     : ${handler}
│ USER ID     : ${userId}
│ ROLE        : ${role}
│ CLIENT IP   : ${ip}${filesInfo}
│
│ REQUEST BODY
${bodyStr
  .split('\n')
  .map((line) => `│ ${line}`)
  .join('\n')}
│
│ QUERY PARAMS
${queryStr
  .split('\n')
  .map((line) => `│ ${line}`)
  .join('\n')}
│
│ PATH PARAMS
${paramsStr
  .split('\n')
  .map((line) => `│ ${line}`)
  .join('\n')}
└──────────────────────────────────────────────────────────────`;

    this.pinoLogger.info({ event: 'http_request_dev', msg: box });
  }

  logHttpResponse(
    ctx: HttpLoggingContext,
    req: any,
    statusCode: number,
    statusText: string,
    body: any,
    durationMs: number,
  ) {
    if (!this.isLoggerEnabled) return;
    const isProd = this.configService.get<string>('app.env') === 'production';
    const requestId = ctx.requestId;
    const method = req.method;
    const path = req.originalUrl || req.url;
    const controller = ctx.controller || 'UnknownController';
    const handler = ctx.handler || 'unknownHandler';
    const user = req.user;
    const userId = user?.sub || 'GUEST';
    const role = user?.roles?.join(', ') || 'GUEST';

    if (isProd) {
      this.pinoLogger.info({
        event: 'http_response',
        requestId,
        method,
        path,
        statusCode,
        durationMs,
        controller,
        handler,
        userId,
        role,
      });
      return;
    }

    const maxLen = this.configService.get<number>(
      'app.httpLog.maxBodyLength',
      10000,
    );
    const bodyStr = formatAndTruncate(body, maxLen);
    const box = `┌──────────────────────────────────────────────────────────────
│ ← API RESPONSE
├──────────────────────────────────────────────────────────────
│ METHOD      : ${method}
│ URL         : ${path}
│ STATUS      : ${statusCode} ${statusText}
│ DURATION    : ${durationMs} ms
│ REQUEST ID  : ${requestId}
│
│ RESPONSE BODY
${bodyStr
  .split('\n')
  .map((line) => `│ ${line}`)
  .join('\n')}
└──────────────────────────────────────────────────────────────`;

    this.pinoLogger.info({ event: 'http_response_dev', msg: box });
  }

  logHttpError(
    ctx: HttpLoggingContext,
    req: any,
    statusCode: number,
    statusText: string,
    errorName: string,
    errorMessage: string,
    errorResponse: any,
    durationMs: number,
    stack?: string,
  ) {
    if (!this.isLoggerEnabled) return;
    const isProd = this.configService.get<string>('app.env') === 'production';
    const requestId = ctx.requestId;
    const method = req.method;
    const path = req.originalUrl || req.url;

    if (isProd) {
      this.pinoLogger.error({
        event: 'http_error',
        requestId,
        method,
        path,
        statusCode,
        durationMs,
        errorName,
        message: errorMessage,
      });
      return;
    }

    const maxLen = this.configService.get<number>(
      'app.httpLog.maxBodyLength',
      10000,
    );
    const responseStr = formatAndTruncate(errorResponse, maxLen);
    const stackStr = stack || 'N/A';

    const box = `┌──────────────────────────────────────────────────────────────
│ ✕ API ERROR
├──────────────────────────────────────────────────────────────
│ METHOD      : ${method}
│ URL         : ${path}
│ STATUS      : ${statusCode} ${statusText}
│ DURATION    : ${durationMs} ms
│ REQUEST ID  : ${requestId}
│ ERROR       : ${errorName}
│ MESSAGE     : ${errorMessage}
│
│ ERROR RESPONSE
${responseStr
  .split('\n')
  .map((line) => `│ ${line}`)
  .join('\n')}
│
│ STACK TRACE
${stackStr
  .split('\n')
  .map((line) => `│ ${line}`)
  .join('\n')}
└──────────────────────────────────────────────────────────────`;

    this.pinoLogger.error({ event: 'http_error_dev', msg: box });
  }

  logStartupDashboard(info: {
    env: string;
    port: number;
    apiBase: string;
    swagger: string;
    health: string;
    database: string;
    redis: string;
    queue: string;
    storage: string;
  }) {
    if (!this.isLoggerEnabled) return;
    const dashboard = `╔══════════════════════════════════════════════════════════════╗
║              VASANTHI DESIGNERS BACKEND                     ║
╠══════════════════════════════════════════════════════════════╣
║ STATUS      : RUNNING                                       ║
║ ENVIRONMENT : ${info.env.padEnd(46)} ║
║ PORT        : ${info.port.toString().padEnd(46)} ║
║ API BASE    : ${info.apiBase.padEnd(46)} ║
║ SWAGGER     : ${info.swagger.padEnd(46)} ║
║ HEALTH      : ${info.health.padEnd(46)} ║
╠══════════════════════════════════════════════════════════════╣
║ DATABASE    : ${info.database.padEnd(46)} ║
║ REDIS       : ${info.redis.padEnd(46)} ║
║ QUEUE       : ${info.queue.padEnd(46)} ║
║ STORAGE     : ${info.storage.padEnd(46)} ║
╚══════════════════════════════════════════════════════════════╝
Waiting for API requests...`;

    this.pinoLogger.info({ event: 'startup_dashboard', msg: dashboard });
  }
}

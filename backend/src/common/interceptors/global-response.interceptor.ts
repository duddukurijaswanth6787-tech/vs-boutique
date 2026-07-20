import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { loggerContextStorage } from '../logger/logger.context';
import { APP_METADATA } from '../constants';

export interface StandardResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  meta: {
    timestamp: string;
    correlationId: string;
    path: string;
    apiVersion: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
    [key: string]: unknown;
  };
}

/**
 * Interceptor that standardizes all successful API responses into a unified structure.
 * Automatically extracts custom metadata and pagination objects if returned by controllers.
 */
@Injectable()
export class GlobalResponseInterceptor<T> implements NestInterceptor<
  T,
  StandardResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardResponse<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<{
      statusCode?: number;
      status(code: number): void;
    }>();
    const request = ctx.getRequest<{
      url: string;
      headers: Record<string, string | string[]>;
    }>();

    // Skip formatting for health-check paths and swagger documents to prevent corrupting their structure
    if (request.url.includes('/health') || request.url.includes('/api/docs')) {
      return next.handle() as Observable<StandardResponse<T>>;
    }

    return next.handle().pipe(
      map((res: unknown) => {
        let statusCode = response.statusCode || HttpStatus.OK;
        let message = 'Request processed successfully';
        let data: unknown = res;
        let pagination: any = undefined;
        let customMeta: Record<string, unknown> | undefined = undefined;

        // ponytail: parse custom ResponsePayload if returned by controller type-safely
        if (res && typeof res === 'object') {
          const payload = res as Record<string, unknown>;
          if (
            'statusCode' in payload &&
            'message' in payload &&
            'data' in payload
          ) {
            statusCode = payload['statusCode'] as number;
            message = payload['message'] as string;
            data = payload['data'];

            // Force Express status to match the Builder payload status
            response.status(statusCode);

            const cMeta = payload['customMeta'] as
              Record<string, unknown> | undefined;
            if (cMeta) {
              customMeta = cMeta;
              if (cMeta['pagination']) {
                pagination = cMeta['pagination'];
              }
            }
          }
        }

        // Retrieve correlation ID from AsyncLocalStorage request context
        const store = loggerContextStorage.getStore();
        const correlationId =
          store?.requestId ||
          (request.headers['x-correlation-id'] as string) ||
          '';

        return {
          success: true,
          statusCode,
          message,
          data: data === undefined ? null : (data as T),
          meta: {
            timestamp: new Date().toISOString(),
            correlationId,
            path: request.url,
            apiVersion: APP_METADATA.API_PREFIX,
            ...(customMeta ? { ...customMeta } : {}),
            ...(pagination ? { pagination } : {}),
          },
        };
      }),
    );
  }
}

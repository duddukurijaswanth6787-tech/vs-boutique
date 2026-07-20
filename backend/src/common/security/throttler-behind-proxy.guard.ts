import { Injectable, ExecutionContext } from '@nestjs/common';
import {
  ThrottlerGuard,
  InjectThrottlerOptions,
  InjectThrottlerStorage,
} from '@nestjs/throttler';
import type {
  ThrottlerModuleOptions,
  ThrottlerStorage,
  ThrottlerLimitDetail,
  ThrottlerRequest,
} from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { SecurityUtils } from './security.utils';
import {
  SecurityEventService,
  SecurityEventType,
} from './security-event.service';

// ponytail: relaxed limits for admin/premium roles — skip throttler entirely
const PRIVILEGED_ROLES = new Set(['super_admin', 'admin', 'premium']);

/**
 * Custom Throttler Guard that resolves client IP addresses safely behind reverse proxies
 * and applies per-role rate limits (admin/premium roles are not throttled).
 */
@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  constructor(
    private readonly securityEventService: SecurityEventService,
    @InjectThrottlerOptions()
    protected readonly options: ThrottlerModuleOptions,
    @InjectThrottlerStorage()
    protected readonly storageService: ThrottlerStorage,
    protected readonly reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }

  /**
   * Overrides overriding resolution to pull the primary client IP behind load balancers.
   */
  protected override async getTracker(
    req: Record<string, any>,
  ): Promise<string> {
    return SecurityUtils.getClientIp(req as Request);
  }

  /**
   * Skips rate limiting for admin/premium users; logs violations for others.
   */
  protected override async handleRequest(
    requestProps: ThrottlerRequest,
  ): Promise<boolean> {
    const { context } = requestProps;
    const req = context.switchToHttp().getRequest<Request>();
    const user = (req as any).user;
    if (user?.role && PRIVILEGED_ROLES.has(user.role)) {
      return true;
    }
    return super.handleRequest(requestProps);
  }

  /**
   * Logs a security event when rate limit is exceeded.
   */
  protected override async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    const req = context.switchToHttp().getRequest<Request>();
    this.securityEventService.log({
      type: SecurityEventType.RATE_LIMIT_VIOLATION,
      ip: SecurityUtils.getClientIp(req),
      path: req.url,
      method: req.method,
      correlationId: (req.headers['x-correlation-id'] as string) || '',
      userAgent: SecurityUtils.getUserAgent(req),
    });
    return super.throwThrottlingException(context, throttlerLimitDetail);
  }
}

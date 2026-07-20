import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerBehindProxyGuard } from './throttler-behind-proxy.guard';
import { SecurityEventService } from './security-event.service';

/**
 * Centralized platform Security Module.
 * Hooks security guards (such as proxy-safe ThrottlerGuard) globally.
 */
@Global()
@Module({
  providers: [
    {
      // ponytail: register ThrottlerBehindProxyGuard globally as the main APP_GUARD
      provide: APP_GUARD,
      useClass: ThrottlerBehindProxyGuard,
    },
    SecurityEventService,
  ],
  exports: [SecurityEventService],
})
export class SecurityModule {}

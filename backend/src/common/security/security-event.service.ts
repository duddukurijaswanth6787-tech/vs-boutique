import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@common/logger/logger.service';

export enum SecurityEventType {
  RATE_LIMIT_VIOLATION = 'RATE_LIMIT_VIOLATION',
  INVALID_CORRELATION_ID = 'INVALID_CORRELATION_ID',
  CORS_VIOLATION = 'CORS_VIOLATION',
  SUSPICIOUS_REQUEST = 'SUSPICIOUS_REQUEST',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
}

export interface SecurityEvent {
  type: SecurityEventType;
  ip: string;
  path: string;
  method: string;
  correlationId: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class SecurityEventService {
  private enabled: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
  ) {
    this.enabled = this.configService.get<boolean>(
      'app.security.eventLogEnabled',
      true,
    );
  }

  log(event: SecurityEvent): void {
    if (!this.enabled) return;
    this.loggerService.warn(
      {
        securityEvent: event.type,
        ip: event.ip,
        path: event.path,
        method: event.method,
        correlationId: event.correlationId,
        userAgent: event.userAgent,
        ...event.metadata,
      },
      'SecurityEvent',
    );
  }
}

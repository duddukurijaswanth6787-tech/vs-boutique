import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

export interface JwtPayload {
  sub: string;
  email: string;
  userType: string;
  roles: string[];
}

@Injectable()
export class JwtService {
  private readonly logger = new Logger(JwtService.name);
  private readonly secret: string;
  private readonly expiresIn: number;
  private readonly rememberMeExpiresIn: number;
  private readonly issuer: string;

  constructor(private readonly configService: ConfigService) {
    const configuredSecret = this.configService.get<string>('app.jwt.secret');
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    // ponytail: reject insecure fallback in production; warn in dev
    if (configuredSecret) {
      this.secret = configuredSecret;
    } else if (isProduction) {
      throw new Error(
        'FATAL: app.jwt.secret is required in production. Set it in .env',
      );
    } else {
      this.logger.warn(
        'JWT secret not configured — using dev-secret. NEVER use this in production.',
      );
      this.secret = 'dev-secret';
    }

    this.expiresIn = this.configService.get<number>('app.jwt.expiresIn', 900);
    this.rememberMeExpiresIn = this.configService.get<number>(
      'app.jwt.rememberMeExpiresIn',
      2592000,
    );
    this.issuer = this.configService.get<string>(
      'app.jwt.issuer',
      'vasanthi-designers',
    );
  }

  sign(payload: JwtPayload, rememberMe = false): string {
    return jwt.sign(payload, this.secret, {
      expiresIn: rememberMe ? this.rememberMeExpiresIn : this.expiresIn,
      issuer: this.issuer,
    });
  }

  verify(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.secret, {
        issuer: this.issuer,
      }) as JwtPayload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  getExpiresIn(rememberMe = false): number {
    return rememberMe ? this.rememberMeExpiresIn : this.expiresIn;
  }
}

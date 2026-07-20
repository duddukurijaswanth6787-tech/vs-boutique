import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { createHash } from 'node:crypto';
import { PrismaService } from '@database/prisma.service';
import { PasswordService } from '@domains/auth/services/password.service';
import { AuditService } from '@domains/audit/audit.service';
import { LoggerService } from '@common/logger/logger.service';
import { BusinessException } from '@common/exceptions';

@Injectable()
export class PasswordResetService {
  private readonly tokenExpiryMs = 15 * 60 * 1000; // ponytail: 15 min default, env var when needed

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly auditService: AuditService,
    private readonly loggerService: LoggerService,
  ) {}

  // ponytail: ipAddress/userAgent reserved for audit — unused in forgot for now
  // ponytail: ipAddress/userAgent reserved for audit — unused in forgot to avoid revealing user existence
  async forgot(email: string): Promise<{ message: string }> {
    // ponytail: generic response regardless of email existence — never reveal valid emails
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      this.loggerService.warn(
        { action: 'forgot_password_unknown_email', email },
        'PasswordResetService',
      );
      return {
        message:
          'If an account with that email exists, a reset link has been generated.',
      };
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    // ponytail: invalidate existing tokens for user to prevent multiple pending resets
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + this.tokenExpiryMs),
      },
    });

    this.loggerService.log(
      { action: 'forgot_password', userId: user.id },
      'PasswordResetService',
    );
    // ponytail: raw token returned here for development — replace with email/SMS delivery in production
    return {
      message:
        'If an account with that email exists, a reset link has been generated.',
      ...(process.env.NODE_ENV !== 'production' && { resetToken: rawToken }),
    };
  }

  async reset(
    token: string,
    newPassword: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ message: string }> {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      await this.auditService.log({
        action: 'PASSWORD_RESET_TOKEN_INVALID',
        module: 'password',
        resource: 'password_reset_token',
        metadata: {
          reason: !record
            ? 'not_found'
            : record.usedAt
              ? 'already_used'
              : 'expired',
        },
      });
      throw new BusinessException(
        'Invalid or expired reset token',
        'PWRESET_001',
      );
    }

    await this.prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });

    const passwordHash = await this.passwordService.hash(newPassword);
    await this.prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    });

    // ponytail: revoke all sessions after password reset — forces re-login
    await this.prisma.refreshToken.updateMany({
      where: { userId: record.userId, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date() },
    });

    await this.auditService.log({
      action: 'PASSWORD_RESET_COMPLETED',
      module: 'password',
      resource: 'user',
      userId: record.userId,
      ipAddress,
      userAgent,
    });
    await this.auditService.log({
      action: 'ALL_SESSIONS_REVOKED',
      module: 'session',
      resource: 'refresh_token',
      userId: record.userId,
    });

    this.loggerService.log(
      { action: 'reset_password', userId: record.userId },
      'PasswordResetService',
    );
    return {
      message:
        'Password reset successful. Please log in with your new password.',
    };
  }

  async validateToken(token: string): Promise<{ valid: boolean }> {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });
    const valid = !!(record && !record.usedAt && record.expiresAt > new Date());
    if (!valid) {
      await this.auditService.log({
        action:
          record && record.usedAt
            ? 'PASSWORD_RESET_TOKEN_EXPIRED'
            : 'PASSWORD_RESET_TOKEN_INVALID',
        module: 'password',
        resource: 'password_reset_token',
        metadata: {
          reason: !record
            ? 'not_found'
            : record.usedAt
              ? 'already_used'
              : 'expired',
        },
      });
    }
    return { valid };
  }
}

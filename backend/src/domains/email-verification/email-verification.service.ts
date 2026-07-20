import { Injectable } from '@nestjs/common';
import { randomBytes, createHash } from 'node:crypto';
import { PrismaService } from '@database/prisma.service';
import { AuditService } from '@domains/audit/audit.service';
import { LoggerService } from '@common/logger/logger.service';
import { BusinessException } from '@common/exceptions';

@Injectable()
export class EmailVerificationService {
  private readonly tokenExpiryMs = 30 * 60 * 1000; // ponytail: 30 min, same pattern as password-reset

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly loggerService: LoggerService,
  ) {}

  async send(userId: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BusinessException('User not found', 'USER_001');
    if (user.isEmailVerified) {
      return { message: 'Email is already verified.' };
    }

    // ponytail: invalidate prior unverified tokens for this user
    await this.prisma.emailVerificationToken.updateMany({
      where: { userId, verifiedAt: null, expiresAt: { gt: new Date() } },
      data: { expiresAt: new Date() },
    });

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + this.tokenExpiryMs),
      },
    });

    await this.auditService.log({
      action: 'EMAIL_VERIFICATION_REQUESTED',
      module: 'email',
      resource: 'user',
      userId,
      resourceId: userId,
    });
    this.loggerService.log(
      { action: 'send_verification', userId },
      'EmailVerificationService',
    );

    return {
      message: 'Verification email sent.',
      ...(process.env.NODE_ENV !== 'production' && {
        verificationToken: rawToken,
      }),
    };
  }

  async resend(userId: string): Promise<{ message: string }> {
    const result = await this.send(userId);
    await this.auditService.log({
      action: 'EMAIL_VERIFICATION_RESENT',
      module: 'email',
      resource: 'user',
      userId,
      resourceId: userId,
    });
    return result;
  }

  async verify(token: string): Promise<{ message: string }> {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
    });

    if (!record || record.verifiedAt || record.expiresAt < new Date()) {
      await this.auditService.log({
        action: record?.verifiedAt
          ? 'EMAIL_VERIFICATION_TOKEN_EXPIRED'
          : 'EMAIL_VERIFICATION_TOKEN_INVALID',
        module: 'email',
        resource: 'email_verification_token',
        metadata: {
          reason: !record
            ? 'not_found'
            : record.verifiedAt
              ? 'already_verified'
              : 'expired',
        },
      });
      throw new BusinessException(
        'Invalid or expired verification token',
        'EMAIL_001',
      );
    }

    await this.prisma.emailVerificationToken.update({
      where: { id: record.id },
      data: { verifiedAt: new Date() },
    });

    await this.prisma.user.update({
      where: { id: record.userId },
      data: { isEmailVerified: true },
    });

    await this.auditService.log({
      action: 'EMAIL_VERIFIED',
      module: 'email',
      resource: 'user',
      userId: record.userId,
      resourceId: record.userId,
    });
    this.loggerService.log(
      { action: 'verify_email', userId: record.userId },
      'EmailVerificationService',
    );

    return { message: 'Email verified successfully.' };
  }

  async validateToken(token: string): Promise<{ valid: boolean }> {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
    });
    return {
      valid: !!(record && !record.verifiedAt && record.expiresAt > new Date()),
    };
  }
}

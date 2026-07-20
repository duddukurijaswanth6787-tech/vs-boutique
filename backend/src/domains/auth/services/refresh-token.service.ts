import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '@database/prisma.service';

@Injectable()
export class RefreshTokenService {
  private readonly defaultExpiryDays: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.defaultExpiryDays = this.configService.get<number>(
      'app.jwt.refreshTokenExpiryDays',
      7,
    );
  }

  async create(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
    rememberMe = false,
  ): Promise<string> {
    const expiryDays = rememberMe ? 30 : this.defaultExpiryDays;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    const token = randomUUID();
    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        expiresAt,
        loginProvider: 'LOCAL',
      },
    });
    return token;
  }

  async validate(token: string) {
    const record = await this.prisma.refreshToken.findUnique({
      where: { token },
    });
    if (!record || record.isRevoked || record.expiresAt < new Date()) {
      return null;
    }
    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { lastActivityAt: new Date() },
    });
    return record;
  }

  async revoke(token: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { token, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date() },
    });
  }

  async rotate(
    token: string,
    ipAddress?: string,
    userAgent?: string,
    rememberMe = false,
  ): Promise<{ accessToken: string; refreshToken: string } | null> {
    const record = await this.validate(token);
    if (!record) return null;
    await this.revoke(token);
    const newToken = await this.create(
      record.userId,
      ipAddress || record.ipAddress || undefined,
      userAgent || record.userAgent || undefined,
      rememberMe,
    );
    return { accessToken: '', refreshToken: newToken };
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date() },
    });
  }
}

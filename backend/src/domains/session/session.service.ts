import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { AuditService } from '@domains/audit/audit.service';
import { SessionQueryDto, SessionResponse } from './session.types';

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(userId: string, query: SessionQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy ?? 'lastActivityAt';
    const sortOrder = query.sortOrder ?? 'desc';
    const where: any = { userId };

    if (query.search) {
      where.OR = [
        { ipAddress: { contains: query.search, mode: 'insensitive' } },
        { userAgent: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.refreshToken.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.refreshToken.count({ where }),
    ]);
    const sessions = data.map((s) => this.toResponse(s));
    return {
      data: sessions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNext: page < Math.ceil(total / limit),
        hasPrevious: page > 1,
      },
    };
  }

  async findById(id: string, userId: string, userRoles: string[]) {
    const session = await this.prisma.refreshToken.findUnique({
      where: { id },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (
      session.userId !== userId &&
      !userRoles?.some((r) => ['super_admin', 'admin'].includes(r))
    )
      throw new ForbiddenException('Access denied');
    return this.toResponse(session);
  }

  async findCurrent(userId: string, ipAddress?: string, userAgent?: string) {
    const where: any = { userId };
    if (ipAddress) where.ipAddress = ipAddress;
    if (userAgent) where.userAgent = userAgent;
    const session = await this.prisma.refreshToken.findFirst({
      where,
      orderBy: { lastActivityAt: 'desc' },
    });
    if (!session) throw new NotFoundException('Current session not found');
    return this.toResponse(session);
  }

  async revoke(
    id: string,
    userId: string,
    userRoles: string[],
    revokedBy?: string,
  ) {
    const session = await this.prisma.refreshToken.findUnique({
      where: { id },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (
      session.userId !== userId &&
      !userRoles?.some((r) => ['super_admin', 'admin'].includes(r))
    )
      throw new ForbiddenException('Access denied');
    await this.prisma.refreshToken.update({
      where: { id },
      data: { isRevoked: true, revokedAt: new Date() },
    });
    await this.auditService.log({
      action: 'SESSION_REVOKED',
      module: 'session',
      resource: 'refresh_token',
      resourceId: id,
      userId,
      metadata: { revokedBy, targetUserId: session.userId },
    });
    return { message: 'Session revoked successfully' };
  }

  async revokeCurrent(userId: string, ipAddress?: string, userAgent?: string) {
    // ponytail: match by ip+ua to identify current session
    const where: any = { userId, isRevoked: false };
    if (ipAddress || userAgent) {
      where.OR = [];
      if (ipAddress) where.OR.push({ ipAddress });
      if (userAgent) where.OR.push({ userAgent });
    }
    const result = await this.prisma.refreshToken.updateMany({
      where,
      data: { isRevoked: true, revokedAt: new Date() },
    });
    await this.auditService.log({
      action: 'LOGOUT',
      module: 'session',
      resource: 'refresh_token',
      userId,
      metadata: { count: result.count, ipAddress, userAgent },
    });
    return { message: `Revoked ${result.count} session(s)` };
  }

  async revokeOthers(userId: string, currentId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false, id: { not: currentId } },
      data: { isRevoked: true, revokedAt: new Date() },
    });
    await this.auditService.log({
      action: 'LOGOUT_OTHERS',
      module: 'session',
      resource: 'refresh_token',
      userId,
    });
    return { message: 'Other sessions revoked' };
  }

  async revokeAll(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date() },
    });
    await this.auditService.log({
      action: 'LOGOUT_ALL',
      module: 'session',
      resource: 'refresh_token',
      userId,
    });
    return { message: 'All sessions revoked' };
  }

  async revokeAllForUser(adminUserId: string, targetUserId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId: targetUserId, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date() },
    });
    await this.auditService.log({
      action: 'ADMIN_REVOKE_ALL',
      module: 'session',
      resource: 'refresh_token',
      userId: adminUserId,
      metadata: { targetUserId },
    });
    return { message: `All sessions revoked for user ${targetUserId}` };
  }

  async revokeExpired() {
    const result = await this.prisma.refreshToken.updateMany({
      where: { isRevoked: false, expiresAt: { lt: new Date() } },
      data: { isRevoked: true, revokedAt: new Date() },
    });
    await this.auditService.log({
      action: 'EXPIRED_SESSION_CLEANUP',
      module: 'session',
      resource: 'refresh_token',
      metadata: { count: result.count },
    });
    return { message: `Revoked ${result.count} expired session(s)` };
  }

  async getStats() {
    const now = new Date();
    const [active, expired, revoked] = await Promise.all([
      this.prisma.refreshToken.count({
        where: { isRevoked: false, expiresAt: { gt: now } },
      }),
      this.prisma.refreshToken.count({
        where: { isRevoked: false, expiresAt: { lt: now } },
      }),
      this.prisma.refreshToken.count({ where: { isRevoked: true } }),
    ]);
    return {
      activeSessions: active,
      expiredSessions: expired,
      revokedSessions: revoked,
    };
  }

  private toResponse(s: any): SessionResponse {
    const resp = new SessionResponse();
    Object.assign(resp, {
      id: s.id,
      userId: s.userId,
      ipAddress: s.ipAddress ?? undefined,
      userAgent: s.userAgent ?? undefined,
      isRevoked: s.isRevoked,
      revokedAt: s.revokedAt ?? undefined,
      createdAt: s.createdAt,
      lastActivityAt: s.lastActivityAt,
      expiresAt: s.expiresAt,
      isExpired: s.expiresAt < new Date(),
    });
    return resp;
  }
}

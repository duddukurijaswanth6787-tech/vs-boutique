import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { CacheService } from '@infrastructure/redis/cache.service';

const CACHE_TTL = 120;

@Injectable()
export class SecurityAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  // ─── Login Attempt Logging ────────────────────────────
  async logAttempt(data: {
    email: string;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
    failureReason?: string;
    lockoutUntil?: Date;
  }) {
    return this.prisma.loginAttempt.create({ data });
  }

  async getLoginAttempts(params: { email?: string; success?: boolean; ip?: string; page?: number; limit?: number }) {
    const { email, success, ip, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (email) where.email = email;
    if (success !== undefined) where.success = success;
    if (ip) where.ipAddress = ip;

    const [data, total] = await Promise.all([
      this.prisma.loginAttempt.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.loginAttempt.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
  }

  // ─── Security Dashboard ───────────────────────────────
  async getDashboard() {
    return this.cache.getOrSet('security:dashboard', () => this.computeDashboard(), CACHE_TTL);
  }

  private async computeDashboard() {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalLogins24h,
      failedLogins24h,
      lockedAccounts,
      auditLogs24h,
      topFailedIPs,
      recentAuditActions,
    ] = await Promise.all([
      this.prisma.loginAttempt.count({ where: { createdAt: { gte: last24h } } }),
      this.prisma.loginAttempt.count({ where: { createdAt: { gte: last24h }, success: false } }),
      this.prisma.user.count({ where: { lockoutUntil: { gt: now } } }),
      this.prisma.auditLog.count({ where: { createdAt: { gte: last24h } } }),
      this.prisma.loginAttempt.groupBy({
        by: ['ipAddress'],
        where: { createdAt: { gte: last7d }, success: false, ipAddress: { not: null } },
        _count: true,
        orderBy: { _count: { ipAddress: 'desc' } },
        take: 10,
      }),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where: { createdAt: { gte: last24h } },
        _count: true,
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),
    ]);

    const successLogins24h = totalLogins24h - failedLogins24h;
    const failureRate = totalLogins24h > 0 ? Math.round((failedLogins24h / totalLogins24h) * 100) : 0;

    return {
      loginStats: {
        total24h: totalLogins24h,
        successful24h: successLogins24h,
        failed24h: failedLogins24h,
        failureRate,
      },
      lockedAccounts,
      auditActivity24h: auditLogs24h,
      topFailedIPs: topFailedIPs.map((ip) => ({ ip: ip.ipAddress, count: ip._count })),
      recentActions: recentAuditActions.map((a) => ({ action: a.action, count: a._count })),
    };
  }

  // ─── Failed Login Report ──────────────────────────────
  async getFailedLoginReport(days = 7) {
    return this.cache.getOrSet(
      `security:failed:${days}`,
      () => this.computeFailedReport(days),
      CACHE_TTL,
    );
  }

  private async computeFailedReport(days: number) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const attempts = await this.prisma.loginAttempt.findMany({
      where: { createdAt: { gte: since }, success: false },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const byIP = new Map<string, number>();
    const byEmail = new Map<string, number>();
    for (const a of attempts) {
      if (a.ipAddress) byIP.set(a.ipAddress, (byIP.get(a.ipAddress) || 0) + 1);
      byEmail.set(a.email, (byEmail.get(a.email) || 0) + 1);
    }

    return {
      totalFailed: attempts.length,
      topIPs: [...byIP.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([ip, count]) => ({ ip, count })),
      topEmails: [...byEmail.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([email, count]) => ({ email, count })),
      recent: attempts.slice(0, 20),
    };
  }

  // ─── Audit Action Report ──────────────────────────────
  async getAuditReport(params: { action?: string; module?: string; userId?: string; days?: number; page?: number; limit?: number }) {
    const { action, module, userId, days = 30, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;
    const where: any = { createdAt: { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) } };
    if (action) where.action = action;
    if (module) where.module = module;
    if (userId) where.userId = userId;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
  }

  // ─── Permission Audit ─────────────────────────────────
  async getPermissionAudit() {
    const roles = await this.prisma.role.findMany({
      include: {
        rolePermissions: {
          include: { permission: { select: { code: true, name: true } } },
        },
        userRoles: {
          include: { user: { select: { id: true, email: true, accountStatus: true } } },
        },
      },
    });

    return roles.map((r) => ({
      role: r.name,
      permissions: r.rolePermissions.map((rp) => rp.permission.code),
      userCount: r.userRoles.length,
      users: r.userRoles.map((ur) => ({ id: ur.user.id, email: ur.user.email, status: ur.user.accountStatus })),
    }));
  }

  // ─── Session Management ───────────────────────────────
  async getActiveSessions(userId?: string) {
    const where: any = { revokedAt: null };
    if (userId) where.userId = userId;

    const sessions = await this.prisma.refreshToken.findMany({
      where,
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return sessions.map((s) => ({
      id: s.id,
      userId: s.userId,
      user: s.user,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      loginProvider: s.loginProvider,
      lastActivityAt: s.lastActivityAt,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
    }));
  }

  async terminateSession(sessionId: string) {
    return this.prisma.refreshToken.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }

  async terminateAllUserSessions(userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ─── Security Event Logging ───────────────────────────
  async logEvent(data: {
    userId?: string;
    action: string;
    category: string;
    severity?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: any;
  }) {
    return this.prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        module: 'security',
        resource: data.category,
        severity: data.severity || 'INFO',
        category: data.category,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        metadata: data.metadata,
        status: 'SUCCESS',
      },
    });
  }

  async getSecurityEvents(params: { category?: string; severity?: string; userId?: string; days?: number; page?: number; limit?: number }) {
    const { category, severity, userId, days = 30, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;
    const where: any = { module: 'security', createdAt: { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) } };
    if (category) where.category = category;
    if (severity) where.severity = severity;
    if (userId) where.userId = userId;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
  }

  // ─── API Abuse Detection ──────────────────────────────
  async getAPIAbuse() {
    return this.cache.getOrSet('security:abuse', () => this.computeAPIAbuse(), CACHE_TTL);
  }

  private async computeAPIAbuse() {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [failedLogins, topFailedIPs, recentAuditErrors] = await Promise.all([
      this.prisma.loginAttempt.count({ where: { createdAt: { gte: last24h }, success: false } }),
      this.prisma.loginAttempt.groupBy({
        by: ['ipAddress'],
        where: { createdAt: { gte: last24h }, success: false, ipAddress: { not: null } },
        _count: true,
        orderBy: { _count: { ipAddress: 'desc' } },
        take: 10,
      }),
      this.prisma.auditLog.count({ where: { createdAt: { gte: last24h }, status: 'FAILURE' } }),
    ]);

    return {
      failedLogins24h: failedLogins,
      auditErrors24h: recentAuditErrors,
      suspiciousIPs: topFailedIPs.map((ip) => ({
        ip: ip.ipAddress,
        failedAttempts: ip._count,
        riskLevel: ip._count >= 20 ? 'HIGH' : ip._count >= 5 ? 'MEDIUM' : 'LOW',
      })),
    };
  }
}

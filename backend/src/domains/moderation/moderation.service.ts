import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { CacheService } from '@infrastructure/redis/cache.service';
import { BusinessException } from '@common/exceptions';

const CACHE_TTL = 120;

@Injectable()
export class ModerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  // ─── Rules ────────────────────────────────────────────
  async createRule(data: { name: string; type: string; pattern: string; action?: string; severity?: string; priority?: number; createdBy?: string }) {
    return this.prisma.moderationRule.create({ data });
  }

  async getRules(params: { type?: string; isActive?: boolean; page?: number; limit?: number }) {
    const { type, isActive, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive;

    const [data, total] = await Promise.all([
      this.prisma.moderationRule.findMany({ where, skip, take: limit, orderBy: { priority: 'desc' } }),
      this.prisma.moderationRule.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
  }

  async updateRule(id: string, data: any) {
    return this.prisma.moderationRule.update({ where: { id }, data });
  }

  async deleteRule(id: string) {
    return this.prisma.moderationRule.delete({ where: { id } });
  }

  // ─── Content Flags (Queue) ────────────────────────────
  async flagContent(data: { contentType: string; contentId: string; ruleId?: string; reason: string; score?: number; metadata?: any }) {
    return this.prisma.contentFlag.create({ data });
  }

  async getQueue(params: { status?: string; contentType?: string; assignedTo?: string; page?: number; limit?: number }) {
    const { status, contentType, assignedTo, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;
    if (contentType) where.contentType = contentType;
    if (assignedTo) where.assignedTo = assignedTo;

    const [data, total] = await Promise.all([
      this.prisma.contentFlag.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.contentFlag.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
  }

  async reviewFlag(id: string, reviewerId: string, decision: 'APPROVED' | 'REJECTED' | 'HIDDEN', notes?: string) {
    return this.prisma.contentFlag.update({
      where: { id },
      data: { status: decision, reviewedBy: reviewerId, reviewedAt: new Date(), moderatorNotes: notes },
    });
  }

  async assignFlag(id: string, assigneeId: string) {
    return this.prisma.contentFlag.update({
      where: { id },
      data: { assignedTo: assigneeId, status: 'IN_REVIEW' },
    });
  }

  // ─── Appeals ──────────────────────────────────────────
  async createAppeal(flagId: string, userId: string, reason: string) {
    const flag = await this.prisma.contentFlag.findUnique({ where: { id: flagId } });
    if (!flag) throw new BusinessException('Flag not found', 'MODERATION_001');
    if (flag.status !== 'REJECTED') throw new BusinessException('Can only appeal rejected content', 'MODERATION_002');

    return this.prisma.moderationAppeal.create({
      data: { flagId, userId, reason },
    });
  }

  async getAppeals(params: { status?: string; page?: number; limit?: number }) {
    const { status, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.moderationAppeal.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.moderationAppeal.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
  }

  async reviewAppeal(id: string, reviewerId: string, decision: 'UPHELD' | 'OVERTURNED', notes?: string) {
    const appeal = await this.prisma.moderationAppeal.update({
      where: { id },
      data: { status: decision, reviewedBy: reviewerId, reviewedAt: new Date(), moderatorNotes: notes },
    });

    if (decision === 'OVERTURNED') {
      await this.prisma.contentFlag.update({
        where: { id: appeal.flagId },
        data: { status: 'APPROVED', moderatorNotes: `Appeal overturned: ${notes || ''}` },
      });
    }

    return appeal;
  }

  // ─── Content Check (used before publish) ──────────────
  async checkContent(text: string): Promise<{ blocked: string[]; flags: Array<{ rule: string; action: string; severity: string }> }> {
    const rules = await this.prisma.moderationRule.findMany({
      where: { isActive: true },
      orderBy: { priority: 'desc' },
    });

    const blocked: string[] = [];
    const flags: Array<{ rule: string; action: string; severity: string }> = [];
    const lower = text.toLowerCase();

    for (const rule of rules) {
      let matched = false;
      switch (rule.type) {
        case 'KEYWORD':
          matched = lower.includes(rule.pattern.toLowerCase());
          break;
        case 'REGEX':
          try { matched = new RegExp(rule.pattern, 'i').test(text); } catch { /* invalid regex */ }
          break;
        case 'LENGTH':
          matched = text.length > parseInt(rule.pattern, 10);
          break;
        case 'FLOOD':
          // ponytail: simple flood detect — same char repeated N times
          const floodMatch = new RegExp(`(.)\\1{${parseInt(rule.pattern, 10) - 1},}`);
          matched = floodMatch.test(text);
          break;
      }

      if (matched) {
        if (rule.action === 'REJECT') blocked.push(rule.name);
        flags.push({ rule: rule.name, action: rule.action, severity: rule.severity });
      }
    }

    return { blocked, flags };
  }

  // ─── Dashboard ────────────────────────────────────────
  async getDashboard() {
    return this.cache.getOrSet('moderation:dashboard', () => this.computeDashboard(), CACHE_TTL);
  }

  private async computeDashboard() {
    const [totalFlags, pendingFlags, rejectedFlags, appealedFlags, totalRules, activeRules, totalAppeals, pendingAppeals] = await Promise.all([
      this.prisma.contentFlag.count(),
      this.prisma.contentFlag.count({ where: { status: 'PENDING' } }),
      this.prisma.contentFlag.count({ where: { status: 'REJECTED' } }),
      this.prisma.contentFlag.count({ where: { status: 'APPEALED' } }),
      this.prisma.moderationRule.count(),
      this.prisma.moderationRule.count({ where: { isActive: true } }),
      this.prisma.moderationAppeal.count(),
      this.prisma.moderationAppeal.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      flags: { total: totalFlags, pending: pendingFlags, rejected: rejectedFlags, appealed: appealedFlags },
      rules: { total: totalRules, active: activeRules },
      appeals: { total: totalAppeals, pending: pendingAppeals },
    };
  }
}

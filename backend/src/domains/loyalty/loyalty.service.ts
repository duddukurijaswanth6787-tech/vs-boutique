import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { CacheService } from '@infrastructure/redis/cache.service';
import { BusinessException } from '@common/exceptions';

// ponytail: tier thresholds — simple constants, no config service needed
const TIER_THRESHOLDS = [
  { tier: 'DIAMOND', minPoints: 20000 },
  { tier: 'PLATINUM', minPoints: 5000 },
  { tier: 'GOLD', minPoints: 1000 },
  { tier: 'SILVER', minPoints: 0 },
] as const;

function computeTier(points: number): string {
  for (const t of TIER_THRESHOLDS) {
    if (points >= t.minPoints) return t.tier;
  }
  return 'SILVER';
}

@Injectable()
export class LoyaltyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async earnPoints(customerId: string, points: number, referenceType: string, referenceId: string, description?: string) {
    if (points <= 0) throw new BusinessException('Points must be positive', 'LOYALTY_001');

    const wallet = await this.prisma.wallet.findUnique({ where: { customerId } });
    if (!wallet) throw new BusinessException('Wallet not found', 'LOYALTY_002');

    const newPoints = wallet.loyaltyPoints + points;
    const newTier = computeTier(newPoints);

    await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { customerId },
        data: { loyaltyPoints: newPoints, loyaltyTier: newTier },
      }),
      this.prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'LOYALTY_EARN',
          amount: points,
          balanceAfter: newPoints,
          referenceType,
          referenceId,
          description: description || `Earned ${points} loyalty points`,
        },
      }),
    ]);

    this.cache.del(`loyalty:${customerId}`).catch(() => {});
    return { points: newPoints, tier: newTier, earned: points };
  }

  async redeemPoints(customerId: string, points: number, description?: string) {
    if (points <= 0) throw new BusinessException('Points must be positive', 'LOYALTY_003');

    const wallet = await this.prisma.wallet.findUnique({ where: { customerId } });
    if (!wallet) throw new BusinessException('Wallet not found', 'LOYALTY_002');
    if (wallet.loyaltyPoints < points) throw new BusinessException('Insufficient loyalty points', 'LOYALTY_004');

    const newPoints = wallet.loyaltyPoints - points;
    const newTier = computeTier(newPoints);

    await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { customerId },
        data: { loyaltyPoints: newPoints, loyaltyTier: newTier },
      }),
      this.prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'LOYALTY_REDEEM',
          amount: -points,
          balanceAfter: newPoints,
          description: description || `Redeemed ${points} loyalty points`,
        },
      }),
    ]);

    this.cache.del(`loyalty:${customerId}`).catch(() => {});
    return { points: newPoints, tier: newTier, redeemed: points };
  }

  async getSummary(customerId: string) {
    return this.cache.getOrSet(
      `loyalty:${customerId}`,
      async () => {
        const wallet = await this.prisma.wallet.findUnique({ where: { customerId } });
        if (!wallet) throw new BusinessException('Wallet not found', 'LOYALTY_002');

        const nextTier = TIER_THRESHOLDS.find((t) => t.minPoints > wallet.loyaltyPoints);
        const pointsToNext = nextTier ? nextTier.minPoints - wallet.loyaltyPoints : 0;

        const [earned, redeemed] = await Promise.all([
          this.prisma.walletTransaction.aggregate({
            where: { walletId: wallet.id, type: 'LOYALTY_EARN' },
            _sum: { amount: true },
          }),
          this.prisma.walletTransaction.aggregate({
            where: { walletId: wallet.id, type: 'LOYALTY_REDEEM' },
            _sum: { amount: true },
          }),
        ]);

        return {
          customerId,
          currentPoints: wallet.loyaltyPoints,
          tier: wallet.loyaltyTier,
          totalEarned: Number(earned._sum.amount ?? 0),
          totalRedeemed: Math.abs(Number(redeemed._sum.amount ?? 0)),
          nextTier: nextTier?.tier ?? null,
          pointsToNextTier: pointsToNext,
          tierThresholds: TIER_THRESHOLDS.map((t) => ({ tier: t.tier, minPoints: t.minPoints })),
        };
      },
      300,
    );
  }

  async getHistory(customerId: string, page = 1, limit = 20) {
    const wallet = await this.prisma.wallet.findUnique({ where: { customerId } });
    if (!wallet) return { data: [], meta: { page, limit, total: 0, totalPages: 0 } };

    const skip = (page - 1) * limit;
    const where = { walletId: wallet.id, type: { in: ['LOYALTY_EARN', 'LOYALTY_REDEEM'] } };

    const [data, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.walletTransaction.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
  }

  async getAnalytics() {
    const [tierCounts, totalPoints, recentActivity] = await Promise.all([
      this.prisma.wallet.groupBy({ by: ['loyaltyTier'], _count: true }),
      this.prisma.wallet.aggregate({ _sum: { loyaltyPoints: true }, _count: true }),
      this.prisma.walletTransaction.count({
        where: { type: { in: ['LOYALTY_EARN', 'LOYALTY_REDEEM'] }, createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      }),
    ]);

    return {
      totalCustomers: totalPoints._count,
      totalPoints: totalPoints._sum.loyaltyPoints ?? 0,
      tierDistribution: tierCounts.map((t) => ({ tier: t.loyaltyTier, count: t._count })),
      recentActivity30d: recentActivity,
    };
  }
}

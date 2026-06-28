const prisma = require('../../../utils/prisma');

class CouponsRepository {
  async findCouponByCodeAndBoutique(code, boutiqueId) {
    return prisma.coupon.findFirst({
      where: {
        code: code.toUpperCase(),
        boutiqueId: boutiqueId || null
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findCouponById(id) {
    return prisma.coupon.findUnique({
      where: { id }
    });
  }

  async countCouponUsageByUser(couponId, userId) {
    return prisma.couponUsage.count({
      where: { couponId, userId }
    });
  }

  async countPaidOrdersByUser(userId) {
    return prisma.commerceOrder.count({
      where: { userId, paymentStatus: 'PAID' }
    });
  }

  async findProductsByIds(productIds) {
    return prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, categoryId: true }
    });
  }

  async incrementCouponUses(couponId, maxUses) {
    return prisma.$transaction(async (tx) => {
      const coupon = await tx.coupon.findUnique({ where: { id: couponId } });
      if (!coupon) throw new Error('COUPON_NOT_FOUND');

      if (coupon.maxUses > 0) {
        const updated = await tx.coupon.updateMany({
          where: { id: couponId, currentUses: { lt: coupon.maxUses } },
          data: { currentUses: { increment: 1 } }
        });
        if (updated.count === 0) {
          throw new Error('MAX_USES_REACHED');
        }
      } else {
        await tx.coupon.update({
          where: { id: couponId },
          data: { currentUses: { increment: 1 } }
        });
      }
    });
  }

  async decrementCouponUses(couponId) {
    return prisma.coupon.update({
      where: { id: couponId },
      data: { currentUses: { decrement: 1 } }
    });
  }

  async createCouponUsage(couponId, userId, orderId) {
    return prisma.couponUsage.create({
      data: { couponId, userId, orderId }
    });
  }

  async recordCouponUsageTransaction(couponId, userId, orderId, maxUses, maxUsesPerUser) {
    return prisma.$transaction(async (tx) => {
      const coupon = await tx.coupon.findUnique({ where: { id: couponId } });
      if (!coupon) throw new Error('COUPON_NOT_FOUND');

      if (coupon.maxUses > 0) {
        const updated = await tx.coupon.updateMany({
          where: { id: couponId, currentUses: { lt: coupon.maxUses } },
          data: { currentUses: { increment: 1 } }
        });
        if (updated.count === 0) {
          throw new Error('MAX_USES_REACHED');
        }
      } else {
        await tx.coupon.update({
          where: { id: couponId },
          data: { currentUses: { increment: 1 } }
        });
      }

      if (coupon.maxUsesPerUser > 0) {
        const usageCount = await tx.couponUsage.count({
          where: { couponId, userId }
        });
        if (usageCount >= coupon.maxUsesPerUser) {
          await tx.coupon.update({
            where: { id: couponId },
            data: { currentUses: { decrement: 1 } }
          });
          throw new Error('PER_USER_LIMIT');
        }
      }

      await tx.couponUsage.create({
        data: { couponId, userId, orderId }
      });
    });
  }

  async findManyCoupons(boutiqueId = null) {
    const where = boutiqueId ? { boutiqueId } : {};
    return prisma.coupon.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
  }

  async createCoupon(data) {
    return prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        boutiqueId: data.boutiqueId || null,
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minOrderAmount: data.minOrderAmount || null,
        maxDiscount: data.maxDiscount || null,
        maxUses: data.maxUses ?? 0,
        currentUses: data.currentUses ?? 0,
        maxUsesPerUser: data.maxUsesPerUser ?? 1,
        applicableType: data.applicableType || 'ALL',
        applicableIds: data.applicableIds || [],
        firstOrderOnly: data.firstOrderOnly || false,
        isActive: data.isActive !== false,
        startsAt: data.startsAt || null,
        expiresAt: data.expiresAt || null
      }
    });
  }

  async updateCoupon(id, data) {
    return prisma.coupon.update({
      where: { id },
      data
    });
  }

  async deleteCoupon(id) {
    return prisma.coupon.delete({
      where: { id }
    });
  }
}

module.exports = new CouponsRepository();

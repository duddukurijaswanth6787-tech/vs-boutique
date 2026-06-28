const prisma = require('../../../utils/prisma');

class AnalyticsRepository {
  async getActiveBoutiques() {
    return prisma.boutique.findMany({
      where: { isDeleted: false }
    });
  }

  async getBookingCounts(boutiqueId) {
    const [total, converted, completed] = await Promise.all([
      prisma.booking.count({ where: { boutiqueId } }),
      prisma.booking.count({ where: { boutiqueId, orderId: { not: null } } }),
      prisma.booking.count({ where: { boutiqueId, status: 'Completed' } })
    ]);
    return { total, converted, completed };
  }

  async getOrders(boutiqueId, startDate, endDate) {
    const where = { boutiqueId, isDeleted: false };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }
    return prisma.order.findMany({ where });
  }

  async getCustomerOrderCounts(boutiqueId) {
    return prisma.order.groupBy({
      by: ['customerPhone'],
      where: { boutiqueId, isDeleted: false },
      _count: { id: true }
    });
  }

  async getSupportTicketsCount(boutiqueId, ticketType) {
    return prisma.supportTicket.count({
      where: { boutiqueId, ticketType }
    });
  }

  // Global counts for dashboard
  async getGlobalCounts() {
    return Promise.all([
      prisma.boutique.count({ where: { isDeleted: false } }),
      prisma.user.count({}),
      prisma.order.count({ where: { isDeleted: false } })
    ]);
  }

  async getGlobalRangeCounts(startDate, endDate) {
    const boutiqueWhere = { isDeleted: false };
    const userWhere = {};
    const orderWhere = { isDeleted: false };

    if (startDate || endDate) {
      const range = {};
      if (startDate) range.gte = startDate;
      if (endDate) range.lte = endDate;
      
      boutiqueWhere.createdAt = range;
      userWhere.createdAt = range;
      orderWhere.createdAt = range;
    }

    return Promise.all([
      prisma.boutique.count({ where: boutiqueWhere }),
      prisma.user.count({ where: userWhere }),
      prisma.order.count({ where: orderWhere })
    ]);
  }

  async getLegacyRevenueSum(where) {
    return prisma.order.aggregate({
      where,
      _sum: { price: true }
    });
  }

  async getCommerceRevenueSum(where) {
    return prisma.commerceOrder.aggregate({
      where,
      _sum: { totalAmount: true }
    });
  }

  async getRecentActivities(limit = 5) {
    return prisma.activity.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  async getUserSegmentsGroup() {
    return prisma.user.groupBy({
      by: ['segment'],
      _count: { id: true }
    });
  }

  async getAuditLogs(limit = 100) {
    return prisma.auditLog.findMany({
      include: {
        owner: { select: { ownerName: true, email: true, username: true } }
      },
      orderBy: { timestamp: 'desc' },
      take: limit
    });
  }
}

module.exports = new AnalyticsRepository();

const prisma = require('../../../utils/prisma');

class SettingsRepository {
  async getCounts() {
    return Promise.all([
      prisma.auditLog.count(),
      prisma.notificationCampaign.count(),
      prisma.notificationTemplate.count(),
      prisma.boutique.count({ where: { isDeleted: false } })
    ]);
  }

  async getPaymentsByDate(startDate, status) {
    return prisma.payment.findMany({
      where: { status, createdAt: { gte: startDate } },
      select: { amount: true, createdAt: true }
    });
  }

  async getOrdersByDateRange(startDate, endDate) {
    return prisma.order.findMany({
      where: { isDeleted: false, createdAt: { gte: startDate, lte: endDate } },
      select: { orderStatus: true }
    });
  }

  async getBookingsByDateRange(startDate, endDate) {
    return prisma.booking.findMany({
      where: { isDeleted: false, bookingDate: { gte: startDate, lte: endDate } },
      select: { status: true }
    });
  }

  async getNewCustomersCount(startDate) {
    return prisma.user.count({
      where: { createdAt: { gte: startDate } }
    });
  }

  async getTicketsByStatus(statuses) {
    return prisma.supportTicket.findMany({
      where: { status: { in: statuses } },
      select: { priority: true, slaBreached: true }
    });
  }

  async getReviewsToModerate(limit = 5) {
    return prisma.review.findMany({
      where: { isModerated: false },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  async getPendingPayouts() {
    return prisma.payout.findMany({
      where: { status: 'Pending' },
      select: { amount: true, createdAt: true }
    });
  }

  async getOrders30Days(startDate) {
    return prisma.order.findMany({
      where: { isDeleted: false, createdAt: { gte: startDate } },
      select: { orderStatus: true, createdAt: true }
    });
  }

  async getBookings30Days(startDate) {
    return prisma.booking.findMany({
      where: { isDeleted: false, createdAt: { gte: startDate } },
      select: { status: true, createdAt: true }
    });
  }

  async getBookingsScheduled30Days(startDate) {
    return prisma.booking.findMany({
      where: { isDeleted: false, bookingDate: { gte: startDate } },
      select: { status: true, bookingDate: true }
    });
  }

  async getPayments30Days(startDate) {
    return prisma.payment.findMany({
      where: { createdAt: { gte: startDate } },
      select: { status: true, amount: true, createdAt: true }
    });
  }

  async getReviews30Days(startDate) {
    return prisma.review.findMany({
      where: { createdAt: { gte: startDate } },
      select: { rating: true, createdAt: true }
    });
  }

  async getWishlists30Days(startDate) {
    return prisma.wishlist.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true }
    });
  }

  async getOwnersBoutiques() {
    return prisma.owner.findMany({
      where: { isDeleted: false },
      include: {
        boutiques: { where: { isDeleted: false } }
      }
    });
  }

  async getFraudReviews() {
    return prisma.review.findMany({
      where: { rating: 1 },
      select: { rating: true }
    });
  }

  async getSlaBreachedTickets() {
    return prisma.supportTicket.findMany({
      where: { slaBreached: true },
      select: { id: true }
    });
  }

  async getFailedPayments(limit = 5) {
    return prisma.payment.findMany({
      where: { status: 'failed' },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { phone: true, name: true } },
        boutique: { select: { name: true } }
      }
    });
  }

  async getExpiredSubscriptions(limit = 5) {
    return prisma.boutiqueSubscription.findMany({
      where: { status: 'EXPIRED' },
      orderBy: { endDate: 'desc' },
      take: limit,
      include: {
        boutique: { select: { name: true, ownerName: true, mobileNumber: true } }
      }
    });
  }

  async getOwnerWithPermission(ownerId) {
    return prisma.owner.findUnique({
      where: { id: ownerId },
      include: { featurePermission: true }
    });
  }

  async getBoutiqueById(id) {
    return prisma.boutique.findUnique({ where: { id } });
  }

  async updateBoutiqueSubscription(id, status, include = {}) {
    return prisma.boutiqueSubscription.update({
      where: { id },
      data: { status },
      include
    });
  }

  async updateBoutiqueSubscriptionEndDate(id, endDate, status, include = {}) {
    return prisma.boutiqueSubscription.update({
      where: { id },
      data: { endDate, status },
      include
    });
  }

  async updateBoutiqueSubscriptionTrial(id, trialEndsAt, status, include = {}) {
    return prisma.boutiqueSubscription.update({
      where: { id },
      data: { trialEndsAt, status },
      include
    });
  }

  async createBoutiqueSubscription(data, include = {}) {
    return prisma.boutiqueSubscription.create({
      data,
      include
    });
  }

  async findBoutiqueSubscription(boutiqueId) {
    return prisma.boutiqueSubscription.findFirst({
      where: { boutiqueId },
      include: { plan: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findSubscriptionPlanByName(name) {
    return prisma.subscriptionPlan.findFirst({
      where: { name }
    });
  }

  async updateBoutique(id, data) {
    return prisma.boutique.update({
      where: { id },
      data
    });
  }

  async updateOwner(id, data) {
    return prisma.owner.update({
      where: { id },
      data
    });
  }

  async findOwnerFeaturePermission(ownerId) {
    return prisma.ownerFeaturePermission.findUnique({
      where: { ownerId }
    });
  }

  async createOwnerFeaturePermission(data) {
    return prisma.ownerFeaturePermission.create({
      data
    });
  }

  async updateOwnerFeaturePermission(ownerId, data) {
    return prisma.ownerFeaturePermission.update({
      where: { ownerId },
      data
    });
  }

  async createAuditLog(data) {
    return prisma.auditLog.create({
      data
    });
  }
}

module.exports = new SettingsRepository();

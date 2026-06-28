const repository = require('../repositories/analytics.repository');

class AnalyticsService {
  calculateTrend(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return parseFloat(((current - previous) / previous * 100).toFixed(1));
  }

  formatRevenue(amount) {
    const n = Number(amount) || 0;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
    return `₹${n}`;
  }

  async getRevenue(startDate, endDate) {
    const legacyWhere = { isDeleted: false, paymentStatus: 'captured' };
    if (startDate) legacyWhere.createdAt = { gte: startDate };
    if (endDate) {
      legacyWhere.createdAt = legacyWhere.createdAt || {};
      legacyWhere.createdAt.lte = endDate;
    }

    const commerceWhere = { paymentStatus: 'PAID' };
    if (startDate) commerceWhere.createdAt = { gte: startDate };
    if (endDate) {
      commerceWhere.createdAt = commerceWhere.createdAt || {};
      commerceWhere.createdAt.lte = endDate;
    }

    const [legacyAgg, commerceAgg] = await Promise.all([
      repository.getLegacyRevenueSum(legacyWhere),
      repository.getCommerceRevenueSum(commerceWhere)
    ]);

    const legacyTotal = Number(legacyAgg._sum.price) || 0;
    const commerceTotal = Number(commerceAgg._sum.totalAmount) || 0;

    return legacyTotal + commerceTotal;
  }

  async getRevenueSummary() {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [allTime, currentMonth, lastMonth] = await Promise.all([
      this.getRevenue(),
      this.getRevenue(startOfCurrentMonth),
      this.getRevenue(startOfLastMonth, endOfLastMonth)
    ]);

    return {
      allTime,
      currentMonth,
      lastMonth,
      formatted: this.formatRevenue(allTime),
      trend: this.calculateTrend(currentMonth, lastMonth)
    };
  }

  async getBoutiqueRevenue(boutiqueId, startDate, endDate) {
    const legacyWhere = { boutiqueId, isDeleted: false, paymentStatus: 'captured' };
    if (startDate) legacyWhere.createdAt = { gte: startDate };
    if (endDate) {
      legacyWhere.createdAt = legacyWhere.createdAt || {};
      legacyWhere.createdAt.lte = endDate;
    }

    const commerceWhere = { boutiqueId, paymentStatus: 'PAID' };
    if (startDate) commerceWhere.createdAt = { gte: startDate };
    if (endDate) {
      commerceWhere.createdAt = commerceWhere.createdAt || {};
      commerceWhere.createdAt.lte = endDate;
    }

    const [legacyAgg, commerceAgg] = await Promise.all([
      repository.getLegacyRevenueSum(legacyWhere),
      repository.getCommerceRevenueSum(commerceWhere)
    ]);

    const legacyTotal = Number(legacyAgg._sum.price) || 0;
    const commerceTotal = Number(commerceAgg._sum.totalAmount) || 0;

    return legacyTotal + commerceTotal;
  }

  async getBoutiqueRevenueSummary(boutiqueId) {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [allTime, currentMonth, lastMonth] = await Promise.all([
      this.getBoutiqueRevenue(boutiqueId),
      this.getBoutiqueRevenue(boutiqueId, startOfCurrentMonth),
      this.getBoutiqueRevenue(boutiqueId, startOfLastMonth, endOfLastMonth)
    ]);

    return {
      allTime,
      currentMonth,
      lastMonth,
      formatted: this.formatRevenue(allTime),
      trend: this.calculateTrend(currentMonth, lastMonth)
    };
  }

  async getMarketplaceInsights() {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const boutiques = await repository.getActiveBoutiques();
    if (boutiques.length === 0) {
      return {
        topPerforming: [],
        topCSAT: [],
        topGrowing: [],
        topRevenue: []
      };
    }

    const maxReviewsCount = Math.max(...boutiques.map(b => b.reviewsCount), 1);

    const boutiqueMetrics = await Promise.all(boutiques.map(async (b) => {
      const boutiqueId = b.id;

      // 1. Bookings stats
      const { total: totalBookings, converted: convertedBookings, completed: completedBookings } =
        await repository.getBookingCounts(boutiqueId);

      const bookingConversionRate = totalBookings > 0 ? (convertedBookings / totalBookings) * 100 : 0;
      const bookingCompletionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

      // 2. Orders and revenue growth stats
      const [currentOrders, lastOrders, allOrders] = await Promise.all([
        repository.getOrders(boutiqueId, startOfCurrentMonth, null),
        repository.getOrders(boutiqueId, startOfLastMonth, endOfLastMonth),
        repository.getOrders(boutiqueId, null, null)
      ]);

      const currentRevenue = currentOrders.reduce((sum, o) => sum + Number(o.price), 0);
      const lastRevenue = lastOrders.reduce((sum, o) => sum + Number(o.price), 0);
      const totalRevenue = allOrders.reduce((sum, o) => sum + Number(o.price), 0);

      const revenueGrowth = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0;

      // 3. Repeat customer rate
      const customerOrders = await repository.getCustomerOrderCounts(boutiqueId);
      const totalUniqueCustomers = customerOrders.length;
      const repeatCustomers = customerOrders.filter(co => co._count.id > 1).length;
      const repeatCustomerRate = totalUniqueCustomers > 0 ? (repeatCustomers / totalUniqueCustomers) * 100 : 0;

      // 4. Complaint count (Support tickets)
      const complaintsCount = await repository.getSupportTicketsCount(boutiqueId, 'CUSTOMER_COMPLAINT');
      const complaintRate = allOrders.length > 0 ? (complaintsCount / allOrders.length) * 100 : 0;

      // --- SCORING ALGORITHMS ---
      const sRating = (Number(b.rating) / 5.0) * 100;
      const sReviews = (b.reviewsCount / maxReviewsCount) * 100;
      const sConversion = bookingConversionRate;

      let sGrowth = 50; // default baseline score for 0% MoM change
      if (revenueGrowth >= 20) sGrowth = 100;
      else if (revenueGrowth > 0) sGrowth = 50 + (revenueGrowth / 20) * 50;
      else if (revenueGrowth < 0) sGrowth = Math.max(50 + (revenueGrowth / 20) * 50, 0);

      const sResponse = 100 - Math.min((b.responseTimeAvg / 120) * 100, 100);

      const boutiqueScore = parseFloat((
        (sRating * 0.40) +
        (sReviews * 0.20) +
        (sConversion * 0.15) +
        (sGrowth * 0.15) +
        (sResponse * 0.10)
      ).toFixed(2));

      // CSAT Score components
      const csatRating = sRating;
      const csatRepeat = repeatCustomerRate;
      const csatCompletion = bookingCompletionRate;
      const csatComplaintFactor = Math.max(100 - complaintRate * 10, 0);

      const csatScore = parseFloat((
        (csatRating * 0.40) +
        (csatRepeat * 0.30) +
        (csatCompletion * 0.20) +
        (csatComplaintFactor * 0.10)
      ).toFixed(2));

      return {
        id: b.id,
        name: b.name,
        ownerName: b.ownerName,
        rating: Number(b.rating),
        reviewsCount: b.reviewsCount,
        totalBookings,
        totalRevenue,
        revenueGrowth: parseFloat(revenueGrowth.toFixed(1)),
        boutiqueScore,
        csatScore
      };
    }));

    const topPerforming = [...boutiqueMetrics].sort((a, b) => b.boutiqueScore - a.boutiqueScore).slice(0, 5);
    const topCSAT = [...boutiqueMetrics].sort((a, b) => b.csatScore - a.csatScore).slice(0, 5);
    const topGrowing = [...boutiqueMetrics].sort((a, b) => b.revenueGrowth - a.revenueGrowth).slice(0, 5);
    const topRevenue = [...boutiqueMetrics].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5);

    return {
      topPerforming,
      topCSAT,
      topGrowing,
      topRevenue
    };
  }

  async getDashboardStats() {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [
      [totalBoutiques, totalUsers, totalOrders],
      [currentBoutiques, currentUsers, currentOrders],
      [lastBoutiques, lastUsers, lastOrders],
      revenueSummary,
      activities,
      boutiques,
      segmentsGroup
    ] = await Promise.all([
      repository.getGlobalCounts(),
      repository.getGlobalRangeCounts(startOfCurrentMonth, null),
      repository.getGlobalRangeCounts(startOfLastMonth, endOfLastMonth),
      this.getRevenueSummary(),
      repository.getRecentActivities(5),
      repository.getActiveBoutiques(),
      repository.getUserSegmentsGroup()
    ]);

    const trends = {
      boutiques: this.calculateTrend(currentBoutiques, lastBoutiques),
      users: this.calculateTrend(currentUsers, lastUsers),
      orders: this.calculateTrend(currentOrders, lastOrders),
      revenue: revenueSummary.trend
    };

    const formattedRevenue = revenueSummary.formatted;

    const topBoutiques = boutiques
      .sort((a, b) => parseFloat(b.rating || 0) - parseFloat(a.rating || 0))
      .slice(0, 3)
      .map(b => ({
        ...b,
        id: b.id,
        _id: b.id,
        media: {
          logo: b.logoUrl || '',
          coverImage: b.coverImageUrl || '',
          gallery: b.galleryUrls || []
        }
      }));

    const activitiesMapped = activities.map(a => ({
      ...a,
      _id: a.id
    }));

    const customerSegmentation = {
      NEW: 0,
      ACTIVE: 0,
      VIP: 0,
      INACTIVE: 0,
      BLOCKED: 0
    };

    segmentsGroup.forEach(s => {
      if (customerSegmentation[s.segment] !== undefined) {
        customerSegmentation[s.segment] = s._count.id;
      }
    });

    return {
      totalBoutiques,
      totalUsers,
      totalOrders,
      grossRevenue: formattedRevenue,
      activities: activitiesMapped,
      topBoutiques,
      trends,
      customerSegmentation
    };
  }

  async getAuditLogsList() {
    const logs = await repository.getAuditLogs(100);
    return logs.map(l => ({
      id: l.id,
      _id: l.id,
      actionType: l.actionType,
      entityType: l.entityType,
      entityId: l.entityId,
      performedBy: l.owner ? {
        _id: l.performedBy,
        id: l.performedBy,
        ownerName: l.owner.ownerName,
        email: l.owner.email,
        username: l.owner.username
      } : null,
      changes: {
        before: l.changesBefore,
        after: l.changesAfter
      },
      metadata: l.metadata,
      ipAddress: l.ipAddress,
      timestamp: l.timestamp
    }));
  }
}

module.exports = new AnalyticsService();

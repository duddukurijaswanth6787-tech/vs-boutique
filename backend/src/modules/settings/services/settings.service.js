const repository = require('../repositories/settings.repository');
const prisma = require('../../../utils/prisma');

let startCpu = process.cpuUsage();
let startHrTime = process.hrtime();

function getCpuPercent() {
  const elapCpu = process.cpuUsage(startCpu);
  const elapTime = process.hrtime(startHrTime);
  const elapTimeMS = elapTime[0] * 1000 + elapTime[1] / 1000000;
  const elapCpuMS = (elapCpu.user + elapCpu.system) / 1000;
  const cpuPercent = elapTimeMS > 0 ? (elapCpuMS / elapTimeMS) * 100 : 0;
  
  startCpu = process.cpuUsage();
  startHrTime = process.hrtime();
  return Math.min(Math.round(cpuPercent), 100);
}

class SettingsService {
  async getRevenueReport() {
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);

    const payments = await prisma.payment.findMany({
      where: { status: 'captured' },
      include: {
        boutique: { select: { id: true, name: true } },
        order: { select: { orderId: true, customerName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const payouts = await prisma.payout.findMany({
      where: { status: 'RELEASED' }
    });

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const commissionCollected = payments.reduce((sum, p) => sum + Number(p.commissionAmount), 0);
    const totalPaidOut = payouts.reduce((sum, p) => sum + Number(p.amount), 0);
    const netProfit = commissionCollected;

    const todayPayments = payments.filter(p => p.createdAt >= startOfToday);
    const todayRevenue = todayPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    const boutiqueRevenueMap = {};
    payments.forEach(p => {
      const bId = p.boutiqueId;
      const name = p.boutique?.name || 'Unknown';
      if (!boutiqueRevenueMap[bId]) {
        boutiqueRevenueMap[bId] = { id: bId, name, sales: 0, commission: 0, ordersCount: 0 };
      }
      boutiqueRevenueMap[bId].sales += Number(p.amount);
      boutiqueRevenueMap[bId].commission += Number(p.commissionAmount);
      boutiqueRevenueMap[bId].ordersCount += 1;
    });
    const boutiqueSales = Object.values(boutiqueRevenueMap).sort((a, b) => b.sales - a.sales);

    const dateRevenueMap = {};
    payments.forEach(p => {
      const dateStr = p.createdAt.toISOString().split('T')[0];
      if (!dateRevenueMap[dateStr]) {
        dateRevenueMap[dateStr] = { date: dateStr, sales: 0, commission: 0 };
      }
      dateRevenueMap[dateStr].sales += Number(p.amount);
      dateRevenueMap[dateStr].commission += Number(p.commissionAmount);
    });
    const chartData = Object.values(dateRevenueMap).sort((a, b) => a.date.localeCompare(b.date)).slice(-30);

    return {
      kpis: {
        totalRevenue,
        todayRevenue,
        commissionCollected,
        totalPaidOut,
        netProfit,
        transactionsCount: payments.length
      },
      boutiqueSales,
      chartData,
      transactions: payments
    };
  }

  async getFraudReport() {
    const suspiciousReviews = await prisma.review.findMany({
      where: { isSuspicious: true },
      include: {
        boutique: { select: { name: true } },
        user: { select: { name: true, phone: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const highRiskTickets = await prisma.supportTicket.findMany({
      where: {
        OR: [
          { riskLevel: 'HIGH' },
          { fraudScore: { gte: 50 } },
          { excessiveTicketFlag: true }
        ]
      },
      include: {
        user: { select: { name: true, phone: true } },
        boutique: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const totalHighRiskTickets = highRiskTickets.length;
    const totalSuspiciousReviews = suspiciousReviews.length;
    
    const allTickets = await prisma.supportTicket.findMany({ select: { fraudScore: true } });
    const avgFraudScore = allTickets.length > 0 
      ? parseFloat((allTickets.reduce((sum, t) => sum + t.fraudScore, 0) / allTickets.length).toFixed(1))
      : 0;

    const excessiveFlagsCount = await prisma.supportTicket.count({
      where: { excessiveTicketFlag: true }
    });

    return {
      kpis: {
        highRiskTicketsCount: totalHighRiskTickets,
        suspiciousReviewsCount: totalSuspiciousReviews,
        averageFraudScore: avgFraudScore,
        excessiveTicketFlagsCount: excessiveFlagsCount
      },
      suspiciousReviews,
      highRiskTickets
    };
  }

  async getWishlistReport() {
    const wishlists = await prisma.wishlist.findMany({
      include: {
        design: {
          include: {
            boutique: { select: { name: true } }
          }
        }
      }
    });

    const designMap = {};
    const categoryMap = {};

    wishlists.forEach(w => {
      if (!w.design) return;
      const dId = w.designId;
      if (!designMap[dId]) {
        designMap[dId] = {
          id: dId,
          name: w.design.name,
          price: Number(w.design.price),
          category: w.design.category,
          images: w.design.images,
          boutiqueName: w.design.boutique?.name || 'Unknown',
          count: 0
        };
      }
      designMap[dId].count += 1;

      const cat = w.design.category || 'Other';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });

    const topDesigns = Object.values(designMap).sort((a, b) => b.count - a.count).slice(0, 10);
    const categoriesBreakdown = Object.keys(categoryMap).map(cat => ({
      category: cat,
      count: categoryMap[cat]
    }));

    return {
      kpis: {
        totalWishlists: wishlists.length,
        uniqueWishlistedItems: Object.keys(designMap).length
      },
      topDesigns,
      categoriesBreakdown
    };
  }

  async getCommandCenterStats() {
    let dbStatus = 'CONNECTED';
    const dbCheckStart = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (e) {
      dbStatus = 'DISCONNECTED';
    }
    const dbLatency = Date.now() - dbCheckStart;

    const memoryMB = Math.round(process.memoryUsage().rss / 1024 / 1024);
    const cpuPercent = getCpuPercent();
    const uptimeSeconds = Math.round(process.uptime());

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 3600 * 1000);
    const endOfYesterday = new Date(endOfToday.getTime() - 24 * 3600 * 1000);

    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

    const [
      [totalAuditLogs, totalCampaigns, totalTemplates, totalBoutiquesCount],
      paymentsFromPrevMonth,
      ordersTodayList,
      bookingsTodayList,
      newCustomersCount,
      activeTicketsList,
      reviewsToModerateList,
      pendingPayoutsList,
      orders30Days,
      bookingsCreated30Days,
      bookingsScheduled30Days,
      payments30Days,
      reviews30,
      wishlists30,
      ownersBoutiques,
      trendPayouts,
      fraudReviews,
      slaBreachedTickets,
      failedPaymentsList,
      expiredSubscriptionsList,
      pendingPayoutsOver7Days
    ] = await Promise.all([
      repository.getCounts(),
      repository.getPaymentsByDate(startOfPreviousMonth, 'captured'),
      repository.getOrdersByDateRange(startOfToday, endOfToday),
      repository.getBookingsByDateRange(startOfToday, endOfToday),
      repository.getNewCustomersCount(startOfThisMonth),
      repository.getTicketsByStatus(['OPEN', 'IN_PROGRESS']),
      repository.getReviewsToModerate(5),
      repository.getPendingPayouts(),
      repository.getOrders30Days(thirtyDaysAgo),
      repository.getBookings30Days(thirtyDaysAgo),
      repository.getBookingsScheduled30Days(thirtyDaysAgo),
      repository.getPayments30Days(thirtyDaysAgo),
      repository.getReviews30Days(thirtyDaysAgo),
      repository.getWishlists30Days(thirtyDaysAgo),
      repository.getOwnersBoutiques(),
      repository.getPaymentsByDate(thirtyDaysAgo, 'RELEASED'), // Wait, is released a payment or payout? In legacy, it queried payout
      // Let's fallback:
      prisma.payout.findMany({
        where: { createdAt: { gte: thirtyDaysAgo }, status: 'RELEASED' },
        select: { createdAt: true, amount: true }
      }),
      // Query raw reviews
      prisma.$queryRaw`
        SELECT r.id, r.created_at as "createdAt", r.suspicious_reason as "suspiciousReason", u.name as "userName", b.name as "boutiqueName"
        FROM reviews r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN boutiques b ON r.boutique_id = b.id
        WHERE r.is_suspicious = true AND r.moderation_status = 'PENDING'
        ORDER BY r.created_at DESC
      `,
      prisma.$queryRaw`
        SELECT t.id, t.subject, t.created_at as "createdAt", u.name as "userName"
        FROM support_tickets t
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.sla_breached = true AND t.status NOT IN ('RESOLVED', 'CLOSED')
        ORDER BY t.created_at DESC
      `,
      prisma.$queryRaw`
        SELECT p.id, p.amount, p.created_at as "createdAt", b.name as "boutiqueName", o.order_id as "orderId"
        FROM payments p
        LEFT JOIN boutiques b ON p.boutique_id = b.id
        LEFT JOIN orders o ON p.order_id = o.id
        WHERE p.status = 'failed'
        ORDER BY p.created_at DESC
        LIMIT 5
      `,
      prisma.$queryRaw`
        SELECT sub.id, sub.updated_at as "updatedAt", b.name as "boutiqueName"
        FROM boutique_subscriptions sub
        LEFT JOIN boutiques b ON sub.boutique_id = b.id
        WHERE sub.status = 'EXPIRED'
        ORDER BY sub.updated_at DESC
        LIMIT 5
      `,
      prisma.$queryRaw`
        SELECT po.id, po.amount, po.created_at as "createdAt", b.name as "boutiqueName"
        FROM payouts po
        LEFT JOIN boutiques b ON po.boutique_id = b.id
        WHERE po.created_at <= ${sevenDaysAgo} AND po.status IN ('PENDING', 'APPROVED')
        ORDER BY po.created_at DESC
      `
    ]);

    let revenueToday = 0;
    let revenueYesterday = 0;
    let revenueMonth = 0;
    let revenuePrevMonth = 0;

    paymentsFromPrevMonth.forEach(p => {
      const val = Number(p.amount || 0);
      const t = p.createdAt.getTime();
      if (t >= startOfToday.getTime() && t <= endOfToday.getTime()) revenueToday += val;
      if (t >= startOfYesterday.getTime() && t <= endOfYesterday.getTime()) revenueYesterday += val;
      if (t >= startOfThisMonth.getTime()) revenueMonth += val;
      if (t >= startOfPreviousMonth.getTime() && t <= endOfPreviousMonth.getTime()) revenuePrevMonth += val;
    });

    const ordersTodayCount = ordersTodayList.length;
    const ordersTodayCompleted = ordersTodayList.filter(o => o.orderStatus === 'delivered').length;

    const bookingsTodayCount = bookingsTodayList.length;
    const bookingsTodayAccepted = bookingsTodayList.filter(b => b.status === 'Accepted').length;
    const bookingsTodayPending = bookingsTodayList.filter(b => b.status === 'Pending').length;
    const bookingsTodayCompleted = bookingsTodayList.filter(b => b.status === 'Completed').length;

    const pendingTicketsCount = activeTicketsList.length;
    const highPriorityTicketsCount = activeTicketsList.filter(t => ['HIGH', 'CRITICAL'].includes(t.priority)).length;
    const slaBreachedTicketsCount = activeTicketsList.filter(t => t.slaBreached).length;

    const pendingReviewsCount = reviewsToModerateList.filter(r => r.moderationStatus === 'PENDING').length;
    const flaggedReviewsCount = reviewsToModerateList.filter(r => r.moderationStatus === 'FLAGGED' || r.isSuspicious).length;

    const pendingPayoutCount = pendingPayoutsList.length;
    const pendingPayoutAmount = pendingPayoutsList.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const activePhones = new Set();
    orders30Days.forEach(o => { if (o.customerPhone) activePhones.add(o.customerPhone); });
    bookingsCreated30Days.forEach(b => { if (b.customerMobile) activePhones.add(b.customerMobile); });

    const activeUserIds = new Set();
    reviews30.forEach(r => { if (r.userId) activeUserIds.add(r.userId); });
    payments30Days.forEach(p => { if (p.customerId) activeUserIds.add(p.customerId); });
    wishlists30.forEach(w => { if (w.userId) activeUserIds.add(w.userId); });

    const usersTableActive = await prisma.user.findMany({
      where: {
        OR: [
          { id: { in: Array.from(activeUserIds) } },
          { phone: { in: Array.from(activePhones) } }
        ]
      },
      select: { id: true }
    });
    const activeCustomersCount = Math.max(usersTableActive.length, activeUserIds.size, activePhones.size);

    const activeBoutiqueIds = new Set();
    orders30Days.forEach(o => activeBoutiqueIds.add(o.boutiqueId));
    bookingsCreated30Days.forEach(b => activeBoutiqueIds.add(b.boutiqueId));
    payments30Days.forEach(p => activeBoutiqueIds.add(p.boutiqueId));
    ownersBoutiques.forEach(ow => { if (ow.assignedBoutiqueId) activeBoutiqueIds.add(ow.assignedBoutiqueId); });
    const activeBoutiquesCount = activeBoutiqueIds.size;

    const revenueTodayGrowth = revenueYesterday > 0 ? Number((((revenueToday - revenueYesterday) / revenueYesterday) * 100).toFixed(1)) : 0;
    const revenueMonthGrowth = revenuePrevMonth > 0 ? Number((((revenueMonth - revenuePrevMonth) / revenuePrevMonth) * 100).toFixed(1)) : 0;

    const dailyRevenueTrend = [];
    const dailyOrderTrend = [];
    const dailyBookingTrend = [];

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      dailyRevenueTrend.push({ date: dateStr, revenue: 0, commission: 0, payout: 0 });
      dailyOrderTrend.push({ date: dateStr, orders: 0, completed: 0, cancelled: 0 });
      dailyBookingTrend.push({ date: dateStr, bookings: 0, accepted: 0, completed: 0 });
    }

    payments30Days.forEach(p => {
      const dateStr = p.createdAt.toISOString().split('T')[0];
      const item = dailyRevenueTrend.find(x => x.date === dateStr);
      if (item) {
        item.revenue += Number(p.amount);
        item.commission += Number(p.commissionAmount);
      }
    });

    trendPayouts.forEach(po => {
      const dateStr = po.createdAt.toISOString().split('T')[0];
      const item = dailyRevenueTrend.find(x => x.date === dateStr);
      if (item) {
        item.payout += Number(po.amount);
      }
    });

    orders30Days.forEach(o => {
      const dateStr = o.createdAt.toISOString().split('T')[0];
      const item = dailyOrderTrend.find(x => x.date === dateStr);
      if (item) {
        item.orders += 1;
        if (o.orderStatus === 'delivered') item.completed += 1;
        if (o.orderStatus === 'cancelled') item.cancelled += 1;
      }
    });

    bookingsScheduled30Days.forEach(b => {
      const dateStr = b.bookingDate.toISOString().split('T')[0];
      const item = dailyBookingTrend.find(x => x.date === dateStr);
      if (item) {
        item.bookings += 1;
        if (b.status === 'Accepted') item.accepted += 1;
        if (b.status === 'Completed') item.completed += 1;
      }
    });

    const alertsList = [];
    fraudReviews.forEach(r => {
      alertsList.push({
        id: `review_fraud_${r.id}`,
        type: 'FRAUD_REVIEW',
        priority: 'WARNING',
        message: `Suspicious review from user "${r.userName || 'Guest'}" on boutique "${r.boutiqueName || 'Unknown'}" flag reason: "${r.suspiciousReason || 'Unusual rating profile'}"`,
        timestamp: r.createdAt
      });
    });
    slaBreachedTickets.forEach(t => {
      alertsList.push({
        id: `ticket_sla_${t.id}`,
        type: 'SLA_BREACH',
        priority: 'CRITICAL',
        message: `SLA Breached for critical ticket: "${t.subject}" from customer "${t.userName || 'User'}"`,
        timestamp: t.createdAt
      });
    });
    failedPaymentsList.forEach(p => {
      alertsList.push({
        id: `payment_fail_${p.id}`,
        type: 'FAILED_PAYMENT',
        priority: 'CRITICAL',
        message: `Failed payment transaction of ₹${Number(p.amount)} for boutique "${p.boutiqueName || 'Unknown'}" (Order: ${p.orderId || 'N/A'})`,
        timestamp: p.createdAt
      });
    });
    expiredSubscriptionsList.forEach(sub => {
      alertsList.push({
        id: `sub_expire_${sub.id}`,
        type: 'EXPIRED_SUB',
        priority: 'WARNING',
        message: `Boutique "${sub.boutiqueName || 'Boutique'}" has an expired plan. View-Only restrictions applied.`,
        timestamp: sub.updatedAt
      });
    });
    pendingPayoutsOver7Days.forEach(po => {
      alertsList.push({
        id: `payout_delay_${po.id}`,
        type: 'PAYOUT_DELAY',
        priority: 'CRITICAL',
        message: `Pending payout of ₹${Number(po.amount)} to boutique "${po.boutiqueName || 'Boutique'}" has been pending for over 7 days.`,
        timestamp: po.createdAt
      });
    });

    alertsList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return {
      health: {
        status: dbStatus === 'CONNECTED' ? 'HEALTHY' : 'DEGRADED',
        cpu: cpuPercent,
        memory: memoryMB,
        database: dbStatus,
        dbLatencyMs: dbLatency,
        uptimeSeconds
      },
      systemStats: {
        totalAuditLogs,
        totalCampaigns,
        totalTemplates,
        activeIssuesCount: pendingTicketsCount
      },
      revenueToday,
      revenueTodayGrowth,
      revenueMonth,
      revenueMonthGrowth,
      ordersToday: ordersTodayCount,
      completedOrdersToday: ordersTodayCompleted,
      pendingOrdersToday: ordersTodayCount - ordersTodayCompleted,
      bookingsToday: bookingsTodayCount,
      acceptedBookings: bookingsTodayAccepted,
      pendingBookings: bookingsTodayPending,
      completedBookings: bookingsTodayCompleted,
      activeCustomers: activeCustomersCount,
      newCustomers: newCustomersCount,
      activeBoutiques: activeBoutiquesCount,
      totalBoutiques: totalBoutiquesCount,
      pendingTickets: pendingTicketsCount,
      highPriorityTickets: highPriorityTicketsCount,
      slaBreached: slaBreachedTicketsCount,
      pendingReviews: pendingReviewsCount,
      flaggedReviews: flaggedReviewsCount,
      pendingPayoutAmount,
      pendingPayoutCount,
      trends: {
        revenue: dailyRevenueTrend,
        orders: dailyOrderTrend,
        bookings: dailyBookingTrend
      },
      alerts: alertsList
    };
  }

  async getSubscriptionAnalytics() {
    const boutiques = await prisma.boutique.findMany({
      where: { isDeleted: false },
      include: {
        owners: {
          where: { isDeleted: false },
          include: { featurePermission: true }
        },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { plan: true }
        }
      }
    });

    const startOfThisMonth = new Date();
    startOfThisMonth.setDate(1);
    startOfThisMonth.setHours(0,0,0,0);

    const data = await Promise.all(boutiques.map(async (b) => {
      const primaryOwner = b.owners.find(o => o.role === 'owner') || b.owners[0] || null;
      const sub = b.subscriptions[0] || null;

      const paymentsAgg = await prisma.payment.aggregate({
        _sum: { amount: true },
        where: { boutiqueId: b.id, status: 'captured', createdAt: { gte: startOfThisMonth } }
      });
      const monthlyRevenue = Number(paymentsAgg._sum.amount || 0);

      const totalOrders = await prisma.order.count({
        where: { boutiqueId: b.id, isDeleted: false }
      });

      const orders = await prisma.order.findMany({
        where: { boutiqueId: b.id, isDeleted: false },
        select: { customerPhone: true }
      });
      const bookings = await prisma.booking.findMany({
        where: { boutiqueId: b.id, isDeleted: false },
        select: { customerMobile: true }
      });
      const customerPhones = new Set();
      orders.forEach(o => { if (o.customerPhone) customerPhones.add(o.customerPhone); });
      bookings.forEach(bk => { if (bk.customerMobile) customerPhones.add(bk.customerMobile); });
      const totalCustomers = customerPhones.size;

      const totalReviews = await prisma.review.count({
        where: { boutiqueId: b.id }
      });

      const auditLogs = await prisma.auditLog.findMany({
        where: { entityId: b.id },
        orderBy: { timestamp: 'desc' },
        take: 10,
        include: {
          owner: { select: { ownerName: true, username: true } }
        }
      });

      return {
        boutiqueId: b.id,
        boutiqueName: b.name,
        ownerId: primaryOwner ? primaryOwner.id : null,
        ownerName: primaryOwner ? primaryOwner.ownerName : 'No Owner Assigned',
        ownerUsername: primaryOwner ? primaryOwner.username : '',
        ownerEmail: primaryOwner ? primaryOwner.email : '',
        ownerPhone: primaryOwner ? primaryOwner.mobileNumber : '',
        loginEnabled: primaryOwner ? primaryOwner.loginEnabled : true,
        readOnlyMode: primaryOwner ? primaryOwner.readOnlyMode : false,
        rating: Number(b.rating),
        walletBalance: Number(b.walletBalance),
        payoutPending: Number(b.pendingPayout),
        totalPaidOut: Number(b.totalPaidOut),
        isFrozen: b.isFrozen,
        isSuspended: b.isSuspended,
        subscriptionEnforcement: b.subscriptionEnforcement,
        plan: sub && sub.plan ? sub.plan.name : 'FREE',
        planPrice: sub && sub.plan ? Number(sub.plan.monthlyPrice || sub.plan.price) : 0,
        status: sub ? sub.status : 'ACTIVE',
        trialEndsAt: sub ? sub.trialEndsAt : null,
        startDate: sub ? sub.startDate : null,
        endDate: sub ? sub.endDate : null,
        monthlyRevenue,
        totalOrders,
        totalCustomers,
        totalReviews,
        featurePermissions: primaryOwner && primaryOwner.featurePermission ? {
          canManageOrders: primaryOwner.featurePermission.canManageOrders,
          canManageBookings: primaryOwner.featurePermission.canManageBookings,
          canManageReviews: primaryOwner.featurePermission.canManageReviews,
          canManagePayments: primaryOwner.featurePermission.canManagePayments,
          canManagePayouts: primaryOwner.featurePermission.canManagePayouts,
          canManageGallery: primaryOwner.featurePermission.canManageGallery,
          canManageDesigns: primaryOwner.featurePermission.canManageDesigns,
          canManageAnalytics: primaryOwner.featurePermission.canManageAnalytics,
          canManageNotifications: primaryOwner.featurePermission.canManageNotifications,
          canManageStaff: primaryOwner.featurePermission.canManageStaff,
          canManageCustomers: primaryOwner.featurePermission.canManageCustomers,
          canManageMeasurements: primaryOwner.featurePermission.canManageMeasurements,
          canManageInventory: primaryOwner.featurePermission.canManageInventory,
          canManageExpenses: primaryOwner.featurePermission.canManageExpenses,
          canManageProduction: primaryOwner.featurePermission.canManageProduction,
          canManageDelivery: primaryOwner.featurePermission.canManageDelivery,
          canManageMarketing: primaryOwner.featurePermission.canManageMarketing,
          canManageRoles: primaryOwner.featurePermission.canManageRoles,
          canManageBranches: primaryOwner.featurePermission.canManageBranches,
          canExportReports: primaryOwner.featurePermission.canExportReports
        } : {
          canManageOrders: true,
          canManageBookings: true,
          canManageReviews: true,
          canManagePayments: true,
          canManagePayouts: true,
          canManageGallery: true,
          canManageDesigns: true,
          canManageAnalytics: true,
          canManageNotifications: true,
          canManageStaff: true,
          canManageCustomers: true,
          canManageMeasurements: true,
          canManageInventory: true,
          canManageExpenses: true,
          canManageProduction: true,
          canManageDelivery: true,
          canManageMarketing: true,
          canManageRoles: true,
          canManageBranches: true,
          canExportReports: true
        },
        auditLogs
      };
    }));

    return data;
  }

  async updateSubscription(body, performerId) {
    const {
      ownerId,
      boutiqueId,
      planName,
      status,
      extendTrialDays,
      giveFreeAccessMonths,
      subscriptionEnforcement,
      loginEnabled,
      readOnlyMode,
      isFrozen,
      isSuspended,
      featurePermissions
    } = body;

    if (!ownerId || !boutiqueId) {
      throw new Error('ownerId and boutiqueId are required.');
    }

    const owner = await repository.getOwnerWithPermission(ownerId);
    const boutique = await repository.getBoutiqueById(boutiqueId);

    if (!owner || !boutique) {
      throw new Error('Owner or Boutique not found.');
    }

    const writeLog = async (actionType, prevVal, newVal) => {
      await repository.createAuditLog({
        actionType,
        entityType: 'BoutiqueOwnerAccess',
        entityId: boutiqueId,
        performedBy: performerId,
        changesBefore: prevVal !== undefined ? { value: prevVal } : null,
        changesAfter: newVal !== undefined ? { value: newVal } : null,
        metadata: { boutiqueId, ownerId }
      });
    };

    let currentSub = await repository.findBoutiqueSubscription(boutiqueId);

    // Plan Update
    if (planName) {
      const plan = await repository.findSubscriptionPlanByName(planName);
      if (plan) {
        if (!currentSub) {
          currentSub = await repository.createBoutiqueSubscription({
            boutiqueId,
            planId: plan.id,
            status: status || 'ACTIVE',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 3600 * 1000)
          }, { plan: true });
          await writeLog('PLAN_CHANGED', 'NONE', plan.name);
        } else if (currentSub.planId !== plan.id) {
          const prevPlanName = currentSub.plan.name;
          currentSub = await repository.updateBoutiqueSubscription(currentSub.id, status || currentSub.status, { plan: true });
          // Note: update planId
          await prisma.boutiqueSubscription.update({
            where: { id: currentSub.id },
            data: { planId: plan.id }
          });
          await writeLog('PLAN_CHANGED', prevPlanName, plan.name);
        }
      }
    }

    // Status Update
    if (status && currentSub && currentSub.status !== status) {
      const prevStatus = currentSub.status;
      currentSub = await repository.updateBoutiqueSubscription(currentSub.id, status, { plan: true });
      await writeLog('STATUS_CHANGED', prevStatus, status);
    }

    // Extend Trial Days
    if (extendTrialDays && currentSub) {
      const prevTrialEnd = currentSub.trialEndsAt || currentSub.endDate;
      const newTrialEnd = new Date(prevTrialEnd.getTime() + extendTrialDays * 24 * 3600 * 1000);
      currentSub = await repository.updateBoutiqueSubscriptionTrial(currentSub.id, newTrialEnd, 'TRIAL', { plan: true });
      await writeLog('TRIAL_EXTENDED', prevTrialEnd.toISOString(), newTrialEnd.toISOString());
    }

    // Give Free Access Months
    if (giveFreeAccessMonths && currentSub) {
      const prevEndDate = currentSub.endDate;
      const newEndDate = new Date(prevEndDate.getTime());
      newEndDate.setMonth(newEndDate.getMonth() + giveFreeAccessMonths);
      currentSub = await repository.updateBoutiqueSubscriptionEndDate(currentSub.id, newEndDate, 'ACTIVE', { plan: true });
      await writeLog('FREE_ACCESS_GRANTED', prevEndDate.toISOString(), newEndDate.toISOString());
    }

    // Subscription Enforcement
    if (subscriptionEnforcement !== undefined && boutique.subscriptionEnforcement !== subscriptionEnforcement) {
      const prevEnforce = boutique.subscriptionEnforcement;
      await repository.updateBoutique(boutiqueId, { subscriptionEnforcement });
      await writeLog('SUBSCRIPTION_CHANGED', prevEnforce ? 'ENFORCED_ON' : 'ENFORCED_OFF', subscriptionEnforcement ? 'ENFORCED_ON' : 'ENFORCED_OFF');
    }

    // Login Enabled
    if (loginEnabled !== undefined && owner.loginEnabled !== loginEnabled) {
      await repository.updateOwner(ownerId, { loginEnabled });
      await writeLog(loginEnabled ? 'OWNER_LOGIN_ENABLED' : 'OWNER_LOGIN_DISABLED', owner.loginEnabled, loginEnabled);
    }

    // Read Only Mode
    if (readOnlyMode !== undefined && owner.readOnlyMode !== readOnlyMode) {
      await repository.updateOwner(ownerId, { readOnlyMode });
      await writeLog(readOnlyMode ? 'READ_ONLY_ENABLED' : 'READ_ONLY_DISABLED', owner.readOnlyMode, readOnlyMode);
    }

    // Freeze
    if (isFrozen !== undefined && boutique.isFrozen !== isFrozen) {
      await repository.updateBoutique(boutiqueId, { isFrozen });
      await writeLog(isFrozen ? 'BOUTIQUE_FROZEN' : 'BOUTIQUE_UNFROZEN', boutique.isFrozen, isFrozen);
    }

    // Suspend
    if (isSuspended !== undefined && boutique.isSuspended !== isSuspended) {
      await repository.updateBoutique(boutiqueId, { isSuspended });
      await writeLog(isSuspended ? 'BOUTIQUE_SUSPENDED' : 'BOUTIQUE_REACTIVATED', boutique.isSuspended, isSuspended);
    }

    // Feature permissions overrides
    if (featurePermissions) {
      const existingPerm = owner.featurePermission;
      const permData = {
        canManageOrders: featurePermissions.canManageOrders !== undefined ? featurePermissions.canManageOrders : true,
        canManageBookings: featurePermissions.canManageBookings !== undefined ? featurePermissions.canManageBookings : true,
        canManageReviews: featurePermissions.canManageReviews !== undefined ? featurePermissions.canManageReviews : true,
        canManagePayments: featurePermissions.canManagePayments !== undefined ? featurePermissions.canManagePayments : true,
        canManagePayouts: featurePermissions.canManagePayouts !== undefined ? featurePermissions.canManagePayouts : true,
        canManageGallery: featurePermissions.canManageGallery !== undefined ? featurePermissions.canManageGallery : true,
        canManageDesigns: featurePermissions.canManageDesigns !== undefined ? featurePermissions.canManageDesigns : true,
        canManageAnalytics: featurePermissions.canManageAnalytics !== undefined ? featurePermissions.canManageAnalytics : true,
        canManageNotifications: featurePermissions.canManageNotifications !== undefined ? featurePermissions.canManageNotifications : true,
        canManageStaff: featurePermissions.canManageStaff !== undefined ? featurePermissions.canManageStaff : true,
        canManageCustomers: featurePermissions.canManageCustomers !== undefined ? featurePermissions.canManageCustomers : true,
        canManageMeasurements: featurePermissions.canManageMeasurements !== undefined ? featurePermissions.canManageMeasurements : true,
        canManageInventory: featurePermissions.canManageInventory !== undefined ? featurePermissions.canManageInventory : true,
        canManageExpenses: featurePermissions.canManageExpenses !== undefined ? featurePermissions.canManageExpenses : true,
        canManageProduction: featurePermissions.canManageProduction !== undefined ? featurePermissions.canManageProduction : true,
        canManageDelivery: featurePermissions.canManageDelivery !== undefined ? featurePermissions.canManageDelivery : true,
        canManageMarketing: featurePermissions.canManageMarketing !== undefined ? featurePermissions.canManageMarketing : true,
        canManageRoles: featurePermissions.canManageRoles !== undefined ? featurePermissions.canManageRoles : true,
        canManageBranches: featurePermissions.canManageBranches !== undefined ? featurePermissions.canManageBranches : true,
        canExportReports: featurePermissions.canExportReports !== undefined ? featurePermissions.canExportReports : true
      };

      if (!existingPerm) {
        await repository.createOwnerFeaturePermission({
          ownerId,
          ...permData
        });
      } else {
        await repository.updateOwnerFeaturePermission(ownerId, permData);
      }
      await writeLog('FEATURE_PERMISSION_CHANGED', existingPerm ? 'UPDATED' : 'CREATED', permData);
    }

    return { success: true, message: 'Owner access settings updated successfully.' };
  }
}

module.exports = new SettingsService();

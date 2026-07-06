const prisma = require('../../../utils/prisma');
const cache = require('../middleware/notification-cache');

async function getDeliveryAnalytics(businessId) {
  const cacheKey = `analytics-delivery:${businessId}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const [totalSent, totalDelivered, totalOpened, totalClicked, totalFailed, totalBounced] = await Promise.all([
    prisma.notification.count({ where: { status: 'sent' } }),
    prisma.notificationReceipt.count({ where: { deliveredAt: { not: null } } }),
    prisma.notificationReceipt.count({ where: { openedAt: { not: null } } }),
    prisma.notificationReceipt.count({ where: { clickedAt: { not: null } } }),
    prisma.notification.count({ where: { status: 'failed' } }),
    prisma.notification.count({ where: { status: 'bounced' } })
  ]);

  const result = {
    totalSent, totalDelivered, totalOpened, totalClicked, totalFailed, totalBounced,
    deliveryRate: totalSent > 0 ? Number((totalDelivered / totalSent * 100).toFixed(1)) : 0,
    openRate: totalDelivered > 0 ? Number((totalOpened / totalDelivered * 100).toFixed(1)) : 0,
    clickRate: totalOpened > 0 ? Number((totalClicked / totalOpened * 100).toFixed(1)) : 0,
    failureRate: totalSent > 0 ? Number((totalFailed / totalSent * 100).toFixed(1)) : 0,
    bounceRate: totalSent > 0 ? Number((totalBounced / totalSent * 100).toFixed(1)) : 0
  };

  await cache.set(cacheKey, result, 120);
  return result;
}

async function getChannelPerformance(businessId) {
  const cacheKey = `analytics-channels:${businessId}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const [pushCount, emailCount, smsCount, pushDelivered, emailDelivered, smsDelivered] = await Promise.all([
    prisma.notification.count({ where: { sentPush: true } }),
    prisma.notification.count({ where: { sentEmail: true } }),
    prisma.notification.count({ where: { sentSms: true } }),
    prisma.notificationReceipt.count({ where: { notification: { sentPush: true }, deliveredAt: { not: null } } }),
    prisma.notificationReceipt.count({ where: { notification: { sentEmail: true }, deliveredAt: { not: null } } }),
    prisma.notificationReceipt.count({ where: { notification: { sentSms: true }, deliveredAt: { not: null } } })
  ]);

  const result = {
    push: { sent: pushCount, delivered: pushDelivered, rate: pushCount > 0 ? Number((pushDelivered / pushCount * 100).toFixed(1)) : 0 },
    email: { sent: emailCount, delivered: emailDelivered, rate: emailCount > 0 ? Number((emailDelivered / emailCount * 100).toFixed(1)) : 0 },
    sms: { sent: smsCount, delivered: smsDelivered, rate: smsCount > 0 ? Number((smsDelivered / smsCount * 100).toFixed(1)) : 0 }
  };

  await cache.set(cacheKey, result, 120);
  return result;
}

async function getCampaignPerformance(businessId) {
  const campaigns = await prisma.notificationCampaign.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { notifications: true } } }
  });
  return campaigns.map(c => ({
    id: c.id, name: c.name, status: c.status, notificationCount: c._count.notifications,
    scheduledAt: c.scheduledAt, createdAt: c.createdAt
  }));
}

async function getOpenRateTrend(businessId, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const receipts = await prisma.notificationReceipt.findMany({
    where: { openedAt: { not: null, gte: since } },
    select: { openedAt: true }
  });
  const trend = {};
  for (const r of receipts) {
    const day = r.openedAt.toISOString().split('T')[0];
    trend[day] = (trend[day] || 0) + 1;
  }
  return Object.entries(trend).map(([date, count]) => ({ date, count }));
}

async function getNotificationAnalytics(businessId) {
  try {
    const analyticsService = require('../../cms-analytics/services/analytics.service');
    const report = await analyticsService.getReport(businessId);
    return report;
  } catch {
    return { executive: {}, financial: {}, operations: {}, customers: {} };
  }
}

module.exports = { getDeliveryAnalytics, getChannelPerformance, getCampaignPerformance, getOpenRateTrend, getNotificationAnalytics };

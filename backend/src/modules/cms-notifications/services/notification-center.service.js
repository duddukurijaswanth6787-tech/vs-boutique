const prisma = require('../../../utils/prisma');
const { eventBus, Events } = require('../../../services/eventBus');
const { notificationsService } = require('../../notifications/services/notifications.service');
const cache = require('../middleware/notification-cache');

async function getOverview(businessId) {
  const cacheKey = `overview:${businessId}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const [totalNotifications, totalAdminNotifs, totalCustomerNotifs, totalCampaigns, totalTemplates, recentNotifications] = await Promise.all([
    prisma.notification.count(),
    prisma.adminNotification.count(),
    prisma.customerNotification.count(),
    prisma.notificationCampaign.count(),
    prisma.notificationTemplate.count(),
    prisma.notification.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, title: true, type: true, createdAt: true } })
  ]);

  const result = {
    totalNotifications, totalAdminNotifs, totalCustomerNotifs,
    totalCampaigns, totalTemplates, recentNotifications,
    timestamp: new Date().toISOString()
  };

  await cache.set(cacheKey, result, 120);
  return result;
}

async function getDashboard(businessId) {
  const cacheKey = `dashboard:${businessId}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const [overview, analytics, deliveryStats] = await Promise.all([
    getOverview(businessId),
    getNotificationAnalytics(businessId).catch(() => ({})),
    getDeliveryStatistics(businessId).catch(() => ({}))
  ]);

  const result = { overview, analytics, deliveryStats, timestamp: new Date().toISOString() };
  await cache.set(cacheKey, result, 120);
  return result;
}

async function getNotificationAnalytics(businessId) {
  try {
    const analyticsService = require('../../cms-analytics/services/analytics.service');
    const report = await analyticsService.getReport(businessId);
    return report;
  } catch {
    return { totalSent: 0, delivered: 0, opened: 0, clicked: 0, openedRate: 0, clickedRate: 0 };
  }
}

async function getStatistics(businessId) {
  const cacheKey = `stats:${businessId}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const [totalSent, totalDelivered, totalFailed, totalOpened, totalClicked, pushCount, emailCount, smsCount] = await Promise.all([
    prisma.notification.count({ where: { status: 'sent' } }),
    prisma.notificationReceipt.count({ where: { deliveredAt: { not: null } } }),
    prisma.notification.count({ where: { status: 'failed' } }),
    prisma.notificationReceipt.count({ where: { openedAt: { not: null } } }),
    prisma.notificationReceipt.count({ where: { clickedAt: { not: null } } }),
    prisma.notification.count({ where: { sentPush: true } }),
    prisma.notification.count({ where: { sentEmail: true } }),
    prisma.notification.count({ where: { sentSms: true } })
  ]);

  const result = {
    totalSent, totalDelivered, totalFailed, totalOpened, totalClicked,
    deliveryRate: totalSent > 0 ? Number((totalDelivered / totalSent * 100).toFixed(1)) : 0,
    openRate: totalDelivered > 0 ? Number((totalOpened / totalDelivered * 100).toFixed(1)) : 0,
    clickRate: totalOpened > 0 ? Number((totalClicked / totalOpened * 100).toFixed(1)) : 0,
    failureRate: totalSent > 0 ? Number((totalFailed / totalSent * 100).toFixed(1)) : 0,
    channels: { push: pushCount, email: emailCount, sms: smsCount }
  };

  await cache.set(cacheKey, result, 120);
  return result;
}

async function getDeliveryStatistics(businessId) {
  const cacheKey = `delivery:${businessId}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const [totalRetried, totalBounced, queueStats] = await Promise.all([
    prisma.notification.count({ where: { status: 'retried' } }),
    prisma.notification.count({ where: { status: 'bounced' } }),
    (async () => {
      try {
        const queueManager = require('../../ai-core/queues/queueManager');
        const metrics = await queueManager.getQueueMetrics();
        return { pending: metrics?.waiting || 0, processing: metrics?.active || 0, completed: metrics?.completed || 0, failed: metrics?.failed || 0 };
      } catch { return { pending: 0, processing: 0, completed: 0, failed: 0 }; }
    })()
  ]);

  const result = { totalRetried, totalBounced, queue: queueStats };
  await cache.set(cacheKey, result, 120);
  return result;
}

async function getRecentNotifications(businessId, limit = 20) {
  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { id: true, title: true, message: true, type: true, status: true, isRead: true, createdAt: true }
  });
  return notifications;
}

async function getSystemNotifications(businessId, limit = 20) {
  const notifications = await prisma.adminNotification.findMany({
    where: { type: 'SYSTEM_ALERT' },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { id: true, title: true, message: true, priority: true, isRead: true, createdAt: true }
  });
  return notifications;
}

async function getCampaignSummary(businessId) {
  const campaigns = await prisma.notificationCampaign.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { id: true, name: true, status: true, channels: true, targetType: true, scheduledAt: true, createdAt: true }
  });
  return campaigns;
}

async function initializeDefaults() {
  const defaults = [
    { key: 'notification-retention-days', value: JSON.stringify({ days: 90 }), category: 'retention', description: 'Notification retention period in days' },
    { key: 'email-config', value: JSON.stringify({ enabled: true, provider: 'nodemailer' }), category: 'email', description: 'Email channel configuration' },
    { key: 'sms-config', value: JSON.stringify({ enabled: false }), category: 'sms', description: 'SMS channel configuration' },
    { key: 'push-config', value: JSON.stringify({ enabled: false }), category: 'push', description: 'Push channel configuration' },
    { key: 'webhook-config', value: JSON.stringify({ enabled: true, retryCount: 3 }), category: 'webhook', description: 'Webhook delivery configuration' },
    { key: 'notification-defaults', value: JSON.stringify({ channels: ['push', 'email'], priority: 'NORMAL' }), category: 'notification', description: 'Default notification settings' },
    { key: 'digest-config', value: JSON.stringify({ enabled: false, frequency: 'daily', time: '08:00' }), category: 'digest', description: 'Digest configuration' }
  ];
  let created = 0;
  for (const d of defaults) {
    const existing = await prisma.cmsAiSettings.findFirst({ where: { key: d.key, category: d.category } });
    if (!existing) { await prisma.cmsAiSettings.create({ data: d }); created++; }
  }
  return { initialized: true, created };
}

async function refreshCache() {
  await cache.delPattern('*');
  return { cleared: true };
}

module.exports = {
  getOverview, getDashboard, getNotificationAnalytics, getStatistics,
  getDeliveryStatistics, getRecentNotifications, getSystemNotifications,
  getCampaignSummary, initializeDefaults, refreshCache
};

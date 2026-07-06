const prisma = require('../../../utils/prisma');
const { eventBus, Events } = require('../../../services/eventBus');
const { notificationsService } = require('../../notifications/services/notifications.service');
const cache = require('../middleware/notification-cache');

async function getDeliveryStatistics(businessId) {
  const cacheKey = `delivery-stats:${businessId}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const [totalSent, totalDelivered, totalFailed, totalPending, totalRetried, totalBounced, byChannel] = await Promise.all([
    prisma.notification.count({ where: { status: 'sent' } }),
    prisma.notificationReceipt.count({ where: { deliveredAt: { not: null } } }),
    prisma.notification.count({ where: { status: 'failed' } }),
    prisma.notification.count({ where: { status: 'pending' } }),
    prisma.notification.count({ where: { status: 'retried' } }),
    prisma.notification.count({ where: { status: 'bounced' } }),
    (async () => {
      const [push, email, sms] = await Promise.all([
        prisma.notification.count({ where: { sentPush: true } }),
        prisma.notification.count({ where: { sentEmail: true } }),
        prisma.notification.count({ where: { sentSms: true } })
      ]);
      return { push, email, sms };
    })()
  ]);

  const result = {
    totalSent, totalDelivered, totalFailed, totalPending, totalRetried, totalBounced,
    deliveryRate: totalSent > 0 ? Number((totalDelivered / totalSent * 100).toFixed(1)) : 0,
    failureRate: totalSent > 0 ? Number((totalFailed / totalSent * 100).toFixed(1)) : 0,
    retryRate: totalSent > 0 ? Number((totalRetried / totalSent * 100).toFixed(1)) : 0,
    bounceRate: totalSent > 0 ? Number((totalBounced / totalSent * 100).toFixed(1)) : 0,
    byChannel
  };

  await cache.set(cacheKey, result, 120);
  return result;
}

async function retryNotification(notificationId) {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification) throw new Error('Notification not found');

  await prisma.notification.update({ where: { id: notificationId }, data: { status: 'pending' } });
  await cache.delPattern('*');
  try { eventBus.emit(Events.NOTIFICATION_RETRIED, { notificationId }); } catch (e) { console.error('[Notifications] delivery.service eventBus error:', e); }
  return { retried: true, notificationId };
}

async function retryFailedNotifications(businessId) {
  const failed = await prisma.notification.findMany({ where: { status: 'failed' }, select: { id: true } });
  const ids = failed.map(n => n.id);
  if (ids.length > 0) {
    await prisma.notification.updateMany({ where: { id: { in: ids } }, data: { status: 'pending' } });
  }
  await cache.delPattern('*');
  return { retried: ids.length };
}

async function getQueueStatus() {
  try {
    const queueManager = require('../../ai-core/queues/queueManager');
    const metrics = await queueManager.getQueueMetrics();
    return {
      pending: metrics?.waiting || 0,
      active: metrics?.active || 0,
      completed: metrics?.completed || 0,
      failed: metrics?.failed || 0,
      delayed: metrics?.delayed || 0
    };
  } catch {
    return { pending: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
  }
}

async function getFailureReasons(businessId) {
  const failures = await prisma.notification.groupBy({
    by: ['status'],
    where: { status: { in: ['failed', 'bounced'] } },
    _count: { id: true }
  });
  return failures.map(f => ({ status: f.status, count: f._count.id }));
}

module.exports = { getDeliveryStatistics, retryNotification, retryFailedNotifications, getQueueStatus, getFailureReasons };

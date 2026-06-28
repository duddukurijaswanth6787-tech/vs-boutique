const prisma = require('../../../utils/prisma');
const notificationsRepository = require('../repositories/notifications.repository');
const { logAction } = require('../../../services/auditService');

class NotificationError extends Error {
  constructor(message, status = 400, code = 'NOTIFICATION_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

class NotificationsService {
  // ── Admin Notifications (AdminNotification Model) ──
  async createAdminNotification({ recipientType, recipientId, boutiqueId, type, priority, title, message, entityType, entityId, metadata }) {
    return notificationsRepository.createAdminNotification({
      recipientType,
      recipientId,
      boutiqueId: boutiqueId || null,
      type,
      priority: priority || 'NORMAL',
      title,
      message,
      entityType: entityType || null,
      entityId: entityId || null,
      metadata: metadata || null,
    });
  }

  async getAdminNotifications(userId, role, boutiqueId, { limit = 50, offset = 0, unreadOnly = false, type, priority } = {}) {
    const where = {};

    if (role === 'super-admin') {
      where.recipientType = 'SUPER_ADMIN';
      where.recipientId = userId;
    } else if (role === 'owner') {
      where.OR = [
        { recipientType: 'OWNER', recipientId: userId },
        { recipientType: 'SUPER_ADMIN', boutiqueId: boutiqueId },
      ];
    } else {
      where.recipientType = 'EMPLOYEE';
      where.recipientId = userId;
    }

    if (unreadOnly) where.isRead = false;
    if (type) where.type = type;
    if (priority) where.priority = priority;

    const [notifications, total, unreadCount] = await Promise.all([
      notificationsRepository.findAdminNotifications(where, { createdAt: 'desc' }, offset, limit),
      notificationsRepository.countAdminNotifications(where),
      notificationsRepository.countAdminNotifications({ ...where, isRead: false }),
    ]);

    return { notifications, total, unreadCount };
  }

  async getAdminUnreadCount(userId, role, boutiqueId) {
    const where = {};
    if (role === 'super-admin') {
      where.recipientType = 'SUPER_ADMIN';
      where.recipientId = userId;
    } else if (role === 'owner') {
      where.OR = [
        { recipientType: 'OWNER', recipientId: userId },
        { recipientType: 'SUPER_ADMIN', boutiqueId: boutiqueId },
      ];
    } else {
      where.recipientType = 'EMPLOYEE';
      where.recipientId = userId;
    }
    where.isRead = false;

    return notificationsRepository.countAdminNotifications(where);
  }

  async markAdminNotificationRead(notificationId, userId) {
    const notification = await notificationsRepository.findAdminNotificationUnique(notificationId);
    if (!notification) throw new NotificationError('Notification not found', 404, 'NOT_FOUND');
    if (notification.recipientId !== userId) throw new NotificationError('Access denied', 403, 'ACCESS_DENIED');

    return notificationsRepository.updateAdminNotification(notificationId, { isRead: true });
  }

  async markAllAdminNotificationsRead(userId, role, boutiqueId) {
    const where = {};
    if (role === 'super-admin') {
      where.recipientType = 'SUPER_ADMIN';
      where.recipientId = userId;
    } else if (role === 'owner') {
      where.OR = [
        { recipientType: 'OWNER', recipientId: userId },
        { recipientType: 'SUPER_ADMIN', boutiqueId: boutiqueId },
      ];
    } else {
      where.recipientType = 'EMPLOYEE';
      where.recipientId = userId;
    }
    where.isRead = false;

    await notificationsRepository.updateManyAdminNotifications(where, { isRead: true });
  }

  async deleteAdminNotification(notificationId, userId) {
    const notification = await notificationsRepository.findAdminNotificationUnique(notificationId);
    if (!notification) throw new NotificationError('Notification not found', 404, 'NOT_FOUND');
    if (notification.recipientId !== userId) throw new NotificationError('Access denied', 403, 'ACCESS_DENIED');

    await notificationsRepository.deleteAdminNotification(notificationId);
  }

  // ── Customer Notifications (CustomerNotification Model) ──
  async createCustomerNotification({ customerId, type, title, message, entityType, entityId, metadata }) {
    if (!customerId || !type || !title || !message) {
      throw new NotificationError('Required fields: customerId, type, title, message', 400, 'VALIDATION_ERROR');
    }

    return notificationsRepository.createCustomerNotification({
      customerId,
      type,
      title,
      message,
      entityType: entityType || null,
      entityId: entityId ? entityId.toString() : null,
      metadata: metadata || null,
    });
  }

  async getCustomerNotifications(customerId, { limit = 50, offset = 0, unreadOnly = false } = {}) {
    const where = { customerId };
    if (unreadOnly) where.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      notificationsRepository.findCustomerNotifications(where, { createdAt: 'desc' }, offset, limit),
      notificationsRepository.countCustomerNotifications(where),
      notificationsRepository.countCustomerNotifications({ customerId, isRead: false }),
    ]);

    return { notifications, total, unreadCount };
  }

  async getCustomerUnreadCount(customerId) {
    return notificationsRepository.countCustomerNotifications({ customerId, isRead: false });
  }

  async markCustomerAsRead(notificationId, customerId) {
    const notification = await notificationsRepository.findCustomerNotificationUnique(notificationId);
    if (!notification) throw new NotificationError('Notification not found', 404, 'NOT_FOUND');
    if (notification.customerId !== customerId) throw new NotificationError('Access denied', 403, 'ACCESS_DENIED');

    return notificationsRepository.updateCustomerNotification(notificationId, { isRead: true });
  }

  async markAllCustomerRead(customerId) {
    await notificationsRepository.updateManyCustomerNotifications({ customerId, isRead: false }, { isRead: true });
  }

  async deleteCustomerNotification(notificationId, customerId) {
    const notification = await notificationsRepository.findCustomerNotificationUnique(notificationId);
    if (!notification) throw new NotificationError('Notification not found', 404, 'NOT_FOUND');
    if (notification.customerId !== customerId) throw new NotificationError('Access denied', 403, 'ACCESS_DENIED');

    await notificationsRepository.deleteCustomerNotification(notificationId);
  }

  // ── General / Campaign / Broadcast Notifications (Notification Model) ──
  mapNotificationResponse(n) {
    if (!n) return null;
    return {
      ...n,
      id: n.id,
      _id: n.id
    };
  }

  async getGeneralNotifications(userId, role) {
    let where = { isRead: false };

    if (role === 'owner') {
      where.recipientRole = 'owner';
      where.recipientId = userId;
    } else {
      where.recipientRole = 'super-admin';
    }

    const notifications = await notificationsRepository.findNotifications(where, { createdAt: 'desc' });
    return notifications.map(n => this.mapNotificationResponse(n));
  }

  async markGeneralNotificationRead(notificationId, userId) {
    const notification = await notificationsRepository.findNotificationUnique(notificationId);
    if (!notification) throw new NotificationError('Notification not found', 404, 'NOT_FOUND');

    const now = new Date();

    await prisma.$transaction([
      prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true }
      }),
      prisma.notificationReceipt.updateMany({
        where: {
          notificationId,
          OR: [
            { recipientOwnerId: userId },
            { recipientUserId: userId }
          ]
        },
        data: {
          openedAt: now,
          clickedAt: now
        }
      })
    ]);
  }

  async getSuperAdminAnalytics() {
    const [totalSent, pushCount, emailCount, smsCount, totalOpened, totalClicked] = await Promise.all([
      notificationsRepository.countNotifications({ status: 'sent' }),
      notificationsRepository.countNotifications({ sentPush: true }),
      notificationsRepository.countNotifications({ sentEmail: true }),
      notificationsRepository.countNotifications({ sentSms: true }),
      notificationsRepository.countReceipts({ openedAt: { not: null } }),
      notificationsRepository.countReceipts({ clickedAt: { not: null } })
    ]);

    const openedRate = totalSent > 0 ? Number((totalOpened / totalSent * 100).toFixed(1)) : 0;
    const clickedRate = totalSent > 0 ? Number((totalClicked / totalSent * 100).toFixed(1)) : 0;

    return {
      totalSent,
      delivered: totalSent,
      opened: totalOpened,
      clicked: totalClicked,
      openedRate,
      clickedRate,
      channels: {
        push: pushCount,
        email: emailCount,
        sms: smsCount
      }
    };
  }

  async broadcastNotification(userId, body) {
    const { title, message, type, targetType, targetValue, channels } = body;
    if (!title || !message || !targetType) {
      throw new NotificationError('Title, message, and targetType are required', 400);
    }

    const channelList = Array.isArray(channels) ? channels : ['push'];
    const now = new Date();

    let targetOwners = [];
    let targetUsers = [];

    if (targetType === 'ALL_OWNERS') {
      targetOwners = await prisma.owner.findMany({
        where: { role: 'owner', isDeleted: false },
        select: { id: true }
      });
    } else if (targetType === 'ALL_CUSTOMERS') {
      targetUsers = await prisma.user.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true }
      });
    } else if (targetType === 'VIP_CUSTOMERS') {
      targetUsers = await prisma.user.findMany({
        where: { status: 'ACTIVE', segment: 'VIP' },
        select: { id: true }
      });
    } else if (targetType === 'SPECIFIC_BOUTIQUE') {
      targetOwners = await prisma.owner.findMany({
        where: { assignedBoutiqueId: targetValue, isDeleted: false },
        select: { id: true }
      });
    } else if (targetType === 'SUBSCRIPTION_PLAN_BASED') {
      const boutiquesOnPlan = await prisma.boutiqueSubscription.findMany({
        where: { plan: { name: targetValue } },
        select: { boutiqueId: true }
      });
      const boutiqueIds = boutiquesOnPlan.map(b => b.boutiqueId);
      targetOwners = await prisma.owner.findMany({
        where: { assignedBoutiqueId: { in: boutiqueIds }, isDeleted: false },
        select: { id: true }
      });
    }

    const notification = await notificationsRepository.createNotification({
      recipientRole: targetType === 'ALL_CUSTOMERS' || targetType === 'VIP_CUSTOMERS' ? 'owner' : 'owner',
      title,
      message,
      type: type || 'BROADCAST',
      isBroadcast: true,
      targetType,
      targetValue: targetValue ? targetValue.toString() : null,
      sentPush: channelList.includes('push'),
      sentEmail: channelList.includes('email'),
      sentSms: channelList.includes('sms'),
      createdAt: now
    });

    const receiptData = [];
    targetOwners.forEach(o => {
      receiptData.push({
        notificationId: notification.id,
        recipientOwnerId: o.id,
        recipientUserId: null
      });
    });
    targetUsers.forEach(u => {
      receiptData.push({
        notificationId: notification.id,
        recipientOwnerId: null,
        recipientUserId: u.id
      });
    });

    if (receiptData.length > 0) {
      await notificationsRepository.createManyReceipts(receiptData);
    }

    await logAction('BROADCAST_NOTIFICATION', 'Notification', notification.id, userId, { targetType, count: receiptData.length });

    return {
      notification,
      recipientsCount: receiptData.length
    };
  }

  async getTemplates() {
    return notificationsRepository.findTemplates();
  }

  async createTemplate(body) {
    const { name, subject, body: bodyText, channels } = body;
    if (!name || !subject || !bodyText) {
      throw new NotificationError('Name, subject, and body are required', 400);
    }

    return notificationsRepository.upsertTemplate(name, subject, bodyText, channels);
  }

  async getCampaigns() {
    return notificationsRepository.findCampaigns();
  }

  async createCampaign(body) {
    const { name, title, message, targetType, targetValue, channels, scheduledAt } = body;
    if (!name || !title || !message || !targetType) {
      throw new NotificationError('Name, title, message, and targetType are required', 400);
    }

    const campaign = await notificationsRepository.createCampaign({
      name,
      title,
      message,
      targetType,
      targetValue: targetValue ? targetValue.toString() : null,
      channels: channels || ['push'],
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      status: scheduledAt ? 'scheduled' : 'completed'
    });

    if (!scheduledAt) {
      const channelList = channels || ['push'];
      let targetOwners = [];
      let targetUsers = [];

      if (targetType === 'ALL_OWNERS') {
        targetOwners = await prisma.owner.findMany({ where: { role: 'owner', isDeleted: false } });
      } else if (targetType === 'ALL_CUSTOMERS') {
        targetUsers = await prisma.user.findMany({ where: { status: 'ACTIVE' } });
      }

      const parentNotif = await notificationsRepository.createNotification({
        recipientRole: 'owner',
        title,
        message,
        type: 'BROADCAST',
        isBroadcast: true,
        targetType,
        targetValue: targetValue ? targetValue.toString() : null,
        sentPush: channelList.includes('push'),
        sentEmail: channelList.includes('email'),
        sentSms: channelList.includes('sms'),
        campaignId: campaign.id,
        createdAt: new Date()
      });

      const receiptData = [];
      targetOwners.forEach(o => {
        receiptData.push({ notificationId: parentNotif.id, recipientOwnerId: o.id });
      });
      targetUsers.forEach(u => {
        receiptData.push({ notificationId: parentNotif.id, recipientUserId: u.id });
      });

      if (receiptData.length > 0) {
        await notificationsRepository.createManyReceipts(receiptData);
      }
    }

    return campaign;
  }
}

module.exports = {
  notificationsService: new NotificationsService(),
  NotificationError
};

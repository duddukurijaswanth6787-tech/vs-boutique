const prisma = require('../../../utils/prisma');

class NotificationsRepository {
  // ── Admin Notifications (AdminNotification Model) ──
  async createAdminNotification(data, tx = prisma) {
    return tx.adminNotification.create({ data });
  }

  async findAdminNotificationUnique(id, tx = prisma) {
    return tx.adminNotification.findUnique({ where: { id } });
  }

  async findAdminNotifications(where = {}, orderBy = { createdAt: 'desc' }, skip, take, tx = prisma) {
    const options = { where, orderBy };
    if (skip !== undefined) options.skip = skip;
    if (take !== undefined) options.take = take;
    return tx.adminNotification.findMany(options);
  }

  async countAdminNotifications(where, tx = prisma) {
    return tx.adminNotification.count({ where });
  }

  async updateAdminNotification(id, data, tx = prisma) {
    return tx.adminNotification.update({
      where: { id },
      data
    });
  }

  async updateManyAdminNotifications(where, data, tx = prisma) {
    return tx.adminNotification.updateMany({
      where,
      data
    });
  }

  async deleteAdminNotification(id, tx = prisma) {
    return tx.adminNotification.delete({ where: { id } });
  }

  // ── Customer Notifications (CustomerNotification Model) ──
  async createCustomerNotification(data, tx = prisma) {
    return tx.customerNotification.create({ data });
  }

  async findCustomerNotificationUnique(id, tx = prisma) {
    return tx.customerNotification.findUnique({ where: { id } });
  }

  async findCustomerNotifications(where = {}, orderBy = { createdAt: 'desc' }, skip, take, tx = prisma) {
    const options = { where, orderBy };
    if (skip !== undefined) options.skip = skip;
    if (take !== undefined) options.take = take;
    return tx.customerNotification.findMany(options);
  }

  async countCustomerNotifications(where, tx = prisma) {
    return tx.customerNotification.count({ where });
  }

  async updateCustomerNotification(id, data, tx = prisma) {
    return tx.customerNotification.update({
      where: { id },
      data
    });
  }

  async updateManyCustomerNotifications(where, data, tx = prisma) {
    return tx.customerNotification.updateMany({
      where,
      data
    });
  }

  async deleteCustomerNotification(id, tx = prisma) {
    return tx.customerNotification.delete({ where: { id } });
  }

  // ── General / Campaign / Broadcast Notifications ──
  async createNotification(data, tx = prisma) {
    return tx.notification.create({ data });
  }

  async findNotificationUnique(id, tx = prisma) {
    return tx.notification.findUnique({ where: { id } });
  }

  async findNotifications(where = {}, orderBy = { createdAt: 'desc' }, skip, take, tx = prisma) {
    const options = { where, orderBy };
    if (skip !== undefined) options.skip = skip;
    if (take !== undefined) options.take = take;
    return tx.notification.findMany(options);
  }

  async countNotifications(where, tx = prisma) {
    return tx.notification.count({ where });
  }

  async updateNotification(id, data, tx = prisma) {
    return tx.notification.update({
      where: { id },
      data
    });
  }

  async createManyReceipts(data, tx = prisma) {
    return tx.notificationReceipt.createMany({ data });
  }

  async updateManyReceipts(where, data, tx = prisma) {
    return tx.notificationReceipt.updateMany({ where, data });
  }

  async countReceipts(where, tx = prisma) {
    return tx.notificationReceipt.count({ where });
  }

  async findTemplates(tx = prisma) {
    return tx.notificationTemplate.findMany();
  }

  async upsertTemplate(name, subject, body, channels, tx = prisma) {
    return tx.notificationTemplate.upsert({
      where: { name },
      update: { subject, body, channels: channels || [] },
      create: { name, subject, body, channels: channels || [] }
    });
  }

  async findCampaigns(tx = prisma) {
    return tx.notificationCampaign.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async createCampaign(data, tx = prisma) {
    return tx.notificationCampaign.create({ data });
  }
}

module.exports = new NotificationsRepository();

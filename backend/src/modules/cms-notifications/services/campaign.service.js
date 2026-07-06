const prisma = require('../../../utils/prisma');
const { eventBus, Events } = require('../../../services/eventBus');
const { notificationsService } = require('../../notifications/services/notifications.service');
const cache = require('../middleware/notification-cache');

async function getCampaigns() {
  const cacheKey = 'campaigns';
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const campaigns = await notificationsService.getCampaigns();
  await cache.set(cacheKey, campaigns, 120);
  return campaigns;
}

async function getCampaign(campaignId) {
  const campaign = await prisma.notificationCampaign.findUnique({ where: { id: campaignId } });
  if (!campaign) return null;
  const notificationCount = await prisma.notification.count({ where: { campaignId } });
  return { ...campaign, notificationCount };
}

async function createCampaign(data) {
  const campaign = await notificationsService.createCampaign(data);
  await cache.delPattern('*');
  try { eventBus.emit(Events.NOTIFICATION_CAMPAIGN_STARTED, { campaignId: campaign.id, name: campaign.name }); } catch (e) { console.error('[Notifications] campaign.service eventBus error:', e); }
  return campaign;
}

async function updateCampaign(campaignId, data) {
  const existing = await prisma.notificationCampaign.findUnique({ where: { id: campaignId } });
  if (!existing) throw new Error('Campaign not found');
  const updated = await prisma.notificationCampaign.update({
    where: { id: campaignId },
    data: { name: data.name, title: data.title, message: data.message, channels: data.channels, scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined, status: data.status }
  });
  await cache.delPattern('*');
  return updated;
}

async function deleteCampaign(campaignId) {
  const existing = await prisma.notificationCampaign.findUnique({ where: { id: campaignId } });
  if (!existing) throw new Error('Campaign not found');
  await prisma.notificationCampaign.delete({ where: { id: campaignId } });
  await cache.delPattern('*');
  return { deleted: true };
}

async function launchCampaign(campaignId) {
  const campaign = await prisma.notificationCampaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new Error('Campaign not found');
  if (campaign.status !== 'draft') throw new Error('Campaign must be in draft status to launch');

  const channelList = campaign.channels.length > 0 ? campaign.channels : ['push'];
  let targetOwners = [];
  let targetUsers = [];

  if (campaign.targetType === 'ALL_OWNERS') {
    targetOwners = await prisma.owner.findMany({ where: { role: 'owner', isDeleted: false }, select: { id: true } });
  } else if (campaign.targetType === 'ALL_CUSTOMERS') {
    targetUsers = await prisma.user.findMany({ where: { status: 'ACTIVE' }, select: { id: true } });
  } else if (campaign.targetType === 'VIP_CUSTOMERS') {
    targetUsers = await prisma.user.findMany({ where: { status: 'ACTIVE', segment: 'VIP' }, select: { id: true } });
  }

  const notification = await prisma.notification.create({
    data: {
      recipientRole: 'owner', title: campaign.title, message: campaign.message,
      type: 'BROADCAST', isBroadcast: true, targetType: campaign.targetType,
      targetValue: campaign.targetValue || null, campaignId: campaign.id,
      sentPush: channelList.includes('push'), sentEmail: channelList.includes('email'),
      sentSms: channelList.includes('sms'), createdAt: new Date()
    }
  });

  const receipts = [];
  targetOwners.forEach(o => receipts.push({ notificationId: notification.id, recipientOwnerId: o.id }));
  targetUsers.forEach(u => receipts.push({ notificationId: notification.id, recipientUserId: u.id }));
  if (receipts.length > 0) {
    await prisma.notificationReceipt.createMany({ data: receipts });
  }

  await prisma.notificationCampaign.update({ where: { id: campaignId }, data: { status: 'active' } });
  await cache.delPattern('*');

  try { eventBus.emit(Events.NOTIFICATION_CAMPAIGN_STARTED, { campaignId, name: campaign.name, recipientsCount: receipts.length }); } catch (e) { console.error('[Notifications] campaign.service eventBus error:', e); }

  return { campaign, notification, recipientsCount: receipts.length };
}

async function completeCampaign(campaignId) {
  await prisma.notificationCampaign.update({ where: { id: campaignId }, data: { status: 'completed' } });
  await cache.delPattern('*');
  try { eventBus.emit(Events.NOTIFICATION_CAMPAIGN_COMPLETED, { campaignId }); } catch (e) { console.error('[Notifications] campaign.service eventBus error:', e); }
  return { completed: true };
}

async function getCampaignAnalytics(campaignId) {
  const notifications = await prisma.notification.findMany({ where: { campaignId } });
  const receipts = await prisma.notificationReceipt.findMany({ where: { notificationId: { in: notifications.map(n => n.id) } } });
  const totalSent = notifications.length;
  const totalDelivered = receipts.filter(r => r.deliveredAt).length;
  const totalOpened = receipts.filter(r => r.openedAt).length;
  return {
    totalSent, totalDelivered, totalOpened,
    deliveryRate: totalSent > 0 ? Number((totalDelivered / totalSent * 100).toFixed(1)) : 0,
    openRate: totalDelivered > 0 ? Number((totalOpened / totalDelivered * 100).toFixed(1)) : 0
  };
}

module.exports = { getCampaigns, getCampaign, createCampaign, updateCampaign, deleteCampaign, launchCampaign, completeCampaign, getCampaignAnalytics };

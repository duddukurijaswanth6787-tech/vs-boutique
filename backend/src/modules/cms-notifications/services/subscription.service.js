const prisma = require('../../../utils/prisma');
const cache = require('../middleware/notification-cache');

async function getSubscriptionConfig(businessId) {
  const setting = await prisma.cmsAiSettings.findFirst({ where: { key: `sub:${businessId}`, category: 'notification' } });
  if (!setting) return { channels: ['push', 'email'], digest: false, maxRetries: 3, priority: 'NORMAL' };
  try { return JSON.parse(setting.value); } catch { return {}; }
}

async function updateSubscriptionConfig(businessId, data) {
  const existing = await prisma.cmsAiSettings.findFirst({ where: { key: `sub:${businessId}`, category: 'notification' } });
  const value = typeof data === 'object' ? data : {};
  if (existing) {
    const current = (() => { try { return JSON.parse(existing.value); } catch { return {}; } })();
    await prisma.cmsAiSettings.update({ where: { id: existing.id }, data: { value: { ...current, ...value } } });
  } else {
    await prisma.cmsAiSettings.create({ data: { key: `sub:${businessId}`, value, category: 'notification', description: `Notification subscription config: ${businessId}` } });
  }
  await cache.delPattern('*');
  return getSubscriptionConfig(businessId);
}

async function getDigestConfig(businessId) {
  const setting = await prisma.cmsAiSettings.findFirst({ where: { key: `digest:${businessId}`, category: 'digest' } });
  if (!setting) return { enabled: false, frequency: 'daily', time: '08:00', channels: ['email'] };
  try { return JSON.parse(setting.value); } catch { return {}; }
}

async function updateDigestConfig(businessId, data) {
  const existing = await prisma.cmsAiSettings.findFirst({ where: { key: `digest:${businessId}`, category: 'digest' } });
  const value = typeof data === 'object' ? data : {};
  if (existing) {
    const current = (() => { try { return JSON.parse(existing.value); } catch { return {}; } })();
    await prisma.cmsAiSettings.update({ where: { id: existing.id }, data: { value: { ...current, ...value } } });
  } else {
    await prisma.cmsAiSettings.create({ data: { key: `digest:${businessId}`, value, category: 'digest', description: `Digest config: ${businessId}` } });
  }
  await cache.delPattern('*');
  return getDigestConfig(businessId);
}

async function getRetentionConfig() {
  const setting = await prisma.cmsAiSettings.findFirst({ where: { category: 'retention' } });
  if (!setting) return { retentionDays: 90 };
  try { return JSON.parse(setting.value); } catch { return { retentionDays: 90 }; }
}

async function updateRetentionConfig(data) {
  const existing = await prisma.cmsAiSettings.findFirst({ where: { category: 'retention' } });
  if (existing) {
    await prisma.cmsAiSettings.update({ where: { id: existing.id }, data: { value: { retentionDays: data.retentionDays || 90 } } });
  } else {
    await prisma.cmsAiSettings.create({ data: { key: 'notification-retention-days', value: { retentionDays: data.retentionDays || 90 }, category: 'retention', description: 'Notification retention period' } });
  }
  await cache.delPattern('*');
  return getRetentionConfig();
}

module.exports = { getSubscriptionConfig, updateSubscriptionConfig, getDigestConfig, updateDigestConfig, getRetentionConfig, updateRetentionConfig };

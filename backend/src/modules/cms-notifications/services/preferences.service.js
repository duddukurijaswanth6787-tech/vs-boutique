const prisma = require('../../../utils/prisma');
const cache = require('../middleware/notification-cache');

async function getUserPreferences(userId) {
  const setting = await prisma.cmsAiSettings.findFirst({ where: { key: `prefs:user:${userId}`, category: 'preferences' } });
  if (!setting) return { channels: ['push', 'email'], digest: false, quietHours: { enabled: false, start: '22:00', end: '07:00' } };
  try { return JSON.parse(setting.value); } catch { return {}; }
}

async function updateUserPreferences(userId, data) {
  const existing = await prisma.cmsAiSettings.findFirst({ where: { key: `prefs:user:${userId}`, category: 'preferences' } });
  const value = typeof data === 'object' ? data : {};
  if (existing) {
    const current = (() => { try { return JSON.parse(existing.value); } catch { return {}; } })();
    await prisma.cmsAiSettings.update({ where: { id: existing.id }, data: { value: { ...current, ...value } } });
  } else {
    await prisma.cmsAiSettings.create({ data: { key: `prefs:user:${userId}`, value, category: 'preferences', description: `User notification preferences: ${userId}` } });
  }
  await cache.delPattern('*');
  return getUserPreferences(userId);
}

async function getBusinessPreferences(businessId) {
  const setting = await prisma.cmsAiSettings.findFirst({ where: { key: `prefs:biz:${businessId}`, category: 'preferences' } });
  if (!setting) return { channels: ['push', 'email', 'sms'], branding: {}, fromEmail: '', fromName: '' };
  try { return JSON.parse(setting.value); } catch { return {}; }
}

async function updateBusinessPreferences(businessId, data) {
  const existing = await prisma.cmsAiSettings.findFirst({ where: { key: `prefs:biz:${businessId}`, category: 'preferences' } });
  const value = typeof data === 'object' ? data : {};
  if (existing) {
    const current = (() => { try { return JSON.parse(existing.value); } catch { return {}; } })();
    await prisma.cmsAiSettings.update({ where: { id: existing.id }, data: { value: { ...current, ...value } } });
  } else {
    await prisma.cmsAiSettings.create({ data: { key: `prefs:biz:${businessId}`, value, category: 'preferences', description: `Business notification preferences: ${businessId}` } });
  }
  await cache.delPattern('*');
  return getBusinessPreferences(businessId);
}

async function getTenantPreferences(tenantId) {
  const setting = await prisma.cmsAiSettings.findFirst({ where: { key: `prefs:tenant:${tenantId}`, category: 'preferences' } });
  if (!setting) return { globalChannels: ['push', 'email', 'sms'], retentionDays: 90, digestEnabled: false };
  try { return JSON.parse(setting.value); } catch { return {}; }
}

async function updateTenantPreferences(tenantId, data) {
  const existing = await prisma.cmsAiSettings.findFirst({ where: { key: `prefs:tenant:${tenantId}`, category: 'preferences' } });
  const value = typeof data === 'object' ? data : {};
  if (existing) {
    const current = (() => { try { return JSON.parse(existing.value); } catch { return {}; } })();
    await prisma.cmsAiSettings.update({ where: { id: existing.id }, data: { value: { ...current, ...value } } });
  } else {
    await prisma.cmsAiSettings.create({ data: { key: `prefs:tenant:${tenantId}`, value, category: 'preferences', description: `Tenant notification preferences: ${tenantId}` } });
  }
  await cache.delPattern('*');
  return getTenantPreferences(tenantId);
}

async function getChannelConfig(category) {
  const setting = await prisma.cmsAiSettings.findFirst({ where: { category } });
  if (!setting) return { enabled: false };
  try { return JSON.parse(setting.value); } catch { return {}; }
}

async function updateChannelConfig(category, data) {
  const existing = await prisma.cmsAiSettings.findFirst({ where: { category } });
  if (existing) {
    const current = (() => { try { return JSON.parse(existing.value); } catch { return {}; } })();
    await prisma.cmsAiSettings.update({ where: { id: existing.id }, data: { value: { ...current, ...data } } });
  } else {
    await prisma.cmsAiSettings.create({ data: { key: `config:${category}`, value: data, category, description: `${category} channel configuration` } });
  }
  await cache.delPattern('*');
  return getChannelConfig(category);
}

module.exports = { getUserPreferences, updateUserPreferences, getBusinessPreferences, updateBusinessPreferences, getTenantPreferences, updateTenantPreferences, getChannelConfig, updateChannelConfig };

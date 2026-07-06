const prisma = require('../../../utils/prisma');
const { eventBus, Events } = require('../../../services/eventBus');
const cache = require('../middleware/partner-cache');

async function getBrandKits(businessId) {
  const cacheKey = `brand-kits:${businessId}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const kits = await prisma.cmsAiSettings.findMany({
    where: { category: 'brand-kit' }
  });

  const result = kits.map(k => {
    try {
      const v = JSON.parse(k.value);
      return { id: k.id, key: k.key, name: v.name || k.key, ...v };
    } catch { return null; }
  }).filter(Boolean);

  await cache.set(cacheKey, result, 300);
  return result;
}

async function getBrandKit(businessId, kitId) {
  if (!kitId || typeof kitId !== 'string' || kitId.length < 8) return null;
  try {
    const kit = await prisma.cmsAiSettings.findFirst({
      where: { id: kitId, category: 'brand-kit' }
    });
    if (!kit) return null;
    const v = typeof kit.value === 'string' ? JSON.parse(kit.value) : kit.value;
    return { id: kit.id, key: kit.key, name: v.name || kit.key, ...v };
  } catch { return null; }
}

async function createBrandKit(businessId, data) {
  const { name, logoUrl, primaryColor, secondaryColor, typography, emailBranding, smsBranding, invoiceBranding, portalBranding } = data;

  const key = `brand-kit:${name?.toLowerCase().replace(/\s+/g, '-') || Date.now()}`;

  const value = {
    name: name || 'Unnamed Kit',
    logoUrl: logoUrl || '',
    primaryColor: primaryColor || '#3B82F6',
    secondaryColor: secondaryColor || '#10B981',
    typography: typography || { fontFamily: 'Inter, sans-serif', headingFont: 'Inter, sans-serif' },
    emailBranding: emailBranding || { enabled: false, headerColor: '#3B82F6', footerText: '' },
    smsBranding: smsBranding || { enabled: false, senderName: '' },
    invoiceBranding: invoiceBranding || { enabled: false, logoPosition: 'top', accentColor: '#3B82F6' },
    portalBranding: portalBranding || { enabled: false, loginBackground: '', dashboardTheme: 'light' }
  };

  const record = await prisma.cmsAiSettings.create({
    data: { key, value, category: 'brand-kit', description: `Brand kit: ${name}` }
  });

  await cache.delPattern('*');

  try { eventBus.emit(Events.PARTNER_BRANDING_CHANGED, { businessId, kit: key }); } catch (e) { console.error('[Branding Service] createBrandKit event error:', e); }

  return { id: record.id, key: record.key, name: name || 'Unnamed Kit', ...value, ...data };
}

async function updateBrandKit(businessId, kitId, data) {
  const kit = await prisma.cmsAiSettings.findFirst({
    where: { id: kitId, category: 'brand-kit' }
  });
  if (!kit) throw new Error('Brand kit not found');

  const current = (() => { try { return JSON.parse(kit.value); } catch { return {}; } })();
  const updated = { ...current, ...data };

  await prisma.cmsAiSettings.update({
    where: { id: kit.id },
    data: { value: updated }
  });

  await cache.delPattern('*');

  try { eventBus.emit(Events.PARTNER_BRANDING_CHANGED, { businessId, kit: kit.key }); } catch (e) { console.error('[Branding Service] updateBrandKit event error:', e); }

  return getBrandKit(businessId, kitId);
}

async function deleteBrandKit(businessId, kitId) {
  const kit = await prisma.cmsAiSettings.findFirst({
    where: { id: kitId, category: 'brand-kit' }
  });
  if (kit) {
    await prisma.cmsAiSettings.delete({ where: { id: kit.id } });
  }
  await cache.delPattern('*');
  return { deleted: true };
}

async function getBrandingConfig(businessId) {
  try {
    const settings = require('../../cms-settings/services/settings.service');
    const branding = await settings.getCategory('branding');
    return branding;
  } catch {
    const config = await prisma.cmsAssignmentConfiguration.findFirst({
      where: { businessId },
      select: { theme: true, primaryColor: true, secondaryColor: true, logoUrl: true, faviconUrl: true, metaTitle: true, metaDescription: true }
    });
    return config;
  }
}

async function updateBrandingConfig(businessId, data) {
  const config = await prisma.cmsAssignmentConfiguration.findFirst({ where: { businessId } });
  if (config) {
    await prisma.cmsAssignmentConfiguration.update({
      where: { id: config.id },
      data: { ...data }
    });
  } else {
    await prisma.cmsAssignmentConfiguration.create({
      data: { businessId, ...data }
    });
  }

  await cache.delPattern('*');

  try { eventBus.emit(Events.PARTNER_BRANDING_CHANGED, { businessId }); } catch (e) { console.error('[Branding Service] updateBrandingConfig event error:', e); }

  return getBrandingConfig(businessId);
}

async function getPartnerTheme(businessId) {
  const theme = await prisma.boutiqueTheme.findUnique({
    where: { businessId }
  });
  return theme;
}

async function updatePartnerTheme(businessId, data) {
  const existing = await prisma.boutiqueTheme.findUnique({ where: { businessId } });
  if (existing) {
    await prisma.boutiqueTheme.update({
      where: { id: existing.id },
      data: { ...data }
    });
  } else {
    await prisma.boutiqueTheme.create({
      data: { businessId, ...data }
    });
  }

  await cache.delPattern('*');

  try { eventBus.emit(Events.PARTNER_THEME_CHANGED, { businessId }); } catch (e) { console.error('[Branding Service] updatePartnerTheme event error:', e); }

  return getPartnerTheme(businessId);
}

module.exports = {
  getBrandKits, getBrandKit, createBrandKit, updateBrandKit, deleteBrandKit,
  getBrandingConfig, updateBrandingConfig, getPartnerTheme, updatePartnerTheme
};

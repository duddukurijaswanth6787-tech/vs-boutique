const prisma = require('../../../utils/prisma');
const { eventBus, Events } = require('../../../services/eventBus');
const cache = require('../middleware/partner-cache');

async function getPartners(businessId, partnerType) {
  const cacheKey = `partners:${businessId}:${partnerType || 'all'}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const where = {};
  if (partnerType) where.category = partnerType;
  where.value = { path: ['businessId'], not: null };

  const settings = await prisma.cmsAiSettings.findMany({
    where: { category: { in: ['partner', 'partner-agency', 'partner-reseller', 'partner-franchise', 'partner-oem'] } }
  });

  const partnerIds = [...new Set(settings.map(s => {
    try { return JSON.parse(s.value)?.businessId; } catch { return null; }
  }).filter(Boolean))];

  const partners = await prisma.business.findMany({
    where: { id: { in: partnerIds } },
    select: { id: true, name: true, status: true, createdAt: true }
  });

  const enriched = partners.map(p => {
    const cfg = settings.find(s => {
      try { return JSON.parse(s.value)?.businessId === p.id; } catch { return false; }
    });
    const meta = cfg ? (() => { try { return JSON.parse(cfg.value); } catch { return {}; } })() : {};
    if (partnerType && meta.partnerType !== partnerType.replace('partner-', '')) return null;
    return {
      id: p.id, name: p.name, status: p.status,
      partnerType: meta.partnerType || 'partner',
      commissionRate: meta.commissionRate || 0,
      contactEmail: meta.contactEmail || '',
      contactPhone: meta.contactPhone || '',
      address: meta.address || '',
      logoUrl: meta.logoUrl || '',
      createdAt: p.createdAt
    };
  }).filter(Boolean);

  await cache.set(cacheKey, enriched, 300);
  return enriched;
}

async function getPartner(businessId, partnerBusinessId) {
  const setting = await prisma.cmsAiSettings.findFirst({
    where: {
      category: { in: ['partner', 'partner-agency', 'partner-reseller', 'partner-franchise', 'partner-oem'] },
      value: { path: ['businessId'], equals: partnerBusinessId }
    }
  });

  if (!setting) return null;

  const business = await prisma.business.findUnique({
    where: { id: partnerBusinessId },
    select: { id: true, name: true, status: true, createdAt: true }
  });

  if (!business) return null;

  const meta = (() => { try { return JSON.parse(setting.value); } catch { return {}; } })();
  return {
    id: business.id, name: business.name, status: business.status,
    partnerType: meta.partnerType || 'partner',
    commissionRate: meta.commissionRate || 0,
    contactEmail: meta.contactEmail || '',
    contactPhone: meta.contactPhone || '',
    address: meta.address || '',
    logoUrl: meta.logoUrl || '',
    website: meta.website || '',
    taxId: meta.taxId || '',
    notes: meta.notes || '',
    createdAt: business.createdAt
  };
}

async function createPartner(businessId, data) {
  const { name, partnerType, commissionRate, contactEmail, contactPhone, address, logoUrl, website, taxId, notes } = data;

  const tenantId = (await prisma.tenant.findFirst({ select: { id: true } }))?.id || '00000000-0000-0000-0000-000000000000';

  const business = await prisma.business.create({
    data: { name, status: 'ACTIVE', nicheVertical: 'partner', tenantId }
  });

  const category = partnerType === 'agency' ? 'partner-agency'
    : partnerType === 'reseller' ? 'partner-reseller'
    : partnerType === 'franchise' ? 'partner-franchise'
    : partnerType === 'oem' ? 'partner-oem'
    : 'partner';

  const value = {
    businessId: business.id,
    partnerType: partnerType || 'partner',
    commissionRate: commissionRate || 0,
    contactEmail: contactEmail || '',
    contactPhone: contactPhone || '',
    address: address || '',
    logoUrl: logoUrl || '',
    website: website || '',
    taxId: taxId || '',
    notes: notes || ''
  };

  await prisma.cmsAiSettings.create({
    data: {
      key: `partner:${business.id}`,
      value,
      category,
      description: `Partner: ${name} (${partnerType || 'partner'})`
    }
  });

  await cache.delPattern('*');

  try { eventBus.emit(Events.PARTNER_CREATED, { businessId, partner: { id: business.id, name, partnerType } }); } catch (e) { console.error('[Partner Service] partner created event error:', e); }

  await cache.delPattern('*');

  return {
    id: business.id, name, status: business.status,
    partnerType: partnerType || 'partner',
    commissionRate: commissionRate || 0,
    contactEmail: contactEmail || '',
    contactPhone: contactPhone || '',
    address: address || '',
    logoUrl: logoUrl || '',
    website: website || '',
    taxId: taxId || '',
    notes: notes || '',
    createdAt: business.createdAt
  };
}

async function updatePartner(businessId, partnerBusinessId, data) {
  const existing = await getPartner(businessId, partnerBusinessId);
  if (!existing) throw new Error('Partner not found');

  const category = data.partnerType === 'agency' ? 'partner-agency'
    : data.partnerType === 'reseller' ? 'partner-reseller'
    : data.partnerType === 'franchise' ? 'partner-franchise'
    : data.partnerType === 'oem' ? 'partner-oem'
    : 'partner';

  const setting = await prisma.cmsAiSettings.findFirst({
    where: {
      category: { in: ['partner', 'partner-agency', 'partner-reseller', 'partner-franchise', 'partner-oem'] },
      value: { path: ['businessId'], equals: partnerBusinessId }
    }
  });

  if (setting) {
    const current = (() => { try { return JSON.parse(setting.value); } catch { return {}; } })();
    const updated = { ...current, ...data, businessId: partnerBusinessId };
    await prisma.cmsAiSettings.update({
      where: { id: setting.id },
      data: { value: updated, category }
    });
  }

  if (data.name) {
    await prisma.business.update({ where: { id: partnerBusinessId }, data: { name: data.name } });
  }

  await cache.delPattern('*');

  try { eventBus.emit(Events.PARTNER_UPDATED, { businessId, partnerId: partnerBusinessId }); } catch (e) { console.error('[Partner Service] partner updated event error:', e); }

  return getPartner(businessId, partnerBusinessId);
}

async function deletePartner(businessId, partnerBusinessId) {
  const setting = await prisma.cmsAiSettings.findFirst({
    where: {
      category: { in: ['partner', 'partner-agency', 'partner-reseller', 'partner-franchise', 'partner-oem'] },
      value: { path: ['businessId'], equals: partnerBusinessId }
    }
  });

  if (setting) {
    await prisma.cmsAiSettings.delete({ where: { id: setting.id } });
  }

  await cache.delPattern('*');
  return { deleted: true };
}

async function getPartnerAnalytics(businessId) {
  try {
    const analytics = require('../../cms-analytics/services/analytics.service');
    const overview = await analytics.getOverview(businessId);
    return overview;
  } catch {
    return { executive: {}, financial: {}, operations: {}, customers: {} };
  }
}

async function getPartnerHealth(businessId) {
  try {
    const customerSuccess = require('../../cms-customer-success/services/customer-success.service');
    const health = await customerSuccess.getBusinessHealth(businessId);
    return health;
  } catch {
    return { overall: 'unknown', score: 0 };
  }
}

async function getPartnerInfrastructure(businessId) {
  try {
    const infraService = require('../../cms-infrastructure/services/infrastructure.service');
    const result = await infraService.getOverview(businessId);
    return result;
  } catch {
    return { infrastructureScore: 0, riskLevel: 'unknown' };
  }
}

async function getPartnerDeployments(businessId) {
  try {
    const deploymentService = require('../../cms-deployment/services/deployment.service');
    const stats = await deploymentService.getDeploymentStats(businessId);
    return stats;
  } catch {
    return { totalDeployments: 0 };
  }
}

async function getPartnerCompliance(businessId) {
  try {
    const compliance = require('../../cms-compliance/services/analytics.service');
    const result = await compliance.getComplianceAnalytics(businessId);
    return result;
  } catch {
    return { auditTrend: { buckets: [] } };
  }
}

async function getPartnerMonitoring(businessId) {
  try {
    const monitoring = require('../../cms-monitoring/services/health.service');
    const health = await monitoring.getAggregateHealth();
    return health;
  } catch {
    return { overall: 'unknown' };
  }
}

async function getPartnerMarketplace(businessId) {
  try {
    const marketplace = require('../../cms-marketplace/services/marketplace.service');
    const analytics = await marketplace.getCategory('analytics');
    return analytics;
  } catch {
    const [installs, pkgCount] = await Promise.all([
      prisma.marketplaceInstallation.count(),
      prisma.marketplacePackage.count().catch(() => 0)
    ]);
    return { totalInstallations: installs, totalPackages: pkgCount };
  }
}

async function initializeDefaults() {
  const defaults = [
    { key: 'default-commission-rate', value: JSON.stringify({ rate: 10 }), category: 'partner', description: 'Default partner commission rate' },
    { key: 'partner-onboarding-flow', value: JSON.stringify({ steps: ['create', 'configure', 'brand', 'deploy'] }), category: 'partner', description: 'Partner onboarding flow steps' },
    { key: 'brand-kit-defaults', value: JSON.stringify({ primaryColor: '#3B82F6', secondaryColor: '#10B981' }), category: 'brand-kit', description: 'Default brand kit colors' },
    { key: 'white-label-settings', value: JSON.stringify({ removeAntairBranding: false }), category: 'partner', description: 'White label global settings' }
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
  getPartners, getPartner, createPartner, updatePartner, deletePartner,
  getPartnerAnalytics, getPartnerHealth, getPartnerInfrastructure,
  getPartnerDeployments, getPartnerCompliance, getPartnerMonitoring,
  getPartnerMarketplace, initializeDefaults, refreshCache
};

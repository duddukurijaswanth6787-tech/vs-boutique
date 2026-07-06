const prisma = require('../../../utils/prisma');
const { eventBus, Events } = require('../../../services/eventBus');

async function getRegions(businessId) {
  const settings = await prisma.cmsAiSettings.findMany({
    where: { category: 'region' },
    select: { id: true, key: true, value: true }
  });

  const regions = settings.map(s => {
    try { return { id: s.id, ...JSON.parse(s.value), key: s.key }; }
    catch { return { id: s.id, key: s.key, name: s.key }; }
  });

  const enriched = await Promise.all(regions.map(async (r) => {
    const envCount = await prisma.deploymentEnvironment.count({
      where: { businessId, isActive: true }
    });
    const domainCount = await prisma.deploymentDomain.count({
      where: { businessId, isDeleted: false }
    });
    return { ...r, environmentCount: envCount, domainCount, status: envCount > 0 ? 'active' : 'inactive' };
  }));

  return enriched;
}

async function getRegionHealth(businessId) {
  const regions = await getRegions(businessId);
  const health = regions.map(r => {
    const score = r.environmentCount > 0 ? 80 + Math.min(r.environmentCount * 5, 20) : 0;
    return { region: r.name || r.key, status: r.status, environmentCount: r.environmentCount, score };
  });
  const averageScore = health.length > 0 ? Math.round(health.reduce((s, h) => s + h.score, 0) / health.length) : 0;
  return { regions: health, averageScore, totalRegions: regions.length };
}

async function createRegion(businessId, data) {
  const key = data.name.toLowerCase().replace(/\s+/g, '-');
  const existing = await prisma.cmsAiSettings.findFirst({ where: { key, category: 'region' } });
  if (existing) throw new Error(`Region "${key}" already exists`);

  const setting = await prisma.cmsAiSettings.create({
    data: {
      key,
      value: JSON.stringify({ name: data.name, provider: data.provider || 'aws', locations: data.locations || [], status: 'active' }),
      category: 'region',
      description: `Region: ${data.name}`
    }
  });

  try { eventBus.emit(Events.INFRA_REGION_ONLINE, { region: data.name, businessId }); } catch (e) { console.error('[Region Service] region online event error:', e); }

  return { id: setting.id, key: setting.key, name: data.name, provider: data.provider || 'aws' };
}

async function updateRegion(businessId, id, data) {
  const existing = await prisma.cmsAiSettings.findFirst({ where: { id, category: 'region' } });
  if (!existing) throw new Error('Region not found');

  const current = JSON.parse(existing.value || '{}');
  const updated = await prisma.cmsAiSettings.update({
    where: { id },
    data: {
      value: JSON.stringify({
        ...current,
        name: data.name || current.name,
        provider: data.provider || current.provider,
        locations: data.locations || current.locations,
        status: data.status || current.status || 'active'
      })
    }
  });

  if (data.status === 'offline') {
    try { eventBus.emit(Events.INFRA_REGION_OFFLINE, { region: current.name, businessId }); } catch (e) { console.error('[Region Service] region offline event error:', e); }
  }

  return { id: updated.id, ...JSON.parse(updated.value) };
}

async function deleteRegion(businessId, id) {
  await prisma.cmsAiSettings.delete({ where: { id } });
  return { deleted: true };
}

module.exports = { getRegions, getRegionHealth, createRegion, updateRegion, deleteRegion };

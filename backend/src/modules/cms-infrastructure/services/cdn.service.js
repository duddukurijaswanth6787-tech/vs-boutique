const prisma = require('../../../utils/prisma');

async function getCDNConfig(businessId) {
  const settings = await prisma.cmsAiSettings.findMany({
    where: { category: 'cdn' },
    select: { id: true, key: true, value: true, description: true }
  });

  return settings.map(s => {
    try { return { id: s.id, key: s.key, ...JSON.parse(s.value) }; }
    catch { return { id: s.id, key: s.key, provider: s.description || 'unknown' }; }
  });
}

async function getCDNHealth(businessId) {
  const configs = await getCDNConfig(businessId);
  const assetsWithCDN = await prisma.assetLibrary.count({
    where: { businessId, meta: { path: ['cdnUrl'], not: null } }
  });
  const totalAssets = await prisma.assetLibrary.count({ where: { businessId } });

  const activeProviders = configs.filter(c => c.enabled !== false).length;
  const cdnEnabled = configs.length > 0 && activeProviders > 0;
  const assetCoverage = totalAssets > 0 ? Math.round((assetsWithCDN / totalAssets) * 100) : 0;
  const score = cdnEnabled ? Math.min(assetCoverage + 50, 100) : assetCoverage;

  return {
    cdnEnabled, activeProviders, totalConfigs: configs.length,
    assetsWithCDN, totalAssets, assetCoveragePercent: assetCoverage,
    score, configs
  };
}

async function createCDNConfig(businessId, data) {
  const key = data.name.toLowerCase().replace(/\s+/g, '-');
  const existing = await prisma.cmsAiSettings.findFirst({ where: { key, category: 'cdn' } });
  if (existing) throw new Error(`CDN config "${key}" already exists`);

  const setting = await prisma.cmsAiSettings.create({
    data: {
      key,
      value: JSON.stringify({ name: data.name, provider: data.provider, enabled: data.enabled !== false, endpoint: data.endpoint || '', regions: data.regions || [] }),
      category: 'cdn',
      description: `CDN: ${data.provider} - ${data.name}`
    }
  });

  return { id: setting.id, key: setting.key, name: data.name, provider: data.provider };
}

module.exports = { getCDNConfig, getCDNHealth, createCDNConfig };

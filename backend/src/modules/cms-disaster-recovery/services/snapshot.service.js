const prisma = require('../../../utils/prisma');

async function discoverSnapshots(businessId) {
  const snapshots = [];

  const deployments = await prisma.deployment.findMany({
    where: { businessId, status: { in: ['DEPLOYED', 'ROLLED_BACK'] } },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      environment: { select: { name: true, type: true } },
      artifacts: { select: { name: true, type: true, url: true, size: true, checksum: true } },
      rollbackTarget: { select: { id: true, version: true } }
    }
  });

  for (const d of deployments) {
    snapshots.push({
      id: `deploy-${d.id}`,
      type: 'deployment',
      source: 'Deployment',
      version: d.version,
      environment: d.environment?.name || 'unknown',
      environmentType: d.environment?.type || 'unknown',
      status: d.status,
      artifacts: d.artifacts.length,
      totalSize: d.artifacts.reduce((s, a) => s + (a.size || 0), 0),
      createdAt: d.createdAt,
      hasRollbackTarget: !!d.rollbackTarget
    });
  }

  const assets = await prisma.assetLibrary.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: { id: true, name: true, type: true, url: true, version: true, meta: true, createdAt: true }
  });

  for (const a of assets) {
    const fileSize = a.meta?.sizeBytes || 0;
    snapshots.push({
      id: `asset-${a.id}`,
      type: 'asset',
      source: 'AssetLibrary',
      name: a.name,
      assetType: a.type,
      version: a.version,
      url: a.url,
      fileSize,
      createdAt: a.createdAt
    });
  }

  const uploads = await prisma.cmsUpload.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: { id: true, filename: true, status: true, sizeBytes: true, createdAt: true }
  });

  for (const u of uploads) {
    snapshots.push({
      id: `upload-${u.id}`,
      type: 'upload',
      source: 'CmsUpload',
      name: u.filename,
      status: u.status,
      fileSize: u.sizeBytes,
      createdAt: u.createdAt
    });
  }

  return snapshots.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function getRecoverableItems(businessId) {
  const [environments, deployments, domains] = await Promise.all([
    prisma.deploymentEnvironment.findMany({ where: { businessId, isActive: true }, select: { id: true, name: true, type: true } }),
    prisma.deployment.count({ where: { businessId, status: 'DEPLOYED' } }),
    prisma.deploymentDomain.findMany({ where: { businessId }, select: { domain: true, status: true, sslStatus: true } })
  ]);

  return {
    environments: environments.map(e => ({ ...e, recoverable: true })),
    totalDeployableVersions: deployments,
    domains: domains.map(d => ({ ...d, recoverable: d.status === 'ACTIVE' }))
  };
}

module.exports = { discoverSnapshots, getRecoverableItems };

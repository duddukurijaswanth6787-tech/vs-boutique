const prisma = require('../../../utils/prisma');

async function getEnvironments(businessId) {
  const envs = await prisma.deploymentEnvironment.findMany({
    where: { businessId },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true, name: true, type: true, isActive: true, createdAt: true, updatedAt: true,
      _count: { select: { deployments: true, domains: true, variables: true } }
    }
  });

  const enriched = await Promise.all(envs.map(async (e) => {
    const latestDeployment = await prisma.deployment.findFirst({
      where: { environmentId: e.id, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      select: { id: true, status: true, version: true, createdAt: true }
    });

    const recentFailures = await prisma.deployment.count({
      where: { environmentId: e.id, status: { in: ['BUILD_FAILED', 'FAILED'] }, createdAt: { gte: new Date(Date.now() - 86400000) } }
    });

    return {
      id: e.id, name: e.name, type: e.type, isActive: e.isActive,
      deploymentCount: e._count.deployments,
      domainCount: e._count.domains,
      variableCount: e._count.variables,
      latestDeployment,
      recentFailures,
      health: recentFailures > 3 ? 'degraded' : e.isActive ? 'healthy' : 'inactive',
      createdAt: e.createdAt,
      updatedAt: e.updatedAt
    };
  }));

  return enriched;
}

async function getEnvironmentHealth(businessId) {
  const envs = await getEnvironments(businessId);
  const healthy = envs.filter(e => e.health === 'healthy').length;
  const degraded = envs.filter(e => e.health === 'degraded').length;
  const inactive = envs.filter(e => e.health === 'inactive').length;
  const score = envs.length > 0 ? Math.round((healthy / envs.length) * 100) : 0;
  return { total: envs.length, healthy, degraded, inactive, score, environments: envs };
}

async function getEnvironmentStats(businessId) {
  const envs = await getEnvironments(businessId);
  const totalDeployments = envs.reduce((s, e) => s + e.deploymentCount, 0);
  const totalDomains = envs.reduce((s, e) => s + e.domainCount, 0);
  const totalVariables = envs.reduce((s, e) => s + e.variableCount, 0);
  return { totalEnvironments: envs.length, totalDeployments, totalDomains, totalVariables, environments: envs };
}

module.exports = { getEnvironments, getEnvironmentHealth, getEnvironmentStats };

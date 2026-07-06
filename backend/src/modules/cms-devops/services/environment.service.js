const deploymentService = require('../../cms-deployment/services/deployment.service');
const envVarService = require('../../cms-deployment/services/env-variable.service');
const cache = require('../middleware/devops-cache');

async function getEnvironments(businessId) {
  const cacheKey = `environments:${businessId}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const environments = await deploymentService.listEnvironments(businessId);
  await cache.set(cacheKey, environments, 120);
  return environments;
}

async function getEnvironmentDetail(envId) {
  const cacheKey = `env-detail:${envId}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const [environment, variables, deployments] = await Promise.all([
    deploymentService.listEnvironments(null).then(envs => envs.find(e => e.id === envId)).catch(() => null),
    envVarService.listVariables(envId).catch(() => []),
    deploymentService.listDeployments(null, { environmentId: envId, limit: 20 }).catch(() => [])
  ]);

  const result = { environment, variables, deployments };
  await cache.set(cacheKey, result, 120);
  return result;
}

async function getEnvironmentVariables(envId) {
  return envVarService.listVariables(envId).catch(() => []);
}

module.exports = { getEnvironments, getEnvironmentDetail, getEnvironmentVariables };

const prisma = require('../../../utils/prisma');
const rollbackService = require('../../cms-deployment/services/rollback.service');
const domainService = require('../../cms-deployment/services/domain.service');
const envVariableService = require('../../cms-deployment/services/env-variable.service');
const deploymentQueue = require('../../cms-deployment/services/deployment.queue');
const { eventBus, Events } = require('../../../services/eventBus');

async function restoreDeployment(deploymentId, userId) {
  eventBus.emit(Events.DISASTER_RESTORE_STARTED, { deploymentId, userId });
  return rollbackService.rollback(deploymentId, userId);
}

async function restoreEnvironment(environmentId, userId) {
  const deployments = await prisma.deployment.findMany({
    where: { environmentId, status: 'DEPLOYED' },
    orderBy: { createdAt: 'desc' },
    take: 1,
    select: { id: true }
  });
  if (!deployments.length) throw new Error('No deployable deployment found for this environment');
  return restoreDeployment(deployments[0].id, userId);
}

async function restoreDomain(domainId) {
  return domainService.activateDomain(domainId);
}

async function restoreVariables(environmentId) {
  const variables = await envVariableService.listVariables(environmentId);
  return { restored: variables.length, environmentId };
}

async function getRestoreHistory(businessId, limit = 50, offset = 0) {
  const [logs, total] = await Promise.all([
    prisma.deployment.findMany({
      where: { businessId, status: 'ROLLED_BACK' },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: { rollbackTarget: { select: { version: true, createdAt: true } } }
    }),
    prisma.deployment.count({ where: { businessId, status: 'ROLLED_BACK' } })
  ]);
  return { logs, total, limit, offset };
}

module.exports = { restoreDeployment, restoreEnvironment, restoreDomain, restoreVariables, getRestoreHistory };

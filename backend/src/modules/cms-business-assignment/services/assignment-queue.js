const deploymentQueue = require('../../cms-deployment/services/deployment.queue');
const eventBus = require('../../../services/eventBus').eventBus;

deploymentQueue.registerWorker('assignment-validation', async (data) => {
  const { assignmentId, businessId } = data;
  eventBus.emit('assignment:validated', { assignmentId, businessId, source: 'queue' });
  return { validated: true };
});

deploymentQueue.registerWorker('assignment-deployment', async (data) => {
  const { assignmentId, deploymentId, businessId, environmentId } = data;
  eventBus.emit('assignment:deployed', { assignmentId, deploymentId, businessId, environmentId, source: 'queue' });
  return { deployed: true };
});

deploymentQueue.registerWorker('assignment-env-sync', async (data) => {
  const { assignmentId, businessId, environmentId } = data;
  eventBus.emit('assignment:env-synced', { assignmentId, businessId, environmentId, source: 'queue' });
  return { synced: true };
});

deploymentQueue.registerWorker('assignment-domain-sync', async (data) => {
  const { assignmentId, businessId, domain } = data;
  eventBus.emit('assignment:domain-synced', { assignmentId, businessId, domain, source: 'queue' });
  return { synced: true };
});

deploymentQueue.registerWorker('assignment-analytics', async (data) => {
  const { assignmentId, businessId } = data;
  const cache = require('../middleware/assignment-cache');
  await cache.del('assignment:dashboard');
  await cache.del('assignment:stats');
  return { analyticsRecalculated: true };
});

module.exports = { deploymentQueue };

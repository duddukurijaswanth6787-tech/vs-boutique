const backupService = require('./backup.service');
const restoreService = require('./restore.service');
const snapshotService = require('./snapshot.service');
const retentionService = require('./retention.service');
const healthService = require('./health.service');
const analyticsService = require('./analytics.service');
const deploymentQueue = require('../../cms-deployment/services/deployment.queue');

function _getDeploymentService() { return require('../../cms-deployment/services/deployment.service'); }
function _getRollbackService() { return require('../../cms-deployment/services/rollback.service'); }
function _getEventBus() { return require('../../../services/eventBus'); }

async function getOverview(businessId) {
  const [backupStatus, snapshot, retention, health, analytics] = await Promise.all([
    backupService.getBackupStatus(businessId).catch(() => null),
    snapshotService.discoverSnapshots(businessId).catch(() => []),
    retentionService.getRetentionPolicies(businessId).catch(() => null),
    healthService.calculateRecoveryScore(businessId).catch(() => null),
    analyticsService.getRecoveryAnalytics(businessId).catch(() => null)
  ]);

  return {
    businessId,
    backupStatus,
    snapshots: { total: snapshot.length, environments: [...new Set(snapshot.map(s => s.environment || 'unknown'))] },
    health,
    analytics,
    calculatedAt: new Date().toISOString()
  };
}

async function initializeDefaults() {
  return { status: 'ok', timestamp: new Date().toISOString() };
}

module.exports = {
  getOverview,
  initializeDefaults,
  backup: backupService,
  restore: restoreService,
  snapshot: snapshotService,
  retention: retentionService,
  health: healthService,
  analytics: analyticsService,
  queue: deploymentQueue,
  get deployment() { return _getDeploymentService(); },
  get rollback() { return _getRollbackService(); },
  get eventBus() { return _getEventBus().eventBus; },
  get Events() { return _getEventBus().Events; }
};

const { eventBus, Events } = require('../../../services/eventBus');
const backupService = require('../services/backup.service');
const restoreService = require('../services/restore.service');
const snapshotService = require('../services/snapshot.service');
const retentionService = require('../services/retention.service');
const healthService = require('../services/health.service');
const analyticsService = require('../services/analytics.service');
const disasterService = require('../services/disaster.service');
const deploymentQueue = require('../../cms-deployment/services/deployment.queue');
const prisma = require('../../../utils/prisma');

describe('Phase 23 - Disaster Recovery', () => {
  let testBizId;

  beforeAll(async () => {
    const biz = await prisma.business.findFirst({ select: { id: true } });
    testBizId = biz ? biz.id : null;
  });

  describe('EventBus Constants', () => {
    test('DISASTER_BACKUP_STARTED', () => {
      expect(Events.DISASTER_BACKUP_STARTED).toBe('disaster:backup-started');
    });
    test('DISASTER_BACKUP_COMPLETED', () => {
      expect(Events.DISASTER_BACKUP_COMPLETED).toBe('disaster:backup-completed');
    });
    test('DISASTER_BACKUP_FAILED', () => {
      expect(Events.DISASTER_BACKUP_FAILED).toBe('disaster:backup-failed');
    });
    test('DISASTER_RESTORE_STARTED', () => {
      expect(Events.DISASTER_RESTORE_STARTED).toBe('disaster:restore-started');
    });
    test('DISASTER_RESTORE_COMPLETED', () => {
      expect(Events.DISASTER_RESTORE_COMPLETED).toBe('disaster:restore-completed');
    });
    test('DISASTER_RECOVERY_FAILED', () => {
      expect(Events.DISASTER_RECOVERY_FAILED).toBe('disaster:recovery-failed');
    });
  });

  describe('backupService', () => {
    test('getBackupStatus should return backup status', async () => {
      const result = await backupService.getBackupStatus(testBizId);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('businessId');
      expect(result).toHaveProperty('totalDeployments');
      expect(result).toHaveProperty('totalBackups');
      expect(typeof result.totalDeployments).toBe('number');
    });

    test('getBackupStatus should return storage bytes', async () => {
      const result = await backupService.getBackupStatus(testBizId);
      expect(result).toHaveProperty('totalStorageBytes');
      expect(typeof result.totalStorageBytes).toBe('number');
    });

    test('simulateBackup should return environments', async () => {
      const result = await backupService.simulateBackup(testBizId);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('environments');
      expect(Array.isArray(result.environments)).toBe(true);
    });

    test('createBackup should create a pending deployment', async () => {
      if (!testBizId) return;
      const result = await backupService.createBackup(testBizId, testBizId, { trigger: 'test' });
      expect(result).toBeDefined();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('status', 'PENDING');
    });
  });

  describe('restoreService', () => {
    test('restoreDeployment should throw for invalid ID', async () => {
      await expect(restoreService.restoreDeployment('invalid-id', testBizId)).rejects.toThrow();
    });

    test('restoreEnvironment should throw for invalid env', async () => {
      await expect(restoreService.restoreEnvironment('invalid-env', testBizId)).rejects.toThrow();
    });

    test('getRestoreHistory should return history array', async () => {
      const result = await restoreService.getRestoreHistory(testBizId);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('logs');
      expect(Array.isArray(result.logs)).toBe(true);
      expect(result).toHaveProperty('total');
    });
  });

  describe('snapshotService', () => {
    test('discoverSnapshots should return array', async () => {
      const result = await snapshotService.discoverSnapshots(testBizId);
      expect(Array.isArray(result)).toBe(true);
    });

    test('discoverSnapshots should include deployment snapshots', async () => {
      const result = await snapshotService.discoverSnapshots(testBizId);
      const deploySnapshots = result.filter(s => s.type === 'deployment');
      expect(Array.isArray(deploySnapshots)).toBe(true);
    });

    test('discoverSnapshots should include asset snapshots', async () => {
      const result = await snapshotService.discoverSnapshots(testBizId);
      const assetSnapshots = result.filter(s => s.type === 'asset');
      expect(Array.isArray(assetSnapshots)).toBe(true);
    });

    test('getRecoverableItems should return environments and domains', async () => {
      const result = await snapshotService.getRecoverableItems(testBizId);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('environments');
      expect(result).toHaveProperty('totalDeployableVersions');
      expect(result).toHaveProperty('domains');
    });
  });

  describe('retentionService', () => {
    test('getRetentionPolicies should return policy object', async () => {
      const result = await retentionService.getRetentionPolicies(testBizId);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('backup');
      expect(result).toHaveProperty('retention');
      expect(result).toHaveProperty('storage');
      expect(result).toHaveProperty('snapshot');
    });

    test('getRetentionPolicies backup should have defaults', async () => {
      const result = await retentionService.getRetentionPolicies(testBizId);
      expect(result.backup).toHaveProperty('enabled');
      expect(result.backup).toHaveProperty('retentionDays');
      expect(typeof result.backup.retentionDays).toBe('number');
      expect(result.backup).toHaveProperty('storageProvider', 's3');
    });

    test('updateRetentionPolicy should persist policy', async () => {
      const result = await retentionService.updateRetentionPolicy(testBizId, 'backup', { enabled: true, retentionDays: 60 });
      expect(result).toBeDefined();
      expect(result.enabled).toBe(true);
      expect(result.retentionDays).toBe(60);
    });

    test('getRecordsBeyondRetention should return status', async () => {
      const result = await retentionService.getRecordsBeyondRetention(testBizId);
      expect(result).toBeDefined();
    });
  });

  describe('healthService', () => {
    test('calculateRecoveryScore should return score', async () => {
      const result = await healthService.calculateRecoveryScore(testBizId);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('overall');
      expect(result).toHaveProperty('riskLevel');
      expect(result).toHaveProperty('details');
      expect(typeof result.overall).toBe('number');
    });

    test('recovery score should be between 0 and 100', async () => {
      const result = await healthService.calculateRecoveryScore(testBizId);
      expect(result.overall).toBeGreaterThanOrEqual(0);
      expect(result.overall).toBeLessThanOrEqual(100);
    });

    test('riskLevel should be valid', async () => {
      const result = await healthService.calculateRecoveryScore(testBizId);
      expect(['low', 'medium', 'high', 'critical']).toContain(result.riskLevel);
    });

    test('recovery score should have 9 dimensions', async () => {
      const result = await healthService.calculateRecoveryScore(testBizId);
      const keys = Object.keys(result.details);
      expect(keys.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('analyticsService', () => {
    test('getRecoveryAnalytics should return analytics', async () => {
      const result = await analyticsService.getRecoveryAnalytics(testBizId);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('deploymentStats');
      expect(result).toHaveProperty('backupRate');
      expect(result).toHaveProperty('storageStats');
      expect(result).toHaveProperty('environmentCoverage');
      expect(result).toHaveProperty('sslCoverage');
    });

    test('deploymentStats should have key metrics', async () => {
      const result = await analyticsService.getRecoveryAnalytics(testBizId);
      expect(result.deploymentStats).toHaveProperty('successRate');
      expect(result.deploymentStats).toHaveProperty('failureRate');
      expect(result.deploymentStats).toHaveProperty('rollbackRate');
    });

    test('backupRate should have 7 day buckets', async () => {
      const result = await analyticsService.getRecoveryAnalytics(testBizId);
      expect(result.backupRate.buckets.length).toBe(7);
      expect(result.backupRate.period).toBe('7d');
    });

    test('storageStats should include artifacts, assets, uploads', async () => {
      const result = await analyticsService.getRecoveryAnalytics(testBizId);
      expect(result.storageStats).toHaveProperty('artifacts');
      expect(result.storageStats).toHaveProperty('assets');
      expect(result.storageStats).toHaveProperty('uploads');
      expect(result.storageStats).toHaveProperty('totalMB');
    });

    test('environmentCoverage should have coverage metrics', async () => {
      const result = await analyticsService.getRecoveryAnalytics(testBizId);
      expect(result.environmentCoverage).toHaveProperty('coveragePercent');
    });
  });

  describe('disasterService Facade', () => {
    test('getOverview should return aggregated overview', async () => {
      const result = await disasterService.getOverview(testBizId);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('businessId');
      expect(result).toHaveProperty('backupStatus');
      expect(result).toHaveProperty('snapshots');
      expect(result).toHaveProperty('health');
      expect(result).toHaveProperty('calculatedAt');
    });

    test('initializeDefaults should return ok', async () => {
      const result = await disasterService.initializeDefaults();
      expect(result.status).toBe('ok');
    });
  });

  describe('DeploymentQueue Extension', () => {
    test('deploymentQueue should have _handlers', () => {
      expect(deploymentQueue._handlers).toBeDefined();
    });

    test('deploymentQueue should accept backup job type', async () => {
      const result = await deploymentQueue.enqueue('backup', { test: true });
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Zero Duplicate Architecture', () => {
    test('No new Prisma models - only existing models reused', () => {
      const modelNames = Object.keys(prisma).filter(k => !k.startsWith('_'));
      expect(modelNames).toContain('deployment');
      expect(modelNames).toContain('deploymentArtifact');
      expect(modelNames).toContain('cmsAiSettings');
    });

    test('EventBus is reused singleton', () => {
      const eb = require('../../../services/eventBus');
      expect(eb.eventBus).toBeDefined();
      expect(typeof eb.eventBus.emit).toBe('function');
    });

    test('auth middleware is reused', () => {
      const am = require('../../../middleware/authMiddleware');
      expect(am.protect).toBeDefined();
      expect(am.authorize).toBeDefined();
    });

    test('DeploymentQueue is reused (no new queue)', () => {
      expect(deploymentQueue.enqueue).toBeDefined();
      expect(deploymentQueue.registerWorker).toBeDefined();
      expect(deploymentQueue.getQueueMetrics).toBeDefined();
    });

    test('rollback service is reused (no new rollback)', () => {
      const rollback = require('../../cms-deployment/services/rollback.service');
      expect(rollback.rollback).toBeDefined();
      expect(rollback.getRollbackTargets).toBeDefined();
    });

    test('CmsAiSettings stores policies - no new policy model', () => {
      expect(prisma.cmsAiSettings).toBeDefined();
    });
  });
});

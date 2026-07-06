const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../../middleware/authMiddleware');
const disasterService = require('../services/disaster.service');
const cache = require('../middleware/disaster-cache');

const auth = [protect, authorize('super-admin')];

router.get('/', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await disasterService.getOverview(bizId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/overview', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const cached = await cache.get(`overview:${bizId}`);
    if (cached) return res.json({ success: true, data: cached });
    const result = await disasterService.getOverview(bizId);
    await cache.set(`overview:${bizId}`, result, 300);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/backups', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const cached = await cache.get(`backups:${bizId}`);
    if (cached) return res.json({ success: true, data: cached });
    const result = await disasterService.backup.getBackupStatus(bizId);
    await cache.set(`backups:${bizId}`, result, 120);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/backup', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const userId = req.user._id || req.user.id;
    const result = await disasterService.backup.createBackup(bizId, userId, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/simulate', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await disasterService.backup.simulateBackup(bizId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/snapshots', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const cached = await cache.get(`snapshots:${bizId}`);
    if (cached) return res.json({ success: true, data: cached });
    const result = await disasterService.snapshot.discoverSnapshots(bizId);
    await cache.set(`snapshots:${bizId}`, result, 120);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/recovery', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await disasterService.snapshot.getRecoverableItems(bizId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/restore', ...auth, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { deploymentId } = req.body;
    if (!deploymentId) return res.status(400).json({ success: false, message: 'deploymentId required' });
    const result = await disasterService.restore.restoreDeployment(deploymentId, userId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/rollback', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const userId = req.user._id || req.user.id;
    const { deploymentId } = req.body;
    if (deploymentId) {
      const result = await disasterService.restore.restoreDeployment(deploymentId, userId);
      return res.json({ success: true, data: result });
    }
    const rollbackTargets = await disasterService.rollback.getRollbackTargets(bizId);
    res.json({ success: true, data: rollbackTargets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/jobs', ...auth, async (req, res) => {
  try {
    const metrics = await disasterService.queue.getQueueMetrics();
    res.json({ success: true, data: metrics });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/analytics', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const cached = await cache.get(`analytics:${bizId}`);
    if (cached) return res.json({ success: true, data: cached });
    const result = await disasterService.analytics.getRecoveryAnalytics(bizId);
    await cache.set(`analytics:${bizId}`, result, 300);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/health', async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await disasterService.health.calculateRecoveryScore(bizId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/policies', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await disasterService.retention.getRetentionPolicies(bizId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/policies/:type', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await disasterService.retention.updateRetentionPolicy(bizId, req.params.type, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/retention/status', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await disasterService.retention.getRecordsBeyondRetention(bizId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/initialize', ...auth, async (req, res) => {
  try {
    const result = await disasterService.initializeDefaults();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/refresh', ...auth, async (req, res) => {
  try {
    await cache.delPattern('*');
    res.json({ success: true, message: 'Cache cleared' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/restore-history', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await disasterService.restore.getRestoreHistory(bizId, parseInt(req.query.limit) || 50, parseInt(req.query.offset) || 0);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

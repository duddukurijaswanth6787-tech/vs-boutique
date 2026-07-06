const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../../middleware/authMiddleware');
const complianceService = require('../services/compliance.service');
const cache = require('../middleware/compliance-cache');

const auth = [protect, authorize('super-admin')];

router.get('/', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await complianceService.getOverview(bizId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/audit-logs', ...auth, async (req, res) => {
  try {
    const cached = await cache.get('audit-logs');
    if (cached) return res.json({ success: true, data: cached });
    const filters = {
      entityType: req.query.entityType,
      entityId: req.query.entityId,
      actionType: req.query.actionType,
      performedBy: req.query.performedBy,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };
    const result = await complianceService.audit.getAuditLogs(filters);
    await cache.set('audit-logs', result);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/audit-summary', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const cached = await cache.get(`audit-summary:${bizId}`);
    if (cached) return res.json({ success: true, data: cached });
    const result = await complianceService.audit.getAuditSummary(bizId);
    await cache.set(`audit-summary:${bizId}`, result, 300);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/cross-module', ...auth, async (req, res) => {
  try {
    const cached = await cache.get('cross-module');
    if (cached) return res.json({ success: true, data: cached });
    const result = await complianceService.audit.getCrossModuleActivity();
    await cache.set('cross-module', result, 300);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/security', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const cached = await cache.get(`security:${bizId}`);
    if (cached) return res.json({ success: true, data: cached });
    const result = await complianceService.security.getSecurityPosture(bizId);
    await cache.set(`security:${bizId}`, result, 300);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/risk', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const cached = await cache.get(`risk:${bizId}`);
    if (cached) return res.json({ success: true, data: cached });
    const result = await complianceService.risk.calculateRiskScore(bizId);
    await cache.set(`risk:${bizId}`, result, 300);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/policies', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await complianceService.policy.getPolicies(bizId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/policies/:framework', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await complianceService.policy.updatePolicy(bizId, req.params.framework, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/frameworks', ...auth, async (req, res) => {
  try {
    const result = await complianceService.policy.getFrameworkMapping();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/retention', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await complianceService.retention.getRetentionConfig(bizId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/retention', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await complianceService.retention.updateRetentionConfig(bizId, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/retention/status', ...auth, async (req, res) => {
  try {
    const cached = await cache.get('retention-status');
    if (cached) return res.json({ success: true, data: cached });
    const result = await complianceService.retention.getRetentionStatus();
    await cache.set('retention-status', result, 300);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/analytics', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const cached = await cache.get(`analytics:${bizId}`);
    if (cached) return res.json({ success: true, data: cached });
    const result = await complianceService.analytics.getComplianceAnalytics(bizId);
    await cache.set(`analytics:${bizId}`, result, 300);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/summary', ...auth, async (req, res) => {
  try {
    const cached = await cache.get('summary');
    if (cached) return res.json({ success: true, data: cached });
    const result = await complianceService.analytics.getComplianceSummary();
    await cache.set('summary', result, 300);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/health', async (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      version: '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }
  });
});

router.post('/refresh', ...auth, async (req, res) => {
  try {
    await cache.delPattern('*');
    res.json({ success: true, message: 'Cache cleared' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

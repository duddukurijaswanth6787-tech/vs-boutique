const express = require('express');
const router = express.Router();
const standardsService = require('../services/standards.service');
const { protect, authorize } = require('../../../middleware/authMiddleware');

// Helper to assert super-admin check safely
const superAdminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'super-admin') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Forbidden. Super Admin access required.' });
};

// ==========================================
// 1. RULE STANDARDS ENDPOINTS
// ==========================================

router.get('/', protect, async (req, res) => {
  try {
    const { category, q } = req.query;
    const standards = await standardsService.listStandards(category, q);
    res.json({ success: true, standards });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/audit-logs', protect, superAdminOnly, async (req, res) => {
  try {
    const logs = await standardsService.listAuditLogs();
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/blueprints', protect, async (req, res) => {
  try {
    const blueprints = await standardsService.listBlueprints(req.query.q);
    res.json({ success: true, blueprints });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/builders', protect, async (req, res) => {
  try {
    const builders = await standardsService.listBuilderProfiles(req.query.q);
    res.json({ success: true, builders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/blueprints/:id', protect, async (req, res) => {
  try {
    const blueprint = await standardsService.getBlueprint(req.params.id);
    if (!blueprint) return res.status(404).json({ success: false, message: 'Blueprint not found' });
    res.json({ success: true, blueprint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/builders/:id', protect, async (req, res) => {
  try {
    const builder = await standardsService.getBuilderProfile(req.params.id);
    if (!builder) return res.status(404).json({ success: false, message: 'Builder profile not found' });
    res.json({ success: true, builder });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const standard = await standardsService.getStandard(req.params.id);
    if (!standard) return res.status(404).json({ success: false, message: 'Standard not found' });
    res.json({ success: true, standard });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id/resolved', protect, async (req, res) => {
  try {
    const resolved = await standardsService.resolveInheritedConfig(req.params.id);
    res.json({ success: true, resolved });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', protect, superAdminOnly, async (req, res) => {
  try {
    const standard = await standardsService.createStandard(req.body, req.user.id);
    res.status(201).json({ success: true, standard });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', protect, superAdminOnly, async (req, res) => {
  try {
    const { data, description } = req.body;
    const standard = await standardsService.updateStandard(req.params.id, data, description, req.user.id);
    res.json({ success: true, standard });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/rollback', protect, superAdminOnly, async (req, res) => {
  try {
    const { version } = req.body;
    if (!version) return res.status(400).json({ success: false, message: 'version is required' });
    const standard = await standardsService.rollbackStandard(req.params.id, parseInt(version), req.user.id);
    res.json({ success: true, standard });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 2. BLUEPRINT TEMPLATES ENDPOINTS
// ==========================================

router.post('/blueprints', protect, superAdminOnly, async (req, res) => {
  try {
    const blueprint = await standardsService.createBlueprint(req.body, req.user.id);
    res.status(201).json({ success: true, blueprint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/blueprints/:id', protect, superAdminOnly, async (req, res) => {
  try {
    const { data, description } = req.body;
    const blueprint = await standardsService.updateBlueprint(req.params.id, data, description, req.user.id);
    res.json({ success: true, blueprint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 3. BUILDER PROFILES ENDPOINTS
// ==========================================

router.post('/builders', protect, superAdminOnly, async (req, res) => {
  try {
    const builder = await standardsService.createBuilderProfile(req.body, req.user.id);
    res.status(201).json({ success: true, builder });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/builders/:id', protect, superAdminOnly, async (req, res) => {
  try {
    const { data, description } = req.body;
    const builder = await standardsService.updateBuilderProfile(req.params.id, data, description, req.user.id);
    res.json({ success: true, builder });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../../middleware/authMiddleware');
const infrastructureService = require('../services/infrastructure.service');
const cache = require('../middleware/infrastructure-cache');
const prisma = require('../../../utils/prisma');

const auth = [protect, authorize('super-admin')];

router.get('/', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await infrastructureService.getOverview(bizId);
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
    const result = await infrastructureService.getOverview(bizId);
    await cache.set(`overview:${bizId}`, result, 300);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/regions', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await infrastructureService.getRegions(bizId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/regions', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await infrastructureService.region.createRegion(bizId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/regions/:id', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await infrastructureService.region.updateRegion(bizId, req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/regions/:id', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await infrastructureService.region.deleteRegion(bizId, req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/environments', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await infrastructureService.getEnvironments(bizId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/servers', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await infrastructureService.getServers(bizId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/storage', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await infrastructureService.getStorage(bizId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/dns', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await infrastructureService.getDNS(bizId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/ssl', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await infrastructureService.getSSL(bizId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/capacity', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await infrastructureService.getCapacity(bizId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/analytics', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await infrastructureService.getAnalytics(bizId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/health', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await infrastructureService.getHealth(bizId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/refresh', ...auth, async (req, res) => {
  try {
    const result = await infrastructureService.refreshCache();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/initialize', ...auth, async (req, res) => {
  try {
    const result = await infrastructureService.initializeDefaults();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/policies/:type', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const { type } = req.params;
    const existing = await prisma.cmsAiSettings.findFirst({ where: { key: type, category: 'infrastructure' } });
    if (existing) {
      const updated = await prisma.cmsAiSettings.update({ where: { id: existing.id }, data: { value: JSON.stringify(req.body) } });
      return res.json({ success: true, data: { id: updated.id, key: updated.key, ...JSON.parse(updated.value) } });
    }
    const created = await prisma.cmsAiSettings.create({ data: { key: type, value: JSON.stringify(req.body), category: 'infrastructure', description: `Infrastructure policy: ${type}` } });
    res.json({ success: true, data: { id: created.id, key: created.key, ...JSON.parse(created.value) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const service = require('../services/marketplace.service');
const { protect, authorize } = require('../../../middleware/authMiddleware');

router.use(protect);
router.use(authorize('super-admin'));

router.get('/', async (req, res) => {
  try {
    const result = await service.getAll();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:category', async (req, res) => {
  try {
    const result = await service.getCategory(req.params.category);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:category', async (req, res) => {
  try {
    const result = await service.updateCategory(req.params.category, req.body, req.user?.id || 'SYSTEM', req.ip);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/initialize', async (req, res) => {
  try {
    const result = await service.initializeDefaults();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/packages/search', async (req, res) => {
  try {
    const filters = {
      q: req.query.q,
      capability: req.query.capability,
      publisherId: req.query.publisherId,
      installedInBusinessId: req.query.installedInBusinessId,
      page: req.query.page,
      limit: req.query.limit
    };
    const result = await service.searchPackages(filters);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/packages/:slug', async (req, res) => {
  try {
    const result = await service.getPackage(req.params.slug);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
});

router.post('/packages/publish', async (req, res) => {
  try {
    const result = await service.publishPackage(req.body, req.user?.id || 'SYSTEM', req.ip);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/packages/:slug/approve', async (req, res) => {
  try {
    const result = await service.approvePackage(req.params.slug, req.user?.id || 'SYSTEM', req.ip);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/install', async (req, res) => {
  try {
    const { businessId, packageSlug, version } = req.body;
    if (!businessId || !packageSlug) return res.status(400).json({ success: false, message: 'businessId and packageSlug are required' });
    const result = await service.installPackage(businessId, packageSlug, version, req.user?.id || 'SYSTEM', req.ip);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/uninstall', async (req, res) => {
  try {
    const { businessId, packageId } = req.body;
    if (!businessId || !packageId) return res.status(400).json({ success: false, message: 'businessId and packageId are required' });
    const result = await service.uninstallPackage(businessId, packageId, req.user?.id || 'SYSTEM', req.ip);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/toggle', async (req, res) => {
  try {
    const { businessId, packageId, isEnabled } = req.body;
    if (!businessId || !packageId || isEnabled === undefined) return res.status(400).json({ success: false, message: 'businessId, packageId, and isEnabled are required' });
    const result = await service.togglePackage(businessId, packageId, isEnabled, req.user?.id || 'SYSTEM');
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.get('/installed/:businessId', async (req, res) => {
  try {
    const result = await service.getInstalled(req.params.businessId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/developer/:publisherId', async (req, res) => {
  try {
    const result = await service.getDeveloperPackages(req.params.publisherId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

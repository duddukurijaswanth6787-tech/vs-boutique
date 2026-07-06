const express = require('express');
const router = express.Router();
const settingsService = require('../services/settings.service');
const { protect, authorize } = require('../../../middleware/authMiddleware');

router.use(protect);
router.use(authorize('super-admin'));

router.get('/', async (req, res) => {
  try {
    const result = await settingsService.getAll();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:category', async (req, res) => {
  try {
    const result = await settingsService.getCategory(req.params.category);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:category', async (req, res) => {
  try {
    const result = await settingsService.updateCategory(
      req.params.category,
      req.body,
      req.user?.id || 'SYSTEM',
      req.ip
    );
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/initialize', async (req, res) => {
  try {
    const result = await settingsService.initializeDefaults();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

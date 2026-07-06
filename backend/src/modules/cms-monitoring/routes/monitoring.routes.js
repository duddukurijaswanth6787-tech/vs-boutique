const express = require('express');
const router = express.Router();
const service = require('../services/monitoring.service');
const healthService = require('../services/health.service');
const dashboardService = require('../services/dashboard.service');
const { protect, authorize } = require('../../../middleware/authMiddleware');

router.use(protect);
router.use(authorize('super-admin'));

router.get('/overview', async (req, res) => {
  try {
    const result = await service.getOverview();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/health', async (req, res) => {
  try {
    const result = await healthService.getAggregateHealth();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/performance', async (req, res) => {
  try {
    const result = await dashboardService.getPerformance();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/queues', async (req, res) => {
  try {
    const result = await dashboardService.getKPIs();
    const queues = result.queue || {};
    res.json({ success: true, data: queues });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/security', async (req, res) => {
  try {
    const result = await dashboardService.getSecurity();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/config', async (req, res) => {
  try {
    const result = await service.getConfig();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/config', async (req, res) => {
  try {
    const result = await service.updateConfig(req.body, req.user?.id || 'SYSTEM', req.ip);
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

router.post('/alert', async (req, res) => {
  try {
    const { type, message, data } = req.body;
    const result = await service.emitAlert(type || 'custom', message || 'Manual alert', data);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await service.getOverview();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

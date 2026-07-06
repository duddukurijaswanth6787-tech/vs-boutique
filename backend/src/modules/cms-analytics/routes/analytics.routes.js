const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../../middleware/authMiddleware');
const analyticsService = require('../services/analytics.service');
const cache = require('../middleware/analytics-cache');

const auth = [protect, authorize('super-admin')];

router.get('/', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await analyticsService.getOverview(bizId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/executive', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const cached = await cache.get(`executive:${bizId}`);
    if (cached) return res.json({ success: true, data: cached });
    const result = await analyticsService.getExecutive(bizId);
    await cache.set(`executive:${bizId}`, result, 300);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/financial', ...auth, async (req, res) => {
  try {
    const result = await analyticsService.getFinancial();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/operations', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await analyticsService.getOperations(bizId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/customers', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await analyticsService.getCustomers(bizId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/ai', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await analyticsService.getAI(bizId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/forecast', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await analyticsService.getForecast(bizId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/benchmark', ...auth, async (req, res) => {
  try {
    const result = await analyticsService.getBenchmark();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/kpis', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await analyticsService.getKPIs(bizId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/reports', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await analyticsService.getReports(bizId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/health', ...auth, async (req, res) => {
  try {
    const result = await analyticsService.getHealth();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/refresh', ...auth, async (req, res) => {
  try {
    const result = await analyticsService.refreshCache();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/initialize', ...auth, async (req, res) => {
  try {
    const prisma = require('../../../utils/prisma');
    const defaults = [
      { key: 'executive-refresh-interval', value: JSON.stringify({ seconds: 300 }), category: 'executive', description: 'Executive dashboard refresh interval' },
      { key: 'forecast-periods', value: JSON.stringify({ months: 6 }), category: 'forecast', description: 'Forecast lookback period in months' },
      { key: 'dashboard-layout', value: JSON.stringify({ default: 'grid', widgets: [] }), category: 'dashboard', description: 'Dashboard layout preferences' },
      { key: 'analytics-timezone', value: JSON.stringify({ timezone: 'UTC' }), category: 'analytics', description: 'Analytics timezone setting' },
      { key: 'kpi-thresholds', value: JSON.stringify({ revenue: { warning: 80, critical: 50 }, growth: { warning: 10, critical: 0 } }), category: 'analytics', description: 'KPI threshold configuration' }
    ];
    let created = 0;
    for (const d of defaults) {
      const existing = await prisma.cmsAiSettings.findFirst({ where: { key: d.key, category: d.category } });
      if (!existing) { await prisma.cmsAiSettings.create({ data: d }); created++; }
    }
    res.json({ success: true, data: { initialized: true, created } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/preferences', ...auth, async (req, res) => {
  try {
    const prisma = require('../../../utils/prisma');
    const { key, value, category } = req.body;
    if (!key) return res.status(400).json({ success: false, message: 'key required' });
    const existing = await prisma.cmsAiSettings.findFirst({ where: { key, category: category || 'dashboard' } });
    if (existing) {
      await prisma.cmsAiSettings.update({ where: { id: existing.id }, data: { value: JSON.stringify(value) } });
    } else {
      await prisma.cmsAiSettings.create({ data: { key, value: JSON.stringify(value), category: category || 'dashboard', description: `Preference: ${key}` } });
    }
    res.json({ success: true, data: { key, updated: true } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

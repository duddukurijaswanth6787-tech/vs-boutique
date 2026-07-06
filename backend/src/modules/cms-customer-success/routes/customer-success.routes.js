const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../../middleware/authMiddleware');

const csService = require('../services/customer-success.service');
const healthScoreService = require('../services/health-score.service');
const timelineService = require('../services/timeline.service');
const recommendationService = require('../services/recommendation.service');
const analyticsService = require('../services/analytics.service');
const cache = require('../middleware/customer-success-cache');

const adminOnly = authorize('super-admin', 'super_admin');

// List all businesses with health/lifecycle summary
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { page, limit, search, status } = req.query;
    const result = await csService.listBusinesses({ page: parseInt(page) || 1, limit: parseInt(limit) || 20, search, status });
    res.json({ data: result });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Get full 360 overview for a business
router.get('/:businessId', protect, adminOnly, async (req, res) => {
  try {
    const result = await csService.getOverview(req.params.businessId);
    if (!result) return res.status(404).json({ error: 'Business not found' });
    res.json({ data: result });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Get health score for a business
router.get('/:businessId/health', protect, adminOnly, async (req, res) => {
  try {
    const result = await healthScoreService.calculateHealth(req.params.businessId);
    res.json({ data: result });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Get timeline for a business
router.get('/:businessId/timeline', protect, adminOnly, async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const result = await timelineService.getTimeline(req.params.businessId, { limit: parseInt(limit) || 50, offset: parseInt(offset) || 0 });
    res.json({ data: result });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Get recommendations for a business
router.get('/:businessId/recommendations', protect, adminOnly, async (req, res) => {
  try {
    const result = await recommendationService.getRecommendations(req.params.businessId);
    res.json({ data: result });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Get aggregated success analytics
router.get('/analytics', protect, adminOnly, async (req, res) => {
  try {
    const result = await analyticsService.getAnalytics();
    res.json({ data: result });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Refresh cache
router.post('/refresh', protect, adminOnly, async (req, res) => {
  try {
    await cache.delPattern('*');
    res.json({ data: { cleared: true } });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;

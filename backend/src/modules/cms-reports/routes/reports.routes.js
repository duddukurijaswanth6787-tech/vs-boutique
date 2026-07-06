const express = require('express');
const router = express.Router();
const reportsService = require('../services/reports.service');
const reportsCache = require('../middleware/reports-cache');
const { protect, authorize } = require('../../../middleware/authMiddleware');

const cache = (req, res, next) => {
  if (req.method !== 'GET') return next();
  reportsCache.cacheMiddleware('cms:reports')(req, res, next);
};

router.post('/generate', protect, authorize('super-admin'), async (req, res) => {
  try {
    const { uploadId, certificationId, sourceLabel } = req.body;
    const report = await reportsService.generateReport(uploadId, certificationId, req.user.id, req.user.businessId, sourceLabel);
    await reportsCache.del('cms:reports:*');
    res.status(201).json({ data: report, message: 'Report generated successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', protect, cache, async (req, res) => {
  try {
    const result = await reportsService.listReports({ ...req.query, businessId: req.user.businessId });
    res.json({ data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/stats', protect, cache, async (req, res) => {
  try {
    const stats = await reportsService.getStats(req.user.businessId);
    res.json({ data: stats });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/trends', protect, cache, async (req, res) => {
  try {
    const trends = await reportsService.getTrends(req.user.businessId);
    res.json({ data: trends });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/analytics', protect, authorize('super-admin'), async (req, res) => {
  try {
    const analytics = await reportsService.getAnalytics({ ...req.query, businessId: req.user.businessId });
    res.json({ data: analytics });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/sources', protect, cache, async (req, res) => {
  try {
    const sources = await reportsService.getSources();
    res.json({ data: sources });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id', protect, cache, async (req, res) => {
  try {
    const report = await reportsService.getReport(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json({ data: report });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id/history', protect, async (req, res) => {
  try {
    const history = await reportsService.getHistory(req.params.id);
    res.json({ data: history });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id/section/:sectionType', protect, async (req, res) => {
  try {
    const section = await reportsService.getSection(req.params.id, req.params.sectionType);
    if (!section) return res.status(404).json({ error: 'Section not found' });
    res.json({ data: section });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/regenerate', protect, authorize('super-admin'), async (req, res) => {
  try {
    const report = await reportsService.regenerateReport(req.params.id, req.user.id);
    await reportsCache.del('cms:reports:*');
    res.json({ data: report, message: 'Report regenerated successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/export', protect, async (req, res) => {
  try {
    const { format = 'json' } = req.body;
    const result = await reportsService.exportReport(req.params.id, format, req.user.id);
    res.json({ data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/compare', protect, authorize('super-admin'), async (req, res) => {
  try {
    const { reportId1, reportId2 } = req.body;
    if (!reportId1 || !reportId2) return res.status(400).json({ error: 'Both reportId1 and reportId2 are required' });
    const comparison = await reportsService.compareReports(reportId1, reportId2, req.user.id);
    res.status(201).json({ data: comparison });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', protect, authorize('super-admin'), async (req, res) => {
  try {
    await reportsService.deleteReport(req.params.id);
    await reportsCache.del('cms:reports:*');
    res.json({ message: 'Report deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;

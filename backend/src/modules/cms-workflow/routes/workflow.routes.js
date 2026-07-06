const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../../middleware/authMiddleware');
const auditService = require('../../../services/auditService');
const { eventBus, Events } = require('../../../services/eventBus');

const workflowService = require('../services/workflow.service');
const templatesService = require('../services/templates.service');
const cache = require('../middleware/workflow-cache');

const adminOnly = authorize('super-admin', 'super_admin');

// Discover all workflow types across engines
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const result = await workflowService.discover();
    res.json({ data: result });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// List workflow templates
router.get('/templates', protect, adminOnly, async (req, res) => {
  try {
    const templates = await workflowService.getTemplates();
    res.json({ data: templates });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Get single template
router.get('/templates/:slug', protect, adminOnly, async (req, res) => {
  try {
    const template = await templatesService.get(req.params.slug);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json({ data: template });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Launch a workflow from template
router.post('/execute', protect, adminOnly, async (req, res) => {
  try {
    const { template: templateSlug, ...payload } = req.body;
    if (!templateSlug) return res.status(400).json({ error: 'template slug is required' });
    const userId = req.user?.id || 'SYSTEM';
    const ipAddress = req.ip;
    const result = await workflowService.launch(templateSlug, payload, userId, ipAddress);
    res.json({ data: result });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Get workflow executions across all engines
router.get('/executions', protect, adminOnly, async (req, res) => {
  try {
    const { page, limit, status, type } = req.query;
    const result = await workflowService.getExecutions({ page: parseInt(page) || 1, limit: parseInt(limit) || 20, status, type });
    res.json({ data: result });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Get single execution detail
router.get('/executions/:id', protect, adminOnly, async (req, res) => {
  try {
    const type = req.query.type || 'ai';
    const detail = await workflowService.getExecutionDetail(req.params.id, type);
    if (!detail) return res.status(404).json({ error: 'Execution not found' });
    res.json({ data: detail });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Get workflow analytics
router.get('/analytics', protect, adminOnly, async (req, res) => {
  try {
    const analytics = await workflowService.getAnalytics();
    res.json({ data: analytics });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Clear workflow cache
router.post('/clear-cache', protect, adminOnly, async (req, res) => {
  try {
    await cache.del('discover');
    await cache.delPattern('executions:*');
    await cache.del('analytics');
    res.json({ data: { cleared: true } });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Initialize defaults
router.post('/init', protect, adminOnly, async (req, res) => {
  try {
    const result = await templatesService.initializeDefaults();
    res.json({ data: result });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;

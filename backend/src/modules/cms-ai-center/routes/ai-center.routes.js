const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../../middleware/authMiddleware');
const { cacheMiddleware } = require('../middleware/ai-center-cache');

const providerService = require('../services/provider.service');
const agentService = require('../services/agent.service');
const workflowService = require('../services/workflow.service');
const executionService = require('../services/execution.service');
const analyticsService = require('../services/analytics.service');
const healthService = require('../services/health.service');
const settingsService = require('../services/settings.service');
const queueService = require('../services/queue.service');

const adminOnly = authorize('super-admin', 'super_admin');

// ===== PROVIDERS =====
router.get('/providers', protect, adminOnly, cacheMiddleware('ai', 300), async (req, res) => {
  try {
    const providers = await providerService.list();
    res.json({ data: providers });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.get('/providers/:id', protect, adminOnly, cacheMiddleware('ai', 300), async (req, res) => {
  try {
    const provider = await providerService.get(req.params.id);
    if (!provider) return res.status(404).json({ error: 'Provider not found' });
    res.json({ data: provider });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.post('/providers', protect, adminOnly, async (req, res) => {
  try {
    const provider = await providerService.create(req.body);
    res.status(201).json({ data: provider });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/providers/:id', protect, adminOnly, async (req, res) => {
  try {
    const provider = await providerService.update(req.params.id, req.body);
    res.json({ data: provider });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/providers/:id', protect, adminOnly, async (req, res) => {
  try {
    await providerService.remove(req.params.id);
    res.json({ message: 'Provider deleted' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.post('/providers/:id/test', protect, adminOnly, async (req, res) => {
  try {
    const result = await providerService.testConnection(req.params.id);
    res.json({ data: result });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.post('/providers/check-all', protect, adminOnly, async (req, res) => {
  try {
    const results = await providerService.checkAll();
    res.json({ data: results });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.get('/providers/fallback-chain', protect, adminOnly, cacheMiddleware('ai', 300), async (req, res) => {
  try {
    const chain = await providerService.getFallbackChain();
    res.json({ data: chain });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ===== AGENTS =====
router.get('/agents', protect, adminOnly, cacheMiddleware('ai', 300), async (req, res) => {
  try {
    const agents = await agentService.list(req.query);
    res.json({ data: agents });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.get('/agents/:id', protect, adminOnly, cacheMiddleware('ai', 300), async (req, res) => {
  try {
    const agent = await agentService.get(req.params.id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.json({ data: agent });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/agents/:id', protect, adminOnly, async (req, res) => {
  try {
    const agent = await agentService.update(req.params.id, req.body);
    res.json({ data: agent });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/agents/:id', protect, adminOnly, async (req, res) => {
  try {
    await agentService.remove(req.params.id);
    res.json({ message: 'Agent deleted' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.post('/agents/sync', protect, adminOnly, async (req, res) => {
  try {
    const result = await agentService.syncFromSources();
    res.json({ data: result });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.get('/agents/sources', protect, adminOnly, async (req, res) => {
  try {
    const sources = await agentService.getSourcesSummary();
    res.json({ data: sources });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.post('/agents/:id/test', protect, adminOnly, async (req, res) => {
  try {
    const result = await agentService.testAgent(req.params.id);
    res.json({ data: result });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ===== WORKFLOWS =====
router.get('/workflows', protect, adminOnly, cacheMiddleware('ai', 300), async (req, res) => {
  try {
    const workflows = await workflowService.list();
    res.json({ data: workflows });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.get('/workflows/:id', protect, adminOnly, cacheMiddleware('ai', 300), async (req, res) => {
  try {
    const workflow = await workflowService.get(req.params.id);
    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });
    res.json({ data: workflow });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.post('/workflows', protect, adminOnly, async (req, res) => {
  try {
    const workflow = await workflowService.create(req.body);
    res.status(201).json({ data: workflow });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/workflows/:id', protect, adminOnly, async (req, res) => {
  try {
    const workflow = await workflowService.update(req.params.id, req.body);
    res.json({ data: workflow });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/workflows/:id', protect, adminOnly, async (req, res) => {
  try {
    await workflowService.remove(req.params.id);
    res.json({ message: 'Workflow deleted' });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.post('/workflows/:id/execute', protect, adminOnly, async (req, res) => {
  try {
    const result = await workflowService.execute(req.params.id);
    res.json({ data: result });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.post('/workflows/:id/toggle', protect, adminOnly, async (req, res) => {
  try {
    const result = await workflowService.toggle(req.params.id, req.body.action);
    res.json({ data: result });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.get('/workflows/integrations/engines', protect, adminOnly, async (req, res) => {
  try {
    const engines = await workflowService.getEngineIntegrations();
    res.json({ data: engines });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ===== EXECUTIONS =====
router.get('/executions', protect, adminOnly, cacheMiddleware('ai', 60), async (req, res) => {
  try {
    const executions = await executionService.list(req.query);
    res.json({ data: executions });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.get('/executions/:id', protect, adminOnly, cacheMiddleware('ai', 60), async (req, res) => {
  try {
    const execution = await executionService.get(req.params.id);
    if (!execution) return res.status(404).json({ error: 'Execution not found' });
    res.json({ data: execution });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.get('/executions/:id/logs', protect, adminOnly, async (req, res) => {
  try {
    const logs = await executionService.getLogs(req.params.id);
    res.json({ data: logs });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.get('/executions/:id/steps', protect, adminOnly, async (req, res) => {
  try {
    const steps = await executionService.getSteps(req.params.id);
    res.json({ data: steps });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ===== SESSIONS =====
router.get('/sessions', protect, adminOnly, cacheMiddleware('ai', 60), async (req, res) => {
  try {
    const sessions = await executionService.getSessions(req.query);
    res.json({ data: sessions });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ===== USAGE =====
router.get('/usage', protect, adminOnly, cacheMiddleware('ai', 120), async (req, res) => {
  try {
    const usage = await analyticsService.getUsage(req.query);
    res.json({ data: usage });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.get('/usage/summary', protect, adminOnly, cacheMiddleware('ai', 120), async (req, res) => {
  try {
    const summary = await analyticsService.getUsageSummary();
    res.json({ data: summary });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ===== COST =====
router.get('/cost', protect, adminOnly, cacheMiddleware('ai', 120), async (req, res) => {
  try {
    const cost = await analyticsService.getCost(req.query);
    res.json({ data: cost });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.get('/cost/summary', protect, adminOnly, cacheMiddleware('ai', 120), async (req, res) => {
  try {
    const summary = await analyticsService.getCostSummary();
    res.json({ data: summary });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ===== HEALTH =====
router.get('/health', protect, adminOnly, cacheMiddleware('ai', 60), async (req, res) => {
  try {
    const health = await healthService.getHealth();
    res.json({ data: health });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.post('/health/check', protect, adminOnly, async (req, res) => {
  try {
    const health = await healthService.runHealthCheck();
    res.json({ data: health });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ===== SETTINGS =====
router.get('/settings', protect, adminOnly, cacheMiddleware('ai', 300), async (req, res) => {
  try {
    const { category } = req.query;
    const settings = category ? await settingsService.getByCategory(category) : await settingsService.getAll();
    res.json({ data: settings });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/settings', protect, adminOnly, async (req, res) => {
  try {
    const settings = await settingsService.update(req.body);
    res.json({ data: settings });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.post('/settings/init', protect, adminOnly, async (req, res) => {
  try {
    const result = await settingsService.initializeDefaults();
    res.json({ data: result });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ===== QUEUE =====
router.get('/queue', protect, adminOnly, cacheMiddleware('ai', 30), async (req, res) => {
  try {
    const status = await queueService.getStatus();
    res.json({ data: status });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.get('/queue/:queueName/jobs/:jobId', protect, adminOnly, async (req, res) => {
  try {
    const job = await queueService.getJobDetails(req.params.queueName, req.params.jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json({ data: job });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.post('/queue/:queueName/jobs/:jobId/retry', protect, adminOnly, async (req, res) => {
  try {
    const result = await queueService.retryJob(req.params.queueName, req.params.jobId);
    if (!result) return res.status(404).json({ error: 'Job not found or could not be retried' });
    res.json({ data: { retried: true } });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.get('/queue/workers', protect, adminOnly, async (req, res) => {
  try {
    const workers = await queueService.getWorkers();
    res.json({ data: workers });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ===== ANALYTICS DASHBOARD =====
router.get('/analytics/dashboard', protect, adminOnly, cacheMiddleware('ai', 120), async (req, res) => {
  try {
    const dashboard = await analyticsService.getDashboard();
    res.json({ data: dashboard });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.post('/analytics/clear-cache', protect, adminOnly, async (req, res) => {
  try {
    await analyticsService.clearCache();
    res.json({ data: { cleared: true } });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.get('/', protect, adminOnly, cacheMiddleware('ai', 120), async (req, res) => {
  try {
    const dashboard = await analyticsService.getDashboard();
    res.json({ success: true, data: dashboard });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;

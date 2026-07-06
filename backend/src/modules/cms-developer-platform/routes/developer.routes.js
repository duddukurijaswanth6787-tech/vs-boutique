const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../../middleware/authMiddleware');
const developerService = require('../services/developer.service');
const cache = require('../middleware/developer-cache');

const auth = [protect, authorize('super-admin')];

router.get('/', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await developerService.getOverview(bizId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/registry', ...auth, async (req, res) => {
  try {
    const cached = await cache.get('registry');
    if (cached) return res.json({ success: true, data: cached });
    const registry = developerService.registry.getRegistry();
    await cache.set('registry', registry);
    res.json({ success: true, data: registry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/openapi', ...auth, async (req, res) => {
  try {
    const cached = await cache.get('openapi');
    if (cached) return res.json({ success: true, data: cached });
    const swaggerOutput = require('../../../swagger-output.json');
    await cache.set('openapi', swaggerOutput);
    res.json({ success: true, data: swaggerOutput });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/documentation', ...auth, async (req, res) => {
  try {
    const cached = await cache.get('docs');
    if (cached) return res.json({ success: true, data: cached });
    const docs = developerService.documentation.getDocumentation();
    await cache.set('docs', docs);
    res.json({ success: true, data: docs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/sdk', ...auth, async (req, res) => {
  try {
    const lang = req.query.language || 'javascript';
    const sdk = developerService.sdk.getSdk({ language: lang, baseUrl: req.protocol + '://' + req.get('host') });
    res.setHeader('Content-Type', lang === 'curl' ? 'application/json' : 'text/plain');
    res.json({ success: true, data: sdk, language: lang });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/apikeys', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const keys = await developerService.apikeys.listKeys(bizId);
    res.json({ success: true, data: keys });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/apikeys', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await developerService.apikeys.createKey(bizId, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/apikeys/:id', ...auth, async (req, res) => {
  try {
    const result = await developerService.apikeys.updateKey(req.params.id, req.body);
    if (!result) return res.status(404).json({ success: false, message: 'API key not found' });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/apikeys/:id', ...auth, async (req, res) => {
  try {
    await developerService.apikeys.deleteKey(req.params.id);
    res.json({ success: true, message: 'API key deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/apikeys/:id/revoke', ...auth, async (req, res) => {
  try {
    const result = await developerService.apikeys.revokeKey(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/apikeys/:id/rotate', ...auth, async (req, res) => {
  try {
    const result = await developerService.apikeys.rotateKey(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'API key not found' });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/webhooks', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const webhooks = await developerService.webhooks.listWebhooks(bizId);
    res.json({ success: true, data: webhooks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/webhooks', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const webhook = await developerService.webhooks.createWebhook(bizId, req.body);
    res.json({ success: true, data: webhook });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/webhooks/:id', ...auth, async (req, res) => {
  try {
    await developerService.webhooks.deleteWebhook(req.params.id);
    res.json({ success: true, message: 'Webhook deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/analytics', ...auth, async (req, res) => {
  try {
    const cached = await cache.get('analytics');
    if (cached) return res.json({ success: true, data: cached });
    const bizId = req.user._id || req.user.id;
    const analytics = await developerService.analytics.getAnalytics(bizId);
    await cache.set('analytics', analytics, 300);
    res.json({ success: true, data: analytics });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/health', async (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      version: '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }
  });
});

router.post('/refresh', ...auth, async (req, res) => {
  try {
    await cache.delPattern('*');
    const result = await developerService.initialize();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/initialize', ...auth, async (req, res) => {
  try {
    const result = await developerService.initialize();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

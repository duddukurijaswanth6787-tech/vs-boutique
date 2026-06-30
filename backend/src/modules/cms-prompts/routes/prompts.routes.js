const express = require('express');
const router = express.Router();
const promptsService = require('../services/prompts.service');
const { protect, authorize } = require('../../../middleware/authMiddleware');

const superAdminOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'super-admin' || req.user.role === 'super_admin')) return next();
  return res.status(403).json({ success: false, message: 'Forbidden. Super Admin access required.' });
};

// ==========================================
// PROMPTS CRUD
// ==========================================

router.get('/', protect, async (req, res) => {
  try {
    const result = await promptsService.listPrompts({
      page: parseInt(req.query.page) || 1,
      limit: Math.min(parseInt(req.query.limit) || 20, 100),
      category: req.query.category,
      type: req.query.type,
      builderId: req.query.builderId,
      q: req.query.q,
      sort: req.query.sort || 'createdAt',
      order: req.query.order || 'desc',
      tags: req.query.tags?.split(',').filter(Boolean),
      businessId: req.query.businessId
    });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/categories', protect, async (req, res) => {
  try {
    const categories = await promptsService.listCategories();
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/categories', protect, superAdminOnly, async (req, res) => {
  try {
    const category = await promptsService.createCategory(req.body);
    res.status(201).json({ success: true, category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/builders', protect, async (req, res) => {
  try {
    const builders = await promptsService.listBuilders();
    res.json({ success: true, builders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/builders', protect, superAdminOnly, async (req, res) => {
  try {
    const builder = await promptsService.createBuilder(req.body);
    res.status(201).json({ success: true, builder });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/variables', protect, async (req, res) => {
  try {
    const variables = await promptsService.listVariables();
    res.json({ success: true, variables });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/variables', protect, superAdminOnly, async (req, res) => {
  try {
    const variable = await promptsService.createVariable(req.body);
    res.status(201).json({ success: true, variable });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/tags', protect, async (req, res) => {
  try {
    const tags = await promptsService.listTags();
    res.json({ success: true, tags });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/tags', protect, superAdminOnly, async (req, res) => {
  try {
    const tag = await promptsService.createTag(req.body);
    res.status(201).json({ success: true, tag });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/history', protect, async (req, res) => {
  try {
    const result = await promptsService.getHistory(req.query.promptId, {
      page: parseInt(req.query.page) || 1,
      limit: Math.min(parseInt(req.query.limit) || 20, 100)
    });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/analytics', protect, async (req, res) => {
  try {
    const analytics = await promptsService.getAnalytics({
      promptId: req.query.promptId,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo
    });
    res.json({ success: true, analytics });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/favorites', protect, async (req, res) => {
  try {
    const result = await promptsService.listFavorites(req.user.id, {
      page: parseInt(req.query.page) || 1,
      limit: Math.min(parseInt(req.query.limit) || 20, 100)
    });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/recent', protect, async (req, res) => {
  try {
    const result = await promptsService.listRecent(req.user.id, {
      page: parseInt(req.query.page) || 1,
      limit: Math.min(parseInt(req.query.limit) || 10, 50)
    });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/popular', protect, async (req, res) => {
  try {
    const result = await promptsService.listPopular({
      page: parseInt(req.query.page) || 1,
      limit: Math.min(parseInt(req.query.limit) || 10, 50)
    });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/collections', protect, async (req, res) => {
  try {
    const collections = await promptsService.manageCollections(req.user.id);
    res.json({ success: true, collections });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/collections', protect, async (req, res) => {
  try {
    const collection = await promptsService.createCollection(req.body, req.user.id);
    res.status(201).json({ success: true, collection });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/collections/:collectionId/items', protect, async (req, res) => {
  try {
    const item = await promptsService.addToCollection(req.params.collectionId, req.body.promptId, req.body.displayOrder);
    res.status(201).json({ success: true, item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/collections/:collectionId/items/:promptId', protect, async (req, res) => {
  try {
    await promptsService.removeFromCollection(req.params.collectionId, req.params.promptId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/import', protect, superAdminOnly, async (req, res) => {
  try {
    const prompt = await promptsService.importPrompt(req.body, req.user.id);
    res.status(201).json({ success: true, prompt });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// SINGLE PROMPT ENDPOINTS
// ==========================================

router.get('/:id', protect, async (req, res) => {
  try {
    const prompt = await promptsService.getPrompt(req.params.id);
    if (!prompt || prompt.isDeleted) return res.status(404).json({ success: false, message: 'Prompt not found' });
    await promptsService._trackUsage(req.params.id, 'viewed', req.user.id);
    res.json({ success: true, prompt });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', protect, superAdminOnly, async (req, res) => {
  try {
    const prompt = await promptsService.createPrompt(req.body, req.user.id);
    res.status(201).json({ success: true, prompt });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', protect, superAdminOnly, async (req, res) => {
  try {
    const prompt = await promptsService.updatePrompt(req.params.id, req.body, req.user.id);
    if (!prompt) return res.status(404).json({ success: false, message: 'Prompt not found' });
    res.json({ success: true, prompt });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', protect, superAdminOnly, async (req, res) => {
  try {
    const prompt = await promptsService.deletePrompt(req.params.id, req.user.id);
    if (!prompt) return res.status(404).json({ success: false, message: 'Prompt not found' });
    res.json({ success: true, prompt });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/clone', protect, async (req, res) => {
  try {
    const prompt = await promptsService.clonePrompt(req.params.id, req.user.id);
    if (!prompt) return res.status(404).json({ success: false, message: 'Source prompt not found' });
    res.status(201).json({ success: true, prompt });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/render', protect, async (req, res) => {
  try {
    const result = await promptsService.renderPrompt(req.params.id, req.body.variables);
    if (!result) return res.status(404).json({ success: false, message: 'Prompt not found' });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/execute', protect, async (req, res) => {
  try {
    const result = await promptsService.executePrompt(req.params.id, {
      variables: req.body.variables,
      builderId: req.body.builderId,
      userId: req.user.id
    });
    if (!result) return res.status(404).json({ success: false, message: 'Prompt not found' });
    res.json({ success: true, execution: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/favorite', protect, async (req, res) => {
  try {
    const result = await promptsService.favoritePrompt(req.params.id, req.user.id);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/rate', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }
    const result = await promptsService.ratePrompt(req.params.id, req.user.id, rating, comment);
    res.json({ success: true, rating: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id/export', protect, async (req, res) => {
  try {
    const format = req.query.format || 'json';
    const result = await promptsService.exportPrompt(req.params.id, format);
    if (!result) return res.status(404).json({ success: false, message: 'Prompt not found' });
    if (format === 'markdown') {
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="prompt-${req.params.id}.md"`);
      return res.send(result);
    }
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id/versions', protect, async (req, res) => {
  try {
    const versions = await promptsService.getVersions(req.params.id);
    res.json({ success: true, versions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/rollback', protect, superAdminOnly, async (req, res) => {
  try {
    const { version } = req.body;
    if (!version) return res.status(400).json({ success: false, message: 'version is required' });
    const prompt = await promptsService.rollbackVersion(req.params.id, parseInt(version), req.user.id);
    if (!prompt) return res.status(404).json({ success: false, message: 'Version not found' });
    res.json({ success: true, prompt });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id/audit-logs', protect, superAdminOnly, async (req, res) => {
  try {
    const logs = await promptsService.getAuditLogs(req.params.id);
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const generatorService = require('../services/generator.service');
const { protect } = require('../../../middleware/authMiddleware');
const logger = require('../../ai-core/utils/logger');

// 1. Compile full storefront from blueprint
router.post('/compile', protect, async (req, res) => {
  const { sessionId, boutiqueId } = req.body;
  if (!sessionId || !boutiqueId) {
    return res.status(400).json({ success: false, message: 'sessionId and boutiqueId are required.' });
  }

  try {
    const run = await generatorService.compileStorefront(sessionId, boutiqueId);
    res.status(202).json({
      success: true,
      message: 'AI Storefront compilation launched successfully.',
      releaseTag: run.releaseTag,
      status: run.status
    });
  } catch (err) {
    logger.error('Failed to trigger compileStorefront routes API', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Granular component or theme segment regeneration
router.post('/:boutiqueId/regenerate', protect, async (req, res) => {
  const { boutiqueId } = req.params;
  const { scope, pageSlug, componentNodeId } = req.body;
  if (!scope) {
    return res.status(400).json({ success: false, message: 'scope (e.g. theme, content, seo) is required.' });
  }

  try {
    const result = await generatorService.regenerateSegment(boutiqueId, scope, pageSlug, componentNodeId);
    res.json({
      success: true,
      message: `Regeneration of ${scope} completed successfully.`,
      result
    });
  } catch (err) {
    logger.error('Failed to regenerateSegment routes API', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Rollback website deployment release
router.post('/:boutiqueId/rollback', protect, async (req, res) => {
  const { boutiqueId } = req.params;
  const { releaseTag } = req.body;
  if (!releaseTag) {
    return res.status(400).json({ success: false, message: 'releaseTag is required.' });
  }

  try {
    const result = await generatorService.rollbackRelease(boutiqueId, releaseTag);
    res.json({
      success: true,
      message: `Rollback to ${releaseTag} completed successfully.`,
      result
    });
  } catch (err) {
    logger.error('Failed to rollbackRelease routes API', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Query compilation progress and telemetry metrics
router.get('/status/:boutiqueId', protect, async (req, res) => {
  const { boutiqueId } = req.params;
  try {
    const status = await generatorService.getCompilationStatus(boutiqueId);
    res.json({ success: true, ...status });
  } catch (err) {
    logger.error('Failed to getCompilationStatus routes API', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. SSE stream logging endpoints
router.get('/stream/:boutiqueId', async (req, res) => {
  const { boutiqueId } = req.params;
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const onLog = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  generatorService.logEmitter.on(`log:${boutiqueId}`, onLog);

  req.on('close', () => {
    generatorService.logEmitter.off(`log:${boutiqueId}`, onLog);
    res.end();
  });
});

// 6. Dynamic preview/published layout resolver (Storefront preview API)
router.get('/preview/:boutiqueId', async (req, res) => {
  const { boutiqueId } = req.params;
  const status = req.query.status || 'PUBLISHED';

  try {
    const payload = await generatorService.previewStorefront(boutiqueId, status);
    res.json({ success: true, ...payload });
  } catch (err) {
    logger.error('Failed to resolve previewStorefront layout config', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../../middleware/authMiddleware');
const devopsService = require('../services/devops.service');
const pipelineService = require('../services/pipeline.service');
const releaseService = require('../services/release.service');
const environmentService = require('../services/environment.service');
const artifactService = require('../services/artifact.service');
const buildService = require('../services/build.service');
const qualityService = require('../services/quality.service');
const analyticsService = require('../services/analytics.service');
const healthService = require('../services/health.service');

const auth = [protect, authorize('super-admin')];

router.get('/', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const [overview, pipelineSummary, releaseSummary, deploymentSummary] = await Promise.all([
      devopsService.getOverview(bizId),
      devopsService.getPipelineSummary(),
      devopsService.getReleaseSummary(),
      devopsService.getDeploymentSummary(bizId)
    ]);
    res.json({ success: true, data: { overview, pipelineSummary, releaseSummary, deploymentSummary } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/overview', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await devopsService.getDashboard(bizId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/pipelines', ...auth, async (req, res) => {
  try {
    const result = await pipelineService.getPipelines();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/releases', ...auth, async (req, res) => {
  try {
    const result = await releaseService.getReleases();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/builds', ...auth, async (req, res) => {
  try {
    const result = await buildService.getBuilds();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/artifacts', ...auth, async (req, res) => {
  try {
    const result = await artifactService.getArtifacts();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/deployments', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await devopsService.getDeploymentSummary(bizId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/environments', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await environmentService.getEnvironments(bizId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/analytics', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const [devops, pipeline, deployment] = await Promise.all([
      analyticsService.getDevOpsAnalytics(bizId),
      analyticsService.getPipelineAnalytics(),
      analyticsService.getDeploymentAnalytics(bizId)
    ]);
    res.json({ success: true, data: { devops, pipeline, deployment } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/health', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const [health, deploymentHealth, queueHealth, infraHealth] = await Promise.all([
      healthService.getHealth(bizId),
      healthService.getDeploymentHealth(bizId),
      healthService.getQueueHealth(),
      healthService.getInfrastructureHealth()
    ]);
    res.json({ success: true, data: { health, deploymentHealth, queueHealth, infraHealth } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/pipeline/run', ...auth, async (req, res) => {
  try {
    const { definitionId } = req.body;
    if (!definitionId) return res.status(400).json({ success: false, message: 'definitionId is required' });
    const result = await pipelineService.launchPipeline(definitionId);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/pipeline/pause', ...auth, async (req, res) => {
  try {
    const { executionId } = req.body;
    if (!executionId) return res.status(400).json({ success: false, message: 'executionId is required' });
    const result = await pipelineService.pausePipeline(executionId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/pipeline/resume', ...auth, async (req, res) => {
  try {
    const { executionId } = req.body;
    if (!executionId) return res.status(400).json({ success: false, message: 'executionId is required' });
    const result = await pipelineService.resumePipeline(executionId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/pipeline/cancel', ...auth, async (req, res) => {
  try {
    const { executionId } = req.body;
    if (!executionId) return res.status(400).json({ success: false, message: 'executionId is required' });
    const result = await pipelineService.cancelPipeline(executionId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/release', ...auth, async (req, res) => {
  try {
    const result = await releaseService.createRelease(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/rollback', ...auth, async (req, res) => {
  try {
    const { deploymentId } = req.body;
    if (!deploymentId) return res.status(400).json({ success: false, message: 'deploymentId is required' });
    const userId = req.user._id || req.user.id;
    const result = await releaseService.executeRollback(deploymentId, userId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/refresh', ...auth, async (req, res) => {
  try {
    const result = await devopsService.refreshCache();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/initialize', ...auth, async (req, res) => {
  try {
    const result = await devopsService.initializeDefaults();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

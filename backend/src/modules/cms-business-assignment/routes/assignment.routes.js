const express = require('express');
const router = express.Router();
const assignmentService = require('../services/assignment.service');
const { protect, authorize } = require('../../../middleware/authMiddleware');
const { cacheMiddleware } = require('../middleware/assignment-cache');

const superAdminOnly = authorize('super-admin', 'super_admin');

router.get('/', protect, superAdminOnly, cacheMiddleware('assignments', 300), async (req, res) => {
  try {
    const result = await assignmentService.listAssignments(req.query);
    res.json({ data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/stats', protect, superAdminOnly, cacheMiddleware('assignments', 300), async (req, res) => {
  try {
    const stats = await assignmentService.getAssignmentStats();
    res.json({ data: stats });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/dashboard', protect, superAdminOnly, cacheMiddleware('assignments', 300), async (req, res) => {
  try {
    const dashboard = await assignmentService.getDashboard();
    res.json({ data: dashboard });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/businesses', protect, cacheMiddleware('assignments', 300), async (req, res) => {
  try {
    const businesses = await assignmentService.findBusinesses(req.query.search);
    res.json({ data: businesses });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/jobs', protect, superAdminOnly, async (req, res) => {
  try {
    const jobs = await assignmentService.getJobs();
    res.json({ data: jobs });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/jobs/:jobType/:jobId', protect, superAdminOnly, async (req, res) => {
  try {
    const job = await assignmentService.getJob(req.params.jobType, req.params.jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json({ data: job });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/jobs/:jobType/:jobId/retry', protect, superAdminOnly, async (req, res) => {
  try {
    const result = await assignmentService.retryJob(req.params.jobType, req.params.jobId);
    if (!result) return res.status(404).json({ error: 'Job not found or could not be retried' });
    res.json({ data: { retried: true } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/cache/clear', protect, superAdminOnly, async (req, res) => {
  try {
    await assignmentService.clearCache();
    res.json({ data: { cleared: true } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/analytics/recalculate', protect, superAdminOnly, async (req, res) => {
  try {
    const dashboard = await assignmentService.recalculateAnalytics();
    res.json({ data: dashboard });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/by-business/:businessId', protect, cacheMiddleware('assignments', 300), async (req, res) => {
  try {
    const assignments = await assignmentService.getAssignmentsByBusiness(req.params.businessId);
    res.json({ data: assignments });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/by-template/:templateId', protect, superAdminOnly, cacheMiddleware('assignments', 300), async (req, res) => {
  try {
    const assignments = await assignmentService.getAssignmentsByTemplate(req.params.templateId);
    res.json({ data: assignments });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id', protect, cacheMiddleware('assignments', 300), async (req, res) => {
  try {
    const assignment = await assignmentService.getAssignment(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    res.json({ data: assignment });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id/history', protect, async (req, res) => {
  try {
    const history = await assignmentService.getAssignmentHistory(req.params.id);
    res.json({ data: history });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id/config', protect, cacheMiddleware('assignments', 300), async (req, res) => {
  try {
    const config = await assignmentService.getConfiguration(req.params.id);
    if (!config) return res.status(404).json({ error: 'Configuration not found' });
    res.json({ data: config });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/begin', protect, superAdminOnly, async (req, res) => {
  try {
    const { businessId, templateId } = req.body;
    if (!businessId || !templateId) return res.status(400).json({ error: 'businessId and templateId are required' });
    const assignment = await assignmentService.beginAssignment(businessId, templateId, req.user.id);
    res.status(201).json({ data: assignment });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id/config', protect, superAdminOnly, async (req, res) => {
  try {
    const config = await assignmentService.configureAssignment(req.params.id, req.body, req.user.id);
    res.json({ data: config });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/validate', protect, superAdminOnly, async (req, res) => {
  try {
    const result = await assignmentService.validateAndPrepare(req.params.id, req.user.id);
    res.json({ data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/deploy', protect, superAdminOnly, async (req, res) => {
  try {
    const result = await assignmentService.prepareDeployment(req.params.id, req.user.id);
    res.json({ data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/activate', protect, superAdminOnly, async (req, res) => {
  try {
    const assignment = await assignmentService.activateAssignment(req.params.id, req.user.id);
    res.json({ data: assignment });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/suspend', protect, superAdminOnly, async (req, res) => {
  try {
    const assignment = await assignmentService.suspendAssignment(req.params.id, req.user.id);
    res.json({ data: assignment });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/archive', protect, superAdminOnly, async (req, res) => {
  try {
    const assignment = await assignmentService.archiveAssignment(req.params.id, req.user.id);
    res.json({ data: assignment });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/rollback', protect, superAdminOnly, async (req, res) => {
  try {
    const assignment = await assignmentService.rollbackAssignment(req.params.id, req.user.id);
    res.json({ data: assignment });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', protect, superAdminOnly, async (req, res) => {
  try {
    await assignmentService.deleteAssignment(req.params.id, req.user.id);
    res.json({ message: 'Assignment deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;

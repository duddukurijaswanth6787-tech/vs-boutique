const express = require('express');
const router = express.Router();
const requirementsService = require('../services/requirements.service');
const { protect, authorize } = require('../../../middleware/authMiddleware');

const superAdminOnly = authorize('super-admin', 'super_admin');

/**
 * @route   GET /api/v1/cms/requirements
 * @desc    Get all requirement definitions
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const { category, q } = req.query;
    const requirements = await requirementsService.listRequirements(category, q);
    res.json({ success: true, requirements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @route   GET /api/v1/cms/requirements/templates
 * @desc    Get all requirement presets templates
 * @access  Private
 */
router.get('/templates', protect, async (req, res) => {
  try {
    const templates = await requirementsService.listTemplates();
    res.json({ success: true, templates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @route   GET /api/v1/cms/requirements/templates/:id
 * @desc    Compile requirement tree for a template key/id
 * @access  Private
 */
router.get('/templates/:id', protect, async (req, res) => {
  try {
    const compilation = await requirementsService.compileTemplate(req.params.id);
    res.json({ success: true, ...compilation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @route   GET /api/v1/cms/requirements/:id
 * @desc    Get a single requirement definition by key or UUID
 * @access  Private
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const requirement = await requirementsService.getRequirement(req.params.id);
    if (!requirement) {
      return res.status(404).json({ success: false, message: 'Requirement not found.' });
    }
    res.json({ success: true, requirement });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @route   POST /api/v1/cms/requirements
 * @desc    Create a requirement definition
 * @access  Private (Super Admin Only)
 */
router.post('/', protect, superAdminOnly, async (req, res) => {
  try {
    const requirement = await requirementsService.createRequirement(req.body, req.user.id);
    res.status(201).json({ success: true, requirement });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * @route   PUT /api/v1/cms/requirements/:id
 * @desc    Update a requirement definition
 * @access  Private (Super Admin Only)
 */
router.put('/:id', protect, superAdminOnly, async (req, res) => {
  try {
    const requirement = await requirementsService.updateRequirement(req.params.id, req.body, req.user.id);
    res.json({ success: true, requirement });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * @route   DELETE /api/v1/cms/requirements/:id
 * @desc    Soft delete a requirement definition
 * @access  Private (Super Admin Only)
 */
router.delete('/:id', protect, superAdminOnly, async (req, res) => {
  try {
    await requirementsService.deleteRequirement(req.params.id);
    res.json({ success: true, message: 'Requirement successfully soft deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @route   POST /api/v1/cms/requirements/validate
 * @desc    Validate requirement keys against dependency graph rules
 * @access  Private
 */
router.post('/validate', protect, async (req, res) => {
  try {
    const { activeKeys } = req.body;
    if (!activeKeys || !Array.isArray(activeKeys)) {
      return res.status(400).json({ success: false, message: 'activeKeys must be an array of key strings.' });
    }
    const validation = await requirementsService.resolveRequirements(activeKeys);
    res.json({ success: true, ...validation });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;

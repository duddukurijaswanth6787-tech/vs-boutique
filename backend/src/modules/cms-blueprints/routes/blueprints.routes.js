const express = require('express');
const router = express.Router();
const blueprintService = require('../services/blueprint.service');
const { protect, authorize } = require('../../../middleware/authMiddleware');

const superAdminOnly = authorize('super-admin', 'super_admin');

/**
 * @route   GET /api/v1/cms/blueprints
 * @desc    Get all blueprint templates
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const blueprints = await blueprintService.listBlueprints(req.query.q);
    res.json({ success: true, blueprints });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @route   GET /api/v1/cms/blueprints/:id
 * @desc    Get a single blueprint detail record by key or UUID
 * @access  Private
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const blueprint = await blueprintService.getBlueprint(req.params.id);
    if (!blueprint) {
      return res.status(404).json({ success: false, message: 'Blueprint not found.' });
    }
    res.json({ success: true, blueprint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @route   POST /api/v1/cms/blueprints
 * @desc    Create a new blueprint template record
 * @access  Private (Super Admin Only)
 */
router.post('/', protect, superAdminOnly, async (req, res) => {
  try {
    const blueprint = await blueprintService.createBlueprint(req.body, req.user.id);
    res.status(201).json({ success: true, blueprint });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * @route   POST /api/v1/cms/blueprints/:id/compile
 * @desc    Compile blueprint layouts and resolve features
 * @access  Private (Super Admin Only)
 */
router.post('/:id/compile', protect, superAdminOnly, async (req, res) => {
  try {
    const result = await blueprintService.compileBlueprint(req.params.id, req.user.id);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * @route   POST /api/v1/cms/blueprints/:id/rollback
 * @desc    Revert blueprint template config to historical version
 * @access  Private (Super Admin Only)
 */
router.post('/:id/rollback', protect, superAdminOnly, async (req, res) => {
  try {
    const { version } = req.body;
    if (!version) {
      return res.status(400).json({ success: false, message: 'Target version number is required.' });
    }
    const blueprint = await blueprintService.rollbackBlueprint(req.params.id, parseInt(version, 10), req.user.id);
    res.json({ success: true, blueprint });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;

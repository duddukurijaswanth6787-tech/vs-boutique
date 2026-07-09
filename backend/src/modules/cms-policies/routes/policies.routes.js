const express = require('express');
const router = express.Router();
const controller = require('../controllers/policies.controller');
const { protect, authorize } = require('../../../middleware/authMiddleware');

// Public endpoints (used by storefront frontend)
router.get('/settings', controller.getSettings.bind(controller));
router.get('/:key', controller.getPolicy.bind(controller));

// Administrative endpoints (restricted to super-admin)
router.put('/settings', protect, authorize('super-admin'), controller.updateSettings.bind(controller));
router.put('/:key', protect, authorize('super-admin'), controller.updatePolicy.bind(controller));
router.get('/:key/history', protect, authorize('super-admin'), controller.getHistory.bind(controller));

module.exports = router;

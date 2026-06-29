const express = require('express');
const router = express.Router();
const marketplaceController = require('../controllers/marketplace.controller');
const { protect, authorize } = require('../../../middleware/authMiddleware');

// 1. Publisher registration
router.post('/publisher/register', protect, authorize('owner', 'super-admin'), marketplaceController.registerPublisher);

// 2. Package publishing
router.post('/packages/publish', protect, authorize('owner', 'super-admin'), marketplaceController.publishPackage);

// 3. Discovery catalog
router.get('/packages/search', protect, marketplaceController.searchPackages);
router.get('/packages/:slug', protect, marketplaceController.getPackage);

// 4. Installation Management
router.post('/installations', protect, authorize('owner', 'super-admin'), marketplaceController.installPackage);
router.delete('/installations/:packageId', protect, authorize('owner', 'super-admin'), marketplaceController.uninstallPackage);
router.put('/installations/:packageId/toggle', protect, authorize('owner', 'super-admin'), marketplaceController.toggleEnabled);

module.exports = router;

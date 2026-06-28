const express = require('express');
const router = express.Router();
const subscriptionsController = require('../controllers/subscriptions.controller');
const { protect, authorize, checkReadOnlyMode, checkBoutiqueStatus } = require('../../../middleware/authMiddleware');

// Owner subscription status
router.get('/owner', protect, authorize('owner'), subscriptionsController.getOwnerSubscriptionStatus);

// Create payment order
router.post('/owner/create-payment', protect, authorize('owner'), checkReadOnlyMode, checkBoutiqueStatus, subscriptionsController.createPaymentOrder);

// Verify payment
router.post('/owner/verify-payment', protect, authorize('owner'), checkReadOnlyMode, checkBoutiqueStatus, subscriptionsController.verifyPayment);

// Upgrade/renew subscription (mock or manual)
router.post('/owner/upgrade', protect, authorize('owner'), checkReadOnlyMode, checkBoutiqueStatus, subscriptionsController.upgradeSubscription);

// Cancel subscription renewal
router.post('/owner/cancel', protect, authorize('owner'), checkReadOnlyMode, checkBoutiqueStatus, subscriptionsController.cancelSubscription);

// Plans CRUD
router.get('/plans', subscriptionsController.listPlans);
router.post('/plans', protect, authorize('super-admin'), subscriptionsController.createPlan);
router.put('/plans/:id', protect, authorize('super-admin'), subscriptionsController.updatePlan);
router.post('/plans/:id/clone', protect, authorize('super-admin'), subscriptionsController.clonePlan);
router.delete('/plans/:id', protect, authorize('super-admin'), subscriptionsController.deactivatePlan);

// Custom plans request
router.post('/owner/request-custom', protect, authorize('owner'), checkReadOnlyMode, checkBoutiqueStatus, subscriptionsController.requestCustomPlan);
router.get('/owner/requests', protect, authorize('owner'), subscriptionsController.getOwnerCustomRequests);
router.get('/admin/requests', protect, authorize('super-admin'), subscriptionsController.getAdminCustomRequests);
router.put('/admin/requests/:id', protect, authorize('super-admin'), subscriptionsController.updateAdminCustomRequest);

// Superadmin subscription analytics
router.get('/admin/analytics', protect, authorize('super-admin'), subscriptionsController.getSuperadminAnalytics);

module.exports = router;

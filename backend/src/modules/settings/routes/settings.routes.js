const express = require('express');
const router = express.Router();
const controller = require('../controllers/settings.controller');
const { protect, authorize } = require('../../../middleware/authMiddleware');

router.use(protect);
router.use(authorize('super-admin'));

router.get('/revenue', controller.getRevenueReport.bind(controller));
router.get('/fraud', controller.getFraudReport.bind(controller));
router.get('/wishlists', controller.getWishlistReport.bind(controller));
router.get('/command-center', controller.getCommandCenterStats.bind(controller));
router.get('/subscriptions', controller.getSubscriptionAnalytics.bind(controller));
router.put('/subscriptions/update', controller.updateSubscription.bind(controller));

module.exports = router;

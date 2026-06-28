const express = require('express');
const router = express.Router();
const controller = require('../controllers/measurements.controller');
const { protect, checkReadOnlyMode, checkBoutiqueStatus, checkFeatureAccess } = require('../../../middleware/authMiddleware');
const { checkPlanFeature, requireCustomTailoring } = require('../../../middleware/subscriptionMiddleware');

router.use(protect);
router.use(checkReadOnlyMode);

// Customer self-service routes
router.get('/me', controller.getCustomerSelfMeasurement.bind(controller));
router.put('/me', controller.updateCustomerSelfMeasurement.bind(controller));
router.delete('/me', controller.deleteCustomerSelfMeasurement.bind(controller));

// Owner/management middleware group
const ownerMiddleware = [
  checkBoutiqueStatus,
  requireCustomTailoring,
  checkPlanFeature('canUseCustomMeasurements'),
  checkFeatureAccess('measurements')
];

// Owner routes
router.post('/', ...ownerMiddleware, controller.recordMeasurementByOwner.bind(controller));
router.get('/:userId', ...ownerMiddleware, controller.getMeasurementByUser.bind(controller));

module.exports = router;

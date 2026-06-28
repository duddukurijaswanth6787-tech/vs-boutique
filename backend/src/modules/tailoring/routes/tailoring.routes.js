const express = require('express');
const router = express.Router();
const controller = require('../controllers/tailoring.controller');
const { protect, authorize, checkPermission, checkReadOnlyMode, checkBoutiqueStatus, checkFeatureAccess } = require('../../../middleware/authMiddleware');
const { checkPlanFeature, requireCustomTailoring } = require('../../../middleware/subscriptionMiddleware');

// Public route to allow customer scheduling
router.post('/', checkBoutiqueStatus, controller.createBooking.bind(controller));

// Authenticated customer bookings
router.get('/my', protect, controller.listCustomerBookings.bind(controller));

// Owner/Admin specific checks middleware group
const secureMiddleware = [
  protect,
  requireCustomTailoring,
  checkFeatureAccess('bookings'),
  checkReadOnlyMode,
  checkBoutiqueStatus
];

// Admin-level metrics stats
router.get('/stats', ...secureMiddleware, authorize('super-admin', 'owner'), controller.getBookingStats.bind(controller));

// Superadmin listing
router.get('/admin', ...secureMiddleware, authorize('super-admin'), controller.listBookings.bind(controller));

// Boutique Owner listing
router.get('/owner', ...secureMiddleware, authorize('owner'), controller.listOwnerBookings.bind(controller));

// Actions
router.put('/:id/status', ...secureMiddleware, authorize('super-admin', 'owner'), checkPermission('canManageBookings'), checkPlanFeature('allowCustomTailoring'), controller.updateBookingStatus.bind(controller));
router.put('/:id/reschedule', ...secureMiddleware, authorize('super-admin', 'owner'), checkPermission('canManageBookings'), checkPlanFeature('allowCustomTailoring'), controller.rescheduleBooking.bind(controller));
router.put('/:id/assign', ...secureMiddleware, authorize('super-admin', 'owner'), checkPermission('canManageBookings'), checkPlanFeature('allowCustomTailoring'), controller.assignBookingOwner.bind(controller));
router.put('/:id/notes', ...secureMiddleware, authorize('super-admin', 'owner'), checkPermission('canManageBookings'), checkPlanFeature('allowCustomTailoring'), controller.updateBookingNotes.bind(controller));
router.post('/:id/remind', ...secureMiddleware, authorize('super-admin', 'owner'), checkPermission('canManageBookings'), checkPlanFeature('allowCustomTailoring'), controller.triggerBookingReminder.bind(controller));

module.exports = router;

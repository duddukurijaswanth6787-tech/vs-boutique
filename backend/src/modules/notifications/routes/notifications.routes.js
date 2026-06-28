const express = require('express');
const notificationsController = require('../controllers/notifications.controller');
const { protect, authorize, checkReadOnlyMode, checkBoutiqueStatus } = require('../../../middleware/authMiddleware');

// ── 1. Admin Notifications Router (mounted at /admin/notifications) ──
const adminNotificationsRouter = express.Router();
adminNotificationsRouter.use(protect);

adminNotificationsRouter.get('/', notificationsController.getAdminNotifications);
adminNotificationsRouter.get('/unread-count', notificationsController.getAdminUnreadCount);
adminNotificationsRouter.patch('/:id/read', notificationsController.markAdminNotificationRead);
adminNotificationsRouter.patch('/read-all', notificationsController.markAllAdminNotificationsRead);
adminNotificationsRouter.delete('/:id', notificationsController.deleteAdminNotification);

// ── 2. Customer Notifications Router (mounted at /customer/notifications) ──
const customerNotificationsRouter = express.Router();
customerNotificationsRouter.use(protect);

customerNotificationsRouter.get('/', notificationsController.getCustomerNotifications);
customerNotificationsRouter.get('/unread-count', notificationsController.getCustomerUnreadCount);
customerNotificationsRouter.patch('/:id/read', notificationsController.markCustomerAsRead);
customerNotificationsRouter.patch('/read-all', notificationsController.markAllCustomerRead);
customerNotificationsRouter.delete('/:id', notificationsController.deleteCustomerNotification);

// ── 3. General Notifications Router (mounted at /notifications) ──
const notificationsRouter = express.Router();

notificationsRouter.get('/', protect, checkReadOnlyMode, checkBoutiqueStatus, notificationsController.getGeneralNotifications);
notificationsRouter.put('/:id/read', protect, checkReadOnlyMode, checkBoutiqueStatus, notificationsController.markGeneralNotificationRead);
notificationsRouter.get('/admin/analytics', protect, authorize('super-admin'), notificationsController.getSuperAdminAnalytics);
notificationsRouter.post('/broadcast', protect, authorize('super-admin'), notificationsController.broadcastNotification);
notificationsRouter.get('/templates', protect, checkReadOnlyMode, checkBoutiqueStatus, notificationsController.getTemplates);
notificationsRouter.post('/templates', protect, authorize('super-admin'), notificationsController.createTemplate);
notificationsRouter.get('/campaigns', protect, authorize('super-admin'), notificationsController.getCampaigns);
notificationsRouter.post('/campaigns', protect, authorize('super-admin'), notificationsController.createCampaign);

module.exports = {
  adminNotificationsRouter,
  customerNotificationsRouter,
  notificationsRouter
};

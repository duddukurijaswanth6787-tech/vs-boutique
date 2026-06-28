const express = require('express');
const superadminRouter = express.Router();
const ownerPortalRouter = express.Router();
const ownersController = require('../controllers/owners.controller');
const { protect, authorize, checkPermission, checkReadOnlyMode, checkBoutiqueStatus, checkFeatureAccess } = require('../../../middleware/authMiddleware');
const { checkPlanFeature } = require('../../../middleware/subscriptionMiddleware');

// ==========================================
// 1. SUPERADMIN ROUTES (mounted at /owners)
// ==========================================
superadminRouter.get('/unassigned', protect, authorize('super-admin'), ownersController.getUnassignedOwners);
superadminRouter.post('/invite', protect, authorize('super-admin'), checkReadOnlyMode, checkBoutiqueStatus, checkPlanFeature('canManageStaff'), ownersController.inviteOwner);
superadminRouter.post('/link', protect, authorize('super-admin'), ownersController.linkOwner);
superadminRouter.post('/unlink', protect, authorize('super-admin'), ownersController.unlinkOwner);
superadminRouter.post('/:id/resend-invite', protect, authorize('super-admin'), ownersController.resendInvite);
superadminRouter.put('/:id/status', protect, authorize('super-admin'), ownersController.updateOwnerStatus);
superadminRouter.post('/:id/send-reset-link', protect, authorize('super-admin'), ownersController.sendResetLink);
superadminRouter.put('/:id/permissions', protect, authorize('super-admin'), ownersController.updateOwnerPermissions);
superadminRouter.put('/:id/block', protect, authorize('super-admin'), ownersController.blockOwner);
superadminRouter.put('/:id/unblock', protect, authorize('super-admin'), ownersController.unblockOwner);

// ==========================================
// 2. OWNER PORTAL ROUTES (mounted at /owner)
// ==========================================
ownerPortalRouter.use(checkReadOnlyMode);
ownerPortalRouter.use(checkBoutiqueStatus);

ownerPortalRouter.get('/me', protect, authorize('owner'), ownersController.getMe);
ownerPortalRouter.get('/dashboard', protect, authorize('owner'), checkFeatureAccess('analytics'), checkPlanFeature('canViewAnalytics'), ownersController.getDashboard);
ownerPortalRouter.get('/boutique', protect, authorize('owner'), ownersController.getBoutique);
ownerPortalRouter.put('/boutique', protect, authorize('owner'), checkPermission('canEditProfile'), ownersController.updateBoutiqueInfo);
ownerPortalRouter.put('/services', protect, authorize('owner'), checkPermission('canEditServices'), ownersController.updateServices);
ownerPortalRouter.put('/gallery', protect, authorize('owner'), checkPermission('canEditGallery'), ownersController.updateGallery);
ownerPortalRouter.put('/media', protect, authorize('owner'), checkPermission('canManageMedia'), ownersController.updateMedia);
ownerPortalRouter.get('/staff', protect, authorize('owner'), checkFeatureAccess('staff'), checkPlanFeature('canManageStaff'), ownersController.getStaff);
ownerPortalRouter.post('/change-password', protect, authorize('owner'), ownersController.changePassword);

module.exports = {
  superadminRouter,
  ownerPortalRouter
};

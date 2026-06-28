const express = require('express');
const reviewsController = require('../controllers/reviews.controller');
const { protect, authorize, checkReadOnlyMode, checkBoutiqueStatus, checkFeatureAccess } = require('../../../middleware/authMiddleware');
const { checkPlanFeature } = require('../../../middleware/subscriptionMiddleware');

// ── 1. Boutique Reviews Router (/reviews) ──
const reviewsRouter = express.Router();

reviewsRouter.get('/boutique/:boutiqueId', reviewsController.listBoutiqueReviews);
reviewsRouter.post('/:id/report', checkBoutiqueStatus, reviewsController.reportReviewCustomer);
reviewsRouter.post('/', protect, checkReadOnlyMode, checkBoutiqueStatus, checkPlanFeature('canManageReviews'), reviewsController.createBoutiqueReview);

// Secure area for Boutique Reviews
const boutiqueSecureMiddleware = [
  protect,
  checkFeatureAccess('reviews'),
  checkPlanFeature('canManageReviews'),
  checkReadOnlyMode,
  checkBoutiqueStatus
];

reviewsRouter.get('/stats', ...boutiqueSecureMiddleware, authorize('super-admin', 'owner'), reviewsController.getReviewStats);
reviewsRouter.get('/admin', ...boutiqueSecureMiddleware, authorize('super-admin'), reviewsController.listReviewsAdmin);
reviewsRouter.get('/owner', ...boutiqueSecureMiddleware, authorize('owner'), reviewsController.listOwnerReviews);
reviewsRouter.put('/:id/moderation', ...boutiqueSecureMiddleware, authorize('super-admin'), reviewsController.moderateReviewAdmin);
reviewsRouter.put('/:id/reply', ...boutiqueSecureMiddleware, authorize('owner', 'super-admin'), reviewsController.replyToReviewOwner);


// ── 2. Product Reviews - Customer Router (mounted at /products/:productId/reviews) ──
const productReviewsCustomerRouter = express.Router({ mergeParams: true });

productReviewsCustomerRouter.get('/', reviewsController.getProductReviews);
productReviewsCustomerRouter.get('/summary', reviewsController.getProductReviewSummary);
productReviewsCustomerRouter.post('/', protect, checkReadOnlyMode, checkBoutiqueStatus, reviewsController.createProductReview);
productReviewsCustomerRouter.put('/:reviewId', protect, checkReadOnlyMode, checkBoutiqueStatus, reviewsController.updateProductReview);
productReviewsCustomerRouter.delete('/:reviewId', protect, checkReadOnlyMode, checkBoutiqueStatus, reviewsController.deleteProductReview);


// ── 3. Product Reviews - Owner Router (mounted at /owner/products/:productId/reviews) ──
const productReviewsOwnerRouter = express.Router({ mergeParams: true });
productReviewsOwnerRouter.use(protect, authorize('owner', 'super-admin'), checkReadOnlyMode, checkBoutiqueStatus);

productReviewsOwnerRouter.get('/', reviewsController.getOwnerProductReviews);
productReviewsOwnerRouter.post('/:reviewId/reply', reviewsController.setProductReviewReply);
productReviewsOwnerRouter.delete('/:reviewId/reply', reviewsController.deleteProductReviewReply);


// ── 4. Product Reviews - Global Admin Router (mounted at /admin/product-reviews) ──
const productReviewsGlobalAdminRouter = express.Router();
productReviewsGlobalAdminRouter.use(protect, authorize('super-admin'), checkReadOnlyMode, checkBoutiqueStatus);

productReviewsGlobalAdminRouter.get('/', reviewsController.globalAdminGetProductReviews);


// ── 5. Product Reviews - Admin Router (mounted at /admin/products/:productId/reviews) ──
const productReviewsAdminRouter = express.Router({ mergeParams: true });
productReviewsAdminRouter.use(protect, authorize('super-admin'), checkReadOnlyMode, checkBoutiqueStatus);

productReviewsAdminRouter.put('/:reviewId/approve', reviewsController.approveProductReview);
productReviewsAdminRouter.put('/:reviewId/reject', reviewsController.rejectProductReview);
productReviewsAdminRouter.put('/:reviewId/hide', reviewsController.hideProductReview);
productReviewsAdminRouter.delete('/:reviewId', reviewsController.adminDeleteProductReview);


module.exports = {
  reviewsRouter,
  productReviewsCustomerRouter,
  productReviewsOwnerRouter,
  productReviewsGlobalAdminRouter,
  productReviewsAdminRouter
};

const express = require('express');
const commerceController = require('../controllers/commerce.controller');
const { protect, authorize, checkReadOnlyMode, checkBoutiqueStatus, checkPermission } = require('../../../middleware/authMiddleware');
const { requireDirectSelling } = require('../../../middleware/subscriptionMiddleware');

const ownerMiddleware = [
  protect,
  authorize('owner', 'super-admin'),
  checkReadOnlyMode,
  checkBoutiqueStatus,
  checkPermission('canManageOrders'),
  requireDirectSelling
];

// Router 1: customerCommerceRouter (mounted at /orders combined router)
const customerCommerceRouter = express.Router();

customerCommerceRouter.get('/my', protect, commerceController.getCustomerOrders);
customerCommerceRouter.get('/my/:id', protect, commerceController.getCustomerOrderById);
customerCommerceRouter.post('/:id/cancel', protect, commerceController.cancelCustomerOrder);
customerCommerceRouter.get('/:id/timeline', protect, commerceController.getOrderTimeline);


// Router 2: ownerCommerceRouter (mounted at /owner/orders)
const ownerCommerceRouter = express.Router();

ownerCommerceRouter.get('/', protect, authorize('owner', 'super-admin'), checkReadOnlyMode, checkBoutiqueStatus, commerceController.getOwnerOrders);
ownerCommerceRouter.get('/:id', protect, authorize('owner', 'super-admin'), checkReadOnlyMode, checkBoutiqueStatus, commerceController.getOwnerOrderById);

ownerCommerceRouter.put('/:id/confirm', ...ownerMiddleware, commerceController.confirmOwnerOrder);
ownerCommerceRouter.put('/:id/pack', ...ownerMiddleware, commerceController.packOwnerOrder);
ownerCommerceRouter.put('/:id/ship', ...ownerMiddleware, commerceController.shipOwnerOrder);
ownerCommerceRouter.put('/:id/out-for-delivery', ...ownerMiddleware, commerceController.outForDeliveryOwnerOrder);
ownerCommerceRouter.put('/:id/deliver', ...ownerMiddleware, commerceController.deliverOwnerOrder);
ownerCommerceRouter.put('/:id/cancel', ...ownerMiddleware, commerceController.cancelOwnerOrder);


module.exports = {
  customerCommerceRouter,
  ownerCommerceRouter
};

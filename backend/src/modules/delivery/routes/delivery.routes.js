const express = require('express');
const controller = require('../controllers/delivery.controller');
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

// Tracking Routers
const ownerTrackingRouter = express.Router({ mergeParams: true });
ownerTrackingRouter.get('/', ...ownerMiddleware, controller.getTrackingForOwner.bind(controller));
ownerTrackingRouter.post('/', ...ownerMiddleware, controller.createTracking.bind(controller));
ownerTrackingRouter.put('/status', ...ownerMiddleware, controller.updateTrackingStatus.bind(controller));

const customerTrackingRouter = express.Router();
customerTrackingRouter.get('/:orderId/tracking', protect, controller.getOrderTrackingForCustomer.bind(controller));

// Return Routers
const customerReturnsRouter = express.Router();
customerReturnsRouter.post('/', protect, controller.createReturn.bind(controller));
customerReturnsRouter.get('/my', protect, controller.getCustomerReturns.bind(controller));
customerReturnsRouter.get('/:id', protect, controller.getReturnById.bind(controller));

const ownerReturnsRouter = express.Router();
ownerReturnsRouter.patch('/:id/status', protect, authorize('owner', 'super-admin'), controller.updateReturnStatus.bind(controller));

// Exchange Routers
const customerExchangesRouter = express.Router();
customerExchangesRouter.post('/', protect, controller.createExchange.bind(controller));
customerExchangesRouter.get('/my', protect, controller.getCustomerExchanges.bind(controller));
customerExchangesRouter.get('/:id', protect, controller.getExchangeById.bind(controller));

const ownerExchangesRouter = express.Router();
ownerExchangesRouter.patch('/:id/status', protect, authorize('owner', 'super-admin'), controller.updateExchangeStatus.bind(controller));

module.exports = {
  ownerTrackingRouter,
  customerTrackingRouter,
  customerReturnsRouter,
  ownerReturnsRouter,
  customerExchangesRouter,
  ownerExchangesRouter
};

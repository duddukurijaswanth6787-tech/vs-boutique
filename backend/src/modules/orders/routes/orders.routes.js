const express = require('express');
const ordersController = require('../controllers/orders.controller');
const { protect, authorize, checkPermission, checkReadOnlyMode, checkBoutiqueStatus, checkFeatureAccess } = require('../../../middleware/authMiddleware');
const { checkPlanFeature } = require('../../../middleware/subscriptionMiddleware');

// Owner / Admin Tailoring Orders router
const ordersRouter = express.Router();

ordersRouter.use(protect);
ordersRouter.use(checkFeatureAccess('orders'));
ordersRouter.use(checkReadOnlyMode);
ordersRouter.use(checkBoutiqueStatus);

ordersRouter.get('/', ordersController.getOrdersList);
ordersRouter.get('/:id', ordersController.getOrderById);
ordersRouter.post('/', authorize('owner', 'super-admin'), checkPermission('canManageOrders'), ordersController.createOrder);
ordersRouter.put('/:id/status', checkPermission('canManageOrders'), checkPlanFeature('canManageTailoringOrders'), ordersController.updateOrderStatus);
ordersRouter.put('/:id/payment', checkPermission('canManageOrders'), checkPlanFeature('canManageTailoringOrders'), ordersController.updateOrderPayment);
ordersRouter.put('/:id/measurements', checkPermission('canManageOrders'), ordersController.updateOrderMeasurements);


// Customer Tailoring Orders router
const customerOrdersRouter = express.Router();

customerOrdersRouter.use(protect);

customerOrdersRouter.get('/my', ordersController.getCustomerOrdersList);
customerOrdersRouter.get('/my/:id', ordersController.getCustomerOrderById);
customerOrdersRouter.post('/:id/cancel', ordersController.cancelCustomerOrder);


module.exports = {
  ordersRouter,
  customerOrdersRouter
};

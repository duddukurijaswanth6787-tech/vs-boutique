const express = require('express');
const couponsController = require('../controllers/coupons.controller');
const { protect, authorize, checkReadOnlyMode, checkBoutiqueStatus } = require('../../../middleware/authMiddleware');

const customerRouter = express.Router();
customerRouter.post('/validate', protect, checkReadOnlyMode, checkBoutiqueStatus, couponsController.validateCoupon);

const adminRouter = express.Router();
adminRouter.use(protect, authorize('super-admin'), checkReadOnlyMode, checkBoutiqueStatus);
adminRouter.get('/', couponsController.adminListCoupons);
adminRouter.post('/', couponsController.adminCreateCoupon);
adminRouter.get('/:id', couponsController.adminGetCoupon);
adminRouter.put('/:id', couponsController.adminUpdateCoupon);
adminRouter.patch('/:id/toggle', couponsController.adminToggleCoupon);
adminRouter.delete('/:id', couponsController.adminDeleteCoupon);

const ownerRouter = express.Router();
ownerRouter.use(protect, authorize('owner', 'super-admin'), checkReadOnlyMode, checkBoutiqueStatus);
ownerRouter.get('/', couponsController.ownerListCoupons);
ownerRouter.post('/', couponsController.ownerCreateCoupon);
ownerRouter.get('/:id', couponsController.ownerGetCoupon);
ownerRouter.put('/:id', couponsController.ownerUpdateCoupon);
ownerRouter.delete('/:id', couponsController.ownerDeleteCoupon);

module.exports = {
  customerRouter,
  adminRouter,
  ownerRouter
};

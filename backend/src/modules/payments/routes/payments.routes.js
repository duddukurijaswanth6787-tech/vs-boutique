const express = require('express');
const paymentsController = require('../controllers/payments.controller');
const { protect, authorize, checkReadOnlyMode, checkBoutiqueStatus } = require('../../../middleware/authMiddleware');
const { checkPlanFeature } = require('../../../middleware/subscriptionMiddleware');

// ── Payments Router ──
const paymentsRouter = express.Router();

paymentsRouter.post('/create-order', protect, checkReadOnlyMode, checkBoutiqueStatus, paymentsController.createPaymentOrder);
paymentsRouter.get('/settlements', protect, authorize('super-admin'), checkReadOnlyMode, checkBoutiqueStatus, paymentsController.getSettlements);
paymentsRouter.get('/reports', protect, authorize('super-admin'), checkReadOnlyMode, checkBoutiqueStatus, checkPlanFeature('canViewFinancialReports'), paymentsController.getReports);
paymentsRouter.get('/:id', protect, checkReadOnlyMode, checkBoutiqueStatus, paymentsController.getPaymentById);
paymentsRouter.post('/verify', protect, checkReadOnlyMode, checkBoutiqueStatus, paymentsController.verifyPayment);
paymentsRouter.post('/webhook', paymentsController.webhook);
paymentsRouter.post('/refund', protect, authorize('super-admin'), checkReadOnlyMode, checkBoutiqueStatus, paymentsController.refund);
paymentsRouter.post('/payout', protect, authorize('super-admin'), checkReadOnlyMode, checkBoutiqueStatus, paymentsController.payout);
paymentsRouter.get('/', protect, checkReadOnlyMode, checkBoutiqueStatus, paymentsController.getPayments);

// ── Payouts Router ──
const payoutsRouter = express.Router();

payoutsRouter.get('/commission-settings', protect, authorize('super-admin'), paymentsController.getCommissionSettings);
payoutsRouter.put('/commission-settings', protect, authorize('super-admin'), checkReadOnlyMode, checkBoutiqueStatus, paymentsController.updateCommissionSettings);
payoutsRouter.put('/boutiques/:id/commission', protect, authorize('super-admin'), checkReadOnlyMode, checkBoutiqueStatus, paymentsController.setBoutiqueCommission);
payoutsRouter.get('/admin', protect, authorize('super-admin'), paymentsController.getPayoutsAdmin);
payoutsRouter.get('/owner', protect, authorize('owner'), paymentsController.getPayoutsOwner);
payoutsRouter.post('/admin/generate', protect, authorize('super-admin'), checkReadOnlyMode, checkBoutiqueStatus, paymentsController.generatePayoutAdmin);
payoutsRouter.put('/admin/:id/status', protect, authorize('super-admin'), checkReadOnlyMode, checkBoutiqueStatus, paymentsController.updatePayoutStatusAdmin);

module.exports = {
  paymentsRouter,
  payoutsRouter
};

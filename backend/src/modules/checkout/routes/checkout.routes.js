const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkout.controller');
const { protect, checkReadOnlyMode, checkBoutiqueStatus } = require('../../../middleware/authMiddleware');

const checkoutMiddleware = [protect, checkReadOnlyMode, checkBoutiqueStatus];

router.post('/validate', ...checkoutMiddleware, checkoutController.validateCart);
router.post('/create-order', ...checkoutMiddleware, checkoutController.createOrder);
router.post('/create-payment', ...checkoutMiddleware, checkoutController.createPayment);
router.post('/verify-payment', ...checkoutMiddleware, checkoutController.verifyPayment);
router.post('/cancel', ...checkoutMiddleware, checkoutController.cancelOrder);

module.exports = router;

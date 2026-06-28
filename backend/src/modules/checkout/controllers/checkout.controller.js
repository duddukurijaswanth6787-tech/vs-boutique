const { checkoutService, CommerceError } = require('../services/checkout.service');

class CheckoutController {
  async validateCart(req, res) {
    try {
      const data = await checkoutService.validateCheckoutCart(req.user.id);
      res.json({
        success: true,
        data
      });
    } catch (err) {
      const status = err instanceof CommerceError ? err.status : 500;
      res.status(status).json({ success: false, message: err.message, code: err.code });
    }
  }

  async createOrder(req, res) {
    try {
      const { shippingAddressId, customerNote } = req.body;
      const order = await checkoutService.createOrder(req.user.id, shippingAddressId, customerNote);
      res.status(201).json({ success: true, data: order });
    } catch (err) {
      const status = err instanceof CommerceError ? err.status : 500;
      res.status(status).json({ success: false, message: err.message, code: err.code });
    }
  }

  async createPayment(req, res) {
    try {
      const { orderId } = req.body;
      const data = await checkoutService.createPayment(req.user.id, orderId);
      res.json({
        success: true,
        data
      });
    } catch (err) {
      const status = err instanceof CommerceError ? err.status : 500;
      res.status(status).json({ success: false, message: err.message, code: err.code });
    }
  }

  async verifyPayment(req, res) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
      const result = await checkoutService.verifyPayment(
        req.user.id,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        orderId
      );
      res.json(result);
    } catch (err) {
      const status = err instanceof CommerceError ? err.status : 500;
      res.status(status).json({ success: false, message: err.message, code: err.code });
    }
  }

  async cancelOrder(req, res) {
    try {
      const { orderId, reason } = req.body;
      const result = await checkoutService.cancelCheckoutOrder(req.user.id, orderId, reason);
      res.json(result);
    } catch (err) {
      const status = err instanceof CommerceError ? err.status : 500;
      res.status(status).json({ success: false, message: err.message, code: err.code });
    }
  }
}

module.exports = new CheckoutController();

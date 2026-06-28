const { commerceService, CommerceError } = require('../services/commerce.service');

class CommerceController {
  handleError(err, res) {
    const status = err instanceof CommerceError ? err.status : (err.status || 500);
    return res.status(status).json({
      success: false,
      message: err.message,
      code: err.code
    });
  }

  // ── Customer Handlers ────────────────────────────────────────────────
  getCustomerOrders = async (req, res) => {
    try {
      const orders = await commerceService.getCustomerOrders(req.user.id);
      return res.json({ success: true, data: orders });
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  getCustomerOrderById = async (req, res) => {
    try {
      const order = await commerceService.getCustomerOrderById(req.params.id, req.user.id);
      return res.json({ success: true, data: order });
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  cancelCustomerOrder = async (req, res) => {
    try {
      await commerceService.cancelCustomerOrder(req.params.id, req.body.reason, req.user.id);
      return res.json({ success: true, message: 'Order cancelled' });
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  getOrderTimeline = async (req, res) => {
    try {
      const histories = await commerceService.getOrderTimeline(req.params.id, req.user);
      return res.json({ success: true, data: histories });
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  // ── Owner Handlers ───────────────────────────────────────────────────
  getOwnerOrders = async (req, res) => {
    try {
      const orders = await commerceService.getOwnerOrders(req.user);
      return res.json({ success: true, data: orders });
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  getOwnerOrderById = async (req, res) => {
    try {
      const order = await commerceService.getOwnerOrderById(req.params.id, req.user);
      return res.json({ success: true, data: order });
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  confirmOwnerOrder = async (req, res) => {
    try {
      const updated = await commerceService.updateOrderStatus(req.params.id, 'CONFIRMED', 'Order confirmed by boutique', req.body, req.user);
      return res.json({ success: true, data: updated, message: 'Order confirmed' });
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  packOwnerOrder = async (req, res) => {
    try {
      const updated = await commerceService.updateOrderStatus(req.params.id, 'PACKED', 'Order packed', req.body, req.user);
      return res.json({ success: true, data: updated, message: 'Order packed' });
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  shipOwnerOrder = async (req, res) => {
    try {
      const updated = await commerceService.updateOrderStatus(req.params.id, 'SHIPPED', 'Order shipped', req.body, req.user);
      return res.json({ success: true, data: updated, message: 'Order shipped' });
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  outForDeliveryOwnerOrder = async (req, res) => {
    try {
      const updated = await commerceService.updateOrderStatus(req.params.id, 'OUT_FOR_DELIVERY', 'Order out for delivery', req.body, req.user);
      return res.json({ success: true, data: updated, message: 'Order out_for_delivery' });
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  deliverOwnerOrder = async (req, res) => {
    try {
      const updated = await commerceService.updateOrderStatus(req.params.id, 'DELIVERED', 'Order delivered', req.body, req.user);
      return res.json({ success: true, data: updated, message: 'Order delivered' });
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  cancelOwnerOrder = async (req, res) => {
    try {
      const updated = await commerceService.updateOrderStatus(req.params.id, 'CANCELLED', 'Order cancelled by boutique', req.body, req.user);
      return res.json({ success: true, data: updated, message: 'Order cancelled' });
    } catch (err) {
      return this.handleError(err, res);
    }
  };
}

module.exports = new CommerceController();

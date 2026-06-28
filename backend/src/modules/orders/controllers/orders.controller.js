const ordersService = require('../services/orders.service');

class OrdersController {
  // ── Owner / Admin Tailoring Orders ──────────────────────────────────
  getOrdersList = async (req, res) => {
    try {
      const orders = await ordersService.getOrdersList(req.user);
      return res.json(orders);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  };

  getOrderById = async (req, res) => {
    try {
      const order = await ordersService.getOrderById(req.params.id, req.user);
      return res.json(order);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  };

  createOrder = async (req, res) => {
    try {
      const order = await ordersService.createOrder(req.body, req.user);
      return res.status(201).json(order);
    } catch (err) {
      return res.status(err.status || 400).json({ message: err.message });
    }
  };

  updateOrderStatus = async (req, res) => {
    try {
      const order = await ordersService.updateOrderStatus(req.params.id, req.body, req.user);
      return res.json(order);
    } catch (err) {
      return res.status(err.status || 400).json({ message: err.message });
    }
  };

  updateOrderPayment = async (req, res) => {
    try {
      const order = await ordersService.updateOrderPayment(req.params.id, req.body, req.user);
      return res.json(order);
    } catch (err) {
      return res.status(err.status || 400).json({ message: err.message });
    }
  };

  updateOrderMeasurements = async (req, res) => {
    try {
      const order = await ordersService.updateOrderMeasurements(req.params.id, req.body);
      return res.json(order);
    } catch (err) {
      return res.status(err.status || 400).json({ message: err.message });
    }
  };

  // ── Customer Tailoring Orders ───────────────────────────────────────
  getCustomerOrdersList = async (req, res) => {
    try {
      if (req.user.role !== 'customer') {
        return res.status(403).json({ message: 'Customer access required' });
      }
      const orders = await ordersService.getCustomerOrdersList(req.user.id);
      return res.json(orders);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  };

  getCustomerOrderById = async (req, res) => {
    try {
      if (req.user.role !== 'customer') {
        return res.status(403).json({ message: 'Customer access required' });
      }
      const order = await ordersService.getCustomerOrderById(req.params.id, req.user.id);
      return res.json(order);
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  };

  cancelCustomerOrder = async (req, res) => {
    try {
      if (req.user.role !== 'customer') {
        return res.status(403).json({ message: 'Customer access required' });
      }
      const order = await ordersService.cancelCustomerOrder(req.params.id, req.body.reason, req.user.id);
      return res.json({ message: 'Order cancelled successfully', order });
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message });
    }
  };
}

module.exports = new OrdersController();

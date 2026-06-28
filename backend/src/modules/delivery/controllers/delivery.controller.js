const prisma = require('../../../utils/prisma');
const { DeliveryService, DeliveryTrackingError, ReturnError, ExchangeError } = require('../services/delivery.service');

class DeliveryController {
  // --- Tracking ---
  async getTrackingForOwner(req, res) {
    try {
      const order = await prisma.commerceOrder.findUnique({
        where: { id: req.params.orderId }
      });
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

      const boutique = await prisma.boutique.findUnique({ where: { id: order.boutiqueId } });
      if (!boutique || (boutique.ownerId !== req.user.id && req.user.role !== 'super-admin')) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      const tracking = await DeliveryService.getTrackingWithHistory(null); // Wait, how do we get it by order?
      // Ah, in the service, we had: getOrderTracking(orderId) or getTrackingWithHistory(trackingId)
      // Let's call getTrackingWithHistory by fetching from repository first, or getOrderTracking.
      // Wait, in legacy, it fetched directly from database. We can query the repository tracking or use getOrderTracking.
      // Let's check:
      const trackingRecord = await prisma.deliveryTracking.findFirst({
        where: { orderId: order.id },
        include: { histories: { orderBy: { createdAt: 'asc' } } }
      });
      if (!trackingRecord) return res.status(404).json({ success: false, message: 'Tracking not found' });

      return res.json({ success: true, data: trackingRecord });
    } catch (err) {
      console.error('[DeliveryController.getTrackingForOwner]', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async createTracking(req, res) {
    try {
      const { courierName, trackingNumber, trackingUrl, expectedDeliveryDate } = req.body;

      if (!courierName || !trackingNumber) {
        return res.status(400).json({ success: false, message: 'courierName and trackingNumber are required' });
      }

      const order = await prisma.commerceOrder.findUnique({
        where: { id: req.params.orderId }
      });
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

      const boutique = await prisma.boutique.findUnique({ where: { id: order.boutiqueId } });
      if (!boutique || (boutique.ownerId !== req.user.id && req.user.role !== 'super-admin')) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      const tracking = await DeliveryService.createTracking(order.id, { courierName, trackingNumber, trackingUrl, expectedDeliveryDate });

      return res.status(201).json({ success: true, data: tracking, message: 'Shipment created' });
    } catch (err) {
      console.error('[DeliveryController.createTracking]', err);
      const status = err instanceof DeliveryTrackingError ? err.status : 500;
      return res.status(status).json({ success: false, message: err.message, code: err.code });
    }
  }

  async updateTrackingStatus(req, res) {
    try {
      const { status, note } = req.body;

      if (!status) {
        return res.status(400).json({ success: false, message: 'status is required' });
      }

      const order = await prisma.commerceOrder.findUnique({
        where: { id: req.params.orderId }
      });
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

      const boutique = await prisma.boutique.findUnique({ where: { id: order.boutiqueId } });
      if (!boutique || (boutique.ownerId !== req.user.id && req.user.role !== 'super-admin')) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      const tracking = await prisma.deliveryTracking.findFirst({ where: { orderId: order.id } });
      if (!tracking) return res.status(404).json({ success: false, message: 'Tracking not found. Create shipment first.' });

      const updated = await DeliveryService.updateStatus(tracking.id, status, note);

      return res.json({ success: true, data: updated, message: `Status updated to ${status}` });
    } catch (err) {
      console.error('[DeliveryController.updateTrackingStatus]', err);
      const s = err instanceof DeliveryTrackingError ? err.status : 500;
      return res.status(s).json({ success: false, message: err.message, code: err.code });
    }
  }

  async getOrderTrackingForCustomer(req, res) {
    try {
      const order = await prisma.commerceOrder.findUnique({
        where: { id: req.params.orderId }
      });
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

      if (order.userId !== req.user.id && req.user.role !== 'super-admin') {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      const tracking = await DeliveryService.getOrderTracking(order.id);
      if (!tracking) return res.status(404).json({ success: false, message: 'Tracking not found for this order' });

      return res.json({ success: true, data: tracking });
    } catch (err) {
      console.error('[DeliveryController.getOrderTrackingForCustomer]', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // --- Returns ---
  async createReturn(req, res) {
    try {
      const { orderId, orderItemId, reason, notes } = req.body;
      if (!orderId || !orderItemId || !reason) {
        return res.status(400).json({ success: false, message: 'orderId, orderItemId, and reason are required' });
      }
      const result = await DeliveryService.createReturn({ userId: req.user.id, orderId, orderItemId, reason, notes });
      return res.status(201).json({ success: true, data: result });
    } catch (err) {
      console.error('[DeliveryController.createReturn]', err);
      if (err instanceof ReturnError) {
        return res.status(err.status).json({ success: false, message: err.message, code: err.code });
      }
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getCustomerReturns(req, res) {
    try {
      const returns = await DeliveryService.getCustomerReturns(req.user.id);
      return res.json({ success: true, data: returns });
    } catch (err) {
      console.error('[DeliveryController.getCustomerReturns]', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getReturnById(req, res) {
    try {
      const ret = await DeliveryService.getReturnById(req.params.id, req.user.id);
      return res.json({ success: true, data: ret });
    } catch (err) {
      console.error('[DeliveryController.getReturnById]', err);
      if (err instanceof ReturnError) {
        return res.status(err.status).json({ success: false, message: err.message, code: err.code });
      }
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async updateReturnStatus(req, res) {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ success: false, message: 'status is required' });
      }
      const result = await DeliveryService.updateReturnStatus(req.params.id, status, req.user.assignedBoutiqueId);
      return res.json({ success: true, data: result });
    } catch (err) {
      console.error('[DeliveryController.updateReturnStatus]', err);
      if (err instanceof ReturnError) {
        return res.status(err.status).json({ success: false, message: err.message, code: err.code });
      }
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // --- Exchanges ---
  async createExchange(req, res) {
    try {
      const { orderId, orderItemId, reason, notes } = req.body;
      if (!orderId || !orderItemId || !reason) {
        return res.status(400).json({ success: false, message: 'orderId, orderItemId, and reason are required' });
      }
      const result = await DeliveryService.createExchange({ userId: req.user.id, orderId, orderItemId, reason, notes });
      return res.status(201).json({ success: true, data: result });
    } catch (err) {
      console.error('[DeliveryController.createExchange]', err);
      if (err instanceof ExchangeError) {
        return res.status(err.status).json({ success: false, message: err.message, code: err.code });
      }
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getCustomerExchanges(req, res) {
    try {
      const exchanges = await DeliveryService.getCustomerExchanges(req.user.id);
      return res.json({ success: true, data: exchanges });
    } catch (err) {
      console.error('[DeliveryController.getCustomerExchanges]', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getExchangeById(req, res) {
    try {
      const exc = await DeliveryService.getExchangeById(req.params.id, req.user.id);
      return res.json({ success: true, data: exc });
    } catch (err) {
      console.error('[DeliveryController.getExchangeById]', err);
      if (err instanceof ExchangeError) {
        return res.status(err.status).json({ success: false, message: err.message, code: err.code });
      }
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async updateExchangeStatus(req, res) {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ success: false, message: 'status is required' });
      }
      const result = await DeliveryService.updateExchangeStatus(req.params.id, status, req.user.assignedBoutiqueId);
      return res.json({ success: true, data: result });
    } catch (err) {
      console.error('[DeliveryController.updateExchangeStatus]', err);
      if (err instanceof ExchangeError) {
        return res.status(err.status).json({ success: false, message: err.message, code: err.code });
      }
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new DeliveryController();

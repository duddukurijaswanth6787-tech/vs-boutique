const { eventBus, Events } = require('../../../services/eventBus');
const repository = require('../repositories/delivery.repository');

// Exceptions
class DeliveryTrackingError extends Error {
  constructor(message, code = 'TRACKING_ERROR', status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

class ReturnError extends Error {
  constructor(message, status = 400, code = 'RETURN_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

class ExchangeError extends Error {
  constructor(message, status = 400, code = 'EXCHANGE_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// Constants
const VALID_TRACKING_STATUSES = ['PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'RETURNED'];

const VALID_TRACKING_TRANSITIONS = {
  PACKED: ['SHIPPED', 'FAILED'],
  SHIPPED: ['OUT_FOR_DELIVERY', 'FAILED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'FAILED'],
  DELIVERED: ['RETURNED'],
  FAILED: ['RETURNED'],
  RETURNED: []
};

const TIMELINE_LABELS = {
  PACKED: 'Order Packed',
  SHIPPED: 'Order Shipped',
  OUT_FOR_DELIVERY: 'Out For Delivery',
  DELIVERED: 'Delivered',
  FAILED: 'Delivery Failed',
  RETURNED: 'Returned'
};

const RETURN_WINDOW_DAYS = 7;
const EXCHANGE_WINDOW_DAYS = 7;

const VALID_RETURN_TRANSITIONS = {
  REQUESTED: ['UNDER_REVIEW', 'REJECTED'],
  UNDER_REVIEW: ['APPROVED', 'REJECTED'],
  APPROVED: ['PICKUP_SCHEDULED', 'REJECTED'],
  PICKUP_SCHEDULED: ['RECEIVED'],
  RECEIVED: ['REFUNDED'],
  REFUNDED: ['COMPLETED'],
  REJECTED: [],
  COMPLETED: [],
};

const VALID_EXCHANGE_TRANSITIONS = {
  REQUESTED: ['UNDER_REVIEW', 'REJECTED'],
  UNDER_REVIEW: ['APPROVED', 'REJECTED'],
  APPROVED: ['PROCESSING', 'REJECTED'],
  PROCESSING: ['SHIPPED'],
  SHIPPED: ['COMPLETED'],
  REJECTED: [],
  COMPLETED: [],
};

class DeliveryService {
  // --- Tracking helper ---
  canTransition(current, target) {
    if (!current) return VALID_TRACKING_STATUSES.includes(target);
    const allowed = VALID_TRACKING_TRANSITIONS[current];
    return allowed && allowed.includes(target);
  }

  async createTracking(orderId, data) {
    if (!data.courierName || !data.trackingNumber) {
      throw new DeliveryTrackingError('courierName and trackingNumber are required', 'VALIDATION_ERROR', 400);
    }

    const order = await repository.findOrderById(orderId);
    if (!order) throw new DeliveryTrackingError('Order not found', 'NOT_FOUND', 404);
    if (order.status === 'DELIVERED' || order.status === 'CANCELLED' || order.status === 'RETURNED') {
      throw new DeliveryTrackingError('Cannot create tracking for a completed order', 'INVALID_ORDER', 400);
    }

    const existing = await repository.findTrackingByOrderId(orderId);
    if (existing) throw new DeliveryTrackingError('Tracking already exists for this order', 'TRACKING_EXISTS', 409);

    const initialStatus = 'PACKED';

    const trackingData = {
      orderId,
      carrier: data.courierName,
      trackingNumber: data.trackingNumber,
      trackingUrl: data.trackingUrl || null,
      status: initialStatus,
      estimatedDelivery: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : null
    };

    const historyData = {
      fromStatus: null,
      toStatus: initialStatus,
      note: 'Shipment created'
    };

    const tracking = await repository.createTracking(trackingData, historyData);
    return this.getTrackingWithHistory(tracking.id);
  }

  async updateStatus(trackingId, status, note) {
    if (!VALID_TRACKING_STATUSES.includes(status)) {
      throw new DeliveryTrackingError(`Invalid status "${status}". Valid: ${VALID_TRACKING_STATUSES.join(', ')}`, 'INVALID_STATUS', 400);
    }

    const tracking = await repository.findTrackingById(trackingId);
    if (!tracking) throw new DeliveryTrackingError('Tracking not found', 'NOT_FOUND', 404);

    if (!this.canTransition(tracking.status, status)) {
      throw new DeliveryTrackingError(
        `Cannot transition from ${tracking.status} to ${status}`,
        'INVALID_TRANSITION',
        400
      );
    }

    const updateData = { status };
    if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
    }

    const historyNote = note || TIMELINE_LABELS[status] || status;
    const historyData = {
      fromStatus: tracking.status,
      toStatus: status,
      note: historyNote
    };

    let onDelivered = null;
    if (status === 'DELIVERED') {
      onDelivered = async (tx) => {
        await this.updateProductAnalytics(tx, tracking.orderId);
      };
    }

    await repository.updateTrackingStatus(tracking.id, updateData, historyData, onDelivered);
    return this.getTrackingWithHistory(tracking.id);
  }

  async updateProductAnalytics(tx, orderId) {
    const order = await tx.commerceOrder.findUnique({
      where: { id: orderId },
      include: { items: true }
    });
    if (!order) return;

    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    for (const item of order.items) {
      await tx.productAnalytics.upsert({
        where: {
          productId_periodStart_periodEnd: {
            productId: item.productId,
            periodStart,
            periodEnd
          }
        },
        create: {
          productId: item.productId,
          periodStart,
          periodEnd,
          orderCount: 1,
          revenue: Number(item.totalPrice)
        },
        update: {
          orderCount: { increment: 1 },
          revenue: { increment: Number(item.totalPrice) }
        }
      });
    }
  }

  async getTrackingWithHistory(trackingId) {
    return repository.findTrackingById(trackingId);
  }

  async getOrderTracking(orderId) {
    const tracking = await repository.findTrackingByOrderId(orderId);
    if (!tracking) return null;

    return {
      currentStatus: tracking.status,
      courierName: tracking.carrier,
      trackingNumber: tracking.trackingNumber,
      trackingUrl: tracking.trackingUrl,
      expectedDeliveryDate: tracking.estimatedDelivery,
      deliveredAt: tracking.deliveredAt,
      timeline: tracking.histories.map(h => ({
        status: h.toStatus,
        timestamp: h.createdAt,
        note: h.note
      }))
    };
  }

  // --- Returns Logic ---
  async generateReturnNumber(tx) {
    const today = new Date().toISOString().slice(0, 10);
    const seq = await tx.orderSequence.upsert({
      where: { date: today },
      create: { date: today, lastNumber: 1 },
      update: { lastNumber: { increment: 1 } }
    });
    return `RET-${today.replace(/-/g, '')}-${String(seq.lastNumber).padStart(4, '0')}`;
  }

  async checkReturnEligibility(userId, orderId, orderItemId) {
    const order = await repository.findOrderById(orderId, { items: { where: { id: orderItemId } } });

    if (!order) throw new ReturnError('Order not found', 404, 'ORDER_NOT_FOUND');
    if (order.userId !== userId) throw new ReturnError('Access denied', 403, 'ACCESS_DENIED');
    if (order.status !== 'DELIVERED') throw new ReturnError('Return is only allowed for delivered orders', 400, 'NOT_DELIVERED');
    if (!order.deliveredAt) throw new ReturnError('Delivery date not recorded', 400, 'NO_DELIVERY_DATE');

    const daysSinceDelivery = Math.floor((Date.now() - new Date(order.deliveredAt).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceDelivery > RETURN_WINDOW_DAYS) {
      throw new ReturnError(`Return window is ${RETURN_WINDOW_DAYS} days from delivery. This order was delivered ${daysSinceDelivery} days ago.`, 400, 'RETURN_WINDOW_EXPIRED');
    }

    if (order.items.length === 0) throw new ReturnError('Order item not found', 404, 'ITEM_NOT_FOUND');

    const existing = await repository.findReturnByOrderItemIdAndCustomer(orderItemId, userId);
    if (existing) throw new ReturnError('A return request already exists for this item', 409, 'DUPLICATE_REQUEST');
  }

  async createReturn({ userId, orderId, orderItemId, reason, notes }) {
    await this.checkReturnEligibility(userId, orderId, orderItemId);

    const returnDataBuilder = async (tx) => {
      const returnNumber = await this.generateReturnNumber(tx);
      const item = await tx.commerceOrderItem.findUnique({ where: { id: orderItemId } });
      return {
        returnNumber,
        orderId,
        orderItemId,
        customerId: userId,
        reason,
        notes: notes || null,
        refundAmount: item ? item.totalPrice : undefined,
        status: 'REQUESTED'
      };
    };

    // Execute transaction in repository
    const result = await prisma.$transaction(async (tx) => {
      const returnData = await returnDataBuilder(tx);
      const returnReq = await tx.returnRequest.create({
        data: returnData,
        include: {
          order: { include: { items: true } },
          orderItem: true
        }
      });

      await tx.commerceOrderHistory.create({
        data: {
          orderId,
          fromStatus: 'DELIVERED',
          toStatus: 'DELIVERED',
          note: `Return requested: ${returnData.returnNumber} - ${reason}`,
          changedBy: 'customer',
          changedById: userId
        }
      });

      return returnReq;
    });

    // Notify Customer & Owner
    const returnOrder = await repository.findOrderById(orderId);
    const returnBoutique = returnOrder ? await repository.findBoutiqueById(returnOrder.boutiqueId) : null;
    eventBus.emit(Events.RETURN_REQUESTED, { userId, returnReq: result, boutique: returnBoutique });

    return result;
  }

  async getCustomerReturns(userId) {
    return repository.findReturnsByCustomerId(userId);
  }

  async getReturnById(returnId, userId) {
    const ret = await repository.findReturnById(returnId, {
      orderItem: true,
      order: { include: { items: true } }
    });
    if (!ret) throw new ReturnError('Return request not found', 404, 'NOT_FOUND');
    if (ret.customerId !== userId) throw new ReturnError('Access denied', 403, 'ACCESS_DENIED');
    return ret;
  }

  async processRefund(tx, returnReq) {
    const payment = await tx.commercePayment.findFirst({
      where: { commerceOrderId: returnReq.orderId, status: 'PAID' }
    });
    if (payment) {
      await tx.commercePayment.update({
        where: { id: payment.id },
        data: {
          status: 'REFUNDED',
          refundId: returnReq.returnNumber,
          refundAmount: returnReq.refundAmount || payment.amount,
          refundReason: `Return ${returnReq.returnNumber}: ${returnReq.reason}`
        }
      });
    }

    const allReturns = await tx.returnRequest.findMany({
      where: { orderId: returnReq.orderId, status: { notIn: ['REJECTED'] } }
    });
    const allItems = await tx.commerceOrderItem.findMany({
      where: { orderId: returnReq.orderId }
    });

    const allItemsReturned = allItems.length <= allReturns.length;

    await tx.commerceOrder.update({
      where: { id: returnReq.orderId },
      data: {
        ...(allItemsReturned ? { status: 'REFUNDED' } : {}),
        refundAmount: returnReq.refundAmount || undefined,
        refundedAt: new Date()
      }
    });
  }

  async updateReturnStatus(returnId, newStatus, boutiqueId) {
    const ret = await repository.findReturnById(returnId, {
      order: { select: { boutiqueId: true, id: true, status: true, deliveredAt: true } }
    });
    if (!ret) throw new ReturnError('Return request not found', 404, 'NOT_FOUND');
    if (ret.order.boutiqueId !== boutiqueId) throw new ReturnError('Access denied', 403, 'ACCESS_DENIED');

    const allowed = VALID_RETURN_TRANSITIONS[ret.status];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new ReturnError(`Cannot transition from ${ret.status} to ${newStatus}`, 400, 'INVALID_TRANSITION');
    }

    const updateData = { status: newStatus };
    if (newStatus === 'APPROVED') updateData.approvedAt = new Date();
    if (newStatus === 'REJECTED') updateData.rejectedAt = new Date();
    if (newStatus === 'COMPLETED') updateData.completedAt = new Date();

    const historyData = {
      orderId: ret.order.id,
      fromStatus: ret.status,
      toStatus: newStatus,
      note: `Return ${ret.returnNumber}: status changed to ${newStatus}`,
      changedBy: 'owner'
    };

    let onRefunded = null;
    if (newStatus === 'REFUNDED') {
      onRefunded = async (tx, result) => {
        await this.processRefund(tx, result);
      };
    }

    const updated = await repository.updateReturnRequest(returnId, updateData, historyData, onRefunded);

    if (newStatus === 'APPROVED' || newStatus === 'REJECTED') {
      const rBoutique = await repository.findBoutiqueById(ret.order.boutiqueId);
      eventBus.emit(Events.RETURN_STATUS_CHANGED, { customerId: ret.customerId, returnReq: ret, newStatus, boutique: rBoutique });
    }

    return updated;
  }

  // --- Exchanges Logic ---
  async generateExchangeNumber(tx) {
    const today = new Date().toISOString().slice(0, 10);
    const seq = await tx.orderSequence.upsert({
      where: { date: today },
      create: { date: today, lastNumber: 1 },
      update: { lastNumber: { increment: 1 } }
    });
    return `EXC-${today.replace(/-/g, '')}-${String(seq.lastNumber).padStart(4, '0')}`;
  }

  async checkExchangeEligibility(userId, orderId, orderItemId) {
    const order = await repository.findOrderById(orderId, { items: { where: { id: orderItemId } } });

    if (!order) throw new ExchangeError('Order not found', 404, 'ORDER_NOT_FOUND');
    if (order.userId !== userId) throw new ExchangeError('Access denied', 403, 'ACCESS_DENIED');
    if (order.status !== 'DELIVERED') throw new ExchangeError('Exchange is only allowed for delivered orders', 400, 'NOT_DELIVERED');
    if (!order.deliveredAt) throw new ExchangeError('Delivery date not recorded', 400, 'NO_DELIVERY_DATE');

    const daysSinceDelivery = Math.floor((Date.now() - new Date(order.deliveredAt).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceDelivery > EXCHANGE_WINDOW_DAYS) {
      throw new ExchangeError(`Exchange window is ${EXCHANGE_WINDOW_DAYS} days from delivery. This order was delivered ${daysSinceDelivery} days ago.`, 400, 'EXCHANGE_WINDOW_EXPIRED');
    }

    if (order.items.length === 0) throw new ExchangeError('Order item not found', 404, 'ITEM_NOT_FOUND');

    const existing = await repository.findExchangeByOrderItemIdAndCustomer(orderItemId, userId);
    if (existing) throw new ExchangeError('An exchange request already exists for this item', 409, 'DUPLICATE_REQUEST');
  }

  async createExchange({ userId, orderId, orderItemId, reason, notes }) {
    await this.checkExchangeEligibility(userId, orderId, orderItemId);

    const exchangeDataBuilder = async (tx) => {
      const exchangeNumber = await this.generateExchangeNumber(tx);
      return {
        exchangeNumber,
        orderId,
        orderItemId,
        customerId: userId,
        reason,
        notes: notes || null,
        status: 'REQUESTED'
      };
    };

    const result = await prisma.$transaction(async (tx) => {
      const exchangeData = await exchangeDataBuilder(tx);
      const exchangeReq = await tx.exchangeRequest.create({
        data: exchangeData,
        include: {
          order: { include: { items: true } },
          orderItem: true
        }
      });

      await tx.commerceOrderHistory.create({
        data: {
          orderId,
          fromStatus: 'DELIVERED',
          toStatus: 'DELIVERED',
          note: `Exchange requested: ${exchangeData.exchangeNumber} - ${reason}`,
          changedBy: 'customer',
          changedById: userId
        }
      });

      return exchangeReq;
    });

    // Notify Customer & Owner
    const excOrder = await repository.findOrderById(orderId);
    const excBoutique = excOrder ? await repository.findBoutiqueById(excOrder.boutiqueId) : null;
    eventBus.emit(Events.EXCHANGE_REQUESTED, { userId, exchange: result, boutique: excBoutique });

    return result;
  }

  async getCustomerExchanges(userId) {
    return repository.findExchangesByCustomerId(userId);
  }

  async getExchangeById(exchangeId, userId) {
    const exc = await repository.findExchangeById(exchangeId, {
      orderItem: true,
      order: { include: { items: true } }
    });
    if (!exc) throw new ExchangeError('Exchange request not found', 404, 'NOT_FOUND');
    if (exc.customerId !== userId) throw new ExchangeError('Access denied', 403, 'ACCESS_DENIED');
    return exc;
  }

  async updateExchangeStatus(exchangeId, newStatus, boutiqueId) {
    const exc = await repository.findExchangeById(exchangeId, {
      order: { select: { boutiqueId: true, id: true } }
    });
    if (!exc) throw new ExchangeError('Exchange request not found', 404, 'NOT_FOUND');
    if (exc.order.boutiqueId !== boutiqueId) throw new ExchangeError('Access denied', 403, 'ACCESS_DENIED');

    const allowed = VALID_EXCHANGE_TRANSITIONS[exc.status];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new ExchangeError(`Cannot transition from ${exc.status} to ${newStatus}`, 400, 'INVALID_TRANSITION');
    }

    const updateData = { status: newStatus };
    if (newStatus === 'APPROVED') updateData.approvedAt = new Date();
    if (newStatus === 'COMPLETED') updateData.completedAt = new Date();

    const historyData = {
      orderId: exc.order.id,
      fromStatus: exc.status,
      toStatus: newStatus,
      note: `Exchange ${exc.exchangeNumber}: status changed to ${newStatus}`,
      changedBy: 'owner'
    };

    const updated = await repository.updateExchangeRequest(exchangeId, updateData, historyData);

    if (newStatus === 'APPROVED' || newStatus === 'SHIPPED') {
      const eBoutique = await repository.findBoutiqueById(exc.order.boutiqueId);
      eventBus.emit(Events.EXCHANGE_STATUS_CHANGED, { customerId: exc.customerId, exchange: exc, newStatus, boutique: eBoutique });
    }

    return updated;
  }
}

module.exports = {
  DeliveryService: new DeliveryService(),
  DeliveryTrackingError,
  ReturnError,
  ExchangeError,
  VALID_TRACKING_STATUSES,
  VALID_TRACKING_TRANSITIONS
};

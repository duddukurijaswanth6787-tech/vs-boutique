const commerceRepository = require('../repositories/commerce.repository');
const prisma = require('../../../utils/prisma');
const { notificationsService } = require('../../notifications/services/notifications.service');

class CommerceError extends Error {
  constructor(message, code = 'COMMERCE_ERROR', status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

class CommerceService {
  parseDecimal(val) {
    if (val === null || val === undefined) return 0;
    return typeof val === 'number' ? val : parseFloat(val.toString().replace(/[^0-9.-]/g, '')) || 0;
  }

  // ── Low-Level Services ──────────────────────────────────────────────
  async generateOrderNumber(tx = prisma) {
    const today = new Date().toISOString().slice(0, 10);
    const seq = await commerceRepository.upsertOrderSequence(today, tx);
    return `ORD-${today.replace(/-/g, '')}-${String(seq.lastNumber).padStart(4, '0')}`;
  }

  async reserveInventory(tx, variantId, quantity) {
    const inventory = await commerceRepository.findInventoryByVariantId(variantId, tx);
    if (!inventory || !inventory.trackInventory) return;

    const available = inventory.quantity - inventory.reservedQuantity;
    if (available < quantity) {
      throw new CommerceError(
        `Insufficient stock. Available: ${Math.max(0, available)}, Requested: ${quantity}`,
        'INSUFFICIENT_STOCK',
        409
      );
    }

    const result = await commerceRepository.updateInventoryMany({
      variantId,
      version: inventory.version
    }, {
      reservedQuantity: { increment: quantity },
      version: { increment: 1 }
    }, tx);

    if (result.count === 0) {
      throw new CommerceError(
        'Stock reservation conflict — please retry',
        'RESERVATION_CONFLICT',
        409
      );
    }
  }

  async releaseInventory(tx, variantId, quantity) {
    const inventory = await commerceRepository.findInventoryByVariantId(variantId, tx);
    if (!inventory || !inventory.trackInventory) return;

    const result = await commerceRepository.updateInventoryMany({
      variantId,
      version: inventory.version
    }, {
      reservedQuantity: { decrement: Math.min(quantity, inventory.reservedQuantity) },
      version: { increment: 1 }
    }, tx);

    if (result.count === 0) {
      throw new CommerceError(
        'Stock release conflict — please retry',
        'RELEASE_CONFLICT',
        409
      );
    }
  }

  async deductInventory(tx, variantId, quantity) {
    const inventory = await commerceRepository.findInventoryByVariantId(variantId, tx);
    if (!inventory || !inventory.trackInventory) return;

    const result = await commerceRepository.updateInventoryMany({
      variantId,
      version: inventory.version,
      quantity: { gte: quantity },
      reservedQuantity: { gte: quantity }
    }, {
      quantity: { decrement: quantity },
      reservedQuantity: { decrement: quantity },
      version: { increment: 1 }
    }, tx);

    if (result.count === 0) {
      throw new CommerceError(
        'Inventory deduction conflict — please retry',
        'DEDUCTION_CONFLICT',
        409
      );
    }
  }

  async createOrderHistory(tx, orderId, fromStatus, toStatus, note, changedBy, changedById) {
    return commerceRepository.createOrderHistory({
      orderId,
      fromStatus: fromStatus || null,
      toStatus,
      note: note || null,
      changedBy: changedBy || 'system',
      changedById: changedById || null
    }, tx);
  }

  async createPayment(tx, commerceOrderId, amount, method, razorpayOrderId) {
    return commerceRepository.createPayment({
      commerceOrderId,
      amount: this.parseDecimal(amount),
      method: method || null,
      status: 'PENDING',
      razorpayOrderId: razorpayOrderId || null
    }, tx);
  }

  async failPayment(tx, orderId, reason) {
    await tx.commerceOrder.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'FAILED',
        status: 'CANCELLED',
        cancellationReason: reason || 'Payment failed',
        cancelledAt: new Date()
      }
    });

    const items = await commerceRepository.findOrderItems({ orderId }, { variantId: true, quantity: true }, tx);

    await Promise.all(
      items
        .filter(item => item.variantId)
        .map(item => this.releaseInventory(tx, item.variantId, item.quantity))
    );

    await this.createOrderHistory(tx, orderId, 'PENDING', 'CANCELLED', reason || 'Payment failed — inventory released', 'system');
  }

  // ── High-Level Customer Services ────────────────────────────────────
  async getCustomerOrders(userId) {
    return commerceRepository.findOrders({ userId }, {
      items: true,
      shippingAddress: true,
      payments: true
    }, { createdAt: 'desc' });
  }

  async getCustomerOrderById(id, userId) {
    const order = await commerceRepository.findOrderUnique(id, {
      items: true,
      shippingAddress: true,
      payments: true,
      histories: { orderBy: { createdAt: 'asc' } }
    });
    if (!order) {
      throw { status: 404, message: 'Order not found' };
    }
    if (order.userId !== userId) {
      throw { status: 403, message: 'Access denied' };
    }
    return order;
  }

  async cancelCustomerOrder(id, reason, userId) {
    const order = await commerceRepository.findOrderUnique(id, { items: true });
    if (!order) {
      throw { status: 404, message: 'Order not found' };
    }
    if (order.userId !== userId) {
      throw { status: 403, message: 'Access denied' };
    }
    if (['DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED'].includes(order.status)) {
      throw { status: 400, message: `Order cannot be cancelled in ${order.status} state` };
    }

    await prisma.$transaction(async (tx) => {
      await tx.commerceOrder.update({
        where: { id: order.id },
        data: {
          status: 'CANCELLED',
          cancellationReason: reason || 'Cancelled by customer',
          cancelledAt: new Date()
        }
      });

      for (const item of order.items) {
        if (item.variantId) {
          await this.releaseInventory(tx, item.variantId, item.quantity);
        }
      }

      await this.createOrderHistory(tx, order.id, order.status, 'CANCELLED', reason || 'Cancelled by customer', 'customer', userId);
    });
  }

  async getOrderTimeline(id, user) {
    const order = await commerceRepository.findOrderUnique(id);
    if (!order) {
      throw { status: 404, message: 'Order not found' };
    }

    const isOwner = user.role === 'owner' || user.role === 'super-admin';
    const isCustomer = order.userId === user.id;
    if (!isOwner && !isCustomer) {
      throw { status: 403, message: 'Access denied' };
    }

    return prisma.commerceOrderHistory.findMany({
      where: { orderId: id },
      orderBy: { createdAt: 'asc' }
    });
  }

  // ── High-Level Owner Services ───────────────────────────────────────
  async getOwnerOrders(user) {
    let boutiqueIds = [];

    if (user.role === 'super-admin') {
      const boutiques = await prisma.boutique.findMany({ select: { id: true } });
      boutiqueIds = boutiques.map(b => b.id);
    } else {
      const boutique = await prisma.boutique.findUnique({
        where: { ownerId: user.id }
      });
      if (!boutique) {
        throw { status: 400, message: 'No boutique assigned' };
      }
      boutiqueIds = [boutique.id];
    }

    return commerceRepository.findOrders({ boutiqueId: { in: boutiqueIds } }, {
      items: true,
      user: { select: { id: true, name: true, phone: true } }
    }, { createdAt: 'desc' });
  }

  async getOwnerOrderById(id, user) {
    const order = await commerceRepository.findOrderUnique(id, {
      items: true,
      user: { select: { id: true, name: true, phone: true } },
      shippingAddress: true,
      payments: true,
      histories: { orderBy: { createdAt: 'asc' } }
    });

    if (!order) {
      throw { status: 404, message: 'Order not found' };
    }

    const boutique = await prisma.boutique.findUnique({
      where: { id: order.boutiqueId }
    });
    if (!boutique || (boutique.ownerId !== user.id && user.role !== 'super-admin')) {
      throw { status: 403, message: 'Access denied' };
    }

    return order;
  }

  async updateOrderStatus(id, targetStatus, defaultNote, body, user) {
    const { note } = body;

    const order = await commerceRepository.findOrderUnique(id, { items: true });
    if (!order) {
      throw { status: 404, message: 'Order not found' };
    }

    const boutique = await prisma.boutique.findUnique({
      where: { id: order.boutiqueId }
    });
    if (!boutique || (boutique.ownerId !== user.id && user.role !== 'super-admin')) {
      throw { status: 403, message: 'Access denied' };
    }

    const VALID_TRANSITIONS = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PROCESSING', 'CANCELLED'],
      PROCESSING: ['PACKED', 'CANCELLED'],
      PACKED: ['SHIPPED', 'CANCELLED'],
      SHIPPED: ['OUT_FOR_DELIVERY', 'CANCELLED'],
      OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
      DELIVERED: [],
      CANCELLED: [],
      RETURNED: [],
      REFUNDED: []
    };

    const STATUS_TIMESTAMP_FIELD = {
      CONFIRMED: null,
      PROCESSING: null,
      PACKED: 'packedAt',
      SHIPPED: 'shippedAt',
      OUT_FOR_DELIVERY: 'outForDeliveryAt',
      DELIVERED: 'deliveredAt',
      CANCELLED: 'cancelledAt'
    };

    const allowed = VALID_TRANSITIONS[order.status];
    if (!allowed || !allowed.includes(targetStatus)) {
      throw { status: 400, message: `Cannot transition from ${order.status} to ${targetStatus}` };
    }

    const updateData = { status: targetStatus };
    const timestampField = STATUS_TIMESTAMP_FIELD[targetStatus] || null;
    if (timestampField) {
      updateData[timestampField] = new Date();
    }

    if (targetStatus === 'CANCELLED') {
      updateData.cancellationReason = note || defaultNote;
    }

    await prisma.$transaction(async (tx) => {
      await tx.commerceOrder.update({
        where: { id: order.id },
        data: updateData
      });

      if (targetStatus === 'CANCELLED') {
        for (const item of order.items) {
          if (item.variantId) {
            await this.releaseInventory(tx, item.variantId, item.quantity);
          }
        }
      }

      await this.createOrderHistory(tx, order.id, order.status, targetStatus, note || defaultNote, 'owner', user.id);
    });

    const updated = await commerceRepository.findOrderUnique(order.id, {
      items: true,
      user: { select: { id: true, name: true, phone: true } },
      shippingAddress: true,
      payments: true,
      histories: { orderBy: { createdAt: 'asc' } }
    });

    if (targetStatus === 'SHIPPED' || targetStatus === 'DELIVERED') {
      await notificationsService.createCustomerNotification({
        customerId: order.userId,
        type: targetStatus === 'SHIPPED' ? 'ORDER_SHIPPED' : 'ORDER_DELIVERED',
        title: targetStatus === 'SHIPPED' ? 'Order Shipped' : 'Order Delivered',
        message: targetStatus === 'SHIPPED'
          ? `Your order ${updated.orderId} has been shipped!`
          : `Your order ${updated.orderId} has been delivered. Thank you!`,
        entityType: 'commerce_order',
        entityId: updated.orderId,
      });
    }

    if (targetStatus === 'CANCELLED') {
      await notificationsService.createAdminNotification({
        recipientType: 'SUPER_ADMIN',
        recipientId: user.id,
        boutiqueId: order.boutiqueId,
        type: 'ORDER_CANCELLED',
        priority: 'HIGH',
        title: 'Order Cancelled',
        message: `Order ${updated.orderId} has been cancelled.`,
        entityType: 'commerce_order',
        entityId: updated.orderId,
      });
    }

    return updated;
  }
}

const commerceService = new CommerceService();
module.exports = {
  CommerceError,
  commerceService,
  generateOrderNumber: commerceService.generateOrderNumber.bind(commerceService),
  reserveInventory: commerceService.reserveInventory.bind(commerceService),
  releaseInventory: commerceService.releaseInventory.bind(commerceService),
  deductInventory: commerceService.deductInventory.bind(commerceService),
  createOrderHistory: commerceService.createOrderHistory.bind(commerceService),
  createPayment: commerceService.createPayment.bind(commerceService),
  failPayment: commerceService.failPayment.bind(commerceService)
};

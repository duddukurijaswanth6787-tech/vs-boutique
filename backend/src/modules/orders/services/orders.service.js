const ordersRepository = require('../repositories/orders.repository');
const prisma = require('../../../utils/prisma');
const { logAction } = require('../../../services/auditService');
const { validateSubscriptionLimit, withSubscriptionGuard } = require('../../../services/subscriptionService');

class OrdersService {
  parseDecimalVal(val) {
    if (val === null || val === undefined || val === '') return null;
    if (typeof val === 'number') return val;
    const parsed = parseFloat(val.toString().replace(/[^0-9.]/g, ''));
    return isNaN(parsed) ? null : parsed;
  }

  mapOrderResponse(order) {
    if (!order) return null;
    return {
      id: order.id,
      _id: order.id,
      orderId: order.orderId,
      boutiqueId: order.boutique 
        ? { _id: order.boutique.id, id: order.boutique.id, name: order.boutique.name }
        : order.boutiqueId,
      ownerId: order.ownerId,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress || '',
      designId: order.designId,
      designName: order.designName || '',
      category: order.category || 'Blouse',
      measurements: {
        bust: order.measurementBust !== null ? Number(order.measurementBust) : null,
        waist: order.measurementWaist !== null ? Number(order.measurementWaist) : null,
        hip: order.measurementHip !== null ? Number(order.measurementHip) : null,
        shoulder: order.measurementShoulder !== null ? Number(order.measurementShoulder) : null,
        sleeveLength: order.measurementSleeveLength !== null ? Number(order.measurementSleeveLength) : null,
        blouseLength: order.measurementBlouseLength !== null ? Number(order.measurementBlouseLength) : null,
        notes: order.measurementNotes || ''
      },
      pricing: {
        price: Number(order.price) || 0,
        advancePaid: Number(order.advancePaid) || 0,
        remainingAmount: Number(order.remainingAmount) || 0
      },
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      orderDate: order.orderDate,
      expectedDeliveryDate: order.expectedDeliveryDate,
      actualDeliveryDate: order.actualDeliveryDate,
      isDeleted: order.isDeleted,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      orderHistory: Array.isArray(order.orderHistories) 
        ? order.orderHistories.map(h => ({
            status: h.status,
            note: h.note || '',
            timestamp: h.timestamp
          }))
        : []
    };
  }

  // ── Owner / Admin Tailoring Orders ──────────────────────────────────
  async getOrdersList(user) {
    let where = { isDeleted: false };
    if (user.role === 'owner') {
      where.boutiqueId = user.assignedBoutiqueId;
    }

    const orders = await ordersRepository.findMany(where, {
      boutique: { select: { id: true, name: true } },
      orderHistories: { orderBy: { timestamp: 'asc' } }
    }, { createdAt: 'desc' });

    return orders.map(o => this.mapOrderResponse(o));
  }

  async getOrderById(id, user) {
    const order = await ordersRepository.findUnique(id, {
      boutique: { select: { id: true, name: true } },
      orderHistories: { orderBy: { timestamp: 'asc' } }
    });

    if (!order || order.isDeleted) {
      throw { status: 404, message: 'Order not found' };
    }

    if (user.role === 'owner' && order.boutiqueId !== user.assignedBoutiqueId) {
      throw { status: 403, message: 'Access denied' };
    }

    return this.mapOrderResponse(order);
  }

  async createOrder(body, user) {
    const { boutiqueId, customerName, customerMobile, customerPhone, category, designName, measurements, pricing, notes, expectedDeliveryDate } = body;
    
    const targetBoutiqueId = user.assignedBoutiqueId || boutiqueId;
    if (!targetBoutiqueId) {
      throw { status: 400, message: 'Boutique ID is required' };
    }

    // Validate subscription limits
    await validateSubscriptionLimit(targetBoutiqueId, 'canCreateCustomOrders');

    const savedOrder = await withSubscriptionGuard(targetBoutiqueId, 'orders', async (tx) => {
      const measurementData = measurements || {};
      const pricingData = pricing || {};
      
      const price = this.parseDecimalVal(pricingData.price) || 0;
      const advancePaid = this.parseDecimalVal(pricingData.advancePaid) || 0;
      const remainingAmount = price - advancePaid;

      const nextval = await ordersRepository.getNextVal(tx);
      const orderId = `ORD-${Date.now().toString().slice(-6)}-${nextval.toString().padStart(3, '0')}`;

      return await ordersRepository.create({
        orderId,
        boutiqueId: targetBoutiqueId,
        ownerId: user.id,
        customerName: customerName || 'Walk-in Customer',
        customerPhone: customerPhone || customerMobile || '',
        customerAddress: body.customerAddress || '',
        designId: body.designId || null,
        designName: designName || '',
        category: category || 'Blouse',
        
        measurementBust: this.parseDecimalVal(measurementData.bust),
        measurementWaist: this.parseDecimalVal(measurementData.waist),
        measurementHip: this.parseDecimalVal(measurementData.hip),
        measurementShoulder: this.parseDecimalVal(measurementData.shoulder),
        measurementSleeveLength: this.parseDecimalVal(measurementData.sleeveLength),
        measurementBlouseLength: this.parseDecimalVal(measurementData.blouseLength),
        measurementNotes: measurementData.notes || notes || '',

        price,
        advancePaid,
        remainingAmount,
        orderStatus: 'pending',
        paymentStatus: 'pending',
        expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
        
        orderHistories: {
          create: {
            status: 'pending',
            note: 'Order created'
          }
        }
      }, {
        boutique: { select: { id: true, name: true } },
        orderHistories: true
      }, tx);
    });

    await logAction('CREATE_ORDER', 'Order', savedOrder.id, user.id, { orderId: savedOrder.orderId });
    
    // Notify Admin
    await prisma.notification.create({
      data: {
        recipientRole: 'super_admin',
        boutiqueId: savedOrder.boutiqueId,
        title: 'New Order Placed',
        message: `A new order (${savedOrder.orderId}) has been placed for ${savedOrder.customerName}.`,
        type: 'ORDER_NEW',
        createdAt: new Date()
      }
    });

    return this.mapOrderResponse(savedOrder);
  }

  async updateOrderStatus(id, body, user) {
    const { status, note } = body;
    const order = await ordersRepository.findUnique(id);
    if (!order || order.isDeleted) {
      throw { status: 404, message: 'Order not found' };
    }

    const oldStatus = order.orderStatus;
    const actualDeliveryDate = status === 'delivered' ? new Date() : null;

    const updated = await ordersRepository.update(id, {
      orderStatus: status,
      actualDeliveryDate,
      orderHistories: {
        create: {
          status,
          note: note || `Status updated from ${oldStatus} to ${status}`
        }
      }
    }, {
      boutique: { select: { id: true, name: true } },
      orderHistories: { orderBy: { timestamp: 'asc' } }
    });

    await logAction('UPDATE_ORDER_STATUS', 'Order', order.id, user.id, { before: oldStatus, after: status });
    
    // Notify Owner
    await prisma.notification.create({
      data: {
        recipientRole: 'owner',
        recipientId: order.ownerId,
        boutiqueId: order.boutiqueId,
        title: 'Order Status Updated',
        message: `Order ${order.orderId} status changed to ${status}.`,
        type: 'ORDER_STATUS',
        createdAt: new Date()
      }
    });

    return this.mapOrderResponse(updated);
  }

  async updateOrderPayment(id, body, user) {
    const { paymentStatus, advancePaid, price } = body;
    const order = await ordersRepository.findUnique(id);
    if (!order || order.isDeleted) {
      throw { status: 404, message: 'Order not found' };
    }

    const finalPrice = price !== undefined ? (this.parseDecimalVal(price) || 0) : Number(order.price);
    const finalAdvance = advancePaid !== undefined ? (this.parseDecimalVal(advancePaid) || 0) : Number(order.advancePaid);
    const finalRemaining = finalPrice - finalAdvance;

    const updated = await ordersRepository.update(id, {
      paymentStatus: paymentStatus || undefined,
      price: price !== undefined ? finalPrice : undefined,
      advancePaid: advancePaid !== undefined ? finalAdvance : undefined,
      remainingAmount: finalRemaining
    }, {
      boutique: { select: { id: true, name: true } },
      orderHistories: { orderBy: { timestamp: 'asc' } }
    });

    await logAction('UPDATE_ORDER_PAYMENT', 'Order', order.id, user.id, { paymentStatus, advancePaid });
    
    return this.mapOrderResponse(updated);
  }

  async updateOrderMeasurements(id, body) {
    const { bust, waist, hip, shoulder, sleeveLength, blouseLength, notes } = body;
    const order = await ordersRepository.findUnique(id);
    if (!order || order.isDeleted) {
      throw { status: 404, message: 'Order not found' };
    }

    await validateSubscriptionLimit(order.boutiqueId, 'canUseCustomMeasurements');

    const updated = await ordersRepository.update(id, {
      measurementBust: bust !== undefined ? this.parseDecimalVal(bust) : undefined,
      measurementWaist: waist !== undefined ? this.parseDecimalVal(waist) : undefined,
      measurementHip: hip !== undefined ? this.parseDecimalVal(hip) : undefined,
      measurementShoulder: shoulder !== undefined ? this.parseDecimalVal(shoulder) : undefined,
      measurementSleeveLength: sleeveLength !== undefined ? this.parseDecimalVal(sleeveLength) : undefined,
      measurementBlouseLength: blouseLength !== undefined ? this.parseDecimalVal(blouseLength) : undefined,
      measurementNotes: notes !== undefined ? notes : undefined
    }, {
      boutique: { select: { id: true, name: true } },
      orderHistories: { orderBy: { timestamp: 'asc' } }
    });

    return this.mapOrderResponse(updated);
  }

  // ── Customer Tailoring Orders ───────────────────────────────────────
  async getCustomerOrdersList(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true }
    });
    if (!user) {
      throw { status: 404, message: 'User not found' };
    }

    const orders = await ordersRepository.findMany({
      customerPhone: user.phone,
      isDeleted: false
    }, {
      boutique: { select: { id: true, name: true, logoUrl: true, city: true } },
      design: { select: { id: true, name: true, images: true } },
      orderHistories: { orderBy: { timestamp: 'desc' }, take: 1 }
    }, { createdAt: 'desc' });

    return orders.map(o => this.mapOrderResponse(o));
  }

  async getCustomerOrderById(id, userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true }
    });
    if (!user) {
      throw { status: 404, message: 'User not found' };
    }

    try {
      const order = await ordersRepository.findFirst({
        id,
        customerPhone: user.phone,
        isDeleted: false
      }, {
        boutique: { select: { id: true, name: true, logoUrl: true, city: true, fullAddress: true, mobileNumber: true } },
        design: { select: { id: true, name: true, images: true, price: true } },
        orderHistories: { orderBy: { timestamp: 'desc' } },
        payments: true,
        reviews: true
      });

      if (!order) {
        throw { status: 404, message: 'Order not found' };
      }

      return this.mapOrderResponse(order);
    } catch (err) {
      if (err.code === 'P2023') {
        throw { status: 404, message: 'Order not found' };
      }
      throw err;
    }
  }

  async cancelCustomerOrder(id, reason, userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true }
    });
    if (!user) {
      throw { status: 404, message: 'User not found' };
    }

    try {
      const order = await ordersRepository.findFirst({
        id,
        customerPhone: user.phone,
        isDeleted: false,
        orderStatus: { in: ['pending', 'accepted'] }
      });

      if (!order) {
        throw { status: 404, message: 'Order not found or cannot be cancelled' };
      }

      const updated = await ordersRepository.update(order.id, {
        orderStatus: 'cancelled'
      });

      await ordersRepository.createHistory({
        orderId: order.id,
        status: 'cancelled',
        note: reason || 'Cancelled by customer'
      });

      return this.mapOrderResponse(updated);
    } catch (err) {
      if (err.code === 'P2023') {
        throw { status: 404, message: 'Order not found' };
      }
      throw err;
    }
  }
}

module.exports = new OrdersService();

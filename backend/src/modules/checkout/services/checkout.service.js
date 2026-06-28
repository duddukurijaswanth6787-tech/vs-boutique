const Razorpay = require('razorpay');
const crypto = require('crypto');
const checkoutRepository = require('../repositories/checkout.repository');
const commerceServiceModule = require('../../commerce/services/commerce.service');
const commerceService = commerceServiceModule.commerceService;
const CommerceError = commerceServiceModule.CommerceError;
const prisma = require('../../../utils/prisma');
const { notificationsService } = require('../../notifications/services/notifications.service');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
});

class CheckoutService {
  parseDecimal(val) {
    if (val === null || val === undefined) return 0;
    return typeof val === 'number' ? val : parseFloat(val.toString().replace(/[^0-9.-]/g, '')) || 0;
  }

  async validateCartItems(cart) {
    if (!cart || !cart.items || cart.items.length === 0) {
      throw new CommerceError('Cart is empty', 'EMPTY_CART', 400);
    }

    const items = [];
    let boutiqueId = null;

    for (const cartItem of cart.items) {
      const product = await prisma.product.findFirst({
        where: { id: cartItem.productId, isDeleted: false, status: 'ACTIVE' }
      });

      if (!product) {
        throw new CommerceError(`Product "${cartItem.productId}" not found or unavailable`, 'PRODUCT_UNAVAILABLE', 400);
      }

      if (!boutiqueId) boutiqueId = product.boutiqueId;

      let unitPrice = this.parseDecimal(product.basePrice);
      let variantName = null;
      let sku = null;
      let imageUrl = null;

      if (cartItem.variantId) {
        const variant = await prisma.productVariant.findFirst({
          where: { id: cartItem.variantId, productId: cartItem.productId, status: 'ACTIVE' }
        });
        if (!variant) {
          throw new CommerceError(`Variant not found for "${product.name}"`, 'VARIANT_UNAVAILABLE', 400);
        }
        unitPrice = variant.price ? this.parseDecimal(variant.price) : unitPrice;
        variantName = variant.name;
        sku = variant.sku;

        const inventory = await prisma.productInventory.findUnique({
          where: { variantId: cartItem.variantId }
        });
        if (inventory && inventory.trackInventory) {
          const available = inventory.quantity - inventory.reservedQuantity;
          if (available < cartItem.quantity) {
            throw new CommerceError(
              `Insufficient stock for "${product.name}" (${variant.name}). Available: ${Math.max(0, available)}`,
              'INSUFFICIENT_STOCK',
              409
            );
          }
        }
      }

      const primaryImage = await prisma.productImage.findFirst({
        where: { productId: cartItem.productId, isPrimary: true }
      });

      items.push({
        productId: cartItem.productId,
        variantId: cartItem.variantId || null,
        productName: product.name,
        variantName,
        sku,
        quantity: cartItem.quantity,
        unitPrice,
        totalPrice: this.parseDecimal(unitPrice * cartItem.quantity),
        imageUrl: primaryImage ? primaryImage.url : null
      });
    }

    const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0);

    return { items, boutiqueId, subtotal };
  }

  async validateCheckoutCart(userId) {
    const cart = await checkoutRepository.findCartByUserId(userId);
    const result = await this.validateCartItems(cart);
    return {
      items: result.items,
      boutiqueId: result.boutiqueId,
      subtotal: result.subtotal,
      shippingAmount: 0,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: result.subtotal
    };
  }

  async createOrder(userId, shippingAddressId, customerNote) {
    const cart = await checkoutRepository.findCartByUserId(userId);
    const result = await this.validateCartItems(cart);

    if (shippingAddressId) {
      const addr = await checkoutRepository.findShippingAddress(shippingAddressId, userId);
      if (!addr) {
        throw new CommerceError('Shipping address not found', 'ADDRESS_NOT_FOUND', 400);
      }
    }

    const order = await prisma.$transaction(async (tx) => {
      const orderId = await commerceService.generateOrderNumber(tx);

      const commerceOrder = await tx.commerceOrder.create({
        data: {
          orderId,
          userId,
          boutiqueId: result.boutiqueId,
          shippingAddressId: shippingAddressId || null,
          subtotal: this.parseDecimal(result.subtotal),
          totalAmount: this.parseDecimal(result.subtotal),
          status: 'PENDING',
          paymentStatus: 'PENDING',
          customerNote: customerNote || null,
          reservationExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
          items: {
            create: result.items.map(item => ({
              productId: item.productId,
              variantId: item.variantId,
              productName: item.productName,
              variantName: item.variantName,
              sku: item.sku,
              quantity: item.quantity,
              unitPrice: this.parseDecimal(item.unitPrice),
              totalPrice: this.parseDecimal(item.totalPrice),
              imageUrl: item.imageUrl
            }))
          }
        },
        include: { items: true }
      });

      for (const item of result.items) {
        if (item.variantId) {
          await commerceService.reserveInventory(tx, item.variantId, item.quantity);
        }
      }

      await commerceService.createOrderHistory(tx, commerceOrder.id, null, 'PENDING', 'Order created', 'customer', userId);

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return commerceOrder;
    });

    await notificationsService.createCustomerNotification({
      customerId: userId,
      type: 'ORDER_PLACED',
      title: 'Order Placed Successfully',
      message: `Your order ${order.orderId} has been placed. Complete payment to confirm.`,
      entityType: 'commerce_order',
      entityId: order.orderId,
    });

    const boutique = await checkoutRepository.findBoutiqueUnique(order.boutiqueId);
    if (boutique && boutique.ownerId) {
      await notificationsService.createAdminNotification({
        recipientType: 'OWNER',
        recipientId: boutique.ownerId,
        boutiqueId: order.boutiqueId,
        type: 'NEW_ORDER',
        priority: 'HIGH',
        title: 'New Order Received',
        message: `Order ${order.orderId} has been placed and is pending payment.`,
        entityType: 'commerce_order',
        entityId: order.orderId,
      });
    }

    return order;
  }

  async createPayment(userId, orderId) {
    const order = await prisma.commerceOrder.findUnique({
      where: { orderId }
    });

    if (!order) {
      throw new CommerceError('Order not found', 'ORDER_NOT_FOUND', 404);
    }
    if (order.userId !== userId) {
      throw new CommerceError('Access denied', 'ACCESS_DENIED', 403);
    }
    if (order.status !== 'PENDING' || order.paymentStatus !== 'PENDING') {
      throw new CommerceError('Order cannot accept payment in current state', 'INVALID_STATE', 400);
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(this.parseDecimal(order.totalAmount) * 100),
      currency: 'INR',
      receipt: `receipt_${order.orderId}`
    });

    const payment = await checkoutRepository.createPayment({
      commerceOrderId: order.id,
      amount: order.totalAmount,
      status: 'PENDING',
      razorpayOrderId: razorpayOrder.id
    });

    return {
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
      paymentId: payment.id
    };
  }

  async verifyPayment(userId, razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId) {
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder')
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      const order = await prisma.commerceOrder.findUnique({ where: { orderId } });
      if (order && order.paymentStatus === 'PENDING') {
        await prisma.$transaction(async (tx) => {
          await commerceService.failPayment(tx, order.id, 'Invalid payment signature');
        });
        await notificationsService.createCustomerNotification({
          customerId: order.userId,
          type: 'PAYMENT_FAILED',
          title: 'Payment Failed',
          message: `Your payment for order ${order.orderId} could not be processed. Please try again.`,
          entityType: 'commerce_order',
          entityId: order.orderId,
        });
        const failBoutique = await checkoutRepository.findBoutiqueUnique(order.boutiqueId);
        if (failBoutique && failBoutique.ownerId) {
          await notificationsService.createAdminNotification({
            recipientType: 'OWNER',
            recipientId: failBoutique.ownerId,
            boutiqueId: order.boutiqueId,
            type: 'PAYMENT_FAILED',
            priority: 'HIGH',
            title: 'Payment Failed',
            message: `Payment for order ${order.orderId} failed. Customer may need assistance.`,
            entityType: 'commerce_order',
            entityId: order.orderId,
          });
        }
      }
      throw new CommerceError('Invalid payment signature', 'INVALID_SIGNATURE', 400);
    }

    const order = await prisma.commerceOrder.findUnique({ where: { orderId } });
    if (!order) {
      throw new CommerceError('Order not found', 'ORDER_NOT_FOUND', 404);
    }

    if (order.paymentStatus === 'PAID') {
      return { success: true, message: 'Payment already verified' };
    }

    let items = [];

    await prisma.$transaction(async (tx) => {
      await tx.commercePayment.update({
        where: { razorpayOrderId: razorpay_order_id },
        data: {
          status: 'PAID',
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature
        }
      });

      await tx.commerceOrder.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          status: 'CONFIRMED',
          paidAt: new Date()
        }
      });

      items = await checkoutRepository.findOrderItems({ orderId: order.id }, tx);

      for (const item of items) {
        if (item.variantId) {
          await commerceService.deductInventory(tx, item.variantId, item.quantity);
        }
      }

      await commerceService.createOrderHistory(tx, order.id, 'PENDING', 'CONFIRMED', 'Payment verified — order confirmed', 'system');
    });

    await notificationsService.createCustomerNotification({
      customerId: order.userId,
      type: 'PAYMENT_SUCCESS',
      title: 'Payment Successful',
      message: `Your payment for order ${order.orderId} has been received. Your order is confirmed.`,
      entityType: 'commerce_order',
      entityId: order.orderId,
    });

    const paidBoutique = await checkoutRepository.findBoutiqueUnique(order.boutiqueId);
    if (paidBoutique && paidBoutique.ownerId) {
      await notificationsService.createAdminNotification({
        recipientType: 'OWNER',
        recipientId: paidBoutique.ownerId,
        boutiqueId: order.boutiqueId,
        type: 'PAYMENT_RECEIVED',
        priority: 'NORMAL',
        title: 'Payment Received',
        message: `Payment for order ${order.orderId} has been received. Order is confirmed.`,
        entityType: 'commerce_order',
        entityId: order.orderId,
      });
    }

    // Correctly fetch variants here using the loaded items array
    const variantIds = items.filter(i => i.variantId).map(i => i.variantId);
    if (variantIds.length > 0) {
      const invVariants = await checkoutRepository.findProductVariantsForAlert(variantIds);
      for (const v of invVariants) {
        if (v.inventory && v.inventory.trackInventory && v.inventory.quantity <= (v.inventory.lowStockThreshold || 5)) {
          const invBoutique = await checkoutRepository.findBoutiqueUnique(v.product.boutiqueId);
          if (invBoutique && invBoutique.ownerId) {
            await notificationsService.createAdminNotification({
              recipientType: 'OWNER',
              recipientId: invBoutique.ownerId,
              boutiqueId: v.product.boutiqueId,
              type: 'LOW_STOCK',
              priority: 'HIGH',
              title: 'Low Stock Alert',
              message: `"${v.product.name}" (${v.sku || 'variant'}) is running low: ${v.inventory.quantity} left.`,
              entityType: 'product_variant',
              entityId: v.id,
            });
          }
        }
      }
    }

    return { success: true, message: 'Payment verified successfully' };
  }

  async cancelCheckoutOrder(userId, orderId, reason) {
    const order = await prisma.commerceOrder.findUnique({ where: { orderId } });
    if (!order) {
      throw new CommerceError('Order not found', 'ORDER_NOT_FOUND', 404);
    }
    if (order.userId !== userId) {
      throw new CommerceError('Access denied', 'ACCESS_DENIED', 403);
    }
    if (['DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED'].includes(order.status)) {
      throw new CommerceError(`Order cannot be cancelled in ${order.status} state`, 'INVALID_STATE', 400);
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

      const items = await checkoutRepository.findOrderItems({ orderId: order.id }, tx);

      for (const item of items) {
        if (item.variantId) {
          await commerceService.releaseInventory(tx, item.variantId, item.quantity);
        }
      }

      await commerceService.createOrderHistory(tx, order.id, order.status, 'CANCELLED', reason || 'Cancelled by customer', 'customer', userId);
    });

    return { success: true, message: 'Order cancelled' };
  }
}

module.exports = {
  checkoutService: new CheckoutService(),
  CommerceError
};

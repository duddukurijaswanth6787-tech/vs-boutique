const { eventBus, Events } = require('./eventBus');
const { notificationsService } = require('../modules/notifications/services/notifications.service');

eventBus.on(Events.ORDER_PLACED, ({ userId, boutique, order }) => {
  try {
    notificationsService.createCustomerNotification({
      customerId: userId,
      type: 'ORDER_PLACED',
      title: 'Order Placed',
      message: `Your order #${order.orderId || order.id} has been placed successfully.`,
      metadata: { orderId: order.id, boutiqueId: boutique?.id }
    });
    notificationsService.createAdminNotification({
      recipientType: 'OWNER',
      recipientId: boutique?.ownerId,
      type: 'NEW_ORDER',
      title: 'New Order Received',
      message: `New order #${order.orderId || order.id} has been placed.`,
      metadata: { orderId: order.id, customerId: userId }
    });
  } catch (err) {
    console.error('[NotificationListener] ORDER_PLACED failed:', err);
  }
});

eventBus.on(Events.PAYMENT_FAILED, ({ userId, boutique, order, error }) => {
  try {
    notificationsService.createCustomerNotification({
      customerId: userId,
      type: 'PAYMENT_FAILED',
      title: 'Payment Failed',
      message: `Payment for order #${order.orderId || order.id} failed. Please try again.`,
      metadata: { orderId: order.id, error }
    });
    notificationsService.createAdminNotification({
      recipientType: 'OWNER',
      recipientId: boutique?.ownerId,
      type: 'PAYMENT_FAILED',
      title: 'Payment Failed',
      message: `Payment failed for order #${order.orderId || order.id}.`,
      metadata: { orderId: order.id, error }
    });
  } catch (err) {
    console.error('[NotificationListener] PAYMENT_FAILED failed:', err);
  }
});

eventBus.on(Events.PAYMENT_SUCCESS, ({ userId, boutique, order }) => {
  try {
    notificationsService.createCustomerNotification({
      customerId: userId,
      type: 'PAYMENT_SUCCESS',
      title: 'Payment Successful',
      message: `Payment for order #${order.orderId || order.id} was successful.`,
      metadata: { orderId: order.id }
    });
    notificationsService.createAdminNotification({
      recipientType: 'OWNER',
      recipientId: boutique?.ownerId,
      type: 'PAYMENT_RECEIVED',
      title: 'Payment Received',
      message: `Payment received for order #${order.orderId || order.id}.`,
      metadata: { orderId: order.id }
    });
  } catch (err) {
    console.error('[NotificationListener] PAYMENT_SUCCESS failed:', err);
  }
});

eventBus.on(Events.ORDER_SHIPPED, ({ userId, user, order, boutique }) => {
  try {
    notificationsService.createCustomerNotification({
      customerId: userId,
      type: 'ORDER_SHIPPED',
      title: 'Order Shipped',
      message: `Your order #${order.orderId || order.id} has been shipped!`,
      metadata: { orderId: order.id, boutiqueId: boutique?.id }
    });
  } catch (err) {
    console.error('[NotificationListener] ORDER_SHIPPED failed:', err);
  }
});

eventBus.on(Events.ORDER_DELIVERED, ({ userId, user, order, boutique }) => {
  try {
    notificationsService.createCustomerNotification({
      customerId: userId,
      type: 'ORDER_DELIVERED',
      title: 'Order Delivered',
      message: `Your order #${order.orderId || order.id} has been delivered.`,
      metadata: { orderId: order.id, boutiqueId: boutique?.id }
    });
  } catch (err) {
    console.error('[NotificationListener] ORDER_DELIVERED failed:', err);
  }
});

eventBus.on(Events.REVIEW_SUBMITTED, ({ review, boutique }) => {
  try {
    notificationsService.createAdminNotification({
      recipientType: 'OWNER',
      recipientId: boutique?.ownerId,
      type: 'NEW_REVIEW',
      title: 'New Review',
      message: `A new review has been submitted for your boutique.`,
      metadata: { reviewId: review.id, boutiqueId: boutique?.id, rating: review.rating }
    });
  } catch (err) {
    console.error('[NotificationListener] REVIEW_SUBMITTED failed:', err);
  }
});

eventBus.on(Events.REVIEW_REPLIED, ({ review, reply }) => {
  try {
    notificationsService.createCustomerNotification({
      customerId: review.userId,
      type: 'REVIEW_REPLY',
      title: 'Review Reply',
      message: `The boutique has replied to your review.`,
      metadata: { reviewId: review.id, replyId: reply.id }
    });
  } catch (err) {
    console.error('[NotificationListener] REVIEW_REPLIED failed:', err);
  }
});

eventBus.on(Events.MEASUREMENT_SUBMITTED, ({ measurements, boutique }) => {
  try {
    notificationsService.createAdminNotification({
      recipientType: 'OWNER',
      recipientId: boutique?.ownerId,
      type: 'NEW_MEASUREMENTS',
      title: 'Measurements Submitted',
      message: `New measurements have been submitted for your boutique.`,
      metadata: { measurementsId: measurements.id, boutiqueId: boutique?.id }
    });
  } catch (err) {
    console.error('[NotificationListener] MEASUREMENT_SUBMITTED failed:', err);
  }
});

eventBus.on(Events.RETURN_REQUESTED, ({ userId, returnReq, boutique }) => {
  try {
    notificationsService.createCustomerNotification({
      customerId: userId,
      type: 'RETURN_REQUESTED',
      title: 'Return Requested',
      message: `Your return request has been submitted.`,
      metadata: { returnId: returnReq.id }
    });
    notificationsService.createAdminNotification({
      recipientType: 'OWNER',
      recipientId: boutique?.ownerId,
      type: 'RETURN_REQUESTED',
      title: 'Return Requested',
      message: `A return request has been submitted for your boutique.`,
      metadata: { returnId: returnReq.id, boutiqueId: boutique?.id }
    });
  } catch (err) {
    console.error('[NotificationListener] RETURN_REQUESTED failed:', err);
  }
});

eventBus.on(Events.RETURN_STATUS_CHANGED, ({ customerId, returnReq, newStatus, boutique }) => {
  try {
    const type = newStatus === 'APPROVED' ? 'RETURN_APPROVED' : 'RETURN_REJECTED';
    notificationsService.createCustomerNotification({
      customerId,
      type,
      title: newStatus === 'APPROVED' ? 'Return Approved' : 'Return Rejected',
      message: `Your return request #${returnReq.id} has been ${newStatus.toLowerCase()}.`,
      metadata: { returnId: returnReq.id, status: newStatus }
    });
  } catch (err) {
    console.error('[NotificationListener] RETURN_STATUS_CHANGED failed:', err);
  }
});

eventBus.on(Events.EXCHANGE_REQUESTED, ({ userId, exchange, boutique }) => {
  try {
    notificationsService.createCustomerNotification({
      customerId: userId,
      type: 'EXCHANGE_REQUESTED',
      title: 'Exchange Requested',
      message: `Your exchange request has been submitted.`,
      metadata: { exchangeId: exchange.id }
    });
    notificationsService.createAdminNotification({
      recipientType: 'OWNER',
      recipientId: boutique?.ownerId,
      type: 'EXCHANGE_REQUESTED',
      title: 'Exchange Requested',
      message: `An exchange request has been submitted for your boutique.`,
      metadata: { exchangeId: exchange.id, boutiqueId: boutique?.id }
    });
  } catch (err) {
    console.error('[NotificationListener] EXCHANGE_REQUESTED failed:', err);
  }
});

eventBus.on(Events.EXCHANGE_STATUS_CHANGED, ({ customerId, exchange, newStatus, boutique }) => {
  try {
    const type = newStatus === 'APPROVED' ? 'EXCHANGE_APPROVED' : 'EXCHANGE_SHIPPED';
    notificationsService.createCustomerNotification({
      customerId,
      type,
      title: newStatus === 'APPROVED' ? 'Exchange Approved' : 'Exchange Shipped',
      message: `Your exchange request #${exchange.id} has been ${newStatus.toLowerCase()}.`,
      metadata: { exchangeId: exchange.id, status: newStatus }
    });
  } catch (err) {
    console.error('[NotificationListener] EXCHANGE_STATUS_CHANGED failed:', err);
  }
});

eventBus.on(Events.BOOKING_CREATED, ({ booking, boutique }) => {
  try {
    notificationsService.createAdminNotification({
      recipientType: 'OWNER',
      recipientId: boutique?.ownerId,
      type: 'NEW_BOOKING',
      title: 'New Booking',
      message: `A new booking has been made for your boutique.`,
      metadata: { bookingId: booking.id, boutiqueId: boutique?.id }
    });
  } catch (err) {
    console.error('[NotificationListener] BOOKING_CREATED failed:', err);
  }
});

eventBus.on(Events.BOOKING_CONFIRMED, ({ customerId, booking, boutique }) => {
  try {
    notificationsService.createCustomerNotification({
      customerId,
      type: 'BOOKING_CONFIRMED',
      title: 'Booking Confirmed',
      message: `Your booking has been confirmed.`,
      metadata: { bookingId: booking.id, boutiqueId: boutique?.id }
    });
    notificationsService.createAdminNotification({
      recipientType: 'OWNER',
      recipientId: boutique?.ownerId,
      type: 'BOOKING_CONFIRMED',
      title: 'Booking Confirmed',
      message: `A booking has been confirmed for your boutique.`,
      metadata: { bookingId: booking.id, boutiqueId: boutique?.id }
    });
  } catch (err) {
    console.error('[NotificationListener] BOOKING_CONFIRMED failed:', err);
  }
});

eventBus.on(Events.ORDER_CANCELLED, ({ user, order, boutiqueId }) => {
  try {
    notificationsService.createAdminNotification({
      recipientType: 'SUPER_ADMIN',
      recipientId: user.id,
      boutiqueId,
      type: 'ORDER_CANCELLED',
      priority: 'HIGH',
      title: 'Order Cancelled',
      message: `Order ${order.orderId || order.id} has been cancelled.`,
      entityType: 'commerce_order',
      entityId: order.orderId || order.id,
    });
  } catch (err) {
    console.error('[NotificationListener] ORDER_CANCELLED failed:', err);
  }
});

eventBus.on(Events.BOOKING_REJECTED, ({ booking, boutique }) => {
  try {
    notificationsService.createAdminNotification({
      recipientType: 'OWNER',
      recipientId: boutique?.ownerId,
      boutiqueId: booking?.boutiqueId,
      type: 'BOOKING_CANCELLED',
      priority: 'NORMAL',
      title: 'Booking Rejected',
      message: `Booking for ${new Date(booking?.bookingDate).toLocaleDateString()} has been rejected.`,
      entityType: 'booking',
      entityId: booking?.id,
    });
  } catch (err) {
    console.error('[NotificationListener] BOOKING_REJECTED failed:', err);
  }
});

eventBus.on(Events.LOW_STOCK, ({ boutique, variant, product }) => {
  try {
    notificationsService.createAdminNotification({
      recipientType: 'OWNER',
      recipientId: boutique?.ownerId,
      boutiqueId: product?.boutiqueId,
      type: 'LOW_STOCK',
      priority: 'HIGH',
      title: 'Low Stock Alert',
      message: `"${product?.name}" (${variant?.sku || 'variant'}) is running low: ${variant?.inventory?.quantity || 0} left.`,
      entityType: 'product_variant',
      entityId: variant?.id,
    });
  } catch (err) {
    console.error('[NotificationListener] LOW_STOCK failed:', err);
  }
});

module.exports = { eventBus, Events };

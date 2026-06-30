const EventEmitter = require('events');

const eventBus = new EventEmitter();
eventBus.setMaxListeners(100);

const Events = {
  ORDER_PLACED: 'order:placed',
  PAYMENT_FAILED: 'payment:failed',
  PAYMENT_SUCCESS: 'payment:success',
  ORDER_SHIPPED: 'order:shipped',
  ORDER_DELIVERED: 'order:delivered',
  ORDER_CANCELLED: 'order:cancelled',
  REVIEW_SUBMITTED: 'review:submitted',
  REVIEW_REPLIED: 'review:replied',
  MEASUREMENT_SUBMITTED: 'measurement:submitted',
  RETURN_REQUESTED: 'return:requested',
  RETURN_STATUS_CHANGED: 'return:status_changed',
  EXCHANGE_REQUESTED: 'exchange:requested',
  EXCHANGE_STATUS_CHANGED: 'exchange:status_changed',
  BOOKING_CREATED: 'booking:created',
  BOOKING_CONFIRMED: 'booking:confirmed',
  BOOKING_REJECTED: 'booking:rejected',
  LOW_STOCK: 'inventory:low_stock',
};

module.exports = { eventBus, Events };

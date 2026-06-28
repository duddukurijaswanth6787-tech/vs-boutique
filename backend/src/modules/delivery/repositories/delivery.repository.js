const prisma = require('../../../utils/prisma');

class DeliveryRepository {
  // Orders & Boutiques
  async findOrderById(id, include = {}) {
    return prisma.commerceOrder.findUnique({
      where: { id },
      include
    });
  }

  async findBoutiqueById(id) {
    return prisma.boutique.findUnique({ where: { id } });
  }

  // Delivery Tracking
  async findTrackingByOrderId(orderId) {
    return prisma.deliveryTracking.findFirst({
      where: { orderId },
      include: { histories: { orderBy: { createdAt: 'asc' } } }
    });
  }

  async findTrackingById(id) {
    return prisma.deliveryTracking.findUnique({
      where: { id },
      include: { histories: { orderBy: { createdAt: 'asc' } } }
    });
  }

  async createTracking(trackingData, historyData) {
    return prisma.$transaction(async (tx) => {
      const tracking = await tx.deliveryTracking.create({
        data: trackingData
      });
      await tx.deliveryTrackingHistory.create({
        data: {
          ...historyData,
          trackingId: tracking.id
        }
      });
      return tracking;
    });
  }

  async updateTrackingStatus(trackingId, trackingData, historyData, onDelivered) {
    return prisma.$transaction(async (tx) => {
      const tracking = await tx.deliveryTracking.update({
        where: { id: trackingId },
        data: trackingData
      });

      await tx.deliveryTrackingHistory.create({
        data: {
          ...historyData,
          trackingId: tracking.id
        }
      });

      if (onDelivered) {
        await onDelivered(tx);
      }

      return tracking;
    });
  }

  // Returns
  async findReturnById(id, include = {}) {
    return prisma.returnRequest.findUnique({
      where: { id },
      include
    });
  }

  async findReturnByOrderItemIdAndCustomer(orderItemId, customerId) {
    return prisma.returnRequest.findFirst({
      where: { orderItemId, customerId, status: { notIn: ['REJECTED', 'COMPLETED'] } }
    });
  }

  async createReturnRequest(returnData, historyData) {
    return prisma.$transaction(async (tx) => {
      const returnReq = await tx.returnRequest.create({
        data: returnData,
        include: {
          order: { include: { items: true } },
          orderItem: true
        }
      });

      await tx.commerceOrderHistory.create({
        data: historyData
      });

      return returnReq;
    });
  }

  async findReturnsByCustomerId(customerId) {
    return prisma.returnRequest.findMany({
      where: { customerId },
      include: {
        orderItem: true,
        order: { select: { orderId: true, status: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateReturnRequest(id, returnData, historyData, onRefunded) {
    return prisma.$transaction(async (tx) => {
      const result = await tx.returnRequest.update({
        where: { id },
        data: returnData,
        include: { orderItem: true }
      });

      if (onRefunded) {
        await onRefunded(tx, result);
      }

      await tx.commerceOrderHistory.create({
        data: historyData
      });

      return result;
    });
  }

  // Exchanges
  async findExchangeById(id, include = {}) {
    return prisma.exchangeRequest.findUnique({
      where: { id },
      include
    });
  }

  async findExchangeByOrderItemIdAndCustomer(orderItemId, customerId) {
    return prisma.exchangeRequest.findFirst({
      where: { orderItemId, customerId, status: { notIn: ['REJECTED', 'COMPLETED'] } }
    });
  }

  async createExchangeRequest(exchangeData, historyData) {
    return prisma.$transaction(async (tx) => {
      const exchangeReq = await tx.exchangeRequest.create({
        data: exchangeData,
        include: {
          order: { include: { items: true } },
          orderItem: true
        }
      });

      await tx.commerceOrderHistory.create({
        data: historyData
      });

      return exchangeReq;
    });
  }

  async findExchangesByCustomerId(customerId) {
    return prisma.exchangeRequest.findMany({
      where: { customerId },
      include: {
        orderItem: true,
        order: { select: { orderId: true, status: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateExchangeRequest(id, exchangeData, historyData) {
    return prisma.$transaction(async (tx) => {
      const result = await tx.exchangeRequest.update({
        where: { id },
        data: exchangeData,
        include: { orderItem: true }
      });

      await tx.commerceOrderHistory.create({
        data: historyData
      });

      return result;
    });
  }

  // General Database Helpers for Transactions
  async getPaymentForOrder(orderId) {
    return prisma.commercePayment.findFirst({
      where: { commerceOrderId: orderId, status: 'PAID' }
    });
  }
}

module.exports = new DeliveryRepository();

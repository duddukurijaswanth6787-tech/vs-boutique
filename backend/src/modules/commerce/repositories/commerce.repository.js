const prisma = require('../../../utils/prisma');

class CommerceRepository {
  async findOrders(where, include, orderBy) {
    return prisma.commerceOrder.findMany({
      where,
      include,
      orderBy
    });
  }

  async findOrderUnique(id, include) {
    return prisma.commerceOrder.findUnique({
      where: { id },
      include
    });
  }

  async updateOrder(id, data, include, tx = prisma) {
    return tx.commerceOrder.update({
      where: { id },
      data,
      include
    });
  }

  async upsertOrderSequence(date, tx = prisma) {
    return tx.orderSequence.upsert({
      where: { date },
      create: { date, lastNumber: 1 },
      update: { lastNumber: { increment: 1 } }
    });
  }

  async findInventoryByVariantId(variantId, tx = prisma) {
    return tx.productInventory.findUnique({
      where: { variantId }
    });
  }

  async updateInventoryMany(where, data, tx = prisma) {
    return tx.productInventory.updateMany({
      where,
      data
    });
  }

  async createOrderHistory(data, tx = prisma) {
    return tx.commerceOrderHistory.create({
      data
    });
  }

  async createPayment(data, tx = prisma) {
    return tx.commercePayment.create({
      data
    });
  }

  async findOrderItems(where, select, tx = prisma) {
    return tx.commerceOrderItem.findMany({
      where,
      select
    });
  }
}

module.exports = new CommerceRepository();

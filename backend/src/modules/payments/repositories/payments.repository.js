const prisma = require('../../../utils/prisma');

class PaymentsRepository {
  async findPlatformSettings(tx = prisma) {
    return tx.platformSetting.findFirst();
  }

  async createPlatformSettings(data, tx = prisma) {
    return tx.platformSetting.create({
      data
    });
  }

  async updatePlatformSettings(id, data, tx = prisma) {
    return tx.platformSetting.update({
      where: { id },
      data
    });
  }

  async findBoutiqueUnique(id, tx = prisma) {
    return tx.boutique.findUnique({
      where: { id }
    });
  }

  async updateBoutique(id, data, tx = prisma) {
    return tx.boutique.update({
      where: { id },
      data
    });
  }

  async findOrderUnique(id, tx = prisma) {
    return tx.order.findUnique({
      where: { id }
    });
  }

  async updateOrder(id, data, tx = prisma) {
    return tx.order.update({
      where: { id },
      data
    });
  }

  async findPaymentUnique(id, tx = prisma) {
    return tx.payment.findUnique({
      where: { id }
    });
  }

  async findPaymentFirst(where, tx = prisma) {
    return tx.payment.findFirst({
      where
    });
  }

  async createPayment(data, tx = prisma) {
    return tx.payment.create({
      data
    });
  }

  async updatePayment(id, data, tx = prisma) {
    return tx.payment.update({
      where: { id },
      data
    });
  }

  async updatePaymentMany(where, data, tx = prisma) {
    return tx.payment.updateMany({
      where,
      data
    });
  }

  async findPayments(where = {}, include = {}, orderBy = { createdAt: 'desc' }, tx = prisma) {
    return tx.payment.findMany({
      where,
      include,
      orderBy
    });
  }

  async findPayoutUnique(id, tx = prisma) {
    return tx.payout.findUnique({
      where: { id },
      include: { payments: true }
    });
  }

  async findPayouts(where = {}, include = {}, orderBy = { createdAt: 'desc' }, tx = prisma) {
    return tx.payout.findMany({
      where,
      include,
      orderBy
    });
  }

  async createPayout(data, tx = prisma) {
    return tx.payout.create({
      data
    });
  }

  async updatePayout(id, data, tx = prisma) {
    return tx.payout.update({
      where: { id },
      data
    });
  }
}

module.exports = new PaymentsRepository();

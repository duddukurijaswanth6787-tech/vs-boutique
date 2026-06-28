const prisma = require('../../../utils/prisma');

class CheckoutRepository {
  async findCartByUserId(userId, tx = prisma) {
    return tx.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                basePrice: true,
                status: true,
                isDeleted: true,
                boutiqueId: true
              }
            },
            variant: {
              select: {
                id: true,
                name: true,
                price: true,
                sku: true
              }
            }
          }
        }
      }
    });
  }

  async findShippingAddress(id, userId, tx = prisma) {
    return tx.shippingAddress.findFirst({
      where: { id, userId }
    });
  }

  async findOrderUnique(orderId, tx = prisma) {
    return tx.commerceOrder.findUnique({
      where: { orderId }
    });
  }

  async findBoutiqueUnique(id, tx = prisma) {
    return tx.boutique.findUnique({
      where: { id }
    });
  }

  async createPayment(data, tx = prisma) {
    return tx.commercePayment.create({
      data
    });
  }

  async findOrderItems(where, tx = prisma) {
    return tx.commerceOrderItem.findMany({
      where
    });
  }

  async findProductVariantsForAlert(variantIds, tx = prisma) {
    return tx.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: {
        inventory: true,
        product: { select: { boutiqueId: true, name: true } }
      }
    });
  }
}

module.exports = new CheckoutRepository();

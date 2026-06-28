const prisma = require('../../../utils/prisma');

class CartRepository {
  async getCartByUserId(userId) {
    return prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true, name: true, basePrice: true, status: true, isDeleted: true,
                images: { where: { isPrimary: true }, take: 1, select: { url: true } }
              }
            },
            variant: { select: { id: true, name: true, price: true, sku: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  }

  async createCart(userId) {
    return prisma.cart.create({
      data: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true, name: true, basePrice: true, status: true, isDeleted: true,
                images: { where: { isPrimary: true }, take: 1, select: { url: true } }
              }
            },
            variant: { select: { id: true, name: true, price: true, sku: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  }

  async getProduct(productId) {
    return prisma.product.findFirst({
      where: { id: productId, isDeleted: false, status: 'ACTIVE' }
    });
  }

  async getVariant(variantId, productId) {
    return prisma.productVariant.findFirst({
      where: { id: variantId, productId, status: 'ACTIVE' },
      include: { inventory: true }
    });
  }

  async getCartItem(cartId, productId, variantId) {
    return prisma.cartItem.findFirst({
      where: { cartId, productId, variantId: variantId || null }
    });
  }

  async getCartItemByIdAndCart(itemId, cartId) {
    return prisma.cartItem.findFirst({
      where: { id: itemId, cartId }
    });
  }

  async createCartItem(data) {
    return prisma.cartItem.create({
      data
    });
  }

  async updateCartItem(id, data) {
    return prisma.cartItem.update({
      where: { id },
      data
    });
  }

  async deleteCartItem(id) {
    return prisma.cartItem.delete({
      where: { id }
    });
  }

  async clearCartItems(cartId) {
    return prisma.cartItem.deleteMany({
      where: { cartId }
    });
  }
}

module.exports = new CartRepository();

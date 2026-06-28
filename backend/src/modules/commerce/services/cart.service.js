const repository = require('../repositories/cart.repository');

class CartService {
  async getOrCreateCart(userId) {
    let cart = await repository.getCartByUserId(userId);
    if (!cart) {
      cart = await repository.createCart(userId);
    }
    return cart;
  }

  async getCart(userId) {
    const cart = await this.getOrCreateCart(userId);
    const mappedItems = cart.items.map(item => ({
      ...item,
      product: item.product ? {
        ...item.product,
        basePrice: Number(item.product.basePrice)
      } : null,
      variant: item.variant ? {
        ...item.variant,
        price: item.variant.price ? Number(item.variant.price) : null
      } : null
    }));
    return { id: cart.id, items: mappedItems };
  }

  async addItemToCart(userId, { productId, variantId, quantity = 1 }) {
    if (!productId) {
      throw new Error('Product ID is required');
    }
    if (quantity < 1) {
      throw new Error('Quantity must be at least 1');
    }

    const product = await repository.getProduct(productId);
    if (!product) {
      throw new Error('Product not found or not available');
    }

    let availableStock = null;
    if (variantId) {
      const variant = await repository.getVariant(variantId, productId);
      if (!variant) {
        throw new Error('Variant not found or not available');
      }
      if (variant.inventory && variant.inventory.trackInventory) {
        availableStock = variant.inventory.quantity - variant.inventory.reservedQuantity;
        if (availableStock < quantity) {
          throw new Error(`Insufficient stock. Available: ${Math.max(0, availableStock)}, Requested: ${quantity}`);
        }
      }
    }

    const cart = await this.getOrCreateCart(userId);
    const existingItem = await repository.getCartItem(cart.id, productId, variantId);
    const newTotalQty = existingItem ? existingItem.quantity + quantity : quantity;

    if (availableStock !== null && newTotalQty > availableStock) {
      throw new Error(`Insufficient stock. Available: ${Math.max(0, availableStock)}, Total in cart would be: ${newTotalQty}`);
    }

    if (existingItem) {
      const updated = await repository.updateCartItem(existingItem.id, { quantity: newTotalQty });
      return { data: updated, message: 'Cart item quantity updated' };
    }

    const item = await repository.createCartItem({
      cartId: cart.id,
      productId,
      variantId: variantId || null,
      quantity
    });

    return { data: item, message: 'Item added to cart' };
  }

  async updateItemQuantity(userId, itemId, quantity) {
    if (quantity === undefined || quantity < 0) {
      throw new Error('Valid quantity is required (0 to remove)');
    }

    const cart = await repository.getCartByUserId(userId);
    if (!cart) {
      throw new Error('Cart not found');
    }

    const item = await repository.getCartItemByIdAndCart(itemId, cart.id);
    if (!item) {
      throw new Error('Cart item not found');
    }

    if (quantity === 0) {
      await repository.deleteCartItem(itemId);
      return { message: 'Item removed from cart' };
    }

    // Optional stock validation on update if needed (replicate legacy behavior)
    const updated = await repository.updateCartItem(itemId, { quantity });
    return { data: updated };
  }

  async removeItemFromCart(userId, itemId) {
    const cart = await repository.getCartByUserId(userId);
    if (!cart) {
      throw new Error('Cart not found');
    }

    const item = await repository.getCartItemByIdAndCart(itemId, cart.id);
    if (!item) {
      throw new Error('Cart item not found');
    }

    await repository.deleteCartItem(itemId);
    return { message: 'Item removed from cart' };
  }

  async clearCart(userId) {
    const cart = await repository.getCartByUserId(userId);
    if (!cart) {
      return { message: 'Cart is already empty' };
    }

    await repository.clearCartItems(cart.id);
    return { message: 'Cart cleared' };
  }
}

module.exports = new CartService();

const service = require('../services/cart.service');

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class CartController {
  async getCart(req, res) {
    try {
      const data = await service.getCart(req.user.id);
      return res.json({ success: true, data });
    } catch (err) {
      console.error('[CartController.getCart]', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async addItemToCart(req, res) {
    try {
      const { productId, variantId, quantity } = req.body;
      
      if (productId && !uuidRegex.test(productId)) {
        return res.status(404).json({ success: false, message: 'Product not found or not available' });
      }
      if (variantId && !uuidRegex.test(variantId)) {
        return res.status(404).json({ success: false, message: 'Variant not found or not available' });
      }

      const result = await service.addItemToCart(req.user.id, { productId, variantId, quantity });
      return res.status(201).json({ success: true, ...result });
    } catch (err) {
      console.error('[CartController.addItemToCart]', err);
      const status = (err.message.includes('not found') || err.message.includes('not available')) ? 404 : 400;
      return res.status(status).json({ success: false, message: err.message });
    }
  }

  async updateItemQuantity(req, res) {
    try {
      const { itemId } = req.params;
      if (!uuidRegex.test(itemId)) {
        return res.status(404).json({ success: false, message: 'Cart item not found' });
      }

      const { quantity } = req.body;
      const result = await service.updateItemQuantity(req.user.id, itemId, quantity);
      return res.json({ success: true, ...result });
    } catch (err) {
      console.error('[CartController.updateItemQuantity]', err);
      const status = err.message.includes('not found') ? 404 : 400;
      return res.status(status).json({ success: false, message: err.message });
    }
  }

  async removeItemFromCart(req, res) {
    try {
      const { itemId } = req.params;
      if (!uuidRegex.test(itemId)) {
        return res.status(404).json({ success: false, message: 'Cart item not found' });
      }

      const result = await service.removeItemFromCart(req.user.id, itemId);
      return res.json({ success: true, ...result });
    } catch (err) {
      console.error('[CartController.removeItemFromCart]', err);
      const status = err.message.includes('not found') ? 404 : 500;
      return res.status(status).json({ success: false, message: err.message });
    }
  }

  async clearCart(req, res) {
    try {
      const result = await service.clearCart(req.user.id);
      return res.json({ success: true, ...result });
    } catch (err) {
      console.error('[CartController.clearCart]', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new CartController();

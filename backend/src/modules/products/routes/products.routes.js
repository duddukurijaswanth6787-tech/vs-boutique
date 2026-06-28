const express = require('express');
const productsController = require('../controllers/products.controller');
const { protect, authorize, checkReadOnlyMode, checkBoutiqueStatus, checkFeatureAccess } = require('../../../middleware/authMiddleware');
const { requireDirectSelling, checkPlanFeature } = require('../../../middleware/subscriptionMiddleware');

// ── Middlewares ───────────────────────────────────────────────────────
const ownerMiddlewareForProducts = [
  protect,
  authorize('owner', 'super-admin'),
  checkReadOnlyMode,
  checkBoutiqueStatus,
  checkFeatureAccess('products'),
  requireDirectSelling,
  checkPlanFeature('canManageProducts')
];

const ownerMiddlewareForImages = [
  protect,
  checkReadOnlyMode,
  checkBoutiqueStatus,
  checkFeatureAccess('products'),
  checkPlanFeature('canManageProducts')
];

const adminMiddleware = [
  protect,
  authorize('super-admin')
];

// ── Router 1: /products ───────────────────────────────────────────────
const productsRouter = express.Router();

// Brands
productsRouter.get('/brands', ...ownerMiddlewareForProducts, productsController.listBrands);
productsRouter.get('/brands/all', ...adminMiddleware, productsController.listAllBrands);
productsRouter.post('/brands', ...ownerMiddlewareForProducts, productsController.createBrand);
productsRouter.put('/brands/:id', ...ownerMiddlewareForProducts, productsController.updateBrand);
productsRouter.delete('/brands/:id', ...ownerMiddlewareForProducts, productsController.deleteBrand);

// Tags
productsRouter.get('/tags', ...ownerMiddlewareForProducts, productsController.listTags);
productsRouter.get('/tags/all', ...adminMiddleware, productsController.listAllTags);
productsRouter.post('/tags', ...ownerMiddlewareForProducts, productsController.createTag);
productsRouter.put('/tags/:id', ...ownerMiddlewareForProducts, productsController.updateTag);
productsRouter.delete('/tags/:id', ...ownerMiddlewareForProducts, productsController.deleteTag);

// Products
productsRouter.get('/', ...ownerMiddlewareForProducts, productsController.listBoutiqueProducts);
productsRouter.get('/all', ...adminMiddleware, productsController.listAllProducts);
productsRouter.get('/:id', ...ownerMiddlewareForProducts, productsController.getProductDetailsForOwner);
productsRouter.post('/', ...ownerMiddlewareForProducts, productsController.createProduct);
productsRouter.put('/:id', ...ownerMiddlewareForProducts, productsController.updateProduct);
productsRouter.delete('/:id', ...ownerMiddlewareForProducts, productsController.deleteProduct);

// Images
productsRouter.get('/:productId/images', productsController.listProductImages);
productsRouter.post('/:productId/images', ...ownerMiddlewareForProducts, productsController.addProductImage);
productsRouter.put('/:productId/images/:imageId', ...ownerMiddlewareForProducts, productsController.updateProductImage);
productsRouter.delete('/:productId/images/:imageId', ...ownerMiddlewareForProducts, productsController.deleteProductImage);

// Variant Attributes
productsRouter.get('/:productId/variant-attributes', productsController.listVariantAttributes);
productsRouter.post('/:productId/variant-attributes', ...ownerMiddlewareForProducts, checkPlanFeature('canManageProductVariants'), productsController.createVariantAttribute);
productsRouter.delete('/:productId/variant-attributes/:attrId', ...ownerMiddlewareForProducts, checkPlanFeature('canManageProductVariants'), productsController.deleteVariantAttribute);

// Variants
productsRouter.get('/:productId/variants', productsController.listVariants);
productsRouter.post('/:productId/variants', ...ownerMiddlewareForProducts, checkPlanFeature('canManageProductVariants'), productsController.createVariant);
productsRouter.put('/:productId/variants/:variantId', ...ownerMiddlewareForProducts, checkPlanFeature('canManageProductVariants'), productsController.updateVariant);
productsRouter.delete('/:productId/variants/:variantId', ...ownerMiddlewareForProducts, checkPlanFeature('canManageProductVariants'), productsController.deleteVariant);

// Inventory
productsRouter.get('/:productId/variants/:variantId/inventory', protect, productsController.getInventory);
productsRouter.put('/:productId/variants/:variantId/inventory', ...ownerMiddlewareForProducts, checkPlanFeature('canManageStock'), productsController.updateInventory);

// Inventory Logs
productsRouter.post('/:productId/inventory-logs', ...ownerMiddlewareForProducts, checkPlanFeature('canManageStock'), productsController.createInventoryLog);
productsRouter.get('/:productId/inventory-logs', protect, authorize('owner', 'super-admin'), productsController.listInventoryLogs);

// Public browsing APIs
productsRouter.get('/public/browse', productsController.publicBrowseProducts);
productsRouter.get('/public/:id', productsController.publicGetProductByIdOrSlug);
productsRouter.get('/public/boutique/:boutiqueId', productsController.publicGetProductsByBoutiqueId);

// Wishlist
productsRouter.get('/wishlists/my', protect, productsController.getUserWishlist);
productsRouter.post('/wishlists/:productId', protect, productsController.addToWishlist);
productsRouter.delete('/wishlists/:productId', protect, productsController.removeFromWishlist);


// ── Router 2: /owner/products ─────────────────────────────────────────
const ownerProductsRouter = express.Router();

ownerProductsRouter.get('/', ...ownerMiddlewareForProducts, productsController.listBoutiqueProducts);
ownerProductsRouter.get('/:id', ...ownerMiddlewareForProducts, productsController.getProductDetailsForOwner);
ownerProductsRouter.post('/', ...ownerMiddlewareForProducts, productsController.createProduct);
ownerProductsRouter.put('/:id', ...ownerMiddlewareForProducts, productsController.updateProduct);
ownerProductsRouter.delete('/:id', ...ownerMiddlewareForProducts, productsController.deleteProduct);


// ── Router 3: /owner/products/:productId/images ─────────────────────────
const ownerProductImagesRouter = express.Router({ mergeParams: true });

ownerProductImagesRouter.get('/', ...ownerMiddlewareForImages, productsController.listProductImagesForOwner);
ownerProductImagesRouter.post('/', ...ownerMiddlewareForImages, productsController.addProductImage);
ownerProductImagesRouter.put('/:imageId', ...ownerMiddlewareForImages, productsController.updateProductImage);
ownerProductImagesRouter.delete('/:imageId', ...ownerMiddlewareForImages, productsController.deleteProductImage);


module.exports = {
  productsRouter,
  ownerProductsRouter,
  ownerProductImagesRouter
};

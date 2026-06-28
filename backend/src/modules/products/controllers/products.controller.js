const productsService = require('../services/products.service');
const prisma = require('../../../utils/prisma');

class ProductsController {
  getBoutiqueId = async (req) => {
    if (req.user && req.user.assignedBoutiqueId) {
      return req.user.assignedBoutiqueId;
    }
    if (req.user && req.user.role === 'super-admin') {
      if (req.body && req.body.boutiqueId) return req.body.boutiqueId;
      if (req.query && req.query.boutiqueId) return req.query.boutiqueId;
      
      const productId = req.params.id || req.params.productId;
      if (productId && productId.length === 36) {
        const product = await prisma.product.findUnique({
          where: { id: productId }
        });
        if (product) return product.boutiqueId;
      }
    }
    return null;
  };

  // ── Brands ──────────────────────────────────────────────────────────
  listBrands = async (req, res) => {
    try {
      const boutiqueId = req.user.assignedBoutiqueId;
      const brands = await productsService.listBrands(boutiqueId);
      return res.json({ success: true, data: brands });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  };

  listAllBrands = async (req, res) => {
    try {
      const brands = await productsService.listAllBrands();
      return res.json({ success: true, data: brands });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  };

  createBrand = async (req, res) => {
    try {
      const boutiqueId = req.user.assignedBoutiqueId;
      const brand = await productsService.createBrand(req.body, boutiqueId);
      return res.status(201).json({ success: true, data: brand });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  updateBrand = async (req, res) => {
    try {
      const { id } = req.params;
      const brand = await productsService.updateBrand(id, req.body);
      return res.json({ success: true, data: brand });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  deleteBrand = async (req, res) => {
    try {
      const { id } = req.params;
      await productsService.deleteBrand(id);
      return res.json({ success: true, message: 'Brand deleted successfully' });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  // ── Tags ────────────────────────────────────────────────────────────
  listTags = async (req, res) => {
    try {
      const boutiqueId = req.user.assignedBoutiqueId;
      const tags = await productsService.listTags(boutiqueId);
      return res.json({ success: true, data: tags });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  };

  listAllTags = async (req, res) => {
    try {
      const tags = await productsService.listAllTags();
      return res.json({ success: true, data: tags });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  };

  createTag = async (req, res) => {
    try {
      const boutiqueId = req.user.assignedBoutiqueId;
      const tag = await productsService.createTag(req.body, boutiqueId);
      return res.status(201).json({ success: true, data: tag });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  updateTag = async (req, res) => {
    try {
      const { id } = req.params;
      const tag = await productsService.updateTag(id, req.body);
      return res.json({ success: true, data: tag });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  deleteTag = async (req, res) => {
    try {
      const { id } = req.params;
      await productsService.deleteTag(id);
      return res.json({ success: true, message: 'Tag deleted successfully' });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  // ── Products ────────────────────────────────────────────────────────
  listBoutiqueProducts = async (req, res) => {
    try {
      const boutiqueId = req.user.assignedBoutiqueId;
      const result = await productsService.listBoutiqueProducts(boutiqueId, req.query);
      return res.json({ success: true, ...result });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  };

  listAllProducts = async (req, res) => {
    try {
      const products = await productsService.listAllProducts();
      return res.json({ success: true, data: products });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  };

  getProductDetailsForOwner = async (req, res) => {
    try {
      const boutiqueId = await this.getBoutiqueId(req);
      const product = await productsService.getProductDetailsForOwner(req.params.id, boutiqueId);
      return res.json({ success: true, data: product });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  createProduct = async (req, res) => {
    try {
      const boutiqueId = await this.getBoutiqueId(req);
      const enforceCategory = req.originalUrl.includes('/owner/products');
      const product = await productsService.createProduct(req.body, boutiqueId, req.user.id, enforceCategory);
      return res.status(201).json({ success: true, data: product });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  updateProduct = async (req, res) => {
    try {
      const boutiqueId = await this.getBoutiqueId(req);
      const product = await productsService.updateProduct(req.params.id, req.body, boutiqueId, req.user.id);
      return res.json({ success: true, data: product });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  deleteProduct = async (req, res) => {
    try {
      const boutiqueId = await this.getBoutiqueId(req);
      await productsService.deleteProduct(req.params.id, boutiqueId, req.user.id);
      return res.json({ success: true, message: 'Product deleted successfully' });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  // ── Product Images ──────────────────────────────────────────────────
  listProductImages = async (req, res) => {
    try {
      const images = await productsService.listProductImages(req.params.productId);
      return res.json({ success: true, data: images });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  };

  listProductImagesForOwner = async (req, res) => {
    try {
      const boutiqueId = await this.getBoutiqueId(req);
      const images = await productsService.listProductImages(req.params.productId, boutiqueId);
      return res.json({ success: true, data: images });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  addProductImage = async (req, res) => {
    try {
      const boutiqueId = await this.getBoutiqueId(req);
      const image = await productsService.addProductImage(req.params.productId, boutiqueId, req.body, req.user.id);
      return res.status(201).json({ success: true, data: image });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  updateProductImage = async (req, res) => {
    try {
      const boutiqueId = await this.getBoutiqueId(req);
      const image = await productsService.updateProductImage(req.params.productId, req.params.imageId, boutiqueId, req.body);
      return res.json({ success: true, data: image });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  deleteProductImage = async (req, res) => {
    try {
      const boutiqueId = await this.getBoutiqueId(req);
      await productsService.deleteProductImage(req.params.productId, req.params.imageId, boutiqueId, req.user.id);
      return res.json({ success: true, message: 'Image deleted successfully' });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  // ── Variant Attributes ──────────────────────────────────────────────
  listVariantAttributes = async (req, res) => {
    try {
      const attrs = await productsService.listVariantAttributes(req.params.productId);
      return res.json({ success: true, data: attrs });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  };

  createVariantAttribute = async (req, res) => {
    try {
      const boutiqueId = req.user.assignedBoutiqueId;
      const attr = await productsService.createVariantAttribute(req.params.productId, boutiqueId, req.body);
      return res.status(201).json({ success: true, data: attr });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  deleteVariantAttribute = async (req, res) => {
    try {
      const boutiqueId = req.user.assignedBoutiqueId;
      await productsService.deleteVariantAttribute(req.params.productId, boutiqueId, req.params.attrId);
      return res.json({ success: true, message: 'Attribute deleted successfully' });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  // ── Product Variants ────────────────────────────────────────────────
  listVariants = async (req, res) => {
    try {
      const variants = await productsService.listVariants(req.params.productId);
      return res.json({ success: true, data: variants });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  };

  createVariant = async (req, res) => {
    try {
      const boutiqueId = req.user.assignedBoutiqueId;
      const variant = await productsService.createVariant(req.params.productId, boutiqueId, req.body);
      return res.status(201).json({ success: true, data: variant });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  updateVariant = async (req, res) => {
    try {
      const boutiqueId = req.user.assignedBoutiqueId;
      const variant = await productsService.updateVariant(req.params.productId, req.params.variantId, boutiqueId, req.body);
      return res.json({ success: true, data: variant });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  deleteVariant = async (req, res) => {
    try {
      const boutiqueId = req.user.assignedBoutiqueId;
      await productsService.deleteVariant(req.params.productId, req.params.variantId, boutiqueId);
      return res.json({ success: true, message: 'Variant deleted successfully' });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  // ── Product Inventory ───────────────────────────────────────────────
  getInventory = async (req, res) => {
    try {
      const inventory = await productsService.getInventory(req.params.productId, req.params.variantId);
      return res.json({ success: true, data: inventory });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  updateInventory = async (req, res) => {
    try {
      const boutiqueId = req.user.assignedBoutiqueId;
      const inventory = await productsService.updateInventory(req.params.productId, req.params.variantId, boutiqueId, req.body);
      return res.json({ success: true, data: inventory });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  // ── Inventory Logs ──────────────────────────────────────────────────
  createInventoryLog = async (req, res) => {
    try {
      const boutiqueId = req.user.assignedBoutiqueId;
      const log = await productsService.createInventoryLog(req.params.productId, boutiqueId, req.body, req.user.id);
      return res.status(201).json({ success: true, data: log });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  listInventoryLogs = async (req, res) => {
    try {
      const logs = await productsService.listInventoryLogs(req.params.productId);
      return res.json({ success: true, data: logs });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  };

  // ── Public Product APIs ─────────────────────────────────────────────
  publicBrowseProducts = async (req, res) => {
    try {
      const result = await productsService.publicBrowseProducts(req.query);
      return res.json(result);
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  };

  publicGetProductByIdOrSlug = async (req, res) => {
    try {
      const product = await productsService.publicGetProductByIdOrSlug(req.params.id);
      return res.json({ success: true, data: product });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  publicGetProductsByBoutiqueId = async (req, res) => {
    try {
      const result = await productsService.publicGetProductsByBoutiqueId(req.params.boutiqueId, req.query);
      return res.json(result);
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  };

  // ── Wishlist ────────────────────────────────────────────────────────
  getUserWishlist = async (req, res) => {
    try {
      const items = await productsService.getUserWishlist(req.user.id);
      return res.json({ success: true, data: items });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  };

  addToWishlist = async (req, res) => {
    try {
      const item = await productsService.addToWishlist(req.user.id, req.params.productId);
      return res.status(201).json({ success: true, data: item });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  removeFromWishlist = async (req, res) => {
    try {
      await productsService.removeFromWishlist(req.user.id, req.params.productId);
      return res.json({ success: true, message: 'Product removed from wishlist' });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };
}

module.exports = new ProductsController();

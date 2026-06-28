const prisma = require('../../../utils/prisma');

class ProductsRepository {
  // ── Brands ──────────────────────────────────────────────────────────
  async findBrandsByBoutiqueId(boutiqueId) {
    return prisma.productBrand.findMany({
      where: { boutiqueId },
      orderBy: { name: 'asc' }
    });
  }

  async findAllBrands() {
    return prisma.productBrand.findMany({
      include: { boutique: { select: { name: true } } },
      orderBy: { name: 'asc' }
    });
  }

  async createBrand(data) {
    return prisma.productBrand.create({ data });
  }

  async updateBrand(id, data) {
    return prisma.productBrand.update({
      where: { id },
      data
    });
  }

  async deleteBrand(id) {
    return prisma.productBrand.delete({ where: { id } });
  }

  async countProductsByBrandId(brandId) {
    return prisma.product.count({ where: { brandId } });
  }

  // ── Tags ────────────────────────────────────────────────────────────
  async findTagsByBoutiqueId(boutiqueId) {
    return prisma.productTag.findMany({
      where: { boutiqueId },
      orderBy: { name: 'asc' }
    });
  }

  async findAllTags() {
    return prisma.productTag.findMany({
      include: { boutique: { select: { name: true } } },
      orderBy: { name: 'asc' }
    });
  }

  async createTag(data) {
    return prisma.productTag.create({ data });
  }

  async updateTag(id, data) {
    return prisma.productTag.update({
      where: { id },
      data
    });
  }

  async deleteTag(id) {
    return prisma.productTag.delete({ where: { id } });
  }

  // ── Products ────────────────────────────────────────────────────────
  async findProducts(where, skip, limit, orderBy, include) {
    return prisma.product.findMany({
      where,
      include,
      orderBy,
      skip,
      take: limit
    });
  }

  async countProducts(where) {
    return prisma.product.count({ where });
  }

  async findProductById(id, include) {
    return prisma.product.findFirst({
      where: { id, isDeleted: false },
      include
    });
  }

  async findProductBySku(sku, boutiqueId) {
    return prisma.product.findFirst({
      where: { sku, boutiqueId, isDeleted: false }
    });
  }

  async createProduct(data, include) {
    return prisma.product.create({
      data,
      include
    });
  }

  async updateProduct(id, data, include) {
    return prisma.product.update({
      where: { id },
      data,
      include
    });
  }

  async deleteProductTags(productId) {
    return prisma.productToProductTag.deleteMany({
      where: { A: productId }
    });
  }

  async softDeleteProduct(id) {
    return prisma.product.update({
      where: { id },
      data: { isDeleted: true }
    });
  }

  // ── Product Images ──────────────────────────────────────────────────
  async findImagesByProductId(productId) {
    return prisma.productImage.findMany({
      where: { productId },
      orderBy: { sortOrder: 'asc' }
    });
  }

  async findImageById(id) {
    return prisma.productImage.findUnique({
      where: { id }
    });
  }

  async findImageByFields(id, productId) {
    return prisma.productImage.findFirst({
      where: { id, productId }
    });
  }

  async countImagesByProductId(productId) {
    return prisma.productImage.count({
      where: { productId }
    });
  }

  async unsetPrimaryImages(productId) {
    return prisma.productImage.updateMany({
      where: { productId, isPrimary: true },
      data: { isPrimary: false }
    });
  }

  async unsetPrimaryImagesExcept(productId, imageId) {
    return prisma.productImage.updateMany({
      where: { productId, isPrimary: true, id: { not: imageId } },
      data: { isPrimary: false }
    });
  }

  async createImage(data) {
    return prisma.productImage.create({ data });
  }

  async updateImage(id, data) {
    return prisma.productImage.update({
      where: { id },
      data
    });
  }

  async deleteImage(id) {
    return prisma.productImage.delete({ where: { id } });
  }

  // ── Variant Attributes ──────────────────────────────────────────────
  async findVariantAttributesByProductId(productId) {
    return prisma.productVariantAttribute.findMany({
      where: { productId }
    });
  }

  async createVariantAttribute(data) {
    return prisma.productVariantAttribute.create({ data });
  }

  async deleteVariantAttribute(id) {
    return prisma.productVariantAttribute.delete({ where: { id } });
  }

  // ── Product Variants ────────────────────────────────────────────────
  async findVariantsByProductId(productId) {
    return prisma.productVariant.findMany({
      where: { productId },
      include: { inventory: true },
      orderBy: { sortOrder: 'asc' }
    });
  }

  async createVariant(data) {
    return prisma.productVariant.create({
      data,
      include: { inventory: true }
    });
  }

  async findVariantById(id) {
    return prisma.productVariant.findUnique({
      where: { id },
      include: { inventory: true }
    });
  }

  async updateVariant(id, data) {
    return prisma.productVariant.update({
      where: { id },
      data,
      include: { inventory: true }
    });
  }

  async deleteVariant(id) {
    return prisma.productVariant.delete({ where: { id } });
  }

  // ── Product Inventory ───────────────────────────────────────────────
  async findInventoryByVariantId(variantId) {
    return prisma.productInventory.findUnique({
      where: { variantId }
    });
  }

  async createInventory(data) {
    return prisma.productInventory.create({ data });
  }

  async upsertInventory(variantId, data) {
    return prisma.productInventory.upsert({
      where: { variantId },
      create: { variantId, ...data },
      update: data
    });
  }

  // ── Inventory Logs ──────────────────────────────────────────────────
  async createInventoryLog(data) {
    return prisma.productInventoryLog.create({ data });
  }

  async findInventoryLogsByProductId(productId, limit = 100) {
    return prisma.productInventoryLog.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  // ── Wishlist ────────────────────────────────────────────────────────
  async findWishlistByUserId(userId) {
    return prisma.productWishlist.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            images: { where: { isPrimary: true }, take: 1 },
            brand: { select: { id: true, name: true } },
            boutique: { select: { id: true, name: true, city: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findWishlistItem(userId, productId) {
    return prisma.productWishlist.findUnique({
      where: { userId_productId: { userId, productId } }
    });
  }

  async createWishlistItem(userId, productId) {
    return prisma.productWishlist.create({
      data: { userId, productId }
    });
  }

  async deleteWishlistItem(userId, productId) {
    return prisma.productWishlist.delete({
      where: { userId_productId: { userId, productId } }
    });
  }
}

module.exports = new ProductsRepository();

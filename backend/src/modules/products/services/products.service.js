const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { s3 } = require('../../../utils/s3');
const productsRepository = require('../repositories/products.repository');
const { logAction } = require('../../../services/auditService');
const { withSubscriptionGuard } = require('../../../services/subscriptionService');
const { parseDecimalOrNull } = require('../../../utils/parseDecimal');

const MAX_PRODUCT_IMAGES = 20;

function isValidUuid(id) {
  return typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

class ProductsService {
  mapProductResponse(product) {
    if (!product) return null;
    const mapped = {
      ...product,
      basePrice: Number(product.basePrice),
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
      costPrice: product.costPrice ? Number(product.costPrice) : null
    };
    if (product.ProductToProductTag) {
      mapped.tags = product.ProductToProductTag.map(pt => pt.product_tags).filter(Boolean);
      delete mapped.ProductToProductTag;
    }
    return mapped;
  }

  async validateProductOwnership(productId, boutiqueId) {
    if (!isValidUuid(productId)) {
      throw { status: 404, message: 'Product not found' };
    }
    const product = await productsRepository.findProductById(productId);
    if (!product || product.boutiqueId !== boutiqueId) {
      throw { status: 404, message: 'Product not found' };
    }
    return product;
  }

  productIncludes = {
    brand: true,
    category: { select: { id: true, name: true } },
    subCategory: { select: { id: true, name: true } },
    images: { orderBy: { sortOrder: 'asc' } },
    variants: { orderBy: { sortOrder: 'asc' }, include: { inventory: true } },
    ProductToProductTag: { include: { product_tags: { select: { id: true, name: true } } } }
  };

  validateProductInput(body, isUpdate = false) {
    const errors = [];
    if (!isUpdate) {
      if (!body.name) errors.push('Product name is required');
      if (body.basePrice === undefined || body.basePrice === null) errors.push('Base price is required');
      if (parseDecimalOrNull(body.basePrice) === null) errors.push('Base price must be a valid number');
    } else {
      if (body.name !== undefined && !body.name) errors.push('Product name cannot be empty');
      if (body.basePrice !== undefined && parseDecimalOrNull(body.basePrice) === null) errors.push('Base price must be a valid number');
    }
    return errors;
  }

  // ── Brands ──────────────────────────────────────────────────────────
  async listBrands(boutiqueId) {
    return productsRepository.findBrandsByBoutiqueId(boutiqueId);
  }

  async listAllBrands() {
    return productsRepository.findAllBrands();
  }

  async createBrand(body, boutiqueId) {
    const { name, description, logo } = body;
    if (!name) {
      throw { status: 400, message: 'Brand name is required' };
    }
    try {
      return await productsRepository.createBrand({ name, description, logo, boutiqueId });
    } catch (err) {
      if (err.code === 'P2002') {
        throw { status: 409, message: 'Brand name already exists for this boutique' };
      }
      throw err;
    }
  }

  async updateBrand(id, body) {
    const { name, description, logo, isActive } = body;
    try {
      return await productsRepository.updateBrand(id, { name, description, logo, isActive });
    } catch (err) {
      if (err.code === 'P2002') {
        throw { status: 409, message: 'Brand name already exists' };
      }
      if (err.code === 'P2025') {
        throw { status: 404, message: 'Brand not found' };
      }
      throw err;
    }
  }

  async deleteBrand(id) {
    const productCount = await productsRepository.countProductsByBrandId(id);
    if (productCount > 0) {
      throw {
        status: 400,
        message: `Cannot delete brand: ${productCount} product(s) are linked to this brand. Remove the brand reference from products first.`
      };
    }
    try {
      await productsRepository.deleteBrand(id);
    } catch (err) {
      if (err.code === 'P2025') {
        throw { status: 404, message: 'Brand not found' };
      }
      throw err;
    }
  }

  // ── Tags ────────────────────────────────────────────────────────────
  async listTags(boutiqueId) {
    return productsRepository.findTagsByBoutiqueId(boutiqueId);
  }

  async listAllTags() {
    return productsRepository.findAllTags();
  }

  async createTag(body, boutiqueId) {
    const { name } = body;
    if (!name) {
      throw { status: 400, message: 'Tag name is required' };
    }
    try {
      return await productsRepository.createTag({ name, boutiqueId });
    } catch (err) {
      if (err.code === 'P2002') {
        throw { status: 409, message: 'Tag name already exists for this boutique' };
      }
      throw err;
    }
  }

  async updateTag(id, body) {
    const { name, isActive } = body;
    try {
      return await productsRepository.updateTag(id, { name, isActive });
    } catch (err) {
      if (err.code === 'P2002') {
        throw { status: 409, message: 'Tag name already exists' };
      }
      if (err.code === 'P2025') {
        throw { status: 404, message: 'Tag not found' };
      }
      throw err;
    }
  }

  async deleteTag(id) {
    try {
      await productsRepository.deleteTag(id);
    } catch (err) {
      if (err.code === 'P2025') {
        throw { status: 404, message: 'Tag not found' };
      }
      throw err;
    }
  }

  // ── Products ────────────────────────────────────────────────────────
  async listBoutiqueProducts(boutiqueId, query) {
    const { status, search, categoryId, subCategoryId, page = 1, limit = 20 } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {
      boutiqueId,
      isDeleted: false
    };
    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;
    if (subCategoryId) where.subCategoryId = subCategoryId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [products, total] = await Promise.all([
      productsRepository.findProducts(where, skip, parseInt(limit), { createdAt: 'desc' }, this.productIncludes),
      productsRepository.countProducts(where)
    ]);

    return {
      data: products.map(p => this.mapProductResponse(p)),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    };
  }

  async listAllProducts() {
    const include = {
      ...this.productIncludes,
      boutique: { select: { id: true, name: true } }
    };
    const products = await productsRepository.findProducts({ isDeleted: false }, undefined, undefined, { createdAt: 'desc' }, include);
    return products.map(p => this.mapProductResponse(p));
  }

  async getProductDetailsForOwner(id, boutiqueId) {
    if (!isValidUuid(id)) {
      throw { status: 404, message: 'Product not found' };
    }
    const include = {
      ...this.productIncludes,
      variantAttributes: true,
      inventoryLogs: { orderBy: { createdAt: 'desc' }, take: 50 }
    };
    const product = await productsRepository.findProductById(id, include);
    if (!product || product.boutiqueId !== boutiqueId) {
      throw { status: 404, message: 'Product not found' };
    }
    return this.mapProductResponse(product);
  }

  async createProduct(body, boutiqueId, userId, enforceCategory = false) {
    const errors = this.validateProductInput(body);
    if (errors.length > 0) {
      throw { status: 400, message: errors.join('; ') };
    }

    const { name, description, shortDescription, sku, barcode, basePrice, compareAtPrice, costPrice,
      productType, deliveryType, weight, length, width, height, categoryId, subCategoryId, brandId,
      tags, isFeatured, isMarketplaceVisible, isTaxable, seoTitle, seoDescription, seoSlug } = body;

    if (enforceCategory) {
      if (!categoryId) throw { status: 400, message: 'Category is required' };
      if (!subCategoryId) throw { status: 400, message: 'SubCategory is required' };
    }

    try {
      const product = await withSubscriptionGuard(boutiqueId, 'readyMadeProducts', async (tx) => {
        return await tx.product.create({
          data: {
            boutiqueId,
            name, description, shortDescription, sku, barcode,
            basePrice: parseDecimalOrNull(basePrice),
            compareAtPrice: parseDecimalOrNull(compareAtPrice),
            costPrice: parseDecimalOrNull(costPrice),
            productType: productType || 'READY_MADE',
            deliveryType: deliveryType || 'STANDARD',
            weight: parseDecimalOrNull(weight), length: parseDecimalOrNull(length),
            width: parseDecimalOrNull(width), height: parseDecimalOrNull(height),
            categoryId: categoryId || null,
            subCategoryId: subCategoryId || null,
            brandId: brandId || null,
            isFeatured: isFeatured ?? false,
            isMarketplaceVisible: isMarketplaceVisible ?? true,
            isTaxable: isTaxable ?? true,
            seoTitle, seoDescription, seoSlug,
            ProductToProductTag: tags ? { create: tags.map(id => ({ B: id })) } : undefined
          },
          include: this.productIncludes
        });
      });

      await logAction('CREATE_PRODUCT', 'product', product.id, userId, { boutiqueId });

      return this.mapProductResponse(product);
    } catch (err) {
      if (err.code === 'P2002') {
        throw { status: 409, message: 'A product with this SKU already exists' };
      }
      if (err.message && (err.message.includes('limit reached') || err.message.includes('not allowed') || err.message.includes('not enabled'))) {
        throw { status: 403, message: err.message };
      }
      throw err;
    }
  }

  async updateProduct(id, body, boutiqueId, userId) {
    const errors = this.validateProductInput(body, true);
    if (errors.length > 0) {
      throw { status: 400, message: errors.join('; ') };
    }

    if (!isValidUuid(id)) {
      throw { status: 404, message: 'Product not found' };
    }
    const existing = await productsRepository.findProductById(id);
    if (!existing || existing.boutiqueId !== boutiqueId) {
      throw { status: 404, message: 'Product not found' };
    }

    const { name, description, shortDescription, sku, barcode, basePrice, compareAtPrice, costPrice,
      productType, deliveryType, weight, length, width, height, status, categoryId, subCategoryId, brandId,
      tags, isFeatured, isMarketplaceVisible, isTaxable, isDeleted, seoTitle, seoDescription, seoSlug } = body;

    const data = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (shortDescription !== undefined) data.shortDescription = shortDescription;
    if (sku !== undefined) data.sku = sku;
    if (barcode !== undefined) data.barcode = barcode;
    if (basePrice !== undefined) data.basePrice = parseDecimalOrNull(basePrice);
    if (compareAtPrice !== undefined) data.compareAtPrice = parseDecimalOrNull(compareAtPrice);
    if (costPrice !== undefined) data.costPrice = parseDecimalOrNull(costPrice);
    if (productType !== undefined) data.productType = productType;
    if (deliveryType !== undefined) data.deliveryType = deliveryType;
    if (weight !== undefined) data.weight = parseDecimalOrNull(weight);
    if (length !== undefined) data.length = parseDecimalOrNull(length);
    if (width !== undefined) data.width = parseDecimalOrNull(width);
    if (height !== undefined) data.height = parseDecimalOrNull(height);
    if (status !== undefined) data.status = status;
    if (categoryId !== undefined) data.categoryId = categoryId;
    if (subCategoryId !== undefined) data.subCategoryId = subCategoryId;
    if (brandId !== undefined) data.brandId = brandId || null;
    if (isFeatured !== undefined) data.isFeatured = isFeatured;
    if (isMarketplaceVisible !== undefined) data.isMarketplaceVisible = isMarketplaceVisible;
    if (isTaxable !== undefined) data.isTaxable = isTaxable;
    if (isDeleted !== undefined) data.isDeleted = isDeleted;
    if (seoTitle !== undefined) data.seoTitle = seoTitle;
    if (seoDescription !== undefined) data.seoDescription = seoDescription;
    if (seoSlug !== undefined) data.seoSlug = seoSlug;

    if (tags !== undefined) {
      await productsRepository.deleteProductTags(id);
      if (tags.length > 0) {
        data.ProductToProductTag = {
          create: tags.map(tagId => ({ B: tagId }))
        };
      }
    }

    try {
      const product = await productsRepository.updateProduct(id, data, this.productIncludes);
      await logAction('UPDATE_PRODUCT', 'product', product.id, userId, { boutiqueId });
      return this.mapProductResponse(product);
    } catch (err) {
      if (err.code === 'P2002') {
        throw { status: 409, message: 'A product with this SKU already exists' };
      }
      if (err.code === 'P2025') {
        throw { status: 404, message: 'Product not found' };
      }
      throw err;
    }
  }

  async deleteProduct(id, boutiqueId, userId) {
    if (!isValidUuid(id)) {
      throw { status: 404, message: 'Product not found' };
    }
    const existing = await productsRepository.findProductById(id);
    if (!existing || existing.boutiqueId !== boutiqueId) {
      throw { status: 404, message: 'Product not found' };
    }
    await productsRepository.softDeleteProduct(id);
    await logAction('DELETE_PRODUCT', 'product', id, userId, { boutiqueId });
  }

  // ── Product Images ──────────────────────────────────────────────────
  async listProductImages(productId, boutiqueId = null) {
    if (boutiqueId) {
      await this.validateProductOwnership(productId, boutiqueId);
    }
    return productsRepository.findImagesByProductId(productId);
  }

  async addProductImage(productId, boutiqueId, body, userId) {
    await this.validateProductOwnership(productId, boutiqueId);

    const { url, alt, sortOrder, isPrimary } = body;
    if (!url) {
      throw { status: 400, message: 'Image URL is required' };
    }

    const existingCount = await productsRepository.countImagesByProductId(productId);
    if (existingCount >= MAX_PRODUCT_IMAGES) {
      throw {
        status: 403,
        message: `Maximum of ${MAX_PRODUCT_IMAGES} images per product reached. Upgrade your plan to add more.`
      };
    }

    if (isPrimary) {
      await productsRepository.unsetPrimaryImages(productId);
    }

    const image = await productsRepository.createImage({
      productId,
      url,
      alt: alt || null,
      sortOrder: sortOrder ?? existingCount + 1,
      isPrimary: isPrimary ?? (existingCount === 0)
    });

    await logAction('CREATE_PRODUCT_IMAGE', 'product_image', image.id, userId, {
      productId,
      boutiqueId
    });

    return image;
  }

  async updateProductImage(productId, imageId, boutiqueId, body) {
    await this.validateProductOwnership(productId, boutiqueId);

    if (!isValidUuid(imageId)) {
      throw { status: 404, message: 'Image not found' };
    }
    const existing = await productsRepository.findImageByFields(imageId, productId);
    if (!existing) {
      throw { status: 404, message: 'Image not found' };
    }

    const { url, alt, sortOrder, isPrimary } = body;

    if (isPrimary) {
      await productsRepository.unsetPrimaryImagesExcept(productId, imageId);
    }

    const data = {};
    if (url !== undefined) data.url = url;
    if (alt !== undefined) data.alt = alt;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;
    if (isPrimary !== undefined) data.isPrimary = isPrimary;

    try {
      return await productsRepository.updateImage(imageId, data);
    } catch (err) {
      if (err.code === 'P2025') {
        throw { status: 404, message: 'Image not found' };
      }
      throw err;
    }
  }

  async deleteProductImage(productId, imageId, boutiqueId, userId) {
    await this.validateProductOwnership(productId, boutiqueId);

    if (!isValidUuid(imageId)) {
      throw { status: 404, message: 'Image not found' };
    }
    const existing = await productsRepository.findImageByFields(imageId, productId);
    if (!existing) {
      throw { status: 404, message: 'Image not found' };
    }

    if (existing.url && process.env.AWS_BUCKET_NAME) {
      try {
        const urlObj = new URL(existing.url);
        const key = urlObj.pathname.replace(/^\//, '');
        await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: key }));
      } catch (s3Err) {
        console.warn('[S3 Delete Warning]', s3Err.message);
      }
    }

    try {
      await productsRepository.deleteImage(imageId);
      await logAction('DELETE_PRODUCT_IMAGE', 'product_image', imageId, userId, {
        productId,
        boutiqueId
      });
    } catch (err) {
      if (err.code === 'P2025') {
        throw { status: 404, message: 'Image not found' };
      }
      throw err;
    }
  }

  // ── Variant Attributes ──────────────────────────────────────────────
  async listVariantAttributes(productId) {
    return productsRepository.findVariantAttributesByProductId(productId);
  }

  async createVariantAttribute(productId, boutiqueId, body) {
    await this.validateProductOwnership(productId, boutiqueId);

    const { name, values } = body;
    if (!name) throw { status: 400, message: 'Attribute name is required' };
    if (!values || !Array.isArray(values)) throw { status: 400, message: 'Attribute values must be an array' };

    return productsRepository.createVariantAttribute({ productId, name, values });
  }

  async deleteVariantAttribute(productId, boutiqueId, attrId) {
    await this.validateProductOwnership(productId, boutiqueId);
    try {
      await productsRepository.deleteVariantAttribute(attrId);
    } catch (err) {
      if (err.code === 'P2025') throw { status: 404, message: 'Attribute not found' };
      throw err;
    }
  }

  // ── Product Variants ────────────────────────────────────────────────
  async listVariants(productId) {
    return productsRepository.findVariantsByProductId(productId);
  }

  async createVariant(productId, boutiqueId, body) {
    await this.validateProductOwnership(productId, boutiqueId);

    const { sku, name, attributes, price, compareAtPrice, sortOrder } = body;
    if (!name) throw { status: 400, message: 'Variant name is required' };

    try {
      const variant = await productsRepository.createVariant({
        productId, sku, name,
        attributes: attributes || undefined,
        price: parseDecimalOrNull(price),
        compareAtPrice: parseDecimalOrNull(compareAtPrice),
        sortOrder: sortOrder ?? 0
      });

      // Auto-create inventory record for the variant
      await productsRepository.createInventory({ variantId: variant.id });

      return productsRepository.findVariantById(variant.id);
    } catch (err) {
      if (err.code === 'P2002') {
        throw { status: 409, message: 'A variant with this SKU already exists for this product' };
      }
      throw err;
    }
  }

  async updateVariant(productId, variantId, boutiqueId, body) {
    await this.validateProductOwnership(productId, boutiqueId);

    const { sku, name, attributes, price, compareAtPrice, status, sortOrder } = body;
    const data = {};
    if (sku !== undefined) data.sku = sku;
    if (name !== undefined) data.name = name;
    if (attributes !== undefined) data.attributes = attributes;
    if (price !== undefined) data.price = parseDecimalOrNull(price);
    if (compareAtPrice !== undefined) data.compareAtPrice = parseDecimalOrNull(compareAtPrice);
    if (status !== undefined) data.status = status;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;

    try {
      return await productsRepository.updateVariant(variantId, data);
    } catch (err) {
      if (err.code === 'P2002') {
        throw { status: 409, message: 'A variant with this SKU already exists' };
      }
      if (err.code === 'P2025') {
        throw { status: 404, message: 'Variant not found' };
      }
      throw err;
    }
  }

  async deleteVariant(productId, variantId, boutiqueId) {
    await this.validateProductOwnership(productId, boutiqueId);
    try {
      await productsRepository.deleteVariant(variantId);
    } catch (err) {
      if (err.code === 'P2025') {
        throw { status: 404, message: 'Variant not found' };
      }
      throw err;
    }
  }

  // ── Product Inventory ───────────────────────────────────────────────
  async getInventory(productId, variantId) {
    const inventory = await productsRepository.findInventoryByVariantId(variantId);
    if (!inventory) {
      throw { status: 404, message: 'Inventory not found for this variant' };
    }
    return inventory;
  }

  async updateInventory(productId, variantId, boutiqueId, body) {
    await this.validateProductOwnership(productId, boutiqueId);

    const { quantity, reservedQuantity, lowStockThreshold, trackInventory } = body;
    const data = {};
    if (quantity !== undefined) data.quantity = quantity;
    if (reservedQuantity !== undefined) data.reservedQuantity = reservedQuantity;
    if (lowStockThreshold !== undefined) data.lowStockThreshold = lowStockThreshold;
    if (trackInventory !== undefined) data.trackInventory = trackInventory;

    return productsRepository.upsertInventory(variantId, data);
  }

  // ── Inventory Logs ──────────────────────────────────────────────────
  async createInventoryLog(productId, boutiqueId, body, userId) {
    await this.validateProductOwnership(productId, boutiqueId);

    const { variantId, change, reason, reference } = body;
    if (change === undefined || change === null) {
      throw { status: 400, message: 'Change amount is required' };
    }
    if (!reason) {
      throw { status: 400, message: 'Change reason is required' };
    }

    let currentQuantity = 0;
    if (variantId) {
      const inv = await productsRepository.findInventoryByVariantId(variantId);
      currentQuantity = inv ? inv.quantity : 0;
    }

    return productsRepository.createInventoryLog({
      productId,
      variantId,
      change,
      quantityBefore: currentQuantity,
      quantityAfter: currentQuantity + change,
      reason,
      reference,
      createdBy: userId
    });
  }

  async listInventoryLogs(productId) {
    return productsRepository.findInventoryLogsByProductId(productId);
  }

  // ── Public Product APIs ─────────────────────────────────────────────
  async publicBrowseProducts(query) {
    const { search, categoryId, subCategoryId, minPrice, maxPrice, sort, page = 1, limit = 20, boutiqueId: filterBoutique } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {
      isDeleted: false,
      status: 'ACTIVE',
      isMarketplaceVisible: true
    };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (subCategoryId) where.subCategoryId = subCategoryId;
    if (filterBoutique) where.boutiqueId = filterBoutique;
    if (minPrice || maxPrice) {
      where.basePrice = {};
      if (minPrice) where.basePrice.gte = parseDecimalOrNull(minPrice);
      if (maxPrice) where.basePrice.lte = parseDecimalOrNull(maxPrice);
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'price_asc') orderBy = { basePrice: 'asc' };
    else if (sort === 'price_desc') orderBy = { basePrice: 'desc' };
    else if (sort === 'name') orderBy = { name: 'asc' };
    else if (sort === 'oldest') orderBy = { createdAt: 'asc' };

    const include = {
      images: { where: { isPrimary: true }, take: 1 },
      brand: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
      boutique: { select: { id: true, name: true, city: true, rating: true } },
      variants: {
        where: { status: 'ACTIVE' },
        select: { id: true, price: true, name: true },
        orderBy: { price: 'asc' }
      }
    };

    const [products, total] = await Promise.all([
      productsRepository.findProducts(where, skip, parseInt(limit), orderBy, include),
      productsRepository.countProducts(where)
    ]);

    const mapped = products.map(p => ({
      ...p,
      basePrice: Number(p.basePrice),
      variants: p.variants.map(v => ({ ...v, price: v.price ? Number(v.price) : null }))
    }));

    return {
      data: mapped,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    };
  }

  async publicGetProductByIdOrSlug(id) {
    const include = {
      brand: true,
      category: { select: { id: true, name: true } },
      subCategory: { select: { id: true, name: true } },
      images: { orderBy: { sortOrder: 'asc' } },
      variantAttributes: true,
      variants: {
        where: { status: 'ACTIVE' },
        include: { inventory: { select: { quantity: true, trackInventory: true, lowStockThreshold: true } } },
        orderBy: { sortOrder: 'asc' }
      },
      ProductToProductTag: { include: { product_tags: { select: { id: true, name: true } } } },
      boutique: { select: { id: true, name: true, city: true, rating: true, reviewsCount: true } }
    };

    const where = {
      OR: [
        { id },
        { seoSlug: id }
      ],
      isDeleted: false,
      status: 'ACTIVE',
      isMarketplaceVisible: true
    };

    const products = await productsRepository.findProducts(where, undefined, 1, undefined, include);
    const product = products[0];
    if (!product) {
      throw { status: 404, message: 'Product not found' };
    }

    return this.mapProductResponse(product);
  }

  async publicGetProductsByBoutiqueId(boutiqueId, query) {
    const { page = 1, limit = 20 } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {
      boutiqueId,
      isDeleted: false,
      status: 'ACTIVE',
      isMarketplaceVisible: true
    };
    const include = {
      images: { where: { isPrimary: true }, take: 1 },
      category: { select: { id: true, name: true } }
    };

    const [products, total] = await Promise.all([
      productsRepository.findProducts(where, skip, parseInt(limit), { createdAt: 'desc' }, include),
      productsRepository.countProducts(where)
    ]);

    return {
      data: products.map(p => ({ ...p, basePrice: Number(p.basePrice) })),
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    };
  }

  // ── Wishlist ────────────────────────────────────────────────────────
  async getUserWishlist(userId) {
    return productsRepository.findWishlistByUserId(userId);
  }

  async addToWishlist(userId, productId) {
    if (!isValidUuid(productId)) {
      throw { status: 404, message: 'Product not found or not available' };
    }
    const prodCheck = await productsRepository.findProductById(productId);
    if (!prodCheck || prodCheck.status !== 'ACTIVE') {
      throw { status: 404, message: 'Product not found or not available' };
    }

    const existing = await productsRepository.findWishlistItem(userId, productId);
    if (existing) {
      throw { status: 409, message: 'Product already in wishlist' };
    }

    try {
      return await productsRepository.createWishlistItem(userId, productId);
    } catch (err) {
      if (err.code === 'P2003') {
        throw { status: 404, message: 'Product not found' };
      }
      throw err;
    }
  }

  async removeFromWishlist(userId, productId) {
    if (!isValidUuid(productId)) {
      throw { status: 404, message: 'Wishlist item not found' };
    }
    try {
      await productsRepository.deleteWishlistItem(userId, productId);
    } catch (err) {
      if (err.code === 'P2025') {
        throw { status: 404, message: 'Wishlist item not found' };
      }
      throw err;
    }
  }
}

module.exports = new ProductsService();

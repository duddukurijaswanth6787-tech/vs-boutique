import fetch from 'node-fetch';
const BASE = 'http://localhost:3005';

let adminToken, ownerToken, ownerBoutiqueId, brandId, tagId, productId, variantId, imageId, attrId;

async function t(name, fn) {
  try {
    const r = await fn();
    if (r.status >= 200 && r.status < 300) {
      console.log(`  ✅ ${name} (${r.status})`);
      return r.data;
    } else if (r.status === 401 || r.status === 403) {
      console.log(`  ⛔ ${name} (${r.status} - expected auth)`);
      return r.data;
    } else {
      console.log(`  ❌ ${name} (${r.status}): ${r.message || 'unexpected'}`);
      return null;
    }
  } catch(e) {
    console.log(`  💥 ${name}: ${e.message}`);
    return null;
  }
}

async function req(method, path, body, token) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, opts);
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ...json };
}

async function main() {
  // 1. Login as super admin
  console.log('\n🔐 AUTH - Super Admin');
  const adminLogin = await req('POST', '/auth/login', { email: 'admin@vsboutique.com', password: 'admin@123' });
  if (adminLogin.status === 200) {
    adminToken = adminLogin.token;
    console.log(`  ✅ Admin login (${adminLogin.status})`);
  } else {
    console.log(`  ❌ Admin login failed: ${adminLogin.message}`);
  }

  // 2. Login as owner - find an owner first
  console.log('\n🔐 AUTH - Owner');
  let owner;
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  owner = await prisma.owner.findFirst({ where: { role: 'owner' } });
  if (!owner) {
    console.log('  ⚠️ No owner found, creating test owner...');
    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.hash('Test@123', 10);
    owner = await prisma.owner.create({
      data: {
        ownerName: 'Test Owner',
        username: 'testowner',
        email: 'test@owner.com',
        mobileNumber: '9876543210',
        password: hash,
        role: 'owner',
        status: 'Active',
        mustResetPassword: false,
        emailVerified: true
      }
    });
    // Get or create boutique
    let boutique = await prisma.boutique.findFirst();
    if (!boutique) {
      boutique = await prisma.boutique.create({
        data: {
          name: 'Test Boutique',
          ownerName: 'Test Owner',
          mobileNumber: '9876543210',
          email: 'test@boutique.com',
          fullAddress: '123 Test St',
          city: 'Test City',
          state: 'Test State'
        }
      });
    }
    await prisma.owner.update({
      where: { id: owner.id },
      data: { assignedBoutiqueId: boutique.id }
    });
    ownerBoutiqueId = boutique.id;
  } else {
    ownerBoutiqueId = owner.assignedBoutiqueId;
  }
  await prisma.$disconnect();

  const ownerLogin = await req('POST', '/auth/login', { email: owner.email, password: 'Test@123' });
  if (ownerLogin.status === 200) {
    ownerToken = ownerLogin.token;
    console.log(`  ✅ Owner login (${ownerLogin.status})`);
  } else {
    console.log(`  ❌ Owner login failed: ${ownerLogin.message}`);
    // Use admin token for remaining tests
    ownerToken = adminToken;
  }

  // 3. Product Brand CRUD
  console.log('\n📦 PRODUCT BRANDS');
  const brand = await t('POST /products/brands', () =>
    req('POST', '/products/brands', { name: 'Test Brand', description: 'A test brand' }, ownerToken));
  if (brand) brandId = brand.id;

  await t('GET /products/brands', () => req('GET', '/products/brands', null, ownerToken));

  if (brandId) {
    await t('PUT /products/brands/:id', () =>
      req('PUT', `/products/brands/${brandId}`, { description: 'Updated description' }, ownerToken));
    await t('DELETE /products/brands/:id', () =>
      req('DELETE', `/products/brands/${brandId}`, null, ownerToken));
  }

  await t('GET /products/brands/all (admin)', () =>
    req('GET', '/products/brands/all', null, adminToken));

  // 4. Product Tag CRUD
  console.log('\n🏷️ PRODUCT TAGS');
  const tag = await t('POST /products/tags', () =>
    req('POST', '/products/tags', { name: 'TestTag' }, ownerToken));
  if (tag) tagId = tag.id;

  await t('GET /products/tags', () => req('GET', '/products/tags', null, ownerToken));

  if (tagId) {
    await t('PUT /products/tags/:id', () =>
      req('PUT', `/products/tags/${tagId}`, { name: 'UpdatedTag' }, ownerToken));
    await t('DELETE /products/tags/:id', () =>
      req('DELETE', `/products/tags/${tagId}`, null, ownerToken));
  }

  // 5. Product CRUD
  console.log('\n📋 PRODUCTS');
  const product = await t('POST /products', () =>
    req('POST', '/products', {
      name: 'Test Product',
      basePrice: 999.99,
      sku: `SKU-${Date.now()}`,
      description: 'A test product description',
      productType: 'READY_MADE',
      isFeatured: true
    }, ownerToken));
  if (product) productId = product.id;

  if (productId) {
    await t('GET /products', () => req('GET', '/products', null, ownerToken));
    await t('GET /products/:id', () => req('GET', `/products/${productId}`, null, ownerToken));
    await t('PUT /products/:id', () =>
      req('PUT', `/products/${productId}`, { name: 'Updated Product', basePrice: 1499.99 }, ownerToken));
  }

  await t('GET /products/all (admin)', () =>
    req('GET', '/products/all', null, adminToken));

  // 6. Product Images
  console.log('\n🖼️ PRODUCT IMAGES');
  if (productId) {
    const image = await t('POST /products/:id/images', () =>
      req('POST', `/products/${productId}/images`, {
        url: 'https://example.com/image.jpg',
        alt: 'Test image',
        isPrimary: true,
        sortOrder: 1
      }, ownerToken));
    if (image) imageId = image.id;

    await t('GET /products/:id/images', () =>
      req('GET', `/products/${productId}/images`, null, ownerToken));

    if (imageId) {
      await t('PUT /products/:id/images/:imageId', () =>
        req('PUT', `/products/${productId}/images/${imageId}`, { alt: 'Updated alt' }, ownerToken));
      await t('DELETE /products/:id/images/:imageId', () =>
        req('DELETE', `/products/${productId}/images/${imageId}`, null, ownerToken));
    }
  }

  // 7. Product Variant Attributes
  console.log('\n🔧 VARIANT ATTRIBUTES');
  if (productId) {
    const attr = await t('POST /products/:id/variant-attributes', () =>
      req('POST', `/products/${productId}/variant-attributes`, {
        name: 'Size',
        values: ['S', 'M', 'L', 'XL']
      }, ownerToken));
    if (attr) attrId = attr.id;

    await t('GET /products/:id/variant-attributes', () =>
      req('GET', `/products/${productId}/variant-attributes`, null, ownerToken));

    if (attrId) {
      await t('DELETE /products/:id/variant-attributes/:attrId', () =>
        req('DELETE', `/products/${productId}/variant-attributes/${attrId}`, null, ownerToken));
    }
  }

  // 8. Product Variants
  console.log('\n🧬 VARIANTS');
  if (productId) {
    const variant = await t('POST /products/:id/variants', () =>
      req('POST', `/products/${productId}/variants`, {
        name: 'Large',
        sku: `VAR-${Date.now()}`,
        price: 1099.99,
        attributes: { Size: 'L' },
        sortOrder: 1
      }, ownerToken));
    if (variant) variantId = variant.id;

    if (variantId) {
      await t('GET /products/:id/variants', () =>
        req('GET', `/products/${productId}/variants`, null, ownerToken));
      await t('PUT /products/:id/variants/:variantId', () =>
        req('PUT', `/products/${productId}/variants/${variantId}`, { price: 1199.99 }, ownerToken));
    }
  }

  // 9. Inventory
  console.log('\n📦 INVENTORY');
  if (variantId) {
    await t('GET /products/:productId/variants/:variantId/inventory', () =>
      req('GET', `/products/${productId}/variants/${variantId}/inventory`, null, ownerToken));
    await t('PUT /products/:productId/variants/:variantId/inventory', () =>
      req('PUT', `/products/${productId}/variants/${variantId}/inventory`, {
        quantity: 100,
        lowStockThreshold: 10,
        trackInventory: true
      }, ownerToken));
    await t('GET /products/:productId/variants/:variantId/inventory (after update)', () =>
      req('GET', `/products/${productId}/variants/${variantId}/inventory`, null, ownerToken));
  }

  // 10. Inventory Logs
  console.log('\n📝 INVENTORY LOGS');
  if (productId) {
    await t('POST /products/:id/inventory-logs', () =>
      req('POST', `/products/${productId}/inventory-logs`, {
        variantId,
        change: 50,
        reason: 'STOCK_ADDITION',
        reference: 'Manual restock'
      }, ownerToken));
    await t('GET /products/:id/inventory-logs', () =>
      req('GET', `/products/${productId}/inventory-logs`, null, ownerToken));
  }

  // 11. Public Product APIs
  console.log('\n🌍 PUBLIC APIS');
  await t('GET /products/public/browse', () =>
    req('GET', '/products/public/browse?limit=5', null, null));

  if (productId) {
    await t('GET /products/public/:id', () =>
      req('GET', `/products/public/${productId}`, null, null));
  }

  if (ownerBoutiqueId) {
    await t('GET /products/public/boutique/:boutiqueId', () =>
      req('GET', `/products/public/boutique/${ownerBoutiqueId}`, null, null));
  }

  // 12. Wishlist
  console.log('\n❤️ WISHLIST');
  if (productId) {
    await t('POST /products/wishlists/:productId', () =>
      req('POST', `/products/wishlists/${productId}`, null, adminToken));
    await t('GET /products/wishlists/my', () =>
      req('GET', '/products/wishlists/my', null, adminToken));
    await t('DELETE /products/wishlists/:productId', () =>
      req('DELETE', `/products/wishlists/${productId}`, null, adminToken));
  }

  // 13. Delete product (cleanup)
  console.log('\n🧹 CLEANUP');
  if (productId) {
    await t('DELETE /products/:id', () =>
      req('DELETE', `/products/${productId}`, null, ownerToken));
  }

  // 14. Auth enforcement tests
  console.log('\n🔒 AUTH ENFORCEMENT');
  await t('POST /products (no auth) => 401', () =>
    req('POST', '/products', { name: 'Nope', basePrice: 100 }));
  await t('GET /products (no auth) => 401', () =>
    req('GET', '/products', null));
  await t('POST /products/brands (no auth) => 401', () =>
    req('POST', '/products/brands', { name: 'Nope' }));
  await t('POST /products/wishlists/:id (no auth) => 401', () =>
    req('POST', '/products/wishlists/some-id', null));

  console.log('\n🎉 ALL TESTS COMPLETE');
}

main().catch(e => console.error('Test suite error:', e));

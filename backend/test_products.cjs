const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();
const BASE = 'http://localhost:3005';

let adminToken, ownerToken, ownerBoutiqueId, brandId, tagId, productId, variantId, imageId, attrId;
let passCount = 0, failCount = 0;

async function req(method, path, body, token) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, opts);
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ...json };
}

async function t(name, fn, expectStatus) {
  try {
    const r = await fn();
    const ok = typeof expectStatus === 'number'
      ? r.status === expectStatus
      : r.status >= 200 && r.status < 300;
    if (ok) {
      console.log(`  ✅ ${name} (${r.status})`);
      passCount++;
      return r.data || r;
    } else {
      console.log(`  ❌ ${name} (${r.status}): ${r.message || JSON.stringify(r).slice(0, 100)}`);
      failCount++;
      return null;
    }
  } catch(e) {
    console.log(`  💥 ${name}: ${e.message}`);
    failCount++;
    return null;
  }
}

async function main() {
  console.log('\n🔐 AUTH - Setting up test data...');
  
  // Create test boutique + owner if needed
  let owner = await prisma.owner.findFirst({ where: { email: 'producttest@owner.com' } });
  if (!owner) {
    const hash = await bcrypt.hash('Test@123', 10);
    const boutique = await prisma.boutique.create({
      data: {
        name: 'Product Test Boutique',
        ownerName: 'Product Tester',
        mobileNumber: '9999888777',
        email: 'producttest@boutique.com',
        fullAddress: '456 Test Ave',
        city: 'Testopolis',
        state: 'Test State',
        subscriptionEnforcement: false
      }
    });
    ownerBoutiqueId = boutique.id;
    owner = await prisma.owner.create({
      data: {
        ownerName: 'Product Tester',
        username: 'producttester',
        email: 'producttest@owner.com',
        mobileNumber: '9999888776',
        password: hash,
        role: 'owner',
        status: 'Active',
        assignedBoutiqueId: boutique.id,
        mustResetPassword: false,
        emailVerified: true
      }
    });
    console.log(`  ✅ Test owner created: ${owner.email}`);
  } else {
    ownerBoutiqueId = owner.assignedBoutiqueId;
    await prisma.boutique.update({
      where: { id: ownerBoutiqueId },
      data: { subscriptionEnforcement: false }
    });
    console.log(`  ✅ Found existing owner: ${owner.email}`);
  }

  // Login as admin
  const adminLogin = await req('POST', '/auth/login', { username: 'admin@vsboutique.com', password: 'admin@123' });
  if (adminLogin.status === 200) {
    adminToken = adminLogin.token;
    console.log(`  ✅ Admin logged in`);
    
    // Ensure User record for admin exists in users table to satisfy foreign key constraint on wishlist
    const adminOwner = await prisma.owner.findFirst({ where: { email: 'admin@vsboutique.com' } });
    if (adminOwner) {
      await prisma.user.upsert({
        where: { id: adminOwner.id },
        update: {},
        create: {
          id: adminOwner.id,
          phone: 'admin_test_phone',
          name: 'Admin Test User',
          status: 'ACTIVE'
        }
      });
      console.log(`  ✅ Ensured User record for admin exists in users table`);
    }
  } else {
    console.log(`  ❌ Admin login FAILED`);
  }

  // Login as owner
  const ownerLogin = await req('POST', '/auth/login', { username: owner.email, password: 'Test@123' });
  if (ownerLogin.status === 200) {
    ownerToken = ownerLogin.token;
    console.log(`  ✅ Owner logged in`);
  } else {
    console.log(`  ❌ Owner login FAILED`);
    return;
  }

  // ====== PRODUCT BRAND CRUD ======
  console.log('\n=== 📦 PRODUCT BRANDS ===');
  const brand = await t('POST /products/brands', () =>
    req('POST', '/products/brands', { name: 'Test Brand ' + Date.now(), description: 'A test brand' }, ownerToken));
  if (brand && brand.data) brandId = brand.data.id;
  else if (brand && brand.id) brandId = brand.id;

  await t('GET /products/brands (owner)', () =>
    req('GET', '/products/brands', null, ownerToken));

  if (brandId) {
    await t('PUT /products/brands/:id', () =>
      req('PUT', `/products/brands/${brandId}`, { description: 'Updated description' }, ownerToken));
    await t('DELETE /products/brands/:id', () =>
      req('DELETE', `/products/brands/${brandId}`, null, ownerToken));
  }

  await t('GET /products/brands/all (admin)', () =>
    req('GET', '/products/brands/all', null, adminToken));

  // ====== PRODUCT TAG CRUD ======
  console.log('\n=== 🏷️ PRODUCT TAGS ===');
  const tag = await t('POST /products/tags', () =>
    req('POST', '/products/tags', { name: 'TestTag' + Date.now() }, ownerToken));
  if (tag && tag.data) tagId = tag.data.id;
  else if (tag && tag.id) tagId = tag.id;

  await t('GET /products/tags (owner)', () =>
    req('GET', '/products/tags', null, ownerToken));

  if (tagId) {
    await t('PUT /products/tags/:id', () =>
      req('PUT', `/products/tags/${tagId}`, { name: 'UpdatedTag' + Date.now() }, ownerToken));
    await t('DELETE /products/tags/:id', () =>
      req('DELETE', `/products/tags/${tagId}`, null, ownerToken));
  }

  // ====== PRODUCT CRUD ======
  console.log('\n=== 📋 PRODUCTS ===');
  const product = await t('POST /products', () =>
    req('POST', '/products', {
      name: 'Test Product ' + Date.now(),
      basePrice: 999.99,
      sku: `SKU-${Date.now()}`,
      description: 'A comprehensive test product',
      shortDescription: 'Test product short desc',
      productType: 'READY_MADE',
      deliveryType: 'STANDARD',
      isFeatured: true,
      isTaxable: true
    }, ownerToken));
  
  if (product && product.data) productId = product.data.id;
  else if (product && product.id) productId = product.id;

  if (productId) {
    await t('GET /products (owner list)', () =>
      req('GET', `/products?limit=10`, null, ownerToken));
    await t('GET /products/:id (owner detail)', () =>
      req('GET', `/products/${productId}`, null, ownerToken));
    
    await t('PUT /products/:id (update)', () =>
      req('PUT', `/products/${productId}`, { 
        name: 'Updated Product', 
        basePrice: 1499.99,
        description: 'Updated description' 
      }, ownerToken));

    // Set status to ACTIVE for public API tests
    await t('PUT /products/:id (set ACTIVE)', () =>
      req('PUT', `/products/${productId}`, { status: 'ACTIVE' }, ownerToken));
  }

  await t('GET /products/all (admin)', () =>
    req('GET', '/products/all', null, adminToken));

  // ====== PRODUCT IMAGES ======
  console.log('\n=== 🖼️ PRODUCT IMAGES ===');
  if (productId) {
    const image = await t('POST /products/:id/images', () =>
      req('POST', `/products/${productId}/images`, {
        url: 'https://example.com/test-image.jpg',
        alt: 'Primary test image',
        isPrimary: true,
        sortOrder: 1
      }, ownerToken));
    if (image && image.data) imageId = image.data.id;
    else if (image && image.id) imageId = image.id;

    await t('GET /products/:id/images', () =>
      req('GET', `/products/${productId}/images`, null));

    if (imageId) {
      await t('PUT /products/:id/images/:imageId', () =>
        req('PUT', `/products/${productId}/images/${imageId}`, { alt: 'Updated alt text' }, ownerToken));
      await t('DELETE /products/:id/images/:imageId', () =>
        req('DELETE', `/products/${productId}/images/${imageId}`, null, ownerToken));
    }
  }

  // ====== VARIANT ATTRIBUTES ======
  console.log('\n=== 🔧 VARIANT ATTRIBUTES ===');
  if (productId) {
    const attr = await t('POST /products/:id/variant-attributes', () =>
      req('POST', `/products/${productId}/variant-attributes`, {
        name: 'Size',
        values: ['S', 'M', 'L', 'XL']
      }, ownerToken));
    if (attr && attr.data) attrId = attr.data.id;
    else if (attr && attr.id) attrId = attr.id;

    await t('GET /products/:id/variant-attributes', () =>
      req('GET', `/products/${productId}/variant-attributes`, null));

    if (attrId) {
      await t('DELETE /products/:id/variant-attributes/:attrId', () =>
        req('DELETE', `/products/${productId}/variant-attributes/${attrId}`, null, ownerToken));
    }
  }

  // ====== VARIANTS ======
  console.log('\n=== 🧬 VARIANTS ===');
  if (productId) {
    const variant = await t('POST /products/:id/variants', () =>
      req('POST', `/products/${productId}/variants`, {
        name: 'Medium',
        sku: `VAR-${Date.now()}`,
        price: 1099.99,
        attributes: { Size: 'M' },
        sortOrder: 1
      }, ownerToken));
    if (variant && variant.data) variantId = variant.data.id;
    else if (variant && variant.id) variantId = variant.id;

    if (variantId) {
      await t('GET /products/:id/variants', () =>
        req('GET', `/products/${productId}/variants`, null));
      await t('PUT /products/:id/variants/:variantId', () =>
        req('PUT', `/products/${productId}/variants/${variantId}`, { price: 1199.99 }, ownerToken));
    }
  }

  // ====== INVENTORY ======
  console.log('\n=== 📦 INVENTORY ===');
  if (variantId && productId) {
    await t('GET /products/:id/variants/:variantId/inventory', () =>
      req('GET', `/products/${productId}/variants/${variantId}/inventory`, null, ownerToken));
    
    await t('PUT /products/:id/variants/:variantId/inventory', () =>
      req('PUT', `/products/${productId}/variants/${variantId}/inventory`, {
        quantity: 100,
        lowStockThreshold: 10,
        trackInventory: true
      }, ownerToken));
    
    await t('GET /products/:id/variants/:variantId/inventory (verify)', () =>
      req('GET', `/products/${productId}/variants/${variantId}/inventory`, null, ownerToken));
  }

  // ====== INVENTORY LOGS ======
  console.log('\n=== 📝 INVENTORY LOGS ===');
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

  // ====== PUBLIC APIS ======
  console.log('\n=== 🌍 PUBLIC APIS ===');
  await t('GET /products/public/browse (unauthenticated)', () =>
    req('GET', '/products/public/browse?limit=10', null));

  if (productId) {
    await t('GET /products/public/:id (public detail)', () =>
      req('GET', `/products/public/${productId}`, null));
  }

  if (ownerBoutiqueId) {
    await t('GET /products/public/boutique/:boutiqueId', () =>
      req('GET', `/products/public/boutique/${ownerBoutiqueId}`, null));
  }

  // ====== WISHLIST ======
  console.log('\n=== ❤️ WISHLIST ===');
  if (productId) {
    // Verify product still exists
    const check = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    console.log(`  [DEBUG] Product exists in DB: ${!!check}, id=${productId}`);
    
    await t('POST /products/wishlists/:productId (admin)', () =>
      req('POST', `/products/wishlists/${productId}`, null, adminToken));
    await t('GET /products/wishlists/my (admin)', () =>
      req('GET', '/products/wishlists/my', null, adminToken));
    
    // Duplicate should 409
    await t('POST /products/wishlists/:productId (duplicate)', () =>
      req('POST', `/products/wishlists/${productId}`, null, adminToken), 409);
    
    await t('DELETE /products/wishlists/:productId (admin)', () =>
      req('DELETE', `/products/wishlists/${productId}`, null, adminToken));
  }

  // ====== SOFT DELETE PRODUCT ======
  console.log('\n=== 🧹 SOFT DELETE ===');
  if (productId) {
    await t('DELETE /products/:id (soft delete)', () =>
      req('DELETE', `/products/${productId}`, null, ownerToken));
  }

  // ====== AUTH ENFORCEMENT ======
  console.log('\n=== 🔒 AUTH ENFORCEMENT ===');
  await t('POST /products (no token) -> 401', () =>
    req('POST', '/products', { name: 'Nope', basePrice: 100 }), 401);
  await t('GET /products (no token) -> 401', () =>
    req('GET', '/products', null), 401);
  await t('POST /products/brands (no token) -> 401', () =>
    req('POST', '/products/brands', { name: 'Nope' }), 401);
  await t('POST /products/tags (no token) -> 401', () =>
    req('POST', '/products/tags', { name: 'Nope' }), 401);
  await t('POST /products/wishlists/:id (no token) -> 401', () =>
    req('POST', '/products/wishlists/some-id', null), 401);
  await t('GET /products/wishlists/my (no token) -> 401', () =>
    req('GET', '/products/wishlists/my', null), 401);
  await t('GET /products/public/browse (public - should pass)', () =>
    req('GET', '/products/public/browse?limit=5', null));

  // ====== SUMMARY ======
  console.log(`\n========================================`);
  console.log(`  PASS: ${passCount} | FAIL: ${failCount}`);
  console.log(`========================================`);
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error('FATAL:', e);
  prisma.$disconnect();
});

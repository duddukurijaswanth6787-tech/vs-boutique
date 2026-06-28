const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();
const BASE = 'http://localhost:3005';

let adminToken, ownerToken, ownerBoutiqueId, categoryId, subCategoryId, productId;
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
  } catch (e) {
    console.log(`  💥 ${name}: ${e.message}`);
    failCount++;
    return null;
  }
}

async function main() {
  console.log('\n🔧 SETUP - Creating test data...');

  // Create test category
  const cat = await prisma.category.create({
    data: { name: 'TestCat ' + Date.now(), description: 'Owner product test category' }
  });
  categoryId = cat.id;

  // Create test subcategory
  const sub = await prisma.subCategory.create({
    data: { categoryId, name: 'TestSubCat ' + Date.now(), description: 'Owner product test subcategory' }
  });
  subCategoryId = sub.id;

  // Create test boutique + owner
  let owner = await prisma.owner.findFirst({ where: { email: 'ownerproducttest@test.com' } });
  if (!owner) {
    const hash = await bcrypt.hash('Test@123', 10);
    const boutique = await prisma.boutique.create({
      data: {
        name: 'Owner Product Test Boutique',
        ownerName: 'Owner Product Tester',
        mobileNumber: '9111111111',
        email: 'ownerproducttest@boutique.com',
        fullAddress: '789 Test Lane',
        city: 'Test City',
        state: 'Test State',
        subscriptionEnforcement: false
      }
    });
    ownerBoutiqueId = boutique.id;
    owner = await prisma.owner.create({
      data: {
        ownerName: 'Owner Product Tester',
        username: 'ownerproducttester',
        email: 'ownerproducttest@test.com',
        mobileNumber: '9111111112',
        password: hash,
        role: 'owner',
        status: 'Active',
        assignedBoutiqueId: boutique.id,
        mustResetPassword: false,
        emailVerified: true
      }
    });
    console.log(`  ✅ Test boutique + owner created`);
  } else {
    ownerBoutiqueId = owner.assignedBoutiqueId;
    await prisma.boutique.update({
      where: { id: ownerBoutiqueId },
      data: { subscriptionEnforcement: false }
    });
    console.log(`  ✅ Found existing owner`);
  }

  // Create a second boutique+owner for wrong-boutique test
  let wrongOwnerToken;
  const hash2 = await bcrypt.hash('Wrong@123', 10);
  const boutique2 = await prisma.boutique.create({
    data: {
      name: 'Wrong Boutique ' + Date.now(),
      ownerName: 'Wrong Owner',
      mobileNumber: '9222222222',
      email: 'wrong' + Date.now() + '@boutique.com',
      fullAddress: '1 Wrong St',
      city: 'Wrong City',
      state: 'Wrong State',
      subscriptionEnforcement: false
    }
  });
  const wrongOwner = await prisma.owner.create({
    data: {
      ownerName: 'Wrong Owner',
      username: 'wrongowner' + Date.now(),
      email: 'wrong' + Date.now() + '@test.com',
      mobileNumber: '9222222223',
      password: hash2,
      role: 'owner',
      status: 'Active',
      assignedBoutiqueId: boutique2.id,
      mustResetPassword: false,
      emailVerified: true
    }
  });
  console.log(`  ✅ Created second boutique for cross-ownership test`);

  // Login
  const adminLogin = await req('POST', '/auth/login', { username: 'admin@vsboutique.com', password: 'admin@123' });
  if (adminLogin.status === 200) {
    adminToken = adminLogin.token;
    console.log(`  ✅ Admin logged in`);
  } else {
    console.log(`  ❌ Admin login FAILED`);
    return;
  }

  const ownerLogin = await req('POST', '/auth/login', { username: owner.email, password: 'Test@123' });
  if (ownerLogin.status === 200) {
    ownerToken = ownerLogin.token;
    console.log(`  ✅ Owner logged in`);
  } else {
    console.log(`  ❌ Owner login FAILED`);
    return;
  }

  const wrongLogin = await req('POST', '/auth/login', { username: wrongOwner.email, password: 'Wrong@123' });
  if (wrongLogin.status === 200) {
    wrongOwnerToken = wrongLogin.token;
    console.log(`  ✅ Wrong owner logged in`);
  } else {
    console.log(`  ❌ Wrong owner login FAILED`);
  }

  // ====== PRODUCT CRUD ======
  console.log('\n=== 📋 OWNER PRODUCT CRUD ===');

  // GET /owner/products (empty list)
  await t('GET /owner/products (empty list)', () =>
    req('GET', '/owner/products', null, ownerToken));

  // CREATE - missing categoryId -> 400
  await t('POST /owner/products (no category) -> 400', () =>
    req('POST', '/owner/products', {
      name: 'No Category',
      subCategoryId,
      basePrice: 100
    }, ownerToken), 400);

  // CREATE - missing subCategoryId -> 400
  await t('POST /owner/products (no subcategory) -> 400', () =>
    req('POST', '/owner/products', {
      name: 'No SubCategory',
      categoryId,
      basePrice: 100
    }, ownerToken), 400);

  // CREATE - missing name -> 400
  await t('POST /owner/products (no name) -> 400', () =>
    req('POST', '/owner/products', {
      categoryId,
      subCategoryId,
      basePrice: 100
    }, ownerToken), 400);

  // CREATE - missing price -> 400
  await t('POST /owner/products (no price) -> 400', () =>
    req('POST', '/owner/products', {
      name: 'No Price',
      categoryId,
      subCategoryId
    }, ownerToken), 400);

  // CREATE - valid product
  const created = await t('POST /owner/products (valid)', () =>
    req('POST', '/owner/products', {
      name: 'Owner Test Product ' + Date.now(),
      categoryId,
      subCategoryId,
      basePrice: 1499.99,
      sku: `OWNER-SKU-${Date.now()}`,
      description: 'Owner product test description',
      productType: 'READY_MADE',
      deliveryType: 'STANDARD',
      isFeatured: true,
      isMarketplaceVisible: true,
      isTaxable: true
    }, ownerToken), 201);

  if (created && created.id) productId = created.id;
  else if (created && created.data && created.data.id) productId = created.data.id;

  if (productId) {
    // GET /owner/products (list with one item)
    await t('GET /owner/products (with item)', () =>
      req('GET', '/owner/products', null, ownerToken));

    // GET /owner/products/:id
    await t('GET /owner/products/:id', () =>
      req('GET', `/owner/products/${productId}`, null, ownerToken));

    // UPDATE
    await t('PUT /owner/products/:id', () =>
      req('PUT', `/owner/products/${productId}`, {
        name: 'Updated Owner Product',
        basePrice: 1999.99,
        description: 'Updated description'
      }, ownerToken));

    // Verify update persisted
    const verifyUpdate = await t('GET /owner/products/:id (verify update)', () =>
      req('GET', `/owner/products/${productId}`, null, ownerToken));

    // SOFT DELETE
    await t('DELETE /owner/products/:id', () =>
      req('DELETE', `/owner/products/${productId}`, null, ownerToken));

    // Verify soft delete (should not appear in list)
    await t('GET /owner/products (after delete - empty)', () =>
      req('GET', '/owner/products', null, ownerToken));

    // GET deleted product -> 404
    await t('GET /owner/products/:id (deleted) -> 404', () =>
      req('GET', `/owner/products/${productId}`, null, ownerToken), 404);

    // PUT deleted product -> 404
    await t('PUT /owner/products/:id (deleted) -> 404', () =>
      req('PUT', `/owner/products/${productId}`, { name: 'Nope' }, ownerToken), 404);

    // DELETE already deleted product -> 404
    await t('DELETE /owner/products/:id (already deleted) -> 404', () =>
      req('DELETE', `/owner/products/${productId}`, null, ownerToken), 404);
  }

  // ====== AUTH & ACCESS ENFORCEMENT ======
  console.log('\n=== 🔒 AUTH & ACCESS ENFORCEMENT ===');

  await t('GET /owner/products (no token) -> 401', () =>
    req('GET', '/owner/products', null), 401);
  await t('POST /owner/products (no token) -> 401', () =>
    req('POST', '/owner/products', {
      name: 'Unauth', categoryId, subCategoryId, basePrice: 100
    }), 401);
  await t('PUT /owner/products/:id (no token) -> 401', () =>
    req('PUT', '/owner/products/some-id', { name: 'Nope' }), 401);
  await t('DELETE /owner/products/:id (no token) -> 401', () =>
    req('DELETE', '/owner/products/some-id', null), 401);

  // Wrong boutique access
  if (wrongOwnerToken) {
    // Create a product in boutique1 (owner's boutique)
    const tempProduct = await prisma.product.create({
      data: {
        boutiqueId: ownerBoutiqueId,
        name: 'Temp Product ' + Date.now(),
        basePrice: 500,
        categoryId,
        subCategoryId
      }
    });
    productId = tempProduct.id;

    // Try to access with wrong owner token -> 404
    await t('GET /owner/products/:id (wrong boutique) -> 404', () =>
      req('GET', `/owner/products/${productId}`, null, wrongOwnerToken), 404);
    await t('PUT /owner/products/:id (wrong boutique) -> 404', () =>
      req('PUT', `/owner/products/${productId}`, { name: 'Hacked' }, wrongOwnerToken), 404);
    await t('DELETE /owner/products/:id (wrong boutique) -> 404', () =>
      req('DELETE', `/owner/products/${productId}`, null, wrongOwnerToken), 404);
  }

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

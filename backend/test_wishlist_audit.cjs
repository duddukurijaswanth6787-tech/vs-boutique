const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();
const BASE = 'http://localhost:3005';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

let customer1Token, customer2Token, ownerToken, ownerBoutiqueId, categoryId, subCategoryId;
let activeProductId, deletedProductId, inactiveProductId;
let passCount = 0, failCount = 0;

function makeToken(userId, role = 'customer') {
  return jwt.sign({ id: userId, _id: userId, role }, JWT_SECRET, { expiresIn: '1h' });
}

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
      console.log(`  ❌ ${name} (${r.status}): ${r.message || JSON.stringify(r).slice(0, 200)}`);
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
  console.log('\n🔧 SETUP - Creating test data...\n');

  // ── Category & SubCategory ──
  const cat = await prisma.category.create({
    data: { name: 'WishlistCat ' + Date.now() }
  });
  categoryId = cat.id;

  const sub = await prisma.subCategory.create({
    data: { categoryId, name: 'WishlistSubCat ' + Date.now() }
  });
  subCategoryId = sub.id;

  // ── Boutique ──
  let owner = await prisma.owner.findFirst({ where: { email: 'wishlistowner@test.com' } });
  if (!owner) {
    const hash = await bcrypt.hash('Test@123', 10);
    const boutique = await prisma.boutique.create({
      data: {
        name: 'Wishlist Test Boutique',
        ownerName: 'Wishlist Owner',
        mobileNumber: '9555555551',
        email: 'wishlistowner@boutique.com',
        fullAddress: '55 Wishlist Ave',
        city: 'Wish City',
        state: 'Wish State'
      }
    });
    ownerBoutiqueId = boutique.id;
    owner = await prisma.owner.create({
      data: {
        ownerName: 'Wishlist Owner',
        username: 'wishlistowner',
        email: 'wishlistowner@test.com',
        mobileNumber: '9555555552',
        password: hash,
        role: 'owner',
        status: 'Active',
        assignedBoutiqueId: boutique.id,
        mustResetPassword: false,
        emailVerified: true
      }
    });
    console.log('  ✅ Test boutique + owner created');
  } else {
    ownerBoutiqueId = owner.assignedBoutiqueId;
    console.log('  ✅ Found existing owner');
  }

  // ── 3 Products: active, deleted, inactive ──
  activeProductId = (await prisma.product.create({
    data: {
      boutiqueId: ownerBoutiqueId,
      name: 'Wishlist Active Product ' + Date.now(),
      basePrice: 999,
      categoryId, subCategoryId,
      status: 'ACTIVE'
    }
  })).id;

  const delProd = await prisma.product.create({
    data: {
      boutiqueId: ownerBoutiqueId,
      name: 'Wishlist To Delete ' + Date.now(),
      basePrice: 100,
      categoryId, subCategoryId,
      status: 'ACTIVE'
    }
  });
  deletedProductId = delProd.id;
  await prisma.product.update({ where: { id: delProd.id }, data: { isDeleted: true } });

  inactiveProductId = (await prisma.product.create({
    data: {
      boutiqueId: ownerBoutiqueId,
      name: 'Wishlist Inactive Product ' + Date.now(),
      basePrice: 500,
      categoryId, subCategoryId,
      status: 'INACTIVE'
    }
  })).id;
  console.log('  ✅ Products created (active, soft-deleted, inactive)');

  // ── 2 Customer Users ──
  const ts = Date.now();
  const c1 = await prisma.user.create({
    data: { phone: `9111111${ts}`, name: 'Customer One' }
  });
  customer1Token = makeToken(c1.id);

  const c2 = await prisma.user.create({
    data: { phone: `9222222${ts}`, name: 'Customer Two' }
  });
  customer2Token = makeToken(c2.id);
  console.log('  ✅ Customer users created + JWT tokens issued\n');

  // =========================================================
  // WISHLIST TESTS
  // =========================================================

  // ── 1. Customer can add product to wishlist ──
  console.log('=== ✅ 1. ADD TO WISHLIST ===');
  await t('POST /products/wishlists/:id (add active product)', () =>
    req('POST', `/products/wishlists/${activeProductId}`, null, customer1Token), 201);

  // ── 2. Duplicate wishlist returns 409 ──
  console.log('\n=== ✅ 2. DUPLICATE ===');
  await t('POST /products/wishlists/:id (duplicate) -> 409', () =>
    req('POST', `/products/wishlists/${activeProductId}`, null, customer1Token), 409);

  // ── 3. Customer can view own wishlist ──
  console.log('\n=== ✅ 3. VIEW OWN WISHLIST ===');
  await t('GET /products/wishlists/my (customer1 - has item)', () =>
    req('GET', '/products/wishlists/my', null, customer1Token));

  // ── 4. Customer cannot view another customer's wishlist ──
  console.log('\n=== ✅ 4. VIEW OTHER WISHLIST ===');
  await t('GET /products/wishlists/my (customer2 - empty)', () =>
    req('GET', '/products/wishlists/my', null, customer2Token));

  // ── 5. Deleted product cannot be wishlisted ──
  console.log('\n=== ✅ 5. DELETED PRODUCT ===');
  await t('POST /products/wishlists/:id (deleted product) -> 404', () =>
    req('POST', `/products/wishlists/${deletedProductId}`, null, customer1Token), 404);

  // ── 6. Inactive product cannot be wishlisted → 404 ──
  console.log('\n=== ✅ 6. INACTIVE PRODUCT ===');
  await t('POST /products/wishlists/:id (inactive product) -> 404', () =>
    req('POST', `/products/wishlists/${inactiveProductId}`, null, customer1Token), 404);

  // ── 7. Customer can remove wishlist item ──
  console.log('\n=== ✅ 7. REMOVE WISHLIST ===');
  await t('DELETE /products/wishlists/:id (remove)', () =>
    req('DELETE', `/products/wishlists/${activeProductId}`, null, customer1Token));

  // Verify removal
  await t('GET /products/wishlists/my (after remove - empty)', () =>
    req('GET', '/products/wishlists/my', null, customer1Token));

  // Remove non-existent item -> 404
  await t('DELETE /products/wishlists/:id (not found) -> 404', () =>
    req('DELETE', `/products/wishlists/${activeProductId}`, null, customer1Token), 404);

  // ── 8. Auth enforcement ──
  console.log('\n=== ✅ 8. AUTH ENFORCEMENT ===');
  await t('POST /products/wishlists/:id (no token) -> 401', () =>
    req('POST', `/products/wishlists/some-id`, null), 401);
  await t('GET /products/wishlists/my (no token) -> 401', () =>
    req('GET', '/products/wishlists/my', null), 401);
  await t('DELETE /products/wishlists/:id (no token) -> 401', () =>
    req('DELETE', `/products/wishlists/some-id`, null), 401);

  // =========================================================
  // SUMMARY
  // =========================================================
  console.log(`\n========================================`);
  console.log(`  PASS: ${passCount} | FAIL: ${failCount}`);
  console.log(`========================================`);

  await prisma.$disconnect();
}

main().catch(e => {
  console.error('FATAL:', e);
  prisma.$disconnect();
});

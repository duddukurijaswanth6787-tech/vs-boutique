const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();
const BASE = 'http://localhost:3005';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

let customerToken, ownerToken, ownerBoutiqueId, categoryId, subCategoryId;
let activeProductId, variantId, inactiveProductId, cartItemId;
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
      console.log(`  ❌ ${name} (${r.status}): ${r.message || JSON.stringify(r).slice(0, 150)}`);
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

  const cat = await prisma.category.create({ data: { name: 'CartCat ' + Date.now() } });
  categoryId = cat.id;
  const sub = await prisma.subCategory.create({ data: { categoryId, name: 'CartSubCat ' + Date.now() } });
  subCategoryId = sub.id;

  let owner = await prisma.owner.findFirst({ where: { email: 'cartownertest@test.com' } });
  if (!owner) {
    const hash = await bcrypt.hash('Test@123', 10);
    const boutique = await prisma.boutique.create({
      data: {
        name: 'Cart Test Boutique',
        ownerName: 'Cart Owner',
        mobileNumber: '9666666661',
        email: 'cartowner@boutique.com',
        fullAddress: '15 Cart Lane',
        city: 'Cart City', state: 'Cart State'
      }
    });
    ownerBoutiqueId = boutique.id;
    owner = await prisma.owner.create({
      data: {
        ownerName: 'Cart Owner', username: 'cartowner',
        email: 'cartownertest@test.com', mobileNumber: '9666666662',
        password: hash, role: 'owner', status: 'Active',
        assignedBoutiqueId: boutique.id, mustResetPassword: false, emailVerified: true
      }
    });
    console.log('  ✅ Test boutique + owner created');
  } else {
    ownerBoutiqueId = owner.assignedBoutiqueId;
    console.log('  ✅ Found existing owner');
  }

  activeProductId = (await prisma.product.create({
    data: { boutiqueId: ownerBoutiqueId, name: 'Cart Active Product ' + Date.now(), basePrice: 999, categoryId, subCategoryId, status: 'ACTIVE' }
  })).id;

  const v = await prisma.productVariant.create({
    data: { productId: activeProductId, name: 'Large', sku: 'CART-VAR-' + Date.now(), price: 1099 }
  });
  variantId = v.id;
  await prisma.productInventory.create({ data: { variantId: v.id, quantity: 50 } });

  inactiveProductId = (await prisma.product.create({
    data: { boutiqueId: ownerBoutiqueId, name: 'Cart Inactive ' + Date.now(), basePrice: 500, categoryId, subCategoryId, status: 'INACTIVE' }
  })).id;

  const ts = Date.now();
  const user = await prisma.user.create({ data: { phone: `9777777${ts}`, name: 'Cart Customer' } });
  customerToken = makeToken(user.id);
  console.log('  ✅ Customer created + token issued');

  // ====== CART TESTS ======
  console.log('\n=== 🛒 CART CRUD ===');

  // GET empty cart
  await t('GET /cart (empty)', () => req('GET', '/cart', null, customerToken));

  // POST add item (no productId) -> 400
  await t('POST /cart/add (no productId) -> 400', () =>
    req('POST', '/cart/add', { quantity: 1 }, customerToken), 400);

  // POST add item (inactive product) -> 404
  await t('POST /cart/add (inactive product) -> 404', () =>
    req('POST', '/cart/add', { productId: inactiveProductId, quantity: 1 }, customerToken), 404);

  // POST add item (valid, no variant)
  const add1 = await t('POST /cart/add (valid, no variant)', () =>
    req('POST', '/cart/add', { productId: activeProductId, quantity: 2 }, customerToken), 201);

  // POST add item (valid, with variant)
  await t('POST /cart/add (with variant)', () =>
    req('POST', '/cart/add', { productId: activeProductId, variantId, quantity: 1 }, customerToken), 201);

  // GET cart with items
  const cartGet = await t('GET /cart (with items)', () => req('GET', '/cart', null, customerToken));
  if (cartGet && cartGet.data && cartGet.data.items && cartGet.data.items.length > 0) {
    cartItemId = cartGet.data.items[0].id;
  }

  // POST add same product again (should increase quantity)
  await t('POST /cart/add (duplicate product) -> quantity updated', () =>
    req('POST', '/cart/add', { productId: activeProductId, quantity: 3 }, customerToken));

  // PUT update cart item quantity
  if (cartItemId) {
    await t('PUT /cart/:itemId (update quantity)', () =>
      req('PUT', `/cart/${cartItemId}`, { quantity: 5 }, customerToken));

    await t('PUT /cart/:itemId (set to 0 = remove)', () =>
      req('PUT', `/cart/${cartItemId}`, { quantity: 0 }, customerToken));
  }

  // DELETE /cart/:itemId (not found) -> 404
  await t('DELETE /cart/:itemId (not found) -> 404', () =>
    req('DELETE', `/cart/${cartItemId || 'nonexistent'}`, null, customerToken), 404);

  // Clear cart
  await t('DELETE /cart (clear)', () => req('DELETE', '/cart', null, customerToken));

  // Verify empty after clear
  await t('GET /cart (after clear)', () => req('GET', '/cart', null, customerToken));

  // ====== AUTH ENFORCEMENT ======
  console.log('\n=== 🔒 AUTH ENFORCEMENT ===');
  await t('GET /cart (no token) -> 401', () => req('GET', '/cart', null), 401);
  await t('POST /cart/add (no token) -> 401', () => req('POST', '/cart/add', { productId: 'x' }), 401);
  await t('PUT /cart/:id (no token) -> 401', () => req('PUT', '/cart/x', { quantity: 1 }), 401);
  await t('DELETE /cart/:id (no token) -> 401', () => req('DELETE', '/cart/x', null), 401);
  await t('DELETE /cart (no token) -> 401', () => req('DELETE', '/cart', null), 401);

  console.log(`\n========================================`);
  console.log(`  PASS: ${passCount} | FAIL: ${failCount}`);
  console.log(`========================================`);

  await prisma.$disconnect();
}

main().catch(e => {
  console.error('FATAL:', e);
  prisma.$disconnect();
});

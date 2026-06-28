const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const BASE = 'http://localhost:3005';

let adminToken, categoryId, subCategoryId;
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
  console.log('\n🔐 AUTH - Logging in...');

  // Login as admin
  const adminLogin = await req('POST', '/auth/login', { username: 'admin@vsboutique.com', password: 'admin@123' });
  if (adminLogin.status === 200) {
    adminToken = adminLogin.token;
    console.log(`  ✅ Admin logged in`);
  } else {
    console.log(`  ❌ Admin login FAILED: ${adminLogin.message}`);
    console.log(`  ⚠️  Run seed first: cd prisma && node seed.js`);
    return;
  }

  // ====== CATEGORY CRUD ======
  console.log('\n=== 📁 CATEGORY CRUD ===');

  // List public categories (should be empty or have seeded data)
  await t('GET /categories (public)', () =>
    req('GET', '/categories', null));

  await t('GET /categories/admin (super-admin)', () =>
    req('GET', '/categories/admin', null, adminToken));

  // Create category
  const category = await t('POST /categories', () =>
    req('POST', '/categories', {
      name: 'Test Category ' + Date.now(),
      description: 'A test category',
      sortOrder: 1
    }, adminToken));
  if (category && category.data) categoryId = category.data.id;
  else if (category && category.id) categoryId = category.id;

  if (categoryId) {
    await t('GET /categories/:id (public)', () =>
      req('GET', `/categories/${categoryId}`, null));

    await t('PUT /categories/:id (update)', () =>
      req('PUT', `/categories/${categoryId}`, {
        description: 'Updated description',
        sortOrder: 2
      }, adminToken));

    await t('PUT /categories/:id/toggle (deactivate)', () =>
      req('PUT', `/categories/${categoryId}/toggle`, null, adminToken));

    await t('PUT /categories/:id/toggle (reactivate)', () =>
      req('PUT', `/categories/${categoryId}/toggle`, null, adminToken));
  }

  // Validation tests
  await t('POST /categories (no name) -> 400', () =>
    req('POST', '/categories', { description: 'Missing name' }, adminToken), 400);

  await t('POST /categories (no auth) -> 401', () =>
    req('POST', '/categories', { name: 'Unauthorized' }), 401);

  // ====== SUBCATEGORY CRUD ======
  console.log('\n=== 📂 SUBCATEGORY CRUD ===');

  if (!categoryId) {
    console.log('  ⚠️  Skipping subcategory tests - no category available');
  } else {
    // List public subcategories
    await t('GET /subcategories (public)', () =>
      req('GET', '/subcategories', null));

    await t('GET /subcategories?categoryId= (filter)', () =>
      req('GET', `/subcategories?categoryId=${categoryId}`, null));

    await t('GET /subcategories/admin (super-admin)', () =>
      req('GET', '/subcategories/admin', null, adminToken));

    // Create subcategory
    const subCategory = await t('POST /subcategories', () =>
      req('POST', '/subcategories', {
        categoryId,
        name: 'Test SubCategory ' + Date.now(),
        description: 'A test subcategory',
        sortOrder: 1
      }, adminToken));
    if (subCategory && subCategory.data) subCategoryId = subCategory.data.id;
    else if (subCategory && subCategory.id) subCategoryId = subCategory.id;

    if (subCategoryId) {
      await t('GET /subcategories/:id (public)', () =>
        req('GET', `/subcategories/${subCategoryId}`, null));

      await t('PUT /subcategories/:id (update)', () =>
        req('PUT', `/subcategories/${subCategoryId}`, {
          description: 'Updated subcategory desc',
          sortOrder: 2
        }, adminToken));

      await t('PUT /subcategories/:id/toggle (deactivate)', () =>
        req('PUT', `/subcategories/${subCategoryId}/toggle`, null, adminToken));

      await t('PUT /subcategories/:id/toggle (reactivate)', () =>
        req('PUT', `/subcategories/${subCategoryId}/toggle`, null, adminToken));

      await t('DELETE /subcategories/:id', () =>
        req('DELETE', `/subcategories/${subCategoryId}`, null, adminToken));
    }

    // Validation tests
    await t('POST /subcategories (no categoryId) -> 400', () =>
      req('POST', '/subcategories', { name: 'Missing category' }, adminToken), 400);

    await t('POST /subcategories (no name) -> 400', () =>
      req('POST', '/subcategories', { categoryId }, adminToken), 400);

    await t('POST /subcategories (no auth) -> 401', () =>
      req('POST', '/subcategories', { categoryId, name: 'Unauthorized' }), 401);

    // Cleanup: delete category
    await t('DELETE /categories/:id', () =>
      req('DELETE', `/categories/${categoryId}`, null, adminToken));
  }

  // ====== AUTH ENFORCEMENT ======
  console.log('\n=== 🔒 AUTH ENFORCEMENT ===');
  await t('GET /subcategories/admin (no token) -> 401', () =>
    req('GET', '/subcategories/admin', null), 401);
  await t('POST /categories (no token) -> 401', () =>
    req('POST', '/categories', { name: 'Nope' }), 401);
  await t('POST /subcategories (no token) -> 401', () =>
    req('POST', '/subcategories', { categoryId: 'x', name: 'Nope' }), 401);
  await t('PUT /categories/:id (no token) -> 401', () =>
    req('PUT', '/categories/some-id', { name: 'Nope' }), 401);
  await t('DELETE /categories/:id (no token) -> 401', () =>
    req('DELETE', '/categories/some-id', null), 401);

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

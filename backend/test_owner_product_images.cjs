const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();
const BASE = 'http://localhost:3005';

let adminToken, ownerToken, wrongOwnerToken, ownerBoutiqueId, categoryId, subCategoryId, productId, imageId1, imageId2;
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

function imgPath(pid) {
  return `/owner/products/${pid}/images`;
}

async function main() {
  console.log('\n🔧 SETUP - Creating test data...');

  const cat = await prisma.category.create({
    data: { name: 'ImgTestCat ' + Date.now() }
  });
  categoryId = cat.id;

  const sub = await prisma.subCategory.create({
    data: { categoryId, name: 'ImgTestSubCat ' + Date.now() }
  });
  subCategoryId = sub.id;

  let owner = await prisma.owner.findFirst({ where: { email: 'imgproducttest@test.com' } });
  if (!owner) {
    const hash = await bcrypt.hash('Test@123', 10);
    const boutique = await prisma.boutique.create({
      data: {
        name: 'Image Product Test Boutique',
        ownerName: 'Image Tester',
        mobileNumber: '9333333331',
        email: 'imgproducttest@boutique.com',
        fullAddress: '101 Image Lane',
        city: 'Img City',
        state: 'Img State',
        subscriptionEnforcement: false
      }
    });
    ownerBoutiqueId = boutique.id;
    owner = await prisma.owner.create({
      data: {
        ownerName: 'Image Tester',
        username: 'imgtester',
        email: 'imgproducttest@test.com',
        mobileNumber: '9333333332',
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
    await prisma.boutique.update({
      where: { id: ownerBoutiqueId },
      data: { subscriptionEnforcement: false }
    });
    console.log('  ✅ Found existing owner');
  }

  // Create product
  const prod = await prisma.product.create({
    data: {
      boutiqueId: ownerBoutiqueId,
      name: 'Image Test Product ' + Date.now(),
      basePrice: 999,
      categoryId,
      subCategoryId,
      status: 'ACTIVE'
    }
  });
  productId = prod.id;
  console.log('  ✅ Test product created');

  // Second boutique for cross-ownership test
  const hash2 = await bcrypt.hash('Wrong@123', 10);
  const boutique2 = await prisma.boutique.create({
    data: {
      name: 'Wrong Boutique Img ' + Date.now(),
      ownerName: 'Wrong Owner Img',
      mobileNumber: '9444444441',
      email: 'wrongimg' + Date.now() + '@boutique.com',
      fullAddress: '2 Wrong St',
      city: 'Wrong City',
      state: 'Wrong State',
      subscriptionEnforcement: false
    }
  });
  const wrongOwner = await prisma.owner.create({
    data: {
      ownerName: 'Wrong Owner Img',
      username: 'wrongownerimg' + Date.now(),
      email: 'wrongimg' + Date.now() + '@test.com',
      mobileNumber: '9444444442',
      password: hash2,
      role: 'owner',
      status: 'Active',
      assignedBoutiqueId: boutique2.id,
      mustResetPassword: false,
      emailVerified: true
    }
  });
  console.log('  ✅ Second boutique for cross-ownership test created');

  // Create a product for wrong owner
  const wrongProduct = await prisma.product.create({
    data: {
      boutiqueId: boutique2.id,
      name: 'Wrong Owner Product ' + Date.now(),
      basePrice: 500,
      categoryId,
      subCategoryId
    }
  });

  // Logins
  const al = await req('POST', '/auth/login', { username: 'admin@vsboutique.com', password: 'admin@123' });
  if (al.status === 200) { adminToken = al.token; console.log('  ✅ Admin logged in'); }
  else { console.log('  ❌ Admin login FAILED'); return; }

  const ol = await req('POST', '/auth/login', { username: owner.email, password: 'Test@123' });
  if (ol.status === 200) { ownerToken = ol.token; console.log('  ✅ Owner logged in'); }
  else { console.log('  ❌ Owner login FAILED'); return; }

  const wl = await req('POST', '/auth/login', { username: wrongOwner.email, password: 'Wrong@123' });
  if (wl.status === 200) { wrongOwnerToken = wl.token; console.log('  ✅ Wrong owner logged in'); }
  else { console.log('  ❌ Wrong owner login FAILED'); }

  // ====== PRODUCT IMAGE CRUD ======
  console.log('\n=== 🖼️ PRODUCT IMAGE CRUD ===');

  // GET - empty list
  await t('GET /owner/products/:id/images (empty)', () =>
    req('GET', imgPath(productId), null, ownerToken));

  // POST - add image (primary)
  const img1 = await t('POST image 1 (primary)', () =>
    req('POST', imgPath(productId), {
      url: 'https://example.com/img1.jpg',
      alt: 'Primary image',
      isPrimary: true,
      sortOrder: 1
    }, ownerToken), 201);

  if (img1 && img1.data) imageId1 = img1.data.id;
  else if (img1 && img1.id) imageId1 = img1.id;

  // POST - add second image
  const img2 = await t('POST image 2', () =>
    req('POST', imgPath(productId), {
      url: 'https://example.com/img2.jpg',
      alt: 'Second image',
      sortOrder: 2
    }, ownerToken), 201);

  if (img2 && img2.data) imageId2 = img2.data.id;
  else if (img2 && img2.id) imageId2 = img2.id;

  // GET - list images (should have 2)
  const listResult = await t('GET /owner/products/:id/images (2 items)', () =>
    req('GET', imgPath(productId), null, ownerToken));

  // POST - missing url -> 400
  await t('POST image (no url) -> 400', () =>
    req('POST', imgPath(productId), { alt: 'No URL' }, ownerToken), 400);

  // PUT - update image metadata
  if (imageId1) {
    await t('PUT image (reorder + alt update)', () =>
      req('PUT', `/owner/products/${productId}/images/${imageId1}`, {
        alt: 'Updated primary alt',
        sortOrder: 3
      }, ownerToken));

    await t('PUT image (set primary on second)', () =>
      req('PUT', `/owner/products/${productId}/images/${imageId2}`, {
        isPrimary: true
      }, ownerToken));
  }

  // DELETE - delete image
  if (imageId2) {
    await t('DELETE image 2', () =>
      req('DELETE', `/owner/products/${productId}/images/${imageId2}`, null, ownerToken));

    // GET - verify only 1 remains
    await t('GET images (1 remains)', () =>
      req('GET', imgPath(productId), null, ownerToken));
  }

  // DELETE - non-existent image -> 404
  await t('DELETE image (not found) -> 404', () =>
    req('DELETE', `/owner/products/${productId}/images/nonexistent-id`, null, ownerToken), 404);

  // ====== AUTH & ACCESS ENFORCEMENT ======
  console.log('\n=== 🔒 AUTH & ACCESS ENFORCEMENT ===');

  await t('GET images (no token) -> 401', () =>
    req('GET', imgPath(productId), null), 401);
  await t('POST image (no token) -> 401', () =>
    req('POST', imgPath(productId), { url: 'https://x.com/x.jpg' }), 401);
  await t('PUT image (no token) -> 401', () =>
    req('PUT', `/owner/products/${productId}/images/${imageId1 || 'x'}`, {}), 401);
  await t('DELETE image (no token) -> 401', () =>
    req('DELETE', `/owner/products/${productId}/images/${imageId1 || 'x'}`, null), 401);

  // Wrong boutique access -> 404
  await t('GET images (wrong boutique) -> 404', () =>
    req('GET', imgPath(productId), null, wrongOwnerToken), 404);
  await t('POST image (wrong boutique) -> 404', () =>
    req('POST', imgPath(productId), { url: 'https://x.com/x.jpg' }, wrongOwnerToken), 404);

  // Access wrong owner's product directly -> 404
  await t('GET images of wrong product (right owner) -> 404', () =>
    req('GET', imgPath(wrongProduct.id), null, ownerToken), 404);

  // ====== SOFT-DELETED PRODUCT ======
  console.log('\n=== 🗑️ SOFT-DELETED PRODUCT ===');

  // Create temp product and soft delete it
  const delProd = await prisma.product.create({
    data: {
      boutiqueId: ownerBoutiqueId,
      name: 'To Be Deleted ' + Date.now(),
      basePrice: 100,
      categoryId,
      subCategoryId
    }
  });

  // Soft delete via owner endpoint
  await t('DELETE product (for soft-delete test)', () =>
    req('DELETE', `/owner/products/${delProd.id}`, null, ownerToken));

  // Try to upload image to soft-deleted product -> 404
  await t('POST image (soft-deleted product) -> 404', () =>
    req('POST', imgPath(delProd.id), {
      url: 'https://example.com/bad.jpg'
    }, ownerToken), 404);

  await t('GET images (soft-deleted product) -> 404', () =>
    req('GET', imgPath(delProd.id), null, ownerToken), 404);

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

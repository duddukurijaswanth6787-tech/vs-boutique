const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();
const BASE = 'http://localhost:3005';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

let c1Token, c2Token, addr1Id, addr2Id;
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
  const ts = Date.now();

  // Customers
  const c1 = await prisma.user.create({ data: { phone: '9999900' + ts, name: 'Ship Customer 1' } });
  c1Token = makeToken(c1.id);
  const c2 = await prisma.user.create({ data: { phone: '9999901' + ts, name: 'Ship Customer 2' } });
  c2Token = makeToken(c2.id);
  console.log('  ✅ Test users created\n');

  // ================================================================
  // 1. AUTH GUARD
  // ================================================================
  console.log('=== 🛡️  1. AUTH GUARD ===');
  await t('GET without token > 401', () => req('GET', '/shipping-addresses', null, null), 401);
  await t('POST without token > 401', () =>
    req('POST', '/shipping-addresses', { fullName: 'Test', phone: '123', addressLine1: '1 St', city: 'C', state: 'S', pincode: '1' }, null), 401);
  await t('PUT without token > 401', () =>
    req('PUT', '/shipping-addresses/00000000-0000-0000-0000-000000000000', {}, null), 401);
  await t('DELETE without token > 401', () =>
    req('DELETE', '/shipping-addresses/00000000-0000-0000-0000-000000000000', null, null), 401);

  // ================================================================
  // 2. CREATE ADDRESSES
  // ================================================================
  console.log('\n=== 📝 2. CREATE ADDRESSES ===');
  await t('Create with missing fields > 400', () =>
    req('POST', '/shipping-addresses', { fullName: 'Test' }, c1Token), 400);

  const addr1 = await t('Create address 1 (default)', () =>
    req('POST', '/shipping-addresses', {
      fullName: 'John Doe',
      phone: '9876543210',
      addressLine1: '123 Main St',
      addressLine2: 'Apt 4B',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      isDefault: true
    }, c1Token));

  if (addr1 && addr1.id) {
    addr1Id = addr1.id;
    if (addr1.isDefault === true) {
      console.log('  ✅ First address created as default');
      passCount++;
    } else {
      console.log(`  ❌ First address not default: ${JSON.stringify(addr1).slice(0, 100)}`);
      failCount++;
    }
  }

  const addr2 = await t('Create address 2 (not default)', () =>
    req('POST', '/shipping-addresses', {
      fullName: 'Jane Doe',
      phone: '9876543222',
      addressLine1: '456 Oak Ave',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001'
    }, c1Token));

  if (addr2 && addr2.id) {
    addr2Id = addr2.id;
    if (addr2.isDefault === false) {
      console.log('  ✅ Second address created as non-default');
      passCount++;
    } else {
      console.log(`  ❌ Second address should not be default: ${JSON.stringify(addr2).slice(0, 100)}`);
      failCount++;
    }
  }

  // ================================================================
  // 3. LIST ADDRESSES
  // ================================================================
  console.log('\n=== 📋 3. LIST ADDRESSES ===');
  const list1 = await t('List addresses for customer 1', () =>
    req('GET', '/shipping-addresses', null, c1Token));
  if (list1 && Array.isArray(list1)) {
    if (list1.length === 2) {
      console.log('  ✅ Customer 1 has 2 addresses');
      passCount++;
    } else {
      console.log(`  ❌ Expected 2 addresses, got ${list1.length}`);
      failCount++;
    }
    if (list1[0].isDefault === true) {
      console.log('  ✅ Default address listed first');
      passCount++;
    } else {
      console.log('  ❌ Default address not first in list');
      failCount++;
    }
  }

  const list2 = await t('List addresses for customer 2 (empty)', () =>
    req('GET', '/shipping-addresses', null, c2Token));
  if (list2 && Array.isArray(list2) && list2.length === 0) {
    console.log('  ✅ Customer 2 has 0 addresses (isolated)');
    passCount++;
  } else {
    console.log('  ❌ Customer 2 address isolation failed');
    failCount++;
  }

  // ================================================================
  // 4. UPDATE ADDRESS
  // ================================================================
  console.log('\n📝 4. UPDATE ADDRESS');
  const upd = await t('Update address line1 and city', () =>
    req('PUT', `/shipping-addresses/${addr1Id}`, {
      addressLine1: '789 New St', city: 'Pune'
    }, c1Token));
  if (upd && upd.addressLine1 === '789 New St' && upd.city === 'Pune') {
    console.log('  ✅ Address updated correctly');
    passCount++;
  } else {
    console.log(`  ❌ Address update failed: ${JSON.stringify(upd).slice(0, 100)}`);
    failCount++;
  }

  await t('Update address - set as default', () =>
    req('PUT', `/shipping-addresses/${addr2Id}`, { isDefault: true }, c1Token));
  // Verify addr1 is no longer default, addr2 is default
  const v1 = await prisma.shippingAddress.findUnique({ where: { id: addr1Id } });
  const v2 = await prisma.shippingAddress.findUnique({ where: { id: addr2Id } });
  if (v1 && v2 && v1.isDefault === false && v2.isDefault === true) {
    console.log('  ✅ Default switched correctly');
    passCount++;
  } else {
    console.log(`  ❌ Default switch failed: addr1.default=${v1?.isDefault}, addr2.default=${v2?.isDefault}`);
    failCount++;
  }

  await t('Update non-owned address > 404', () =>
    req('PUT', `/shipping-addresses/${addr1Id}`, { city: 'Bangalore' }, c2Token), 404);

  // ================================================================
  // 5. SET DEFAULT ENDPOINT
  // ================================================================
  console.log('\n⭐ 5. SET DEFAULT ENDPOINT');
  await t('Set addr1 as default via PUT /:id/default', () =>
    req('PUT', `/shipping-addresses/${addr1Id}/default`, null, c1Token));
  const v3 = await prisma.shippingAddress.findUnique({ where: { id: addr1Id } });
  const v4 = await prisma.shippingAddress.findUnique({ where: { id: addr2Id } });
  if (v3 && v4 && v3.isDefault === true && v4.isDefault === false) {
    console.log('  ✅ Default endpoint works correctly');
    passCount++;
  } else {
    console.log(`  ❌ Default endpoint failed`);
    failCount++;
  }

  await t('Set default on non-owned > 404', () =>
    req('PUT', `/shipping-addresses/${addr1Id}/default`, null, c2Token), 404);

  // ================================================================
  // 6. DELETE ADDRESS
  // ================================================================
  console.log('\n🗑️  6. DELETE ADDRESS');
  await t('Delete non-owned address > 404', () =>
    req('DELETE', `/shipping-addresses/${addr1Id}`, null, c2Token), 404);

  // Delete addr2 first (non-default)
  await t('Delete non-default address', () =>
    req('DELETE', `/shipping-addresses/${addr2Id}`, null, c1Token));

  const remainingAfterDelete = await prisma.shippingAddress.count({
    where: { userId: c1.id }
  });
  if (remainingAfterDelete === 1) {
    console.log('  ✅ Address deleted, 1 remains');
    passCount++;
  } else {
    console.log(`  ❌ Expected 1 remaining, got ${remainingAfterDelete}`);
    failCount++;
  }

  // Delete the last (default) address
  await t('Delete last (default) address', () =>
    req('DELETE', `/shipping-addresses/${addr1Id}`, null, c1Token));

  const remainingAfterAll = await prisma.shippingAddress.count({
    where: { userId: c1.id }
  });
  if (remainingAfterAll === 0) {
    console.log('  ✅ All addresses deleted');
    passCount++;
  } else {
    console.log(`  ❌ Expected 0, got ${remainingAfterAll}`);
    failCount++;
  }

  // ================================================================
  // 7. FIRST ADDRESS AUTO-DEFAULT
  // ================================================================
  console.log('\n🔁 7. FIRST ADDRESS AUTO-DEFAULT');
  const autoAddr = await t('Create address (first, should auto-default)', () =>
    req('POST', '/shipping-addresses', {
      fullName: 'Auto Default',
      phone: '9999999999',
      addressLine1: 'Auto St',
      city: 'Auto City',
      state: 'Auto State',
      pincode: '999999'
    }, c1Token));
  if (autoAddr && autoAddr.isDefault === true) {
    console.log('  ✅ Auto-default works for first address');
    passCount++;
  } else {
    console.log(`  ❌ Auto-default failed: ${JSON.stringify(autoAddr).slice(0, 100)}`);
    failCount++;
  }

  // ================================================================
  // SUMMARY
  // ================================================================
  console.log(`\n========================================`);
  console.log(`  PASS: ${passCount} | FAIL: ${failCount}`);
  console.log(`========================================\n`);

  await prisma.$disconnect();
}

main().catch(e => {
  console.error('FATAL:', e);
  prisma.$disconnect();
});

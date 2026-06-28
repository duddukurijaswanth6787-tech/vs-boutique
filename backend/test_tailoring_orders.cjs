const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();
const BASE = 'http://localhost:3005';

let adminToken, ownerToken, customerToken, boutiqueId, orderId, customerUserId;
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
  
  // 1. Create or Find Owner & Boutique
  let owner = await prisma.owner.findFirst({ where: { email: 'ordertest@owner.com' } });
  if (!owner) {
    const hash = await bcrypt.hash('Test@123', 10);
    const boutique = await prisma.boutique.create({
      data: {
        name: 'Order Test Boutique',
        ownerName: 'Order Tester',
        mobileNumber: '9999111222',
        email: 'ordertest@boutique.com',
        fullAddress: '789 Order Road',
        city: 'Order City',
        state: 'Order State',
        subscriptionEnforcement: false
      }
    });
    boutiqueId = boutique.id;
    owner = await prisma.owner.create({
      data: {
        ownerName: 'Order Tester',
        username: 'ordertester',
        email: 'ordertest@owner.com',
        mobileNumber: '9999111223',
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
    boutiqueId = owner.assignedBoutiqueId;
    await prisma.boutique.update({
      where: { id: boutiqueId },
      data: { subscriptionEnforcement: false }
    });
    console.log(`  ✅ Found existing owner: ${owner.email}`);
  }

  // 2. Create or Find Customer User record in users table
  const testPhone = '9999777666';
  let customerUser = await prisma.user.findUnique({ where: { phone: testPhone } });
  if (!customerUser) {
    customerUser = await prisma.user.create({
      data: {
        phone: testPhone,
        name: 'Order Customer User',
        status: 'ACTIVE'
      }
    });
    console.log(`  ✅ Test customer user created: ${customerUser.phone}`);
  } else {
    console.log(`  ✅ Found existing customer user: ${customerUser.phone}`);
  }
  customerUserId = customerUser.id;

  // 3. Login as admin
  const adminLogin = await req('POST', '/auth/login', { username: 'admin@vsboutique.com', password: 'admin@123' });
  if (adminLogin.status === 200) {
    adminToken = adminLogin.token;
    console.log(`  ✅ Admin logged in`);
  } else {
    console.log(`  ❌ Admin login FAILED:`, JSON.stringify(adminLogin));
  }

  // 4. Login as owner
  const ownerLogin = await req('POST', '/auth/login', { username: owner.email, password: 'Test@123' });
  if (ownerLogin.status === 200) {
    ownerToken = ownerLogin.token;
    console.log(`  ✅ Owner logged in`);
  } else {
    console.log(`  ❌ Owner login FAILED:`, JSON.stringify(ownerLogin));
    return;
  }

  // 5. Customer Login via OTP (simulated using verify-otp since we are in dev/test environment and OTP can be read or bypassed)
  // Let's call send-otp first
  const otpRes = await req('POST', '/auth/send-otp', { phone: testPhone });
  if (otpRes.status === 200) {
    // Read OTP from database directly
    const userRow = await prisma.user.findUnique({ where: { id: customerUserId } });
    const verifyRes = await req('POST', '/auth/verify-otp', { phone: testPhone, otp: userRow.otp });
    if (verifyRes.status === 200) {
      customerToken = verifyRes.token;
      console.log(`  ✅ Customer logged in`);
    } else {
      console.log(`  ❌ Customer verify OTP FAILED`);
    }
  } else {
    console.log(`  ❌ Customer send OTP FAILED`);
  }

  // ====== OWNER / ADMIN TAILORING ORDERS ======
  console.log('\n=== 📋 OWNER TAILORING ORDERS ===');
  
  const order = await t('POST /orders (create)', () =>
    req('POST', '/orders', {
      customerName: 'E2E Customer Test',
      customerPhone: testPhone,
      category: 'Blouse',
      designName: 'Silk Design',
      measurements: {
        bust: 36.5,
        waist: 28.0,
        shoulder: 14.5
      },
      pricing: {
        price: 1500,
        advancePaid: 500
      },
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }, ownerToken));

  if (order) {
    orderId = order.id || order._id;
  }

  if (orderId) {
    await t('GET /orders (list)', () =>
      req('GET', '/orders', null, ownerToken));

    await t('GET /orders/:id (detail)', () =>
      req('GET', `/orders/${orderId}`, null, ownerToken));

    await t('PUT /orders/:id/status (update status)', () =>
      req('PUT', `/orders/${orderId}/status`, { status: 'accepted', note: 'Owner accepted' }, ownerToken));

    await t('PUT /orders/:id/payment (update payment)', () =>
      req('PUT', `/orders/${orderId}/payment`, { advancePaid: 800 }, ownerToken));

    await t('PUT /orders/:id/measurements (update measurements)', () =>
      req('PUT', `/orders/${orderId}/measurements`, { bust: 37.0 }, ownerToken));
  }

  // ====== CUSTOMER TAILORING ORDERS ======
  console.log('\n=== 📱 CUSTOMER TAILORING ORDERS ===');
  if (orderId && customerToken) {
    await t('GET /orders/my (customer list)', () =>
      req('GET', '/orders/my', null, customerToken));

    await t('GET /orders/my/:id (customer detail)', () =>
      req('GET', `/orders/my/${orderId}`, null, customerToken));

    await t('POST /orders/:id/cancel (customer cancel)', () =>
      req('POST', `/orders/${orderId}/cancel`, { reason: 'Changed mind' }, customerToken));
  }

  // ====== AUTH & ACCESS ENFORCEMENT ======
  console.log('\n=== 🔒 AUTH ENFORCEMENT ===');
  await t('GET /orders (no token) -> 401', () =>
    req('GET', '/orders', null), 401);
  await t('POST /orders (no token) -> 401', () =>
    req('POST', '/orders', { customerName: 'Nope' }), 401);
  await t('GET /orders/my (no token) -> 401', () =>
    req('GET', '/orders/my', null), 401);

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

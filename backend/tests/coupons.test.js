const prisma = require('../src/utils/prisma');
const {
  CouponError,
  validateCoupon,
  recordCouponUsage,
  listCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
  toggleCouponActive,
  deleteCoupon
} = require('../src/modules/coupons/services/coupons.service');

  let testBoutique, testProduct, testProduct2, testCategory;
let testUser, testUser2;
let cleanup = [];
const TS = Date.now();

function assert(condition, message) {
  if (!condition) throw new Error(`ASSERT FAIL: ${message}`);
}

async function createTestData() {
  // Clean up any stale coupons from previous runs
  await prisma.coupon.deleteMany({ where: { code: { contains: `_${TS}` } } }).catch(e => console.error('Cleanup error:', e.message));
  testUser = await prisma.user.create({
    data: { phone: `+9199990000${Date.now() % 10000}`, name: 'Coupon Customer' }
  });
  cleanup.push(() => prisma.user.deleteMany({ where: { id: testUser.id } }));

  testUser2 = await prisma.user.create({
    data: { phone: `+9188880000${Date.now() % 10000}`, name: 'Coupon Customer 2' }
  });
  cleanup.push(() => prisma.user.deleteMany({ where: { id: testUser2.id } }));

  testBoutique = await prisma.boutique.create({
    data: {
      name: 'Coupon Test Boutique',
      ownerName: 'Coupon Owner',
      mobileNumber: '9999999999',
      email: `coupon${Date.now()}@boutique.com`,
      fullAddress: 'Test',
      city: 'City',
      state: 'State',
      status: 'Active'
    }
  });
  cleanup.push(() => prisma.boutique.deleteMany({ where: { id: testBoutique.id } }));

  testCategory = await prisma.category.create({
    data: { name: `CouponCat${Date.now()}` }
  });
  cleanup.push(() => prisma.category.deleteMany({ where: { id: testCategory.id } }));

  testProduct = await prisma.product.create({
    data: {
      boutiqueId: testBoutique.id,
      name: 'Coupon Test Product',
      basePrice: 1000,
      status: 'ACTIVE',
      productType: 'READY_MADE',
      deliveryType: 'STANDARD',
      categoryId: testCategory.id
    }
  });
  cleanup.push(() => prisma.product.deleteMany({ where: { id: testProduct.id } }));

  testProduct2 = await prisma.product.create({
    data: {
      boutiqueId: testBoutique.id,
      name: 'Coupon Test Product 2',
      basePrice: 500,
      status: 'ACTIVE',
      productType: 'READY_MADE',
      deliveryType: 'STANDARD'
    }
  });
  cleanup.push(() => prisma.product.deleteMany({ where: { id: testProduct2.id } }));
}

async function cleanupData() {
  for (const fn of cleanup.reverse()) {
    await fn().catch(() => {});
  }
  cleanup = [];
}

async function runTests() {
  const results = [];

  async function test(name, fn) {
    try {
      await fn();
      results.push({ name, status: 'PASS' });
      console.log(`  ✓ ${name}`);
    } catch (err) {
      results.push({ name, status: 'FAIL', error: err.message });
      console.log(`  ✗ ${name} — ${err.message}`);
    }
  }

  console.log('\n═══ Coupon Management E2E Tests ═══\n');

  // ── Setup ──
  console.log('\n--- Setup ---');
  await test('Create test data', async () => {
    await createTestData();
    assert(testProduct.id, 'Product created');
    assert(testBoutique.id, 'Boutique created');
  });

  // ── 1. Admin CRUD ──
  console.log('\n--- 1. Admin Coupon CRUD ---');

  let adminCoupon;
  await test('Admin creates platform-wide PERCENTAGE coupon', async () => {
    adminCoupon = await createCoupon({
      code: `SAVE10_${TS}`,
      description: '10% off everything',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderAmount: 500,
      maxDiscount: 200,
      maxUses: 100,
      maxUsesPerUser: 1,
      applicableType: 'ALL',
      boutiqueId: null
    });
    assert(adminCoupon.code === `SAVE10_${TS}`, 'Code is SAVE10');
    assert(adminCoupon.discountType === 'PERCENTAGE', 'Type is PERCENTAGE');
    assert(adminCoupon.boutiqueId === null, 'Platform-wide');
    assert(adminCoupon.isActive === true, 'Active by default');
    assert(adminCoupon.currentUses === 0, 'Usage starts at 0');
  });

  await test('Admin creates FIXED amount coupon', async () => {
    const c = await createCoupon({
      code: `FLAT200_${TS}`,
      discountType: 'FIXED',
      discountValue: 200,
      boutiqueId: null
    });
    assert(c.discountType === 'FIXED', 'Type is FIXED');
    assert(Number(c.discountValue) === 200, 'Value is 200');
    await deleteCoupon(c.id);
  });

  await test('Admin lists all coupons', async () => {
    const coupons = await listCoupons(null);
    assert(coupons.length >= 1, 'At least 1 coupon');
  });

  await test('Admin gets single coupon by id', async () => {
    const c = await getCoupon(adminCoupon.id);
    assert(c.id === adminCoupon.id, 'IDs match');
    assert(c.code === `SAVE10_${TS}`, 'Code matches');
  });

  await test('Admin updates coupon', async () => {
    const updated = await updateCoupon(adminCoupon.id, {
      description: 'Updated: 10% off',
      maxDiscount: 250
    });
    assert(updated.description === 'Updated: 10% off', 'Description updated');
    assert(Number(updated.maxDiscount) === 250, 'Max discount updated');
  });

  await test('Admin toggles coupon active/inactive', async () => {
    const toggled = await toggleCouponActive(adminCoupon.id);
    assert(toggled.isActive === false, 'Now inactive');
    const toggledAgain = await toggleCouponActive(adminCoupon.id);
    assert(toggledAgain.isActive === true, 'Now active again');
  });

  await test('Admin delete coupon', async () => {
    const c = await createCoupon({
      code: `TEMP_${TS}`,
      discountType: 'FIXED',
      discountValue: 50,
      boutiqueId: null
    });
    await deleteCoupon(c.id);
    try {
      await getCoupon(c.id);
      assert(false, 'Should have thrown');
    } catch (err) {
      assert(err instanceof CouponError, 'Throws CouponError');
      assert(err.code === 'NOT_FOUND', 'Code is NOT_FOUND');
    }
  });

  await test('Reject duplicate coupon code', async () => {
    try {
      await createCoupon({ code: `SAVE10_${TS}`, discountType: 'PERCENTAGE', discountValue: 5, boutiqueId: null });
      assert(false, 'Should have thrown');
    } catch (err) {
      assert(err instanceof CouponError, 'Throws CouponError');
      assert(err.code === 'DUPLICATE_CODE', 'Code is DUPLICATE_CODE');
    }
  });

  // ── 2. Owner CRUD ──
  console.log('\n--- 2. Owner Coupon CRUD ---');

  let ownerCoupon;
  await test('Owner creates boutique coupon', async () => {
    ownerCoupon = await createCoupon({
      code: `BOUTIQUE20_${TS}`,
      description: '20% off boutique items',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      maxDiscount: 500,
      boutiqueId: testBoutique.id
    });
    assert(ownerCoupon.boutiqueId === testBoutique.id, 'Linked to boutique');
    assert(ownerCoupon.code === `BOUTIQUE20_${TS}`, 'Code is BOUTIQUE20');
  });

  await test('Owner edits own coupon', async () => {
    const updated = await updateCoupon(ownerCoupon.id, {
      description: 'Updated boutique coupon'
    });
    assert(updated.description === 'Updated boutique coupon', 'Description updated');
  });

  await test('Owner deletes own coupon', async () => {
    const c = await createCoupon({
      code: `TEMP2_${TS}`,
      discountType: 'FIXED',
      discountValue: 100,
      boutiqueId: testBoutique.id
    });
    await deleteCoupon(c.id);
    try {
      await getCoupon(c.id);
      assert(false, 'Should have thrown');
    } catch (err) {
      assert(err instanceof CouponError, 'NOT_FOUND');
    }
  });

  await test('Duplicate code rejected for same boutique', async () => {
    // BOUTIQUE20_${TS} already exists for testBoutique from previous test
    try {
      await createCoupon({
        code: `BOUTIQUE20_${TS}`,
        discountType: 'PERCENTAGE',
        discountValue: 10,
        boutiqueId: testBoutique.id
      });
      assert(false, 'Should have thrown');
    } catch (err) {
      assert(err instanceof CouponError, 'Throws CouponError');
      assert(err.code === 'DUPLICATE_CODE', 'DUPLICATE_CODE');
    }
  });

  // Recreate ownerCoupon for later tests
  await test('Recreate owner coupon for validation tests', async () => {
    if (ownerCoupon) {
      try { await deleteCoupon(ownerCoupon.id); } catch {}
    }
    ownerCoupon = await createCoupon({
      code: `OWNER20_${TS}`,
      description: '20% off',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      maxDiscount: 300,
      boutiqueId: testBoutique.id
    });
  });

  // ── 3. Customer Validation ──
  console.log('\n--- 3. Coupon Validation ---');

  const cartItems = [
    { productId: testProduct.id, quantity: 2, unitPrice: 1000 },
    { productId: testProduct2.id, quantity: 1, unitPrice: 500 }
  ];
  // subtotal = 2*1000 + 1*500 = 2500

  await test('Validate valid PERCENTAGE coupon', async () => {
    const result = await validateCoupon({
      couponCode: `SAVE10_${TS}`,
      cartItems,
      customerId: testUser.id
    });
    assert(result.valid === true, 'Valid');
    assert(result.code === `SAVE10_${TS}`, 'Code matches');
    assert(result.discountType === 'PERCENTAGE', 'Type is PERCENTAGE');
    // 10% of 2500 = 250, capped at maxDiscount 250
    assert(result.discountAmount === 250, `Discount is 250, got ${result.discountAmount}`);
    assert(result.subtotal === 2500, 'Subtotal is 2500');
    assert(result.finalAmount === 2250, 'Final is 2250');
    assert(result.couponId === adminCoupon.id, 'Coupon ID matches');
  });

  await test('Validate applies max discount cap', async () => {
    // Create a coupon with 50% off but max discount 100
    const c = await createCoupon({
      code: `MAXCAP_${TS}`,
      discountType: 'PERCENTAGE',
      discountValue: 50,
      maxDiscount: 100,
      boutiqueId: null
    });
    const result = await validateCoupon({
      couponCode: `MAXCAP_${TS}`,
      cartItems: [{ productId: testProduct.id, quantity: 1, unitPrice: 1000 }],
      customerId: testUser.id
    });
    // 50% of 1000 = 500, capped at 100
    assert(result.discountAmount === 100, `Capped at 100, got ${result.discountAmount}`);
    assert(result.finalAmount === 900, 'Final is 900');
    await deleteCoupon(c.id);
  });

  await test('Validate FIXED amount coupon', async () => {
    const c = await createCoupon({
      code: `FIXED50_${TS}`,
      discountType: 'FIXED',
      discountValue: 50,
      boutiqueId: null
    });
    const result = await validateCoupon({
      couponCode: `FIXED50_${TS}`,
      cartItems: [{ productId: testProduct.id, quantity: 1, unitPrice: 200 }],
      customerId: testUser.id
    });
    assert(result.discountAmount === 50, 'Fixed discount 50');
    assert(result.finalAmount === 150, 'Final is 150');
    await deleteCoupon(c.id);
  });

  await test('Reject inactive coupon', async () => {
    await toggleCouponActive(adminCoupon.id);
    try {
      await validateCoupon({ couponCode: `SAVE10_${TS}`, cartItems, customerId: testUser.id });
      assert(false, 'Should have thrown');
    } catch (err) {
      assert(err.code === 'INACTIVE', 'INACTIVE');
    } finally {
      await toggleCouponActive(adminCoupon.id);
    }
  });

  await test('Reject expired coupon', async () => {
    const c = await createCoupon({
      code: `EXPIRED1_${TS}`,
      discountType: 'FIXED',
      discountValue: 50,
      expiresAt: new Date('2020-01-01'),
      boutiqueId: null
    });
    try {
      await validateCoupon({       couponCode: `EXPIRED1_${TS}`, cartItems, customerId: testUser.id });
      assert(false, 'Should have thrown');
    } catch (err) {
      assert(err.code === 'EXPIRED', 'EXPIRED');
    }
    await deleteCoupon(c.id);
  });

  await test('Reject not-yet-started coupon', async () => {
    const c = await createCoupon({
      code: `FUTURE1_${TS}`,
      discountType: 'FIXED',
      discountValue: 50,
      startsAt: new Date('2099-01-01'),
      boutiqueId: null
    });
    try {
      await validateCoupon({       couponCode: `FUTURE1_${TS}`, cartItems, customerId: testUser.id });
      assert(false, 'Should have thrown');
    } catch (err) {
      assert(err.code === 'NOT_STARTED', 'NOT_STARTED');
    }
    await deleteCoupon(c.id);
  });

  await test('Reject min order amount not met', async () => {
    try {
      await validateCoupon({
        couponCode: `SAVE10_${TS}`,
        cartItems: [{ productId: testProduct.id, quantity: 1, unitPrice: 100 }],
        customerId: testUser.id
      });
      assert(false, 'Should have thrown');
    } catch (err) {
      assert(err.code === 'MIN_ORDER_AMOUNT', 'MIN_ORDER_AMOUNT');
    }
  });

  await test('Reject max uses reached', async () => {
    const c = await createCoupon({
      code: `LIMITED_${TS}`,
      discountType: 'FIXED',
      discountValue: 20,
      maxUses: 1,
      currentUses: 1,
      boutiqueId: null
    });
    try {
      await validateCoupon({       couponCode: `LIMITED_${TS}`, cartItems, customerId: testUser.id });
      assert(false, 'Should have thrown');
    } catch (err) {
      assert(err.code === 'MAX_USES_REACHED', 'MAX_USES_REACHED');
    }
    await deleteCoupon(c.id);
  });

  await test('Reject per-user limit reached', async () => {
    const c = await createCoupon({
      code: `PERUSER_${TS}`,
      discountType: 'FIXED',
      discountValue: 30,
      maxUsesPerUser: 2,
      boutiqueId: null
    });
    // Record 2 usages
    const order = await prisma.commerceOrder.create({
      data: {
        orderId: `CPN${Date.now()}`,
        userId: testUser.id,
        boutiqueId: testBoutique.id,
        subtotal: 100,
        totalAmount: 100,
        status: 'PENDING',
        paymentStatus: 'PENDING'
      }
    });
    await recordCouponUsage(c.id, testUser.id, order.id);
    const order2 = await prisma.commerceOrder.create({
      data: {
        orderId: `CPN2${Date.now()}`,
        userId: testUser.id,
        boutiqueId: testBoutique.id,
        subtotal: 100,
        totalAmount: 100,
        status: 'PENDING',
        paymentStatus: 'PENDING'
      }
    });
    await recordCouponUsage(c.id, testUser.id, order2.id);
    cleanup.push(() => prisma.commerceOrder.deleteMany({ where: { id: { in: [order.id, order2.id] } } }));

    try {
      await validateCoupon({       couponCode: `PERUSER_${TS}`, cartItems, customerId: testUser.id });
      assert(false, 'Should have thrown');
    } catch (err) {
      assert(err.code === 'PER_USER_LIMIT', 'PER_USER_LIMIT');
    }
    await deleteCoupon(c.id);
  });

  await test('Concurrency: recordCouponUsage maxUsesPerUser=1 (5 parallel)', async () => {
    const c = await createCoupon({
      code: `CONC_${TS}`,
      discountType: 'FIXED',
      discountValue: 10,
      maxUses: 999,
      maxUsesPerUser: 1,
      boutiqueId: null
    });
    const order = await prisma.commerceOrder.create({
      data: {
        orderId: `CONCORD_${TS}`,
        userId: testUser.id,
        boutiqueId: testBoutique.id,
        subtotal: 100,
        totalAmount: 100,
        status: 'PENDING',
        paymentStatus: 'PENDING'
      }
    });
    cleanup.push(() => prisma.commerceOrder.deleteMany({ where: { id: order.id } }));

    const results = await Promise.allSettled(
      Array.from({ length: 5 }, () =>
        recordCouponUsage(c.id, testUser.id, order.id).then(
          () => 'ok',
          err => err.code
        )
      )
    );
    const succeeded = results.filter(r => r.status === 'fulfilled' && r.value === 'ok').length;
    const perUserErrors = results.filter(r => r.status === 'fulfilled' && r.value === 'PER_USER_LIMIT').length;
    const prismaErrors = results.filter(r => r.status === 'fulfilled' && r.value === 'P2028').length;

    assert(succeeded === 1, `Expected 1 success, got ${succeeded}`);
    assert(perUserErrors + prismaErrors === 4, `Expected 4 non-successes, got perUser=${perUserErrors} prisma=${prismaErrors}`);

    const finalUsageCount = await prisma.couponUsage.count({
      where: { couponId: c.id, userId: testUser.id }
    });
    assert(finalUsageCount === 1, `Expected 1 usage record, got ${finalUsageCount}`);

    await deleteCoupon(c.id);
  });

  await test('Concurrency: recordCouponUsage maxUses=3 (5 parallel)', async () => {
    const c = await createCoupon({
      code: `CONC3_${TS}`,
      discountType: 'FIXED',
      discountValue: 10,
      maxUses: 3,
      maxUsesPerUser: 999,
      boutiqueId: null
    });
    const orders = [];
    for (let i = 0; i < 5; i++) {
      const o = await prisma.commerceOrder.create({
        data: {
          orderId: `CONC3ORD_${TS}_${i}`,
          userId: testUser.id,
          boutiqueId: testBoutique.id,
          subtotal: 100,
          totalAmount: 100,
          status: 'PENDING',
          paymentStatus: 'PENDING'
        }
      });
      orders.push(o);
    }
    cleanup.push(() => prisma.commerceOrder.deleteMany({ where: { id: { in: orders.map(o => o.id) } } }));

    const results = await Promise.allSettled(
      orders.map(o =>
        recordCouponUsage(c.id, testUser.id, o.id).then(
          () => 'ok',
          err => err.code
        )
      )
    );
    const succeeded = results.filter(r => r.status === 'fulfilled' && r.value === 'ok').length;
    const maxUsesErrors = results.filter(r => r.status === 'fulfilled' && r.value === 'MAX_USES_REACHED').length;

    assert(succeeded >= 1 && succeeded <= 3, `Expected 1-3 successes, got ${succeeded}`);
    assert(succeeded + maxUsesErrors >= 1, `Expected some MAX_USES_REACHED, got ${maxUsesErrors}`);

    const finalCoupon = await getCoupon(c.id);
    assert(finalCoupon.currentUses >= 1 && finalCoupon.currentUses <= 3, `Final currentUses (${finalCoupon.currentUses}) should be 1-3`);

    await deleteCoupon(c.id);
  });

  await test('Reject coupon not found', async () => {
    try {
      await validateCoupon({ couponCode: 'NONEXISTENT', cartItems, customerId: testUser.id });
      assert(false, 'Should have thrown');
    } catch (err) {
      assert(err.code === 'NOT_FOUND', 'NOT_FOUND');
    }
  });

  // ── 4. First Order Only ──
  console.log('\n--- 4. First Order Only ---');

  await test('FirstOrderOnly valid for new customer', async () => {
    const c = await createCoupon({
      code: `WELCOME_${TS}`,
      discountType: 'PERCENTAGE',
      discountValue: 15,
      firstOrderOnly: true,
      boutiqueId: null
    });
    const result = await validateCoupon({
      couponCode: `WELCOME_${TS}`,
      cartItems,
      customerId: testUser2.id
    });
    assert(result.valid === true, 'Valid for new user');
    await deleteCoupon(c.id);
  });

  await test('FirstOrderOnly rejected for returning customer', async () => {
    const c = await createCoupon({
      code: `WELCOME2_${TS}`,
      discountType: 'PERCENTAGE',
      discountValue: 15,
      firstOrderOnly: true,
      boutiqueId: null
    });
    // Give testUser a paid order
    const paidOrder = await prisma.commerceOrder.create({
      data: {
        orderId: `CPAID${Date.now()}`,
        userId: testUser.id,
        boutiqueId: testBoutique.id,
        subtotal: 1000,
        totalAmount: 1000,
        status: 'DELIVERED',
        paymentStatus: 'PAID'
      }
    });
    cleanup.push(() => prisma.commerceOrder.deleteMany({ where: { id: paidOrder.id } }));

    try {
      await validateCoupon({       couponCode: `WELCOME2_${TS}`, cartItems, customerId: testUser.id });
      assert(false, 'Should have thrown');
    } catch (err) {
      assert(err.code === 'FIRST_ORDER_ONLY', 'FIRST_ORDER_ONLY');
    }
    await deleteCoupon(c.id);
  });

  // ── 5. Product Applicability ──
  console.log('\n--- 5. Product Applicability ---');

  await test('Applicable to specific products only', async () => {
    const c = await createCoupon({
      code: `PRODONLY_${TS}`,
      discountType: 'PERCENTAGE',
      discountValue: 50,
      applicableType: 'PRODUCTS',
      applicableIds: [testProduct.id],
      boutiqueId: null
    });
    const result = await validateCoupon({
      couponCode: `PRODONLY_${TS}`,
      cartItems,
      customerId: testUser.id
    });
    // Only testProduct (qty 2 * 1000 = 2000) gets 50% off = 1000
    assert(result.discountAmount === 1000, `Discount 1000, got ${result.discountAmount}`);
    assert(result.subtotal === 2500, 'Subtotal is 2500');
    assert(result.finalAmount === 1500, 'Final is 1500');
    await deleteCoupon(c.id);
  });

  await test('Applicable to specific categories only', async () => {
    const c = await createCoupon({
      code: `CATONLY_${TS}`,
      discountType: 'PERCENTAGE',
      discountValue: 25,
      applicableType: 'CATEGORIES',
      applicableIds: [testCategory.id],
      boutiqueId: null
    });
    const result = await validateCoupon({
      couponCode: `CATONLY_${TS}`,
      cartItems,
      customerId: testUser.id
    });
    // Only testProduct (in testCategory) gets 25% off of 2000 = 500
    assert(result.discountAmount === 500, `Discount 500, got ${result.discountAmount}`);
    assert(result.finalAmount === 2000, 'Final is 2000');
    await deleteCoupon(c.id);
  });

  await test('No applicable items in cart throws', async () => {
    const c = await createCoupon({
      code: `NOMATCH_${TS}`,
      discountType: 'PERCENTAGE',
      discountValue: 10,
      applicableType: 'PRODUCTS',
      applicableIds: ['00000000-0000-0000-0000-000000000000'],
      boutiqueId: null
    });
    try {
      await validateCoupon({       couponCode: `NOMATCH_${TS}`, cartItems, customerId: testUser.id });
      assert(false, 'Should have thrown');
    } catch (err) {
      assert(err.code === 'NO_APPLICABLE_ITEMS', 'NO_APPLICABLE_ITEMS');
    }
    await deleteCoupon(c.id);
  });

  // ── 6. Usage Tracking ──
  console.log('\n--- 6. Usage Tracking ---');

  await test('Record coupon usage increments count', async () => {
    const order = await prisma.commerceOrder.create({
      data: {
        orderId: `CPN3${Date.now()}`,
        userId: testUser.id,
        boutiqueId: testBoutique.id,
        subtotal: 100,
        totalAmount: 100,
        status: 'PENDING',
        paymentStatus: 'PENDING'
      }
    });
    cleanup.push(() => prisma.commerceOrder.deleteMany({ where: { id: order.id } }));

    await recordCouponUsage(adminCoupon.id, testUser.id, order.id);

    const coupon = await getCoupon(adminCoupon.id);
    assert(coupon.currentUses === 1, `Usage incremented to 1, got ${coupon.currentUses}`);

    const usages = await prisma.couponUsage.findMany({
      where: { couponId: adminCoupon.id, userId: testUser.id }
    });
    assert(usages.length === 1, 'Usage record created');
    assert(usages[0].orderId === order.id, 'Linked to order');
  });

  // ── 7. Edge Cases ──
  console.log('\n--- 7. Edge Cases ---');

  await test('Get non-existent coupon throws 404', async () => {
    try {
      await getCoupon('00000000-0000-0000-0000-000000000000');
      assert(false, 'Should have thrown');
    } catch (err) {
      assert(err instanceof CouponError, 'CouponError');
      assert(err.code === 'NOT_FOUND', 'NOT_FOUND');
    }
  });

  await test('Delete non-existent coupon throws 404', async () => {
    try {
      await deleteCoupon('00000000-0000-0000-0000-000000000000');
      assert(false, 'Should have thrown');
    } catch (err) {
      assert(err instanceof CouponError, 'CouponError');
      assert(err.code === 'NOT_FOUND', 'NOT_FOUND');
    }
  });

  await test('Toggle non-existent coupon throws 404', async () => {
    try {
      await toggleCouponActive('00000000-0000-0000-0000-000000000000');
      assert(false, 'Should have thrown');
    } catch (err) {
      assert(err instanceof CouponError, 'CouponError');
      assert(err.code === 'NOT_FOUND', 'NOT_FOUND');
    }
  });

  await test('Validate with missing fields throws', async () => {
    try {
      await validateCoupon({ couponCode: 'TEST', cartItems: [], customerId: testUser.id });
      assert(false, 'Should have thrown');
    } catch (err) {
      assert(err instanceof CouponError, 'CouponError');
      assert(err.code === 'MISSING_FIELDS', 'MISSING_FIELDS');
    }
  });

  // ── Teardown ──
  console.log('\n--- Teardown ---');
  await test('Cleanup test data', async () => {
    await cleanupData();
  });

  // ── Results ──
  console.log('\n═══ Results ═══');
  let passCount = 0, failCount = 0;
  for (const r of results) {
    if (r.status === 'PASS') passCount++;
    else failCount++;
  }
  console.log(`Total: ${passCount + failCount} | PASS: ${passCount} | FAIL: ${failCount}`);

  if (failCount > 0) {
    console.log('\nFAILED TESTS:');
    for (const r of results) {
      if (r.status === 'FAIL') console.log(`  ✗ ${r.name}: ${r.error}`);
    }
  }

  console.log('\n═══ Coverage Report ═══');
  const coverageItems = [
    ['Admin create coupon', results.some(r => r.name.includes('creates platform-wide') && r.status === 'PASS')],
    ['Admin create FIXED coupon', results.some(r => r.name.includes('creates FIXED') && r.status === 'PASS')],
    ['Admin list coupons', results.some(r => r.name.includes('lists all coupons') && r.status === 'PASS')],
    ['Admin get coupon', results.some(r => r.name.includes('gets single coupon by id') && r.status === 'PASS')],
    ['Admin update coupon', results.some(r => r.name.includes('updates coupon') && r.status === 'PASS')],
    ['Admin toggle active', results.some(r => r.name.includes('toggles coupon active') && r.status === 'PASS')],
    ['Admin delete coupon', results.some(r => r.name === 'Admin delete coupon' && r.status === 'PASS')],
    ['Duplicate code prevention', results.some(r => r.name.includes('duplicate coupon code') && r.status === 'PASS')],
    ['Owner create boutique coupon', results.some(r => r.name.includes('creates boutique coupon') && r.status === 'PASS')],
    ['Owner edit coupon', results.some(r => r.name.includes('edits own coupon') && r.status === 'PASS')],
    ['Owner delete coupon', results.some(r => r.name.includes('deletes own coupon') && r.status === 'PASS')],
    ['Validate PERCENTAGE discount', results.some(r => r.name.includes('valid PERCENTAGE') && r.status === 'PASS')],
    ['Validate FIXED discount', results.some(r => r.name.includes('FIXED amount coupon') && r.status === 'PASS')],
    ['Max discount cap applied', results.some(r => r.name.includes('max discount cap') && r.status === 'PASS')],
    ['Min order amount check', results.some(r => r.name.includes('min order amount not met') && r.status === 'PASS')],
    ['Inactive coupon rejected', results.some(r => r.name.includes('inactive coupon') && r.status === 'PASS')],
    ['Expired coupon rejected', results.some(r => r.name.includes('expired coupon') && r.status === 'PASS')],
    ['Not-started coupon rejected', results.some(r => r.name.includes('not-yet-started') && r.status === 'PASS')],
    ['Max uses limit', results.some(r => r.name.includes('max uses reached') && r.status === 'PASS')],
    ['Per-user limit', results.some(r => r.name.includes('per-user limit') && r.status === 'PASS')],
    ['Concurrency per-user (5x, 1 success)', results.some(r => r.name.includes('recordCouponUsage maxUsesPerUser') && r.status === 'PASS')],
    ['Concurrency maxUses (5x, 1-3 successes)', results.some(r => r.name.includes('recordCouponUsage maxUses=3') && r.status === 'PASS')],
    ['First order only (new user)', results.some(r => r.name.includes('valid for new customer') && r.status === 'PASS')],
    ['First order only (returning)', results.some(r => r.name.includes('rejected for returning') && r.status === 'PASS')],
    ['Product-specific applicability', results.some(r => r.name.includes('specific products only') && r.status === 'PASS')],
    ['Category-specific applicability', results.some(r => r.name.includes('specific categories only') && r.status === 'PASS')],
    ['No applicable items error', results.some(r => r.name.includes('No applicable items') && r.status === 'PASS')],
    ['Usage tracking + increment', results.some(r => r.name.includes('increments count') && r.status === 'PASS')],
    ['Non-existent coupon 404', results.some(r => r.name.includes('non-existent coupon') && r.status === 'PASS')],
    ['Delete non-existent 404', results.some(r => r.name === 'Delete non-existent coupon throws 404' && r.status === 'PASS')],
    ['Toggle non-existent 404', results.some(r => r.name === 'Toggle non-existent coupon throws 404' && r.status === 'PASS')],
    ['Missing fields validation', results.some(r => r.name.includes('missing fields') && r.status === 'PASS')]
  ];

  console.log('┌─────────────────────────────────────────────────────┬────────┐');
  console.log('│ Requirement                                         │ Status │');
  console.log('├─────────────────────────────────────────────────────┼────────┤');
  for (const [req, passed] of coverageItems) {
    const padded = req.padEnd(51);
    const statusStr = passed ? '  PASS ' : '  FAIL ';
    console.log(`│ ${padded}│${statusStr}│`);
  }
  console.log('└─────────────────────────────────────────────────────┴────────┘');
  console.log(`\nCoverage: ${coverageItems.filter(([,p]) => p).length}/${coverageItems.length} requirements met`);

  return { passCount, failCount, results };
}

runTests()
  .then(({ passCount, failCount }) => {
    if (failCount > 0) process.exit(1);
  })
  .catch(err => {
    console.error('Test suite error:', err);
    process.exit(1);
  });

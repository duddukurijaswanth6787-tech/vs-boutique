const prisma = require('../src/utils/prisma');
const {
  generateOrderNumber,
  reserveInventory,
  releaseInventory,
  deductInventory,
  createOrderHistory,
  createPayment,
  CommerceError
} = require('../src/modules/commerce/services/commerce.service');

let testBoutique, testProduct, testVariant, testUser;
let cleanup = [];

async function createTestData() {
  testUser = await prisma.user.create({
    data: { phone: `+9199990000${Date.now() % 10000}`, name: 'Test Customer' }
  });
  cleanup.push(() => prisma.user.deleteMany({ where: { id: testUser.id } }));

  testBoutique = await prisma.boutique.create({
    data: {
      name: 'Test Boutique',
      ownerName: 'Test Owner',
      mobileNumber: '9999999999',
      email: `test${Date.now()}@boutique.com`,
      fullAddress: 'Test Address',
      city: 'Test City',
      state: 'Test State',
      status: 'Active'
    }
  });
  cleanup.push(() => prisma.boutique.deleteMany({ where: { id: testBoutique.id } }));

  testProduct = await prisma.product.create({
    data: {
      boutiqueId: testBoutique.id,
      name: 'Test Product',
      basePrice: 1000,
      status: 'ACTIVE',
      productType: 'READY_MADE',
      deliveryType: 'STANDARD'
    }
  });
  cleanup.push(() => prisma.product.deleteMany({ where: { id: testProduct.id } }));

  testVariant = await prisma.productVariant.create({
    data: {
      productId: testProduct.id,
      name: 'Size M',
      price: 1000,
      status: 'ACTIVE',
      inventory: {
        create: {
          quantity: 5,
          reservedQuantity: 0,
          trackInventory: true,
          lowStockThreshold: 2
        }
      }
    },
    include: { inventory: true }
  });
  cleanup.push(() => prisma.productVariant.deleteMany({ where: { id: testVariant.id } }));
}

async function destroyTestData() {
  for (const fn of cleanup.reverse()) {
    try { await fn(); } catch (e) { /* ignore cleanup errors */ }
  }
  cleanup = [];
}

// Test 1: generateOrderNumber
async function testGenerateOrderNumber() {
  console.log('\n--- Test 1: generateOrderNumber ---');
  const num = await prisma.$transaction(tx => generateOrderNumber(tx));
  if (!num || !num.startsWith('ORD-')) throw new Error(`Invalid order number: ${num}`);
  console.log(`  PASS: Generated order number ${num}`);
}

// Test 2: reserveInventory basic
async function testReserveInventory() {
  console.log('\n--- Test 2: reserveInventory ---');
  await prisma.$transaction(async (tx) => {
    const before = await tx.productInventory.findUnique({ where: { variantId: testVariant.id } });
    console.log(`  Before: qty=${before.quantity}, reserved=${before.reservedQuantity}, version=${before.version}`);

    await reserveInventory(tx, testVariant.id, 2);

    const after = await tx.productInventory.findUnique({ where: { variantId: testVariant.id } });
    console.log(`  After: qty=${after.quantity}, reserved=${after.reservedQuantity}, version=${after.version}`);

    if (after.reservedQuantity !== 2) throw new Error(`Expected reserved=2, got ${after.reservedQuantity}`);
    if (after.quantity !== 5) throw new Error(`Quantity should remain 5, got ${after.quantity}`);
    if (after.version !== before.version + 1) throw new Error(`Version should increment`);
    console.log('  PASS: Reserved 2 units correctly');
  });
}

// Test 3: reserveInventory insufficient stock
async function testReserveInsufficient() {
  console.log('\n--- Test 3: reserveInventory insufficient stock ---');
  let threw = false;
  try {
    await prisma.$transaction(tx => reserveInventory(tx, testVariant.id, 10));
  } catch (e) {
    threw = true;
    if (e.code !== 'INSUFFICIENT_STOCK') throw new Error(`Wrong error code: ${e.code}`);
    console.log('  PASS: Correctly rejected insufficient stock');
  }
  if (!threw) throw new Error('Should have thrown INSUFFICIENT_STOCK');
}

// Test 4: releaseInventory
async function testReleaseInventory() {
  console.log('\n--- Test 4: releaseInventory ---');
  await prisma.$transaction(async (tx) => {
    // Currently reserved=2 from test 2
    const before = await tx.productInventory.findUnique({ where: { variantId: testVariant.id } });
    console.log(`  Before release: qty=${before.quantity}, reserved=${before.reservedQuantity}`);

    await releaseInventory(tx, testVariant.id, 1);

    const after = await tx.productInventory.findUnique({ where: { variantId: testVariant.id } });
    console.log(`  After release: qty=${after.quantity}, reserved=${after.reservedQuantity}`);

    if (after.reservedQuantity !== 1) throw new Error(`Expected reserved=1, got ${after.reservedQuantity}`);
    console.log('  PASS: Released 1 unit correctly');
  });
}

// Test 5: deductInventory
async function testDeductInventory() {
  console.log('\n--- Test 5: deductInventory ---');
  await prisma.$transaction(async (tx) => {
    // Currently reserved=1, qty=5
    const before = await tx.productInventory.findUnique({ where: { variantId: testVariant.id } });
    console.log(`  Before deduct: qty=${before.quantity}, reserved=${before.reservedQuantity}`);

    await deductInventory(tx, testVariant.id, 1);

    const after = await tx.productInventory.findUnique({ where: { variantId: testVariant.id } });
    console.log(`  After deduct: qty=${after.quantity}, reserved=${after.reservedQuantity}`);

    if (after.quantity !== 4) throw new Error(`Expected qty=4, got ${after.quantity}`);
    if (after.reservedQuantity !== 0) throw new Error(`Expected reserved=0, got ${after.reservedQuantity}`);
    console.log('  PASS: Deducted 1 unit, reserved cleared');
  });
}

// Test 6: createOrderHistory
async function testCreateOrderHistory() {
  console.log('\n--- Test 6: createOrderHistory ---');
  const order = await prisma.commerceOrder.create({
    data: {
      orderId: `TEST-${Date.now()}`,
      userId: testUser.id,
      boutiqueId: testBoutique.id,
      subtotal: 1000,
      totalAmount: 1000
    }
  });
  cleanup.push(() => prisma.commerceOrder.deleteMany({ where: { id: order.id } }));

  await prisma.$transaction(async (tx) => {
    const history = await createOrderHistory(tx, order.id, null, 'PENDING', 'Order created', 'customer', testUser.id);
    if (!history || history.toStatus !== 'PENDING') throw new Error('History creation failed');
    console.log(`  PASS: Created history entry id=${history.id}`);
  });
}

// Test 7: createPayment
async function testCreatePayment() {
  console.log('\n--- Test 7: createPayment ---');
  const order = await prisma.commerceOrder.create({
    data: {
      orderId: `TEST-PAY-${Date.now()}`,
      userId: testUser.id,
      boutiqueId: testBoutique.id,
      subtotal: 500,
      totalAmount: 500
    }
  });
  cleanup.push(() => prisma.commerceOrder.deleteMany({ where: { id: order.id } }));

  await prisma.$transaction(async (tx) => {
    const payment = await createPayment(tx, order.id, 500, 'card', 'rzp_test_123');
    if (!payment || payment.status !== 'PENDING') throw new Error('Payment creation failed');
    if (Number(payment.amount) !== 500) throw new Error(`Expected amount=500, got ${payment.amount}`);
    console.log(`  PASS: Created payment id=${payment.id}, amount=${payment.amount}`);
  });
}

// Test 8: Concurrent reservations — strict oversell prevention
async function testConcurrentReservations() {
  console.log('\n--- Test 8: Concurrent reservations (oversell prevention) ---');

  // Reset inventory to exactly 3 units
  await prisma.productInventory.upsert({
    where: { variantId: testVariant.id },
    create: { variantId: testVariant.id, quantity: 3, reservedQuantity: 0, trackInventory: true },
    update: { quantity: 3, reservedQuantity: 0, trackInventory: true }
  });

  const inventory = await prisma.productInventory.findUnique({ where: { variantId: testVariant.id } });
  console.log(`  Initial inventory: qty=${inventory.quantity}, reserved=${inventory.reservedQuantity}, version=${inventory.version}`);

  // Fire 5 concurrent reservation requests for 1 unit each
  // Only 3 should succeed (total stock = 3)
  const tasks = [];
  const results = [];
  for (let i = 0; i < 5; i++) {
    tasks.push(
      prisma.$transaction(async (tx) => {
        await reserveInventory(tx, testVariant.id, 1);
        return `request-${i}`;
      }).catch(e => `FAIL: ${e.code || e.message}`)
    );
  }

  const outcomes = await Promise.all(tasks);
  const succeeded = outcomes.filter(o => !o.startsWith('FAIL'));
  const failed = outcomes.filter(o => o.startsWith('FAIL'));

  console.log(`  Succeeded: ${succeeded.length} (${succeeded.join(', ')} or fewer)`);
  console.log(`  Failed: ${failed.length} (${failed.join(', ')})`);

  const final = await prisma.productInventory.findUnique({ where: { variantId: testVariant.id } });
  console.log(`  Final inventory: qty=${final.quantity}, reserved=${final.reservedQuantity}, version=${final.version}`);

  if (final.reservedQuantity > 3) throw new Error(`OVERSELL: Reserved ${final.reservedQuantity} but only 3 available`);
  if (succeeded.length > 3) throw new Error(`OVERSELL: ${succeeded.length} succeeded but only 3 stock`);
  console.log(`  PASS: No overselling — reserved=${final.reservedQuantity}, succeeded=${succeeded.length}`);

  // Release all to reset
  await prisma.$transaction(async (tx) => {
    await prisma.productInventory.update({
      where: { variantId: testVariant.id },
      data: { reservedQuantity: 0 }
    });
  });
}

// Test 9: Full checkout lifecycle simulation
async function testCheckoutLifecycle() {
  console.log('\n--- Test 9: Full checkout lifecycle ---');
  
  // Reset inventory
  await prisma.productInventory.upsert({
    where: { variantId: testVariant.id },
    create: { variantId: testVariant.id, quantity: 3, reservedQuantity: 0, trackInventory: true },
    update: { quantity: 3, reservedQuantity: 0, trackInventory: true }
  });

  const inv1 = await prisma.productInventory.findUnique({ where: { variantId: testVariant.id } });
  console.log(`  Initial: qty=${inv1.quantity}, reserved=${inv1.reservedQuantity}, version=${inv1.version}`);

  // Step 1: Create cart and add item
  const cart = await prisma.cart.upsert({
    where: { userId: testUser.id },
    create: { userId: testUser.id, items: { create: { productId: testProduct.id, variantId: testVariant.id, quantity: 2 } } },
    update: {},
    include: { items: true }
  });
  cleanup.push(() => prisma.cartItem.deleteMany({ where: { cartId: cart.id } }));
  console.log(`  Cart created with item qty=2`);

  // Step 2: Create order (reserves inventory)
  const mockOrder = await prisma.$transaction(async (tx) => {
    const orderId = await generateOrderNumber(tx);
    const o = await tx.commerceOrder.create({
      data: {
        orderId,
        userId: testUser.id,
        boutiqueId: testBoutique.id,
        subtotal: 2000,
        totalAmount: 2000
      }
    });
    await tx.commerceOrderItem.create({
      data: {
        orderId: o.id,
        productId: testProduct.id,
        variantId: testVariant.id,
        productName: testProduct.name,
        quantity: 2,
        unitPrice: 1000,
        totalPrice: 2000
      }
    });
    await reserveInventory(tx, testVariant.id, 2);
    await createOrderHistory(tx, o.id, null, 'PENDING', 'Test order');
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    return o;
  });
  cleanup.push(() => prisma.commerceOrder.deleteMany({ where: { id: mockOrder.id } }));
  cleanup.push(() => prisma.commerceOrderItem.deleteMany({ where: { orderId: mockOrder.id } }));

  const inv2 = await prisma.productInventory.findUnique({ where: { variantId: testVariant.id } });
  console.log(`  After order create (reserved): qty=${inv2.quantity}, reserved=${inv2.reservedQuantity}, version=${inv2.version}`);
  if (inv2.reservedQuantity !== 2) throw new Error(`Expected reserved=2, got ${inv2.reservedQuantity}`);

  // Step 3: Create payment record (simulates create-payment)
  const payment = await prisma.$transaction(tx => createPayment(tx, mockOrder.id, 2000, 'card', 'rzp_test'));
  console.log(`  Payment created: id=${payment.id}, status=${payment.status}`);

  // Step 4: Verify payment (deducts inventory — simulates verify-payment)
  await prisma.$transaction(async (tx) => {
    await tx.commercePayment.update({
      where: { id: payment.id },
      data: { status: 'PAID', razorpayPaymentId: 'pay_test', razorpaySignature: 'sign' }
    });
    await tx.commerceOrder.update({
      where: { id: mockOrder.id },
      data: { paymentStatus: 'PAID', status: 'CONFIRMED', paidAt: new Date() }
    });
    await deductInventory(tx, testVariant.id, 2);
    await createOrderHistory(tx, mockOrder.id, 'PENDING', 'CONFIRMED', 'Payment verified');
  });

  const inv3 = await prisma.productInventory.findUnique({ where: { variantId: testVariant.id } });
  console.log(`  After payment (deducted): qty=${inv3.quantity}, reserved=${inv3.reservedQuantity}, version=${inv3.version}`);
  if (inv3.quantity !== 1) throw new Error(`Expected qty=1, got ${inv3.quantity}`);
  if (inv3.reservedQuantity !== 0) throw new Error(`Expected reserved=0, got ${inv3.reservedQuantity}`);

  // Step 5: Cancel remaining mock order (releases inventory if any left)
  const mockOrder2 = await prisma.$transaction(async (tx) => {
    const orderId = await generateOrderNumber(tx);
    const o = await tx.commerceOrder.create({
      data: {
        orderId,
        userId: testUser.id,
        boutiqueId: testBoutique.id,
        subtotal: 1000,
        totalAmount: 1000
      }
    });
    await tx.commerceOrderItem.create({
      data: {
        orderId: o.id,
        productId: testProduct.id,
        variantId: testVariant.id,
        productName: testProduct.name,
        quantity: 1,
        unitPrice: 1000,
        totalPrice: 1000
      }
    });
    await reserveInventory(tx, testVariant.id, 1);
    return o;
  });
  cleanup.push(() => prisma.commerceOrder.deleteMany({ where: { id: mockOrder2.id } }));
  cleanup.push(() => prisma.commerceOrderItem.deleteMany({ where: { orderId: mockOrder2.id } }));

  const inv4 = await prisma.productInventory.findUnique({ where: { variantId: testVariant.id } });
  console.log(`  Before cancel: qty=${inv4.quantity}, reserved=${inv4.reservedQuantity}`);
  if (inv4.reservedQuantity !== 1) throw new Error(`Expected reserved=1, got ${inv4.reservedQuantity}`);

  // Cancel order — should release inventory
  await prisma.$transaction(async (tx) => {
    await tx.commerceOrder.update({
      where: { id: mockOrder2.id },
      data: { status: 'CANCELLED', cancelledAt: new Date() }
    });
    await releaseInventory(tx, testVariant.id, 1);
    await createOrderHistory(tx, mockOrder2.id, 'PENDING', 'CANCELLED', 'Test cancel');
  });

  const inv5 = await prisma.productInventory.findUnique({ where: { variantId: testVariant.id } });
  console.log(`  After cancel (released): qty=${inv5.quantity}, reserved=${inv5.reservedQuantity}, version=${inv5.version}`);
  if (inv5.reservedQuantity !== 0) throw new Error(`Expected reserved=0 after cancel, got ${inv5.reservedQuantity}`);

  console.log('  PASS: Full checkout lifecycle correct');
}

// Test 10: Verify payment failure releases inventory
async function testPaymentFailureReleases() {
  console.log('\n--- Test 10: Payment failure inventory release ---');
  
  await prisma.productInventory.upsert({
    where: { variantId: testVariant.id },
    create: { variantId: testVariant.id, quantity: 2, reservedQuantity: 0, trackInventory: true },
    update: { quantity: 2, reservedQuantity: 0, trackInventory: true }
  });

  // Create order and reserve
  const failOrder = await prisma.$transaction(async (tx) => {
    const orderId = await generateOrderNumber(tx);
    const o = await tx.commerceOrder.create({
      data: {
        orderId,
        userId: testUser.id,
        boutiqueId: testBoutique.id,
        subtotal: 1000,
        totalAmount: 1000
      }
    });
    await tx.commerceOrderItem.create({
      data: {
        orderId: o.id,
        productId: testProduct.id,
        variantId: testVariant.id,
        productName: testProduct.name,
        quantity: 2,
        unitPrice: 500,
        totalPrice: 1000
      }
    });
    await reserveInventory(tx, testVariant.id, 2);
    return o;
  });
  cleanup.push(() => prisma.commerceOrder.deleteMany({ where: { id: failOrder.id } }));
  cleanup.push(() => prisma.commerceOrderItem.deleteMany({ where: { orderId: failOrder.id } }));

  const inv1 = await prisma.productInventory.findUnique({ where: { variantId: testVariant.id } });
  console.log(`  After reserve: qty=${inv1.quantity}, reserved=${inv1.reservedQuantity}`);
  if (inv1.reservedQuantity !== 2) throw new Error(`Expected reserved=2, got ${inv1.reservedQuantity}`);

  // Cancel order (simulating payment failure → release)
  await prisma.$transaction(async (tx) => {
    await tx.commerceOrder.update({
      where: { id: failOrder.id },
      data: { status: 'CANCELLED', cancelledAt: new Date() }
    });
    await releaseInventory(tx, testVariant.id, 2);
  });

  const inv2 = await prisma.productInventory.findUnique({ where: { variantId: testVariant.id } });
  console.log(`  After cancel: qty=${inv2.quantity}, reserved=${inv2.reservedQuantity}`);
  if (inv2.reservedQuantity !== 0) throw new Error(`Expected reserved=0 after cancel, got ${inv2.reservedQuantity}`);
  console.log('  PASS: Payment failure releases inventory correctly');
}

async function run() {
  let passed = 0;
  let failed = 0;
  const tests = [
    testGenerateOrderNumber,
    testReserveInventory,
    testReserveInsufficient,
    testReleaseInventory,
    testDeductInventory,
    testCreateOrderHistory,
    testCreatePayment,
    testConcurrentReservations,
    testCheckoutLifecycle,
    testPaymentFailureReleases
  ];

  console.log('='.repeat(60));
  console.log('COMMERCE CHECKOUT SYSTEM — END-TO-END TESTS');
  console.log('='.repeat(60));

  try {
    await createTestData();

    for (const test of tests) {
      try {
        await test();
        passed++;
      } catch (err) {
        console.log(`  FAIL: ${err.message}`);
        failed++;
      }
    }
  } catch (err) {
    console.error(`SETUP FAILED: ${err.message}`);
    failed = tests.length;
  } finally {
    await destroyTestData();
  }

  console.log('\n' + '='.repeat(60));
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('='.repeat(60));

  if (failed > 0) {
    console.log('VERDICT: FAIL — some tests did not pass');
    process.exit(1);
  } else {
    console.log('VERDICT: PASS — all tests passed');
  }
}

run().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});

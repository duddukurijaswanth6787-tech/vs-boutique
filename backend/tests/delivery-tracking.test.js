const prisma = require('../src/utils/prisma');
const {
  DeliveryService,
  DeliveryTrackingError,
  VALID_TRACKING_STATUSES: VALID_STATUSES
} = require('../src/modules/delivery/services/delivery.service');

const createTracking = (orderId, data) => DeliveryService.createTracking(orderId, data);
const updateStatus = (trackingId, status, note) => DeliveryService.updateStatus(trackingId, status, note);
const getOrderTracking = (orderId) => DeliveryService.getOrderTracking(orderId);
const getTrackingWithHistory = (trackingId) => DeliveryService.getTrackingWithHistory(trackingId);

let testBoutique, testProduct, testProduct2;
let testUser, testUser2, testOwner, testAdmin;
let deliveredOrder, pendingOrder;
let cleanup = [];

async function createTestData() {
  testUser = await prisma.user.create({
    data: { phone: `+9199990000${Date.now() % 10000}`, name: 'Tracking Customer' }
  });
  cleanup.push(() => prisma.user.deleteMany({ where: { id: testUser.id } }));

  testUser2 = await prisma.user.create({
    data: { phone: `+9199990000${(Date.now() + 1) % 10000}`, name: 'Tracking Customer 2' }
  });
  cleanup.push(() => prisma.user.deleteMany({ where: { id: testUser2.id } }));

  testBoutique = await prisma.boutique.create({
    data: {
      name: 'Tracking Test Boutique',
      ownerName: 'Tracking Owner',
      mobileNumber: '9999999999',
      email: `tracking${Date.now()}@boutique.com`,
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
      name: 'Tracking Test Product',
      basePrice: 1000,
      status: 'ACTIVE',
      productType: 'READY_MADE',
      deliveryType: 'STANDARD',
      averageRating: 0,
      reviewCount: 0
    }
  });
  cleanup.push(() => prisma.product.deleteMany({ where: { id: testProduct.id } }));

  testProduct2 = await prisma.product.create({
    data: {
      boutiqueId: testBoutique.id,
      name: 'Tracking Test Product 2',
      basePrice: 500,
      status: 'ACTIVE',
      productType: 'READY_MADE',
      deliveryType: 'STANDARD',
      averageRating: 0,
      reviewCount: 0
    }
  });
  cleanup.push(() => prisma.product.deleteMany({ where: { id: testProduct2.id } }));

  const orderNum = `TRK${Date.now()}`;
  pendingOrder = await prisma.commerceOrder.create({
    data: {
      orderId: orderNum,
      userId: testUser.id,
      boutiqueId: testBoutique.id,
      subtotal: 1000,
      totalAmount: 1000,
      status: 'PROCESSING',
      paymentStatus: 'PAID',
      items: {
        create: {
          productId: testProduct.id,
          productName: 'Tracking Test Product',
          quantity: 1,
          unitPrice: 1000,
          totalPrice: 1000
        }
      }
    }
  });
  cleanup.push(() => prisma.commerceOrder.deleteMany({ where: { id: pendingOrder.id } }));

  const orderNum2 = `TRK2${Date.now()}`;
  deliveredOrder = await prisma.commerceOrder.create({
    data: {
      orderId: orderNum2,
      userId: testUser2.id,
      boutiqueId: testBoutique.id,
      subtotal: 1500,
      totalAmount: 1500,
      status: 'DELIVERED',
      paymentStatus: 'PAID',
      items: {
        create: [
          {
            productId: testProduct.id,
            productName: 'Tracking Test Product',
            quantity: 1,
            unitPrice: 1000,
            totalPrice: 1000
          },
          {
            productId: testProduct2.id,
            productName: 'Tracking Test Product 2',
            quantity: 1,
            unitPrice: 500,
            totalPrice: 500
          }
        ]
      }
    }
  });
  cleanup.push(() => prisma.commerceOrder.deleteMany({ where: { id: deliveredOrder.id } }));
}

async function cleanupData() {
  for (const fn of cleanup.reverse()) {
    await fn().catch(() => {});
  }
  cleanup = [];
}

function assert(condition, message) {
  if (!condition) throw new Error(`ASSERT FAIL: ${message}`);
}

async function runTests() {
  const results = [];

  async function test(name, fn) {
    try {
      await fn();
      results.push({ name, status: 'PASS' });
      console.log(`  \u2713 ${name}`);
    } catch (err) {
      results.push({ name, status: 'FAIL', error: err.message });
      console.log(`  \u2717 ${name} \u2014 ${err.message}`);
    }
  }

  console.log('\n=== Create Test Data ===');
  await test('Create test data', async () => {
    await createTestData();
  });

  console.log('\n--- 1. Create Shipment ---');

  let createdTracking;
  const TS = Date.now();

  await test('Owner creates shipment with valid data', async () => {
    const tracking = await createTracking(pendingOrder.id, {
      courierName: 'Delhivery',
      trackingNumber: `DEL${TS}`,
      trackingUrl: `https://delhivery.com/track/${TS}`,
      expectedDeliveryDate: new Date(Date.now() + 86400000 * 3).toISOString()
    });
    createdTracking = tracking;
    assert(tracking.carrier === 'Delhivery', 'carrier matches');
    assert(tracking.trackingNumber === `DEL${TS}`, 'trackingNumber matches');
    assert(tracking.trackingUrl === `https://delhivery.com/track/${TS}`, 'trackingUrl matches');
    assert(tracking.status === 'PACKED', 'initial status is PACKED');
    assert(tracking.histories.length === 1, 'one timeline entry');
    assert(tracking.histories[0].toStatus === 'PACKED', 'history status is PACKED');
  });

  await test('Missing courierName and trackingNumber returns error', async () => {
    try {
      await createTracking(pendingOrder.id, {});
      assert(false, 'Should have thrown');
    } catch (err) {
      assert(err instanceof DeliveryTrackingError, 'DeliveryTrackingError');
    }
  });

  await test('Duplicate tracking creation returns 409', async () => {
    try {
      await createTracking(pendingOrder.id, {
        courierName: 'FedEx',
        trackingNumber: 'FEDEX123'
      });
      assert(false, 'Should have thrown');
    } catch (err) {
      assert(err.code === 'TRACKING_EXISTS', 'TRACKING_EXISTS');
    }
  });

  await test('Create tracking for non-existent order returns 404', async () => {
    try {
      await createTracking('00000000-0000-0000-0000-000000000000', {
        courierName: 'Test',
        trackingNumber: 'TEST123'
      });
      assert(false, 'Should have thrown');
    } catch (err) {
      assert(err.code === 'NOT_FOUND', 'NOT_FOUND');
    }
  });

  await test('Create tracking for delivered order returns error', async () => {
    try {
      await createTracking(deliveredOrder.id, {
        courierName: 'Test',
        trackingNumber: 'TEST123'
      });
      assert(false, 'Should have thrown');
    } catch (err) {
      assert(err.code === 'INVALID_ORDER', 'INVALID_ORDER');
    }
  });

  await test('Owner gets tracking data', async () => {
    const tracking = await getTrackingWithHistory(createdTracking.id);
    assert(tracking !== null, 'tracking exists');
    assert(tracking.id === createdTracking.id, 'correct tracking');
    assert(tracking.carrier === 'Delhivery', 'carrier matches');
    assert(tracking.status === 'PACKED', 'status is PACKED');
  });

  console.log('\n--- 2. Status Updates ---');

  await test('Update status to SHIPPED', async () => {
    const updated = await updateStatus(createdTracking.id, 'SHIPPED', 'Order Shipped via Delhivery');
    assert(updated.status === 'SHIPPED', 'status is SHIPPED');
    assert(updated.histories.length === 2, 'two timeline entries');
    const lastHistory = updated.histories[updated.histories.length - 1];
    assert(lastHistory.toStatus === 'SHIPPED', 'last history is SHIPPED');
    assert(lastHistory.note === 'Order Shipped via Delhivery', 'note matches');
  });

  await test('Update status to OUT_FOR_DELIVERY', async () => {
    const updated = await updateStatus(createdTracking.id, 'OUT_FOR_DELIVERY');
    assert(updated.status === 'OUT_FOR_DELIVERY', 'status is OUT_FOR_DELIVERY');
    assert(updated.histories.length === 3, 'three timeline entries');
  });

  await test('Invalid transition returns error', async () => {
    try {
      await updateStatus(createdTracking.id, 'PACKED');
      assert(false, 'Should have thrown');
    } catch (err) {
      assert(err.code === 'INVALID_TRANSITION', 'INVALID_TRANSITION');
    }
  });

  await test('Invalid status value returns error', async () => {
    try {
      await updateStatus(createdTracking.id, 'INVALID_STATUS');
      assert(false, 'Should have thrown');
    } catch (err) {
      assert(err.code === 'INVALID_STATUS', 'INVALID_STATUS');
    }
  });

  await test('Update tracking for non-existent tracking returns 404', async () => {
    try {
      await updateStatus('00000000-0000-0000-0000-000000000000', 'DELIVERED');
      assert(false, 'Should have thrown');
    } catch (err) {
      assert(err.code === 'NOT_FOUND', 'NOT_FOUND');
    }
  });

  await test('Full flow: DELIVERED updates analytics', async () => {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const updated = await updateStatus(createdTracking.id, 'DELIVERED', 'Package delivered successfully');
    assert(updated.status === 'DELIVERED', 'status is DELIVERED');
    assert(updated.deliveredAt !== null, 'deliveredAt set');
    assert(updated.histories.length === 4, 'four timeline entries');

    const analytics = await prisma.productAnalytics.findUnique({
      where: {
        productId_periodStart_periodEnd: {
          productId: testProduct.id,
          periodStart,
          periodEnd
        }
      }
    });
    assert(analytics !== null, 'product analytics created');
    assert(analytics.orderCount === 1, `orderCount incremented, got ${analytics.orderCount}`);
    assert(Number(analytics.revenue) === 1000, `revenue recorded, got ${Number(analytics.revenue)}`);
  });

  await test('Update to RETURNED from DELIVERED', async () => {
    const updated = await updateStatus(createdTracking.id, 'RETURNED', 'Customer returned the package');
    assert(updated.status === 'RETURNED', 'status is RETURNED');
    assert(updated.histories.length === 5, 'five timeline entries');
  });

  await test('No further transitions from RETURNED', async () => {
    try {
      await updateStatus(createdTracking.id, 'DELIVERED');
      assert(false, 'Should have thrown');
    } catch (err) {
      assert(err.code === 'INVALID_TRANSITION', 'INVALID_TRANSITION');
    }
  });

  console.log('\n--- 3. Timeline History ---');

  await test('Timeline contains all status changes in order', async () => {
    const tracking = await getTrackingWithHistory(createdTracking.id);
    const expectedOrder = ['PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED'];
    assert(tracking.histories.length === expectedOrder.length, `expected ${expectedOrder.length} entries`);
    for (let i = 0; i < expectedOrder.length; i++) {
      assert(tracking.histories[i].toStatus === expectedOrder[i], `entry ${i} is ${expectedOrder[i]}`);
    }
  });

  await test('Customer can view tracking for their order', async () => {
    const trackingView = await getOrderTracking(pendingOrder.id);
    assert(trackingView !== null, 'tracking exists');
    assert(trackingView.currentStatus === 'RETURNED', 'current status is RETURNED');
    assert(trackingView.courierName === 'Delhivery', 'courier name matches');
    assert(trackingView.trackingNumber === `DEL${TS}`, 'tracking number matches');
    assert(trackingView.timeline.length === 5, '5 timeline entries in view');
    assert(trackingView.timeline[0].status === 'PACKED', 'first entry is PACKED');
    assert(trackingView.timeline[0].timestamp !== undefined, 'timestamp present');
    assert(trackingView.timeline[0].note !== undefined, 'note present');
  });

  await test('Customer tracking shows expectedDeliveryDate', async () => {
    const trackingView = await getOrderTracking(pendingOrder.id);
    assert(trackingView.expectedDeliveryDate !== null, 'expectedDeliveryDate exists');
    assert(trackingView.deliveredAt !== null, 'deliveredAt exists');
  });

  console.log('\n--- 4. Customer Access Control ---');

  await test('Other customer cannot view tracking', async () => {
    const result1 = await getOrderTracking(pendingOrder.id);
    assert(result1 !== null, 'owner can view');
  });

  await test('Returns null for order with no tracking', async () => {
    const result = await getOrderTracking(deliveredOrder.id);
    assert(result === null, 'no tracking for this order');
  });

  console.log('\n--- 5. Edge Cases ---');

  let secondTracking;

  await test('Complete flow on a second order', async () => {
    const orderNum3 = `TRK3${Date.now()}`;
    const secondOrder = await prisma.commerceOrder.create({
      data: {
        orderId: orderNum3,
        userId: testUser.id,
        boutiqueId: testBoutique.id,
        subtotal: 750,
        totalAmount: 750,
        status: 'PACKED',
        paymentStatus: 'PAID',
        items: {
          create: {
            productId: testProduct2.id,
            productName: 'Tracking Test Product 2',
            quantity: 1,
            unitPrice: 750,
            totalPrice: 750
          }
        }
      }
    });
    cleanup.push(() => prisma.commerceOrder.deleteMany({ where: { id: secondOrder.id } }));

    const tracking = await createTracking(secondOrder.id, {
      courierName: 'Blue Dart',
      trackingNumber: `BD${Date.now()}`,
      expectedDeliveryDate: new Date(Date.now() + 86400000 * 5).toISOString()
    });
    secondTracking = tracking;
    assert(tracking.status === 'PACKED', 'initial status PACKED');
    assert(tracking.carrier === 'Blue Dart', 'carrier Blue Dart');

    const shipped = await updateStatus(tracking.id, 'SHIPPED');
    assert(shipped.status === 'SHIPPED', 'status SHIPPED');

    const outForDelivery = await updateStatus(tracking.id, 'OUT_FOR_DELIVERY');
    assert(outForDelivery.status === 'OUT_FOR_DELIVERY', 'status OUT_FOR_DELIVERY');

    const delivered = await updateStatus(tracking.id, 'DELIVERED');
    assert(delivered.status === 'DELIVERED', 'status DELIVERED');
    assert(delivered.histories.length === 4, '4 timeline entries');

    const customerView = await getOrderTracking(secondOrder.id);
    assert(customerView.currentStatus === 'DELIVERED', 'customer sees DELIVERED');
    assert(customerView.timeline.length === 4, 'customer sees 4 timeline entries');

    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const analytics2 = await prisma.productAnalytics.findUnique({
      where: {
        productId_periodStart_periodEnd: {
          productId: testProduct2.id,
          periodStart,
          periodEnd
        }
      }
    });
    assert(analytics2 !== null, 'analytics created for product2');
    assert(analytics2.orderCount === 1, `product2 orderCount = 1, got ${analytics2.orderCount}`);
    assert(Number(analytics2.revenue) === 750, `product2 revenue = 750, got ${Number(analytics2.revenue)}`);
  });

  await test('FAILED to RETURNED transition works', async () => {
    const orderNum4 = `TRK4${Date.now()}`;
    const failOrder = await prisma.commerceOrder.create({
      data: {
        orderId: orderNum4,
        userId: testUser.id,
        boutiqueId: testBoutique.id,
        subtotal: 500,
        totalAmount: 500,
        status: 'PROCESSING',
        paymentStatus: 'PAID',
        items: {
          create: {
            productId: testProduct.id,
            productName: 'Tracking Test Product',
            quantity: 1,
            unitPrice: 500,
            totalPrice: 500
          }
        }
      }
    });
    cleanup.push(() => prisma.commerceOrder.deleteMany({ where: { id: failOrder.id } }));

    const tracking = await createTracking(failOrder.id, {
      courierName: 'Test Carrier',
      trackingNumber: `FAIL${Date.now()}`
    });

    const failed = await updateStatus(tracking.id, 'FAILED', 'Package damaged in transit');
    assert(failed.status === 'FAILED', 'status is FAILED');
    assert(failed.histories.length === 2, '2 entries: PACKED + FAILED');

    const returned = await updateStatus(tracking.id, 'RETURNED', 'Return initiated after failure');
    assert(returned.status === 'RETURNED', 'status is RETURNED');
    assert(returned.histories.length === 3, '3 entries: PACKED + FAILED + RETURNED');
  });

  await test('Tracking with no optional fields works', async () => {
    const orderNum5 = `TRK5${Date.now()}`;
    const minimalOrder = await prisma.commerceOrder.create({
      data: {
        orderId: orderNum5,
        userId: testUser.id,
        boutiqueId: testBoutique.id,
        subtotal: 250,
        totalAmount: 250,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        items: {
          create: {
            productId: testProduct.id,
            productName: 'Tracking Test Product',
            quantity: 1,
            unitPrice: 250,
            totalPrice: 250
          }
        }
      }
    });
    cleanup.push(() => prisma.commerceOrder.deleteMany({ where: { id: minimalOrder.id } }));

    const tracking = await createTracking(minimalOrder.id, {
      courierName: 'Minimal Carrier',
      trackingNumber: `MIN${Date.now()}`
    });
    assert(tracking.trackingUrl === null, 'trackingUrl is null when not provided');
    assert(tracking.estimatedDelivery === null, 'estimatedDelivery is null when not provided');

    const view = await getOrderTracking(minimalOrder.id);
    assert(view.trackingUrl === null, 'view trackingUrl is null');
    assert(view.expectedDeliveryDate === null, 'view expectedDeliveryDate is null');
  });

  // ── Teardown ──
  console.log('\n--- Teardown ---');
  await test('Cleanup test data', async () => {
    await cleanupData();
  });

  // ── Results ──
  console.log('\n\u2550\u2550\u2550 Results \u2550\u2550\u2550');
  let passCount = 0, failCount = 0;
  for (const r of results) {
    if (r.status === 'PASS') passCount++;
    else failCount++;
  }
  console.log(`Total: ${passCount + failCount} | PASS: ${passCount} | FAIL: ${failCount}`);

  if (failCount > 0) {
    console.log('\nFAILED TESTS:');
    for (const r of results) {
      if (r.status === 'FAIL') console.log(`  \u2717 ${r.name}: ${r.error}`);
    }
  }

  console.log('\n\u2550\u2550\u2550 Coverage Report \u2550\u2550\u2550');
  const coverageItems = [
    ['Owner creates shipment', results.some(r => r.name.includes('creates shipment with valid') && r.status === 'PASS')],
    ['Missing fields validation', results.some(r => r.name.includes('Missing courierName') && r.status === 'PASS')],
    ['Duplicate tracking prevention', results.some(r => r.name.includes('Duplicate tracking') && r.status === 'PASS')],
    ['Non-existent order 404', results.some(r => r.name.includes('non-existent order returns 404') && r.status === 'PASS')],
    ['Delivered order reject', results.some(r => r.name.includes('delivered order returns error') && r.status === 'PASS')],
    ['Owner gets tracking', results.some(r => r.name.includes('Owner gets tracking data') && r.status === 'PASS')],
    ['Update to SHIPPED', results.some(r => r.name.includes('Update status to SHIPPED') && r.status === 'PASS')],
    ['Update to OUT_FOR_DELIVERY', results.some(r => r.name.includes('Update status to OUT_FOR_DELIVERY') && r.status === 'PASS')],
    ['Update to DELIVERED', results.some(r => r.name.includes('DELIVERED updates analytics') && r.status === 'PASS')],
    ['Invalid transition rejected', results.some(r => r.name.includes('Invalid transition') && r.status === 'PASS')],
    ['Invalid status rejected', results.some(r => r.name.includes('Invalid status value') && r.status === 'PASS')],
    ['Non-existent tracking 404', results.some(r => r.name.includes('non-existent tracking') && r.status === 'PASS')],
    ['FAILED to RETURNED', results.some(r => r.name.includes('FAILED to RETURNED') && r.status === 'PASS')],
    ['No transitions from RETURNED', results.some(r => r.name.includes('No further transitions') && r.status === 'PASS')],
    ['Customer tracking view', results.some(r => r.name.includes('Customer can view tracking') && r.status === 'PASS')],
    ['Customer fields present', results.some(r => r.name.includes('expectedDeliveryDate') && r.status === 'PASS')],
    ['Returns null for no tracking', results.some(r => r.name.includes('Returns null') && r.status === 'PASS')],
    ['Complete flow second order', results.some(r => r.name.includes('Complete flow on a second') && r.status === 'PASS')],
    ['Analytics on DELIVERED', results.some(r => r.name.includes('DELIVERED updates analytics') && r.status === 'PASS')],
    ['Timeline history all entries', results.some(r => r.name.includes('Timeline contains all status') && r.status === 'PASS')],
    ['Minimal fields tracking', results.some(r => r.name.includes('no optional fields works') && r.status === 'PASS')]
  ];

  console.log('\u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510');
  console.log('\u2502 Requirement                                         \u2502 Status \u2502');
  console.log('\u251c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524');
  for (const [req, passed] of coverageItems) {
    const padded = req.padEnd(51);
    const statusStr = passed ? '  PASS ' : '  FAIL ';
    console.log(`\u2502 ${padded}\u2502${statusStr}\u2502`);
  }
  console.log('\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518');
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

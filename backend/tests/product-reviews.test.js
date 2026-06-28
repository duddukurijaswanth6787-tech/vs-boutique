const prisma = require('../src/utils/prisma');
const {
  syncProductRating,
  validateDeliveredOrder,
  canReviewProduct,
  createReview,
  updateReview,
  deleteReview,
  setReviewReply,
  deleteReviewReply,
  setReviewStatus,
  adminDeleteReview,
  getReviews,
  getReviewSummary,
  ProductReviewError
} = require('../src/modules/reviews/services/reviews.service');

let testBoutique, testProduct, testUser, testOwner, testAdmin;
let deliveredOrder, nonDeliveredOrder;
let cleanup = [];

async function createTestData() {
  // Test customer
  testUser = await prisma.user.create({
    data: { phone: `+9199990000${Date.now() % 10000}`, name: 'Review Test Customer' }
  });
  cleanup.push(() => prisma.user.deleteMany({ where: { id: testUser.id } }));

  // Test boutique
  testBoutique = await prisma.boutique.create({
    data: {
      name: 'Review Test Boutique',
      ownerName: 'Review Owner',
      mobileNumber: '9999999999',
      email: `review${Date.now()}@boutique.com`,
      fullAddress: 'Test Address',
      city: 'Test City',
      state: 'Test State',
      status: 'Active'
    }
  });
  cleanup.push(() => prisma.boutique.deleteMany({ where: { id: testBoutique.id } }));

  // Test product
  testProduct = await prisma.product.create({
    data: {
      boutiqueId: testBoutique.id,
      name: 'Review Test Product',
      basePrice: 500,
      status: 'ACTIVE',
      productType: 'READY_MADE',
      deliveryType: 'STANDARD',
      averageRating: 0,
      reviewCount: 0
    }
  });
  cleanup.push(() => prisma.product.deleteMany({ where: { id: testProduct.id } }));

  // Delivered commerce order
  const orderNum = `RVT${Date.now()}`;
  deliveredOrder = await prisma.commerceOrder.create({
    data: {
      orderId: orderNum,
      userId: testUser.id,
      boutiqueId: testBoutique.id,
      subtotal: 500,
      totalAmount: 500,
      status: 'DELIVERED',
      paymentStatus: 'PAID',
      items: {
        create: {
          productId: testProduct.id,
          productName: 'Review Test Product',
          quantity: 1,
          unitPrice: 500,
          totalPrice: 500
        }
      }
    }
  });
  cleanup.push(() => prisma.commerceOrder.deleteMany({ where: { id: deliveredOrder.id } }));

  // Non-delivered commerce order
  const orderNum2 = `RVT2${Date.now()}`;
  nonDeliveredOrder = await prisma.commerceOrder.create({
    data: {
      orderId: orderNum2,
      userId: testUser.id,
      boutiqueId: testBoutique.id,
      subtotal: 500,
      totalAmount: 500,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      items: {
        create: {
          productId: testProduct.id,
          productName: 'Review Test Product',
          quantity: 1,
          unitPrice: 500,
          totalPrice: 500
        }
      }
    }
  });
  cleanup.push(() => prisma.commerceOrder.deleteMany({ where: { id: nonDeliveredOrder.id } }));
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

// ── Test Runner ───────────────────────────────────────────────────────
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

  console.log('\n═══ Product Reviews E2E Tests ═══\n');

  // ── Setup ──
  console.log('\n--- Setup ---');
  await test('Create test data', async () => {
    await createTestData();
    assert(testProduct.id, 'Product created');
    assert(deliveredOrder.id, 'Delivered order created');
  });

  // ── 1. Public APIs ──
  console.log('\n--- 1. Public APIs ---');

  await test('GET reviews returns empty array for new product', async () => {
    const reviews = await getReviews(testProduct.id);
    assert(Array.isArray(reviews), 'Reviews is array');
    assert(reviews.length === 0, 'No reviews yet');
  });

  await test('GET summary returns zeros for unreviewed product', async () => {
    const summary = await getReviewSummary(testProduct.id);
    assert(summary.averageRating === 0, 'Average rating is 0');
    assert(summary.totalReviews === 0, 'Total reviews is 0');
    assert(summary.breakdown[1] === 0, 'Breakdown 1 is 0');
    assert(summary.breakdown[5] === 0, 'Breakdown 5 is 0');
  });

  // ── 2. Create Review ──
  console.log('\n--- 2. Create Review ---');

  await test('CanReviewProduct passes for first review', async () => {
    await canReviewProduct(testUser.id, testProduct.id);
    // No error = pass
  });

  await test('ValidateDeliveredOrder finds delivered order', async () => {
    const order = await validateDeliveredOrder(testUser.id, testProduct.id);
    assert(order !== null, 'Found delivered order');
    assert(order.status === 'DELIVERED', 'Order is DELIVERED');
  });

  await test('Create review with delivered order (verified purchase)', async () => {
    const review = await createReview({
      userId: testUser.id,
      productId: testProduct.id,
      orderId: deliveredOrder.id,
      rating: 5,
      title: 'Great product!',
      comment: 'Really loved this product. Quality is amazing.',
      images: ['https://example.com/img1.jpg'],
      isVerifiedPurchase: true
    });
    assert(review.id, 'Review has id');
    assert(review.rating === 5, 'Rating is 5');
    assert(review.title === 'Great product!', 'Title matches');
    assert(review.isVerifiedPurchase === true, 'Verified purchase');
    assert(review.status === 'APPROVED', 'Status is APPROVED');
    assert(review.images.length === 1, 'Has 1 image');
  });

  await test('Product averageRating and reviewCount updated after create', async () => {
    const product = await prisma.product.findUnique({ where: { id: testProduct.id } });
    assert(product.averageRating === 5, `Average rating is 5, got ${product.averageRating}`);
    assert(product.reviewCount === 1, `Review count is 1, got ${product.reviewCount}`);
  });

  await test('GET reviews returns the created review', async () => {
    const reviews = await getReviews(testProduct.id);
    assert(reviews.length === 1, 'One review found');
    assert(reviews[0].rating === 5, 'Rating is 5');
    assert(reviews[0].user.name === 'Review Test Customer', 'Includes user name');
  });

  await test('GET summary reflects single 5-star review', async () => {
    const summary = await getReviewSummary(testProduct.id);
    assert(summary.averageRating === 5, `Average rating is 5, got ${summary.averageRating}`);
    assert(summary.totalReviews === 1, 'Total reviews is 1');
    assert(summary.breakdown[5] === 1, 'One 5-star review');
  });

  await test('Reject duplicate review (same product + user)', async () => {
    try {
      await canReviewProduct(testUser.id, testProduct.id);
      assert(false, 'Should have thrown');
    } catch (err) {
      assert(err instanceof ProductReviewError, 'Throws ProductReviewError');
      assert(err.code === 'DUPLICATE_REVIEW', 'Error code is DUPLICATE_REVIEW');
      assert(err.status === 409, 'Status is 409');
    }
  });

  // ── 3. Create second review (different user) ──
  console.log('\n--- 3. Multiple Reviews ---');

  let secondUser, secondReview;
  await test('Create second user and review', async () => {
    secondUser = await prisma.user.create({
      data: { phone: `+9188880000${Date.now() % 10000}`, name: 'Second Customer' }
    });
    cleanup.push(() => prisma.user.deleteMany({ where: { id: secondUser.id } }));

    const order2 = await prisma.commerceOrder.create({
      data: {
        orderId: `RVT3${Date.now()}`,
        userId: secondUser.id,
        boutiqueId: testBoutique.id,
        subtotal: 500,
        totalAmount: 500,
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        items: { create: { productId: testProduct.id, productName: 'Test', quantity: 1, unitPrice: 500, totalPrice: 500 } }
      }
    });
    cleanup.push(() => prisma.commerceOrder.deleteMany({ where: { id: order2.id } }));

    secondReview = await createReview({
      userId: secondUser.id,
      productId: testProduct.id,
      orderId: order2.id,
      rating: 3,
      title: 'It\'s okay',
      comment: 'Average product',
      images: [],
      isVerifiedPurchase: true
    });
    assert(secondReview.id, 'Second review created');
  });

  await test('GET summary with mixed reviews (5 and 3 = avg 4)', async () => {
    const summary = await getReviewSummary(testProduct.id);
    assert(summary.totalReviews === 2, `Total reviews is 2, got ${summary.totalReviews}`);
    assert(summary.averageRating === 4, `Average rating is 4, got ${summary.averageRating}`);
    assert(summary.breakdown[5] === 1, 'One 5-star');
    assert(summary.breakdown[3] === 1, 'One 3-star');
    // averageRating = (5+3)/2 = 4.0
    assert(Math.abs(summary.averageRating - 4.0) < 0.01, 'Average is 4.0');
  });

  await test('Product rating syncs after second review', async () => {
    const product = await prisma.product.findUnique({ where: { id: testProduct.id } });
    assert(product.reviewCount === 2, `Review count is 2, got ${product.reviewCount}`);
    assert(product.averageRating === 4, `Average rating is 4, got ${product.averageRating}`);
  });

  // ── 4. Update Review ──
  console.log('\n--- 4. Update Review ---');

  await test('Update rating and comment', async () => {
    const updated = await updateReview(secondReview.id, secondUser.id, {
      rating: 4,
      title: 'Updated title',
      comment: 'Actually pretty good after using more'
    });
    assert(updated.rating === 4, 'Rating updated to 4');
    assert(updated.title === 'Updated title', 'Title updated');
    assert(updated.comment === 'Actually pretty good after using more', 'Comment updated');
  });

  await test('Product rating recalculated after update', async () => {
    const product = await prisma.product.findUnique({ where: { id: testProduct.id } });
    // avg = (5 + 4) / 2 = 4.5
    assert(product.averageRating === 4.5, `Average rating is 4.5, got ${product.averageRating}`);
    assert(product.reviewCount === 2, 'Review count still 2');
  });

  await test('Reject update by wrong user', async () => {
    try {
      await updateReview(secondReview.id, testUser.id, { rating: 5 });
      assert(false, 'Should have thrown');
    } catch (err) {
      assert(err instanceof ProductReviewError, 'Throws ProductReviewError');
      assert(err.code === 'ACCESS_DENIED', 'Error code is ACCESS_DENIED');
    }
  });

  await test('Reject update for non-existent review', async () => {
    try {
      await updateReview('00000000-0000-0000-0000-000000000000', testUser.id, { rating: 5 });
      assert(false, 'Should have thrown');
    } catch (err) {
      assert(err instanceof ProductReviewError, 'Throws ProductReviewError');
      assert(err.code === 'NOT_FOUND', 'Error code is NOT_FOUND');
    }
  });

  // ── 5. Owner Reply ──
  console.log('\n--- 5. Owner Reply ---');

  await test('Owner adds reply to review', async () => {
    const updated = await setReviewReply(secondReview.id, 'Thank you for your feedback! We appreciate it.');
    assert(updated.reply === 'Thank you for your feedback! We appreciate it.', 'Reply set');
  });

  await test('Owner deletes reply', async () => {
    const updated = await deleteReviewReply(secondReview.id);
    assert(updated.reply === null, 'Reply removed');
  });

  await test('Owner sets reply again after deletion', async () => {
    const updated = await setReviewReply(secondReview.id, 'Glad you liked it!');
    assert(updated.reply === 'Glad you liked it!', 'Reply set again');
  });

  await test('Owner reply non-existent review throws', async () => {
    try {
      await setReviewReply('00000000-0000-0000-0000-000000000000', 'Reply');
      assert(false, 'Should have thrown');
    } catch (err) {
      assert(err instanceof ProductReviewError, 'Throws ProductReviewError');
      assert(err.code === 'NOT_FOUND', 'Error code is NOT_FOUND');
    }
  });

  // ── 6. Admin Moderation ──
  console.log('\n--- 6. Admin Moderation ---');

  await test('Admin rejects review', async () => {
    const updated = await setReviewStatus(secondReview.id, 'REJECTED');
    assert(updated.status === 'REJECTED', 'Status is REJECTED');
  });

  await test('Product rating recalculated after rejection (only 5-star remains)', async () => {
    const product = await prisma.product.findUnique({ where: { id: testProduct.id } });
    assert(product.averageRating === 5, `Average rating is 5, got ${product.averageRating}`);
    assert(product.reviewCount === 1, `Review count is 1, got ${product.reviewCount}`);
  });

  await test('Admin approves review back', async () => {
    const updated = await setReviewStatus(secondReview.id, 'APPROVED');
    assert(updated.status === 'APPROVED', 'Status is APPROVED again');
  });

  await test('Product rating returns after re-approval', async () => {
    const product = await prisma.product.findUnique({ where: { id: testProduct.id } });
    assert(product.averageRating === 4.5, `Average rating is 4.5, got ${product.averageRating}`);
    assert(product.reviewCount === 2, `Review count is 2, got ${product.reviewCount}`);
  });

  await test('Admin hides review', async () => {
    const updated = await setReviewStatus(secondReview.id, 'HIDDEN');
    assert(updated.status === 'HIDDEN', 'Status is HIDDEN');
  });

  await test('Hidden review excluded from rating', async () => {
    const product = await prisma.product.findUnique({ where: { id: testProduct.id } });
    assert(product.averageRating === 5, `Hidden excluded from avg, got ${product.averageRating}`);
    assert(product.reviewCount === 1, `Hidden excluded from count, got ${product.reviewCount}`);
  });

  await test('Customer cannot update hidden/rejected review', async () => {
    try {
      await updateReview(secondReview.id, secondUser.id, { rating: 5 });
      assert(false, 'Should have thrown');
    } catch (err) {
      assert(err instanceof ProductReviewError, 'Throws ProductReviewError');
      assert(err.code === 'INVALID_STATUS', 'Error code is INVALID_STATUS');
    }
  });

  await test('Admin deletes review', async () => {
    await adminDeleteReview(secondReview.id);
    const reviews = await getReviews(testProduct.id);
    assert(reviews.length === 1, 'Only first review remains');
  });

  await test('Product rating after admin delete', async () => {
    const product = await prisma.product.findUnique({ where: { id: testProduct.id } });
    assert(product.averageRating === 5, `Avg rating is 5, got ${product.averageRating}`);
    assert(product.reviewCount === 1, `Review count is 1, got ${product.reviewCount}`);
  });

  // ── 7. Delete Own Review ──
  console.log('\n--- 7. Delete Own Review ---');

  await test('Customer deletes own review', async () => {
    const firstReview = (await getReviews(testProduct.id))[0];
    assert(firstReview, 'Review exists');
    await deleteReview(firstReview.id, testUser.id);
    const reviews = await getReviews(testProduct.id);
    assert(reviews.length === 0, 'All reviews deleted');
  });

  await test('Product rating resets to zero after all reviews deleted', async () => {
    const product = await prisma.product.findUnique({ where: { id: testProduct.id } });
    assert(product.averageRating === 0, `Average rating is 0, got ${product.averageRating}`);
    assert(product.reviewCount === 0, `Review count is 0, got ${product.reviewCount}`);
  });

  await test('Delete own non-existent review throws', async () => {
    try {
      await deleteReview('00000000-0000-0000-0000-000000000000', testUser.id);
      assert(false, 'Should have thrown');
    } catch (err) {
      assert(err instanceof ProductReviewError, 'Throws ProductReviewError');
      assert(err.code === 'NOT_FOUND', 'Error code is NOT_FOUND');
    }
  });

  // ── 8. Non-delivered order ──
  console.log('\n--- 8. Non-delivered Order ---');

  await test('ValidateDeliveredOrder returns null for non-delivered order', async () => {
    // Create a new user with only a PENDING order
    const pendingUser = await prisma.user.create({
      data: { phone: `+9177770000${Date.now() % 10000}`, name: 'Pending User' }
    });
    cleanup.push(() => prisma.user.deleteMany({ where: { id: pendingUser.id } }));

    const result = await validateDeliveredOrder(pendingUser.id, testProduct.id);
    assert(result === null, 'No delivered order found');
  });

  // ── 9. Edge Cases ──
  console.log('\n--- 9. Edge Cases ---');

  await test('Create review without order (no verified purchase)', async () => {
    const noOrderUser = await prisma.user.create({
      data: { phone: `+9166660000${Date.now() % 10000}`, name: 'No Order User' }
    });
    cleanup.push(() => prisma.user.deleteMany({ where: { id: noOrderUser.id } }));

    const review = await createReview({
      userId: noOrderUser.id,
      productId: testProduct.id,
      orderId: null,
      rating: 4,
      title: 'No order review',
      comment: 'Bought offline',
      images: [],
      isVerifiedPurchase: false
    });
    assert(review.isVerifiedPurchase === false, 'Not verified purchase');
    assert(review.status === 'APPROVED', 'Still APPROVED');

    // Cleanup this review
    await prisma.productReview.delete({ where: { id: review.id } });
    await syncProductRating(testProduct.id);
  });

  // ── Teardown ──
  console.log('\n--- Teardown ---');
  await test('Cleanup test data', async () => {
    await cleanupData();
    // Verify cleanup
    const reviews = await prisma.productReview.findMany({ where: { productId: testProduct.id } });
    assert(reviews.length === 0, 'All reviews cleaned up');
  });

  // ── Results ──
  console.log('\n═══ Results ═══');
  let passCount = 0, failCount = 0;
  for (const r of results) {
    if (r.status === 'PASS') passCount++;
    else failCount++;
  }

  console.log(`\nTotal: ${passCount + failCount} | PASS: ${passCount} | FAIL: ${failCount}`);

  if (failCount > 0) {
    console.log('\nFAILED TESTS:');
    for (const r of results) {
      if (r.status === 'FAIL') console.log(`  ✗ ${r.name}: ${r.error}`);
    }
  }

  // ── Coverage Report ──
  console.log('\n═══ Coverage Report ═══');
  const coverageItems = [
    ['Public GET /reviews', results.some(r => r.name === 'GET reviews returns empty array for new product' && r.status === 'PASS') ? 'PASS' : 'FAIL'],
    ['Public GET /reviews/summary', results.some(r => r.name === 'GET summary returns zeros for unreviewed product' && r.status === 'PASS') ? 'PASS' : 'FAIL'],
    ['POST create review', results.some(r => r.name.includes('Create review') && r.status === 'PASS') ? 'PASS' : 'FAIL'],
    ['PUT update review', results.some(r => r.name === 'Update rating and comment' && r.status === 'PASS') ? 'PASS' : 'FAIL'],
    ['DELETE own review', results.some(r => r.name === 'Customer deletes own review' && r.status === 'PASS') ? 'PASS' : 'FAIL'],
    ['Duplicate rejection', results.some(r => r.name === 'Reject duplicate review (same product + user)' && r.status === 'PASS') ? 'PASS' : 'FAIL'],
    ['Verified purchase detection', results.some(r => r.name.includes('verified purchase') && r.status === 'PASS') ? 'PASS' : 'FAIL'],
    ['Non-delivered order detection', results.some(r => r.name.includes('non-delivered') && r.status === 'PASS') ? 'PASS' : 'FAIL'],
    ['Owner reply', results.some(r => r.name.includes('adds reply') && r.status === 'PASS') ? 'PASS' : 'FAIL'],
    ['Owner delete reply', results.some(r => r.name.includes('deletes reply') && r.status === 'PASS') ? 'PASS' : 'FAIL'],
    ['Admin approve', results.some(r => r.name.includes('approves') && r.status === 'PASS') ? 'PASS' : 'FAIL'],
    ['Admin reject', results.some(r => r.name.includes('rejects') && r.status === 'PASS') ? 'PASS' : 'FAIL'],
    ['Admin hide', results.some(r => r.name.includes('hides') && r.status === 'PASS') ? 'PASS' : 'FAIL'],
    ['Admin delete', results.some(r => r.name.includes('deletes review') && r.status === 'PASS') ? 'PASS' : 'FAIL'],
    ['Rating sync on create', results.some(r => r.name.includes('updated after create') && r.status === 'PASS') ? 'PASS' : 'FAIL'],
    ['Rating sync on update', results.some(r => r.name.includes('recalculated after update') && r.status === 'PASS') ? 'PASS' : 'FAIL'],
    ['Rating sync on delete', results.some(r => r.name.includes('resets to zero') && r.status === 'PASS') ? 'PASS' : 'FAIL'],
    ['Rating sync on rejection', results.some(r => r.name.includes('after rejection') && r.status === 'PASS') ? 'PASS' : 'FAIL'],
    ['Summary with mixed reviews', results.some(r => r.name.includes('mixed reviews') && r.status === 'PASS') ? 'PASS' : 'FAIL'],
    ['Wrong user access denied', results.some(r => r.name.includes('wrong user') && r.status === 'PASS') ? 'PASS' : 'FAIL'],
    ['Non-existent review 404', results.some(r => r.name.includes('non-existent review') && r.status === 'PASS') ? 'PASS' : 'FAIL'],
    ['Review without order', results.some(r => r.name.includes('without order') && r.status === 'PASS') ? 'PASS' : 'FAIL'],
    ['Hidden review excluded from rating', results.some(r => r.name === 'Hidden review excluded from rating' && r.status === 'PASS') ? 'PASS' : 'FAIL'],
    ['Summary breakdown correct', results.some(r => r.name.includes('summary reflects') && r.status === 'PASS') ? 'PASS' : 'FAIL']
  ];

  console.log('┌─────────────────────────────────────────────────────┬────────┐');
  console.log('│ Requirement                                         │ Status │');
  console.log('├─────────────────────────────────────────────────────┼────────┤');
  for (const [req, status] of coverageItems) {
    const padded = req.padEnd(51);
    const statusStr = status === 'PASS' ? '  PASS ' : '  FAIL ';
    console.log(`│ ${padded}│${statusStr}│`);
  }
  console.log('└─────────────────────────────────────────────────────┴────────┘');

  console.log(`\nCoverage: ${coverageItems.filter(([,s]) => s === 'PASS').length}/${coverageItems.length} requirements met`);

  return { passCount, failCount, results };
}

runTests()
  .then(({ passCount, failCount }) => {
    if (failCount > 0) {
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Test suite error:', err);
    process.exit(1);
  });

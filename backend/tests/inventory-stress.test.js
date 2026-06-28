const prisma = require('../src/utils/prisma');
const { reserveInventory, releaseInventory, CommerceError } = require('../src/modules/commerce/services/commerce.service');

let cleanup = [];
const TS = Date.now();

function assert(condition, message) {
  if (!condition) throw new Error(`ASSERT FAIL: ${message}`);
}

async function createTestData() {
  const user = await prisma.user.create({
    data: { phone: `+919999${TS % 100000}`, name: 'Stress Tester' }
  });
  cleanup.push(() => prisma.user.deleteMany({ where: { id: user.id } }));

  const boutique = await prisma.boutique.create({
    data: {
      name: `Stress Boutique ${TS}`,
      ownerName: 'Stress Owner',
      mobileNumber: `999999${TS % 1000000}`,
      email: `stress${TS}@boutique.com`,
      fullAddress: 'Stress Address',
      city: 'City',
      state: 'State',
      status: 'Active'
    }
  });
  cleanup.push(() => prisma.boutique.deleteMany({ where: { id: boutique.id } }));

  const category = await prisma.category.create({
    data: { name: `StressCat${TS}` }
  });
  cleanup.push(() => prisma.category.deleteMany({ where: { id: category.id } }));

  const product = await prisma.product.create({
    data: {
      boutiqueId: boutique.id,
      name: `Stress Product ${TS}`,
      basePrice: 500,
      status: 'ACTIVE',
      categoryId: category.id
    }
  });
  cleanup.push(() => prisma.product.deleteMany({ where: { id: product.id } }));

  return { user, boutique, category, product };
}

async function createVariantWithInventory(productId, quantity = 100) {
  const variant = await prisma.productVariant.create({
    data: {
      productId,
      name: `Stress Variant ${TS}`,
      price: 500
    }
  });
  cleanup.push(() => prisma.productVariant.deleteMany({ where: { id: variant.id } }));

  const inventory = await prisma.productInventory.create({
    data: {
      variantId: variant.id,
      quantity,
      reservedQuantity: 0,
      version: 0,
      trackInventory: true
    }
  });

  return { variant, inventory };
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

  console.log('\n\u2550\u2550\u2550 Inventory Concurrency Stress Tests \u2550\u2550\u2550\n');

  console.log('--- Setup ---');
  const data = await createTestData();

  await test('Single-txn optimistic lock: 5 concurrent reserve on inventory=3', async () => {
    const { variant } = await createVariantWithInventory(data.product.id, 3);

    const results_arr = await prisma.$transaction(async (tx) => {
      const out = await Promise.allSettled(
        Array.from({ length: 5 }, () =>
          reserveInventory(tx, variant.id, 1).then(() => 'ok', e => e.code)
        )
      );
      return out;
    });

    const succeeded = results_arr.filter(r => r.status === 'fulfilled' && r.value === 'ok').length;
    const conflicts = results_arr.filter(r => r.status === 'fulfilled' && r.value === 'RESERVATION_CONFLICT').length;

    assert(succeeded >= 1 && succeeded <= 3, `Expected 1-3 successes, got ${succeeded}`);
    assert(succeeded + conflicts === 5, `Expected 5 total, got ${succeeded} ok + ${conflicts} conflict`);

    const finalInventory = await prisma.productInventory.findUnique({ where: { variantId: variant.id } });
    assert(finalInventory.reservedQuantity >= 1 && finalInventory.reservedQuantity <= 3,
      `Expected reservedQuantity 1-3, got ${finalInventory.reservedQuantity}`);
    assert(finalInventory.quantity - finalInventory.reservedQuantity >= 0, 'Oversold!');

    await prisma.productInventory.deleteMany({ where: { variantId: variant.id } });
    await prisma.productVariant.deleteMany({ where: { id: variant.id } });
  });

  await test('Multi-txn optimistic lock: 5 concurrent reserve on inventory=3', async () => {
    const { variant } = await createVariantWithInventory(data.product.id, 3);

    const results_arr = await Promise.allSettled(
      Array.from({ length: 5 }, () =>
        prisma.$transaction(async (tx) => {
          return reserveInventory(tx, variant.id, 1).then(() => 'ok', e => e.code);
        })
      )
    );

    const succeeded = results_arr.filter(r => r.status === 'fulfilled' && r.value === 'ok').length;
    const totalResolved = results_arr.filter(r => r.status === 'fulfilled').length;

    assert(succeeded >= 1 && succeeded <= 3, `Expected 1-3 successes, got ${succeeded}`);
    assert(totalResolved >= 1, 'At least 1 resolution expected');

    const finalInventory = await prisma.productInventory.findUnique({ where: { variantId: variant.id } });
    assert(finalInventory.reservedQuantity >= 1 && finalInventory.reservedQuantity <= 3,
      `Expected reservedQuantity 1-3, got ${finalInventory.reservedQuantity}`);
    assert(finalInventory.quantity - finalInventory.reservedQuantity >= 0, 'Oversold!');

    await prisma.productInventory.deleteMany({ where: { variantId: variant.id } });
    await prisma.productVariant.deleteMany({ where: { id: variant.id } });
  });

  await test('Oversell prevention: 10 concurrent txn for inventory=5', async () => {
    const { variant } = await createVariantWithInventory(data.product.id, 5);

    const results_arr = await Promise.allSettled(
      Array.from({ length: 10 }, () =>
        prisma.$transaction(async (tx) => {
          return reserveInventory(tx, variant.id, 1).then(() => 'ok', e => e.code);
        })
      )
    );

    const succeeded = results_arr.filter(r => r.status === 'fulfilled' && r.value === 'ok').length;
    assert(succeeded <= 5, `Expected at most 5 successes, got ${succeeded}`);

    const finalInventory = await prisma.productInventory.findUnique({ where: { variantId: variant.id } });
    assert(finalInventory.reservedQuantity === succeeded,
      `Expected reservedQuantity=${succeeded}, got ${finalInventory.reservedQuantity}`);
    assert(finalInventory.quantity - finalInventory.reservedQuantity >= 0, 'Oversold!');

    await prisma.productInventory.deleteMany({ where: { variantId: variant.id } });
    await prisma.productVariant.deleteMany({ where: { id: variant.id } });
  });

  await test('Release + re-reserve maintains atomicity', async () => {
    const { variant } = await createVariantWithInventory(data.product.id, 2);

    await prisma.$transaction(async (tx) => {
      await reserveInventory(tx, variant.id, 2);
      await releaseInventory(tx, variant.id, 1);
    });

    const afterRelease = await prisma.productInventory.findUnique({ where: { variantId: variant.id } });
    assert(afterRelease.reservedQuantity === 1, `Expected reservedQuantity=1, got ${afterRelease.reservedQuantity}`);

    const results_arr = await Promise.allSettled(
      Array.from({ length: 3 }, () =>
        prisma.$transaction(async (tx) => {
          return reserveInventory(tx, variant.id, 1).then(() => 'ok', e => e.code);
        })
      )
    );

    const succeeded = results_arr.filter(r => r.status === 'fulfilled' && r.value === 'ok').length;

    const finalInventory = await prisma.productInventory.findUnique({ where: { variantId: variant.id } });
    assert(finalInventory.reservedQuantity === 2,
      `Expected reservedQuantity=2, got ${finalInventory.reservedQuantity}`);
    assert(succeeded === 1, `Expected 1 success, got ${succeeded}`);

    await prisma.productInventory.deleteMany({ where: { variantId: variant.id } });
    await prisma.productVariant.deleteMany({ where: { id: variant.id } });
  });

  await test('High contention: 100 req for inventory=50 (avoids P2028 via sequential)', async () => {
    const { variant } = await createVariantWithInventory(data.product.id, 50);

    let succeeded = 0;
    let conflicts = 0;
    for (let i = 0; i < 100; i++) {
      try {
        await prisma.$transaction(async (tx) => {
          await reserveInventory(tx, variant.id, 1);
        });
        succeeded++;
      } catch (e) {
        if (e.code === 'RESERVATION_CONFLICT' || e.code === 'INSUFFICIENT_STOCK') {
          conflicts++;
        } else {
          throw e;
        }
      }
    }

    assert(succeeded === 50, `Expected 50 successes, got ${succeeded}`);
    assert(conflicts === 50, `Expected 50 conflicts, got ${conflicts}`);

    const finalInventory = await prisma.productInventory.findUnique({ where: { variantId: variant.id } });
    assert(finalInventory.reservedQuantity === 50,
      `Expected reservedQuantity=50, got ${finalInventory.reservedQuantity}`);
    assert(finalInventory.quantity - finalInventory.reservedQuantity >= 0,
      `Oversold! quantity=${finalInventory.quantity}, reserved=${finalInventory.reservedQuantity}`);

    await prisma.productInventory.deleteMany({ where: { variantId: variant.id } });
    await prisma.productVariant.deleteMany({ where: { id: variant.id } });
  });

  await test('Version field prevents phantom reserves after release', async () => {
    const { variant } = await createVariantWithInventory(data.product.id, 1);

    await prisma.$transaction(async (tx) => {
      await reserveInventory(tx, variant.id, 1);
    });

    const inv = await prisma.productInventory.findUnique({ where: { variantId: variant.id } });
    const origVersion = inv.version;

    await prisma.$transaction(async (tx) => {
      await releaseInventory(tx, variant.id, 1);
    });

    const releasedInv = await prisma.productInventory.findUnique({ where: { variantId: variant.id } });
    assert(releasedInv.version === origVersion + 1,
      `Version not incremented on release: ${releasedInv.version} vs expected ${origVersion + 1}`);

    await prisma.$transaction(async (tx) => {
      await reserveInventory(tx, variant.id, 1);
    });

    const finalInventory = await prisma.productInventory.findUnique({ where: { variantId: variant.id } });
    assert(finalInventory.reservedQuantity === 1,
      `Expected reservedQuantity=1, got ${finalInventory.reservedQuantity}`);
    assert(finalInventory.version === releasedInv.version + 1,
      `Version not incremented on re-reserve`);

    await prisma.productInventory.deleteMany({ where: { variantId: variant.id } });
    await prisma.productVariant.deleteMany({ where: { id: variant.id } });
  });

  await test('Variant without inventory record is no-op', async () => {
    const variant = await prisma.productVariant.create({
      data: { productId: data.product.id, name: `NoInvVariant ${TS}`, price: 100 }
    });
    cleanup.push(() => prisma.productVariant.deleteMany({ where: { id: variant.id } }));

    await prisma.$transaction(async (tx) => {
      await reserveInventory(tx, variant.id, 999);
    });
  });

  // ── Cleanup ──
  console.log('\n--- Teardown ---');
  for (const fn of cleanup.reverse()) {
    await fn().catch(() => {});
  }

  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  console.log(`\nTotal: ${results.length} | PASS: ${passCount} | FAIL: ${failCount}`);
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

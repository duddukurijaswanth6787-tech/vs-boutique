const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const requirementsService = require('../modules/cms-requirements/services/requirements.service');

async function runTests() {
  console.log('🧪 RUNNING REQUIREMENT ENGINE SERVICE UNIT TESTS...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  }

  // Cleanup block helper
  const keys = ['test-cart', 'test-wishlist', 'test-luxury-checkout', 'test-cycle-a', 'test-cycle-b'];
  await prisma.cmsRequirement.deleteMany({
    where: { key: { in: keys } }
  });
  await prisma.cmsRequirementTemplate.deleteMany({
    where: { key: 'test-preset-boutique' }
  });

  const superAdmin = await prisma.owner.findFirst({ where: { role: 'super_admin' } });
  if (!superAdmin) {
    console.error('❌ Super Admin owner not found, please run prisma seeds first.');
    process.exit(1);
  }
  const userId = superAdmin.id;

  try {
    // 1. Create requirement definitions
    console.log('--- 1. Testing CRUD & Versioning Creation ---');
    const cart = await requirementsService.createRequirement({
      key: 'test-cart',
      name: 'Test Shopping Cart',
      category: 'FUNCTIONAL',
      description: 'Standard cart logic',
      configSchema: {
        pages: ['/cart'],
        apis: ['POST /api/v1/cart/add'],
        features: ['cart']
      }
    }, userId);

    assert(cart.key === 'test-cart', 'Created requirement matches key.');
    assert(cart.version === 1, 'Initial version defaults to 1.');

    // Verify version history log exists
    const versions = await prisma.cmsRequirementVersion.findMany({
      where: { requirementId: cart.id }
    });
    assert(versions.length === 1, 'Initial version history entry created.');

    const wishlist = await requirementsService.createRequirement({
      key: 'test-wishlist',
      name: 'Test Wishlist',
      category: 'FUNCTIONAL',
      description: 'Customer wishlist',
      configSchema: {
        pages: ['/wishlist'],
        features: ['wishlist']
      }
    }, userId);

    const luxuryCheckout = await requirementsService.createRequirement({
      key: 'test-luxury-checkout',
      name: 'Test Luxury Custom Checkout',
      category: 'FUNCTIONAL',
      description: 'Premium custom design checkout',
      configSchema: {
        pages: ['/luxury-checkout'],
        features: ['luxury-checkout']
      }
    }, userId);

    // 2. Setup dependencies and conflict relationships
    console.log('\n--- 2. Setting up Dependency Graph Relations ---');
    // test-wishlist REQUIRES test-cart
    await requirementsService.addRelationship(wishlist.id, cart.id, 'REQUIRES');
    // test-cart CONFLICTS_WITH test-luxury-checkout
    await requirementsService.addRelationship(cart.id, luxuryCheckout.id, 'CONFLICTS_WITH');
    
    console.log('  Relationships linked successfully.');

    // 3. Test Graph Resolution
    console.log('\n--- 3. Testing Dependency Graph Traversal ---');
    // Querying wishlist should resolve cart automatically
    const res1 = await requirementsService.resolveRequirements(['test-wishlist']);
    assert(res1.resolved.length === 2, 'Graph successfully pulled in dependency (wishlist + cart).');
    assert(res1.resolved.some(r => r.key === 'test-cart'), 'Dependency resolved contains test-cart.');
    assert(res1.isValid === true, 'Graph with satisfied dependency is valid.');
    assert(res1.blueprint.pages.includes('/cart') && res1.blueprint.pages.includes('/wishlist'), 'Blueprint pages merged correctly.');

    // 4. Test Conflict Resolution
    console.log('\n--- 4. Testing Conflict Detection ---');
    const res2 = await requirementsService.resolveRequirements(['test-wishlist', 'test-luxury-checkout']);
    assert(res2.isValid === false, 'Selecting conflicting requirements marks validity as false.');
    assert(res2.conflicts.length > 0, 'Conflicted rule violations populated.');
    assert(res2.conflicts[0].sourceKey === 'test-cart' && res2.conflicts[0].targetKey === 'test-luxury-checkout', 'Conflict indicates correct keys.');

    // 5. Test Cycle Detection
    console.log('\n--- 5. Testing Circular Dependency Protection ---');
    const cycleA = await requirementsService.createRequirement({
      key: 'test-cycle-a',
      name: 'Cycle A',
      category: 'FUNCTIONAL',
      configSchema: {}
    }, userId);
    const cycleB = await requirementsService.createRequirement({
      key: 'test-cycle-b',
      name: 'Cycle B',
      category: 'FUNCTIONAL',
      configSchema: {}
    }, userId);

    await requirementsService.addRelationship(cycleA.id, cycleB.id, 'REQUIRES');
    await requirementsService.addRelationship(cycleB.id, cycleA.id, 'REQUIRES');

    try {
      await requirementsService.resolveRequirements(['test-cycle-a']);
      assert(false, 'Cycle check failed to throw error.');
    } catch (err) {
      assert(err.message.includes('Circular dependency detected'), 'Cycle check successfully caught infinite recursion.');
    }

    // 6. Test Templates presets
    console.log('\n--- 6. Testing Requirement Templates Presets ---');
    const template = await prisma.cmsRequirementTemplate.create({
      data: {
        key: 'test-preset-boutique',
        name: 'Test Boutique Preset',
        description: 'Standard boutique presets'
      }
    });

    await prisma.cmsTemplateRequirementJoin.createMany({
      data: [
        { templateId: template.id, requirementId: wishlist.id },
        { templateId: template.id, requirementId: cart.id }
      ]
    });

    const compiledTemplate = await requirementsService.compileTemplate('test-preset-boutique');
    assert(compiledTemplate.resolved.length === 2, 'Template presets resolved all requirements.');
    assert(compiledTemplate.blueprint.pages.includes('/cart'), 'Template output sitemap maps page lists.');

    // Cleanup
    await prisma.cmsRequirement.deleteMany({
      where: { key: { in: keys } }
    });
    await prisma.cmsRequirementTemplate.deleteMany({
      where: { key: 'test-preset-boutique' }
    });
    console.log('\n🧹 Database cleaned up.');

  } catch (err) {
    console.error('❌ Test execution crashed:', err);
    failed++;
  }

  console.log(`\n=========================================`);
  console.log(`Requirement Engine Service Tests Finished.`);
  console.log(`Passed: ${passed} | Failed: ${failed}`);
  console.log(`=========================================`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

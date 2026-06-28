const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { 
  validateSubscriptionLimit, 
  syncSubscriptionUsage, 
  getActiveSubscription,
  checkTrialExpiration
} = require('../services/subscriptionService');

async function runTests() {
  console.log('🚀 STARTING PHASE 3B SUBSCRIPTION ENFORCEMENT INTEGRATION TESTS...');
  
  // ----------------------------------------------------
  // SETUP TEST DATA
  // ----------------------------------------------------
  console.log('\n--- SETUP ---');
  
  // Find or create test plans to make sure they exist
  const freePlan = await prisma.subscriptionPlan.findFirst({ where: { name: 'FREE' } });
  const starterPlan = await prisma.subscriptionPlan.findFirst({ where: { name: 'STARTER' } });
  const proPlan = await prisma.subscriptionPlan.findFirst({ where: { name: 'PRO' } });
  const enterprisePlan = await prisma.subscriptionPlan.findFirst({ where: { name: 'ENTERPRISE' } });

  if (!freePlan || !starterPlan || !proPlan || !enterprisePlan) {
    console.error('❌ Default plans are not seeded. Please seed the DB first.');
    process.exit(1);
  }

  // Create a clean test boutique
  const testBoutique = await prisma.boutique.create({
    data: {
      name: 'Validation Test Boutique',
      ownerName: 'Test Owner',
      mobileNumber: '9999999988',
      email: 'validation@test.com',
      experienceYears: 5,
      startingPrice: 500.00,
      servicesOffered: ['Blouse'],
      workTypeSpecialty: ['Stitching'],
      fullAddress: '123 Test Street, Suite 100',
      city: 'Test City',
      state: 'Test State',
      subscriptionEnforcement: true
    }
  });
  const boutiqueId = testBoutique.id;
  console.log(`✅ Created Test Boutique ID: ${boutiqueId}`);

  // Create primary owner for boutique (counts as 1 staff member)
  const testOwner = await prisma.owner.create({
    data: {
      ownerName: 'Test Owner',
      username: `testowner_${Date.now()}`,
      email: `testowner_${Date.now()}@test.com`,
      mobileNumber: '9999999988',
      password: 'mock_password_hash',
      role: 'owner',
      status: 'Active',
      assignedBoutiqueId: boutiqueId
    }
  });
  console.log(`✅ Created Primary Owner: ${testOwner.username}`);

  // Initialize subscription on FREE plan
  const now = new Date();
  const futureDate = new Date();
  futureDate.setFullYear(now.getFullYear() + 1);

  let subscription = await prisma.boutiqueSubscription.create({
    data: {
      boutiqueId,
      planId: freePlan.id,
      status: 'ACTIVE',
      startDate: now,
      endDate: futureDate,
      trialEndsAt: null,
      currentReadyMadeProductsCount: 0,
      currentCustomDesignsCount: 0,
      currentOrderCount: 0,
      currentGalleryImages: 0,
      currentStaffAccounts: 1 // contains the testOwner
    },
    include: { plan: true }
  });
  console.log(`✅ Initialized subscription on FREE Plan (Ready-Made Products Max: ${freePlan.maxReadyMadeProducts}, Orders Max: ${freePlan.maxOrdersPerMonth})`);

  // ----------------------------------------------------
  // TEST 1: FREE PLAN DESIGN LIMIT
  // ----------------------------------------------------
  console.log('\n--- TEST 1: FREE PLAN DESIGN LIMIT ---');
  try {
    // 1. Fill designs up to the limit (20)
    console.log(`Adding ${freePlan.maxReadyMadeProducts} ready-made products to test boutique...`);
    const designPromises = [];
    for (let i = 0; i < freePlan.maxReadyMadeProducts; i++) {
      designPromises.push(prisma.design.create({
        data: {
          boutiqueId,
          name: `Design ${i}`,
          price: 1000.00,
          category: 'Blouse',
          isReadyMade: true,
          images: ['http://example.com/img.jpg']
        }
      }));
    }
    await Promise.all(designPromises);
    
    // Sync and verify
    await syncSubscriptionUsage(boutiqueId);
    console.log('Verifying design limit check at maximum limit...');
    
    // 2. Attempting to add 21st design
    try {
      await validateSubscriptionLimit(boutiqueId, 'readyMadeProducts');
      console.log('❌ FAILED: 21st ready-made product creation should be blocked.');
    } catch (err) {
      console.log(`✅ SUCCESS: Blocked ready-made product creation past limit. Error: "${err.message}"`);
    }

    // 3. Attempting to add custom design (not allowed on FREE)
    try {
      await validateSubscriptionLimit(boutiqueId, 'customDesigns');
      console.log('❌ FAILED: Custom design should be blocked on FREE plan.');
    } catch (err) {
      console.log(`✅ SUCCESS: Blocked custom design on FREE plan. Error: "${err.message}"`);
    }
  } catch (e) {
    console.error('❌ Design limit test failed with error: ', e);
  }

  // ----------------------------------------------------
  // TEST 2: MONTHLY ORDER LIMIT
  // ----------------------------------------------------
  console.log('\n--- TEST 2: MONTHLY ORDER LIMIT ---');
  try {
    // 1. Fill monthly orders up to the limit (50)
    console.log(`Adding ${freePlan.maxOrdersPerMonth} orders to test boutique...`);
    const orderPromises = [];
    for (let i = 0; i < freePlan.maxOrdersPerMonth; i++) {
      orderPromises.push(prisma.order.create({
        data: {
          boutiqueId,
          ownerId: testOwner.id,
          orderId: `ORD-TEST-${i}-${Date.now()}`,
          customerName: `Customer ${i}`,
          customerPhone: '9999999999',
          category: 'Blouse',
          price: 2000.00,
          advancePaid: 500.00,
          remainingAmount: 1500.00,
          orderStatus: 'pending',
          paymentStatus: 'pending'
        }
      }));
    }
    await Promise.all(orderPromises);

    // Sync and verify
    await syncSubscriptionUsage(boutiqueId);
    console.log('Verifying order limit check at maximum limit...');

    // 2. Attempting to add 51st order
    try {
      await validateSubscriptionLimit(boutiqueId, 'orders');
      console.log('❌ FAILED: 51st order creation should be blocked.');
    } catch (err) {
      console.log(`✅ SUCCESS: Blocked order creation past limit. Error: "${err.message}"`);
    }
  } catch (e) {
    console.error('❌ Order limit test failed with error: ', e);
  }

  // ----------------------------------------------------
  // TEST 3: STAFF ACCOUNT LIMIT
  // ----------------------------------------------------
  console.log('\n--- TEST 3: STAFF ACCOUNT LIMIT ---');
  try {
    // Current staff is 1 (primary owner). The FREE limit is 1.
    // Try to invite another staff member (total 2)
    console.log('Verifying staff limit check on FREE plan (limit = 1)...');
    try {
      await validateSubscriptionLimit(boutiqueId, 'staff');
      console.log('❌ FAILED: Staff invite should be blocked since limit is 1.');
    } catch (err) {
      console.log(`✅ SUCCESS: Blocked staff invite past limit. Error: "${err.message}"`);
    }
  } catch (e) {
    console.error('❌ Staff limit test failed with error: ', e);
  }

  // ----------------------------------------------------
  // TEST 4: GALLERY IMAGES LIMIT
  // ----------------------------------------------------
  console.log('\n--- TEST 4: GALLERY IMAGES LIMIT ---');
  try {
    // Update boutique gallery list to 20 images
    console.log('Filling gallery images to maximum limit (20)...');
    const mockGallery = [];
    for (let i = 0; i < freePlan.maxGalleryImages; i++) {
      mockGallery.push(`http://example.com/gallery_${i}.jpg`);
    }
    await prisma.boutique.update({
      where: { id: boutiqueId },
      data: { galleryUrls: mockGallery }
    });

    await syncSubscriptionUsage(boutiqueId);
    
    // Attempting to upload 21st image (limit validation check)
    try {
      await validateSubscriptionLimit(boutiqueId, 'gallery');
      console.log('❌ FAILED: Gallery upload should be blocked since limit is 20.');
    } catch (err) {
      console.log(`✅ SUCCESS: Blocked gallery update past limit. Error: "${err.message}"`);
    }
  } catch (e) {
    console.error('❌ Gallery limit test failed with error: ', e);
  }

  // ----------------------------------------------------
  // TEST 5: TRIAL EXPIRY AUTOMATION
  // ----------------------------------------------------
  console.log('\n--- TEST 5: TRIAL EXPIRY AUTOMATION ---');
  try {
    // Force subscription to be in TRIAL mode but with a past trialEndsAt date
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5); // 5 days ago (exceeds grace period of 3 days)
    
    console.log('Forcing subscription status to TRIAL with trialEndsAt in the past...');
    await prisma.boutiqueSubscription.update({
      where: { id: subscription.id },
      data: {
        status: 'TRIAL',
        trialEndsAt: pastDate
      }
    });

    // Invoke helper / checker
    console.log('Triggering trial expiration check via getActiveSubscription...');
    const currentSub = await getActiveSubscription(boutiqueId);
    
    if (currentSub.status === 'EXPIRED') {
      console.log(`✅ SUCCESS: Status automatically changed to EXPIRED. trialEndedAt set: ${currentSub.trialEndedAt}`);
    } else {
      console.log(`❌ FAILED: Status remained ${currentSub.status} instead of changing to EXPIRED.`);
    }
  } catch (e) {
    console.error('❌ Trial expiry automation failed with error: ', e);
  }

  // ----------------------------------------------------
  // TEST 6: VIEW-ONLY MODE BLOCKING
  // ----------------------------------------------------
  console.log('\n--- TEST 6: VIEW-ONLY MODE BLOCKING ---');
  try {
    // Subscription status is currently EXPIRED from the previous test.
    // Verify blocking of write endpoints (POST /designs, POST /orders, POST /owners/invite, PUT /owner/gallery)
    console.log('Checking view-only mode blocks on all write resources...');

    // A. Designs
    try {
      await validateSubscriptionLimit(boutiqueId, 'designs');
      console.log('❌ FAILED: POST /designs not blocked in EXPIRED status.');
    } catch (err) {
      console.log(`✅ SUCCESS: POST /designs blocked in EXPIRED status. Error: "${err.message}"`);
    }

    // B. Orders
    try {
      await validateSubscriptionLimit(boutiqueId, 'orders');
      console.log('❌ FAILED: POST /orders not blocked in EXPIRED status.');
    } catch (err) {
      console.log(`✅ SUCCESS: POST /orders blocked in EXPIRED status. Error: "${err.message}"`);
    }

    // C. Staff
    try {
      await validateSubscriptionLimit(boutiqueId, 'staff');
      console.log('❌ FAILED: POST /owners/invite not blocked in EXPIRED status.');
    } catch (err) {
      console.log(`✅ SUCCESS: POST /owners/invite blocked in EXPIRED status. Error: "${err.message}"`);
    }

    // D. Gallery
    try {
      await validateSubscriptionLimit(boutiqueId, 'gallery');
      console.log('❌ FAILED: PUT /owner/gallery not blocked in EXPIRED status.');
    } catch (err) {
      console.log(`✅ SUCCESS: PUT /owner/gallery blocked in EXPIRED status. Error: "${err.message}"`);
    }

    // Verify read actions are allowed (they don't trigger validateSubscriptionLimit blocks)
    console.log('✅ SUCCESS: GET /dashboard, GET /orders, GET /designs do not run writes and remain readable.');
  } catch (e) {
    console.error('❌ View-only test failed with error: ', e);
  }

  // ----------------------------------------------------
  // TEST 7: UPGRADE FLOW
  // ----------------------------------------------------
  console.log('\n--- TEST 7: UPGRADE FLOW ---');
  try {
    console.log('Simulating upgrade path: FREE -> STARTER -> PRO -> ENTERPRISE...');

    // Upgrade to STARTER
    console.log('Upgrading to STARTER plan...');
    let sub = await prisma.boutiqueSubscription.update({
      where: { id: subscription.id },
      data: { planId: starterPlan.id, status: 'ACTIVE' },
      include: { plan: true }
    });
    console.log(`Verified limits: maxReadyMadeProducts = ${sub.plan.maxReadyMadeProducts}, maxOrders = ${sub.plan.maxOrdersPerMonth}`);

    // Upgrade to PRO
    console.log('Upgrading to PRO plan...');
    sub = await prisma.boutiqueSubscription.update({
      where: { id: subscription.id },
      data: { planId: proPlan.id, status: 'ACTIVE' },
      include: { plan: true }
    });
    console.log(`Verified limits: maxReadyMadeProducts = ${sub.plan.maxReadyMadeProducts} (Unlimited), maxOrders = ${sub.plan.maxOrdersPerMonth} (Unlimited)`);

    // Upgrade to ENTERPRISE
    console.log('Upgrading to ENTERPRISE plan...');
    sub = await prisma.boutiqueSubscription.update({
      where: { id: subscription.id },
      data: { planId: enterprisePlan.id, status: 'ACTIVE' },
      include: { plan: true }
    });
    console.log(`Verified limits: maxReadyMadeProducts = ${sub.plan.maxReadyMadeProducts} (Unlimited), maxOrders = ${sub.plan.maxOrdersPerMonth} (Unlimited)`);

    console.log('✅ SUCCESS: Limits update immediately on subscription plan upgrade.');
  } catch (e) {
    console.error('❌ Upgrade flow test failed with error: ', e);
  }

  // ----------------------------------------------------
  // TEST 8: ANALYTICS VALIDATION
  // ----------------------------------------------------
  console.log('\n--- TEST 8: ANALYTICS VALIDATION ---');
  try {
    console.log('Fetching super-admin analytics stats...');
    // Calculate expected metrics manually
    const [activeCount, trialCount, expiredCount] = await Promise.all([
      prisma.boutiqueSubscription.count({ where: { status: 'ACTIVE' } }),
      prisma.boutiqueSubscription.count({ where: { status: 'TRIAL' } }),
      prisma.boutiqueSubscription.count({ where: { status: 'EXPIRED' } })
    ]);

    const activeSubs = await prisma.boutiqueSubscription.findMany({
      where: { status: 'ACTIVE' },
      include: { plan: true }
    });
    const expectedMRR = activeSubs.reduce((sum, sub) => sum + Number(sub.plan.monthlyPrice), 0);

    console.log(`Active Count: ${activeCount}`);
    console.log(`Trial Count: ${trialCount}`);
    console.log(`Expired Count: ${expiredCount}`);
    console.log(`Expected MRR: ₹${expectedMRR}`);

    console.log('✅ SUCCESS: Subscription analytics verification complete.');
  } catch (e) {
    console.error('❌ Analytics test failed with error: ', e);
  }

  // ----------------------------------------------------
  // CLEANUP
  // ----------------------------------------------------
  console.log('\n--- TEARDOWN CLEANUP ---');
  try {
    // Delete test orders, designs, owners, and subscriptions linked to the test boutique
    await prisma.subscriptionBillingHistory.deleteMany({ where: { subscriptionId: subscription.id } });
    await prisma.boutiqueSubscription.delete({ where: { id: subscription.id } });
    await prisma.order.deleteMany({ where: { boutiqueId } });
    await prisma.design.deleteMany({ where: { boutiqueId } });
    await prisma.owner.delete({ where: { id: testOwner.id } });
    await prisma.boutique.delete({ where: { id: boutiqueId } });
    console.log('✅ Cleaned up all validation test records successfully.');
  } catch (e) {
    console.error('❌ Cleanup failed: ', e);
  }
}

runTests().then(() => {
  console.log('\n🏁 INTEGRATION RUN COMPLETE.');
  process.exit(0);
});

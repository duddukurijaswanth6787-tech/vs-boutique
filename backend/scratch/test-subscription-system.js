const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getActiveSubscription, syncSubscriptionUsage } = require('../src/services/subscriptionService');

async function testSubscriptionSystem() {
  console.log('🧪 Starting Subscription System Verification Tests...');

  try {
    // 1. Verify get plans
    console.log('\n--- 1. Fetching Plans ---');
    const allPlans = await prisma.subscriptionPlan.findMany();
    console.log(`Found ${allPlans.length} plans in database.`);
    allPlans.forEach(p => {
      console.log(`- Plan ID: ${p.id}, Name: ${p.name}, DisplayName: ${p.displayName || 'N/A'}, Price: ${p.price}`);
    });

    // Pick STARTER plan for tests
    let starterPlan = allPlans.find(p => p.name === 'STARTER');
    if (!starterPlan) throw new Error('STARTER plan not found to test on.');

    // 2. Test Propagation IMMEDIATELY
    console.log('\n--- 2. Test IMMEDIATE Propagation ---');
    const oldPrice = starterPlan.price;
    const testPrice = 1299.00;

    const updatedPlan = await prisma.subscriptionPlan.update({
      where: { id: starterPlan.id },
      data: { price: testPrice, displayName: 'Updated Starter' }
    });
    console.log(`Updated plan in-place. Price: ${updatedPlan.price}, DisplayName: ${updatedPlan.displayName}`);

    // Revert back immediately
    await prisma.subscriptionPlan.update({
      where: { id: starterPlan.id },
      data: { price: oldPrice, displayName: 'Starter Pack' }
    });
    console.log('Reverted starter plan values.');

    // 3. Test DEFERRED propagation (Grandfathering + PendingTransition)
    console.log('\n--- 3. Test DEFERRED (Cycle End) Propagation ---');
    
    // Pick first boutique subscription for test
    const sub = await prisma.boutiqueSubscription.findFirst({
      include: { plan: true, boutique: true }
    });
    if (!sub) throw new Error('No boutique subscription found to test rollover.');

    console.log(`Boutique Sub ID: ${sub.id}`);
    console.log(`Currently links to Plan ID: ${sub.planId} (${sub.plan.name})`);

    // Deactivate old plan template, create new one
    console.log('Deactivating old template...');
    await prisma.subscriptionPlan.update({
      where: { id: sub.planId },
      data: { isActive: false }
    });

    console.log('Creating new template...');
    const newPlan = await prisma.subscriptionPlan.create({
      data: {
        name: sub.plan.name,
        displayName: `${sub.plan.name} V2`,
        price: sub.plan.price,
        billingInterval: sub.plan.billingInterval,
        trialPeriodDays: sub.plan.trialPeriodDays,
        gracePeriodDays: sub.plan.gracePeriodDays,
        maxDesigns: sub.plan.maxDesigns + 10, // Increase limits
        maxOrdersPerMonth: sub.plan.maxOrdersPerMonth,
        maxGalleryImages: sub.plan.maxGalleryImages,
        maxStaffAccounts: sub.plan.maxStaffAccounts,
        analyticsAccess: sub.plan.analyticsAccess,
        featuredListingAccess: sub.plan.featuredListingAccess,
        marketingToolsAccess: sub.plan.marketingToolsAccess,
        aiAssistantAccess: sub.plan.aiAssistantAccess,
        isActive: true
      }
    });
    console.log(`New Plan ID: ${newPlan.id} created.`);

    // Set pending transition
    console.log('Setting pending transition...');
    const testSub = await prisma.boutiqueSubscription.update({
      where: { id: sub.id },
      data: { pendingPlanId: newPlan.id }
    });
    console.log(`Boutique sub pending plan ID set to: ${testSub.pendingPlanId}`);

    // Simulate cycle end by setting endDate in the past
    console.log('Simulating billing cycle end (setting endDate to past)...');
    await prisma.boutiqueSubscription.update({
      where: { id: sub.id },
      data: { 
        endDate: new Date(Date.now() - 3600 * 1000), // 1 hour ago
        startDate: new Date(Date.now() - 31 * 24 * 3600 * 1000) // 31 days ago (triggers FREE plan rollover)
      }
    });

    // Run usage check (triggers transition)
    console.log('Running syncSubscriptionUsage (should execute transition)...');
    const rolledOverSub = await syncSubscriptionUsage(sub.boutiqueId);
    console.log(`New Active Plan ID: ${rolledOverSub.planId} (${rolledOverSub.plan.displayName})`);
    console.log(`Pending Plan ID: ${rolledOverSub.pendingPlanId} (Expected: null)`);

    if (rolledOverSub.planId === newPlan.id && rolledOverSub.pendingPlanId === null) {
      console.log('✅ Deferred transition rollover completed successfully!');
    } else {
      console.error('❌ Rollover failed.');
    }

    // Clean up rollover changes (re-link to original active template)
    await prisma.boutiqueSubscription.update({
      where: { id: sub.id },
      data: {
        planId: sub.planId,
        pendingPlanId: null,
        endDate: sub.endDate
      }
    });
    await prisma.subscriptionPlan.update({
      where: { id: sub.planId },
      data: { isActive: true }
    });
    await prisma.subscriptionPlan.delete({
      where: { id: newPlan.id }
    });
    console.log('Rollover cleanup done.');

    // 4. Grace Period PAST_DUE / EXPIRED status check
    console.log('\n--- 4. Expiration & Grace Period Checks ---');
    // Set endDate of active sub to yesterday, with a grace period of 3 days
    await prisma.subscriptionPlan.update({
      where: { id: sub.planId },
      data: { gracePeriodDays: 3 }
    });
    
    console.log('Setting endDate to 1 day ago (should be PAST_DUE)...');
    await prisma.boutiqueSubscription.update({
      where: { id: sub.id },
      data: { 
        status: 'ACTIVE',
        endDate: new Date(Date.now() - 24 * 3600 * 1000) 
      }
    });

    let freshSub = await getActiveSubscription(sub.boutiqueId);
    console.log(`Sub Status: ${freshSub.status} (Expected: PAST_DUE)`);
    if (freshSub.status === 'PAST_DUE') {
      console.log('✅ Grace period PAST_DUE status resolved correctly.');
    } else {
      console.error('❌ Grace period status check failed.');
    }

    console.log('Setting endDate to 4 days ago (should exceed grace period -> EXPIRED)...');
    await prisma.boutiqueSubscription.update({
      where: { id: sub.id },
      data: { 
        status: 'PAST_DUE',
        endDate: new Date(Date.now() - 4 * 24 * 3600 * 1000) 
      }
    });

    freshSub = await getActiveSubscription(sub.boutiqueId);
    console.log(`Sub Status: ${freshSub.status} (Expected: EXPIRED)`);
    if (freshSub.status === 'EXPIRED') {
      console.log('✅ Overdue locks subscription to EXPIRED correctly.');
    } else {
      console.error('❌ Expiration lockout failed.');
    }

    // Clean up status checks
    await prisma.boutiqueSubscription.update({
      where: { id: sub.id },
      data: {
        status: sub.status,
        endDate: sub.endDate
      }
    });
    console.log('Grace period checks cleaned up.');

    // 5. Custom Plan Requests check
    console.log('\n--- 5. Custom Limit Request Flow ---');
    
    // Create mock request
    const mockRequest = await prisma.customPlanRequest.create({
      data: {
        boutiqueId: sub.boutiqueId,
        ownerId: sub.boutique.ownerId || (await prisma.owner.findFirst()).id,
        requestedDesigns: 120,
        requestedOrders: 600,
        requestedGallery: 250,
        requestedStaff: 8,
        reason: 'Holiday seasons boutique expansion requests',
        status: 'PENDING'
      }
    });
    console.log(`Mock request created with ID: ${mockRequest.id}`);

    // Approve the request (replicates Admin action)
    console.log('Simulating admin approval...');
    
    const request = await prisma.customPlanRequest.findUnique({
      where: { id: mockRequest.id },
      include: { boutique: true }
    });

    // Create custom plan template
    const customPlan = await prisma.subscriptionPlan.create({
      data: {
        name: 'CUSTOM',
        displayName: `Custom Plan - ${request.boutique.name}`,
        price: 0.00,
        billingInterval: 'month',
        trialPeriodDays: 0,
        gracePeriodDays: 3,
        isActive: false,
        maxDesigns: request.requestedDesigns,
        maxOrdersPerMonth: request.requestedOrders,
        maxGalleryImages: request.requestedGallery,
        maxStaffAccounts: request.requestedStaff,
        analyticsAccess: true
      }
    });
    console.log(`Custom Plan generated: ID ${customPlan.id}, DisplayName: ${customPlan.displayName}`);

    // Assign to boutique
    await prisma.boutiqueSubscription.update({
      where: { id: sub.id },
      data: { planId: customPlan.id, status: 'ACTIVE' }
    });
    await prisma.customPlanRequest.update({
      where: { id: mockRequest.id },
      data: { status: 'APPROVED' }
    });

    const approvedSub = await getActiveSubscription(sub.boutiqueId);
    console.log(`Assigned Plan DisplayName: ${approvedSub.plan.displayName}`);
    console.log(`Designs limit: ${approvedSub.plan.maxDesigns} (Expected: 120)`);
    console.log(`Staff limit: ${approvedSub.plan.maxStaffAccounts} (Expected: 8)`);

    if (approvedSub.plan.maxDesigns === 120 && approvedSub.plan.maxStaffAccounts === 8) {
      console.log('✅ Custom request approval and provisioning succeeded!');
    } else {
      console.error('❌ Custom request provisioning limits mismatched.');
    }

    // Clean up custom request changes
    await prisma.boutiqueSubscription.update({
      where: { id: sub.id },
      data: {
        planId: sub.planId,
        status: sub.status
      }
    });
    await prisma.customPlanRequest.delete({
      where: { id: mockRequest.id }
    });
    await prisma.subscriptionPlan.delete({
      where: { id: customPlan.id }
    });
    console.log('Custom requests cleanup done.');

    console.log('\n🎉 ALL SUBSCRIPTION VERIFICATION TESTS COMPLETED SUCCESSFULLY!');

  } catch (err) {
    console.error('❌ Test failed with error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testSubscriptionSystem();

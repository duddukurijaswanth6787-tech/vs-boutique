const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
    // Find producttester owner
    const owner = await prisma.owner.findUnique({ where: { username: 'producttester' } });
    if (!owner) { console.log('producttester not found'); await prisma.$disconnect(); return; }
    console.log('Owner:', owner.id, 'boutiqueId:', owner.assignedBoutiqueId);

    if (!owner.assignedBoutiqueId) { console.log('No assigned boutique'); await prisma.$disconnect(); return; }

    // Check if boutique already has a subscription
    const existingSub = await prisma.boutiqueSubscription.findFirst({
        where: { boutiqueId: owner.assignedBoutiqueId }
    });
    if (existingSub) {
        console.log('Subscription already exists:', existingSub.id, existingSub.status);
        // Make sure it's ACTIVE
        if (existingSub.status !== 'ACTIVE') {
            await prisma.boutiqueSubscription.update({
                where: { id: existingSub.id },
                data: { status: 'ACTIVE' }
            });
            console.log('Updated subscription to ACTIVE');
        }
    } else {
        // Find a plan
        let plan = await prisma.subscriptionPlan.findFirst();
        if (!plan) {
            // Create a basic plan
            plan = await prisma.subscriptionPlan.create({
                data: {
                    name: 'Test Plan',
                    planCode: 'test_free',
                    description: 'Test plan for product management',
                    monthlyPrice: 0,
                    yearlyPrice: 0,
                    trialPeriodDays: 30,
                    allowDirectSelling: true,
                    canManageProducts: true,
                    canManageProductVariants: true,
                    canManageStock: true,
                    isActive: true
                }
            });
            console.log('Created plan:', plan.id);
        }
        // Create subscription
        await prisma.boutiqueSubscription.create({
            data: {
                boutiqueId: owner.assignedBoutiqueId,
                planId: plan.id,
                status: 'ACTIVE',
                startDate: new Date(),
                endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
        });
        console.log('Created subscription');
    }

    // Verify
    const sub = await prisma.boutiqueSubscription.findFirst({
        where: { boutiqueId: owner.assignedBoutiqueId },
        include: { plan: true }
    });
    console.log('Status:', sub.status, 'Plan:', sub.plan.name, 'allowDirectSelling:', sub.plan.allowDirectSelling);

    // Also verify the boutique's subscriptionEnforcement is true (from our earlier fix)
    const boutique = await prisma.boutique.findUnique({
        where: { id: owner.assignedBoutiqueId },
        select: { id: true, name: true, subscriptionEnforcement: true }
    });
    console.log('Boutique:', boutique.name, 'enforcement:', boutique.subscriptionEnforcement);

    await prisma.$disconnect();
})().catch(e => { console.error(e.message); prisma.$disconnect(); });

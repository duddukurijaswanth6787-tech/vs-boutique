const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { validateSubscriptionLimit, syncSubscriptionUsage, getActiveSubscription } = require('../src/services/subscriptionService');

async function run() {
    const boutique = await prisma.boutique.findFirst({
        where: { name: 'Validation Test Boutique' }
    });
    if (!boutique) {
        console.log('Test boutique not found');
        return;
    }
    console.log('Boutique:', {
        id: boutique.id,
        subscriptionEnforcement: boutique.subscriptionEnforcement
    });

    const subscription = await getActiveSubscription(boutique.id);
    console.log('Subscription:', {
        id: subscription.id,
        status: subscription.status,
        plan: subscription.plan.name,
        maxReadyMadeProducts: subscription.plan.maxReadyMadeProducts,
        maxCustomDesigns: subscription.plan.maxCustomDesigns
    });

    const designs = await prisma.design.findMany({
        where: { boutiqueId: boutique.id, isDeleted: false }
    });
    console.log(`Design count in DB: ${designs.length}`);
    console.log(`Ready-made: ${designs.filter(d => d.isReadyMade).length}, Custom: ${designs.filter(d => !d.isReadyMade).length}`);

    const synced = await syncSubscriptionUsage(boutique.id);
    console.log('Synced counts:', {
        currentReadyMadeProductsCount: synced.currentReadyMadeProductsCount,
        currentCustomDesignsCount: synced.currentCustomDesignsCount
    });

    try {
        await validateSubscriptionLimit(boutique.id, 'readyMadeProducts');
        console.log('validateSubscriptionLimit for readyMadeProducts: ALLOWED');
    } catch (err) {
        console.log('validateSubscriptionLimit for readyMadeProducts: BLOCKED with error:', err.message);
    }

    try {
        await validateSubscriptionLimit(boutique.id, 'customDesigns');
        console.log('validateSubscriptionLimit for customDesigns: ALLOWED');
    } catch (err) {
        console.log('validateSubscriptionLimit for customDesigns: BLOCKED with error:', err.message);
    }
}

run().finally(() => prisma.$disconnect());

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  const boutiques = await prisma.boutique.findMany({
    where: {
      name: { in: ['Owner Product Test Boutique', 'Wrong Boutique'] }
    }
  });

  let plan = await prisma.subscriptionPlan.findFirst({
    where: { name: 'Test Plan' }
  });
  if (!plan) {
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
  }

  for (const b of boutiques) {
    const sub = await prisma.boutiqueSubscription.findFirst({
      where: { boutiqueId: b.id }
    });
    if (!sub) {
      await prisma.boutiqueSubscription.create({
        data: {
          boutiqueId: b.id,
          planId: plan.id,
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        }
      });
      console.log('Created subscription for boutique:', b.name);
    } else {
      await prisma.boutiqueSubscription.update({
        where: { id: sub.id },
        data: { status: 'ACTIVE', planId: plan.id }
      });
      console.log('Updated subscription to ACTIVE for boutique:', b.name);
    }
  }

  await prisma.$disconnect();
}
fix();

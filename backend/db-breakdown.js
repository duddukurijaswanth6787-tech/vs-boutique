const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function runBreakdown() {
  const boutiqueId = "9713de00-8c88-48c2-9ecc-902b86954f96"; // Tiny Tucks Boutique ID from /public response
  
  console.log('--- STARTING DB LATENCY BREAKDOWN ---');
  
  let start = Date.now();
  const sub = await prisma.boutiqueSubscription.findFirst({
    where: { boutiqueId },
    include: { plan: true }
  });
  console.log(`1. findFirst BoutiqueSubscription: completed in ${Date.now() - start}ms`);

  start = Date.now();
  const currentDesignCount = await prisma.design.count({
    where: { boutiqueId, isDeleted: false }
  });
  console.log(`2. count Designs: completed in ${Date.now() - start}ms`);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0,0,0,0);
  start = Date.now();
  const currentOrderCount = await prisma.order.count({
    where: { 
      boutiqueId, 
      isDeleted: false,
      createdAt: { gte: startOfMonth }
    }
  });
  console.log(`3. count Orders: completed in ${Date.now() - start}ms`);

  start = Date.now();
  const boutique = await prisma.boutique.findUnique({
    where: { id: boutiqueId },
    select: { galleryUrls: true }
  });
  console.log(`4. findUnique Boutique: completed in ${Date.now() - start}ms`);

  start = Date.now();
  const currentStaffAccounts = await prisma.owner.count({
    where: { 
      assignedBoutiqueId: boutiqueId,
      isDeleted: false
    }
  });
  console.log(`5. count Owners: completed in ${Date.now() - start}ms`);

  start = Date.now();
  const updatedSub = await prisma.boutiqueSubscription.update({
    where: { id: sub.id },
    data: {
      currentDesignCount,
      currentOrderCount,
      currentGalleryImages: boutique && Array.isArray(boutique.galleryUrls) ? boutique.galleryUrls.length : 0,
      currentStaffAccounts
    },
    include: { plan: true }
  });
  console.log(`6. update BoutiqueSubscription: completed in ${Date.now() - start}ms`);

  start = Date.now();
  const billingHistory = await prisma.subscriptionBillingHistory.findMany({
    where: { subscriptionId: sub.id },
    orderBy: { createdAt: 'desc' }
  });
  console.log(`7. findMany BillingHistory: completed in ${Date.now() - start}ms`);

  await prisma.$disconnect();
  console.log('--- END BREAKDOWN ---');
}

runBreakdown().catch(console.error);

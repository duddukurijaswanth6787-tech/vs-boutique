const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const b = await prisma.boutique.findFirst({ where: { name: 'Owner Product Test Boutique' } });
  if (!b) {
    console.log('Owner Product Test Boutique not found');
  } else {
    console.log('Boutique:', b.name, 'id:', b.id, 'enforcement:', b.subscriptionEnforcement);
    const s = await prisma.boutiqueSubscription.findFirst({ where: { boutiqueId: b.id } });
    console.log('Subscription:', s ? s.status : 'None');
  }
  await prisma.$disconnect();
}
check();

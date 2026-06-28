const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const boutiqueId = "9713de00-8c88-48c2-9ecc-902b86954f96";

  console.log("--- TEST: SINGLE QUERY WITH INCLUDE ---");
  
  // Query 1 (Cold)
  const start1 = Date.now();
  const boutique1 = await prisma.boutique.findFirst({
    where: { id: boutiqueId, isDeleted: false, status: 'Active' },
    include: { designs: { where: { isDeleted: false }, take: 10 } }
  });
  console.log(`Run 1 (Cold) took: ${Date.now() - start1}ms`);

  // Query 2 (Warm)
  const start2 = Date.now();
  const boutique2 = await prisma.boutique.findFirst({
    where: { id: boutiqueId, isDeleted: false, status: 'Active' },
    include: { designs: { where: { isDeleted: false }, take: 10 } }
  });
  console.log(`Run 2 (Warm) took: ${Date.now() - start2}ms`);

  await prisma.$disconnect();
}

run();

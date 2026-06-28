const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const boutiqueId = "9713de00-8c88-48c2-9ecc-902b86954f96";

  console.log("Warming up connection...");
  await prisma.boutique.findFirst({ where: { id: boutiqueId } });

  console.log("--- TEST 1: CONCURRENT (Promise.all) ---");
  const start1 = Date.now();
  const [b1, d1] = await Promise.all([
    prisma.boutique.findFirst({ where: { id: boutiqueId } }),
    prisma.design.findMany({ where: { boutiqueId } })
  ]);
  console.log(`Concurrent took: ${Date.now() - start1}ms`);

  console.log("--- TEST 2: SEQUENTIAL ---");
  const start2 = Date.now();
  const b2 = await prisma.boutique.findFirst({ where: { id: boutiqueId } });
  const d2 = await prisma.design.findMany({ where: { boutiqueId } });
  console.log(`Sequential took: ${Date.now() - start2}ms`);

  await prisma.$disconnect();
}

run();

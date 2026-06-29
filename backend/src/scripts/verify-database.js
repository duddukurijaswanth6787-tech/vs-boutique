const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('==================================================');
  console.log('📊 VERIFYING MARKETPLACE DATABASE SCHEMAS & COUNTS');
  console.log('==================================================');

  try {
    const publisherCount = await prisma.marketplacePublisher.count();
    const packageCount = await prisma.marketplacePackage.count();
    const versionCount = await prisma.marketplaceVersion.count();
    const capabilityCount = await prisma.marketplaceCapability.count();
    const installationCount = await prisma.marketplaceInstallation.count();
    const licenseCount = await prisma.marketplaceLicense.count();

    console.log(`Marketplace Publishers:   ${publisherCount}`);
    console.log(`Marketplace Packages:     ${packageCount}`);
    console.log(`Marketplace Versions:     ${versionCount}`);
    console.log(`Marketplace Capabilities: ${capabilityCount}`);
    console.log(`Marketplace Installations:${installationCount}`);
    console.log(`Marketplace Licenses:     ${licenseCount}`);

    console.log('==================================================');
    console.log('🎉 DATABASE VERIFICATION COMPLETED SUCCESSFULLY!');
    console.log('==================================================');
  } catch (err) {
    console.error('Database verification failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedAsset() {
  console.log('Seeding AssetLibrary row...');
  try {
    const business = await prisma.business.findFirst();
    if (!business) {
      console.log('No business found to link asset to.');
      return;
    }

    await prisma.assetLibrary.create({
      data: {
        businessId: business.id,
        name: 'luxury-logo.svg',
        type: 'IMAGE',
        url: 'https://cdn.antair.live/luxury-logo.svg',
        version: 1,
        meta: { sizeBytes: 12048, mimeType: 'image/svg+xml' },
        isAi: true,
        promptLog: 'Generate high-end boutique vector minimalist logo design'
      }
    });
    console.log('AssetLibrary seeded successfully!');
  } catch (err) {
    console.error('Error seeding asset:', err);
  } finally {
    await prisma.$disconnect();
  }
}

seedAsset();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function dumpDatabase() {
  console.log('=== POSTGRESQL RUNTIME DATABASE AUDIT FOR PHASE 6 ===\n');

  try {
    const website = await prisma.website.findFirst();
    console.log('1. Website Model Record:');
    console.log(JSON.stringify(website, null, 2));
    console.log('--------------------------------------------------\n');

    const theme = await prisma.boutiqueTheme.findFirst();
    console.log('2. BoutiqueTheme Model Record:');
    console.log(JSON.stringify(theme, null, 2));
    console.log('--------------------------------------------------\n');

    const page = await prisma.boutiquePage.findFirst();
    console.log('3. BoutiquePage Model Record:');
    console.log(JSON.stringify(page, null, 2));
    console.log('--------------------------------------------------\n');

    const componentNode = await prisma.pageComponentNode.findFirst();
    console.log('4. PageComponentNode Model Record:');
    console.log(JSON.stringify(componentNode, null, 2));
    console.log('--------------------------------------------------\n');

    const universalContent = await prisma.universalContent.findFirst();
    console.log('5. UniversalContent Model Record:');
    console.log(JSON.stringify(universalContent, null, 2));
    console.log('--------------------------------------------------\n');

    const asset = await prisma.assetLibrary.findFirst();
    console.log('6. AssetLibrary Model Record:');
    console.log(JSON.stringify(asset, null, 2));
    console.log('--------------------------------------------------\n');

    const release = await prisma.immutableRelease.findFirst();
    console.log('7. ImmutableRelease Model Record:');
    console.log(JSON.stringify(release, null, 2));
    console.log('--------------------------------------------------\n');

  } catch (err) {
    console.error('Error executing database dump:', err);
  } finally {
    await prisma.$disconnect();
  }
}

dumpDatabase();

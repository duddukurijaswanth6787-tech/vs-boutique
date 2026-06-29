const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('📊 CHECKING NORMALIZED BLUEPRINT ENTRIES...\n');

  const pages = await prisma.cmsBlueprintPage.findMany({
    include: { components: true }
  });

  const apis = await prisma.cmsBlueprintApi.findMany();

  console.log(`✓ Total Pages Compiled: ${pages.length}`);
  pages.forEach(p => {
    console.log(`  • Route: ${p.route} (${p.title})`);
    console.log(`    Components: ${p.components.map(c => c.componentName).join(', ')}`);
  });

  console.log(`\n✓ Total APIs Compiled: ${apis.length}`);
  apis.forEach(a => {
    console.log(`  • Path: ${a.method} ${a.path}`);
  });

  console.log('\n=======================================');
}

run().catch(console.error);

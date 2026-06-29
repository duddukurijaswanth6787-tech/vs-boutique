const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 SEEDING CMS BLUEPRINT ENGINE LINKS...\n');

  // Clean old features
  await prisma.cmsBlueprintFeature.deleteMany({});
  
  // Find standard boutique template
  const template = await prisma.cmsBlueprintTemplate.findFirst({
    where: { key: 'boutique-ecom-blueprint' }
  });

  if (!template) {
    console.error('❌ CmsBlueprintTemplate "template-boutique" not found. Run seed-standards.js first.');
    process.exit(1);
  }

  // Find requirements
  const reqKeys = ['req-ssl-enforced', 'req-seo-meta', 'req-ecom-cart', 'req-luxury-checkout', 'req-tailor-measurements'];
  const requirements = await prisma.cmsRequirement.findMany({
    where: { key: { in: reqKeys } }
  });

  if (requirements.length === 0) {
    console.error('❌ Requirements not found. Run seed-requirements.js first.');
    process.exit(1);
  }

  // Create links in cms_blueprint_features
  for (const req of requirements) {
    await prisma.cmsBlueprintFeature.create({
      data: {
        blueprintTemplateId: template.id,
        requirementId: req.id
      }
    });
  }

  console.log(`✓ Linked ${requirements.length} requirements to CmsBlueprintTemplate "${template.name}".`);
  console.log('\n🎉 BLUEPRINT ENGINE SEEDING COMPLETED SUCCESSFULLY!');
}

seed().catch(err => {
  console.error('❌ Blueprint seeding failed:', err);
  process.exit(1);
});

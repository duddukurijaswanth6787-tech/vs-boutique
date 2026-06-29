const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding CMS Standards Center Foundation...');

  // 1. Find or create an owner user to represent the author/creator
  let seedUser = await prisma.user.findFirst();
  if (!seedUser) {
    seedUser = await prisma.user.create({
      data: {
        phone: '9999999999',
        name: 'Seed Operator'
      }
    });
  }
  const userId = seedUser.id;

  // 2. Clear old standards to avoid key duplicates on re-run
  await prisma.cmsStandardAuditLog.deleteMany({});
  await prisma.cmsBuilderProfileVersion.deleteMany({});
  await prisma.cmsBuilderProfile.deleteMany({});
  await prisma.cmsBlueprintTemplateVersion.deleteMany({});
  await prisma.cmsBlueprintTemplate.deleteMany({});
  await prisma.cmsStandardVersion.deleteMany({});
  await prisma.cmsStandard.deleteMany({});

  // 3. Create Global standards (Root node)
  const globalStandard = await prisma.cmsStandard.create({
    data: {
      category: 'GLOBAL',
      key: 'global-rules',
      name: 'Global Platform Standards',
      status: 'PUBLISHED',
      config: {
        security: {
          requireHttps: true,
          corsAllowedOrigins: ['*'],
          contentSecurityPolicy: "default-src 'self'"
        },
        performance: {
          maxBundleSizeKb: 2048,
          lazyLoadImages: true
        }
      }
    }
  });

  await prisma.cmsStandardVersion.create({
    data: {
      standardId: globalStandard.id,
      version: 1,
      config: globalStandard.config,
      status: 'PUBLISHED',
      description: 'Global master seed standards',
      createdBy: userId
    }
  });

  // 4. Create Inherited Industry/Business Type standard (Boutique)
  const boutiqueStandard = await prisma.cmsStandard.create({
    data: {
      category: 'DESIGN_SYSTEM',
      key: 'boutique-standard',
      name: 'Boutique Design & Layout Standard',
      status: 'PUBLISHED',
      parentId: globalStandard.id, // Inherits from global standard!
      config: {
        theme: {
          primaryColor: '#C89B3C',
          backgroundColor: '#1A1A1A',
          fontFamily: 'Outfit'
        },
        seo: {
          requiredTags: ['title', 'description', 'og:image']
        }
      }
    }
  });

  await prisma.cmsStandardVersion.create({
    data: {
      standardId: boutiqueStandard.id,
      version: 1,
      config: boutiqueStandard.config,
      status: 'PUBLISHED',
      description: 'Boutique layout overrides',
      createdBy: userId
    }
  });

  // 5. Create Blueprint Template referencing Boutique Standard
  const boutiqueBlueprint = await prisma.cmsBlueprintTemplate.create({
    data: {
      key: 'boutique-ecom-blueprint',
      name: 'Boutique E-Commerce Blueprint',
      status: 'PUBLISHED',
      standardId: boutiqueStandard.id,
      pages: {
        required: ['/', '/about', '/cart', '/checkout', '/orders']
      },
      components: {
        required: ['Navbar', 'Footer', 'BoutiqueHero', 'ProductCard']
      },
      apis: {
        required: ['GET /products', 'POST /orders']
      },
      databaseModels: {
        required: ['User', 'Boutique', 'Order']
      },
      features: {
        required: ['Cart', 'Checkout', 'CustomMeasurements']
      }
    }
  });

  await prisma.cmsBlueprintTemplateVersion.create({
    data: {
      blueprintTemplateId: boutiqueBlueprint.id,
      version: 1,
      pages: boutiqueBlueprint.pages,
      components: boutiqueBlueprint.components,
      apis: boutiqueBlueprint.apis,
      databaseModels: boutiqueBlueprint.databaseModels,
      features: boutiqueBlueprint.features,
      status: 'PUBLISHED',
      description: 'Boutique core expected blueprint',
      createdBy: userId
    }
  });

  // 6. Create Builder Profile referencing Boutique Standard (e.g. Lovable compiler)
  const lovableProfile = await prisma.cmsBuilderProfile.create({
    data: {
      key: 'lovable-profile',
      name: 'Lovable Builder Profile',
      status: 'PUBLISHED',
      standardId: boutiqueStandard.id,
      framework: 'Vite+React',
      promptTemplate: 'React framework, tailwindcss, lucide icons. Target standard: {{standardName}}',
      folderStructure: {
        requiredDirs: ['src/components', 'src/pages', 'src/services']
      },
      limitations: {
        maxPageCount: 20
      }
    }
  });

  await prisma.cmsBuilderProfileVersion.create({
    data: {
      builderProfileId: lovableProfile.id,
      version: 1,
      framework: lovableProfile.framework,
      promptTemplate: lovableProfile.promptTemplate,
      folderStructure: lovableProfile.folderStructure,
      limitations: lovableProfile.limitations,
      status: 'PUBLISHED',
      description: 'Lovable active compilation profile',
      createdBy: userId
    }
  });

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch(e => {
    console.error('Failed to seed standards:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

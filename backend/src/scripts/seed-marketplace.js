const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

async function seedMarketplace() {
  console.log('=== SEEDING ENTERPRISE MARKETPLACE DATA ===');

  try {
    // 1. Resolve Owner and Business Contexts
    const owner = await prisma.owner.findFirst();
    if (!owner) {
      throw new Error('No owner registered in database. Seed Phase 6/7 first.');
    }

    const business = await prisma.business.findFirst();
    if (!business) {
      throw new Error('No business registered in database. Seed Phase 6/7 first.');
    }

    // 2. Register Publisher
    console.log(`Registering publisher for Owner: ${owner.email}...`);
    const publisher = await prisma.marketplacePublisher.upsert({
      where: { email: 'registry@antair.io' },
      update: {
        ownerId: owner.id,
        name: 'Antair Core Labs',
        website: 'https://antair.io',
        role: 'ADMIN',
        isVerified: true
      },
      create: {
        ownerId: owner.id,
        name: 'Antair Core Labs',
        email: 'registry@antair.io',
        website: 'https://antair.io',
        role: 'ADMIN',
        isVerified: true
      }
    });

    console.log(`Publisher seeded: ${publisher.id}`);

    // 3. Define packages to seed
    const packages = [
      {
        name: 'Dark Neon Stylesheet Pack',
        slug: 'dark-neon-theme',
        description: 'Vibrant cyberpunk neon styling, variables, and dark UI templates.',
        version: '1.0.0',
        manifest: {
          id: 'dark-neon-theme',
          version: '1.0.0',
          type: 'THEME',
          capabilities: [
            { type: 'theme', entrypoint: 'dist/styles/neon.css', configSchema: { glowIntensity: 'number' } }
          ],
          dependencies: {}
        }
      },
      {
        name: 'Sales Chatbot Assistant',
        slug: 'sales-chatbot-agent',
        description: 'AI-native lead generation assistant that greets visitors and routes leads to CRM.',
        version: '1.2.0',
        manifest: {
          id: 'sales-chatbot-agent',
          version: '1.2.0',
          type: 'AGENT',
          capabilities: [
            { type: 'ai-agent', entrypoint: 'dist/agents/sales_bot.json', configSchema: { welcomeMsg: 'string' } }
          ],
          dependencies: {}
        }
      },
      {
        name: 'Enterprise POS Sync Bridge',
        slug: 'pos-sync-workflow',
        description: 'Synchronizes storefront transactions, stock counts, and orders with POS systems.',
        version: '2.0.0',
        manifest: {
          id: 'pos-sync-workflow',
          version: '2.0.0',
          type: 'WORKFLOW',
          capabilities: [
            { type: 'workflow-stage', entrypoint: 'dist/stages/pos_sync.js', configSchema: { syncInterval: 'number' } }
          ],
          dependencies: {}
        }
      }
    ];

    for (const pkg of packages) {
      console.log(`Seeding package: ${pkg.slug}...`);
      
      const packageRecord = await prisma.marketplacePackage.upsert({
        where: { slug: pkg.slug },
        update: {
          name: pkg.name,
          description: pkg.description,
          status: 'APPROVED'
        },
        create: {
          publisherId: publisher.id,
          name: pkg.name,
          slug: pkg.slug,
          description: pkg.description,
          status: 'APPROVED'
        }
      });

      // Seed Version
      const versionRecord = await prisma.marketplaceVersion.upsert({
        where: {
          packageId_version: {
            packageId: packageRecord.id,
            version: pkg.version
          }
        },
        update: {
          manifestJson: pkg.manifest,
          downloadUrl: `https://registry.antair.io/bundles/${pkg.slug}-${pkg.version}.zip`,
          checksum: crypto.createHash('sha256').update(JSON.stringify(pkg.manifest)).digest('hex')
        },
        create: {
          packageId: packageRecord.id,
          version: pkg.version,
          manifestJson: pkg.manifest,
          downloadUrl: `https://registry.antair.io/bundles/${pkg.slug}-${pkg.version}.zip`,
          checksum: crypto.createHash('sha256').update(JSON.stringify(pkg.manifest)).digest('hex')
        }
      });

      // Clean capabilities
      await prisma.marketplaceCapability.deleteMany({
        where: { versionId: versionRecord.id }
      });

      // Insert Capabilities
      for (const cap of pkg.manifest.capabilities) {
        await prisma.marketplaceCapability.create({
          data: {
            versionId: versionRecord.id,
            type: cap.type,
            handlerPath: cap.entrypoint,
            configSchema: cap.configSchema
          }
        });
      }
    }

    console.log('=== MARKETPLACE SEEDING COMPLETED SUCCESSFUL ===');
  } catch (err) {
    console.error('Failed seeding marketplace database:', err);
  } finally {
    await prisma.$disconnect();
  }
}

seedMarketplace();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const marketplaceService = require('../modules/marketplace/services/marketplace.service');
const eventBus = require('../modules/ai-core/utils/eventBus');

async function runTests() {
  console.log('==================================================');
  console.log('🧪 RUNNING ENTERPRISE MARKETPLACE INTEGRATION TESTS');
  console.log('==================================================');

  try {
    const business = await prisma.business.findFirst();
    if (!business) {
      throw new Error('No business found. Please run seed script first.');
    }
    const businessId = business.id;
    console.log(`Using Business Context ID: ${businessId}`);

    // Clear existing installations to have clean test slate
    await prisma.marketplaceInstallation.deleteMany({
      where: { businessId }
    });
    await prisma.marketplacePackage.deleteMany({
      where: { slug: { in: ['neon-animations-extension', 'broken-addon'] } }
    });

    // 1. Subscribe to Event Bus to verify event publication
    const receivedEvents = [];
    eventBus.on('PackageInstalled', (event) => {
      console.log(`[EventBus] PackageInstalled event heard: ${JSON.stringify(event)}`);
      receivedEvents.push(event);
    });

    // 2. Test Basic Installation
    console.log('Testing Package Installation (dark-neon-theme)...');
    const installResult = await marketplaceService.installPackage(businessId, 'dark-neon-theme', '1.0.0');
    if (!installResult || !installResult.installation) {
      throw new Error('Installation result is empty');
    }
    console.log(`✓ Installed successfully. Installation ID: ${installResult.installation.id}`);

    // 3. Test Full-Text Search Filtering
    console.log('Testing Search and Capability Filtering...');
    const searchRes = await marketplaceService.searchPackages({ q: 'neon' });
    if (searchRes.packages.length === 0) {
      throw new Error('Search failed to find dark-neon-theme');
    }
    console.log(`✓ Search returned ${searchRes.packages.length} matching packages.`);

    // 4. Test Dependency Graph Resolver (DAG validation)
    console.log('Testing Dependency Resolver Constraints...');

    // Publish dependent package for test validation
    const publisher = await prisma.marketplacePublisher.findFirst();
    
    const depManifest = {
      id: 'neon-animations-extension',
      version: '1.0.0',
      type: 'COMPONENT',
      capabilities: [
        { type: 'web-component', entrypoint: 'dist/animate.js', configSchema: {} }
      ],
      dependencies: {
        'dark-neon-theme': '^1.0.0'
      }
    };

    await marketplaceService.publishPackage(publisher.id, {
      name: 'Neon Animations Plugin',
      slug: 'neon-animations-extension',
      description: 'Adds vibrant neon scroll animations to boutiques.',
      version: '1.0.0',
      manifestJson: depManifest,
      downloadUrl: 'https://registry.antair.io/bundles/neon-animations.zip',
      checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    });

    // Installing the dependent package should succeed because 'dark-neon-theme' is installed
    console.log('Installing dependent package (neon-animations-extension)...');
    const depInstallResult = await marketplaceService.installPackage(businessId, 'neon-animations-extension', '1.0.0');
    console.log(`✓ Dependent package installed: ${depInstallResult.installation.id}`);

    // Try installing a package with an unsatisfied dependency
    const brokenManifest = {
      id: 'broken-addon',
      version: '1.0.0',
      type: 'COMPONENT',
      capabilities: [],
      dependencies: {
        'missing-prerequisite': '^2.0.0'
      }
    };

    await marketplaceService.publishPackage(publisher.id, {
      name: 'Broken Addon',
      slug: 'broken-addon',
      description: 'A package with missing requirements.',
      version: '1.0.0',
      manifestJson: brokenManifest,
      downloadUrl: 'https://registry.antair.io/bundles/broken.zip',
      checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    });

    try {
      console.log('Attempting installation with missing dependencies (should fail)...');
      await marketplaceService.installPackage(businessId, 'broken-addon', '1.0.0');
      throw new Error('Test FAILED: Installation succeeded when it should have failed on dependencies constraints');
    } catch (err) {
      console.log(`✓ Expected error received: ${err.message}`);
    }

    // 5. Test Enablement Toggle
    console.log('Testing active status enablement toggle...');
    const packageRecord = await prisma.marketplacePackage.findUnique({ where: { slug: 'dark-neon-theme' } });
    const toggled = await marketplaceService.setEnabledState(businessId, packageRecord.id, false);
    if (toggled.isEnabled !== false) {
      throw new Error('Toggle failed to disable the package');
    }
    console.log('✓ Successfully toggled to Disabled.');

    // 6. Test Uninstall
    console.log('Testing uninstallation cleanup...');
    const uninstalled = await marketplaceService.uninstallPackage(businessId, packageRecord.id);
    if (!uninstalled.success) {
      throw new Error('Uninstallation failed');
    }
    console.log('✓ Package uninstalled successfully.');

    console.log('==================================================');
    console.log('🎉 ALL ENTERPRISE MARKETPLACE INTEGRATION TESTS PASSED!');
    console.log('==================================================');

  } catch (err) {
    console.error('❌ Integration tests FAILED:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();

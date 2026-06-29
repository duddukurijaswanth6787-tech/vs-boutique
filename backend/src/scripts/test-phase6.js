// Phase 6: AI Website Operating System - Integration Test Runner
// Tests database compilations, sitemap components layouts, copy content binds, releases rollbacks.

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const generatorService = require('../modules/website-generator/services/generator.service');
const logger = require('../modules/ai-core/utils/logger');

async function runTests() {
  console.log('🚀 STARTING PHASE 6 ENTERPRISE COMPILER INTEGRATION TESTS...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Prepare clean test boutique & category records
    console.log('--- 1. Database Entity Setup ---');
    let boutique = await prisma.boutique.findFirst();
    if (!boutique) {
      boutique = await prisma.boutique.create({
        data: {
          name: 'Antair Test Couture',
          ownerName: 'Admin Owner',
          email: 'test@antair.com',
          mobileNumber: '+919999999999',
          fullAddress: 'Antair HQ, Bangalore',
          city: 'Bangalore',
          state: 'Karnataka'
        }
      });
    }
    assert(!!boutique.id, 'Successfully resolved active Boutique record.');

    let category = await prisma.category.findFirst();
    if (!category) {
      category = await prisma.category.create({
        data: {
          name: 'Premium Apparel',
          slug: 'premium-apparel'
        }
      });
    }
    assert(!!category.id, 'Successfully resolved active Category record.');

    // 2. Launch E2E Compilation Pipeline (15 stages)
    console.log('\n--- 2. 15-Stage AI Compilation Pipeline ---');
    const sessionId = `test-session-${Date.now()}`;
    
    // Set up local logging stream listener to verify SSE log outputs
    const logs = [];
    const logChannel = `log:${boutique.id}`;
    const onLog = (data) => {
      logs.push(data);
      console.log(`    [SSE Log] Stage: ${data.stage} | ${data.message} (${data.progress}%)`);
    };
    generatorService.logEmitter.on(logChannel, onLog);

    const run = await generatorService.compileStorefront(sessionId, boutique.id);
    assert(run.status === 'COMPILING_THEME', `Compilation successfully launched asynchronously: ${run.status}`);

    // Wait for the pipeline to finish processing
    console.log('    Waiting for pipeline completion...');
    await new Promise(resolve => setTimeout(resolve, 7500));

    assert(logs.length >= 15, `SSE logs broadcasted at least 15 stage compilations: ${logs.length}`);
    const completedLog = logs.find(l => l.stage === 'complete');
    assert(!!completedLog, 'SSE log emitter successfully broadcasted completion event.');

    // 3. Verify Database Records Creation
    console.log('\n--- 3. Database Records Audit ---');
    const business = await prisma.business.findFirst({
      where: { boutique: { id: boutique.id } }
    });
    assert(!!business, 'Business model created and linked successfully.');

    const theme = await prisma.boutiqueTheme.findUnique({
      where: { businessId: business.id }
    });
    assert(!!theme, 'BoutiqueTheme generated containing colors, spacing, and animations config.');
    assert(theme.colorsLight.primary === '#4f46e5', 'Light theme color palette is verified.');

    const pages = await prisma.boutiquePage.findMany({
      where: { website: { businessId: business.id } }
    });
    assert(pages.length === 4, `Successfully mapped 4 dynamic storefront sitemap pages: ${pages.map(p => p.slug).join(', ')}`);

    const homePage = pages.find(p => p.slug === 'home');
    const nodes = await prisma.pageComponentNode.findMany({
      where: { pageId: homePage.id }
    });
    assert(nodes.length === 2, `Successfully injected 2 component tree layout blocks in Home: ${nodes.map(n => n.name).join(', ')}`);
    assert(nodes[0].type === 'Hero', 'Injected node resolves component registry tag Hero.');

    const contentItem = await prisma.universalContent.findUnique({
      where: { businessId_key: { businessId: business.id, key: 'home-hero-headline' } }
    });
    assert(contentItem.baseText.includes('Elegance Redefined'), 'Injected copywriting text matches vertical blueprint requirements.');

    const releases = await prisma.immutableRelease.findMany({
      where: { businessId: business.id }
    });
    assert(releases.length > 0, `Storefront deployment created immutable release: ${releases[0].releaseTag}`);

    // 4. Dynamic Storefront Layout Resolution
    console.log('\n--- 4. Storefront Layout Preview ---');
    const storefront = await generatorService.previewStorefront(boutique.id);
    assert(!!storefront.theme, 'Theme configuration resolved successfully.');
    assert(storefront.pages.length === 4, 'Dynamic pages list returned successfully.');
    const resolvedHero = storefront.pages.find(p => p.slug === 'home').components[0];
    assert(resolvedHero.contentPayload['home-hero-headline'] === contentItem.baseText, 'Content payloads correctly bind to component nodes.');

    // 5. Rollback & Regenerate Operations
    console.log('\n--- 5. Rollbacks and Segment Regenerations ---');
    const regen = await generatorService.regenerateSegment(boutique.id, 'theme');
    assert(regen.success, 'Granular theme regeneration request processed successfully.');

    const updatedTheme = await prisma.boutiqueTheme.findUnique({
      where: { businessId: business.id }
    });
    assert(updatedTheme.colorsLight.primary === '#dc2626', `Theme colors updated to regenerated value: ${updatedTheme.colorsLight.primary}`);

    const rollback = await generatorService.rollbackRelease(boutique.id, run.releaseTag);
    assert(rollback.success, 'Rollback action processed successfully.');

    const rolledBackTheme = await prisma.boutiqueTheme.findUnique({
      where: { businessId: business.id }
    });
    assert(rolledBackTheme.colorsLight.primary === '#4f46e5', `Theme colors rolled back to original release: ${rolledBackTheme.colorsLight.primary}`);

    // Cleanup local event listener
    generatorService.logEmitter.off(logChannel, onLog);

    console.log(`\n=========================================`);
    console.log(`Phase 6 Core Integration Tests Finished.`);
    console.log(`Passed: ${passed} | Failed: ${failed}`);
    console.log(`=========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ E2E Integration test run crashed:', err);
    process.exit(1);
  }
}

runTests();

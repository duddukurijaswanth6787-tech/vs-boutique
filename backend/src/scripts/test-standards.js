const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const standardsService = require('../modules/cms-standards/services/standards.service');

async function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✓ ${message}`);
}

async function main() {
  console.log('🧪 RUNNING CMS STANDARDS ENGINE INTEGRATION TESTS...');

  const operator = await prisma.user.findFirst();
  if (!operator) throw new Error('No seed user found to run tests');
  const userId = operator.id;

  // 1. Test Standards Listing
  const list = await standardsService.listStandards();
  await assert(list.length >= 2, 'Should list at least two standard rules');

  // 2. Test Deep-Merge Inheritance Config Resolution
  console.log('Testing recursive deep-merge configurations...');
  const resolved = await standardsService.resolveInheritedConfig('boutique-standard');

  await assert(resolved.security !== undefined, 'Inherited security config should be resolved');
  await assert(resolved.security.requireHttps === true, 'Inherited requireHttps should be true');
  await assert(resolved.theme.primaryColor === '#C89B3C', 'Overridden primary color should match');

  // 3. Test Rule Version Updates & Audit Log Ingestion
  console.log('Updating boutique standard...');
  const boutique = await standardsService.getStandard('boutique-standard');
  const oldVersionNum = boutique.version;

  const updatedConfig = Object.assign({}, boutique.config, {
    theme: {
      primaryColor: '#FF5733', // Update color
      backgroundColor: '#000000'
    }
  });

  const updated = await standardsService.updateStandard(
    boutique.id,
    { config: updatedConfig },
    'Update boutique color palette for winter theme',
    userId
  );

  await assert(updated.version === oldVersionNum + 1, 'Version counter should increment');

  const logs = await standardsService.listAuditLogs();
  await assert(
    logs.some(l => l.action === 'UPDATE' && l.standardId === boutique.id),
    'Audit log record should be created for standard update'
  );

  // 4. Test Version Rollback
  console.log('Testing rollback to version 1 configuration...');
  const rolled = await standardsService.rollbackStandard(boutique.id, 1, userId);
  await assert(rolled.config.theme.primaryColor === '#C89B3C', 'Rolled back primary color should match version 1');

  // 5. Test Blueprints CRUD
  console.log('Testing Blueprint template retrieval...');
  const bpList = await standardsService.listBlueprints();
  await assert(bpList.length > 0, 'Blueprint templates list should not be empty');

  const bp = await standardsService.getBlueprint('boutique-ecom-blueprint');
  const hasCart = bp.pages.required 
    ? bp.pages.required.includes('/cart')
    : bp.pages['/cart'] !== undefined;
  await assert(hasCart, 'Blueprint pages checklist should resolve');

  console.log('==================================================');
  console.log('🎉 ALL CMS STANDARDS ENGINE INTEGRATION TESTS PASSED!');
  console.log('==================================================');
}

main()
  .catch(err => {
    console.error('Test run failed:', err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

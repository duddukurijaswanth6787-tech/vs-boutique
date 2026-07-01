const prisma = require('../src/utils/prisma');
const templatesService = require('../src/modules/cms-templates/services/templates.service');

let testUser, testCategory, testTag, testBusiness;
let cleanup = [];

async function createTestData() {
  testUser = await prisma.user.create({
    data: { phone: `+9199990001${Date.now() % 100000}`, name: 'CMS Template Tester' }
  });
  cleanup.push(() => prisma.user.deleteMany({ where: { id: testUser.id } }));

  testCategory = await prisma.cmsTemplateCategory.upsert({
    where: { key: 'test-template-cat' },
    create: { key: 'test-template-cat', name: 'Test Template Category', displayOrder: 99 },
    update: {}
  });
  cleanup.push(() => prisma.cmsTemplateCategory.deleteMany({ where: { key: 'test-template-cat' } }));

  const existingTag = await prisma.cmsTemplateTag.findUnique({ where: { key: 'test-tmpl-tag' } });
  if (!existingTag) {
    testTag = await prisma.cmsTemplateTag.create({ data: { key: 'test-tmpl-tag', name: 'Test Template Tag' } });
  } else {
    testTag = existingTag;
  }
  cleanup.push(() => prisma.cmsTemplateTag.deleteMany({ where: { key: 'test-tmpl-tag' } }));

  testBusiness = await prisma.business.create({
    data: {
      tenant: { create: { name: 'Test Tenant', domain: `test-${Date.now()}.example.com` } },
      name: 'Test Business',
      nicheVertical: 'ecommerce'
    }
  });
  cleanup.push(() => prisma.business.deleteMany({ where: { id: testBusiness.id } }));
  cleanup.push(() => prisma.tenant.deleteMany({ where: { id: testBusiness.tenantId } }));
}

async function destroyTestData() {
  for (const fn of cleanup.reverse()) {
    try { await fn(); } catch (e) { }
  }
  cleanup = [];
}

async function test(name, fn) {
  try {
    await fn();
    results.push({ name, status: 'PASS' });
    console.log(`  \u2713 ${name}`);
  } catch (err) {
    results.push({ name, status: 'FAIL', error: err.message });
    console.log(`  \u2717 ${name} - ${err.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(`ASSERT FAIL: ${message}`);
}

const results = [];

function addCleanupForTemplate(templateId) {
  cleanup.push(() => prisma.cmsTemplateBuilderCompatibility.deleteMany({ where: { templateId } }));
  cleanup.push(() => prisma.cmsTemplateTagTemplate.deleteMany({ where: { templateId } }));
  cleanup.push(() => prisma.cmsTemplateAnalytics.deleteMany({ where: { templateId } }));
  cleanup.push(() => prisma.cmsTemplateFavorite.deleteMany({ where: { templateId } }));
  cleanup.push(() => prisma.cmsTemplateRating.deleteMany({ where: { templateId } }));
  cleanup.push(() => prisma.cmsTemplatePipelineStage.deleteMany({ where: { templateId } }));
  cleanup.push(() => prisma.cmsTemplateVersion.deleteMany({ where: { templateId } }));
  cleanup.push(() => prisma.businessTemplateAssignment.deleteMany({ where: { templateId } }));
  cleanup.push(() => prisma.cmsTemplate.deleteMany({ where: { id: templateId } }));
}

// ============================================================
// TEST GROUPS
// ============================================================

// --- CRUD ---
async function testCreateTemplate() {
  const template = await templatesService.createTemplate({
    name: 'Test Template',
    description: 'A template for testing',
    industry: 'ecommerce',
    tier: 'FREE',
    categoryId: testCategory.id,
    manifest: { pages: ['Home'], components: ['Navbar'] },
    tags: ['test-tmpl-tag'],
    builderCompat: ['claude-code', 'opencode']
  }, testUser.id);

  assert(template, 'Template should be created');
  assert(template.name === 'Test Template', `Expected name "Test Template", got "${template.name}"`);
  assert(template.version === 1, `Expected version 1, got ${template.version}`);
  assert(template.tags?.length > 0, 'Template should have tags');
  assert(template.builderCompat?.length === 2, 'Template should have 2 builder compat entries');
  addCleanupForTemplate(template.id);
}

async function testListTemplates() {
  const template = await templatesService.createTemplate({
    name: 'List Test Template',
    description: 'For listing test',
    industry: 'ecommerce',
    categoryId: testCategory.id,
    tags: ['test-tmpl-tag']
  }, testUser.id);
  addCleanupForTemplate(template.id);

  const result = await templatesService.listTemplates({ page: 1, limit: 10 });
  assert(result.templates.length > 0, 'Should list templates');
  assert(result.total > 0, 'Total should be > 0');
  assert(result.page === 1, 'Page should be 1');
}

async function testGetTemplate() {
  const template = await templatesService.createTemplate({
    name: 'Get Test Template',
    description: 'For get test',
    industry: 'ecommerce',
    categoryId: testCategory.id
  }, testUser.id);
  addCleanupForTemplate(template.id);

  const fetched = await templatesService.getTemplate(template.id);
  assert(fetched, 'Template should be fetched');
  assert(fetched.id === template.id, `Expected id ${template.id}, got ${fetched.id}`);
  assert(fetched.name === 'Get Test Template', `Expected name "Get Test Template", got "${fetched.name}"`);
}

async function testUpdateTemplate() {
  const template = await templatesService.createTemplate({
    name: 'Update Test Template',
    description: 'Before update',
    industry: 'ecommerce'
  }, testUser.id);
  addCleanupForTemplate(template.id);

  const updated = await templatesService.updateTemplate(template.id, {
    name: 'Updated Name',
    description: 'After update',
    changeNotes: 'Updated for testing'
  }, testUser.id);

  assert(updated, 'Template should be updated');
  assert(updated.name === 'Updated Name', `Expected "Updated Name", got "${updated.name}"`);
  assert(updated.version === 2, `Expected version 2, got ${updated.version}`);
}

async function testDeleteTemplate() {
  const template = await templatesService.createTemplate({
    name: 'Delete Test Template',
    industry: 'ecommerce'
  }, testUser.id);
  addCleanupForTemplate(template.id);

  const deleted = await templatesService.deleteTemplate(template.id, testUser.id);
  assert(deleted, 'Template should be soft-deleted');
  assert(deleted.isDeleted === true, 'isDeleted should be true');

  const list = await templatesService.listTemplates({ isDeleted: true });
  const found = list.templates.find(t => t.id === template.id);
  assert(found, 'Deleted template should appear with isDeleted=true filter');
}

// --- Lifecycle ---
async function testPublishTemplate() {
  const template = await templatesService.createTemplate({
    name: 'Publish Test',
    industry: 'ecommerce'
  }, testUser.id);
  addCleanupForTemplate(template.id);

  const published = await templatesService.publishTemplate(template.id, testUser.id);
  assert(published, 'Template should be published');
  assert(published.status === 'PUBLISHED', `Expected PUBLISHED, got ${published.status}`);
}

async function testArchiveTemplate() {
  const template = await templatesService.createTemplate({
    name: 'Archive Test',
    industry: 'ecommerce',
    status: 'PUBLISHED'
  }, testUser.id);
  addCleanupForTemplate(template.id);

  const archived = await templatesService.archiveTemplate(template.id, testUser.id);
  assert(archived, 'Template should be archived');
  assert(archived.status === 'ARCHIVED', `Expected ARCHIVED, got ${archived.status}`);
}

async function testDeprecateTemplate() {
  const template = await templatesService.createTemplate({
    name: 'Deprecate Test',
    industry: 'ecommerce'
  }, testUser.id);
  addCleanupForTemplate(template.id);

  const deprecated = await templatesService.deprecateTemplate(template.id, testUser.id);
  assert(deprecated, 'Template should be deprecated');
  assert(deprecated.status === 'ARCHIVED', `Expected ARCHIVED, got ${deprecated.status}`);
  assert(deprecated.isActive === false, 'isActive should be false');
}

// --- Versions ---
async function testCreateVersion() {
  const template = await templatesService.createTemplate({
    name: 'Version Create Test',
    description: 'Original',
    industry: 'ecommerce',
    manifest: { pages: ['Home'] }
  }, testUser.id);
  addCleanupForTemplate(template.id);

  const version = await templatesService.createVersion(template.id, {
    name: 'Version 2 Name',
    changeNotes: 'Second version'
  }, testUser.id);
  assert(version, 'Version should be created');
  assert(version.version === 2, `Expected version 2, got ${version.version}`);
}

async function testGetVersions() {
  const template = await templatesService.createTemplate({
    name: 'Versions List Test',
    industry: 'ecommerce'
  }, testUser.id);
  addCleanupForTemplate(template.id);

  await templatesService.updateTemplate(template.id, {
    name: 'Updated for versions',
    changeNotes: 'Second version'
  }, testUser.id);

  const versions = await templatesService.getVersions(template.id);
  assert(versions.length >= 2, `Expected >= 2 versions, got ${versions.length}`);
  const v1 = versions.find(v => v.version === 1);
  const v2 = versions.find(v => v.version === 2);
  assert(v1, 'Should have version 1');
  assert(v2, 'Should have version 2');
}

async function testRollbackVersion() {
  const template = await templatesService.createTemplate({
    name: 'Rollback Test',
    description: 'Original description',
    industry: 'ecommerce',
    thumbnail: '/original/thumb.jpg'
  }, testUser.id);
  addCleanupForTemplate(template.id);

  await templatesService.updateTemplate(template.id, {
    name: 'Rollback Test',
    description: 'Updated description',
    thumbnail: '/updated/thumb.jpg',
    changeNotes: 'Before rollback'
  }, testUser.id);

  const rollback = await templatesService.rollbackVersion(template.id, 1, testUser.id);
  assert(rollback, 'Rollback should succeed');
  assert(rollback.description === 'Original description', 'Should restore original description');
}

// --- Favorites ---
async function testFavoriteToggle() {
  const template = await templatesService.createTemplate({
    name: 'Favorite Toggle Test',
    industry: 'ecommerce'
  }, testUser.id);
  addCleanupForTemplate(template.id);

  const fav1 = await templatesService.toggleFavorite(template.id, testUser.id);
  assert(fav1.favorited === true, 'First toggle should favorite');

  const fav2 = await templatesService.toggleFavorite(template.id, testUser.id);
  assert(fav2.favorited === false, 'Second toggle should unfavorite');
}

async function testListFavorites() {
  const template = await templatesService.createTemplate({
    name: 'Favorites List Test',
    industry: 'ecommerce'
  }, testUser.id);
  addCleanupForTemplate(template.id);

  await templatesService.toggleFavorite(template.id, testUser.id);
  const result = await templatesService.listFavorites(testUser.id);
  assert(result.favorites.length > 0, 'Should have favorites');
  const found = result.favorites.find(f => f.id === template.id);
  assert(found, 'Should find favorited template');
  assert(found.favoritedAt, 'Should include favoritedAt timestamp');
}

// --- Ratings ---
async function testRateTemplate() {
  const template = await templatesService.createTemplate({
    name: 'Rating Test',
    industry: 'ecommerce'
  }, testUser.id);
  addCleanupForTemplate(template.id);

  const rating = await templatesService.rateTemplate(template.id, testUser.id, 5, 'Excellent!');
  assert(rating, 'Rating should be created');
  assert(rating.rating === 5, `Expected rating 5, got ${rating.rating}`);
  assert(rating.comment === 'Excellent!', `Expected "Excellent!", got "${rating.comment}"`);

  const updated = await templatesService.rateTemplate(template.id, testUser.id, 4, 'Good');
  assert(updated.rating === 4, 'Rating should be updated to 4');
}

// --- Tags & Categories ---
async function testListCategories() {
  const categories = await templatesService.listCategories();
  assert(categories.length > 0, 'Should list categories');
  const found = categories.find(c => c.id === testCategory.id || c.key === 'test-template-cat');
  assert(found, 'Should find test category');
}

async function testCreateCategory() {
  const cat = await templatesService.createCategory({
    key: 'temp-test-tmpl-cat',
    name: 'Temp Test Template Category',
    displayOrder: 100
  });
  assert(cat, 'Category should be created');
  assert(cat.key === 'temp-test-tmpl-cat', `Expected key "temp-test-tmpl-cat", got "${cat.key}"`);
  cleanup.push(() => prisma.cmsTemplateCategory.deleteMany({ where: { key: 'temp-test-tmpl-cat' } }));
}

async function testListTags() {
  const tags = await templatesService.listTags();
  assert(tags.length > 0, 'Should list tags');
}

async function testCreateTag() {
  const tag = await templatesService.createTag({
    key: 'temp-test-tmpl-tag',
    name: 'Temp Test Template Tag'
  });
  assert(tag, 'Tag should be created');
  assert(tag.key === 'temp-test-tmpl-tag', `Expected key "temp-test-tmpl-tag", got "${tag.key}"`);
  cleanup.push(() => prisma.cmsTemplateTag.deleteMany({ where: { key: 'temp-test-tmpl-tag' } }));
}

// --- Pipeline ---
async function testAdvancePipeline() {
  const template = await templatesService.createTemplate({
    name: 'Pipeline Test',
    industry: 'ecommerce',
    status: 'DRAFT'
  }, testUser.id);
  addCleanupForTemplate(template.id);

  const stage = await templatesService.advancePipeline(template.id, 'PROMPT', {
    status: 'COMPLETED',
    agent: 'test-agent'
  }, testUser.id);
  assert(stage, 'Pipeline stage should be created');
  assert(stage.stage === 'PROMPT', `Expected stage PROMPT, got ${stage.stage}`);
  assert(stage.agent === 'test-agent', 'Agent should be test-agent');

  const fetched = await templatesService.getTemplate(template.id);
  assert(fetched.status === 'VERIFYING', 'Template status should advance to VERIFYING');
}

async function testGetPipelineStatus() {
  const template = await templatesService.createTemplate({
    name: 'Pipeline Status Test',
    industry: 'ecommerce'
  }, testUser.id);
  addCleanupForTemplate(template.id);

  await templatesService.advancePipeline(template.id, 'PROMPT', {}, testUser.id);

  const stages = await templatesService.getPipelineStatus(template.id);
  assert(stages.length > 0, 'Should have pipeline stages');
  assert(stages[0].templateId === template.id, 'Stage should reference the template');
}

// --- Featured / Latest / Popular / Tier ---
async function testGetFeatured() {
  const template = await templatesService.createTemplate({
    name: 'Featured Test',
    industry: 'ecommerce',
    status: 'PUBLISHED',
    isFeatured: true
  }, testUser.id);
  addCleanupForTemplate(template.id);

  const featured = await templatesService.getFeatured({ limit: 10 });
  const found = featured.find(t => t.id === template.id);
  assert(found, 'Featured list should contain the featured template');
}

async function testGetLatest() {
  const template = await templatesService.createTemplate({
    name: 'Latest Test',
    industry: 'ecommerce',
    status: 'PUBLISHED'
  }, testUser.id);
  addCleanupForTemplate(template.id);

  const latest = await templatesService.getLatest({ limit: 10 });
  const found = latest.find(t => t.id === template.id);
  assert(found, 'Latest list should contain the template');
}

async function testGetPopular() {
  const template = await templatesService.createTemplate({
    name: 'Popular Test',
    industry: 'ecommerce',
    status: 'PUBLISHED'
  }, testUser.id);
  addCleanupForTemplate(template.id);

  const popular = await templatesService.getPopular({ limit: 10 });
  assert(popular.length > 0, 'Should return popular templates');
}

async function testGetByTier() {
  const template = await templatesService.createTemplate({
    name: 'Tier Test',
    industry: 'ecommerce',
    tier: 'PROFESSIONAL',
    status: 'PUBLISHED'
  }, testUser.id);
  addCleanupForTemplate(template.id);

  const result = await templatesService.getByTier('PROFESSIONAL');
  assert(result.templates.length > 0, 'Should list templates by tier');
  const found = result.templates.find(t => t.id === template.id);
  assert(found, 'Should find tier-filtered template');
}

// --- Business Assignments ---
async function testAssignToBusiness() {
  const template = await templatesService.createTemplate({
    name: 'Assign Test',
    industry: 'ecommerce',
    status: 'PUBLISHED'
  }, testUser.id);
  addCleanupForTemplate(template.id);

  const assignment = await templatesService.assignToBusiness(template.id, testBusiness.id, { status: 'ASSIGNED' }, testUser.id);
  assert(assignment, 'Assignment should be created');
  assert(assignment.templateId === template.id, 'Should reference the template');
  assert(assignment.businessId === testBusiness.id, 'Should reference the business');
  cleanup.push(() => prisma.businessTemplateAssignment.deleteMany({ where: { id: assignment.id } }));
}

async function testUnassignFromBusiness() {
  const template = await templatesService.createTemplate({
    name: 'Unassign Test',
    industry: 'ecommerce',
    status: 'PUBLISHED'
  }, testUser.id);
  addCleanupForTemplate(template.id);

  await templatesService.assignToBusiness(template.id, testBusiness.id, {}, testUser.id);

  const result = await templatesService.unassignFromBusiness(template.id, testBusiness.id, testUser.id);
  assert(result.count > 0, 'Should unassign from business');
}

async function testGetBusinessAssignments() {
  const template = await templatesService.createTemplate({
    name: 'Business Assignments Test',
    industry: 'ecommerce',
    status: 'PUBLISHED'
  }, testUser.id);
  addCleanupForTemplate(template.id);

  await templatesService.assignToBusiness(template.id, testBusiness.id, {}, testUser.id);

  const assignments = await templatesService.getBusinessAssignments(testBusiness.id);
  assert(assignments.length > 0, 'Should have assignments');
  const found = assignments.find(a => a.templateId === template.id);
  assert(found, 'Should find the assignment');
  for (const a of assignments) {
    cleanup.push(() => prisma.businessTemplateAssignment.deleteMany({ where: { id: a.id } }));
  }
}

// --- Export ---
async function testExportJson() {
  const template = await templatesService.createTemplate({
    name: 'Export JSON Test',
    description: 'Testing JSON export',
    industry: 'ecommerce',
    manifest: { pages: ['Home'], components: ['Navbar'] },
    tags: ['test-tmpl-tag'],
    builderCompat: ['claude-code']
  }, testUser.id);
  addCleanupForTemplate(template.id);

  const exported = await templatesService.exportTemplate(template.id, 'json');
  assert(exported, 'Should export template');
  assert(exported.name === 'Export JSON Test', 'Name should match');
  assert(exported.description === 'Testing JSON export', 'Description should match');
  assert(Array.isArray(exported.tags), 'Tags should be an array');
  assert(Array.isArray(exported.builderCompat), 'builderCompat should be an array');
}

// --- Error Cases ---
async function testGetNonexistentTemplate() {
  const result = await templatesService.getTemplate('00000000-0000-0000-0000-000000000000');
  assert(result === null, 'Getting nonexistent template should return null');
}

async function testUpdateNonexistentTemplate() {
  const result = await templatesService.updateTemplate('00000000-0000-0000-0000-000000000000',
    { name: 'Nope' }, testUser.id);
  assert(result === null, 'Updating nonexistent template should return null');
}

async function testDeleteNonexistentTemplate() {
  const result = await templatesService.deleteTemplate('00000000-0000-0000-0000-000000000000', testUser.id);
  assert(result === null, 'Deleting nonexistent template should return null');
}

async function testPublishNonexistentTemplate() {
  const result = await templatesService.publishTemplate('00000000-0000-0000-0000-000000000000', testUser.id);
  assert(result === null, 'Publishing nonexistent template should return null');
}

async function testArchiveNonexistentTemplate() {
  const result = await templatesService.archiveTemplate('00000000-0000-0000-0000-000000000000', testUser.id);
  assert(result === null, 'Archiving nonexistent template should return null');
}

// ============================================================
// RUN ALL TESTS
// ============================================================

async function run() {
  const testGroups = [
    { name: 'CRUD Operations', tests: [testCreateTemplate, testListTemplates, testGetTemplate, testUpdateTemplate, testDeleteTemplate] },
    { name: 'Lifecycle', tests: [testPublishTemplate, testArchiveTemplate, testDeprecateTemplate] },
    { name: 'Versions', tests: [testCreateVersion, testGetVersions, testRollbackVersion] },
    { name: 'Favorites', tests: [testFavoriteToggle, testListFavorites] },
    { name: 'Ratings', tests: [testRateTemplate] },
    { name: 'Tags & Categories', tests: [testListCategories, testCreateCategory, testListTags, testCreateTag] },
    { name: 'Pipeline', tests: [testAdvancePipeline, testGetPipelineStatus] },
    { name: 'Featured / Latest / Popular / Tier', tests: [testGetFeatured, testGetLatest, testGetPopular, testGetByTier] },
    { name: 'Business Assignments', tests: [testAssignToBusiness, testUnassignFromBusiness, testGetBusinessAssignments] },
    { name: 'Export', tests: [testExportJson] },
    { name: 'Error Cases', tests: [testGetNonexistentTemplate, testUpdateNonexistentTemplate, testDeleteNonexistentTemplate, testPublishNonexistentTemplate, testArchiveNonexistentTemplate] }
  ];

  console.log('='.repeat(70));
  console.log('CMS TEMPLATES — COMPREHENSIVE TEST SUITE');
  console.log('='.repeat(70));

  let passed = 0;
  let failed = 0;

  try {
    await createTestData();

    for (const group of testGroups) {
      console.log(`\n--- ${group.name} ---`);
      for (const testFn of group.tests) {
        await test(testFn.name.replace(/^test/, ''), testFn);
      }
    }
  } catch (err) {
    console.error(`\nSETUP FAILED: ${err.message}`);
    failed = results.length;
  } finally {
    await destroyTestData();
  }

  passed = results.filter(r => r.status === 'PASS').length;
  failed = results.filter(r => r.status === 'FAIL').length;

  console.log('\n' + '='.repeat(70));
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('='.repeat(70));

  if (failed > 0) {
    console.log('\nFAILED TESTS:');
    for (const r of results.filter(r => r.status === 'FAIL')) {
      console.log(`  - ${r.name}: ${r.error}`);
    }
    console.log('\nVERDICT: FAIL');
    process.exit(1);
  } else {
    console.log('VERDICT: PASS — all tests passed');
  }
}

run().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});

const prisma = require('../src/utils/prisma');
const promptsService = require('../src/modules/cms-prompts/services/prompts.service');

let testUser, testCategory, testBuilder, testTag;
let cleanup = [];

async function createTestData() {
  testUser = await prisma.user.create({
    data: { phone: `+9199990001${Date.now() % 100000}`, name: 'CMS Prompt Tester' }
  });
  cleanup.push(() => prisma.user.deleteMany({ where: { id: testUser.id } }));

  testCategory = await prisma.cmsPromptCategory.upsert({
    where: { key: 'testing' },
    create: { key: 'testing', name: 'Testing', description: 'Test category', displayOrder: 99 },
    update: {}
  });
  cleanup.push(() => prisma.cmsPromptCategory.deleteMany({ where: { key: 'testing' } }));

  testBuilder = await prisma.cmsAiBuilder.upsert({
    where: { key: 'test-builder' },
    create: { key: 'test-builder', name: 'Test Builder', provider: 'Test', model: 'test-model', promptFormat: 'markdown', temperature: 0.7, maxTokens: 4096, status: 'ACTIVE', displayOrder: 99 },
    update: {}
  });
  cleanup.push(() => prisma.cmsAiBuilder.deleteMany({ where: { key: 'test-builder' } }));

  const existingTag = await prisma.cmsPromptTag.findUnique({ where: { key: 'test-tag' } });
  if (!existingTag) {
    testTag = await prisma.cmsPromptTag.create({ data: { key: 'test-tag', name: 'Test Tag' } });
  } else {
    testTag = existingTag;
  }
  cleanup.push(() => prisma.cmsPromptTag.deleteMany({ where: { key: 'test-tag' } }));
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

// ============================================================
// TEST GROUPS
// ============================================================

// --- CRUD ---
async function testCreatePrompt() {
  const prompt = await promptsService.createPrompt({
    title: 'Test Prompt',
    description: 'A prompt for testing',
    promptType: 'website-generation',
    categoryId: testCategory.id,
    builderId: testBuilder.id,
    instructions: 'Create a test website',
    rules: 'Follow best practices',
    outputFormat: 'Full code',
    framework: 'React',
    templateContent: 'Build a {{businessName}} website',
    variables: { businessName: 'TestCo' },
    tags: ['test-tag']
  }, testUser.id);

  assert(prompt, 'Prompt should be created');
  assert(prompt.title === 'Test Prompt', `Expected title "Test Prompt", got "${prompt.title}"`);
  assert(prompt.version === 1, `Expected version 1, got ${prompt.version}`);
  assert(prompt.tags?.length > 0, 'Prompt should have tags');
  cleanup.push(() => prisma.cmsPrompt.deleteMany({ where: { id: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptVersion.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptHistory.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptAuditLog.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptUsageAnalytics.deleteMany({ where: { promptId: prompt.id } }));
}

async function testListPrompts() {
  const prompt = await promptsService.createPrompt({
    title: 'List Test Prompt',
    description: 'For listing test',
    promptType: 'website-generation',
    categoryId: testCategory.id,
    tags: ['test-tag']
  }, testUser.id);
  cleanup.push(() => prisma.cmsPrompt.deleteMany({ where: { id: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptVersion.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptHistory.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptAuditLog.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptUsageAnalytics.deleteMany({ where: { promptId: prompt.id } }));

  const result = await promptsService.listPrompts({ page: 1, limit: 10 });
  assert(result.prompts.length > 0, 'Should list prompts');
  assert(result.total > 0, 'Total should be > 0');
  assert(result.page === 1, 'Page should be 1');
}

async function testGetPrompt() {
  const prompt = await promptsService.createPrompt({
    title: 'Get Test Prompt',
    description: 'For get test',
    promptType: 'website-generation',
    categoryId: testCategory.id
  }, testUser.id);
  cleanup.push(() => prisma.cmsPrompt.deleteMany({ where: { id: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptVersion.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptHistory.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptAuditLog.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptUsageAnalytics.deleteMany({ where: { promptId: prompt.id } }));

  const fetched = await promptsService.getPrompt(prompt.id);
  assert(fetched, 'Prompt should be fetched');
  assert(fetched.id === prompt.id, `Expected id ${prompt.id}, got ${fetched.id}`);
  assert(fetched.title === 'Get Test Prompt', `Expected title "Get Test Prompt", got "${fetched.title}"`);
}

async function testUpdatePrompt() {
  const prompt = await promptsService.createPrompt({
    title: 'Update Test Prompt',
    description: 'Before update',
    promptType: 'website-generation'
  }, testUser.id);
  cleanup.push(() => prisma.cmsPrompt.deleteMany({ where: { id: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptVersion.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptHistory.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptAuditLog.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptUsageAnalytics.deleteMany({ where: { promptId: prompt.id } }));

  const updated = await promptsService.updatePrompt(prompt.id, {
    title: 'Updated Title',
    description: 'After update',
    changeNotes: 'Updated for testing'
  }, testUser.id);

  assert(updated, 'Prompt should be updated');
  assert(updated.title === 'Updated Title', `Expected "Updated Title", got "${updated.title}"`);
  assert(updated.version === 2, `Expected version 2, got ${updated.version}`);
}

async function testDeletePrompt() {
  const prompt = await promptsService.createPrompt({
    title: 'Delete Test Prompt',
    promptType: 'website-generation'
  }, testUser.id);
  cleanup.push(() => prisma.cmsPrompt.deleteMany({ where: { id: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptVersion.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptHistory.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptAuditLog.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptUsageAnalytics.deleteMany({ where: { promptId: prompt.id } }));

  const deleted = await promptsService.deletePrompt(prompt.id, testUser.id);
  assert(deleted, 'Prompt should be soft-deleted');
  assert(deleted.isDeleted === true, 'isDeleted should be true');

  const list = await promptsService.listPrompts({ isDeleted: true });
  const found = list.prompts.find(p => p.id === prompt.id);
  assert(found, 'Deleted prompt should appear with isDeleted=true filter');
}

// --- Search & Filters ---
async function testSearchByQuery() {
  const prompt = await promptsService.createPrompt({
    title: 'Searchable Widget Builder',
    description: 'Builds custom widgets',
    promptType: 'website-generation'
  }, testUser.id);
  cleanup.push(() => prisma.cmsPrompt.deleteMany({ where: { id: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptVersion.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptHistory.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptAuditLog.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptUsageAnalytics.deleteMany({ where: { promptId: prompt.id } }));

  const result = await promptsService.listPrompts({ q: 'widget' });
  assert(result.prompts.length > 0, 'Search by query should find prompts');
  const found = result.prompts.find(p => p.id === prompt.id);
  assert(found, 'Should find the widget prompt');
}

async function testFilterByCategory() {
  const prompt = await promptsService.createPrompt({
    title: 'Category Filter Test',
    promptType: 'website-generation',
    categoryId: testCategory.id
  }, testUser.id);
  cleanup.push(() => prisma.cmsPrompt.deleteMany({ where: { id: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptVersion.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptHistory.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptAuditLog.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptUsageAnalytics.deleteMany({ where: { promptId: prompt.id } }));

  const result = await promptsService.listPrompts({ category: testCategory.id });
  const found = result.prompts.find(p => p.id === prompt.id);
  assert(found, 'Filter by category should find prompt');
}

async function testFilterByType() {
  const prompt = await promptsService.createPrompt({
    title: 'Type Filter Test',
    promptType: 'performance-fix'
  }, testUser.id);
  cleanup.push(() => prisma.cmsPrompt.deleteMany({ where: { id: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptVersion.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptHistory.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptAuditLog.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptUsageAnalytics.deleteMany({ where: { promptId: prompt.id } }));

  const result = await promptsService.listPrompts({ type: 'performance-fix' });
  const found = result.prompts.find(p => p.id === prompt.id);
  assert(found, 'Filter by type should find prompt');
}

async function testFilterByBuilder() {
  const prompt = await promptsService.createPrompt({
    title: 'Builder Filter Test',
    promptType: 'website-generation',
    builderId: testBuilder.id
  }, testUser.id);
  cleanup.push(() => prisma.cmsPrompt.deleteMany({ where: { id: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptVersion.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptHistory.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptAuditLog.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptUsageAnalytics.deleteMany({ where: { promptId: prompt.id } }));

  const result = await promptsService.listPrompts({ builderId: testBuilder.id });
  const found = result.prompts.find(p => p.id === prompt.id);
  assert(found, 'Filter by builder should find prompt');
}

async function testFilterByTags() {
  const prompt = await promptsService.createPrompt({
    title: 'Tag Filter Test',
    promptType: 'website-generation',
    tags: ['test-tag']
  }, testUser.id);
  cleanup.push(() => prisma.cmsPrompt.deleteMany({ where: { id: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptVersion.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptHistory.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptAuditLog.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptUsageAnalytics.deleteMany({ where: { promptId: prompt.id } }));

  const result = await promptsService.listPrompts({ tags: ['test-tag'] });
  const found = result.prompts.find(p => p.id === prompt.id);
  assert(found, 'Filter by tag should find prompt');
}

// --- Clone ---
async function testClonePrompt() {
  const source = await promptsService.createPrompt({
    title: 'Source Prompt',
    description: 'Original description',
    promptType: 'website-generation',
    instructions: 'Original instructions',
    tags: ['test-tag']
  }, testUser.id);
  cleanup.push(() => prisma.cmsPrompt.deleteMany({ where: { id: source.id } }));
  cleanup.push(() => prisma.cmsPromptVersion.deleteMany({ where: { promptId: source.id } }));
  cleanup.push(() => prisma.cmsPromptHistory.deleteMany({ where: { promptId: source.id } }));
  cleanup.push(() => prisma.cmsPromptAuditLog.deleteMany({ where: { promptId: source.id } }));
  cleanup.push(() => prisma.cmsPromptUsageAnalytics.deleteMany({ where: { promptId: source.id } }));

  const clone = await promptsService.clonePrompt(source.id, testUser.id);
  assert(clone, 'Clone should be created');
  assert(clone.title.includes('(Clone)'), `Clone title should contain "(Clone)", got "${clone.title}"`);
  assert(clone.description === source.description, 'Clone should copy description');
  assert(clone.version === 1, 'Clone should start at version 1');
  cleanup.push(() => prisma.cmsPrompt.deleteMany({ where: { id: clone.id } }));
  cleanup.push(() => prisma.cmsPromptVersion.deleteMany({ where: { promptId: clone.id } }));
  cleanup.push(() => prisma.cmsPromptHistory.deleteMany({ where: { promptId: clone.id } }));
  cleanup.push(() => prisma.cmsPromptAuditLog.deleteMany({ where: { promptId: clone.id } }));
  cleanup.push(() => prisma.cmsPromptUsageAnalytics.deleteMany({ where: { promptId: clone.id } }));
}

// --- Favorites ---
async function testFavoriteToggle() {
  const prompt = await promptsService.createPrompt({
    title: 'Favorite Test',
    promptType: 'website-generation'
  }, testUser.id);
  cleanup.push(() => prisma.cmsPrompt.deleteMany({ where: { id: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptVersion.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptHistory.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptAuditLog.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptUsageAnalytics.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptFavorite.deleteMany({ where: { promptId: prompt.id } }));

  const fav1 = await promptsService.favoritePrompt(prompt.id, testUser.id);
  assert(fav1.favorited === true, 'First toggle should favorite');

  const fav2 = await promptsService.favoritePrompt(prompt.id, testUser.id);
  assert(fav2.favorited === false, 'Second toggle should unfavorite');
}

async function testListFavorites() {
  const prompt = await promptsService.createPrompt({
    title: 'Favorites List Test',
    promptType: 'website-generation'
  }, testUser.id);
  cleanup.push(() => prisma.cmsPrompt.deleteMany({ where: { id: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptVersion.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptHistory.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptAuditLog.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptUsageAnalytics.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptFavorite.deleteMany({ where: { promptId: prompt.id } }));

  await promptsService.favoritePrompt(prompt.id, testUser.id);
  const result = await promptsService.listFavorites(testUser.id);
  assert(result.favorites.length > 0, 'Should have favorites');
  const found = result.favorites.find(f => f.id === prompt.id);
  assert(found, 'Should find favorited prompt');
  assert(found.favoritedAt, 'Should include favoritedAt timestamp');
}

// --- Collections ---
async function testCreateCollection() {
  const collection = await promptsService.createCollection({
    name: 'Test Collection',
    description: 'A test collection'
  }, testUser.id);
  assert(collection, 'Collection should be created');
  assert(collection.name === 'Test Collection', `Expected "Test Collection", got "${collection.name}"`);
  cleanup.push(() => prisma.cmsPromptCollection.deleteMany({ where: { id: collection.id } }));
}

async function testAddRemoveCollectionItem() {
  const collection = await promptsService.createCollection({
    name: 'Item Test Collection',
    description: 'For item testing'
  }, testUser.id);
  cleanup.push(() => prisma.cmsPromptCollection.deleteMany({ where: { id: collection.id } }));

  const prompt = await promptsService.createPrompt({
    title: 'Collection Item Prompt',
    promptType: 'website-generation'
  }, testUser.id);
  cleanup.push(() => prisma.cmsPrompt.deleteMany({ where: { id: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptVersion.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptHistory.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptAuditLog.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptUsageAnalytics.deleteMany({ where: { promptId: prompt.id } }));

  const added = await promptsService.addToCollection(collection.id, prompt.id);
  assert(added, 'Item should be added to collection');

  const removed = await promptsService.removeFromCollection(collection.id, prompt.id);
  assert(removed.count > 0, 'Item should be removed from collection');
}

async function testListCollections() {
  const collection = await promptsService.createCollection({
    name: 'List Test Collection'
  }, testUser.id);
  cleanup.push(() => prisma.cmsPromptCollection.deleteMany({ where: { id: collection.id } }));

  const collections = await promptsService.manageCollections(testUser.id);
  assert(collections.length > 0, 'Should list collections');
  const found = collections.find(c => c.id === collection.id);
  assert(found, 'Should find test collection');
}

// --- Render & Execute ---
async function testRenderPrompt() {
  const prompt = await promptsService.createPrompt({
    title: 'Render Test',
    promptType: 'website-generation',
    templateContent: 'Hello {{name}}, welcome to {{place}}!',
    variables: { name: 'User', place: 'TestLand' }
  }, testUser.id);
  cleanup.push(() => prisma.cmsPrompt.deleteMany({ where: { id: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptVersion.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptHistory.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptAuditLog.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptUsageAnalytics.deleteMany({ where: { promptId: prompt.id } }));

  const rendered = await promptsService.renderPrompt(prompt.id, { name: 'Alice' });
  assert(rendered, 'Should render prompt');
  assert(rendered.content.includes('Alice'), `Content should contain "Alice", got "${rendered.content}"`);
  assert(rendered.content.includes('TestLand'), 'Content should contain default variable value');
  assert(rendered.variables.name === 'Alice', 'Variables should be merged');
}

async function testExecutePrompt() {
  const prompt = await promptsService.createPrompt({
    title: 'Execute Test',
    promptType: 'website-generation',
    templateContent: 'Execute {{task}}',
    variables: { task: 'default-task' }
  }, testUser.id);
  cleanup.push(() => prisma.cmsPrompt.deleteMany({ where: { id: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptVersion.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptHistory.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptAuditLog.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptUsageAnalytics.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptExecution.deleteMany({ where: { promptId: prompt.id } }));

  const executed = await promptsService.executePrompt(prompt.id, {
    variables: { task: 'build-thing' },
    userId: testUser.id
  });
  assert(executed, 'Should execute prompt');
  assert(executed.status === 'COMPLETED', `Expected COMPLETED, got ${executed.status}`);
  assert(executed.renderedContent.includes('build-thing'), 'Should render with custom variables');
  assert(executed.promptId === prompt.id, 'Should reference the prompt');
}

async function testPreviewPrompt() {
  const prompt = await promptsService.createPrompt({
    title: 'Preview Test',
    promptType: 'website-generation',
    templateContent: 'Preview {{item}}',
    variables: { item: 'default-item' }
  }, testUser.id);
  cleanup.push(() => prisma.cmsPrompt.deleteMany({ where: { id: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptVersion.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptHistory.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptAuditLog.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptUsageAnalytics.deleteMany({ where: { promptId: prompt.id } }));

  const preview = await promptsService.previewPrompt(prompt.id);
  assert(preview, 'Should preview prompt');
  assert(preview.content.includes('default-item'), 'Preview should use default variables');
}

// --- Version History & Rollback ---
async function testGetHistory() {
  const prompt = await promptsService.createPrompt({
    title: 'History Test',
    promptType: 'website-generation'
  }, testUser.id);
  cleanup.push(() => prisma.cmsPrompt.deleteMany({ where: { id: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptVersion.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptAuditLog.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptUsageAnalytics.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptHistory.deleteMany({ where: { promptId: prompt.id } }));

  const history = await promptsService.getHistory(prompt.id);
  assert(history.history.length > 0, 'Should have history entries');
  assert(history.history[0].promptId === prompt.id, 'History should reference the prompt');
}

async function testGetVersions() {
  const prompt = await promptsService.createPrompt({
    title: 'Versions Test',
    promptType: 'website-generation',
    instructions: 'v1 instructions'
  }, testUser.id);
  cleanup.push(() => prisma.cmsPrompt.deleteMany({ where: { id: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptVersion.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptHistory.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptAuditLog.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptUsageAnalytics.deleteMany({ where: { promptId: prompt.id } }));

  await promptsService.updatePrompt(prompt.id, {
    instructions: 'v2 instructions',
    changeNotes: 'Updated instructions'
  }, testUser.id);

  const versions = await promptsService.getVersions(prompt.id);
  assert(versions.length >= 2, `Expected >= 2 versions, got ${versions.length}`);
  const v1 = versions.find(v => v.version === 1);
  const v2 = versions.find(v => v.version === 2);
  assert(v1, 'Should have version 1');
  assert(v2, 'Should have version 2');
}

async function testRollbackVersion() {
  const prompt = await promptsService.createPrompt({
    title: 'Rollback Test',
    promptType: 'website-generation',
    instructions: 'Original instructions',
    rules: 'Original rules'
  }, testUser.id);
  cleanup.push(() => prisma.cmsPrompt.deleteMany({ where: { id: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptVersion.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptHistory.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptAuditLog.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptUsageAnalytics.deleteMany({ where: { promptId: prompt.id } }));

  const updated = await promptsService.updatePrompt(prompt.id, {
    instructions: 'Updated instructions',
    changeNotes: 'Test update before rollback'
  }, testUser.id);

  const rollback = await promptsService.rollbackVersion(prompt.id, 1, testUser.id);
  assert(rollback, 'Rollback should succeed');
  assert(rollback.instructions === 'Original instructions', 'Should restore original instructions');
}

// --- Categories ---
async function testListCategories() {
  const categories = await promptsService.listCategories();
  assert(categories.length > 0, 'Should list categories');
  const found = categories.find(c => c.id === testCategory.id || c.key === 'testing');
  assert(found, 'Should find test category');
}

async function testCreateCategory() {
  const cat = await promptsService.createCategory({
    key: 'temp-test-cat',
    name: 'Temp Test Category',
    displayOrder: 100
  });
  assert(cat, 'Category should be created');
  assert(cat.key === 'temp-test-cat', `Expected key "temp-test-cat", got "${cat.key}"`);
  cleanup.push(() => prisma.cmsPromptCategory.deleteMany({ where: { key: 'temp-test-cat' } }));
}

// --- Builders ---
async function testListBuilders() {
  const builders = await promptsService.listBuilders();
  assert(builders.length > 0, 'Should list builders');
  assert(builders.every(b => b.status === 'ACTIVE'), 'All builders should be ACTIVE');
}

async function testCreateBuilder() {
  const builder = await promptsService.createBuilder({
    key: 'temp-test-builder',
    name: 'Temp Test Builder',
    provider: 'Test',
    model: 'test',
    promptFormat: 'markdown',
    temperature: 0.5,
    maxTokens: 2048,
    status: 'ACTIVE',
    displayOrder: 100
  });
  assert(builder, 'Builder should be created');
  cleanup.push(() => prisma.cmsAiBuilder.deleteMany({ where: { key: 'temp-test-builder' } }));
}

// --- Variables ---
async function testListVariables() {
  const variables = await promptsService.listVariables();
  assert(variables.length > 0, 'Should list variables');
}

async function testCreateVariable() {
  const v = await promptsService.createVariable({
    key: 'temp-test-var',
    label: 'Temp Test Variable',
    variableType: 'string',
    displayOrder: 100
  });
  assert(v, 'Variable should be created');
  cleanup.push(() => prisma.cmsPromptVariable.deleteMany({ where: { key: 'temp-test-var' } }));
}

// --- Tags ---
async function testListTags() {
  const tags = await promptsService.listTags();
  assert(tags.length > 0, 'Should list tags');
}

async function testCreateTag() {
  const tag = await promptsService.createTag({
    key: 'temp-test-tag',
    name: 'Temp Test Tag'
  });
  assert(tag, 'Tag should be created');
  assert(tag.key === 'temp-test-tag', `Expected key "temp-test-tag", got "${tag.key}"`);
  cleanup.push(() => prisma.cmsPromptTag.deleteMany({ where: { key: 'temp-test-tag' } }));
}

// --- Export/Import ---
async function testExportJson() {
  const prompt = await promptsService.createPrompt({
    title: 'Export JSON Test',
    description: 'Testing JSON export',
    promptType: 'website-generation',
    instructions: 'Export instructions',
    templateContent: 'Export {{data}}',
    variables: { data: 'test' },
    tags: ['test-tag']
  }, testUser.id);
  cleanup.push(() => prisma.cmsPrompt.deleteMany({ where: { id: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptVersion.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptHistory.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptAuditLog.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptUsageAnalytics.deleteMany({ where: { promptId: prompt.id } }));

  const exported = await promptsService.exportPrompt(prompt.id, 'json');
  assert(exported, 'Should export prompt');
  assert(exported.title === 'Export JSON Test', 'Title should match');
  assert(exported.instructions === 'Export instructions', 'Instructions should match');
  assert(Array.isArray(exported.tags), 'Tags should be an array');
}

async function testExportMarkdown() {
  const prompt = await promptsService.createPrompt({
    title: 'Export MD Test',
    description: 'Testing markdown export',
    promptType: 'website-generation',
    instructions: 'MD instructions'
  }, testUser.id);
  cleanup.push(() => prisma.cmsPrompt.deleteMany({ where: { id: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptVersion.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptHistory.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptAuditLog.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptUsageAnalytics.deleteMany({ where: { promptId: prompt.id } }));

  const exported = await promptsService.exportPrompt(prompt.id, 'markdown');
  assert(exported, 'Should export as markdown');
  assert(typeof exported === 'string', 'Markdown export should be a string');
  assert(exported.includes('# Export MD Test'), 'Markdown should include title heading');
  assert(exported.includes('MD instructions'), 'Markdown should include instructions');
}

// --- Analytics ---
async function testAnalytics() {
  const prompt = await promptsService.createPrompt({
    title: 'Analytics Test',
    promptType: 'website-generation'
  }, testUser.id);
  cleanup.push(() => prisma.cmsPrompt.deleteMany({ where: { id: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptVersion.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptHistory.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptAuditLog.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptUsageAnalytics.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptExecution.deleteMany({ where: { promptId: prompt.id } }));

  const analytics = await promptsService.getAnalytics();
  assert(analytics, 'Should return analytics');

  const promptAnalytics = await promptsService.getAnalytics({ promptId: prompt.id });
  assert(promptAnalytics, 'Should return prompt-specific analytics');
}

// --- Ratings ---
async function testRatePrompt() {
  const prompt = await promptsService.createPrompt({
    title: 'Rating Test',
    promptType: 'website-generation'
  }, testUser.id);
  cleanup.push(() => prisma.cmsPrompt.deleteMany({ where: { id: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptVersion.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptHistory.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptAuditLog.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptUsageAnalytics.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptRating.deleteMany({ where: { promptId: prompt.id } }));

  const rating = await promptsService.ratePrompt(prompt.id, testUser.id, 5, 'Excellent!');
  assert(rating, 'Rating should be created');
  assert(rating.rating === 5, `Expected rating 5, got ${rating.rating}`);
  assert(rating.comment === 'Excellent!', `Expected "Excellent!", got "${rating.comment}"`);

  const updated = await promptsService.ratePrompt(prompt.id, testUser.id, 4, 'Good');
  assert(updated.rating === 4, 'Rating should be updated to 4');
}

// --- Audit Logs ---
async function testAuditLogs() {
  const prompt = await promptsService.createPrompt({
    title: 'Audit Log Test',
    promptType: 'website-generation'
  }, testUser.id);
  cleanup.push(() => prisma.cmsPrompt.deleteMany({ where: { id: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptVersion.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptHistory.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptAuditLog.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptUsageAnalytics.deleteMany({ where: { promptId: prompt.id } }));

  await promptsService.updatePrompt(prompt.id, {
    title: 'Updated Audit Title',
    description: 'Updated audit description',
    changeNotes: 'Testing audit logs'
  }, testUser.id);

  const logs = await promptsService.getAuditLogs(prompt.id);
  assert(logs.length >= 2, `Expected >= 2 audit log entries, got ${logs.length}`);
  assert(logs[0].promptId === prompt.id, 'Audit log should reference the prompt');
}

// --- Recent & Popular ---
async function testListRecent() {
  const prompt = await promptsService.createPrompt({
    title: 'Recent Test',
    promptType: 'website-generation'
  }, testUser.id);
  cleanup.push(() => prisma.cmsPrompt.deleteMany({ where: { id: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptVersion.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptHistory.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptAuditLog.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptUsageAnalytics.deleteMany({ where: { promptId: prompt.id } }));

  const recent = await promptsService.listRecent(testUser.id);
  assert(recent.recent.length > 0, 'Should have recent prompts');
}

async function testListPopular() {
  const popular = await promptsService.listPopular();
  assert(popular.prompts.length > 0, 'Should list popular prompts');
}

// --- Integration Methods ---
async function testFindByReference() {
  const prompt = await promptsService.createPrompt({
    title: 'Reference Test',
    promptType: 'website-generation'
  }, testUser.id);
  cleanup.push(() => prisma.cmsPrompt.deleteMany({ where: { id: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptVersion.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptHistory.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptAuditLog.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptUsageAnalytics.deleteMany({ where: { promptId: prompt.id } }));

  const refId = '00000000-0000-0000-0000-000000000001';
  const linked = await promptsService.linkToReference(prompt.id, 'standard', refId, testUser.id);
  assert(linked, 'Should link reference');
  assert(linked.referenceType === 'standard', 'referenceType should be standard');
  assert(linked.referenceId === refId, 'referenceId should match');

  const found = await promptsService.findByReference('standard', refId);
  assert(found.length > 0, 'Should find by reference');
  const match = found.find(p => p.id === prompt.id);
  assert(match, 'Should find the linked prompt');

  const unlinked = await promptsService.unlinkFromReference(prompt.id, testUser.id);
  assert(unlinked.referenceType === null, 'referenceType should be null after unlink');
  assert(unlinked.referenceId === null, 'referenceId should be null after unlink');
}

async function testGetPromptsForEngine() {
  const prompt = await promptsService.createPrompt({
    title: 'Engine Test',
    promptType: 'website-generation'
  }, testUser.id);
  cleanup.push(() => prisma.cmsPrompt.deleteMany({ where: { id: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptVersion.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptHistory.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptAuditLog.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptUsageAnalytics.deleteMany({ where: { promptId: prompt.id } }));

  await promptsService.linkToReference(prompt.id, 'standard', '00000000-0000-0000-0000-000000000002', testUser.id);

  const enginePrompts = await promptsService.getPromptsForEngine('standard');
  assert(enginePrompts.length > 0, 'Should get engine prompts');
  const match = enginePrompts.find(p => p.id === prompt.id);
  assert(match, 'Should find linked prompt in engine results');
}

async function testGetEnginePromptByType() {
  const prompt = await promptsService.createPrompt({
    title: 'Engine Type Test',
    promptType: 'website-generation'
  }, testUser.id);
  cleanup.push(() => prisma.cmsPrompt.deleteMany({ where: { id: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptVersion.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptHistory.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptAuditLog.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptUsageAnalytics.deleteMany({ where: { promptId: prompt.id } }));

  await promptsService.linkToReference(prompt.id, 'standard', '00000000-0000-0000-0000-000000000003', testUser.id);

  const enginePrompt = await promptsService.getEnginePromptByType('standard', 'website-generation');
  assert(enginePrompt, 'Should find engine prompt by type');
  assert(enginePrompt.promptType === 'website-generation', 'Prompt type should match');
}

async function testEngineIntegrations() {
  const prompt = await promptsService.createPrompt({
    title: 'Engine Integration Test',
    promptType: 'website-generation'
  }, testUser.id);
  cleanup.push(() => prisma.cmsPrompt.deleteMany({ where: { id: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptVersion.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptHistory.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptAuditLog.deleteMany({ where: { promptId: prompt.id } }));
  cleanup.push(() => prisma.cmsPromptUsageAnalytics.deleteMany({ where: { promptId: prompt.id } }));

  await promptsService.linkToReference(prompt.id, 'standard', '00000000-0000-0000-0000-000000000004', testUser.id);

  const standards = await promptsService.getStandardsIntegration();
  assert(Array.isArray(standards), 'getStandardsIntegration should return array');

  const requirements = await promptsService.getRequirementsIntegration();
  assert(Array.isArray(requirements), 'getRequirementsIntegration should return array');

  const blueprints = await promptsService.getBlueprintsIntegration();
  assert(Array.isArray(blueprints), 'getBlueprintsIntegration should return array');

  const verification = await promptsService.getVerificationIntegration();
  assert(Array.isArray(verification), 'getVerificationIntegration should return array');

  const certification = await promptsService.getCertificationIntegration();
  assert(Array.isArray(certification), 'getCertificationIntegration should return array');

  const aiFix = await promptsService.getAIFixIntegration();
  assert(Array.isArray(aiFix), 'getAIFixIntegration should return array');

  const deployment = await promptsService.getDeploymentIntegration();
  assert(Array.isArray(deployment), 'getDeploymentIntegration should return array');
}

// --- Error Cases ---
async function testGetNonexistentPrompt() {
  const result = await promptsService.getPrompt('00000000-0000-0000-0000-000000000000');
  assert(result === null, 'Getting nonexistent prompt should return null');
}

async function testUpdateNonexistentPrompt() {
  const result = await promptsService.updatePrompt('00000000-0000-0000-0000-000000000000',
    { title: 'Nope' }, testUser.id);
  assert(result === null, 'Updating nonexistent prompt should return null');
}

async function testDeleteNonexistentPrompt() {
  const result = await promptsService.deletePrompt('00000000-0000-0000-0000-000000000000', testUser.id);
  assert(result === null, 'Deleting nonexistent prompt should return null');
}

async function testCloneNonexistentPrompt() {
  const result = await promptsService.clonePrompt('00000000-0000-0000-0000-000000000000', testUser.id);
  assert(result === null, 'Cloning nonexistent prompt should return null');
}

async function testRenderNonexistentPrompt() {
  const result = await promptsService.renderPrompt('00000000-0000-0000-0000-000000000000');
  assert(result === null, 'Rendering nonexistent prompt should return null');
}

async function testExecuteNonexistentPrompt() {
  const result = await promptsService.executePrompt('00000000-0000-0000-0000-000000000000',
    { userId: testUser.id });
  assert(result === null, 'Executing nonexistent prompt should return null');
}

async function testExportNonexistentPrompt() {
  const result = await promptsService.exportPrompt('00000000-0000-0000-0000-000000000000');
  assert(result === null, 'Exporting nonexistent prompt should return null');
}

async function testRollbackNonexistentVersion() {
  const result = await promptsService.rollbackVersion('00000000-0000-0000-0000-000000000000', 1, testUser.id);
  assert(result === null, 'Rollback nonexistent version should return null');
}

async function testLinkNonexistentPrompt() {
  const result = await promptsService.linkToReference('00000000-0000-0000-0000-000000000000', 'standard', 'ref', testUser.id);
  assert(result === null, 'Linking nonexistent prompt should return null');
}

// ============================================================
// RUN ALL TESTS
// ============================================================

async function run() {
  const testGroups = [
    { name: 'CRUD Operations', tests: [testCreatePrompt, testListPrompts, testGetPrompt, testUpdatePrompt, testDeletePrompt] },
    { name: 'Search & Filters', tests: [testSearchByQuery, testFilterByCategory, testFilterByType, testFilterByBuilder, testFilterByTags] },
    { name: 'Clone', tests: [testClonePrompt] },
    { name: 'Favorites', tests: [testFavoriteToggle, testListFavorites] },
    { name: 'Collections', tests: [testCreateCollection, testAddRemoveCollectionItem, testListCollections] },
    { name: 'Render & Execute', tests: [testRenderPrompt, testExecutePrompt, testPreviewPrompt] },
    { name: 'Versions & History', tests: [testGetHistory, testGetVersions, testRollbackVersion] },
    { name: 'Categories & Builders & Variables & Tags', tests: [testListCategories, testCreateCategory, testListBuilders, testCreateBuilder, testListVariables, testCreateVariable, testListTags, testCreateTag] },
    { name: 'Export/Import', tests: [testExportJson, testExportMarkdown] },
    { name: 'Analytics & Ratings & Audit Logs', tests: [testAnalytics, testRatePrompt, testAuditLogs] },
    { name: 'Recent & Popular', tests: [testListRecent, testListPopular] },
    { name: 'Integration Methods', tests: [testFindByReference, testGetPromptsForEngine, testGetEnginePromptByType, testEngineIntegrations] },
    { name: 'Error Cases', tests: [testGetNonexistentPrompt, testUpdateNonexistentPrompt, testDeleteNonexistentPrompt, testCloneNonexistentPrompt, testRenderNonexistentPrompt, testExecuteNonexistentPrompt, testExportNonexistentPrompt, testRollbackNonexistentVersion, testLinkNonexistentPrompt] }
  ];

  console.log('='.repeat(70));
  console.log('CMS PROMPT LIBRARY — COMPREHENSIVE TEST SUITE');
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

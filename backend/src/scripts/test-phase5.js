// Phase 5: AI Orchestrator Core Platform - Backend Test Runner
// Tests schema, configurations, DI registration, logger, and validation logic.

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const config = require('../modules/ai-core/config/ai.config');
const di = require('../modules/ai-core/utils/di');
const logger = require('../modules/ai-core/utils/logger');
const { validateSchema } = require('../modules/ai-core/utils/validator');

async function runTests() {
  console.log('🚀 STARTING PHASE 5 CORE PLATFORM INTEGRATION TESTS...\n');
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

  // 1. DATABASE CONNECTIVITY & SCHEMAS TEST
  console.log('--- 1. Database Schemas Connection ---');
  try {
    const agents = await prisma.aIAgent.findMany();
    assert(Array.isArray(agents), 'Successfully connected to database and queried AIAgent model.');
  } catch (err) {
    console.error('  ❌ DB Connection Failed:', err.message);
    failed++;
  }

  // 2. CONFIGURATION VALIDATION TEST
  console.log('\n--- 2. Configuration Parameters ---');
  assert(config.provider === 'gemini', `Default provider is configured: ${config.provider}`);
  assert(config.gemini.model === 'gemini-1.5-pro', `Gemini model configured: ${config.gemini.model}`);
  assert(config.costs.gemini.inputPerMillion === 0.075, 'Gemini pricing rate is loaded.');

  // 3. DI SERVICE REGISTRATION TEST
  console.log('\n--- 3. Dependency Injection Singletons ---');
  const mockService = { name: 'PromptServiceInstance' };
  di.register('PromptService', mockService);
  try {
    const resolved = di.resolve('PromptService');
    assert(resolved.name === 'PromptServiceInstance', 'DI container successfully registered and resolved PromptService.');
  } catch (err) {
    console.error('  ❌ DI Resolution Failed:', err.message);
    failed++;
  }

  // 4. JSON SCHEMA VALIDATOR TEST
  console.log('\n--- 4. Schema Validator Logic ---');
  const testSchema = {
    required: ['name', 'pages'],
    properties: {
      name: { type: 'string' },
      pages: { type: 'array' },
      maxTokens: { type: 'number' }
    }
  };

  const validPayload = {
    name: 'Luxury Boutique Standard',
    pages: ['Home', 'Shop'],
    maxTokens: 100
  };

  const invalidPayload = {
    name: 123, // Mismatch
    pages: 'Home' // Expected array
    // Missing 'name' or mismatch properties
  };

  const validRes = validateSchema(validPayload, testSchema);
  assert(validRes.valid === true, 'Validator correctly identifies valid payloads matching schemas.');

  const invalidRes = validateSchema(invalidPayload, testSchema);
  assert(invalidRes.valid === false, 'Validator successfully catches incorrect types.');
  assert(invalidRes.errors.length > 0, `Validator returns error details: ${invalidRes.errors.join(', ')}`);

  // 5. LOGGER VALIDATION
  console.log('\n--- 5. Logger Trace verification ---');
  try {
    logger.info('Test validation trace', { testKey: 'testVal' });
    assert(true, 'Logger runs successfully and writes logs.');
  } catch (err) {
    console.error('  ❌ Logger failed:', err.message);
    failed++;
  }

  // 6. PROVIDER SERVICE & ADAPTERS
  console.log('\n--- 6. Provider Service & Factory ---');
  const providerService = require('../modules/ai-core/services/provider.service');
  di.register('ProviderService', providerService);
  try {
    const active = await providerService.estimateCost({ input: 100000, output: 50000 }, 'gemini');
    assert(typeof active === 'number', `Provider cost estimation calculated: $${active}`);
    
    const count = await providerService.countTokens('Hello Antigravity AI Engine', 'gemini');
    assert(count === 5 || count > 0, `Provider token counter returned: ${count}`);

    const conn = await providerService.validateConnection('gemini');
    assert(conn.status === 'Healthy' || conn.status === 'Warning', `Provider health check state is: ${conn.status} - ${conn.message}`);

    const gen = await providerService.generate('System Instructions', 'Boutique Prompt parameters', { required: ['name'] }, 'gemini');
    assert(typeof gen === 'string', 'Provider generated response payload successfully.');
  } catch (err) {
    console.error('  ❌ Provider Service check failed:', err.message);
    failed++;
  }

  // 7. PROMPT TEMPLATING & ROLLS
  console.log('\n--- 7. Prompt Service & Rollback ---');
  const promptService = require('../modules/ai-core/services/prompt.service');
  di.register('PromptService', promptService);
  try {
    const existing = await prisma.promptTemplate.findFirst({ where: { name: 'Boutique Analyst Prompt' } });
    if (existing) {
      await prisma.promptHistory.deleteMany({ where: { templateId: existing.id } });
      await prisma.promptTemplate.delete({ where: { id: existing.id } });
    }

    const template = await promptService.createPrompt(
      'Boutique Analyst Prompt',
      'Analyze retail brand: {{brandName}} under vertical {{vertical}}.',
      ['brandName', 'vertical']
    );
    assert(template.activeVersion === '1.0.0', 'Prompt template created with initial v1.0.0.');

    const compiled = await promptService.compilePrompt(template.id, {
      brandName: 'Zara Boutique',
      vertical: 'Fashion'
    });
    assert(compiled === 'Analyze retail brand: Zara Boutique under vertical Fashion.', 'Prompt compiled and variables replaced successfully.');

    try {
      await promptService.compilePrompt(template.id, { vertical: 'Fashion' });
      assert(false, 'Validation failed to catch missing variables.');
    } catch (e) {
      assert(e.message.includes('Missing required variables'), 'Prompt validator successfully catches missing variables.');
    }

    const updated = await promptService.updatePrompt(template.id, 'New Content: {{brandName}}', 'Update test');
    assert(updated.activeVersion === '1.1.0', `Prompt updated and version incremented to: ${updated.activeVersion}`);

    const rolled = await promptService.rollbackPrompt(template.id, '1.0.0');
    assert(rolled.activeVersion === '2.0.0', `Prompt rolled back and version set to: ${rolled.activeVersion}`);
    
    const compiledRoll = await promptService.compilePrompt(template.id, {
      brandName: 'Zara Boutique',
      vertical: 'Fashion'
    });
    assert(compiledRoll.includes('vertical Fashion'), 'Rolled back template content compiles successfully.');
  } catch (err) {
    console.error('  ❌ Prompt Service check failed:', err.message);
    failed++;
  }

  // 8. ORCHESTRATION PIPELINE ENGINE (12 AGENTS E2E)
  console.log('\n--- 8. AI Orchestrator Core Sequence ---');
  const aiCoreService = require('../modules/ai-core/services/aiCore.service');
  const memoryService = require('../modules/ai-core/services/memory.service');
  const eventBus = require('../modules/ai-core/utils/eventBus');
  
  di.register('MemoryService', memoryService);
  di.register('AICoreService', aiCoreService);
  
  try {
    const session = await aiCoreService.createSession('Antigravity test boutique', 'Boutique');
    assert(session.status === 'IN_PROGRESS', `Session ${session.id} initialized successfully.`);

    // Run the pipeline and return a promise waiting for completion
    const pipelinePromise = new Promise((resolve, reject) => {
      eventBus.once('SessionCompleted', (evt) => resolve(evt));
      eventBus.once('SessionFailed', (evt) => reject(new Error('Pipeline failed')));
    });

    await aiCoreService.executeSession(session.id);
    const finalEvent = await pipelinePromise;
    assert(finalEvent.payload.finalArtifactId !== undefined, 'Pipeline completed! Generated final compliance artifact.');

    const status = await aiCoreService.getSessionStatus(session.id);
    assert(status.status === 'COMPLETED', `Session state transitioned to COMPLETED.`);
    assert(status.completedSteps === 12, `Verified all 12 pipeline steps executed successfully.`);
    assert(status.totalTokens > 0, `Telemetry Token usage logged: ${status.totalTokens}`);
    assert(status.totalCost > 0, `Telemetry Cost estimation logged: $${status.totalCost}`);
  } catch (err) {
    console.error('  ❌ Orchestrator Pipeline check failed:', err.message);
    failed++;
  }

  // TEST SUMMARY
  console.log('\n=========================================');
  console.log(`Phase 5 Core Integration Tests Finished.`);
  console.log(`Passed: ${passed} | Failed: ${failed}`);
  console.log('=========================================');

  await prisma.$disconnect();
  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(async (e) => {
  console.error('Unhandled test run exception:', e);
  await prisma.$disconnect();
  process.exit(1);
});

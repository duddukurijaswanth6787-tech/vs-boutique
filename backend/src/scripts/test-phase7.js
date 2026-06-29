const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const certificationService = require('../modules/website-certification/services/certification.service');
const assert = require('assert');

async function runTests() {
  console.log('==================================================');
  console.log('🧪 RUNNING PHASE 7 CERTIFICATION INTEGRATION TESTS');
  console.log('==================================================');

  try {
    // 1. Resolve business context
    const boutique = await prisma.boutique.findFirst();
    if (!boutique || !boutique.businessId) {
      console.log('⚠️ No active boutique found. Creating a test tenant/business context...');
      // Ensure we have a business and boutique to test against
      const tenant = await prisma.tenant.create({
        data: { name: 'Test Tenant', domain: 'test-qa.antair.live' }
      });
      const business = await prisma.business.create({
        data: {
          tenantId: tenant.id,
          name: 'Test QA Boutique',
          nicheVertical: 'Couture Alterations'
        }
      });
      await prisma.boutique.create({
        data: {
          name: 'Test QA Boutique',
          ownerName: 'QA Lead',
          email: 'qa@antair.live',
          mobileNumber: '+15550199',
          fullAddress: 'QA Labs Suite 100',
          city: 'San Francisco',
          state: 'CA',
          businessId: business.id
        }
      });
      console.log('Created test Business and Boutique context.');
    }

    const activeBoutique = await prisma.boutique.findFirst();
    const businessId = activeBoutique.businessId;
    const releaseTag = 'v1.0.62';

    console.log(`Using Business Context: ${businessId}`);

    // 2. Ensure test ImmutableRelease exists
    let release = await prisma.immutableRelease.findFirst({
      where: { businessId, releaseTag }
    });

    if (!release) {
      console.log(`Test Release ${releaseTag} not found. Creating simulated snapshot payload...`);
      release = await prisma.immutableRelease.create({
        data: {
          businessId,
          releaseTag,
          status: 'QA',
          environment: 'DEV',
          createdBy: 'system-qa',
          checksum: 'abc123checksum',
          payloadDump: {
            assets: [
              {
                id: 'asset-1',
                name: 'hero-banner.png',
                type: 'IMAGE',
                meta: { sizeBytes: 1500000 } // > 500KB to trigger size issue
              },
              {
                id: 'asset-2',
                name: 'logo-vector.svg',
                type: 'IMAGE',
                meta: { sizeBytes: 12000 }
              }
            ],
            pages: [
              {
                id: 'page-home',
                title: 'Home',
                slug: 'home',
                components: [
                  {
                    id: 'comp-hero',
                    name: 'Hero Section',
                    type: 'Hero',
                    contentKeysBind: ['headline-hero'],
                    styleTokens: { padding: 'none' } // Trigger padding warning
                  },
                  {
                    id: 'comp-grid',
                    name: 'Product Catalog',
                    type: 'ProductGrid',
                    contentKeysBind: ['title-grid'],
                    styleTokens: { cols: { md: 3 } } // Missing xs cols grid configuration
                  }
                ]
              }
            ],
            theme: {
              colorsLight: {
                primary: '#ffffff' // Monochromatic color warning
              },
              typography: {
                headingFont: 'http://fonts.googleapis.com/css?family=Montserrat' // HTTP font warning
              }
            },
            contents: [
              {
                id: 'content-empty-desc',
                key: 'home-meta-description',
                baseText: '' // Empty content warning
              }
            ]
          }
        }
      });
      console.log('Simulated release created.');
    }

    // 3. Ensure a boutique page exists for auto-fix targeting
    let boutiquePage = await prisma.boutiquePage.findFirst({
      where: { website: { businessId } }
    });
    if (!boutiquePage) {
      const website = await prisma.website.upsert({
        where: { id: 'test-web-1' },
        update: {},
        create: { id: 'test-web-1', businessId, status: 'DRAFT', domain: 'test-qa-storefront.antair.live' }
      });
      boutiquePage = await prisma.boutiquePage.create({
        data: {
          id: 'page-home',
          websiteId: website.id,
          title: 'Home Page',
          slug: 'home',
          layoutType: 'standard',
          order: 1
        }
      });
      console.log('Created page for target modifications.');
    }

    // Ensure page components exist
    const compHeroExists = await prisma.pageComponentNode.findFirst({
      where: { id: 'comp-hero' }
    });
    if (!compHeroExists) {
      await prisma.pageComponentNode.create({
        data: {
          id: 'comp-hero',
          pageId: boutiquePage.id,
          type: 'Hero',
          name: 'Hero Banner',
          order: 1,
          styleTokens: { padding: 'none' },
          contentKeysBind: ['headline-hero'],
          editableProperties: {},
          responsiveRules: {}
        }
      });
    }

    // 4. Trigger Certification Pipeline
    console.log('Triggering runAudit()...');
    const workflow = await certificationService.runAudit(businessId, releaseTag, 'WEBSITE', activeBoutique.id);
    assert.strictEqual(workflow.status, 'RUNNING');
    console.log('✓ runAudit returned workflow execution status PENDING/RUNNING successfully.');

    // Wait for async execution loop to conclude
    console.log('Waiting for pipeline stages to finish (simulating execution delay)...');
    let attempts = 0;
    let completedWorkflow = null;

    while (attempts < 10) {
      await new Promise(r => setTimeout(r, 2000));
      completedWorkflow = await prisma.certificationWorkflow.findUnique({
        where: { id: workflow.id }
      });
      console.log(`Current progress: ${completedWorkflow.progress}%, status: ${completedWorkflow.status}`);
      if (completedWorkflow.status === 'COMPLETED' || completedWorkflow.status === 'FAILED') {
        break;
      }
      attempts++;
    }

    assert.strictEqual(completedWorkflow.status, 'COMPLETED');
    assert.strictEqual(completedWorkflow.progress, 100.0);
    console.log('✓ Orchestrator successfully progressed stages and completed at 100% progress.');

    // 5. Verify Certification Report
    const report = await prisma.boutiqueCertification.findFirst({
      where: { businessId, releaseTag },
      orderBy: { createdAt: 'desc' }
    });

    assert.ok(report);
    assert.ok(report.overallScore > 0);
    console.log(`✓ BoutiqueCertification report generated. Score: ${report.overallScore.toFixed(1)}/100.`);

    const issues = report.issues || [];
    console.log(`✓ Issues generated Count: ${issues.length}`);
    assert.ok(issues.length > 0, 'Issues list should contain audited warnings.');

    // Verify individual agent runs
    assert.ok(report.scoresMap.performance_agent !== undefined);
    assert.ok(report.scoresMap.seo_agent !== undefined);
    console.log('✓ ScoresMap contains detailed metrics per registered auditor agent.');

    // 6. Test Interactive Conversational QA Chatbot
    console.log('Testing conversational assistant askChatbot()...');
    const chatReply = await certificationService.askChatbot(report.id, 'Explain my Performance warnings');
    assert.ok(chatReply.length > 10);
    console.log(`✓ Chatbot response: "${chatReply.substring(0, 80)}..."`);

    // Verify chat messages are stored in DB
    const chatCount = await prisma.certificationChat.count({
      where: { certificationId: report.id }
    });
    assert.ok(chatCount >= 2);
    console.log('✓ Chat conversation records saved in PostgreSQL.');

    // 7. Test Automated Auto-Fix Repair Execution
    console.log('Testing applyAutoFix()...');
    const queueItem = await prisma.autoFixQueueItem.findFirst({
      where: { businessId, releaseTag, status: 'PENDING', safetyLevel: 'SAFE_AUTO_FIX' }
    });

    if (queueItem) {
      console.log(`Found safe auto-fix queue item: ${queueItem.description}. Applying...`);
      const fixResult = await certificationService.applyAutoFix(queueItem.id, 'test-verifier');
      assert.strictEqual(fixResult.success, true);

      // Verify status updated to APPLIED
      const updatedItem = await prisma.autoFixQueueItem.findUnique({
        where: { id: queueItem.id }
      });
      assert.strictEqual(updatedItem.status, 'APPLIED');
      console.log('✓ AutoFix applied successfully and state transitioned to APPLIED.');
    } else {
      console.log('No pending SAFE_AUTO_FIX item found (Skipping apply assertion).');
    }

    console.log('==================================================');
    console.log('🎉 ALL PHASE 7 CERTIFICATION AUDIT TESTS PASSED!');
    console.log('==================================================');
  } catch (err) {
    console.error('❌ PHASE 7 TESTS ENCOUNTERED FAILURE:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();

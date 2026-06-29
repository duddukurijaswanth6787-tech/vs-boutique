const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const certificationService = require('../modules/website-certification/services/certification.service');
const assert = require('assert');

async function runRemediation() {
  console.log('==================================================');
  console.log('🔧 STARTING PHASE 7 AUTO-FIX REMEDIATION VERIFIER');
  console.log('==================================================');

  try {
    const boutique = await prisma.boutique.findFirst();
    const businessId = boutique.businessId;
    const releaseTag = 'v1.0.62';

    // 1. Reset Database Test Data for v1.0.62
    console.log('Resetting previous test reports and queue items for release...');
    await prisma.autoFixQueueItem.deleteMany({ where: { businessId, releaseTag } });
    await prisma.boutiqueCertification.deleteMany({ where: { businessId, releaseTag } });
    await prisma.certificationWorkflow.deleteMany({ where: { businessId, releaseTag } });
    await prisma.immutableRelease.deleteMany({ where: { businessId, releaseTag } });

    // 2. Create Fresh Simulated Release Snapshot
    console.log('Creating fresh baseline release snapshot...');
    const release = await prisma.immutableRelease.create({
      data: {
        businessId,
        releaseTag,
        status: 'QA',
        environment: 'DEV',
        createdBy: 'system-remediation-baseline',
        checksum: 'remediationchecksum123',
        payloadDump: {
          assets: [
            {
              id: 'asset-1',
              name: 'hero-banner.png',
              type: 'IMAGE',
              meta: { sizeBytes: 1500000 } // Size > 500KB warning
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
                  styleTokens: { padding: 'none' } // Zero spacing warning
                },
                {
                  id: 'comp-grid',
                  name: 'Product Catalog',
                  type: 'ProductGrid',
                  contentKeysBind: ['title-grid'],
                  styleTokens: { cols: { md: 3 } } // Missing xs cols warning
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

    // 3. Execute Baseline Audit Run
    console.log('Executing baseline audit run...');
    const baselineWorkflow = await certificationService.runAudit(businessId, releaseTag, 'WEBSITE', boutique.id);
    
    // Wait for baseline audit to complete
    let completedWorkflow = null;
    let attempts = 0;
    while (attempts < 10) {
      await new Promise(r => setTimeout(r, 2000));
      completedWorkflow = await prisma.certificationWorkflow.findUnique({
        where: { id: baselineWorkflow.id }
      });
      if (completedWorkflow.status === 'COMPLETED' || completedWorkflow.status === 'FAILED') {
        break;
      }
      attempts++;
    }
    assert.strictEqual(completedWorkflow.status, 'COMPLETED');

    // Retrieve baseline report
    const baselineReport = await prisma.boutiqueCertification.findFirst({
      where: { businessId, releaseTag },
      orderBy: { createdAt: 'desc' }
    });

    const baselineScore = baselineReport.overallScore;
    const baselineIssues = baselineReport.issues || [];
    console.log(`✓ Baseline audit complete. Score: ${baselineScore}, Issues Count: ${baselineIssues.length}`);

    // 4. Fetch pending Safe Auto-Fix items
    const pendingSafeFixes = await prisma.autoFixQueueItem.findMany({
      where: { businessId, releaseTag, status: 'PENDING', safetyLevel: 'SAFE_AUTO_FIX' }
    });

    console.log(`Found ${pendingSafeFixes.length} pending SAFE_AUTO_FIX items in queue.`);

    // Apply all safe auto-fixes
    for (const fix of pendingSafeFixes) {
      console.log(`Applying Auto-Fix: "${fix.description}"...`);
      const result = await certificationService.applyAutoFix(fix.id, 'remediation-runner');
      assert.strictEqual(result.success, true);
    }

    // Inspect the release payload dump
    const updatedRelease = await prisma.immutableRelease.findFirst({
      where: { businessId, releaseTag }
    });
    console.log('\n--- UPDATED RELEASE PAYLOAD DUMP ---');
    console.log(JSON.stringify(updatedRelease.payloadDump, null, 2));
    console.log('------------------------------------\n');

    console.log('All safe auto-fixes applied! Triggering re-audit...');

    // 5. Re-run certification audit
    const workflow = await certificationService.runAudit(businessId, releaseTag, 'WEBSITE', boutique.id);
    console.log(`Launched re-audit. Workflow ID: ${workflow.id}`);

    // Wait for the re-audit to complete
    attempts = 0;
    while (attempts < 10) {
      await new Promise(r => setTimeout(r, 2000));
      completedWorkflow = await prisma.certificationWorkflow.findUnique({
        where: { id: workflow.id }
      });
      console.log(`Progress: ${completedWorkflow.progress}%, Status: ${completedWorkflow.status}`);
      if (completedWorkflow.status === 'COMPLETED' || completedWorkflow.status === 'FAILED') {
        break;
      }
      attempts++;
    }

    assert.strictEqual(completedWorkflow.status, 'COMPLETED');

    // 6. Fetch new report
    const newReport = await prisma.boutiqueCertification.findFirst({
      where: { businessId, releaseTag },
      orderBy: { createdAt: 'desc' }
    });

    const newScore = newReport.overallScore;
    const newIssues = newReport.issues || [];

    console.log('\n==================================================');
    console.log('📊 REMEDIATION SUMMARY');
    console.log('==================================================');
    console.log(`Baseline Report ID:  ${baselineReport.id}`);
    console.log(`New Report ID:       ${newReport.id}`);
    console.log(`Previous Score:      ${baselineScore.toFixed(2)}/100`);
    console.log(`New Score:           ${newScore.toFixed(2)}/100`);
    console.log(`Previous Issues:     ${baselineIssues.length}`);
    console.log(`New Issues:          ${newIssues.length}`);
    console.log(`Remediation Status:  ${newReport.status}`);
    console.log('==================================================');

    // Print remaining issues classification
    if (newIssues.length > 0) {
      console.log('\nRemaining Issues List:');
      newIssues.forEach((issue, idx) => {
        console.log(`  ${idx + 1}. [${issue.type}] ${issue.name} (${issue.safetyLevel})`);
      });
    }

    // Verify chat history still works after re-certification
    console.log('\nVerifying chatbot query after re-certification...');
    const reply = await certificationService.askChatbot(newReport.id, 'Explain my remaining warnings');
    console.log(`Chatbot Reply: "${reply.substring(0, 100)}..."`);
    assert.ok(reply.length > 10);

  } catch (err) {
    console.error('❌ Remediation verification failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runRemediation();

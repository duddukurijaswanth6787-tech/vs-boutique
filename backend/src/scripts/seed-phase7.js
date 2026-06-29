const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedPhase7() {
  console.log('=== SEEDING DATABASE FOR PHASE 7 ===');

  try {
    // 1. Seed QA Agent Registries
    const agents = [
      {
        agentKey: 'performance_agent',
        name: 'Performance Auditor',
        category: 'PERFORMANCE',
        executionOrder: 1,
        isEnabled: true,
        version: '1.0.0',
        timeoutMs: 10000,
        configuration: { imageSizeThresholdKb: 500 }
      },
      {
        agentKey: 'seo_agent',
        name: 'SEO & Metadata Auditor',
        category: 'SEO',
        executionOrder: 2,
        isEnabled: true,
        version: '1.0.0',
        timeoutMs: 10000,
        configuration: { requireMetaDescription: true }
      },
      {
        agentKey: 'accessibility_agent',
        name: 'WCAG Accessibility Auditor',
        category: 'ACCESSIBILITY',
        executionOrder: 3,
        isEnabled: true,
        version: '1.0.0',
        timeoutMs: 10000,
        configuration: { wcagStandard: 'WCAG22_AA' }
      },
      {
        agentKey: 'security_agent',
        name: 'CSP & Security Auditor',
        category: 'SECURITY',
        executionOrder: 4,
        isEnabled: true,
        version: '1.0.0',
        timeoutMs: 10000,
        configuration: { blockInlineScripts: true }
      },
      {
        agentKey: 'responsive_agent',
        name: 'Responsive Layout Auditor',
        category: 'UX',
        executionOrder: 5,
        isEnabled: true,
        version: '1.0.0',
        timeoutMs: 10000,
        configuration: { auditedBreakpoints: ['xs', 'sm', 'md', 'lg'] }
      },
      {
        agentKey: 'ux_ui_agent',
        name: 'UI / UX Auditor',
        category: 'UX',
        executionOrder: 6,
        isEnabled: true,
        version: '1.0.0',
        timeoutMs: 10000,
        configuration: { minTouchTargetSizePx: 44 }
      },
      {
        agentKey: 'brand_agent',
        name: 'Brand Alignment Auditor',
        category: 'BRAND',
        executionOrder: 7,
        isEnabled: true,
        version: '1.0.0',
        timeoutMs: 10000,
        configuration: { verifyPrimaryPaletteMatch: true }
      },
      {
        agentKey: 'content_agent',
        name: 'Content Quality Auditor',
        category: 'BRAND',
        executionOrder: 8,
        isEnabled: true,
        version: '1.0.0',
        timeoutMs: 10000,
        configuration: { verifyGrammar: true }
      }
    ];

    console.log('Seeding QA Agent Registry...');
    for (const a of agents) {
      await prisma.qAAgentRegistry.upsert({
        where: { agentKey: a.agentKey },
        update: a,
        create: a
      });
    }
    console.log('Successfully seeded QAAgentRegistry.');

    // 2. Seed Default Global Scoring Profile
    const boutique = await prisma.boutique.findFirst();
    if (!boutique || !boutique.businessId) {
      throw new Error('No active boutique found. Run Phase 6 seeds first.');
    }
    const businessId = boutique.businessId;

    const defaultProfile = {
      name: 'Standard Boutique QA Profile',
      isActive: true,
      agentWeights: {
        performance_agent: 0.15,
        seo_agent: 0.20,
        accessibility_agent: 0.20,
        security_agent: 0.15,
        responsive_agent: 0.10,
        ux_ui_agent: 0.10,
        brand_agent: 0.05,
        content_agent: 0.05
      },
      thresholds: {
        minOverall: 75.0,
        minSeoScore: 80.0,
        minAccessibilityScore: 85.0
      }
    };

    console.log('Seeding Default Certification Profile...');
    await prisma.certificationProfile.upsert({
      where: { businessId_name: { businessId, name: defaultProfile.name } },
      update: { ...defaultProfile, businessId },
      create: { ...defaultProfile, businessId }
    });
    console.log('Successfully seeded CertificationProfile.');

    // 3. Seed Default Workflow Definition
    const workflowDef = {
      name: 'Default Storefront QA Certification',
      description: 'Dynamic multitenant storefront parallel verification workflow.',
      version: 'v1.0.0',
      isEnabled: true,
      targetType: 'WEBSITE',
      stages: [
        {
          stageId: 'load_release',
          stageName: 'Immutable Release Loading',
          executionOrder: 1,
          agentKey: null,
          retryPolicy: { maxAttempts: 3, backoffMs: 1000 },
          timeout: 5000,
          dependsOn: [],
          parallel: false,
          outputSchema: {}
        },
        {
          stageId: 'parallel_audits',
          stageName: 'Multi-Agent Quality Checkers',
          executionOrder: 2,
          agentKey: 'ALL_ENABLED_AGENTS',
          retryPolicy: { maxAttempts: 2, backoffMs: 2000 },
          timeout: 15000,
          dependsOn: ['load_release'],
          parallel: true,
          outputSchema: {}
        },
        {
          stageId: 'visual_review',
          stageName: 'AI Headless Visual Reviewer',
          executionOrder: 3,
          agentKey: null,
          retryPolicy: { maxAttempts: 1, backoffMs: 1000 },
          timeout: 20000,
          dependsOn: ['parallel_audits'],
          parallel: false,
          outputSchema: {}
        },
        {
          stageId: 'scoring_engine',
          stageName: 'Rules Engine & Weighted Scoring',
          executionOrder: 4,
          agentKey: null,
          retryPolicy: { maxAttempts: 3, backoffMs: 500 },
          timeout: 5000,
          dependsOn: ['visual_review'],
          parallel: false,
          outputSchema: {}
        }
      ],
      rollbackPolicy: { autoRollbackOnCriticalFailure: false }
    };

    console.log('Seeding Workflow Definition...');
    await prisma.certificationWorkflowDefinition.upsert({
      where: { name_version: { name: workflowDef.name, version: workflowDef.version } },
      update: workflowDef,
      create: workflowDef
    });
    console.log('Successfully seeded CertificationWorkflowDefinition.');

  } catch (err) {
    console.error('Seeding Phase 7 failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

seedPhase7();

const prisma = require('../../../utils/prisma');

const WORKFLOW_TEMPLATES = [
  {
    slug: 'website-upload',
    name: 'Website Upload',
    description: 'Upload website codebase through verification, certification, AI fix, and validation report pipeline',
    category: 'website-lifecycle',
    engine: 'ai-workflow',
    stages: [
      { name: 'Verification', type: 'verification', order: 1 },
      { name: 'Certification', type: 'certification', order: 2 },
      { name: 'AI Fix', type: 'ai-fix', order: 3 },
      { name: 'Validation Report', type: 'validation-report', order: 4 }
    ],
    estimatedDuration: '10-15 min',
    icon: 'upload',
    color: '#3B82F6'
  },
  {
    slug: 'website-certification',
    name: 'Website Certification',
    description: 'Run a comprehensive certification audit with parallel agents and scoring engine',
    category: 'website-lifecycle',
    engine: 'certification',
    stages: [
      { name: 'Load Release', type: 'load-release', order: 1 },
      { name: 'Parallel Audits', type: 'parallel-audits', order: 2, parallel: true },
      { name: 'Visual Review', type: 'visual-review', order: 3 },
      { name: 'Scoring Engine', type: 'scoring-engine', order: 4 },
      { name: 'Complete', type: 'complete', order: 5 }
    ],
    estimatedDuration: '5-8 min',
    icon: 'check-circle',
    color: '#10B981'
  },
  {
    slug: 'website-publish',
    name: 'Website Publish',
    description: 'Publish a certified website: template publish → business assignment → deploy → health check → notify',
    category: 'website-lifecycle',
    engine: 'template-pipeline',
    stages: [
      { name: 'Template Publish', type: 'template', order: 1 },
      { name: 'Business Assignment', type: 'business-assignment', order: 2 },
      { name: 'Deploy', type: 'deployment', order: 3 }
    ],
    estimatedDuration: '15-20 min',
    icon: 'globe',
    color: '#8B5CF6'
  },
  {
    slug: 'business-onboarding',
    name: 'Business Onboarding',
    description: 'Onboard a new business: create → assign template → configure domain → setup SSL → deploy',
    category: 'onboarding',
    engine: 'ai-workflow',
    stages: [
      { name: 'Create Business', type: 'business-assignment', order: 1 },
      { name: 'Assign Template', type: 'template', order: 2 },
      { name: 'Configure Domain', type: 'deployment', order: 3 },
      { name: 'Setup SSL', type: 'deployment', order: 4 },
      { name: 'Deploy', type: 'deployment', order: 5 }
    ],
    estimatedDuration: '20-30 min',
    icon: 'user-plus',
    color: '#F59E0B'
  },
  {
    slug: 'deploy-website',
    name: 'Deploy Website',
    description: 'Full deployment pipeline: create environment → build → validate → deploy → health check',
    category: 'deployment',
    engine: 'deployment',
    stages: [
      { name: 'Create Environment', type: 'create-environment', order: 1 },
      { name: 'Build', type: 'build', order: 2 },
      { name: 'Validate', type: 'validate', order: 3 },
      { name: 'Deploy', type: 'deploy', order: 4 },
      { name: 'Health Check', type: 'health-check', order: 5 }
    ],
    estimatedDuration: '10-15 min',
    icon: 'rocket',
    color: '#EF4444'
  },
  {
    slug: 'renew-ssl',
    name: 'Renew SSL Certificate',
    description: 'Automated SSL renewal: check expiry → provision cert → verify DNS → deploy → verify',
    category: 'maintenance',
    engine: 'deployment',
    stages: [
      { name: 'Check Expiry', type: 'check-expiry', order: 1 },
      { name: 'Provision Cert', type: 'provision-cert', order: 2 },
      { name: 'Verify DNS', type: 'verify-dns', order: 3 },
      { name: 'Deploy', type: 'deploy', order: 4 },
      { name: 'Verify', type: 'verify', order: 5 }
    ],
    estimatedDuration: '5-10 min',
    icon: 'shield',
    color: '#06B6D4'
  },
  {
    slug: 'backup',
    name: 'Backup System',
    description: 'Full system backup: snapshot DB → archive storage → upload S3 → verify → notify',
    category: 'maintenance',
    engine: 'ai-workflow',
    stages: [
      { name: 'Snapshot DB', type: 'snapshot-db', order: 1 },
      { name: 'Archive Storage', type: 'archive-storage', order: 2 },
      { name: 'Upload S3', type: 'upload-s3', order: 3 },
      { name: 'Verify', type: 'verify', order: 4 },
      { name: 'Notification', type: 'notification', order: 5 }
    ],
    estimatedDuration: '15-30 min',
    icon: 'download',
    color: '#6366F1'
  },
  {
    slug: 'restore',
    name: 'Restore from Backup',
    description: 'Restore system from backup: download → restore DB → restore storage → verify → health check',
    category: 'maintenance',
    engine: 'ai-workflow',
    stages: [
      { name: 'Download Backup', type: 'download-backup', order: 1 },
      { name: 'Restore DB', type: 'restore-db', order: 2 },
      { name: 'Restore Storage', type: 'restore-storage', order: 3 },
      { name: 'Verify', type: 'verify', order: 4 },
      { name: 'Health Check', type: 'health-check', order: 5 }
    ],
    estimatedDuration: '15-30 min',
    icon: 'rotate-ccw',
    color: '#EC4899'
  },
  {
    slug: 'marketplace-publish',
    name: 'Marketplace Publish',
    description: 'Publish an extension to the marketplace: validate manifest → review → approve → publish → notify',
    category: 'marketplace',
    engine: 'ai-workflow',
    stages: [
      { name: 'Validate Manifest', type: 'validate-manifest', order: 1 },
      { name: 'Review', type: 'review', order: 2 },
      { name: 'Approve', type: 'approve', order: 3 },
      { name: 'Publish', type: 'publish', order: 4 },
      { name: 'Notification', type: 'notification', order: 5 }
    ],
    estimatedDuration: '5-10 min',
    icon: 'package',
    color: '#14B8A6'
  },
  {
    slug: 'subscription-renewal',
    name: 'Subscription Renewal',
    description: 'Renew a subscription: charge → verify payment → extend subscription → notify',
    category: 'billing',
    engine: 'ai-workflow',
    stages: [
      { name: 'Charge', type: 'charge', order: 1 },
      { name: 'Verify Payment', type: 'verify-payment', order: 2 },
      { name: 'Extend Subscription', type: 'extend-subscription', order: 3 },
      { name: 'Notification', type: 'notification', order: 4 }
    ],
    estimatedDuration: '1-3 min',
    icon: 'credit-card',
    color: '#F97316'
  },
  {
    slug: 'ai-auto-fix',
    name: 'AI Auto Fix',
    description: 'Automatically detect and fix issues: detect → analyze → generate fix → apply → verify',
    category: 'ai',
    engine: 'ai-core',
    stages: [
      { name: 'Detect Issue', type: 'detect-issue', order: 1 },
      { name: 'Analyze', type: 'analyze', order: 2 },
      { name: 'Generate Fix', type: 'generate-fix', order: 3 },
      { name: 'Apply Fix', type: 'apply-fix', order: 4 },
      { name: 'Verify', type: 'verify', order: 5 }
    ],
    estimatedDuration: '3-5 min',
    icon: 'zap',
    color: '#A855F7'
  },
  {
    slug: 'custom',
    name: 'Custom Workflow',
    description: 'Define your own workflow stages and configure each step manually',
    category: 'custom',
    engine: 'ai-workflow',
    stages: [],
    estimatedDuration: 'Variable',
    icon: 'settings',
    color: '#6B7280'
  }
];

class WorkflowTemplatesService {
  async list() {
    const rows = await prisma.cmsAiSettings.findMany({
      where: { category: 'workflow_template' },
      orderBy: [{ key: 'asc' }]
    });
    const templates = rows.map(r => {
      const val = typeof r.value === 'object' ? r.value : {};
      return { id: r.key.replace('workflow_template_', ''), ...val };
    });
    return templates.length > 0 ? templates : WORKFLOW_TEMPLATES;
  }

  async get(slug) {
    try {
      const row = await prisma.cmsAiSettings.findUnique({
        where: { key: `workflow_template_${slug}` }
      });
      if (row) {
        const val = typeof row.value === 'object' ? row.value : {};
        return { id: slug, ...val };
      }
    } catch (e) { console.error('[Templates Service] get error:', e); }
    return WORKFLOW_TEMPLATES.find(t => t.slug === slug) || null;
  }

  async initializeDefaults() {
    let count = 0;
    for (const tpl of WORKFLOW_TEMPLATES) {
      try {
        await prisma.cmsAiSettings.upsert({
          where: { key: `workflow_template_${tpl.slug}` },
          create: {
            key: `workflow_template_${tpl.slug}`,
            value: tpl,
            category: 'workflow_template',
            description: tpl.description
          },
          update: { value: tpl, description: tpl.description }
        });
        count++;
      } catch (e) { console.error('[Templates Service] initializeDefaults error:', e); }
    }
    return { initialized: true, count };
  }
}

module.exports = new WorkflowTemplatesService();

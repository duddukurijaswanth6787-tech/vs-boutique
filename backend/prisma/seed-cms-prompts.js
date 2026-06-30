const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedPromptBuilders() {
  const builders = [
    { key: 'claude-code', name: 'Claude Code', provider: 'Anthropic', model: 'claude-sonnet-4-20250514', promptFormat: 'markdown', temperature: 0.7, maxTokens: 8192, supportsMarkdown: true, supportsStreaming: true, supportsFiles: true, supportsThinking: true, displayOrder: 1 },
    { key: 'opencode', name: 'OpenCode', provider: 'OpenCode', model: 'deepseek-v4', promptFormat: 'markdown', temperature: 0.7, maxTokens: 8192, supportsMarkdown: true, supportsStreaming: true, supportsFiles: true, supportsThinking: true, displayOrder: 2 },
    { key: 'cursor', name: 'Cursor', provider: 'Anthropic/OpenAI', model: 'claude-sonnet-4-20250514', promptFormat: 'markdown', temperature: 0.7, maxTokens: 8192, supportsMarkdown: true, supportsFiles: true, displayOrder: 3 },
    { key: 'gemini-cli', name: 'Gemini CLI', provider: 'Google', model: 'gemini-2.5-pro', promptFormat: 'markdown', temperature: 0.7, maxTokens: 8192, supportsMarkdown: true, supportsStreaming: true, supportsFiles: true, displayOrder: 4 },
    { key: 'chatgpt', name: 'ChatGPT', provider: 'OpenAI', model: 'gpt-4o', promptFormat: 'markdown', temperature: 0.7, maxTokens: 4096, supportsMarkdown: true, supportsStreaming: true, supportsFiles: true, supportsImages: true, displayOrder: 5 },
    { key: 'bolt', name: 'Bolt', provider: 'Bolt', model: 'bolt-default', promptFormat: 'markdown', temperature: 0.7, maxTokens: 4096, supportsMarkdown: true, displayOrder: 6 },
    { key: 'lovable', name: 'Lovable', provider: 'Lovable', model: 'lovable-default', promptFormat: 'markdown', temperature: 0.7, maxTokens: 4096, supportsMarkdown: true, displayOrder: 7 },
    { key: 'v0', name: 'v0', provider: 'Vercel', model: 'v0-default', promptFormat: 'markdown', temperature: 0.7, maxTokens: 4096, supportsMarkdown: true, displayOrder: 8 },
    { key: 'firebase-ai-studio', name: 'Firebase AI Studio', provider: 'Google', model: 'gemini-2.5-pro', promptFormat: 'markdown', temperature: 0.7, maxTokens: 8192, supportsMarkdown: true, supportsStreaming: true, displayOrder: 9 },
    { key: 'openrouter', name: 'OpenRouter', provider: 'OpenRouter', model: 'multi-model', promptFormat: 'markdown', temperature: 0.7, maxTokens: 4096, supportsMarkdown: true, supportsStreaming: true, displayOrder: 10 }
  ];

  for (const builder of builders) {
    await prisma.cmsAiBuilder.upsert({
      where: { key: builder.key },
      create: builder,
      update: builder
    });
  }
  console.log(`Seeded ${builders.length} AI builders`);
}

async function seedPromptCategories() {
  const categories = [
    { key: 'website', name: 'Website', description: 'Full website generation prompts', displayOrder: 1 },
    { key: 'frontend', name: 'Frontend', description: 'Frontend development prompts', displayOrder: 2 },
    { key: 'backend', name: 'Backend', description: 'Backend development prompts', displayOrder: 3 },
    { key: 'database', name: 'Database', description: 'Database design and migration prompts', displayOrder: 4 },
    { key: 'authentication', name: 'Authentication', description: 'Auth system prompts', displayOrder: 5 },
    { key: 'payments', name: 'Payments', description: 'Payment integration prompts', displayOrder: 6 },
    { key: 'inventory', name: 'Inventory', description: 'Inventory management prompts', displayOrder: 7 },
    { key: 'orders', name: 'Orders', description: 'Order management prompts', displayOrder: 8 },
    { key: 'analytics', name: 'Analytics', description: 'Analytics and reporting prompts', displayOrder: 9 },
    { key: 'seo', name: 'SEO', description: 'SEO optimization prompts', displayOrder: 10 },
    { key: 'accessibility', name: 'Accessibility', description: 'Accessibility compliance prompts', displayOrder: 11 },
    { key: 'performance', name: 'Performance', description: 'Performance optimization prompts', displayOrder: 12 },
    { key: 'responsive', name: 'Responsive', description: 'Responsive design prompts', displayOrder: 13 },
    { key: 'cms', name: 'CMS', description: 'CMS-specific prompts', displayOrder: 14 },
    { key: 'deployment', name: 'Deployment', description: 'Deployment and DevOps prompts', displayOrder: 15 },
    { key: 'security', name: 'Security', description: 'Security hardening prompts', displayOrder: 16 },
    { key: 'documentation', name: 'Documentation', description: 'Documentation generation prompts', displayOrder: 17 },
    { key: 'testing', name: 'Testing', description: 'Testing and QA prompts', displayOrder: 18 }
  ];

  for (const cat of categories) {
    await prisma.cmsPromptCategory.upsert({
      where: { key: cat.key },
      create: cat,
      update: cat
    });
  }
  console.log(`Seeded ${categories.length} prompt categories`);
}

async function seedPromptVariables() {
  const variables = [
    { key: 'businessName', label: 'Business Name', description: 'Name of the business', variableType: 'string', required: true, displayOrder: 1 },
    { key: 'industry', label: 'Industry', description: 'Industry vertical', variableType: 'select', options: ['Boutique', 'Salon', 'Restaurant', 'Hotel', 'Pharmacy', 'Education', 'Real Estate', 'E-commerce'], displayOrder: 2 },
    { key: 'framework', label: 'Framework', description: 'Frontend framework', variableType: 'select', options: ['React', 'Next.js', 'Vue', 'Nuxt', 'Svelte', 'Angular'], displayOrder: 3 },
    { key: 'theme', label: 'Theme', description: 'Visual theme', variableType: 'string', displayOrder: 4 },
    { key: 'primaryColor', label: 'Primary Color', description: 'Primary brand color', variableType: 'string', defaultValue: '#6366f1', displayOrder: 5 },
    { key: 'secondaryColor', label: 'Secondary Color', description: 'Secondary brand color', variableType: 'string', defaultValue: '#ec4899', displayOrder: 6 },
    { key: 'database', label: 'Database', description: 'Database type', variableType: 'select', options: ['PostgreSQL', 'MySQL', 'SQLite', 'MongoDB'], defaultValue: 'PostgreSQL', displayOrder: 7 },
    { key: 'authentication', label: 'Authentication', description: 'Auth provider', variableType: 'select', options: ['JWT', 'NextAuth', 'Clerk', 'Auth0', 'Firebase'], defaultValue: 'JWT', displayOrder: 8 },
    { key: 'paymentGateway', label: 'Payment Gateway', description: 'Payment provider', variableType: 'select', options: ['Razorpay', 'Stripe', 'PayPal', 'None'], defaultValue: 'Razorpay', displayOrder: 9 },
    { key: 'deployment', label: 'Deployment', description: 'Deployment target', variableType: 'select', options: ['Vercel', 'Netlify', 'AWS', 'Railway', 'Docker'], displayOrder: 10 },
    { key: 'storage', label: 'Storage', description: 'File storage provider', variableType: 'select', options: ['AWS S3', 'Cloudflare R2', 'Minio', 'Local'], defaultValue: 'AWS S3', displayOrder: 11 },
    { key: 'language', label: 'Language', description: 'Programming language', variableType: 'select', options: ['TypeScript', 'JavaScript', 'Python'], defaultValue: 'TypeScript', displayOrder: 12 },
    { key: 'builder', label: 'Builder', description: 'AI builder tool', variableType: 'select', options: ['Claude Code', 'OpenCode', 'Cursor', 'ChatGPT', 'Bolt'], displayOrder: 13 }
  ];

  for (const v of variables) {
    const data = {
      ...v,
      options: v.options ? JSON.parse(JSON.stringify(v.options)) : undefined
    };
    await prisma.cmsPromptVariable.upsert({
      where: { key: v.key },
      create: data,
      update: data
    });
  }
  console.log(`Seeded ${variables.length} prompt variables`);
}

async function seedPromptTypes() {
  const types = [
    'website-generation', 'website-upgrade', 'website-fix',
    'performance-fix', 'seo-fix', 'accessibility-fix', 'security-fix',
    'deployment-fix', 'database-fix', 'api-fix', 'component-fix',
    'tailwind-fix', 'react-fix', 'nextjs-fix', 'express-fix',
    'prisma-fix', 'typescript-fix',
    'commerce', 'inventory', 'boutique', 'salon', 'restaurant',
    'hotel', 'pharmacy', 'education', 'real-estate'
  ];

  for (const type of types) {
    await prisma.cmsPromptTag.upsert({
      where: { key: `type-${type}` },
      create: { key: `type-${type}`, name: type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') },
      update: {}
    });
  }
  console.log(`Seeded ${types.length} prompt type tags`);
}

async function main() {
  console.log('Seeding CMS Prompt Library...');
  await seedPromptBuilders();
  await seedPromptCategories();
  await seedPromptVariables();
  await seedPromptTypes();
  console.log('CMS Prompt Library seed complete.');
}

main()
  .catch(e => { console.error('Seed error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());

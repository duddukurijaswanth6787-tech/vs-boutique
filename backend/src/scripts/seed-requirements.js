const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 STARTING ENTERPRISE REQUIREMENTS DATABASE SEEDING...\n');

  // 1. Clean existing requirements & templates
  await prisma.cmsTemplateRequirementJoin.deleteMany({});
  await prisma.cmsRequirementRelation.deleteMany({});
  await prisma.cmsRequirementVersion.deleteMany({});
  await prisma.cmsRequirement.deleteMany({});
  await prisma.cmsRequirementTemplate.deleteMany({});

  console.log('✓ Cleared existing requirements and templates tables.');

  const superAdmin = await prisma.owner.findFirst({ where: { role: 'super_admin' } });
  if (!superAdmin) {
    console.error('❌ Super Admin owner not found. Seed baseline db first.');
    process.exit(1);
  }
  const userId = superAdmin.id;

  // 2. Define Requirements list
  const requirementsData = [
    {
      key: 'req-ssl-enforced',
      name: 'SSL/HTTPS Enforcement',
      category: 'SECURITY',
      priority: 5,
      criticality: 5,
      description: 'Force all traffic to load securely over HTTPS.',
      configSchema: { features: ['https-enforce'] }
    },
    {
      key: 'req-seo-meta',
      name: 'SEO Metadata Injection',
      category: 'SEO',
      priority: 4,
      criticality: 4,
      description: 'Auto-inject SEO meta tags, descriptions, and sitemaps.',
      configSchema: { features: ['seo-meta'] }
    },
    {
      key: 'req-wcag-a11y',
      name: 'WCAG Accessibility Compliance',
      category: 'ACCESSIBILITY',
      priority: 4,
      criticality: 3,
      description: 'Enforce WCAG 2.1 AA accessibility guidelines.',
      configSchema: { features: ['a11y-check'] }
    },
    {
      key: 'req-ecom-license',
      name: 'E-commerce Core License',
      category: 'BUSINESS',
      priority: 5,
      criticality: 5,
      description: 'Required commercial license to enable selling items online.',
      configSchema: { features: ['ecom-license'] }
    },
    {
      key: 'req-ecom-cart',
      name: 'Shopping Cart System',
      category: 'FUNCTIONAL',
      priority: 5,
      criticality: 4,
      description: 'Adds active customer shopping carts and local storage persistence.',
      configSchema: {
        pages: ['/cart'],
        apis: ['POST /api/v1/cart/add', 'DELETE /api/v1/cart/remove'],
        features: ['cart']
      }
    },
    {
      key: 'req-standard-checkout',
      name: 'Standard Payment Checkout',
      category: 'FUNCTIONAL',
      priority: 5,
      criticality: 5,
      description: 'Simple card checkout using standard gateways.',
      configSchema: {
        pages: ['/checkout'],
        apis: ['POST /api/v1/checkout/create-order'],
        features: ['checkout-gateway']
      }
    },
    {
      key: 'req-luxury-checkout',
      name: 'Luxury Tailoring Checkout',
      category: 'FUNCTIONAL',
      priority: 4,
      criticality: 4,
      description: 'Checkout with premium tailoring measurements and custom scheduling.',
      configSchema: {
        pages: ['/checkout/custom'],
        apis: ['POST /api/v1/checkout/custom-order'],
        features: ['checkout-luxury']
      }
    },
    {
      key: 'req-salon-booking',
      name: 'Salon Appointment Booking',
      category: 'FUNCTIONAL',
      priority: 5,
      criticality: 5,
      description: 'Calendar appointment selector for salon service times.',
      configSchema: {
        pages: ['/book'],
        apis: ['POST /api/v1/booking/reserve'],
        features: ['appointments']
      }
    },
    {
      key: 'req-tailor-measurements',
      name: 'Tailor Measurements Capture',
      category: 'FUNCTIONAL',
      priority: 4,
      criticality: 4,
      description: 'Forms fields capturing shoulders, chest, and height specifications.',
      configSchema: {
        pages: ['/measurements'],
        features: ['custom-measurements']
      }
    },
    {
      key: 'req-stripe-api',
      name: 'Stripe Gateway API',
      category: 'API',
      priority: 4,
      criticality: 4,
      description: 'Integrates Stripe payments endpoint services.',
      configSchema: { apis: ['POST /api/v1/stripe/charge'] }
    },
    {
      key: 'req-razorpay-api',
      name: 'Razorpay Gateway API',
      category: 'API',
      priority: 4,
      criticality: 4,
      description: 'Integrates Razorpay payments endpoint services.',
      configSchema: { apis: ['POST /api/v1/razorpay/charge'] }
    },
    {
      key: 'req-ai-chatbot',
      name: 'AI Sales Assistant Chatbot',
      category: 'AI',
      priority: 3,
      criticality: 2,
      description: 'AI chatbot agent engaging store visitors to increase sales.',
      configSchema: { features: ['ai-sales-bot'] }
    }
  ];

  const createdReqs = {};
  for (const req of requirementsData) {
    const item = await prisma.cmsRequirement.create({
      data: {
        ...req,
        status: 'ACTIVE',
        version: 1
      }
    });

    await prisma.cmsRequirementVersion.create({
      data: {
        requirementId: item.id,
        version: 1,
        configSchema: req.configSchema,
        status: 'ACTIVE',
        description: 'Seeded initial version',
        createdBy: userId
      }
    });

    createdReqs[req.key] = item;
  }

  console.log(`✓ Seeded ${Object.keys(createdReqs).length} requirement records.`);

  // 3. Link Relationships
  const relations = [
    // Cart DEPENDS_ON Ecom License
    { source: 'req-ecom-cart', target: 'req-ecom-license', type: 'DEPENDS_ON' },
    // Standard Checkout REQUIRES Cart
    { source: 'req-standard-checkout', target: 'req-ecom-cart', type: 'REQUIRES' },
    // Standard Checkout CONFLICTS_WITH Luxury Checkout
    { source: 'req-standard-checkout', target: 'req-luxury-checkout', type: 'CONFLICTS_WITH' },
    // Tailor measurements RECOMMENDED_WITH Luxury Checkout
    { source: 'req-tailor-measurements', target: 'req-luxury-checkout', type: 'RECOMMENDED_WITH' },
    // Stripe API REPLACES Razorpay API
    { source: 'req-stripe-api', target: 'req-razorpay-api', type: 'REPLACES' }
  ];

  for (const rel of relations) {
    const sourceNode = createdReqs[rel.source];
    const targetNode = createdReqs[rel.target];
    if (sourceNode && targetNode) {
      await prisma.cmsRequirementRelation.create({
        data: {
          sourceRequirementId: sourceNode.id,
          targetRequirementId: targetNode.id,
          type: rel.type
        }
      });
    }
  }

  console.log(`✓ Seeded ${relations.length} requirement relationship edges.`);

  // 4. Seed Presets templates
  const templates = [
    {
      key: 'template-boutique',
      name: 'Antair Boutique Preset',
      description: 'Preconfigured requirements for digital fashion boutiques.',
      reqs: ['req-ssl-enforced', 'req-seo-meta', 'req-ecom-cart', 'req-luxury-checkout', 'req-tailor-measurements']
    },
    {
      key: 'template-salon',
      name: 'Antair Salon Preset',
      description: 'Preconfigured calendar appointment and client scheduling preset.',
      reqs: ['req-ssl-enforced', 'req-seo-meta', 'req-salon-booking']
    },
    {
      key: 'template-tailor',
      name: 'Antair Custom Tailor Preset',
      description: 'Premium custom fit tailoring measurements selector.',
      reqs: ['req-ssl-enforced', 'req-seo-meta', 'req-tailor-measurements']
    },
    {
      key: 'template-ecommerce',
      name: 'Antair Generic E-commerce Store',
      description: 'Generic shopping store with Stripe standard payments gateway.',
      reqs: ['req-ssl-enforced', 'req-seo-meta', 'req-ecom-cart', 'req-standard-checkout', 'req-stripe-api']
    }
  ];

  for (const t of templates) {
    const item = await prisma.cmsRequirementTemplate.create({
      data: {
        key: t.key,
        name: t.name,
        description: t.description
      }
    });

    for (const reqKey of t.reqs) {
      const reqNode = createdReqs[reqKey];
      if (reqNode) {
        await prisma.cmsTemplateRequirementJoin.create({
          data: {
            templateId: item.id,
            requirementId: reqNode.id
          }
        });
      }
    }
  }

  console.log(`✓ Seeded ${templates.length} preset templates.`);
  console.log('\n🎉 ENTERPRISE REQUIREMENTS DATABASE SEEDING COMPLETED SUCCESSFULLY!');
}

seed().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});

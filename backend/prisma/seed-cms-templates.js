const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedCategories() {
  const categories = [
    { key: 'ecommerce', name: 'E-Commerce', displayOrder: 1 },
    { key: 'salon', name: 'Salon & Beauty', displayOrder: 2 },
    { key: 'restaurant', name: 'Restaurant & Cafe', displayOrder: 3 },
    { key: 'hotel', name: 'Hotel & Hospitality', displayOrder: 4 },
    { key: 'pharmacy', name: 'Pharmacy & Healthcare', displayOrder: 5 },
    { key: 'education', name: 'Education & Learning', displayOrder: 6 },
    { key: 'real-estate', name: 'Real Estate', displayOrder: 7 },
    { key: 'portfolio', name: 'Portfolio & Personal', displayOrder: 8 }
  ];

  for (const cat of categories) {
    await prisma.cmsTemplateCategory.upsert({
      where: { key: cat.key },
      create: cat,
      update: cat
    });
  }
  console.log(`Seeded ${categories.length} template categories`);
}

async function seedTags() {
  const tags = [
    'responsive-design', 'seo-optimized', 'multi-language', 'dark-mode', 'analytics-ready',
    'payment-integrated', 'booking-system', 'blog-enabled', 'social-integration', 'pwa-ready'
  ];

  for (const key of tags) {
    await prisma.cmsTemplateTag.upsert({
      where: { key },
      create: { key, name: key.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') },
      update: {}
    });
  }
  console.log(`Seeded ${tags.length} template tags`);
}

async function seedTemplates() {
  const ecomCat = await prisma.cmsTemplateCategory.findUnique({ where: { key: 'ecommerce' } });
  const salonCat = await prisma.cmsTemplateCategory.findUnique({ where: { key: 'salon' } });
  const restCat = await prisma.cmsTemplateCategory.findUnique({ where: { key: 'restaurant' } });

  const tagMap = {};
  const tagKeys = ['responsive-design', 'seo-optimized', 'payment-integrated', 'pwa-ready', 'booking-system', 'social-integration', 'analytics-ready'];
  for (const key of tagKeys) {
    tagMap[key] = await prisma.cmsTemplateTag.findUnique({ where: { key } });
  }

  const templates = [
    {
      name: 'Modern E-Commerce Store',
      industry: 'ecommerce',
      tier: 'PROFESSIONAL',
      status: 'PUBLISHED',
      isFeatured: true,
      categoryId: ecomCat.id,
      description: 'A complete e-commerce solution with product catalog, cart, checkout, payment integration, order management, and admin dashboard.',
      thumbnail: '/assets/templates/ecommerce-thumb.jpg',
      previewImage: '/assets/templates/ecommerce-preview.jpg',
      liveDemoUrl: 'https://demo.example.com/ecommerce',
      manifest: {
        pages: ['Home', 'Shop', 'ProductDetail', 'Cart', 'Checkout', 'Orders', 'Admin'],
        components: ['Navbar', 'Footer', 'ProductCard', 'CartDrawer', 'SearchBar'],
        apis: ['products', 'cart', 'orders', 'payments', 'auth'],
        databaseModels: ['Product', 'Category', 'Order', 'User', 'Cart'],
        environmentVariables: ['DATABASE_URL', 'PAYMENT_KEY', 'STORAGE_BUCKET'],
        seoRules: 'Meta tags, Open Graph, sitemap.xml, robots.txt',
        securityRules: 'HTTPS enforced, XSS protection, CSRF tokens, Rate limiting',
        dependencies: ['react', 'nextjs', 'prisma', 'stripe', 'tailwindcss'],
        sdkVersion: '1.0.0',
        generatedArtifacts: ['api/', 'components/', 'pages/', 'styles/', 'utils/']
      },
      tags: ['responsive-design', 'seo-optimized', 'payment-integrated', 'pwa-ready'],
      builderCompat: ['claude-code', 'opencode', 'cursor', 'chatgpt']
    },
    {
      name: 'Salon & Beauty Booking',
      industry: 'salon',
      tier: 'STARTER',
      status: 'PUBLISHED',
      isFeatured: false,
      categoryId: salonCat.id,
      description: 'A salon website with online booking, service catalog, staff management, gallery, and customer reviews.',
      thumbnail: '/assets/templates/salon-thumb.jpg',
      previewImage: '/assets/templates/salon-preview.jpg',
      liveDemoUrl: 'https://demo.example.com/salon',
      manifest: {
        pages: ['Home', 'Services', 'Booking', 'Staff', 'Gallery', 'Reviews', 'Contact'],
        components: ['Navbar', 'Footer', 'ServiceCard', 'BookingForm', 'StaffCard', 'ReviewCard'],
        apis: ['services', 'booking', 'staff', 'reviews', 'contact'],
        databaseModels: ['Service', 'Booking', 'Staff', 'Review', 'Customer'],
        environmentVariables: ['DATABASE_URL', 'BOOKING_API_KEY'],
        seoRules: 'Meta tags, Open Graph, local business schema',
        securityRules: 'HTTPS enforced, XSS protection, CSRF tokens',
        dependencies: ['react', 'nextjs', 'prisma', 'tailwindcss'],
        sdkVersion: '1.0.0',
        generatedArtifacts: ['api/', 'components/', 'pages/', 'styles/']
      },
      tags: ['responsive-design', 'booking-system', 'social-integration'],
      builderCompat: ['claude-code', 'opencode', 'bolt', 'lovable']
    },
    {
      name: 'Restaurant & Cafe Menu',
      industry: 'restaurant',
      tier: 'FREE',
      status: 'PUBLISHED',
      isFeatured: true,
      categoryId: restCat.id,
      description: 'A restaurant website with menu display, online ordering, table reservation, and location information.',
      thumbnail: '/assets/templates/restaurant-thumb.jpg',
      previewImage: '/assets/templates/restaurant-preview.jpg',
      liveDemoUrl: 'https://demo.example.com/restaurant',
      manifest: {
        pages: ['Home', 'Menu', 'Reservation', 'Gallery', 'Contact', 'About'],
        components: ['Navbar', 'Footer', 'MenuItem', 'ReservationForm', 'GalleryGrid', 'Map'],
        apis: ['menu', 'reservations', 'gallery', 'contact'],
        databaseModels: ['MenuItem', 'Category', 'Reservation', 'Gallery'],
        environmentVariables: ['DATABASE_URL'],
        seoRules: 'Meta tags, Open Graph, restaurant schema',
        securityRules: 'HTTPS enforced, XSS protection',
        dependencies: ['react', 'nextjs', 'prisma', 'tailwindcss'],
        sdkVersion: '1.0.0',
        generatedArtifacts: ['api/', 'components/', 'pages/', 'styles/']
      },
      tags: ['responsive-design', 'booking-system', 'analytics-ready'],
      builderCompat: ['claude-code', 'opencode', 'chatgpt', 'gemini-cli']
    }
  ];

  for (const t of templates) {
    const { tags, builderCompat, ...fields } = t;

    const resolvedTagIds = tags.map(key => ({ tagId: tagMap[key]?.id })).filter(x => x.tagId);

    const template = await prisma.cmsTemplate.create({
      data: {
        ...fields,
        version: 1,
        createdBy: null,
        updatedBy: null,
        tags: {
          create: resolvedTagIds
        },
        builderCompat: {
          create: builderCompat.map(key => ({ builderKey: key }))
        }
      }
    });

    await prisma.cmsTemplateVersion.create({
      data: {
        templateId: template.id,
        version: 1,
        name: t.name,
        description: t.description,
        manifest: t.manifest,
        thumbnail: t.thumbnail,
        previewImage: t.previewImage,
        liveDemoUrl: t.liveDemoUrl,
        changeNotes: 'Initial version',
        createdBy: null
      }
    });

    console.log(`  Created template: ${template.name} (${template.id})`);
  }

  console.log(`Created ${templates.length} templates`);
}

async function main() {
  console.log('Seeding CMS Template Library...');
  await seedCategories();
  await seedTags();
  await seedTemplates();
  console.log('CMS Template Library seed complete.');
}

main()
  .catch(e => { console.error('Seed error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());

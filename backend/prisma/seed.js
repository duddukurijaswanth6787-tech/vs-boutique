const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');
    
    // Hash Super Admin Password
    const hashedPassword = await bcrypt.hash('admin@123', 10);
    
    // Create Super Admin Owner
    const admin = await prisma.owner.upsert({
        where: { email: 'admin@vsboutique.com' },
        update: {},
        create: {
            ownerName: 'Super Admin',
            username: 'superadmin',
            email: 'admin@vsboutique.com',
            mobileNumber: '9999999999',
            password: hashedPassword,
            role: 'super_admin',
            status: 'Active',
            mustResetPassword: false,
            emailVerified: true,
            
            // Flattened Permissions
            canEditProfile: true,
            canEditServices: true,
            canEditGallery: true,
            canManageDesigns: true,
            canManageOrders: true,
            canManageBookings: true,
            canManageReviews: true,
            canManageMedia: true,
            canViewAnalytics: true
        }
    });

    console.log(`✅ Super Admin created/upserted with ID: ${admin.id}`);

    // Seed default subscription plans
    const plansData = [
        {
            name: 'FREE',
            planCode: 'free_monthly',
            description: 'Free subscription plan',
            monthlyPrice: 0.00,
            yearlyPrice: 0.00,
            trialPeriodDays: 0,
            gracePeriodDays: 3,
            sortOrder: 0,
            isActive: true,
            isFeatured: false,
            recommendedPlan: false,
            allowDirectSelling: true,
            allowCustomTailoring: false,
            maxReadyMadeProducts: 20,
            maxCustomDesigns: 0,
            maxOrdersPerMonth: 50,
            maxBookingsPerMonth: 0,
            maxCustomers: -1,
            maxMeasurements: 0,
            maxGalleryImages: 20,
            maxStaffAccounts: 1,
            maxBranches: 1,
            canManageProducts: true,
            canManageReviews: true,
            canUseCustomMeasurements: false,
            canCreateCustomOrders: false,
            canManageCustomers: true,
            canManageCustomerNotes: true,
            canManageStaff: true,
            canListInMarketplace: true
        },
        {
            name: 'STARTER',
            planCode: 'starter_monthly',
            description: 'Starter subscription plan',
            monthlyPrice: 999.00,
            yearlyPrice: 9990.00,
            trialPeriodDays: 14,
            gracePeriodDays: 3,
            sortOrder: 1,
            isActive: true,
            isFeatured: false,
            recommendedPlan: false,
            allowDirectSelling: true,
            allowCustomTailoring: false,
            maxReadyMadeProducts: 100,
            maxCustomDesigns: 0,
            maxOrdersPerMonth: 500,
            maxBookingsPerMonth: 0,
            maxCustomers: -1,
            maxMeasurements: 0,
            maxGalleryImages: 200,
            maxStaffAccounts: 5,
            maxBranches: 1,
            canManageProducts: true,
            canManageReviews: true,
            canUseCustomMeasurements: false,
            canCreateCustomOrders: false,
            canManageCustomers: true,
            canManageCustomerNotes: true,
            canManageStaff: true,
            canListInMarketplace: true,
            canViewAnalytics: true
        },
        {
            name: 'PRO',
            planCode: 'pro_monthly',
            description: 'Pro subscription plan',
            monthlyPrice: 2999.00,
            yearlyPrice: 29990.00,
            trialPeriodDays: 14,
            gracePeriodDays: 3,
            sortOrder: 2,
            isActive: true,
            isFeatured: true,
            recommendedPlan: true,
            allowDirectSelling: true,
            allowCustomTailoring: true,
            maxReadyMadeProducts: 999999,
            maxCustomDesigns: 999999,
            maxOrdersPerMonth: 999999,
            maxBookingsPerMonth: 100,
            maxCustomers: -1,
            maxMeasurements: -1,
            maxGalleryImages: 999999,
            maxStaffAccounts: 20,
            maxBranches: 2,
            canManageProducts: true,
            canManageStock: true,
            canManageReviews: true,
            canUseCustomMeasurements: true,
            canCreateCustomOrders: true,
            canManageTailoringOrders: true,
            canManageCustomers: true,
            canManageCustomerNotes: true,
            canManageStaff: true,
            canListInMarketplace: true,
            canFeatureBoutique: true,
            canCreateCampaigns: true,
            canUseAiAssistant: true,
            canViewAnalytics: true
        },
        {
            name: 'ENTERPRISE',
            planCode: 'enterprise_monthly',
            description: 'Enterprise subscription plan',
            monthlyPrice: 9999.00,
            yearlyPrice: 99990.00,
            trialPeriodDays: 14,
            gracePeriodDays: 3,
            sortOrder: 3,
            isActive: true,
            isFeatured: false,
            recommendedPlan: false,
            allowDirectSelling: true,
            allowCustomTailoring: true,
            maxReadyMadeProducts: 999999,
            maxCustomDesigns: 999999,
            maxOrdersPerMonth: 999999,
            maxBookingsPerMonth: 999999,
            maxCustomers: -1,
            maxMeasurements: -1,
            maxGalleryImages: 999999,
            maxStaffAccounts: 999999,
            maxBranches: 999999,
            canManageProducts: true,
            canManageStock: true,
            canManageShipping: true,
            canManageReturns: true,
            canManageCoupons: true,
            canManageOffers: true,
            canManageProductVariants: true,
            canManageReviews: true,
            canUseCustomMeasurements: true,
            canUseMeasurementHistory: true,
            canCreateCustomOrders: true,
            canManageTailoringOrders: true,
            canManageProductionWorkflow: true,
            canManageTailorAssignments: true,
            canManageCustomers: true,
            canManageCustomerNotes: true,
            canManageRewards: true,
            canManageReferrals: true,
            canManageWallet: true,
            canManageStaff: true,
            canManageAttendance: true,
            canManageTasks: true,
            canManagePayroll: true,
            canUseWhatsAppMarketing: true,
            canUseSmsMarketing: true,
            canUseEmailMarketing: true,
            canCreateCampaigns: true,
            canViewAnalytics: true,
            canViewAdvancedAnalytics: true,
            canViewFinancialReports: true,
            canListInMarketplace: true,
            canFeatureProducts: true,
            canFeatureBoutique: true,
            canSellPremiumDesigns: true,
            canUseAiAssistant: true,
            canUseAiRecommendations: true,
            canUseAiDesignSuggestions: true,
            canUseApiAccess: true,
            canUseCustomBranding: true,
            canUseWhiteLabel: true,
            canUseMultiBranch: true
        }
    ];

    const plans = {};
    for (const planData of plansData) {
        let plan = await prisma.subscriptionPlan.findFirst({
            where: { name: planData.name }
        });
        if (plan) {
            plan = await prisma.subscriptionPlan.update({
                where: { id: plan.id },
                data: planData
            });
        } else {
            plan = await prisma.subscriptionPlan.create({
                data: planData
            });
        }
        plans[planData.name] = plan;
        console.log(`Plan ${planData.name} created/updated.`);
    }

    // Assign existing boutiques to FREE plan automatically if they don't have a subscription
    const boutiques = await prisma.boutique.findMany();
    const freePlan = plans['FREE'];
    const now = new Date();
    const hundredYearsLater = new Date();
    hundredYearsLater.setFullYear(now.getFullYear() + 100);

    for (const boutique of boutiques) {
        const existingSub = await prisma.boutiqueSubscription.findFirst({
            where: { boutiqueId: boutique.id }
        });

        if (!existingSub) {
            await prisma.boutiqueSubscription.create({
                data: {
                    boutiqueId: boutique.id,
                    planId: freePlan.id,
                    status: 'ACTIVE',
                    startDate: now,
                    endDate: hundredYearsLater,
                    trialEndsAt: null,
                    currentReadyMadeProductsCount: 0,
                    currentCustomDesignsCount: 0,
                    currentOrderCount: 0,
                    currentGalleryImages: 0,
                    currentStaffAccounts: 0
                }
            });
            console.log(`Assigned Boutique "${boutique.name}" to FREE plan.`);
        }
    }

    // Seed Categories
    console.log('Seeding categories...');
    const categories = await Promise.all([
      prisma.category.upsert({
        where: { name: 'Sherwani & Indo-Western' },
        update: {},
        create: { name: 'Sherwani & Indo-Western', description: 'Traditional sherwanis, Indo-western suits for grooms and guests', sortOrder: 1 }
      }),
      prisma.category.upsert({
        where: { name: 'Lehenga & Bridal Wear' },
        update: {},
        create: { name: 'Lehenga & Bridal Wear', description: 'Bridal lehengas, reception gowns, and wedding trousseau', sortOrder: 2 }
      }),
      prisma.category.upsert({
        where: { name: 'Kurta & Ethnic Sets' },
        update: {},
        create: { name: 'Kurta & Ethnic Sets', description: 'Kurtas, pajamas, and coordinated ethnic sets for men', sortOrder: 3 }
      }),
      prisma.category.upsert({
        where: { name: 'Saree & Blouse' },
        update: {},
        create: { name: 'Saree & Blouse', description: 'Handloom sarees, designer blouses, and saree draping', sortOrder: 4 }
      }),
      prisma.category.upsert({
        where: { name: 'Western & Indo-Western' },
        update: {},
        create: { name: 'Western & Indo-Western', description: 'Western suits, gowns, and fusion wear', sortOrder: 5 }
      }),
      prisma.category.upsert({
        where: { name: 'Kids Wear' },
        update: {},
        create: { name: 'Kids Wear', description: 'Traditional and western wear for children', sortOrder: 6 }
      }),
      prisma.category.upsert({
        where: { name: 'Accessories' },
        update: {},
        create: { name: 'Accessories', description: 'Turbans, stoles, jewelry, and other fashion accessories', sortOrder: 7 }
      }),
    ]);
    console.log(`✅ ${categories.length} categories seeded`);

    // Seed SubCategories
    console.log('Seeding subcategories...');
    const catMap = {};
    categories.forEach(c => { catMap[c.name] = c; });

    const subCategoryData = [
      { cat: 'Sherwani & Indo-Western', subs: ['Classic Sherwani', 'Indo-Western Suit', 'Jodhpuri Suit', 'Bandhgala', 'Wedding Sherwani', 'Reception Suit'] },
      { cat: 'Lehenga & Bridal Wear', subs: ['Bridal Lehenga', 'Reception Gown', 'Engagement Outfit', 'Mehendi Ensemble', 'Sangeet Lehenga', 'Cocktail Dress'] },
      { cat: 'Kurta & Ethnic Sets', subs: ['Cotton Kurta', 'Silk Kurta', 'Kurta Pajama Set', 'Dhoti Kurta', 'Pathani Suit', 'Nehru Jacket'] },
      { cat: 'Saree & Blouse', subs: ['Handloom Saree', 'Designer Saree', 'Silk Saree', 'Printed Saree', 'Blouse Stitching', 'Saree Draping'] },
      { cat: 'Western & Indo-Western', subs: ['Blazer & Suit', 'Western Gown', 'Crop Top & Skirt', 'Jumpsuit', 'Fusion Dress', 'Pant & Shirt'] },
      { cat: 'Kids Wear', subs: ['Boys Sherwani', 'Girls Lehenga', 'Kids Kurta', 'Kids Indo-Western', 'Kids Western', 'School Uniform'] },
      { cat: 'Accessories', subs: ['Turban / Pagdi', 'Stole / Dupatta', 'Fashion Jewelry', 'Cufflinks', 'Footwear', 'Brooch / Lapel Pin'] },
    ];

    for (const { cat, subs } of subCategoryData) {
      const category = catMap[cat];
      if (!category) continue;
      for (const name of subs) {
        await prisma.subCategory.upsert({
          where: { categoryId_name: { categoryId: category.id, name } },
          update: {},
          create: { categoryId: category.id, name }
        });
      }
    }
    console.log('✅ SubCategories seeded');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

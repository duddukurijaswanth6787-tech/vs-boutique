const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Delete order (reverse dependency)
const deleteOrder = [
  'auditLog',
  'notificationReceipt',
  'notificationCampaign',
  'notificationTemplate',
  'supportTicketAdminNote',
  'supportTicketMessage',
  'supportTicket',
  'review',
  'customerAddress',
  'notification',
  'measurement',
  'bookingHistory',
  'booking',
  'payout',
  'payment',
  'orderHistory',
  'order',
  'wishlist',
  'design',
  'subscriptionBillingHistory',
  'boutiqueSubscription',
  'ownerFeaturePermission'
];

// Insert order (forward dependency)
const insertOrder = [
  'user',
  'platformSetting',
  'subscriptionPlan',
  'activity',
  'ownerFeaturePermission',
  'boutiqueSubscription',
  'subscriptionBillingHistory',
  'design',
  'wishlist',
  'order',
  'orderHistory',
  'payment',
  'payout',
  'booking',
  'bookingHistory',
  'measurement',
  'notification',
  'customerAddress',
  'review',
  'supportTicket',
  'supportTicketMessage',
  'supportTicketAdminNote',
  'notificationTemplate',
  'notificationCampaign',
  'notificationReceipt',
  'auditLog'
];

async function run() {
  const backupPath = path.join(__dirname, 'postgres-backup.json');
  if (!fs.existsSync(backupPath)) {
    console.error(`❌ Error: Backup file not found at ${backupPath}`);
    process.exit(1);
  }

  console.log('🔄 Loading backup file...');
  const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

  try {
    console.log('🚨 Clearing existing target database tables...');
    for (const modelName of deleteOrder) {
      await prisma[modelName].deleteMany({});
    }

    // Break circular ref between Boutique & Owner
    await prisma.boutique.updateMany({ data: { ownerId: null } });
    await prisma.owner.deleteMany({});
    await prisma.boutique.deleteMany({});
    await prisma.activity.deleteMany({});
    await prisma.subscriptionPlan.deleteMany({});
    await prisma.platformSetting.deleteMany({});
    await prisma.user.deleteMany({});
    console.log('✅ Target database tables cleared successfully.');

    // 1. Insert standalone tables (excluding subscriptionPlan)
    const standalone = ['user', 'platformSetting', 'activity'];
    for (const modelName of standalone) {
      if (backupData[modelName] && backupData[modelName].length > 0) {
        console.log(`Inserting ${backupData[modelName].length} records for ${modelName}...`);
        await prisma[modelName].createMany({
          data: backupData[modelName]
        });
      }
    }

    // 1b. Seed new dynamic Subscription Plans
    console.log('🌱 Seeding new dynamic subscription plans...');
    const plansToCreate = [
      {
        name: 'FREE',
        planCode: 'free_tier',
        description: 'Free plan for new boutiques - Direct Selling Only',
        monthlyPrice: 0,
        yearlyPrice: 0,
        trialPeriodDays: 14,
        gracePeriodDays: 3,
        sortOrder: 0,
        isActive: true,
        recommendedPlan: false,
        allowDirectSelling: true,
        allowCustomTailoring: false,
        maxReadyMadeProducts: 50,
        maxCustomDesigns: 0,
        maxOrdersPerMonth: 100,
        maxBookingsPerMonth: 0,
        maxCustomers: 50,
        maxMeasurements: 0,
        maxGalleryImages: 20,
        maxStaffAccounts: 1,
        maxBranches: 1,
        canManageProducts: true,
        canManageStock: true,
        canManageReviews: true,
        canManageCustomers: true,
        canManageStaff: true
      },
      {
        name: 'STARTER',
        planCode: 'starter_tier',
        description: 'Starter plan for growing storefronts - Direct Selling Only',
        monthlyPrice: 999,
        yearlyPrice: 9999,
        trialPeriodDays: 14,
        gracePeriodDays: 3,
        sortOrder: 1,
        isActive: true,
        recommendedPlan: false,
        allowDirectSelling: true,
        allowCustomTailoring: false,
        maxReadyMadeProducts: 200,
        maxCustomDesigns: 0,
        maxOrdersPerMonth: 300,
        maxBookingsPerMonth: 0,
        maxCustomers: 500,
        maxMeasurements: 0,
        maxGalleryImages: 50,
        maxStaffAccounts: 3,
        maxBranches: 1,
        canManageProducts: true,
        canManageStock: true,
        canManageReviews: true,
        canManageCoupons: true,
        canManageOffers: true,
        canManageCustomers: true,
        canManageCustomerNotes: true,
        canManageStaff: true,
        canViewAnalytics: true
      },
      {
        name: 'PRO',
        planCode: 'pro_tier',
        description: 'Professional plan - Direct Selling + Custom Tailoring',
        monthlyPrice: 2499,
        yearlyPrice: 24999,
        trialPeriodDays: 14,
        gracePeriodDays: 3,
        sortOrder: 2,
        isActive: true,
        recommendedPlan: true,
        allowDirectSelling: true,
        allowCustomTailoring: true,
        maxReadyMadeProducts: -1,
        maxCustomDesigns: 500,
        maxOrdersPerMonth: -1,
        maxBookingsPerMonth: 200,
        maxCustomers: -1,
        maxMeasurements: -1,
        maxGalleryImages: 200,
        maxStaffAccounts: 10,
        maxBranches: 3,
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
        canUseWhatsAppMarketing: true,
        canUseSmsMarketing: true,
        canUseEmailMarketing: true,
        canCreateCampaigns: true,
        canViewAnalytics: true,
        canViewAdvancedAnalytics: true,
        canListInMarketplace: true,
        canFeatureProducts: true,
        canFeatureBoutique: true,
        canUseAiAssistant: true,
        canUseAiRecommendations: true,
        canUseCustomBranding: true
      },
      {
        name: 'ENTERPRISE',
        planCode: 'enterprise_tier',
        description: 'Enterprise plan - Full Access Multi-Branch',
        monthlyPrice: 4999,
        yearlyPrice: 49999,
        trialPeriodDays: 14,
        gracePeriodDays: 3,
        sortOrder: 3,
        isActive: true,
        recommendedPlan: false,
        allowDirectSelling: true,
        allowCustomTailoring: true,
        maxReadyMadeProducts: -1,
        maxCustomDesigns: -1,
        maxOrdersPerMonth: -1,
        maxBookingsPerMonth: -1,
        maxCustomers: -1,
        maxMeasurements: -1,
        maxGalleryImages: -1,
        maxStaffAccounts: -1,
        maxBranches: -1,
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

    const seededPlans = [];
    for (const p of plansToCreate) {
      const created = await prisma.subscriptionPlan.create({ data: p });
      seededPlans.push(created);
    }
    console.log(`✅ Successfully seeded ${seededPlans.length} dynamic subscription plans.`);

    // Map old Plan IDs to new Plan IDs using name matching
    const oldPlans = backupData.subscriptionPlan || [];
    const planIdMap = {};
    oldPlans.forEach(oldP => {
      const match = seededPlans.find(newP => newP.name === oldP.name);
      if (match) {
        planIdMap[oldP.id] = match.id;
      }
    });

    // 2. Insert Boutiques (without circular ownerId link initially)
    if (backupData.boutique && backupData.boutique.length > 0) {
      console.log(`Inserting ${backupData.boutique.length} records for boutique (Phase 1)...`);
      const boutiquesClean = backupData.boutique.map(b => {
        const copy = { ...b };
        delete copy.ownerId; // insert without ownerId initially to prevent FK constraint error
        return copy;
      });
      await prisma.boutique.createMany({
        data: boutiquesClean
      });
    }

    // 3. Insert Owners
    if (backupData.owner && backupData.owner.length > 0) {
      console.log(`Inserting ${backupData.owner.length} records for owner...`);
      await prisma.owner.createMany({
        data: backupData.owner
      });
    }

    // 4. Link primary owners back to boutiques
    if (backupData.boutique && backupData.boutique.length > 0) {
      console.log('Linking primary owners back to boutiques (Phase 2)...');
      for (const b of backupData.boutique) {
        if (b.ownerId) {
          await prisma.boutique.update({
            where: { id: b.id },
            data: { ownerId: b.ownerId }
          });
        }
      }
    }

    // 5. Insert rest of the tables
    for (const modelName of insertOrder) {
      if (modelName === 'user' || modelName === 'platformSetting' || modelName === 'subscriptionPlan' || modelName === 'activity') {
        continue; // already inserted
      }
      const records = backupData[modelName];
      if (records && records.length > 0) {
        console.log(`Inserting ${records.length} records for ${modelName}...`);

        let recordsToInsert = records.map(r => {
          const parsedRecord = { ...r };
          // Parse ISO date strings back into Date objects for Prisma
          for (const key of Object.keys(parsedRecord)) {
            if (typeof parsedRecord[key] === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(parsedRecord[key])) {
              parsedRecord[key] = new Date(parsedRecord[key]);
            }
          }
          return parsedRecord;
        });

        // Intercept BoutiqueSubscription to map planIds and currentDesignCount -> currentCustomDesignsCount
        if (modelName === 'boutiqueSubscription') {
          recordsToInsert = recordsToInsert.map(sub => {
            const mappedPlanId = planIdMap[sub.planId] || sub.planId;
            const customDesignsCount = sub.currentDesignCount !== undefined ? sub.currentDesignCount : 0;
            
            // Delete old field name to match new schema
            delete sub.currentDesignCount;

            return {
              ...sub,
              planId: mappedPlanId,
              currentCustomDesignsCount: customDesignsCount
            };
          });
        }

        await prisma[modelName].createMany({
          data: recordsToInsert
        });
      }
    }

    console.log('\n🌟 DATABASE RESTORE COMPLETED SUCCESSFULLY! 🌟');
    process.exit(0);
  } catch (err) {
    console.error('❌ Database restore failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();

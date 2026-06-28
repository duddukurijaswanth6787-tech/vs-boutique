const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// In dependency order
const models = [
  'user',
  'platformSetting',
  'subscriptionPlan',
  'activity',
  'boutique',
  'owner',
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
  console.log('🔄 Starting PostgreSQL database export...');
  const backupData = {};

  try {
    for (const modelName of models) {
      console.log(`Fetching table: ${modelName}...`);
      const records = await prisma[modelName].findMany();
      backupData[modelName] = records;
      console.log(`✅ Fetched ${records.length} records for ${modelName}.`);
    }

    const backupPath = path.join(__dirname, 'postgres-backup.json');
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf8');
    console.log(`\n🎉 Success! Database backup saved to: ${backupPath}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Database export failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();

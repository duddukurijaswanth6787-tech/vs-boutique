const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Connecting to database and enabling uuid-ossp extension...');
  try {
    await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    console.log('✅ Extension uuid-ossp enabled successfully!');
  } catch (err) {
    console.error('❌ Failed to enable extension:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

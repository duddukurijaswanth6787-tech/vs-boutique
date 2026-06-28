const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.owner.findFirst({
    where: { username: 'superadmin' }
  });

  if (!user) {
    console.log('User superadmin not found.');
    process.exit(1);
  }

  const isMatch1 = await bcrypt.compare('admin@123', user.password);
  console.log('Does password match "admin@123"?', isMatch1);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

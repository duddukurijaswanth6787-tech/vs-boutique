import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL || '' });
const prisma = new PrismaClient({ adapter });

const SYSTEM_ROLES = [
  { name: 'super_admin', displayName: 'Super Admin', description: 'Full system access', scope: 'GLOBAL' as const, hierarchy: 100, isSystem: true },
  { name: 'admin', displayName: 'Admin', description: 'Administrative access', scope: 'GLOBAL' as const, hierarchy: 80, isSystem: true },
  { name: 'staff', displayName: 'Staff', description: 'Staff member access', scope: 'DOMAIN' as const, hierarchy: 50, isSystem: true },
  { name: 'customer', displayName: 'Customer', description: 'Customer access', scope: 'CUSTOM' as const, hierarchy: 10, isSystem: true },
];

async function main() {
  console.log('Seeding system settings...');
  await prisma.systemSetting.upsert({
    where: { key: 'platform_name' },
    update: {},
    create: { key: 'platform_name', value: 'Vasanthi Designers' },
  });

  console.log('Seeding system roles...');
  for (const role of SYSTEM_ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;

  if (superAdminEmail && superAdminPassword) {
    console.log('Seeding super admin user...');
    const hashedPassword = await argon2.hash(superAdminPassword);
    
    const user = await prisma.user.upsert({
      where: { email: superAdminEmail },
      update: {},
      create: {
        email: superAdminEmail,
        passwordHash: hashedPassword,
        userType: 'SUPER_ADMIN',
        accountStatus: 'ACTIVE',
        firstName: 'Super',
        lastName: 'Admin',
        isEmailVerified: true,
      },
    });

    const superAdminRole = await prisma.role.findUnique({
      where: { name: 'super_admin' },
    });

    if (superAdminRole) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: superAdminRole.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          roleId: superAdminRole.id,
        },
      });
    }
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

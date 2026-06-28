const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

(async () => {
    const existing = await prisma.owner.findUnique({ where: { username: 'prodtest' } });
    if (existing) {
        console.log('Test owner already exists, id:', existing.id);
        await prisma.$disconnect();
        return;
    }
    const boutique = await prisma.boutique.findFirst({ where: { isDeleted: false } });
    if (!boutique) { console.log('No boutique found'); await prisma.$disconnect(); return; }
    const hash = await bcrypt.hash('Test@123', 10);
    const owner = await prisma.owner.create({
        data: {
            ownerName: 'Product Test',
            username: 'prodtest',
            email: 'prodtest@test.com',
            mobileNumber: '9999999999',
            password: hash,
            role: 'owner',
            status: 'Active',
            boutique: { connect: { id: boutique.id } },
            loginEnabled: true,
            canManageProducts: true
        }
    });
    console.log('Created test owner:', owner.username, owner.id);
    await prisma.$disconnect();
})().catch(e => { console.error(e.message); prisma.$disconnect(); });

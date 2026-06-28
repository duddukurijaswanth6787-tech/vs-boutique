const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
    const owners = await prisma.owner.findMany({
        take: 10,
        select: { username: true, email: true, password: true, role: true, status: true, loginEnabled: true }
    });
    console.log('Total owners:', owners.length);
    for (const o of owners) {
        console.log(`${o.username} | ${o.email} | ${o.role} | ${o.status} | login=${o.loginEnabled} | hash=${o.password.substring(0, 30)}...`);
    }
    await prisma.$disconnect();
})().catch(e => { console.error(e); prisma.$disconnect(); });

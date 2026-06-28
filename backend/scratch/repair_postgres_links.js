const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    console.log("Repairing Boutique-Owner links in PostgreSQL...");
    const owners = await prisma.owner.findMany({
        where: {
            assignedBoutiqueId: { not: null },
            isDeleted: false
        }
    });

    console.log(`Found ${owners.length} owners with assignedBoutiqueId.`);

    let fixedCount = 0;
    for (const owner of owners) {
        const boutique = await prisma.boutique.findUnique({
            where: { id: owner.assignedBoutiqueId }
        });

        if (boutique && boutique.ownerId !== owner.id) {
            await prisma.boutique.update({
                where: { id: boutique.id },
                data: { ownerId: owner.id }
            });
            console.log(`Linked boutique "${boutique.name}" to owner "${owner.ownerName}" (${owner.id})`);
            fixedCount++;
        }
    }

    console.log(`Done. Fixed ${fixedCount} boutique-owner links.`);
    await prisma.$disconnect();
}

run().catch(console.error);

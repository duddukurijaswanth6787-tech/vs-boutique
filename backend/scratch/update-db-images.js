const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const updates = {
    boutiques: [
        {
            id: "3b360640-f08b-460c-b06e-4f4ba821e298",
            logoUrl: "https://picsum.photos/id/64/400/400",
            coverImageUrl: "https://picsum.photos/id/684/800/400"
        },
        {
            id: "444d0792-6d4b-4912-870d-a7084fb4000d",
            logoUrl: "https://picsum.photos/id/338/400/400",
            coverImageUrl: "https://picsum.photos/id/824/800/400"
        },
        {
            id: "9713de00-8c88-48c2-9ecc-902b86954f96",
            logoUrl: "https://picsum.photos/id/22/400/400",
            coverImageUrl: "https://picsum.photos/id/1059/800/400"
        }
    ],
    designs: [
        {
            id: "0a821036-397c-47dc-bbca-2de894aa5655",
            images: ["https://picsum.photos/id/21/800/800"]
        },
        {
            id: "e27e6d01-211e-429a-8dec-eb5128d73245",
            images: ["https://picsum.photos/id/352/800/800"]
        },
        {
            id: "acfbc0e2-0851-401f-953e-7a28293167c3",
            images: ["https://picsum.photos/id/445/800/800"]
        }
    ]
};

async function run() {
    try {
        console.log("Starting DB image URL updates...\n");

        for (const b of updates.boutiques) {
            const exists = await prisma.boutique.findUnique({ where: { id: b.id } });
            if (exists) {
                await prisma.boutique.update({
                    where: { id: b.id },
                    data: {
                        logoUrl: b.logoUrl,
                        coverImageUrl: b.coverImageUrl
                    }
                });
                console.log(`✅ Updated Boutique: ${exists.name}`);
            } else {
                console.log(`⚠️  Boutique not found: ${b.id}`);
            }
        }

        for (const d of updates.designs) {
            const exists = await prisma.design.findUnique({ where: { id: d.id } });
            if (exists) {
                await prisma.design.update({
                    where: { id: d.id },
                    data: {
                        images: d.images
                    }
                });
                console.log(`✅ Updated Design: ${exists.name}`);
            } else {
                console.log(`⚠️  Design not found: ${d.id}`);
            }
        }

        console.log("\n🎉 All image URL updates completed!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await prisma.$disconnect();
    }
}

run();

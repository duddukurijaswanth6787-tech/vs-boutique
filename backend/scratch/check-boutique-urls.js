const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const https = require('https');

function checkUrl(url) {
    return new Promise((resolve) => {
        if (!url) return resolve("EMPTY");
        const req = https.request(url, { method: 'HEAD' }, (res) => {
            resolve(`${res.statusCode} ${res.statusMessage}`);
        });
        req.on('error', (err) => {
            resolve(`ERROR: ${err.message}`);
        });
        req.end();
    });
}

async function check() {
    try {
        const boutiques = await prisma.boutique.findMany({
            select: {
                id: true,
                name: true,
                logoUrl: true,
                coverImageUrl: true
            }
        });
        console.log("BOUTIQUES URL ACCESSIBILITY CHECK:\n");
        for (const b of boutiques) {
            const logoStatus = await checkUrl(b.logoUrl);
            const coverStatus = await checkUrl(b.coverImageUrl);
            console.log(`Boutique: ${b.name}`);
            console.log(`  - Logo URL:        "${b.logoUrl}" -> Status: ${logoStatus}`);
            console.log(`  - Cover Image URL: "${b.coverImageUrl}" -> Status: ${coverStatus}`);
        }

        const designs = await prisma.design.findMany({
            select: {
                id: true,
                name: true,
                images: true
            }
        });
        console.log("\nDESIGNS URL ACCESSIBILITY CHECK:\n");
        for (const d of designs) {
            console.log(`Design: ${d.name}`);
            for (const img of d.images) {
                const imgStatus = await checkUrl(img);
                console.log(`  - Image: "${img}" -> Status: ${imgStatus}`);
            }
        }
    } catch (err) {
        console.error("Error checking boutiques:", err);
    } finally {
        await prisma.$disconnect();
    }
}

check();

const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

async function run() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected.');

        const Boutique = require('../src/models/Boutique');
        const Owner = require('../src/models/Owner');
        const Design = require('../src/models/Design');
        const Order = require('../src/models/Order');
        const Booking = require('../src/models/Booking');
        const User = require('../src/models/User');

        const report = {
            boutiques: { total: 0, orphanedOwners: [], invalidEmails: [], invalidMobiles: [] },
            owners: { total: 0, orphanedBoutiques: [], duplicates: [] },
            designs: { total: 0, orphanedBoutiques: [] },
            orders: { total: 0, orphanedBoutiques: [], orphanedOwners: [] },
            bookings: { total: 0, orphanedBoutiques: [] },
            users: { total: 0, duplicates: [] }
        };

        // 1. Boutiques Validation
        const boutiques = await Boutique.find({});
        report.boutiques.total = boutiques.length;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const mobileRegex = /^[0-9]{10,15}$/;

        for (const b of boutiques) {
            if (b.email && !emailRegex.test(b.email)) {
                report.boutiques.invalidEmails.push({ id: b._id, email: b.email });
            }
            if (b.mobileNumber && !mobileRegex.test(b.mobileNumber.replace(/[\s-+]/g, ''))) {
                report.boutiques.invalidMobiles.push({ id: b._id, mobile: b.mobileNumber });
            }
        }

        // 2. Owners Validation
        const owners = await Owner.find({});
        report.owners.total = owners.length;
        for (const o of owners) {
            if (o.assignedBoutiqueId) {
                const boutiqueExists = await Boutique.exists({ _id: o.assignedBoutiqueId });
                if (!boutiqueExists) {
                    report.owners.orphanedBoutiques.push({ id: o._id, username: o.username, boutiqueId: o.assignedBoutiqueId });
                }
            }
        }

        // 3. Designs Validation
        const designs = await Design.find({});
        report.designs.total = designs.length;
        for (const d of designs) {
            const boutiqueExists = await Boutique.exists({ _id: d.boutiqueId });
            if (!boutiqueExists) {
                report.designs.orphanedBoutiques.push({ id: d._id, name: d.name, boutiqueId: d.boutiqueId });
            }
        }

        // 4. Orders Validation
        const orders = await Order.find({});
        report.orders.total = orders.length;
        for (const ord of orders) {
            const boutiqueExists = await Boutique.exists({ _id: ord.boutiqueId });
            if (!boutiqueExists) {
                report.orders.orphanedBoutiques.push({ id: ord._id, orderId: ord.orderId, boutiqueId: ord.boutiqueId });
            }
            const ownerExists = await Owner.exists({ _id: ord.ownerId });
            if (!ownerExists) {
                report.orders.orphanedOwners.push({ id: ord._id, orderId: ord.orderId, ownerId: ord.ownerId });
            }
        }

        // 5. Bookings Validation
        const bookings = await Booking.find({});
        report.bookings.total = bookings.length;
        for (const bk of bookings) {
            const boutiqueExists = await Boutique.exists({ _id: bk.boutiqueId });
            if (!boutiqueExists) {
                report.bookings.orphanedBoutiques.push({ id: bk._id, customer: bk.customerName, boutiqueId: bk.boutiqueId });
            }
        }

        console.log('\n=====================================');
        console.log('      DATABASE VALIDATION REPORT      ');
        console.log('=====================================');
        console.log(JSON.stringify(report, null, 2));
        console.log('=====================================');

        await mongoose.disconnect();
    } catch (e) {
        console.error('Validation script failed:', e);
    }
}

run();

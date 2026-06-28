/**
 * Data Repair Script — Fix Orphaned Boutique-Owner Links
 * 
 * Problem: Boutiques created before the ownerId fix have:
 *   - boutique.ownerId = null
 *   - owner.assignedBoutiqueId = correct boutique _id (set at owner creation)
 * 
 * Fix: For every Owner who has an assignedBoutiqueId, update that Boutique's
 *      ownerId to point back to that Owner.
 * 
 * Run: node repair-links.js
 */

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

const OwnerSchema = new mongoose.Schema({}, { strict: false });
const BoutiqueSchema = new mongoose.Schema({}, { strict: false });
const Owner = mongoose.model('Owner', OwnerSchema, 'owners');
const Boutique = mongoose.model('Boutique', BoutiqueSchema, 'boutiques');

async function repairLinks() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all owners who have an assigned boutique
    const owners = await Owner.find({
        assignedBoutiqueId: { $exists: true, $ne: null },
        isDeleted: { $ne: true }
    });

    console.log(`\nFound ${owners.length} owner(s) with assignedBoutiqueId\n`);

    let fixed = 0;
    let alreadyLinked = 0;
    let notFound = 0;

    for (const owner of owners) {
        const boutiqueId = owner.assignedBoutiqueId;
        const boutique = await Boutique.findById(boutiqueId);

        if (!boutique) {
            console.log(`⚠️  Boutique ${boutiqueId} not found for owner ${owner.username}`);
            notFound++;
            continue;
        }

        const currentOwnerId = boutique.ownerId?.toString();
        const targetOwnerId  = owner._id.toString();

        if (currentOwnerId === targetOwnerId) {
            console.log(`✔  Already linked: ${boutique.name} ↔ ${owner.username}`);
            alreadyLinked++;
            continue;
        }

        // Fix: set boutique.ownerId to this owner
        await Boutique.findByIdAndUpdate(boutiqueId, { ownerId: owner._id });
        console.log(`🔧 Fixed: ${boutique.name} → ownerId set to ${owner.username} (${owner._id})`);
        fixed++;
    }

    console.log(`\n── Summary ──────────────────────────`);
    console.log(`✅ Fixed:          ${fixed}`);
    console.log(`✔  Already OK:     ${alreadyLinked}`);
    console.log(`⚠️  Boutique missing: ${notFound}`);
    console.log(`─────────────────────────────────────\n`);

    await mongoose.disconnect();
    console.log('Disconnected. Done.');
}

repairLinks().catch(err => {
    console.error('Repair failed:', err.message);
    process.exit(1);
});

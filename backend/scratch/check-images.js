const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

async function run() {
    try {
        console.log('Connecting to MongoDB using:', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected');

        const Boutique = require('../src/models/Boutique');
        const Design = require('../src/models/Design');

        console.log('\n--- BOUTIQUES ---');
        const boutiques = await Boutique.find({});
        console.log(`Found ${boutiques.length} boutiques.`);
        for (const b of boutiques) {
            console.log(`Boutique Name: ${b.name}`);
            console.log(`  Logo: ${b.media?.logo}`);
            console.log(`  Cover Image: ${b.media?.coverImage}`);
            console.log(`  Gallery:`, b.media?.gallery);
        }

        console.log('\n--- DESIGNS ---');
        const designs = await Design.find({});
        console.log(`Found ${designs.length} designs.`);
        for (const d of designs) {
            console.log(`Design Name: ${d.name}`);
            console.log(`  Images:`, d.images);
            console.log(`  Boutique ID: ${d.boutiqueId}`);
        }

        await mongoose.disconnect();
        console.log('\nDisconnected.');
    } catch (e) {
        console.error('Error:', e);
    }
}

run();

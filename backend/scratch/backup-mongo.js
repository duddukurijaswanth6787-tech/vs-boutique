const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './.env' });

async function run() {
    console.log('Connecting to MongoDB for backup...');
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const db = client.db();
        const collections = await db.listCollections().toArray();

        const backupData = {};
        for (const colInfo of collections) {
            const colName = colInfo.name;
            console.log(`Backing up collection: ${colName}...`);
            const docs = await db.collection(colName).find({}).toArray();
            backupData[colName] = docs;
        }

        const backupPath = path.join(__dirname, 'mongo-backup.json');
        fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf8');
        console.log(`✅ Backup successfully saved to: ${backupPath}`);
        process.exit(0);
    } catch (e) {
        console.error('❌ Backup failed:', e);
        process.exit(1);
    }
}

run();

const { Client } = require('pg');

const DATABASE_URL = "postgresql://postgres:postgres123@localhost:5432/boq_app";

async function run() {
    const client = new Client({
        connectionString: DATABASE_URL
    });

    try {
        await client.connect();
        console.log('Creating sequence order_id_seq...');
        await client.query('CREATE SEQUENCE IF NOT EXISTS order_id_seq START 1;');
        console.log('✅ Sequence order_id_seq created successfully.');
        await client.end();
        process.exit(0);
    } catch (e) {
        console.error('❌ Failed to create sequence:', e.message);
        process.exit(1);
    }
}

run();

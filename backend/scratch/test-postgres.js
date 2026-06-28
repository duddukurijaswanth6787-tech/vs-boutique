const { Client } = require('pg');

const DATABASE_URL = "postgresql://postgres:postgres123@localhost:5432/boq_app";

async function run() {
    const client = new Client({
        connectionString: DATABASE_URL
    });

    try {
        console.log('Connecting to PostgreSQL...');
        await client.connect();
        console.log('✅ Connected.');

        // 1. Verify UUID extension
        console.log('Verifying uuid-ossp extension...');
        await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
        const uuidRes = await client.query('SELECT uuid_generate_v4();');
        console.log('✅ uuid-ossp extension verified. Generated UUID:', uuidRes.rows[0].uuid_generate_v4);

        // 2. Verify CREATE TABLE permissions
        console.log('Verifying CREATE TABLE permissions...');
        await client.query('CREATE TEMP TABLE test_permissions (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), name VARCHAR(50));');
        await client.query("INSERT INTO test_permissions (name) VALUES ('Postgres Test');");
        const selectRes = await client.query('SELECT * FROM test_permissions;');
        console.log('✅ CREATE TABLE permissions verified. Inserted data:', selectRes.rows[0]);

        await client.end();
        console.log('✅ PostgreSQL connection verification completed successfully.');
        process.exit(0);
    } catch (e) {
        console.error('❌ PostgreSQL verification failed:', e);
        process.exit(1);
    }
}

run();

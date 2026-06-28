const { Client } = require('pg');

const DEFAULT_URL = "postgresql://postgres:postgres123@localhost:5432/postgres";

async function run() {
    const client = new Client({
        connectionString: DEFAULT_URL
    });

    try {
        console.log('Connecting to default postgres database...');
        await client.connect();
        console.log('Creating database boq_app...');
        await client.query('CREATE DATABASE boq_app;');
        console.log('✅ Database boq_app created successfully.');
        await client.end();
        process.exit(0);
    } catch (e) {
        console.error('❌ Failed to create database:', e.message);
        process.exit(1);
    }
}

run();

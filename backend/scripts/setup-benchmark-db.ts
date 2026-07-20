import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const defaultUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/vasanthi_designers?schema=public';

async function main() {
  console.log('Connecting to PostgreSQL to check/create vasanthi_benchmark database...');

  // Parse default URL to connect to default 'postgres' database first
  const urlObj = new URL(defaultUrl);
  const username = urlObj.username;
  const password = urlObj.password;
  const host = urlObj.hostname;
  const port = urlObj.port;

  const client = new Client({
    connectionString: `postgresql://${username}:${password}@${host}:${port}/postgres`
  });

  try {
    await client.connect();
    
    // Check if vasanthi_benchmark exists
    const res = await client.query("SELECT 1 FROM pg_database WHERE datname='vasanthi_benchmark'");
    if (res.rowCount === 0) {
      console.log("Database 'vasanthi_benchmark' does not exist. Creating it...");
      await client.query("CREATE DATABASE vasanthi_benchmark");
      console.log("Database 'vasanthi_benchmark' created successfully.");
    } else {
      console.log("Database 'vasanthi_benchmark' already exists.");
    }
  } catch (error) {
    console.error('Error establishing database connection or running query:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch(console.error);

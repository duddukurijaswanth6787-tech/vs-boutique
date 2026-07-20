import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const benchmarkDbUrl = 'postgresql://postgres:postgres@localhost:5432/vasanthi_benchmark?schema=public';

const TABLES = [
  'users',
  'customer_profiles',
  'brands',
  'categories',
  'products',
  'product_variants',
  'inventory',
  'orders',
  'order_items',
  'social_posts',
  'order_addresses',
  'order_timeline',
  'variant_warehouse_inventory'
];

async function main() {
  const currentDbUrl = process.env.DATABASE_URL || benchmarkDbUrl;
  const pool = new Client({ connectionString: currentDbUrl });

  try {
    await pool.connect();
    console.log('BENCHMARK DATABASE STATS:');
    console.log('=============================================================================');
    console.log('TABLE | ROW COUNT | TABLE SIZE | INDEX SIZE | TOTAL SIZE');
    console.log('-----------------------------------------------------------------------------');

    for (const table of TABLES) {
      // Get row count
      const countRes = await pool.query(`SELECT COUNT(*) FROM "${table}"`);
      const rowCount = countRes.rows[0].count;

      // Get sizes in pretty and raw formats
      const sizeRes = await pool.query(`
        SELECT 
          pg_size_pretty(pg_relation_size('"${table}"')) as table_size,
          pg_size_pretty(pg_indexes_size('"${table}"')) as index_size,
          pg_size_pretty(pg_total_relation_size('"${table}"')) as total_size
      `);
      
      const { table_size, index_size, total_size } = sizeRes.rows[0];
      console.log(`${table.padEnd(25)} | ${rowCount.toString().padEnd(9)} | ${table_size.padEnd(10)} | ${index_size.padEnd(10)} | ${total_size}`);
    }

    console.log('=============================================================================');

    // Total database size
    const dbNameRes = await pool.query('SELECT current_database() as dbname');
    const dbname = dbNameRes.rows[0].dbname;
    const dbSizeRes = await pool.query(`SELECT pg_size_pretty(pg_database_size('${dbname}')) as dbsize`);
    console.log(`Total Database (${dbname}) Size: ${dbSizeRes.rows[0].dbsize}`);
    console.log('=============================================================================');

  } catch (err) {
    console.error('Error fetching database size stats:', err);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);

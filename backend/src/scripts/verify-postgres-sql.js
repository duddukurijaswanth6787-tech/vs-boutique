const { Pool } = require('pg');
require('dotenv').config();

async function runRawSqlAudit() {
  console.log('=== RAW POSTGRESQL SQL AUDIT FOR PHASE 6 ===\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/vs_boutique"
  });

  const queries = [
    {
      table: 'websites',
      sql: 'SELECT id, business_id, domain, status FROM websites LIMIT 1;'
    },
    {
      table: 'boutique_themes',
      sql: 'SELECT id, business_id, typography, "spacingScale" FROM boutique_themes LIMIT 1;'
    },
    {
      table: 'boutique_pages',
      sql: 'SELECT id, website_id, title, slug, status FROM boutique_pages LIMIT 1;'
    },
    {
      table: 'page_component_nodes',
      sql: 'SELECT id, page_id, name, type, "order", data_source_bind FROM page_component_nodes LIMIT 1;'
    },
    {
      table: 'universal_contents',
      sql: 'SELECT id, business_id, key, "baseText" FROM universal_contents LIMIT 1;'
    },
    {
      table: 'asset_libraries',
      sql: 'SELECT id, business_id, name, type, url FROM asset_libraries LIMIT 1;'
    },
    {
      table: 'immutable_releases',
      sql: 'SELECT id, business_id, release_tag, status, environment FROM immutable_releases LIMIT 1;'
    }
  ];

  try {
    for (const q of queries) {
      console.log(`Executing SQL Query for: ${q.table}`);
      console.log(`SQL: ${q.sql}`);
      try {
        const res = await pool.query(q.sql);
        console.log(`Result Rows count: ${res.rows.length}`);
        if (res.rows.length > 0) {
          console.log(`First row data:`, JSON.stringify(res.rows[0], null, 2));
        } else {
          console.log(`First row data: [EMPTY]`);
        }
      } catch (err) {
        console.log(`Query Failed: ${err.message}`);
      }
      console.log('--------------------------------------------------\n');
    }
  } catch (err) {
    console.error('SQL audit execution failed:', err);
  } finally {
    await pool.end();
  }
}

runRawSqlAudit();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const boutiqueId = "9713de00-8c88-48c2-9ecc-902b86954f96";
  console.log("Running EXPLAIN ANALYZE on boutique_subscriptions query...");
  
  try {
    const explain = await prisma.$queryRawUnsafe(
      `EXPLAIN ANALYZE SELECT * FROM boutique_subscriptions WHERE boutique_id = $1::uuid`,
      boutiqueId
    );
    console.log("EXPLAIN ANALYZE Result:");
    console.log(explain.map(row => row['QUERY PLAN']).join('\n'));
    
    console.log("\n--- Checking Indexes ---");
    const indexes = await prisma.$queryRawUnsafe(`
      SELECT
          t.relname as table_name,
          i.relname as index_name,
          a.attname as column_name
      FROM
          pg_class t,
          pg_class i,
          pg_index ix,
          pg_attribute a
      WHERE
          t.oid = ix.indrelid
          and i.oid = ix.indexrelid
          and a.attrelid = t.oid
          and a.attnum = ANY(ix.indkey)
          and t.relname = 'boutique_subscriptions'
    `);
    console.table(indexes);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

run();

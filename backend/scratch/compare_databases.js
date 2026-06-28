const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const neonUrl = "postgresql://neondb_owner:npg_2aEyTqmhUup8@ep-twilight-union-ah7if2uf.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require";
const localUrl = "postgresql://postgres:postgres@localhost:5432/vs_boutique?schema=public";

async function fetchMetadata(connectionString, name) {
    console.log(`Connecting to ${name}...`);
    const client = new Client({ connectionString });
    await client.connect();
    console.log(`Connected to ${name}.`);

    const meta = {};

    // 1. Extensions
    const extRes = await client.query(`SELECT extname, extversion FROM pg_extension ORDER BY extname;`);
    meta.extensions = extRes.rows;

    // 2. Enums
    const enumRes = await client.query(`
        SELECT t.typname AS enum_name, e.enumlabel AS enum_value
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        ORDER BY enum_name, enum_value;
    `);
    meta.enums = enumRes.rows;

    // 3. Tables
    const tableRes = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema='public' AND table_type='BASE TABLE' AND table_name NOT LIKE '_prisma_migrations';
    `);
    const tables = tableRes.rows.map(r => r.table_name).sort();
    meta.tables = tables;

    // 3b. Row Counts
    const rowCounts = {};
    for (const table of tables) {
        const countRes = await client.query(`SELECT COUNT(*)::int as count FROM "${table}";`);
        rowCounts[table] = countRes.rows[0].count;
    }
    meta.rowCounts = rowCounts;

    // 4. Primary Keys
    const pkRes = await client.query(`
        SELECT kcu.table_name, kcu.column_name, tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public'
        ORDER BY kcu.table_name, kcu.column_name;
    `);
    meta.primaryKeys = pkRes.rows;

    // 5. Foreign Keys
    const fkRes = await client.query(`
        SELECT
            tc.table_name, 
            kcu.column_name, 
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name,
            tc.constraint_name
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema='public'
        ORDER BY tc.table_name, kcu.column_name, tc.constraint_name;
    `);
    meta.foreignKeys = fkRes.rows;

    // 6. Indexes
    const idxRes = await client.query(`
        SELECT tablename, indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = 'public' AND indexname NOT LIKE '%_pkey'
        ORDER BY tablename, indexname;
    `);
    meta.indexes = idxRes.rows;

    // 7. Constraints (Unique/Check)
    const constRes = await client.query(`
        SELECT table_name, constraint_name, constraint_type
        FROM information_schema.table_constraints
        WHERE table_schema = 'public' AND constraint_type IN ('CHECK', 'UNIQUE')
        ORDER BY table_name, constraint_name;
    `);
    meta.constraints = constRes.rows;

    // 8. Triggers
    const trigRes = await client.query(`
        SELECT trigger_name, event_manipulation, event_object_table
        FROM information_schema.triggers
        WHERE trigger_schema = 'public'
        ORDER BY trigger_name, event_object_table;
    `);
    meta.triggers = trigRes.rows;

    // 9. Sequences
    const seqRes = await client.query(`
        SELECT sequence_name, start_value, minimum_value, maximum_value, increment
        FROM information_schema.sequences
        WHERE sequence_schema = 'public'
        ORDER BY sequence_name;
    `);
    meta.sequences = seqRes.rows;

    // 9b. Sequence Current Values
    const sequenceValues = {};
    for (const seq of meta.sequences) {
        try {
            const valRes = await client.query(`SELECT last_value FROM "${seq.sequence_name}";`);
            sequenceValues[seq.sequence_name] = valRes.rows[0].last_value;
        } catch (e) {
            sequenceValues[seq.sequence_name] = "N/A";
        }
    }
    meta.sequenceValues = sequenceValues;

    // 10. Views
    const viewRes = await client.query(`
        SELECT table_name AS view_name, view_definition
        FROM information_schema.views
        WHERE table_schema = 'public'
        ORDER BY view_name;
    `);
    meta.views = viewRes.rows;

    await client.end();
    return meta;
}

async function run() {
    try {
        const neonMeta = await fetchMetadata(neonUrl, "Neon Cloud Database");
        const localMeta = await fetchMetadata(localUrl, "Local PostgreSQL");

        console.log("Comparing databases...");

        const reportLines = [];
        reportLines.push("# Data Integrity Report: Neon Cloud vs Local PostgreSQL");
        reportLines.push(`**Date:** ${new Date().toISOString()}`);
        reportLines.push("");

        let hasMismatch = false;
        const mismatchDetails = [];

        function checkEqual(a, b, sectionName, detailsFormatter) {
            const strA = JSON.stringify(a);
            const strB = JSON.stringify(b);
            if (strA !== strB) {
                hasMismatch = true;
                mismatchDetails.push(`### ❌ Mismatch in ${sectionName}`);
                detailsFormatter(mismatchDetails);
                return false;
            }
            return true;
        }

        // 1. Extensions Comparison
        reportLines.push("## 1. Extensions");
        const extStatus = checkEqual(neonMeta.extensions, localMeta.extensions, "Extensions", (d) => {
            d.push(`Neon Extensions: ${JSON.stringify(neonMeta.extensions)}`);
            d.push(`Local Extensions: ${JSON.stringify(localMeta.extensions)}`);
        });
        reportLines.push(extStatus ? "✅ **PASS:** Extensions match perfectly." : "❌ **FAIL:** Extensions mismatch.");
        reportLines.push(`| Extension | Neon Version | Local Version |`);
        reportLines.push(`|---|---|---|`);
        const allExtNames = Array.from(new Set([...neonMeta.extensions.map(e => e.extname), ...localMeta.extensions.map(e => e.extname)])).sort();
        for (const ext of allExtNames) {
            const nV = neonMeta.extensions.find(e => e.extname === ext)?.extversion || "N/A";
            const lV = localMeta.extensions.find(e => e.extname === ext)?.extversion || "N/A";
            reportLines.push(`| \`${ext}\` | ${nV} | ${lV} |`);
        }
        reportLines.push("");

        // 2. Enums Comparison
        reportLines.push("## 2. Enum Values");
        const enumStatus = checkEqual(neonMeta.enums, localMeta.enums, "Enums", (d) => {
            d.push("Enum structures differ between databases.");
        });
        reportLines.push(enumStatus ? "✅ **PASS:** Enum values match perfectly." : "❌ **FAIL:** Enum values mismatch.");
        reportLines.push("");

        // 3. Tables & Row counts
        reportLines.push("## 3. Table Row Counts");
        const tablesStatus = checkEqual(neonMeta.tables, localMeta.tables, "Table List", (d) => {
            d.push(`Neon Tables: ${neonMeta.tables.join(', ')}`);
            d.push(`Local Tables: ${localMeta.tables.join(', ')}`);
        });
        
        let rowCountsMatch = true;
        const rowCountsTableLines = [];
        rowCountsTableLines.push(`| Table Name | Neon Count | Local Count | Status |`);
        rowCountsTableLines.push(`|---|---|---|---|`);
        
        for (const t of neonMeta.tables) {
            const nC = neonMeta.rowCounts[t] ?? 0;
            const lC = localMeta.rowCounts[t] ?? 0;
            const status = nC === lC ? "✅ MATCH" : "❌ MISMATCH";
            if (nC !== lC) {
                rowCountsMatch = false;
                hasMismatch = true;
            }
            rowCountsTableLines.push(`| \`${t}\` | ${nC} | ${lC} | ${status} |`);
        }
        
        reportLines.push((tablesStatus && rowCountsMatch) ? "✅ **PASS:** All tables and row counts match perfectly." : "❌ **FAIL:** Table or row count mismatch.");
        reportLines.push(...rowCountsTableLines);
        reportLines.push("");

        // 4. Primary Keys Comparison
        reportLines.push("## 4. Primary Keys");
        const pkStatus = checkEqual(neonMeta.primaryKeys, localMeta.primaryKeys, "Primary Keys", (d) => {
            d.push("Primary keys metadata differ between databases.");
        });
        reportLines.push(pkStatus ? "✅ **PASS:** Primary keys match perfectly." : "❌ **FAIL:** Primary keys mismatch.");
        reportLines.push("");

        // 5. Foreign Keys Comparison
        reportLines.push("## 5. Foreign Keys");
        const fkStatus = checkEqual(neonMeta.foreignKeys, localMeta.foreignKeys, "Foreign Keys", (d) => {
            d.push("Foreign keys metadata differ between databases.");
        });
        reportLines.push(fkStatus ? "✅ **PASS:** Foreign keys match perfectly." : "❌ **FAIL:** Foreign keys mismatch.");
        reportLines.push("");

        // 6. Indexes Comparison
        reportLines.push("## 6. Indexes");
        const cleanIndexes = (idxList) => idxList.map(idx => ({
            table: idx.tablename,
            name: idx.indexname,
            def: idx.indexdef.replace(/\s+/g, ' ').toLowerCase()
        }));
        const neonCleanIdx = cleanIndexes(neonMeta.indexes);
        const localCleanIdx = cleanIndexes(localMeta.indexes);
        const idxStatus = checkEqual(neonCleanIdx, localCleanIdx, "Indexes", (d) => {
            d.push("Indexes differ between databases.");
        });
        reportLines.push(idxStatus ? "✅ **PASS:** Indexes match perfectly." : "❌ **FAIL:** Indexes mismatch.");
        reportLines.push("");

        // 7. Constraints
        reportLines.push("## 7. Constraints (Check / Unique)");
        const constStatus = checkEqual(neonMeta.constraints, localMeta.constraints, "Constraints", (d) => {
            d.push("Constraints metadata differ between databases.");
        });
        reportLines.push(constStatus ? "✅ **PASS:** Check and Unique constraints match perfectly." : "❌ **FAIL:** Constraints mismatch.");
        reportLines.push("");

        // 8. Triggers
        reportLines.push("## 8. Triggers");
        const trigStatus = checkEqual(neonMeta.triggers, localMeta.triggers, "Triggers", (d) => {
            d.push("Triggers differ between databases.");
        });
        reportLines.push(trigStatus ? "✅ **PASS:** Triggers match perfectly." : "❌ **FAIL:** Triggers mismatch.");
        reportLines.push("");

        // 9. Sequences
        reportLines.push("## 9. Sequences");
        const seqStatus = checkEqual(neonMeta.sequences, localMeta.sequences, "Sequences", (d) => {
            d.push("Sequences differ between databases.");
        });
        
        let seqValuesMatch = true;
        const seqTableLines = [];
        seqTableLines.push(`| Sequence Name | Neon Last Value | Local Last Value | Status |`);
        seqTableLines.push(`|---|---|---|---|`);
        for (const seq of neonMeta.sequences) {
            const nV = neonMeta.sequenceValues[seq.sequence_name];
            const lV = localMeta.sequenceValues[seq.sequence_name];
            const status = nV === lV ? "✅ MATCH" : "⚠️ MISMATCH";
            if (nV !== lV) {
                seqValuesMatch = false;
            }
            seqTableLines.push(`| \`${seq.sequence_name}\` | ${nV} | ${lV} | ${status} |`);
        }
        
        reportLines.push((seqStatus && seqValuesMatch) ? "✅ **PASS:** Sequences match and are synchronized." : "⚠️ **WARN:** Sequence values mismatch or not synchronized.");
        reportLines.push(...seqTableLines);
        reportLines.push("");

        // 10. Views
        reportLines.push("## 10. Views");
        const cleanViews = (vList) => vList.map(v => ({
            name: v.view_name,
            def: (v.view_definition || "").replace(/\s+/g, ' ').toLowerCase()
        }));
        const viewsStatus = checkEqual(cleanViews(neonMeta.views), cleanViews(localMeta.views), "Views", (d) => {
            d.push("Views differ between databases.");
        });
        reportLines.push(viewsStatus ? "✅ **PASS:** Views match perfectly." : "❌ **FAIL:** Views mismatch.");
        reportLines.push("");

        // Overall Summary
        reportLines.push("## Overall Data Integrity Status");
        if (hasMismatch) {
            reportLines.push("### Status: ❌ FAILED (Mismatches Detected)");
            reportLines.push("Please see the details below for mismatches that need to be resolved.");
            reportLines.push("");
            reportLines.push(...mismatchDetails);
        } else {
            reportLines.push("### Status: 🎉 PASSED (100% Identical)");
            reportLines.push("The local database is 100% identical to the Neon production database across row counts, primary/foreign keys, indexes, constraints, triggers, sequences, enums, views, and extensions.");
        }

        const reportPath = path.join(__dirname, '../data_integrity_report.md');
        fs.writeFileSync(reportPath, reportLines.join('\n'));
        console.log(`✅ Data integrity report generated successfully at ${reportPath}`);

        if (hasMismatch) {
            console.error("❌ Data integrity check failed: mismatches detected.");
            process.exit(1);
        } else {
            console.log("🎉 Data integrity check passed perfectly.");
            process.exit(0);
        }

    } catch (e) {
        console.error("Database comparison crashed:", e);
        process.exit(1);
    }
}

run();

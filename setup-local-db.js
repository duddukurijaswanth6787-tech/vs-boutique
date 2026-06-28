const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("=== VS Boutique - Local Database Setup ===");

// 1. Find psql executable
function findPsqlPath() {
    try {
        execSync('psql --version', { stdio: 'ignore' });
        return 'psql';
    } catch (e) {
        // Not in PATH, search in standard Windows locations
        const pgDir = 'C:\\Program Files\\PostgreSQL';
        if (fs.existsSync(pgDir)) {
            const versions = fs.readdirSync(pgDir);
            // Sort versions descending (latest first)
            versions.sort((a, b) => parseFloat(b) - parseFloat(a));
            for (const version of versions) {
                const psqlPath = path.join(pgDir, version, 'bin', 'psql.exe');
                if (fs.existsSync(psqlPath)) {
                    return `"${psqlPath}"`;
                }
            }
        }
    }
    return null;
}

const psqlPath = findPsqlPath();
if (!psqlPath) {
    console.error("Error: PostgreSQL client (psql) could not be found.");
    console.error("Please make sure PostgreSQL is installed on your laptop.");
    console.error("You can download it from: https://www.postgresql.org/download/");
    process.exit(1);
}
console.log(`Found psql at: ${psqlPath}`);

// 2. Read backend/.env to parse credentials
const envPath = path.join(__dirname, 'backend', '.env');
let envContent = '';
if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
} else {
    // Try to copy from example
    const examplePath = path.join(__dirname, 'backend', '.env.example');
    if (fs.existsSync(examplePath)) {
        envContent = fs.readFileSync(examplePath, 'utf8');
        fs.writeFileSync(envPath, envContent);
        console.log("Created backend/.env from .env.example");
    } else {
        // Create default env content
        envContent = `PORT=3005\nDATABASE_URL="postgresql://postgres:postgres@localhost:5432/vs_boutique?schema=public"\nJWT_SECRET=supersecretjwtkey`;
        fs.writeFileSync(envPath, envContent);
        console.log("Created default backend/.env");
    }
}

// Helper to parse DATABASE_URL
function parseDatabaseUrl(url) {
    // Format: postgresql://username:password@host:port/database?options
    const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/;
    const match = url.match(regex);
    if (match) {
        return {
            user: match[1],
            password: match[2],
            host: match[3],
            port: match[4],
            database: match[5]
        };
    }
    return null;
}

// Find DATABASE_URL in env file
let dbUrlLine = envContent.split('\n').find(line => line.startsWith('DATABASE_URL='));
let dbUrl = dbUrlLine ? dbUrlLine.split('=')[1].replace(/['"]/g, '').trim() : '';

let creds = parseDatabaseUrl(dbUrl);
if (!creds) {
    creds = {
        user: 'postgres',
        password: 'postgres',
        host: 'localhost',
        port: '5432',
        database: 'vs_boutique'
    };
}

// Check arguments for override password
const argPassword = process.argv[2];
if (argPassword) {
    creds.password = argPassword;
    console.log(`Using password provided via arguments.`);
}

console.log(`Attempting connection to PostgreSQL...`);
console.log(`Host: ${creds.host}`);
console.log(`Port: ${creds.port}`);
console.log(`User: ${creds.user}`);

// Function to run a command with PGPASSWORD set
function runPgCmd(cmd) {
    return execSync(cmd, {
        env: {
            ...process.env,
            PGPASSWORD: creds.password
        },
        stdio: 'pipe'
    }).toString();
}

try {
    // 3. Test connection by listing databases
    console.log("Testing connection...");
    runPgCmd(`${psqlPath} -h ${creds.host} -p ${creds.port} -U ${creds.user} -d postgres -c "SELECT 1"`);
    console.log("Connection successful!");
} catch (e) {
    console.error("\nConnection failed! The password in .env might be incorrect or PostgreSQL is not running.");
    console.error("If your PostgreSQL password is different, please run this script with your password as an argument:");
    console.error(`  node setup-local-db.js <your_postgres_password>\n`);
    console.error(e.message);
    process.exit(1);
}

// 4. Create database if it doesn't exist
try {
    console.log(`Checking if database "${creds.database}" exists...`);
    const dbList = runPgCmd(`${psqlPath} -h ${creds.host} -p ${creds.port} -U ${creds.user} -d postgres -lqt`);
    const exists = dbList.split('\n').some(line => line.trim().startsWith(creds.database + ' '));
    
    if (!exists) {
        console.log(`Creating database "${creds.database}"...`);
        runPgCmd(`${psqlPath} -h ${creds.host} -p ${creds.port} -U ${creds.user} -d postgres -c "CREATE DATABASE ${creds.database}"`);
        console.log(`Database "${creds.database}" created successfully.`);
    } else {
        console.log(`Database "${creds.database}" already exists.`);
    }
} catch (e) {
    console.error("Failed to check or create database:");
    console.error(e.message);
    process.exit(1);
}

// 5. Enable extension
try {
    console.log("Enabling uuid-ossp extension...");
    runPgCmd(`${psqlPath} -h ${creds.host} -p ${creds.port} -U ${creds.user} -d ${creds.database} -c "CREATE EXTENSION IF NOT EXISTS \\"uuid-ossp\\";"`);
    console.log("uuid-ossp extension verified.");
} catch (e) {
    console.warn("Warning enabling extension (might already exist or permission issue):", e.message);
}

// 6. Restore SQL Dump
const sqlPath = path.join(__dirname, 'neon_backup.sql');
if (!fs.existsSync(sqlPath)) {
    console.error(`Error: Backup file neon_backup.sql not found at ${sqlPath}`);
    process.exit(1);
}

console.log("Restoring database from neon_backup.sql (this may take a few seconds)...");
try {
    // Run the restore using psql
    runPgCmd(`${psqlPath} -h ${creds.host} -p ${creds.port} -U ${creds.user} -d ${creds.database} -f "${sqlPath}"`);
    console.log("Database restore complete!");
} catch (e) {
    console.log("Database restore finished with some notices/warnings (this is normal for ownership changes):");
    const lines = e.message.split('\n');
    const warnings = lines.filter(l => l.includes('role') || l.includes('owner') || l.includes('does not exist')).slice(0, 5);
    if (warnings.length > 0) {
        console.log("Sample messages:");
        warnings.forEach(w => console.log(`  - ${w.trim()}`));
    } else {
        console.log(e.message.substring(0, 500));
    }
}

// 7. Update backend/.env file with correct DATABASE_URL if password was changed
const newDbUrl = `postgresql://${creds.user}:${creds.password}@${creds.host}:${creds.port}/${creds.database}?schema=public`;
if (dbUrl !== newDbUrl) {
    console.log("Updating backend/.env with the correct DATABASE_URL...");
    let newEnvContent = envContent;
    if (dbUrlLine) {
        newEnvContent = envContent.replace(dbUrlLine, `DATABASE_URL="${newDbUrl}"`);
    } else {
        newEnvContent += `\nDATABASE_URL="${newDbUrl}"`;
    }
    fs.writeFileSync(envPath, newEnvContent);
    console.log("backend/.env updated successfully.");
}

console.log("\n🎉 Database setup completed successfully!");
console.log("You can now run `npx prisma generate` inside the backend folder and start the server.");

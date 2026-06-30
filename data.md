# VS Boutique - Database Import & Setup Instructions

Welcome! This file contains the instructions for setting up the local database for VS Boutique on your office laptop.

You can feed this file to the **Antigravity** agent, and the agent can automatically execute the setup for you.

---

## 🤖 Automated Database Setup (Run via Agent)

To automatically set up the local PostgreSQL database, create the `vs_boutique` database, enable the extensions, and restore the schema and data from the backup, the agent should run the following command from the root directory:

```bash
node setup-local-db.js
```

### Passing a Specific Password
If your pgAdmin4 / local PostgreSQL `postgres` user password is NOT `postgres` (for example, if it is `admin123` or `root`), run the script by passing your password as an argument:

```bash
node setup-local-db.js your_postgres_password
```

*(e.g., `node setup-local-db.js admin123`)*

---

## 🛠️ Manual Database Setup (pgAdmin 4 / CLI Fallback)

If you prefer to perform the setup manually:

### 1. Create the Database
1. Open **pgAdmin 4** on your laptop.
2. Connect to your local server.
3. Right-click **Databases** -> **Create** -> **Database...**
4. Name the database **`vs_boutique`** and click **Save**.

### 2. Enable Required Extensions
1. Right-click the newly created `vs_boutique` database in pgAdmin 4 and select **Query Tool**.
2. Run the following SQL command to enable UUID support:
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

### 3. Restore the Database Backup
Open a terminal in the project root directory and run the following command (substituting `your_password` and `postgres` with your actual credentials):

```powershell
# Set the password env variable so psql doesn't prompt for it
$env:PGPASSWORD="your_password"

# Restore using psql from the SQL file in the root directory
psql -h localhost -p 5432 -U postgres -d vs_boutique -f neon_backup.sql
```

---

## 📝 Update Backend Environment variables

Ensure that the connection string in your `backend/.env` file points to your local database instance:

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/vs_boutique?schema=public"
```

The automated script (`setup-local-db.js`) will update this file automatically for you.

# PostgreSQL Migration Plan

**From:** Neon Cloud PostgreSQL  
**To:** Local PostgreSQL (pgAdmin 4)  
**Project:** VS Boutique  
**Date:** 25 June 2026

---

## Phase 2 — Migration Analysis

### Feasibility: ✅ POSSIBLE — Low Risk

This is a **PostgreSQL → PostgreSQL** migration, same dialect, no schema changes needed.

### Required Code Changes

| File | Change Required | Risk |
|---|---|---|
| `backend/.env` | Update `DATABASE_URL` to local PostgreSQL | Low |
| `backend/prisma/schema.prisma` | **No change** — already `provider = "postgresql"` | None |
| `backend/prisma/seed.js` | **No change** — uses Prisma, database-agnostic | None |
| `backend/src/utils/prisma.js` | **No change** — reads from env | None |
| `backend/src/server.js` | **No change** — reads from env | None |
| `web/.env` | **No change** — points to API URL, not DB | None |
| `mobile/.env` | **No change** — points to API URL, not DB | None |

### Environment Variable Changes

| Variable | Current (Neon) | New (Local) |
|---|---|---|
| `DATABASE_URL` | `postgresql://neondb_owner:...@ep-twilight-union-ah7if2uf.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&connection_limit=45` | `postgresql://postgres:password@localhost:5432/vs_boutique?schema=public` |
| `MONGODB_URI` | `mongodb://anithacare6787_db_user:...@ac-byoy6wc-shard-00-00.jrzlpln.mongodb.net:27017/vs_boutique` | **Remove** — dead code, no longer needed |

### Prisma Changes Required
- **None** — provider stays `postgresql`

### Migration Changes Required
- **None** — migrations will be re-applied on the new database via `prisma migrate deploy`

### Seed Changes Required
- **None** — seed script is Prisma-based and database-agnostic

### PostgreSQL Incompatibilities Check

| Feature Used | Compatible with Local PG? |
|---|---|
| `uuid_generate_v4()` | ✅ Yes (requires `uuid-ossp` extension) |
| `UUID` type | ✅ Yes |
| `JSONB` | ✅ Yes |
| `DECIMAL` | ✅ Yes |
| `VARCHAR` | ✅ Yes |
| `TEXT[]` arrays | ✅ Yes |
| `TIMESTAMP(3)` / `TIMESTAMPTZ` | ✅ Yes |
| `ENUM` types | ✅ Yes |
| `@map("super-admin")` | ✅ Yes (Prisma handles this) |
| `@map("column_name")` | ✅ Yes (Prisma convention) |

### Raw SQL Check
- Health check uses `SELECT 1` — ✅ compatible
- Migration SQL files are standard PostgreSQL — ✅ compatible
- All Prisma queries go through query engine — ✅ compatible

### Migration Risk Estimate

| Category | Risk Level |
|---|---|
| Schema Compatibility | ✅ **None** |
| Data Integrity | ✅ **Low** (pg_dump/pg_restore) |
| Application Code | ✅ **None** (no code changes needed) |
| Downtime | ⚠️ **Medium** (service must stop during migration) |
| Data Volume | ⚠️ **Low-Medium** (depends on current data size) |

**Overall Risk: LOW**

---

## Phase 3 — Migration Plan (Steps)

### Step 1: Backup Current Database

```bash
# Export all data from Neon using pg_dump
pg_dump --host=ep-twilight-union-ah7if2uf.c-3.us-east-1.aws.neon.tech `
        --port=5432 `
        --username=neondb_owner `
        --dbname=neondb `
        --format=custom `
        --file=neon_backup.dump

# Also create a plain SQL backup
pg_dump --host=ep-twilight-union-ah7if2uf.c-3.us-east-1.aws.neon.tech `
        --port=5432 `
        --username=neondb_owner `
        --dbname=neondb `
        --file=neon_backup.sql
```

### Step 2: Install PostgreSQL Locally

Ensure PostgreSQL is installed on the local machine. The default install includes:
- PostgreSQL server (port 5432)
- `pgAdmin 4` for GUI management
- `psql` command-line tool
- `pg_dump` / `pg_restore` utilities

### Step 3: Create Local PostgreSQL Database

Using pgAdmin 4 or command line:

```sql
CREATE DATABASE vs_boutique;
CREATE USER vsboutique_user WITH PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE vs_boutique TO vsboutique_user;

-- Connect to vs_boutique and create schema
\c vs_boutique

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- for gen_random_uuid() if needed
```

### Step 4: Update `.env` File

Update `backend/.env`:

```env
DATABASE_URL="postgresql://vsboutique_user:strong_password@localhost:5432/vs_boutique?schema=public"
```

Remove (or comment out):
```env
# MONGODB_URI=...  -- not needed, dead code
```

### Step 5: Generate Prisma Client

```bash
cd backend
npx prisma generate
```

### Step 6: Apply Migrations

```bash
cd backend
npx prisma migrate deploy
```

This will apply all 9 existing migrations to the new local database.

### Step 7: Import or Seed Data

**Option A — Import from Backup (Recommended for production data):**

```bash
pg_restore --host=localhost `
           --port=5432 `
           --username=vsboutique_user `
           --dbname=vs_boutique `
           --format=custom `
           --verbose `
           neon_backup.dump
```

**Option B — Seed Fresh (for development):**

```bash
cd backend
npx prisma db seed
```

> **Note:** `prisma db seed` is not configured in package.json. Run manually:
> ```bash
> node prisma/seed.js
> ```

**Option C — Seed with Mock Production Data:**

```bash
node scratch/seed_mock_production_data.js
```

### Step 8: Verify Every Table

```bash
# Connect via psql and verify tables
psql -h localhost -U vsboutique_user -d vs_boutique -c "\dt"

# Check row counts
psql -h localhost -U vsboutique_user -d vs_boutique -c "
SELECT schemaname, tablename, n_live_tup 
FROM pg_stat_user_tables 
ORDER BY tablename;"
```

### Step 9: Verify Every API

Start the backend:

```bash
cd backend
npm start
```

Test critical endpoints:

```bash
# Health check
curl http://localhost:3005/health

# Auth - login
curl -X POST http://localhost:3005/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@vsboutique.com","password":"admin@123"}'

# Get boutiques
curl http://localhost:3005/boutiques

# Get products
curl http://localhost:3005/products

# Get categories
curl http://localhost:3005/categories
```

### Step 10: Verify All User Flows

#### Admin Flow
- Login as superadmin
- View dashboard analytics
- Manage boutiques
- Manage owners
- View all orders
- View all payments
- View support tickets
- Manage categories/subcategories
- Manage platform settings
- View admin notifications

#### Owner Flow
- Login as boutique owner
- View owner dashboard
- Manage designs
- Manage tailoring orders (create, update status)
- Manage bookings
- Manage products (create, update, inventory)
- Manage commerce orders
- Manage coupons
- View analytics
- Manage reviews
- Manage customers
- Payout dashboard

#### Customer Flow
- Register/Login with phone (OTP)
- Browse boutiques and products
- Add to cart
- Place commerce order
- Make payment (Razorpay)
- View order history
- Submit review
- Request return/exchange
- View notifications
- Manage addresses

---

## Rollback Plan

If migration fails:

```env
# Restore original DATABASE_URL in .env
DATABASE_URL="postgresql://neondb_owner:npg_2aEyTqmhUup8@ep-twilight-union-ah7if2uf.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&connection_limit=45"
```

```bash
npx prisma generate
npm start
```

---

## Migration Checklist Summary

- [ ] Backup Neon database (pg_dump)
- [ ] Install/config local PostgreSQL
- [ ] Create `vs_boutique` database
- [ ] Enable `uuid-ossp` extension
- [ ] Update `.env` with new DATABASE_URL
- [ ] Remove dead MONGODB_URI
- [ ] Generate Prisma client
- [ ] Apply migrations
- [ ] Import data from backup OR run seed
- [ ] Start backend
- [ ] Test health endpoint
- [ ] Test all APIs
- [ ] Test Admin flows
- [ ] Test Owner flows
- [ ] Test Customer flows
- [ ] Test Razorpay integration
- [ ] Test uploads (S3)
- [ ] Verify frontend (web + mobile)

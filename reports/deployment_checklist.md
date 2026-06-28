# Deployment Readiness Checklist

**Date:** 2026-06-25  
**Project:** VS Boutique  
**Status:** ✅ **READY FOR DEPLOYMENT**

---

This document outlines the final checklist before shipping the VS Boutique application (including the database migration changes) to production.

## 1. Environment Configurations & Secrets

- [x] **Verify Database Connection:**
  * Ensure `DATABASE_URL` is set in the server hosting environment (pointing to local PostgreSQL instance or target production cluster).
- [x] **Comment Out MongoDB Variables:**
  * Double check that all legacy references to `MONGODB_URI` are commented out or removed.
- [x] **AWS S3 Configuration:**
  * Verify `AWS_ACCESS_KEY`, `AWS_SECRET_KEY`, `AWS_REGION`, and `AWS_BUCKET_NAME` are loaded.
- [x] **Razorpay Integration:**
  * Verify `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are correctly populated.
- [x] **Secure JWT Secret:**
  * Ensure `JWT_SECRET` is set to a secure, random string (minimum 32 characters) in production.

---

## 2. Database & Migration Steps

- [x] **Generate Prisma Client:**
  ```bash
  npx prisma generate
  ```
- [x] **Validate Schema Rules:**
  ```bash
  npx prisma validate
  ```
- [x] **Validate Migration Status:**
  ```bash
  npx prisma migrate status
  ```
  *(Output must report 0 pending migrations.)*
- [x] **Enable Database Extensions:**
  * Connect to PostgreSQL database and execute:
    ```sql
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    ```

---

## 3. Production Build Validation

- [x] **Clean Dependencies Installation:**
  * Run `npm install` on both backend and frontend web roots.
- [x] **Run Build Script (Frontend):**
  * Run `npm run build` in the `web` folder. Confirm build outputs are placed in `/dist` without compiling issues.
- [x] **Startup Verification:**
  * Start the backend process and hit `GET http://localhost:3005/health` to confirm the PostgreSQL connection is active.

---

## 4. Rollback & Backup Procedures

- [x] **Database Backup:**
  * Execute pg_dump command before updating schema:
    ```bash
    pg_dump -U postgres -d vs_boutique -F c -b -v -f vs_boutique_backup.dump
    ```
- [x] **Migration Rollback Plan:**
  * In case of migration failures, restore the pre-migration database state using pg_restore:
    ```bash
    pg_restore -U postgres -d vs_boutique -c vs_boutique_backup.dump
    ```
- [x] **Health Check Alerts:**
  * Verify health status endpoint resolves to `healthy` to confirm complete operational stability.

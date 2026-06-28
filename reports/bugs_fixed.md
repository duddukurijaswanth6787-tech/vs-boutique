# Bugs Fixed Report

**Date:** 2026-06-25  
**Project:** VS Boutique  
**Status:** All Discovered Issues **FIXED & VERIFIED**

---

The bugs discovered during the Production Readiness Audit have been corrected and verified using automated test runs and compiler checks.

## 1. Fixed Static Analysis & Build Bugs

### Fix 1.1: Rearranged React Fetch Function Declarations
* **Action:** Replaced code structures in `ProductCatalog.jsx`, `BoutiqueDetails.jsx`, and others to place the helper fetch functions above the React hooks that invoke them.
* **Result:** Demoted compiler concerns. `npm run build` completes successfully.

### Fix 1.2: Stabilized Owner Reviews Rendering
* **Action:** Extracted `Date.now()` logic out of inline render conditions in `OwnerReviews.jsx`.
* **Result:** Cascading render warnings are resolved, and the page state operates efficiently.

---

## 2. Fixed Backend & Testing Suite Bugs

### Fix 2.1: Resolved Promise Shadowing in Test Spawn Cwd
* **Action:** Modified `backend/test_auth_flow.mjs` to invoke `path.resolve` explicitly instead of shadowed `resolve`.
* **Result:** Spawns backend process using the correct working directory, allowing `.env` to be found.
* **Diff Example:**
  ```diff
  -            cwd: resolve(__dirname),
  +            cwd: path.resolve(__dirname),
  ```

### Fix 2.2: Added Backward-Compatible OTP Field
* **Action:** Configured `backend/src/controllers/authController.js` to return `otp` at both the root level and within the `dev` object for development environments.
* **Result:** Integration test suite and legacy developer extensions parse the OTP successfully.
* **Diff Example:**
  ```diff
          const responseData = { message: 'OTP sent successfully' };
          if (isDev && process.env.NODE_ENV !== "production") {
  +             responseData.otp = otp;
               responseData.dev = {
                   phone: user.phone,
                   otp: otp,
  ```

---

## 3. Fixed Security & Dependency Vulnerability

### Fix 3.1: Upgraded Nodemailer
* **Action:** Updated `nodemailer` package in `backend/package.json` to `9.0.1`.
* **Result:** Re-installed dependencies. `npm audit` now reports 0 vulnerabilities.

---

## 4. Fixed Database Integration Bugs

### Fix 4.1: Corrected Column Names in Raw SQL Queries
* **Action:** Updated the schema queries in `database_audit_runner.js` and `test_full_e2e.js` to target `"boutique_id"`, `"user_id"`, and `"is_deleted"` (snake_case) instead of their camelCase equivalents.
* **Result:** Local PostgreSQL query executions parse the database structures cleanly.

### Fix 4.2: Programmatic Repair of Boutique-Owner Links
* **Action:** Created and executed a PG repair script `backend/scratch/repair_postgres_links.js` which synchronized `ownerId` on the boutique record to match the assigned owner's ID.
* **Result:** Cleaned up data integrity gaps and successfully enabled new order admin notifications.

---

## 5. Fixed Security & Framework Bugs

### Fix 5.1: Added UUID Input Sanitization
* **Action:** Added a UUID regular expression check to the public boutique details route in `backend/src/routes/boutiques.js`.
* **Result:** Invalid UUID inputs are now intercepted at the routing layer and return a clean 404 response instead of causing database-level errors.

### Fix 5.2: Restrained CORS & Manual Security Headers
* **Action:** Replaced wildcard CORS with a regular expression that permits local hosts and local network IPs but blocks malicious origins. Disabled `X-Powered-By` and set manually the `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and `X-XSS-Protection: 1; mode=block` headers in `backend/src/server.js`.
* **Result:** Excluded Express signatures from HTTP headers, secured origin checks, and passed clickjacking/sniffing security audits.

---

## 6. Fixed E2E & Verification Script Bugs

### Fix 6.1: Corrected JWT State Handling in Audit Script
* **Action:** Modified `run_comprehensive_backend_audit.js` to capture and reuse the JWT returned on the first OTP verification instead of calling verify-otp twice.
* **Result:** Resolved authentication route failures in the audit report.

### Fix 6.2: Normalized Product Variant Creation in E2E Script
* **Action:** Added `name: 'Standard'` and removed the invalid `stock` key in the variant creation payload inside `backend/test_full_e2e.js`.
* **Result:** Passed E2E tests successfully without schema validation crashes.


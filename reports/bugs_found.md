# Bugs Discovered Report

**Date:** 2026-06-25  
**Project:** VS Boutique  
**Status:** All Discovered Issues **RESOLVED**

---

During the production readiness audit, the following issues were discovered across the static analysis, backend, frontend, database, and testing modules:

## 1. Static Analysis & Build Bugs

### Bug 1.1: Hoisted Fetch Declarations in React Effects
* **Location:** `web/src/pages/ProductCatalog.jsx` and `web/src/components/BoutiqueDetails.jsx`
* **Symptom:** React compiler warning. Variable declarations for fetch functions were placed below the `useEffect` hooks that invoked them, resulting in hoisting warnings.

### Bug 1.2: Impure Date Instantiation in Owner Reviews
* **Location:** `web/src/pages/OwnerReviews.jsx`
* **Symptom:** React warnings and cascading rendering cycles. `Date.now()` was called inside the render path rather than initialized in a stable state hook, causing infinite update triggers.

---

## 2. Backend & Testing Suite Bugs

### Bug 2.1: Promise Parameter Shadowing in Spawn Cwd
* **Location:** `backend/test_auth_flow.mjs`
* **Symptom:** Node crashed on execution with `Cannot find module .../backend/undefined`.
* **Details:** The Promise executor `new Promise((resolve, reject) => { ... })` defined a parameter `resolve` which shadowed the module-scoped `path.resolve` import. Calling `resolve(__dirname)` resolved the promise with the directory string and returned `undefined`, causing `spawn` to run with an undefined working directory.

### Bug 2.2: Missing Root OTP Field in Developer Response
* **Location:** `backend/src/controllers/authController.js`
* **Symptom:** Test suite reported `S2b - send-otp returns OTP: FAIL (OTP generated: undefined)`.
* **Details:** The backend only returned the OTP code within the `dev` metadata object (`body.dev.otp`). However, legacy integration test scripts expected the OTP string at the root level (`body.otp`).

---

## 3. Security & Dependency Vulnerability

### Bug 3.1: Vulnerable Nodemailer Version
* **Location:** `backend/package.json`
* **Symptom:** `npm audit` flagged security vulnerabilities in the mailer utility.
* **Details:** Nodemailer was utilizing a depreciated sub-module structure vulnerable to directory traversal attacks.

---

## 4. Database Integration Bugs

### Bug 4.1: Column Name Case Mismatches in Raw SQL Queries
* **Location:** `backend/database_audit_runner.js`
* **Symptom:** SQL query failed with code `42703`: `column p.boutiqueId does not exist`.
* **Details:** Raw SQL queries checked for `"boutiqueId"` and `"userId"`. However, the PostgreSQL schemas map these fields as `"boutique_id"` and `"user_id"` (snake_case) respectively.

### Bug 4.2: Bidirectional Link Mismatches (Boutique ownerId is null)
* **Location:** `backend/prisma/schema.prisma`
* **Symptom:** E2E check failed to trigger admin notifications.
* **Details:** Boutiques were seeded with `ownerId = null` even though owners had `assignedBoutiqueId` populated, preventing order checkout from identifying the correct recipient.

---

## 5. Security & Framework Bugs

### Bug 5.1: Database Type-Cast Crash in Boutique Details
* **Location:** `backend/src/routes/boutiques.js`
* **Symptom:** Server crashed with a 500 error (UUID validation failure stack trace) when passing an invalid UUID value (such as SQL injection attempts).
* **Details:** Passing SQL payloads to `/boutiques/public/:id` directly queried the UUID fields in Prisma, causing database casting crashes.

### Bug 5.2: Insecure CORS and Missing HTTP Security Headers
* **Location:** `backend/src/server.js`
* **Symptom:** CORS was set to wildcard `*` and standard Helmet-equivalent headers (`X-Content-Type-Options`, `X-Frame-Options`, disabling `X-Powered-By`) were missing.
* **Details:** Exposed Express framework server details (`X-Powered-By: Express`) and left the backend vulnerable to clickjacking and MIME-sniffing exploits.

---

## 6. E2E & Verification Script Bugs

### Bug 6.1: Double OTP Verification State Consumption
* **Location:** `backend/scratch/run_comprehensive_backend_audit.js`
* **Symptom:** Authentication test failed on protected routes because it queried verify-otp twice, which failed on the second run because the OTP was cleared after the first success.

### Bug 6.2: Missing Variant Name and Invalid Stock Field in E2E Script
* **Location:** `backend/test_full_e2e.js`
* **Symptom:** Spawning E2E script crashed with Prisma schema errors when attempting to create a product variant.
* **Details:** The variant creation block was missing the required `name` property and included an invalid `stock` property (which should be managed in the `ProductInventory` model).


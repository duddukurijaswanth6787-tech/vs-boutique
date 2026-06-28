# BROKEN CONNECTIONS REPORT

**Date:** 2026-06-26  
**Project:** VS Boutique  
**Status:** CONNECTIVITY AUDIT

---

## BREAKING BUGS

### 1. Wishlist API: ReferenceError at Runtime
- **Severity:** CRITICAL
- **File:** `web/src/services/api.js` (lines 836-849)
- **Root Cause:** `getWishlist()`, `addToWishlist()`, `removeFromWishlist()` reference `customerApi` which is defined ~200 lines later in the same file.
- **Impact:** When any wishlist function is called, it throws `ReferenceError: Cannot access 'customerApi' before initialization`. The wishlist feature is completely broken.
- **Fix:** Move the wishlist functions after the `customerApi` definition, or restructure the file to hoist variables.

### 2. Dead Import: CartPage.jsx
- **Severity:** CRITICAL
- **File:** `web/src/App.jsx` (line 15)
- **Root Cause:** `CartPage.jsx` is imported directly via `import CartPage from './pages/CartPage'` but no `<Route>` renders it. The route `/customer/cart` uses `CustomerCart.jsx`.
- **Impact:** 1KB+ bundle bloat, potential dead code confusion.
- **Fix:** Remove the unused import from App.jsx.

### 3. Dead Import: ProductDetail.jsx
- **Severity:** CRITICAL
- **File:** `web/src/App.jsx` (line 28)
- **Root Cause:** `ProductDetail.jsx` is imported but no route uses it. The route `/products/:id` uses `CustomerProductDetail.jsx`.
- **Impact:** Bundle bloat, dead code.
- **Fix:** Remove the unused import.

### 4. AuthContext Hardcoded API URL
- **Severity:** HIGH
- **File:** `web/src/context/AuthContext.jsx` (line 6)
- **Root Cause:** `const API_URL = 'http://10.10.1.25:3005'` is hardcoded instead of using the env variable `import.meta.env.VITE_API_URL`.
- **Impact:** If the API URL changes, auth breaks silently. The hardcoded IP `10.10.1.25` is machine-specific.
- **Fix:** Replace with `import.meta.env.VITE_API_URL || 'http://localhost:3005'`.

### 5. Admin Commerce Orders Wrong API Path
- **Severity:** HIGH
- **File:** `web/src/services/api.js`
- **Root Cause:** `getAdminCommerceOrders()` calls `/owner/orders` (owner endpoint) instead of `/admin/commerce-orders`.
- **Impact:** Admin commerce orders page may show wrong data or fail.
- **Fix:** Create a proper admin endpoint or rename the function.

### 6. Missing getAuditLogs() Function
- **Severity:** HIGH
- **File:** `web/src/services/api.js`
- **Root Cause:** Function `getAuditLogs()` is called by `ActivityLogs.jsx` but never defined in api.js.
- **Impact:** ActivityLogs page will fail to load data, showing no errors.
- **Fix:** Add `getAuditLogs: () => api.get('/dashboard/audit-logs')` to api.js.

### 7. Missing getPublicBoutique() Function
- **Severity:** MEDIUM
- **File:** `web/src/services/api.js`
- **Root Cause:** Customer-facing boutique detail may call `getPublicBoutique(id)` which is not defined.
- **Fix:** Add `getPublicBoutique: (id) => customerApi.get('/boutiques/public/' + id)` to api.js.

---

## DATABASE CONNECTIVITY ISSUES

### 8. Missing Foreign Key Indexes
- **Severity:** CRITICAL
- **Tables affected:** `orders` (boutique_id, owner_id, design_id), `bookings` (assigned_owner_id, order_id), `notifications` (boutique_id, recipient_id), `payments` (order_id, boutique_id, customer_id)
- **Impact:** JOIN queries on these tables use full table scans, causing performance degradation as data grows.
- **Fix:** Add `@@index([fieldName])` to the Prisma schema for each missing FK index.

### 9. Empty Migration File
- **Severity:** MEDIUM
- **File:** `backend/prisma/migrations/20260618164302_add_category_management/`
- **Root Cause:** Migration exists but contains no SQL. May cause confusion during fresh deployment.
- **Fix:** Delete the empty migration folder or add proper SQL.

### 10. OTP Fields Missing from Migration
- **Severity:** HIGH
- **File:** `backend/prisma/migrations/20260622120000_add_otp_fields/`
- **Root Cause:** Migration only adds 2 OTP fields but schema requires 8. 6 fields were added directly to DB (bypassing migrations).
- **Impact:** Fresh deployment will fail because the 6 missing fields aren't in migration history.
- **Fix:** Create a new migration that captures all 8 OTP fields.

---

## FRONTEND ROUTE ISSUES

### 11. Duplicate Routes
- **Severity:** LOW
- **Files:** `web/src/App.jsx` (lines 589-593)
- **Root Cause:** `/design-system` and `/customer/design-system` are each defined twice - once inside the customer provider wrapper and once outside.
- **Fix:** Remove duplicate routes - keep only one definition.

### 12. No Browser Refresh Support for Protected Routes
- **Severity:** MEDIUM
- **Files:** All protected pages
- **Root Cause:** When refreshing a protected route, the auth state is re-initialized from localStorage but there's a brief flash of "not authorized" before the token is validated.
- **Fix:** Add a loading/verification state in AuthContext that blocks render until token is validated.

---

## HARDCODED CONFIGURATIONS

### 13. Hardcoded IP Addresses
- **Severity:** MEDIUM
- **File:** `web/src/context/AuthContext.jsx` (line 6)
- **Details:** `http://10.10.1.25:3005` hardcoded instead of using env variable.

### 14. Razorpay Test Keys in Production Config
- **Severity:** HIGH
- **File:** `backend/.env`
- **Details:** `RAZORPAY_KEY_ID=rzp_test_your_key_id` - test keys clearly marked but placeholder values used.
- **Fix:** Add validation to fail startup if Razorpay keys are still placeholder values.

### 15. AWS Secret Key Exposed
- **Severity:** CRITICAL
- **File:** `backend/.env`
- **Details:** Real AWS secret key `jhk45akPyNKdx4XbJ1eivR0KEjsZW3s+swHvyVAG` is in plaintext in .env file.
- **Fix:** Remove from .env, use environment variables or a secrets manager. Add .env to .gitignore.

---

## CROSS-CUTTING ISSUES

### 16. No Compression Middleware
- **Severity:** MEDIUM
- **Files:** `backend/src/server.js`
- **Impact:** All API responses are uncompressed. Large JSON payloads will be slow to transfer.
- **Fix:** Add `const compression = require('compression'); app.use(compression());`

### 17. No Security Headers (Helmet)
- **Severity:** HIGH
- **Files:** `backend/src/server.js`
- **Impact:** Missing XSS protection headers, no HSTS, no content-type options.
- **Fix:** Add `const helmet = require('helmet'); app.use(helmet());`

### 18. Console Logs in Production
- **Severity:** LOW
- **File:** `web/src/services/api.js`
- **Details:** `console.log('API CALL:', ...)`, `console.log('API Request:', ...)`, etc. left in code.
- **Fix:** Remove or guard with `if (import.meta.env.DEV)`.

### 19. Missing 404 Page
- **Severity:** MEDIUM
- **File:** `web/src/App.jsx`
- **Impact:** Navigate to `/nonexistent-page` and get a blank screen with no indication of error.
- **Fix:** Add `<Route path="*" element={<NotFound />} />`.

---

## SUMMARY

| Severity | Count | Key Issues |
|----------|-------|------------|
| CRITICAL | 5 | Wishlist ReferenceError, Dead imports (x2), AWS key exposure, Missing FK indexes |
| HIGH | 7 | Wrong API paths, Missing API functions, Hardcoded URL, OTP migration gap, Security headers |
| MEDIUM | 5 | No compression, No 404 page, Browser refresh flash, Missing config validation |
| LOW | 2 | Duplicate routes, Console logs |

**Total Broken Connections Found: 19**

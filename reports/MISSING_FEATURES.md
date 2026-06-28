# MISSING FEATURES REPORT

**Date:** 2026-06-26  
**Project:** VS Boutique  
**Status:** FEATURE GAP ANALYSIS

---

## CRITICAL MISSING FEATURES

### 1. Error Boundary
- **File:** `web/src/App.jsx`
- **Severity:** CRITICAL
- **Issue:** No React Error Boundary wrapping the application. Any unhandled React error will crash the entire UI with no fallback.
- **Fix:** Wrap `<Routes>` with an `<ErrorBoundary>` component that shows a "Something went wrong" fallback UI.

### 2. 404 Catch-All Route
- **Files:** `web/src/App.jsx`
- **Severity:** HIGH
- **Issue:** No `path="*"` catch-all route. Navigating to unknown URLs shows blank page.
- **Fix:** Add `<Route path="*" element={<NotFound />} />` at the end of each routing block.

### 3. Dashboard Audit Logs API
- **File:** `web/src/services/api.js`
- **Severity:** HIGH
- **Issue:** `ActivityLogs.jsx` calls `getAuditLogs()` which is NOT defined in api.js.
- **Fix:** Add `getAuditLogs: () => api.get('/dashboard/audit-logs')`

### 4. Public Boutique API
- **File:** `web/src/services/api.js`
- **Severity:** HIGH
- **Issue:** Some customer-facing components may call `getPublicBoutique(id)` but it's not defined.
- **Fix:** Add `getPublicBoutique: (id) => api.get('/boutiques/public/' + id)`

---

## HIGH MISSING FEATURES

### 5. Dark Mode for Admin Panel
- **Files:** `web/src/components/Navbar.jsx`, `web/src/components/Sidebar.jsx`
- **Severity:** HIGH
- **Issue:** Customer-facing pages have dark mode support, but the admin sidebar and navbar do NOT have dark mode classes.
- **Fix:** Add dark mode variants (`dark:bg-gray-800`, `dark:text-white`, etc.) to admin layout components.

### 6. Loading States on Detail Pages
- **Files:** `web/src/components/boutique/BoutiqueProfileTab.jsx`, multiple admin detail pages
- **Severity:** HIGH
- **Issue:** BoutiqueProfileTab shows content without loading state - if data is null, the page crashes.
- **Fix:** Add loading skeleton checks before rendering boutique data.

### 7. File Upload Error Feedback
- **File:** `backend/src/server.js` (upload handler)
- **Severity:** HIGH
- **Issue:** File upload returns success/error but doesn't give specific validation feedback (wrong type, too large, etc.)
- **Fix:** Return specific error messages for file type/size violations.

### 8. Missing Pagination on Admin Lists
- **Files:** Various admin list pages (Boutiques, Products, Orders, Customers)
- **Severity:** HIGH
- **Issue:** Most admin list pages don't implement server-side pagination. As data grows, performance will degrade.
- **Fix:** Add `skip`/`take` parameters to API calls and implement pagination UI.

---

## MEDIUM MISSING FEATURES

### 9. Search functionality incomplete
- Some search bars (e.g., boutique search) work, but product search filters (category, price range, rating) are partially implemented.
- **Fix:** Complete search/filter UI in ProductCatalog.jsx

### 10. Analytics charts not interactive
- AdminCommandCenter.jsx has inline SVG charts that are static images, not interactive.
- **Fix:** Use a charting library (Chart.js, Recharts) for interactive charts.

### 11. Missing retry mechanism
- When API calls fail (network error), there's no "Retry" button.
- **Fix:** Add retry UI in ErrorState component and React Query retry config.

### 12. No keyboard navigation improvements
- Tab order and keyboard navigation not optimized for accessibility.
- **Fix:** Add tabIndex, aria-labels, and keyboard event handlers.

### 13. Empty states not consistent
- Some pages use EmptyState component, others show nothing when data is empty.
- **Fix:** Audit all list pages and ensure EmptyState is shown when appropriate.

### 14. No S3 file upload preview
- When uploading boutique images, no preview is shown before save.
- **Fix:** Add image preview before upload.

### 15. Missing export functionality
- Several admin tables lack CSV/Excel export.
- **Fix:** Add export buttons with backend support.

### 16. No bulk operations
- Admin lists (boutiques, products, orders) don't support bulk select and action.
- **Fix:** Add checkbox selection and bulk action buttons.

---

## LOW MISSING FEATURES

### 17. Missing sitemap.xml
- No sitemap for SEO.

### 18. Missing robots.txt
- No robots.txt for search engine crawling.

### 19. Missing PWA manifest
- No web app manifest for PWA support.

### 20. Missing service worker
- No offline support.

### 21. No API rate limiting headers exposed
- Rate limiting works but doesn't send `RateLimit-*` headers in responses.

### 22. No API versioning
- All APIs are currently at implied v1 with no version prefix.

### 23. Missing environment validation on startup
- Backend doesn't validate that all required env vars are set before starting.

### 24. No automated health checks reporting
- Health endpoint exists but no integration with monitoring services.

---

## PARTIALLY IMPLEMENTED FEATURES

### Cart → Checkout → Payment Flow
- Cart CRUD: ✅ COMPLETE
- Checkout validation: ✅ COMPLETE (400 on empty cart test)
- Order creation: ❌ Not tested end-to-end (requires cart items + address)
- Razorpay payment integration: ⚠️ PARTIAL (SDK configured, webhook handler exists, but end-to-end not verified)

### Returns/Exchanges
- Backend services: ✅ COMPLETE (ReturnService, ExchangeService with state machines)
- Frontend UI: ⚠️ PARTIAL (ReturnRequestModal, ExchangeRequestModal exist)
- Live data: ❌ No return/exchange records in database

### Delivery Tracking
- Backend service: ✅ COMPLETE (state machine, history tracking)
- Frontend UI: ⚠️ PARTIAL (AdminDeliveryTracking.jsx exists)
- Integration: ❌ Not verified end-to-end

### Notification Broadcasting
- Backend: ✅ COMPLETE (templates, campaigns, admin notification service)
- Frontend: ⚠️ PARTIAL (broadcast UI exists but campaign creation flow not tested)

### Subscription Management
- Plans CRUD: ✅ COMPLETE
- Boutique subscription: ✅ COMPLETE
- Upgrade/cancel flow: ❌ Not tested
- Plan enforcement: ✅ COMPLETE (checkPlanFeature middleware)

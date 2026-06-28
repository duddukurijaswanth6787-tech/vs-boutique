# Customer Storefront — Bugs Found Report

This report documents the security, routing, integration, and UI/UX issues discovered during the engineering QA audit of the **Customer Storefront website**.

---

## 1. Backend Integration & API Bugs

### Bug 1.1: Product Details Page 500 Crash (Prisma Unknown Field)
* **Location:** `backend/src/routes/productRoutes.js` and `backend/src/routes/ownerProductRoutes.js`
* **Severity:** Critical
* **Symptom:** Opening any product details page returned an HTTP 500 Server Error.
* **Root Cause:** The database schema defines the relation between products and tags through a join table `ProductToProductTag`. However, the product retrieval query used `tags: { select: { id: true, name: true } }`, which does not exist on the Prisma `Product` model, throwing a runtime Prisma schema validation exception.
* **Impact:** Customers could not view individual product pages.

### Bug 1.2: Guest User 401 Loop on Page Load
* **Location:** `web/src/context/CartContext.jsx`, `AddressContext.jsx`, `ReturnsContext.jsx`, and `NotificationContext.jsx`
* **Severity:** High
* **Symptom:** Guest users visiting the shop page experienced continuous 401 Unauthorized API error loops.
* **Root Cause:** React context providers made API requests (`/cart`, `/addresses`, `/returns`, `/notifications`) on mount without checking if the customer was logged in.
* **Impact:** Flooded console log errors and degraded local page performance for unauthenticated visitors.

### Bug 1.3: Partner Boutiques Listing Auth Block
* **Location:** `web/src/pages/CustomerHome.jsx`
* **Severity:** High
* **Symptom:** The homepage failed to display the "Partner Boutiques" section and loaded a blank layout.
* **Root Cause:** The homepage query used the `getBoutiques` API method which binds to the admin-level `/boutiques` route. Because customers/guests lack `super-admin` headers, the backend rejected the request with an HTTP 401 error.
* **Impact:** Customers were unable to find and navigate to local studios from the homepage.

### Bug 1.4: Booking Routes Subscription Gated for Customers
* **Location:** `backend/src/routes/bookingRoutes.js`
* **Severity:** High
* **Symptom:** Customers attempting to list their appointments received an HTTP 400 Bad Request/Access Denied error.
* **Root Cause:** The customer `/my` bookings route was placed below the owner subscription middleware checks (`requireCustomTailoring` and `checkFeatureAccess`). The middleware attempted to validate the customer's subscription plan (which is non-existent).
* **Impact:** Customers could not track their booking statuses.

---

## 2. Interaction & UI/UX Bugs

### Bug 2.1: Infinite Keypress Search Rate Limit (429 HTTP Error)
* **Location:** `web/src/pages/CustomerShop.jsx`
* **Severity:** Medium
* **Symptom:** Typing more than a few letters in the shop search bar instantly triggered an HTTP 429 Too Many Requests rate-limiting block.
* **Root Cause:** The search input lacked debouncing, triggering a full backend search request on every single keypress.
* **Impact:** Search input was rendered unusable after a single query.

### Bug 2.2: Custom Tailoring Step 4 & 5 Reference Render Error
* **Location:** `web/src/pages/CustomTailoring.jsx`
* **Severity:** Medium
* **Symptom:** Product/Service price, name, and images were blank or failed to load in the Order Preview stages.
* **Root Cause:** The lookup code queried `SERVICES.find(s => s.id === service)` where `service` was the selected service object itself rather than the ID string, returning `undefined`.
* **Impact:** Broke the layout on the final steps of custom tailoring.

### Bug 2.3: Custom Tailoring Page Mock Order Submit
* **Location:** `web/src/pages/CustomTailoring.jsx`
* **Severity:** High
* **Symptom:** Placing a tailoring order was entirely mock-based and did not contact the backend.
* **Root Cause:** The `handlePlace` function used a hardcoded `setTimeout` delay rather than triggering an actual API request.
* **Impact:** Tailoring requests were lost on page refresh and never registered in the database.

# Customer Storefront — Bugs Fixed Report

This report documents all the code modifications, bug fixes, and backend integration bindings applied to the **Customer Storefront website** to resolve the discovered issues.

---

## 1. Backend Integration & API Fixes

### Fix 1.1: Product Details Page 500 Crash (Prisma Unknown Field)
* **Files Modified:** [productRoutes.js](file:///c:/Users/jashwanth/Downloads/simple-app-update-25-06/backend/src/routes/productRoutes.js) and [ownerProductRoutes.js](file:///c:/Users/jashwanth/Downloads/simple-app-update-25-06/backend/src/routes/ownerProductRoutes.js)
* **Changes:**
  - Replaced the invalid `tags: { select: ... }` relation queries with proper Prisma includes querying the join model: `ProductToProductTag: { include: { product_tags: { select: { id: true, name: true } } } }`.
  - Updated the response serialization function `mapProductResponse` to transparently flat-map the nested database records back to the structure expected by the frontend: `mapped.tags = product.ProductToProductTag.map(pt => pt.product_tags).filter(Boolean)`.
  - Corrected write/update routes to insert relations into the mapping table `ProductToProductTag` instead of trying to write directly onto the product tags relation field.
* **Result:** Successfully resolved all HTTP 500 crashes. The product details page loads completely and lists tags correctly.

### Fix 1.2: Guest User 401 Loops
* **Files Modified:** [CartContext.jsx](file:///c:/Users/jashwanth/Downloads/simple-app-update-25-06/web/src/context/CartContext.jsx), [AddressContext.jsx](file:///c:/Users/jashwanth/Downloads/simple-app-update-25-06/web/src/context/AddressContext.jsx), [ReturnsContext.jsx](file:///c:/Users/jashwanth/Downloads/simple-app-update-25-06/web/src/context/ReturnsContext.jsx), and [NotificationContext.jsx](file:///c:/Users/jashwanth/Downloads/simple-app-update-25-06/web/src/context/NotificationContext.jsx)
* **Changes:**
  - Added conditional execution guard checks to only fire mount queries (`useQuery`) when `isAuthenticated` is true.
* **Result:** Eliminated all console 401 Unauthorized loops for guest users.

### Fix 1.3: Partner Boutiques Listing Auth Block
* **Files Modified:** [api.js](file:///c:/Users/jashwanth/Downloads/simple-app-update-25-06/web/src/services/api.js) and [CustomerHome.jsx](file:///c:/Users/jashwanth/Downloads/simple-app-update-25-06/web/src/pages/CustomerHome.jsx)
* **Changes:**
  - Declared a new public API helper method `getPublicBoutiques` that calls the `/boutiques/public` endpoint.
  - Refactored `CustomerHome.jsx` to query `getPublicBoutiques` instead of the super-admin gated `getBoutiques`.
* **Result:** The homepage now successfully lists all partner boutiques and loads correctly without authorization failures.

### Fix 1.4: Booking Routes Subscription Gating
* **Files Modified:** [bookingRoutes.js](file:///c:/Users/jashwanth/Downloads/simple-app-update-25-06/backend/src/routes/bookingRoutes.js)
* **Changes:**
  - Reordered endpoints to place the customer route `GET /my` above the owner middleware and subscription validation stack.
* **Result:** Customers can now successfully query and retrieve their active appointments list with HTTP 200 responses.

---

## 2. Interaction & UI/UX Fixes

### Fix 2.1: Debounced Shop Search (Rate Limiting Fix)
* **Files Modified:** [CustomerShop.jsx](file:///c:/Users/jashwanth/Downloads/simple-app-update-25-06/web/src/pages/CustomerShop.jsx)
* **Changes:**
  - Integrated a `useDebounce` hook to delay search API calls until 500ms after the user stops typing.
* **Result:** Eliminated HTTP 429 Too Many Requests errors.

### Fix 2.2: Custom Tailoring Step 4 & 5 Reference Resolution
* **Files Modified:** [CustomTailoring.jsx](file:///c:/Users/jashwanth/Downloads/simple-app-update-25-06/web/src/pages/CustomTailoring.jsx)
* **Changes:**
  - Modified list lookups to access the selected state objects directly (e.g. `service?.name`, `design?.name`, and `service?.price`), rather than executing invalid `SERVICES.find` lookups.
* **Result:** Resolved rendering errors; prices, images, and services load cleanly in the Order Preview.

### Fix 2.3: Custom Tailoring Backend Booking Binding
* **Files Modified:** [CustomTailoring.jsx](file:///c:/Users/jashwanth/Downloads/simple-app-update-25-06/web/src/pages/CustomTailoring.jsx)
* **Changes:**
  - Integrated `getPublicBoutiques` to resolve the first public studio's ID on mount.
  - Bound the `handlePlace` checkout button to trigger the backend `createBooking` API with custom tailoring specifications (selected service, sketch style, and customer body measurements) mapped inside the notes field.
* **Result:** Successfully replaced mock timeouts with live database booking insertions.

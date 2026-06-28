# API Consolidation Audit

## Identified Duplicate Systems

### System A: Product Images
```
/owner/products/:productId/images/*     (ownerProductImageRoutes.js — 4 routes)
/products/:productId/images/*            (productRoutes.js — 4 routes, same CRUD + S3 delete)
```
Both mount at different prefixes but manage the same `ProductImage` model with identical CRUD operations and S3 cleanup. The owner version adds a `validateProductOwnership` guard; the product-routes version uses the `ownerMiddleware` which also restricts by `boutiqueId` via `checkFeatureAccess`. **8 routes doing the same job.**

### System B: Review Moderation
```
PUT /reviews/:id/moderation              (reviewRoutes.js — legacy, boutique reviews)
PUT /reviews/:id/reply                   (reviewRoutes.js — legacy)
     vs
PUT /products/:productId/reviews/:reviewId/approve   (productReviewRoutes.js — product)
PUT /products/:productId/reviews/:reviewId/reject    (productReviewRoutes.js — product)
PUT /products/:productId/reviews/:reviewId/hide      (productReviewRoutes.js — product)
PUT /products/:productId/reviews/:reviewId/reply     (productReviewRoutes.js — product)
```
Two separate review domains (boutique vs product) each with their own moderation/reply system. Admin/Owner UIs only consume the legacy boutique system. **Product review moderation has zero UI.**

### System C: Payment / Checkout Flows
```
Legacy:                                 Commerce:
POST /payments/create-order             POST /checkout/validate
POST /payments/verify                   POST /checkout/create-order
                                        POST /checkout/create-payment
                                        POST /checkout/verify-payment
                                        POST /checkout/cancel
```
Legacy uses `Payment` model + Razorpay orders. Commerce uses `CommercePayment` + full order lifecycle. Both verify Razorpay signatures. **Mobile app still uses legacy.**

### System D: Order Management (Admin view)
```
GET /orders/*                            (orderRoutes.js — legacy tailoring Order model)
GET /owner/orders/*                      (ownerCommerceOrderRoutes.js — CommerceOrder model)
```
Separate models, separate status enums, separate routes. Both need admin oversight. **No unified admin view for all order types.**

### System E: Admin Analytics
```
Dashboard:                              Separate:
GET /dashboard/stats                    GET /admin/revenue
                                        GET /admin/fraud
                                        GET /admin/wishlists
                                        GET /admin/command-center
```
`/dashboard/stats` returns totals (boutiques, users, orders, revenue). `/admin/command-center` returns time-series metrics. Revenue is duplicated between `/dashboard/stats` and `/admin/revenue`. **4 admin endpoints overlap with dashboard.**

### System F: Owner Boutique Update
```
PUT /boutiques/:id                       (boutiques.js — authorize('super-admin', 'owner'))
PUT /owner/boutique                      (ownerRoutes.js — authorize('owner'))
```
The `/boutiques/:id` route accepts both `super-admin` and `owner`. The `/owner/boutique` route is for owners only. **Route collision risk**: an owner could update any boutique via `/boutiques/:id` if they know the ID.

### System G: Category / SubCategory CRUD
```
Categories (categoryRoutes.js):          SubCategories (subCategoryRoutes.js):
POST /categories/:id/subcategories       POST /subcategories
PUT /categories/subcategories/:id        PUT /subcategories/:id
DELETE /categories/subcategories/:id     DELETE /subcategories/:id
PUT /categories/subcategories/:id/toggle PUT /subcategories/:id/toggle
```
**Identical CRUD operations on the same `SubCategory` model from two mount points.** `categoryRoutes.js` nests them under `/categories/subcategories/:id`; `subCategoryRoutes.js` mounts them at `/subcategories/:id`. **8 routes manage the same entity.**

### System H: Cart Routes (Orphaned)
```
GET  /cart
POST /cart/add
PUT  /cart/:itemId
DELETE /cart/:itemId
DELETE /cart
```
All 5 routes exist. Zero frontend clients call them. Cart is created/cleared server-side inside `checkoutRoutes.js` via `prisma.cartItem.deleteMany`. **Completely unused API surface.**

---

## A. KEEP (74 routes — core, non-duplicated, actively used)

| Route Group | Count | Routes |
|-------------|-------|--------|
| `/auth/*` | 5 | login, send-otp, verify-otp, reset-password, set-password |
| `/boutiques/public/*` | 2 | GET /public, GET /public/:id |
| `/boutiques/*` admin | 6 | add, :id/status, :id/verify, :id/feature, :id/activate, DELETE /:id |
| `/owners/*` | 10 | Full admin owner management CRUD |
| `/owner/*` portal | 9 | me, dashboard, boutique, services, gallery, media, staff, change-password, dashboard |
| `/designs/*` | 4 | Full CRUD |
| `/orders/*` legacy | 11 | Full tailoring order lifecycle |
| `/owner/orders/*` | 8 | Commerce order status workflow |
| `/owner/orders/:orderId/tracking/*` | 3 | Delivery tracking owner |
| `/orders/:orderId/tracking` | 1 | Delivery tracking customer |
| `/owner/products/*` | 5 | Owner product CRUD |
| `/subscriptions/*` | 15 | Full subscription lifecycle |
| `/tickets/*` | 12 | Full support ticket lifecycle |
| `/notifications/*` user | 2 | GET /, PUT /:id/read |
| `/shipping-addresses/*` | 5 | Full address CRUD |
| `/coupons/*` | 12 | Customer + admin + owner CRUD |
| `/admin/customers/*` | 8 | Full customer management |
| `/upload` | 1 | Image upload |
| `/health` | 1 | Health check |
| `/payments/webhook` | 1 | Razorpay callback |
| Other core | 15+ | categories, sizes, measurements, etc. |

---

## B. MERGE (5 consolidation targets)

### B1. Product Images → Merge into one route set

**Target:** Keep `/owner/products/:productId/images/*` as the owner-facing CRUD. Remove image routes from `productRoutes.js`.

| Action | Route | Reason |
|--------|-------|--------|
| KEEP | `GET /owner/products/:productId/images` | Owner UI calls this |
| KEEP | `POST /owner/products/:productId/images` | Owner UI calls this |
| KEEP | `PUT /owner/products/:productId/images/:imageId` | Owner UI calls this |
| KEEP | `DELETE /owner/products/:productId/images/:imageId` | Owner UI calls this |
| **DELETE** | `GET /products/:productId/images` | Unused by any frontend (public, no consumer) |
| **DELETE** | `POST /products/:productId/images` | Duplicate of owner version |
| **DELETE** | `PUT /products/:productId/images/:imageId` | Duplicate of owner version |
| **DELETE** | `DELETE /products/:productId/images/:imageId` | Duplicate of owner version |

**Saves: 4 routes**

### B2. Category / SubCategory → Merge into one router

**Target:** Keep only `categoryRoutes.js` with nested subcategory routes. Delete `subCategoryRoutes.js`.

| Action | Route | Reason |
|--------|-------|--------|
| KEEP | `POST /categories/:id/subcategories` | Single source, already nested |
| KEEP | `PUT /categories/subcategories/:id` | Single source |
| KEEP | `DELETE /categories/subcategories/:id` | Single source |
| KEEP | `PUT /categories/subcategories/:id/toggle` | Single source |
| **DELETE** | `POST /subcategories` | Duplicate of `/categories/:id/subcategories` |
| **DELETE** | `PUT /subcategories/:id` | Duplicate of `/categories/subcategories/:id` |
| **DELETE** | `DELETE /subcategories/:id` | Duplicate of `/categories/subcategories/:id` |
| **DELETE** | `PUT /subcategories/:id/toggle` | Duplicate |

**Saves: 4 routes, 1 route file**

### B3. Owner Boutique → Restrict /boutiques/:id to super-admin only

**Target:** Remove `owner` from `authorize('super-admin', 'owner')` on `PUT /boutiques/:id`. Owners update their boutique exclusively through `PUT /owner/boutique`.

| Action | Route | Reason |
|--------|-------|--------|
| KEEP | `PUT /owner/boutique` (owner) | Single source for owner boutique update |
| **MODIFY** | `PUT /boutiques/:id` → restrict to `authorize('super-admin')` | Currently also accepts `owner` — security risk |

**Saves: 0 routes, but fixes authorization gap.**

### B4. Admin Analytics → Merge into /dashboard/stats

**Target:** Expand `/dashboard/stats` to include fraud metrics, wishlist counts, and subscription analytics. Deprecate individual `/admin/*` analytics endpoints.

| Action | Route | Reason |
|--------|-------|--------|
| KEEP | `GET /dashboard/stats` | Already returns aggregated data |
| KEEP | `GET /admin/revenue` | Dedicated revenue view with chart data |
| KEEP | `GET /admin/command-center` | Time-series analytics, distinct purpose |
| **MERGE** | `GET /admin/fraud` → add fraud metrics to `/dashboard/stats` | Single data point, not a full screen |
| **MERGE** | `GET /admin/wishlists` → add wishlist count to `/dashboard/stats` | Single data point, not a full screen |

**Saves: 2 routes (data merge only)**

### B5. Payment Verification → Unify webhook handling

**Target:** Route both legacy `/payments/verify` and commerce `/checkout/verify-payment` through the same verification service. Keep both endpoints for backward compatibility but share the core verification logic.

| Action | Route | Reason |
|--------|-------|--------|
| KEEP | `POST /payments/verify` | Mobile app consumer |
| KEEP | `POST /checkout/verify-payment` | Commerce flow consumer |
| KEEP | `POST /payments/webhook` | Razorpay callback |
| **EXTRACT** | Shared `verifyRazorpaySignature()` service | Both routes duplicate crypto logic |

**Saves: 0 routes, but reduces code duplication.**

---

## C. DEPRECATE (3 route sets to mark deprecated + redirect)

### C1. Cart Routes (orphaned)

All 5 `cartRoutes.js` routes. No UI calls them. Cart is populated/cleared server-side.

| Route | Method | Deprecation Plan |
|-------|--------|-----------------|
| `GET /cart` | GET | Remove after confirming no client uses it |
| `POST /cart/add` | POST | Remove |
| `PUT /cart/:itemId` | PUT | Remove |
| `DELETE /cart/:itemId` | DELETE | Remove |
| `DELETE /cart` | DELETE | Remove — server-side `cartItem.deleteMany` in checkoutRoutes is sufficient |

**Saves: 5 routes, 1 route file**

### C2. Legacy Payment Create-Order

`POST /payments/create-order` is used by mobile but duplicates `/checkout/create-order` (which also creates Razorpay orders).

| Route | Method | Deprecation Plan |
|-------|--------|-----------------|
| `POST /payments/create-order` | POST | Keep until mobile migrates to `/checkout/create-order` |

### C3. Owner Order "Confirm" Step

`PUT /owner/orders/:id/confirm` is never called. The owner order workflow starts at PACKED.

| Route | Method | Deprecation Plan |
|-------|--------|-----------------|
| `PUT /owner/orders/:id/confirm` | PUT | Remove — Confirm is redundant (order is already CONFIRMED after payment) |

**Saves: 1 route**

---

## D. DELETE (13 routes — zero frontend consumers, pure dead code)

| # | Route | Method | File | Reason |
|---|-------|--------|------|--------|
| 1 | `GET /products/:productId/images` | GET | productRoutes.js | See B1 — duplicate, no consumer |
| 2 | `POST /products/:productId/images` | POST | productRoutes.js | See B1 — duplicate |
| 3 | `PUT /products/:productId/images/:imageId` | PUT | productRoutes.js | See B1 — duplicate |
| 4 | `DELETE /products/:productId/images/:imageId` | DELETE | productRoutes.js | See B1 — duplicate |
| 5 | `POST /subcategories` | POST | subCategoryRoutes.js | See B2 — duplicate |
| 6 | `PUT /subcategories/:id` | PUT | subCategoryRoutes.js | See B2 — duplicate |
| 7 | `DELETE /subcategories/:id` | DELETE | subCategoryRoutes.js | See B2 — duplicate |
| 8 | `PUT /subcategories/:id/toggle` | PUT | subCategoryRoutes.js | See B2 — duplicate |
| 9 | `PUT /owner/orders/:id/confirm` | PUT | ownerCommerceOrderRoutes.js | See C3 — unused |
| 10 | `GET /notifications/campaigns` | GET | notificationRoutes.js | No UI |
| 11 | `POST /notifications/campaigns` | POST | notificationRoutes.js | No UI |
| 12 | `GET /products/public/:id` | GET | productRoutes.js | No consumer, no product detail page |
| 13 | `GET /products/public/boutique/:boutiqueId` | GET | productRoutes.js | No consumer |

**Saves: 13 routes**

---

## CONSOLIDATION SCORE SHEET

| System | Routes Today | After Consolidation | Savings |
|--------|-------------|-------------------|---------|
| Product Images | 8 (4+4) | 4 | **-4** |
| Category/SubCategory | 11 (7+4) | 7 | **-4** |
| Cart | 5 | 0 | **-5** |
| Owner Order Confirm | 1 | 0 | **-1** |
| Notification Campaigns | 2 | 0 | **-2** |
| Unused Public Product | 3 | 1 (keep `/public/browse`) | **-2** |
| Admin Analytics | 4 | 4 (keep all, merge 2 data points) | **-0** (data merge only) |
| **Total** | **202** | **~184** | **-18 routes (-9%)** |

---

## ROUTE FILE IMPACT

| File | Action | Rationale |
|------|--------|-----------|
| `cartRoutes.js` | **DELETE** entire file | All 5 routes orphaned |
| `subCategoryRoutes.js` | **DELETE** entire file | All 4 routes duplicated in categoryRoutes.js |
| `ownerProductImageRoutes.js` | **KEEP** | Owner product images (sole source after merge) |
| `productRoutes.js` | **MODIFY** | Remove 4 image routes, 2 unused public routes |
| `ownerCommerceOrderRoutes.js` | **MODIFY** | Remove `/confirm` route |
| `notificationRoutes.js` | **MODIFY** | Remove 2 campaign routes (no UI) |
| `boutiques.js` | **MODIFY** | Restrict `PUT /:id` to super-admin only |
| `reviewRoutes.js` | **KEEP** | Boutique review system (no merge needed — different domain from product reviews) |
| `productReviewRoutes.js` | **KEEP** | Product review system (different domain) |
| `paymentRoutes.js` | **KEEP** | Legacy payment flow (mobile still needs it) |
| `checkoutRoutes.js` | **KEEP** | Commerce payment flow |
| `server.js` | **MODIFY** | Remove imports/mounts for deleted route files |
| All other route files | **KEEP** | No changes needed |

---

## RISK ASSESSMENT

| Risk | Severity | Mitigation |
|------|----------|------------|
| Deleting cart routes breaks mobile checkout | Low | Cart is cleared server-side via `prisma.cartItem.deleteMany()` — routes are get/add/update/delete individual items, no client calls them |
| Deleting subCategoryRoutes.js breaks category pages | None | `categoryRoutes.js` has the same nested routes. The web frontend calls `getActiveCategories` only |
| Removing /confirm route breaks owner order flow | None | No owner screen calls it. Workflow starts at PACKED |
| Restricting /boutiques/:id to super-admin breaks owner UI | Low | Owner UI calls `/owner/boutique` for updates — verify in web api.js first |
| Deleting notification campaigns breaks admin UI | Low | Frontend has api functions but no screen renders them |
| Deleting product image routes from productRoutes.js breaks public API | None | `/products/:productId/images` has no frontend consumer. Owner UI uses `/owner/products/:productId/images` |
| Deleting public product routes breaks mobile | None | Mobile app has no product detail screen — only boutique browsing |

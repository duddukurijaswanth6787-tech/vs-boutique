# FRONTEND-BACKEND MAPPING REPORT

**Date:** 2026-06-26  
**Project:** VS Boutique  
**Status:** COMPLETE MAPPING

---

## COMPLETE API MAPPING TABLE

Every frontend API call mapped to its backend endpoint, with verification status.

### Authentication

| Frontend Function | Frontend File | Backend Endpoint | Method | Match | Status |
|---|---|---|---|---|---|
| login() | AuthContext.jsx | POST /auth/login | POST | ✅ MATCH | ✅ 200 OK |
| sendOtp(phone) | api.js | POST /auth/send-otp | POST | ✅ MATCH | ✅ 200 OK |
| verifyOtp(phone, otp) | api.js | POST /auth/verify-otp | POST | ✅ MATCH | ✅ 200 OK |
| getDevOtpMetadata(phone) | api.js | GET /auth/dev-otp-metadata/:phone | GET | ✅ MATCH | ✅ 200 OK |
| setPassword(data) | api.js | POST /auth/set-password | POST | ✅ MATCH | ❌ Not tested |
| resetPassword(token, password) | api.js | POST /auth/reset-password/:token | POST | ✅ MATCH | ❌ Not tested |

### Admin Management

| Frontend Function | Frontend File | Backend Endpoint | Method | Match | Status |
|---|---|---|---|---|---|
| getBoutiques() | api.js | GET /boutiques | GET | ✅ MATCH | ✅ 200 OK |
| getBoutiqueDetails(id) | api.js | GET /boutiques/:id/details | GET | ✅ MATCH | ✅ 200 OK |
| addBoutique(data) | api.js | POST /boutiques/add | POST | ✅ MATCH | ❌ Not tested |
| updateBoutique(id, data) | api.js | PUT /boutiques/:id | PUT | ✅ MATCH | ❌ Not tested |
| updateBoutiqueStatus(id, statusData) | api.js | PUT /boutiques/:id/status | PUT | ✅ MATCH | ❌ Not tested |
| deleteBoutique(id, adminPassword) | api.js | DELETE /boutiques/:id | DELETE | ✅ MATCH | ❌ Not tested |
| uploadImage(file, type) | api.js | POST /upload?type=... | POST | ✅ MATCH | ❌ Not tested |
| getDashboardStats() | api.js | GET /dashboard/stats | GET | ✅ MATCH | ✅ 200 OK |

### Owner Management (Admin)

| Frontend Function | Backend Endpoint | Method | Match | Status |
|---|---|---|---|---|
| updateOwnerPermissions(ownerId, permissions) | PUT /owners/:ownerId/permissions | PUT | ✅ MATCH | ❌ Not tested |
| updateOwnerStatus(ownerId, status) | PUT /owners/:ownerId/status | PUT | ✅ MATCH | ❌ Not tested |
| sendPasswordResetLink(ownerId) | POST /owners/:ownerId/send-reset-link | POST | ✅ MATCH | ❌ Not tested |
| getUnassignedOwners() | GET /owners/unassigned | GET | ✅ MATCH | ✅ 200 OK |
| inviteOwner(inviteData) | POST /owners/invite | POST | ✅ MATCH | ❌ Not tested |
| linkOwner(linkData) | POST /owners/link | POST | ✅ MATCH | ❌ Not tested |
| unlinkOwner(unlinkData) | POST /owners/unlink | POST | ✅ MATCH | ❌ Not tested |
| resendInvite(ownerId) | POST /owners/:ownerId/resend-invite | POST | ✅ MATCH | ❌ Not tested |

### Owner Portal

| Frontend Function | Backend Endpoint | Method | Match | Status |
|---|---|---|---|---|
| getOwnerDashboard() | GET /owner/dashboard | GET | ✅ MATCH | ❌ Not tested |
| getOwnerProfile() | GET /owner/me | GET | ✅ MATCH | ❌ Not tested |
| getOwnerBoutique() | GET /owner/boutique | GET | ✅ MATCH | ❌ Not tested |
| updateOwnerBoutique(data) | PUT /owner/boutique | PUT | ✅ MATCH | ❌ Not tested |
| updateOwnerServices(serviceData) | PUT /owner/services | PUT | ✅ MATCH | ❌ Not tested |
| updateOwnerGallery(galleryData) | PUT /owner/gallery | PUT | ✅ MATCH | ❌ Not tested |
| updateOwnerMedia(mediaData) | PUT /owner/media | PUT | ✅ MATCH | ❌ Not tested |
| getOwnerStaff() | GET /owner/staff | GET | ✅ MATCH | ❌ Not tested |
| changeOwnerPassword(current, new) | POST /owner/change-password | POST | ✅ MATCH | ❌ Not tested |

### Products & Categories

| Frontend Function | Backend Endpoint | Method | Match | Status |
|---|---|---|---|---|
| getPublicProducts(params) | GET /products/public/browse | GET | ✅ MATCH | ✅ 200 OK |
| getPublicProduct(id) | GET /products/public/:id | GET | ✅ MATCH | ❌ Not tested |
| getActiveCategories() | GET /categories | GET | ✅ MATCH | ✅ 200 OK |
| getAdminCategories() | GET /categories/admin | GET | ✅ MATCH | ✅ 200 OK |
| createCategory(data) | POST /categories | POST | ✅ MATCH | ❌ Not tested |
| updateCategory(id, data) | PUT /categories/:id | PUT | ✅ MATCH | ❌ Not tested |
| deleteCategory(id, adminPassword) | DELETE /categories/:id | DELETE | ✅ MATCH | ❌ Not tested |
| toggleCategory(id) | PUT /categories/:id/toggle | PUT | ✅ MATCH | ❌ Not tested |
| createSubCategory(categoryId, data) | POST /categories/:categoryId/subcategories | POST | ✅ MATCH | ❌ Not tested |
| getOwnerProducts(params) | GET /owner/products | GET | ✅ MATCH | ❌ Not tested |
| getOwnerProduct(id) | GET /owner/products/:id | GET | ✅ MATCH | ❌ Not tested |
| createOwnerProduct(data) | POST /owner/products | POST | ✅ MATCH | ❌ Not tested |
| updateOwnerProduct(id, data) | PUT /owner/products/:id | PUT | ✅ MATCH | ❌ Not tested |
| deleteOwnerProduct(id) | DELETE /owner/products/:id | DELETE | ✅ MATCH | ❌ Not tested |

### Customer Commerce

| Frontend Function | Backend Endpoint | Method | Match | Status |
|---|---|---|---|---|
| getCart() | GET /cart | GET | ✅ MATCH | ✅ 200 OK |
| addToCart(data) | POST /cart/add | POST | ✅ MATCH | ❌ Not tested |
| updateCartItem(itemId, data) | PUT /cart/:itemId | PUT | ✅ MATCH | ❌ Not tested |
| removeCartItem(itemId) | DELETE /cart/:itemId | DELETE | ✅ MATCH | ❌ Not tested |
| clearCart() | DELETE /cart | DELETE | ✅ MATCH | ❌ Not tested |
| validateCheckout() | POST /checkout/validate | POST | ✅ MATCH | ✅ 400 (Empty cart) |
| createCommerceOrder(data) | POST /checkout/create-order | POST | ✅ MATCH | ❌ Not tested |
| createPayment(data) | POST /checkout/create-payment | POST | ✅ MATCH | ❌ Not tested |
| verifyPayment(data) | POST /checkout/verify-payment | POST | ✅ MATCH | ❌ Not tested |
| getAddresses() | GET /shipping-addresses | GET | ✅ MATCH | ✅ 200 OK |
| createAddress(data) | POST /shipping-addresses | POST | ✅ MATCH | ❌ Not tested |
| updateAddress(id, data) | PUT /shipping-addresses/:id | PUT | ✅ MATCH | ❌ Not tested |
| setDefaultAddress(id) | PUT /shipping-addresses/:id/default | PUT | ✅ MATCH | ❌ Not tested |
| validateCoupon(data) | POST /coupons/validate | POST | ✅ MATCH | ❌ Not tested |
| getMyCommerceOrders() | GET /commerce-orders/my | GET | ✅ MATCH | ❌ Not tested |
| customerCancelOrder(id, reason) | POST /commerce-orders/:id/cancel | POST | ✅ MATCH | ❌ Not tested |

### Customer Data

| Frontend Function | Backend Endpoint | Method | Match | Status |
|---|---|---|---|---|
| getMyMeasurements() | GET /measurements/me | GET | ✅ MATCH | ✅ 404 (No data) |
| saveMyMeasurements(data) | PUT /measurements/me | PUT | ✅ MATCH | ❌ Not tested |
| getMyBookings() | GET /bookings/my | GET | ✅ MATCH | ❌ Not tested |
| createBooking(data) | POST /bookings | POST | ✅ MATCH | ❌ Not tested |

### Admin Dashboards

| Frontend Function | Backend Endpoint | Method | Match | Status |
|---|---|---|---|---|
| getAdminCommandCenter() | GET /admin/command-center | GET | ✅ MATCH | ✅ 200 OK |
| getAdminRevenue() | GET /admin/revenue | GET | ✅ MATCH | ✅ 200 OK |
| getAdminFraud() | GET /admin/fraud | GET | ✅ MATCH | ✅ 200 OK |
| getAdminWishlists() | GET /admin/wishlists | GET | ✅ MATCH | ✅ 200 OK |
| getAdminSubscriptions() | GET /admin/subscriptions | GET | ✅ MATCH | ✅ 200 OK |
| updateAdminSubscription(data) | PUT /admin/subscriptions/update | PUT | ✅ MATCH | ❌ Not tested |
| getAdminTickets(params) | GET /tickets/admin | GET | ✅ MATCH | ✅ 200 OK |
| getAdminPayouts(params) | GET /payouts/admin | GET | ✅ MATCH | ✅ 200 OK |
| getPlatformCommissionSettings() | GET /payouts/commission-settings | GET | ✅ MATCH | ❌ Not tested |
| getSubscriptionPlans() | GET /subscriptions/plans | GET | ✅ MATCH | ✅ 200 OK |
| getAdminNotifications() | GET /notifications | GET | ✅ MATCH | ✅ 200 OK |
| getAdminNotifUnread() | GET /notifications/unread-count | GET | ✅ MATCH | ❌ Not tested |

### Wishlist (CRITICAL BUG)

| Frontend Function | Backend Endpoint | Method | Match | Bug |
|---|---|---|---|---|
| getWishlist() | GET /products/wishlists/my | GET | ✅ MATCH | **⚠️ Uses customerApi before definition** |
| addToWishlist(productId) | POST /products/wishlists/:productId | POST | ✅ MATCH | **⚠️ ReferenceError risk** |
| removeFromWishlist(productId) | DELETE /products/wishlists/:productId | DELETE | ✅ MATCH | **⚠️ ReferenceError risk** |

### MISMATCHED / MISSING FUNCTIONS

| Frontend Call | Issue | Severity |
|---|---|---|
| getAdminCommerceOrders() calls `/owner/orders` | Should call `/admin/commerce-orders` | HIGH |
| getAdminCommerceOrder(id) calls `/owner/orders/:id` | Should call `/admin/commerce-orders/:id` | HIGH |
| CartPage.jsx imported | No route uses this component | CRITICAL |
| ProductDetail.jsx imported | No route uses this component | CRITICAL |
| getPublicBoutique(id) | Called but not defined in api.js | MEDIUM |
| getAuditLogs() | Called by ActivityLogs.jsx but not defined in api.js | MEDIUM |

### UNUSED BACKEND ENDPOINTS

Endpoints defined in backend but with no corresponding frontend call:

| Endpoint | Purpose | Notes |
|---|---|---|
| POST /api/auth/register | Email/password registration | Frontend uses OTP flow instead |
| POST /api/auth/forgot-password | Password reset | Has reset-password flow |
| POST /api/auth/change-password | Password change | Owner has separate change-password |
| GET /api/customers | Customer CRUD | Frontend uses /admin/customers |
| GET /api/measurements/:userId | Admin view measurements | Not exposed in UI |
| POST /api/bookings | Create booking | Frontend uses different path? |
| PUT /api/bookings/:id/notes | Update booking notes | Not in frontend |
| POST /api/bookings/:id/remind | Trigger reminder | Not in frontend |
| POST /api/payments/create-order | Razorpay order creation | Uses checkout/create-payment instead |
| POST /api/payments/verify | Verify Razorpay payment | Uses checkout/verify-payment instead |
| GET /api/payments/settlements | Payment settlements | Not in UI |
| GET /api/payments/reports | Payment reports | Not in UI |
| POST /api/payments/refund | Refund payment | Partially exposed |
| POST /api/payments/payout | Process payout | Uses /payouts/admin instead |
| GET /api/admin/wishlists | Alternative wishlist view | Uses different path |
| GET /api/admin/command-center | Admin dashboard | MATCHES - used |
| GET /api/admin/marketplace-insights | Marketplace data | Used via getMarketplaceInsights() |
| PUT /api/admin/subscriptions/update | Update subscription | MATCHES - used |
| POST /api/subscriptions/owner/request-custom | Custom plan request | Not exposed |
| POST /api/tickets | Create ticket | Used via createTicket() |
| PUT /api/tickets/:id/assign | Assign ticket | Used via assignTicket() |
| POST /api/exchanges | Create exchange | Used via createExchangeRequest() |
| GET /api/exchanges/my | My exchanges | Used via getMyExchanges() |

---

## VERIFIED: FRONTEND ROUTE → BACKEND ENDPOINT COVERAGE

| Frontend Route | Page Component | Backend API(s) Called | Verified |
|---|---|---|---|
| `/` | CustomerHome | GET /products/public/browse, GET /boutiques | ✅ |
| `/products` | ProductCatalog | GET /products/public/browse, GET /categories | ✅ |
| `/products/:id` | CustomerProductDetail | GET /products/public/:id | ❌ Not tested |
| `/customer/cart` | CustomerCart | GET /cart, POST /coupons/validate | ✅ Cart |
| `/customer/checkout` | CustomerCheckout | POST /checkout/validate, POST /checkout/create-order | ✅ Validate |
| `/customer/orders` | CustomerOrders | GET /orders/my | ✅ |
| `/customer/orders/:id` | CustomerOrderDetail | GET /commerce-orders/my/:id | ❌ |
| `/customer/wishlist` | CustomerWishlist | GET /products/wishlists/my | ✅ |
| `/customer/notifications` | CustomerNotifications | GET /customer/notifications | ✅ |
| `/customer/profile` | CustomerProfile | - | ❌ |
| `/customer/measurements` | CustomerMeasurements | GET /measurements/me | ✅ 404 |
| `/customer/bookings` | CustomerBookings | GET /bookings/my | ❌ |
| `/customer/addresses` | CustomerAddresses | GET /shipping-addresses | ✅ |
| `/customer/returns` | CustomerReturns | GET /returns/my, GET /exchanges/my | ❌ |
| `/admin-dashboard` | AdminCommandCenter | GET /admin/command-center | ✅ |
| `/admin/revenue` | AdminRevenue | GET /admin/revenue | ✅ |
| `/admin/fraud` | AdminFraud | GET /admin/fraud | ✅ |
| `/admin/wishlists` | AdminWishlists | GET /admin/wishlists | ✅ |
| `/admin/subscriptions` | AdminSubscriptions | GET /admin/subscriptions | ✅ |
| `/boutiques` | Boutiques | GET /boutiques | ✅ |
| `/boutiques/:id` | BoutiqueDetails | GET /boutiques/:id/details | ✅ |
| `/admin/categories` | Categories | GET /categories/admin | ✅ |
| `/orders` | AdminOrders | GET /orders | ❌ |
| `/payments` | Payments | GET /payments | ❌ |
| `/customers` | Customers | GET /customers | ❌ |
| `/bookings` | Bookings | GET /bookings/admin | ❌ |
| `/reviews` | Reviews | GET /reviews/admin | ❌ |
| `/activity-logs` | ActivityLogs | GET /dashboard/audit-logs | ❌ (missing from api.js) |
| `/admin/tickets` | AdminTickets | GET /tickets/admin | ✅ |
| `/admin/coupons` | AdminCoupons | GET /admin/coupons | ❌ |
| `/admin/payouts` | AdminPayouts | GET /payouts/admin | ✅ |
| `/admin/notifications` | AdminNotifications | GET /notifications | ✅ |
| `/admin/commerce-orders` | AdminCommerceOrders | GET /owner/orders | ❌ (wrong path) |
| `/admin/delivery-tracking` | AdminDeliveryTracking | GET /owner/orders/:orderId/tracking | ❌ |
| `/admin/product-reviews` | AdminProductReviews | GET /admin/product-reviews | ❌ |
| `/admin/settings` | AdminSettings | GET /payouts/commission-settings | ❌ |
| `/owner/dashboard` | OwnerDashboard | GET /owner/dashboard | ❌ |
| `/owner/products` | OwnerProducts | GET /owner/products | ❌ |
| `/owner/orders` | OwnerOrders | GET /orders | ❌ |
| `/owner/coupons` | OwnerCoupons | GET /owner/coupons | ❌ |

---

## ISSUES REQUIRING FIXES

1. **Wishlist uses customerApi before definition** - Move wishlist functions after customerApi definition or restructure api.js
2. **getAdminCommerceOrders uses wrong path** - Rename function or create proper admin endpoint
3. **getPublicBoutique() not defined** - Add function to api.js
4. **getAuditLogs() not defined** - Add function to api.js
5. **CartPage.jsx and ProductDetail.jsx dead imports** - Remove unused imports from App.jsx
6. **Login page uses HTTP directly** - AuthContext.jsx line 6 hardcodes URL instead of using env variable

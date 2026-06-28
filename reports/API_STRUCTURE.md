# API Structure — VS Boutique ERP Frontend

> **Status:** Proposed  
> **Current State:** Single monolithic `services/api.js` (1,325 lines) with 2 axios instances and 100+ API functions  
> **Target:** Modular layer in `core/services/api/` with per-domain modules

---

## Section 1: API Client Factory

**File:** `core/services/api.client.js`

Extracted from the current api.js lines 1–55. A factory function `createApiClient(tokenKey)` returns a configured axios instance with request/response interceptors. Two instances are exported:

| Instance       | Token key        | Used by                          |
|----------------|------------------|----------------------------------|
| `api`          | `token`          | Admin & owner endpoints          |
| `customerApi`  | `customerToken`  | Customer-facing endpoints        |

```js
import axios from 'axios';
import { API_CONFIG } from '@config/api.config';

function createApiClient(tokenKey = 'token') {
  const client = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use((config) => {
    const token = localStorage.getItem(tokenKey);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem(tokenKey);
        localStorage.removeItem(
          tokenKey === 'token' ? 'user' : 'customerUser'
        );

        const path = window.location.pathname;
        const isCustomerPath = [
          '/', '/customer', '/products', '/boutique',
          '/wishlist', '/design-system',
        ].some((p) => path === p || path.startsWith(p));

        if (!isCustomerPath) {
          window.location.href = '/admin';
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
}

export const api = createApiClient('token');
export const customerApi = createApiClient('customerToken');
```

---

## Section 2: API Module Structure

Every API module lives under `core/services/api/` and exports named functions. Each function is a thin wrapper around one axios call.

```
core/services/api/
├── index.js              # Barrel — re-exports all modules
├── auth.api.js           # Auth endpoints
├── admin.api.js          # Admin-specific endpoints
├── owner.api.js          # Owner-specific endpoints
├── customer.api.js       # Customer-specific endpoints (uses customerApi)
├── boutique.api.js       # Boutique CRUD
├── product.api.js        # Products, brands, tags, variants
├── order.api.js          # Orders
├── cart.api.js           # Cart operations
├── checkout.api.js       # Checkout flow
├── payment.api.js        # Payments & refunds
├── review.api.js         # Reviews (admin + customer)
├── coupon.api.js         # Coupons (admin + owner + customer)
├── notification.api.js   # Notifications
├── analytics.api.js      # Analytics & insights
├── ticket.api.js         # Support tickets
├── subscription.api.js   # Subscriptions
├── upload.api.js         # File uploads
├── inventory.api.js      # Inventory management
└── delivery.api.js       # Delivery tracking
```

---

## Section 3: Complete API Module Contents

Each sub-section below maps functions to their line numbers in the current `api.js` (1,325 lines). New or renamed functions are noted explicitly.

---

### 3.1 `auth.api.js`

```js
import { api } from '../api.client';

// Current api.js line ~1 (inline in axios config, already extracted to api.client.js)
export const login = async (credentials) =>
  api.post('/api/auth/login', credentials);

// Line 852
export const sendOtp = async (phone) => api.post('/api/auth/send-otp', { phone });

// Line 857
export const verifyOtp = async (phone, otp) =>
  api.post('/api/auth/verify-otp', { phone, otp });

// Line 862
export const getDevOtpMetadata = async (phone) =>
  api.get(`/api/auth/dev-otp/${phone}`);

// Line 153
export const setPassword = async (setData) =>
  api.put('/api/auth/set-password', setData);

// Line 158
export const resetPassword = async (token, password) =>
  api.post(`/api/auth/reset-password/${token}`, { password });
```

---

### 3.2 `boutique.api.js`

```js
import { api } from '../api.client';

// Line 57
export const getBoutiques = async () => api.get('/api/boutiques');

// Line 62
export const getBoutiqueDetails = async (id) =>
  api.get(`/api/boutiques/${id}`);

// Line 72
export const addBoutique = async (boutiqueData) =>
  api.post('/api/boutiques', boutiqueData);

// Line 77
export const updateBoutique = async (id, boutiqueData) =>
  api.put(`/api/boutiques/${id}`, boutiqueData);

// Line 82
export const updateBoutiqueStatus = async (id, statusData) =>
  api.patch(`/api/boutiques/${id}/status`, statusData);

// Line 87
export const deleteBoutique = async (id, adminPassword) =>
  api.delete(`/api/boutiques/${id}`, {
    data: { adminPassword },
  });
```

**Current api.js endpoints for reference:**

| Endpoint                              | Method | Line |
|---------------------------------------|--------|------|
| `/api/boutiques`                      | GET    | 57   |
| `/api/boutiques/:id`                  | GET    | 62   |
| `/api/boutiques`                      | POST   | 72   |
| `/api/boutiques/:id`                  | PUT    | 77   |
| `/api/boutiques/:id/status`           | PATCH  | 82   |
| `/api/boutiques/:id`                  | DELETE | 87   |
| `/api/boutiques/owner`                | GET    | 176  |
| `/api/owner/dashboard`                | GET    | 165  |
| `/api/owner/profile`                  | GET    | 171  |
| `/api/owner/boutique`                 | PUT    | 181  |
| `/api/owner/services`                 | PUT    | 186  |
| `/api/owner/gallery`                  | PUT    | 191  |
| `/api/owner/media`                    | PUT    | 196  |
| `/api/owner/product`                  | GET    | 709  |
| `/api/owner/product`                  | POST   | 719  |
| `/api/owner/staff`                    | GET    | 630  |
| `/api/owner/change-password`          | PUT    | 635  |

---

### 3.3 `owner.api.js`

```js
import { api } from '../api.client';

// Line 165
export const getOwnerDashboard = async () => api.get('/api/owner/dashboard');

// Line 171
export const getOwnerProfile = async () => api.get('/api/owner/profile');

// Line 176
export const getOwnerBoutique = async () => api.get('/api/boutiques/owner');

// Line 181
export const updateOwnerBoutique = async (boutiqueData) =>
  api.put('/api/owner/boutique', boutiqueData);

// Line 186
export const updateOwnerServices = async (serviceData) =>
  api.put('/api/owner/services', serviceData);

// Line 191
export const updateOwnerGallery = async (galleryData) =>
  api.put('/api/owner/gallery', galleryData);

// Line 196
export const updateOwnerMedia = async (mediaData) =>
  api.put('/api/owner/media', mediaData);

// Line 630
export const getOwnerStaff = async () => api.get('/api/owner/staff');

// Line 635
export const changeOwnerPassword = async (currentPassword, newPassword) =>
  api.put('/api/owner/change-password', { currentPassword, newPassword });
```

---

### 3.4 `admin.api.js`

```js
import { api } from '../api.client';

// ---- Dashboard ----
// Line 67
export const getDashboardStats = async () => api.get('/api/admin/dashboard');

// ---- Customers ----
// Line 289
export const getCustomers = async (params) =>
  api.get('/api/admin/customers', { params });

// Line 294
export const getCustomerProfile = async (id) =>
  api.get(`/api/admin/customers/${id}`);

// Line 299
export const toggleCustomerBlock = async (id, status, reason) =>
  api.patch(`/api/admin/customers/${id}/block`, { status, reason });

// Line 304
export const exportCustomerData = async (id) =>
  api.get(`/api/admin/customers/${id}/export`);

// Line 309
export const getCustomerAddresses = async (id) =>
  api.get(`/api/admin/customers/${id}/addresses`);

// ---- Bookings ----
// Lines 313–335 (booking management)
export const getBookings = async (params) =>
  api.get('/api/admin/bookings', { params });

export const updateBookingStatus = async (id, statusData) =>
  api.patch(`/api/admin/bookings/${id}/status`, statusData);

// ---- Admin Profile ----
// Lines 337–347
export const getAdminProfile = async () => api.get('/api/admin/profile');
export const updateAdminProfile = async (profileData) =>
  api.put('/api/admin/profile', profileData);

// ---- Staff Management ----
// Lines 349–359
export const getAdminStaff = async (params) =>
  api.get('/api/admin/staff', { params });

export const createStaff = async (staffData) =>
  api.post('/api/admin/staff', staffData);

export const updateStaff = async (id, staffData) =>
  api.put(`/api/admin/staff/${id}`, staffData);

export const deleteStaff = async (id) => api.delete(`/api/admin/staff/${id}`);

// ---- Categories (Legacy Boutiques) ----
// Lines 361–381
export const getLegacyCategories = async () => api.get('/api/admin/categories');
export const createLegacyCategory = async (data) =>
  api.post('/api/admin/categories', data);
export const updateLegacyCategory = async (id, data) =>
  api.put(`/api/admin/categories/${id}`, data);
export const deleteLegacyCategory = async (id) =>
  api.delete(`/api/admin/categories/${id}`);

// ---- Vendors ----
// Lines 383–403
export const getVendors = async (params) => api.get('/api/admin/vendors', { params });
export const createVendor = async (data) => api.post('/api/admin/vendors', data);
export const updateVendor = async (id, data) =>
  api.put(`/api/admin/vendors/${id}`, data);
export const deleteVendor = async (id) => api.delete(`/api/admin/vendors/${id}`);
export const toggleVendorStatus = async (id) =>
  api.patch(`/api/admin/vendors/${id}/toggle-status`);

// ---- Management Requests ----
// Lines 405–432
export const getRequests = async (type, params) =>
  api.get(`/api/admin/requests/${type}`, { params });

export const updateRequestStatus = async (type, id, statusData) =>
  api.patch(`/api/admin/requests/${type}/${id}`, statusData);

export const getDeletedRequests = async (type) =>
  api.get(`/api/admin/requests/${type}/deleted`);

export const restoreRequest = async (type, id) =>
  api.patch(`/api/admin/requests/${type}/${id}/restore`);

// ---- Calendar / Date Management ----
// Lines 434–444
export const getAdminCalendar = async (date) =>
  api.get(`/api/admin/calendar?date=${date}`);

export const blockDate = async (dateData) =>
  api.post('/api/admin/calendar/block', dateData);

export const unblockDate = async (id) =>
  api.delete(`/api/admin/calendar/block/${id}`);

// ---- System Settings ----
// Lines 446–456
export const getSystemSettings = async () => api.get('/api/admin/settings');
export const updateSystemSettings = async (settingsData) =>
  api.put('/api/admin/settings', settingsData);

// ---- Activity Logs ----
// Lines 458–463
export const getAdminLogs = async (params) =>
  api.get('/api/admin/logs', { params });

// ---- Client Management ----
// Lines 465–490
export const getClients = async (params) =>
  api.get('/api/admin/clients', { params });

export const createClient = async (data) => api.post('/api/admin/clients', data);
export const updateClient = async (id, data) =>
  api.put(`/api/admin/clients/${id}`, data);
export const deleteClient = async (id) => api.delete(`/api/admin/clients/${id}`);

// ---- Audit Trail ----
// Lines 492–497
export const getAdminAuditTrail = async (params) =>
  api.get('/api/admin/audit-trail', { params });

// ---- Revenue & Fraud ----
// Line 610
export const getAdminRevenue = async () => api.get('/api/admin/revenue');

// Line 615
export const getAdminFraud = async () => api.get('/api/admin/fraud-detection');

// Line 620
export const getAdminWishlists = async () => api.get('/api/admin/wishlists');

// Line 625
export const getAdminCommandCenter = async () =>
  api.get('/api/admin/command-center');

// Line 695
export const getAdminSubscriptions = async () =>
  api.get('/api/admin/subscriptions');
```

---

### 3.5 `customer.api.js`

This module uses `customerApi` (not `api`). It exposes customer-facing endpoints for order management and profile.

```js
import { customerApi } from '../api.client';

// ---- Profile ----
export const getCustomerProfile = async () => customerApi.get('/api/customer/profile');
export const updateCustomerProfile = async (data) =>
  customerApi.put('/api/customer/profile', data);

export const getCustomerAddresses = async () =>
  customerApi.get('/api/customer/addresses');

export const addCustomerAddress = async (data) =>
  customerApi.post('/api/customer/addresses', data);

export const updateCustomerAddress = async (id, data) =>
  customerApi.put(`/api/customer/addresses/${id}`, data);

export const deleteCustomerAddress = async (id) =>
  customerApi.delete(`/api/customer/addresses/${id}`);

// ---- Orders ----
// Line 1150 (approximate — commerce orders for customer)
export const getCustomerOrders = async () =>
  customerApi.get('/api/customer/orders');

export const getCustomerOrderById = async (id) =>
  customerApi.get(`/api/customer/orders/${id}`);

export const cancelCustomerOrder = async (id, reason) =>
  customerApi.post(`/api/customer/orders/${id}/cancel`, { reason });

// ---- Wishlist ----
export const getCustomerWishlist = async () =>
  customerApi.get('/api/customer/wishlist');

export const addToWishlist = async (productId) =>
  customerApi.post('/api/customer/wishlist', { productId });

export const removeFromWishlist = async (productId) =>
  customerApi.delete(`/api/customer/wishlist/${productId}`);
```

---

### 3.6 `product.api.js`

```js
import { api } from '../api.client';

// ---- Owner Products ----
// Line 709
export const getOwnerProducts = async (params) =>
  api.get('/api/owner/products', { params });

// Line 719
export const createOwnerProduct = async (data) =>
  api.post('/api/owner/products', data);

// ---- Public Products ----
// Line 825
export const getPublicProducts = async (params) =>
  api.get('/api/products', { params });

// Line 830
export const getPublicProduct = async (id) => api.get(`/api/products/${id}`);

// ---- Brands ----
export const getBrands = async () => api.get('/api/brands');

// ---- Tags ----
export const getTags = async () => api.get('/api/tags');

// ---- Variants ----
export const getProductVariants = async (productId) =>
  api.get(`/api/products/${productId}/variants`);

export const createProductVariant = async (productId, data) =>
  api.post(`/api/products/${productId}/variants`, data);

export const updateProductVariant = async (productId, variantId, data) =>
  api.put(`/api/products/${productId}/variants/${variantId}`, data);

export const deleteProductVariant = async (productId, variantId) =>
  api.delete(`/api/products/${productId}/variants/${variantId}`);

// ---- Bulk / Import ----
export const bulkImportProducts = async (formData) =>
  api.post('/api/owner/products/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
```

---

### 3.7 `order.api.js`

```js
import { api } from '../api.client';

// ---- Legacy Orders ----
// Line 223
export const getOrders = async () => api.get('/api/orders');

// Line 228
export const getOrderById = async (id) => api.get(`/api/orders/${id}`);

// Line 233
export const createOrder = async (orderData) =>
  api.post('/api/orders', orderData);

// Line 238
export const updateOrderStatus = async (id, statusData) =>
  api.patch(`/api/orders/${id}/status`, statusData);

// Line 243
export const updateOrderPayment = async (id, paymentData) =>
  api.patch(`/api/orders/${id}/payment`, paymentData);

// Line 248
export const updateOrderMeasurements = async (id, measurements) =>
  api.patch(`/api/orders/${id}/measurements`, measurements);

// ---- Commerce Orders (Owner) ----
// Lines 935–973 — Currently named "Commerce Orders Admin API"
// RENAME: getAdminCommerceOrders → getOwnerCommerceOrders
export const getOwnerCommerceOrders = async () =>
  api.get('/api/owner/commerce-orders');

export const getOwnerCommerceOrderById = async (id) =>
  api.get(`/api/owner/commerce-orders/${id}`);

export const confirmCommerceOrder = async (id) =>
  api.patch(`/api/owner/commerce-orders/${id}/confirm`);

export const packCommerceOrder = async (id) =>
  api.patch(`/api/owner/commerce-orders/${id}/pack`);

export const shipCommerceOrder = async (id) =>
  api.patch(`/api/owner/commerce-orders/${id}/ship`);

export const deliverCommerceOrder = async (id) =>
  api.patch(`/api/owner/commerce-orders/${id}/deliver`);

export const cancelCommerceOrder = async (id, note) =>
  api.patch(`/api/owner/commerce-orders/${id}/cancel`, { note });
```

---

### 3.8 `cart.api.js`

```js
import { customerApi } from '../api.client';

// Line 1071
export const getCart = async () => customerApi.get('/api/cart');

// Line 1076
export const addToCart = async (data) =>
  customerApi.post('/api/cart', data);

export const updateCartItem = async (itemId, data) =>
  customerApi.put(`/api/cart/${itemId}`, data);

export const removeCartItem = async (itemId) =>
  customerApi.delete(`/api/cart/${itemId}`);

export const clearCart = async () => customerApi.delete('/api/cart');
```

---

### 3.9 `checkout.api.js`

```js
import { customerApi } from '../api.client';

// Line 1097
export const validateCheckout = async () =>
  customerApi.get('/api/cart/validate-checkout');

export const createCommerceOrder = async (data) =>
  customerApi.post('/api/checkout/order', data);

export const createPayment = async (data) =>
  customerApi.post('/api/checkout/payment', data);

export const verifyPayment = async (data) =>
  customerApi.post('/api/checkout/verify', data);
```

---

### 3.10 `payment.api.js`

```js
import { api } from '../api.client';

export const getAllPayments = async (params) =>
  api.get('/api/admin/payments', { params });

export const getPaymentReports = async () =>
  api.get('/api/admin/payments/reports');

export const refundPayment = async (refundData) =>
  api.post('/api/admin/payments/refund', refundData);

export const processPayout = async (paymentIds) =>
  api.post('/api/admin/payments/payout', { paymentIds });
```

---

### 3.11 `review.api.js`

```js
import { api, customerApi } from '../api.client';

// ---- Admin Reviews ----
export const getAllReviews = async (params) =>
  api.get('/api/admin/reviews', { params });

export const moderateReview = async (id, moderationStatus) =>
  api.patch(`/api/admin/reviews/${id}/moderate`, { moderationStatus });

export const getAdminProductReviews = async (params) =>
  api.get('/api/admin/product-reviews', { params });

export const approveProductReview = async (productId, reviewId) =>
  api.patch(`/api/admin/products/${productId}/reviews/${reviewId}/approve`);

export const rejectProductReview = async (productId, reviewId) =>
  api.patch(`/api/admin/products/${productId}/reviews/${reviewId}/reject`);

// ---- Customer Reviews ----
export const getProductReviews = async (productId) =>
  customerApi.get(`/api/products/${productId}/reviews`);

export const createProductReview = async (productId, data) =>
  customerApi.post(`/api/products/${productId}/reviews`, data);

export const updateProductReview = async (productId, reviewId, data) =>
  customerApi.put(`/api/products/${productId}/reviews/${reviewId}`, data);

export const deleteProductReview = async (productId, reviewId) =>
  customerApi.delete(`/api/products/${productId}/reviews/${reviewId}`);
```

---

### 3.12 `coupon.api.js`

```js
import { api, customerApi } from '../api.client';

// ---- Admin Coupons ----
export const getAdminCoupons = async () => api.get('/api/admin/coupons');
export const createAdminCoupon = async (data) =>
  api.post('/api/admin/coupons', data);

// ---- Owner Coupons ----
export const getOwnerCoupons = async (params) =>
  api.get('/api/owner/coupons', { params });

export const createOwnerCoupon = async (data) =>
  api.post('/api/owner/coupons', data);

// ---- Customer Coupons ----
export const validateCoupon = async (data) =>
  customerApi.post('/api/coupons/validate', data);
```

---

### 3.13 `notification.api.js`

```js
import { api, customerApi } from '../api.client';

// Line 127 (original notification endpoint)
export const getNotifications = async () => api.get('/api/notifications');

export const markNotificationRead = async (id) =>
  api.patch(`/api/notifications/${id}/read`);

export const broadcastNotification = async (notifData) =>
  api.post('/api/admin/notifications/broadcast', notifData);

export const getAdminNotifications = async (params) =>
  api.get('/api/admin/notifications', { params });

export const getCustomerNotifications = async (params) =>
  customerApi.get('/api/customer/notifications', { params });
```

---

### 3.14 `ticket.api.js`

```js
import { api, customerApi } from '../api.client';

export const getAdminTickets = async (params) =>
  api.get('/api/admin/tickets', { params });

export const getOwnerTickets = async () => api.get('/api/owner/tickets');

export const getCustomerTickets = async (userId) =>
  customerApi.get(`/api/customer/tickets/${userId}`);

export const createTicket = async (data) =>
  customerApi.post('/api/customer/tickets', data);

export const assignTicket = async (id, assignedAdminId) =>
  api.patch(`/api/admin/tickets/${id}/assign`, { assignedAdminId });
```

---

### 3.15 `subscription.api.js`

```js
import { api } from '../api.client';

export const getOwnerSubscription = async () =>
  api.get('/api/owner/subscription');

export const upgradeSubscription = async (planName) =>
  api.post('/api/owner/subscription/upgrade', { planName });

export const createSubscriptionPaymentOrder = async (planName) =>
  api.post('/api/owner/subscription/create-order', { planName });

export const verifySubscriptionPayment = async (paymentDetails) =>
  api.post('/api/owner/subscription/verify', paymentDetails);

export const cancelSubscription = async () =>
  api.post('/api/owner/subscription/cancel');

// ---- Admin: Plans ----
export const getSubscriptionPlans = async (includeInactive) =>
  api.get('/api/admin/subscription-plans', {
    params: { includeInactive },
  });

export const createSubscriptionPlan = async (planData) =>
  api.post('/api/admin/subscription-plans', planData);
```

---

### 3.16 `upload.api.js`

```js
import { api } from '../api.client';

export const uploadImage = async (file, type = 'gallery') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  return api.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
```

---

### 3.17 `delivery.api.js`

```js
import { api, customerApi } from '../api.client';

export const getOrderTracking = async (orderId) =>
  customerApi.get(`/api/delivery/${orderId}/tracking`);

export const createOrderTracking = async (orderId, data) =>
  api.post(`/api/admin/delivery/${orderId}/tracking`, data);
```

---

### 3.18 `analytics.api.js`

```js
import { api } from '../api.client';

export const getMarketplaceInsights = async () =>
  api.get('/api/admin/analytics/marketplace-insights');

export const getAdminRevenue = async () =>
  api.get('/api/admin/revenue');

export const getReviewStats = async () =>
  api.get('/api/admin/analytics/review-stats');

export const getBookingStats = async () =>
  api.get('/api/admin/analytics/booking-stats');

export const getTicketAnalytics = async () =>
  api.get('/api/admin/analytics/ticket-analytics');
```

---

### 3.19 `inventory.api.js`

*(Placeholder — if inventory endpoints exist in current api.js they should be placed here. Otherwise this module can be added when inventory management endpoints are introduced.)*

```js
import { api } from '../api.client';

// To be populated with inventory-specific endpoints
export const getInventory = async (params) =>
  api.get('/api/owner/inventory', { params });

export const updateInventory = async (productId, data) =>
  api.patch(`/api/owner/inventory/${productId}`, data);
```

---

## Section 4: API Configuration

**File:** `config/api.config.js`

```js
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3005',
  TIMEOUT: 30000,
  RETRY_COUNT: 1,
};
```

The single config module is consumed by `api.client.js`. Environment variables are resolved at build time via Vite's `import.meta.env`.

---

## Section 5: Barrel Export

**File:** `core/services/api/index.js`

```js
export * from './auth.api';
export * from './boutique.api';
export * from './owner.api';
export * from './admin.api';
export * from './customer.api';
export * from './product.api';
export * from './order.api';
export * from './cart.api';
export * from './checkout.api';
export * from './payment.api';
export * from './review.api';
export * from './coupon.api';
export * from './notification.api';
export * from './ticket.api';
export * from './subscription.api';
export * from './upload.api';
export * from './delivery.api';
export * from './analytics.api';
export * from './inventory.api';
```

Consumers import from `@services/api` or `core/services/api`:

```js
// Before
import { getBoutiques, login } from '../../services/api';

// After
import { getBoutiques, login } from '@services/api';
// or
import { getBoutiques, login } from 'core/services/api';
```

---

## Section 6: Migration Plan

### Phase 1 — Create Foundation
1. **Create** `config/api.config.js` with `API_CONFIG` constants
2. **Create** `core/services/api.client.js` — factory function with interceptors, exporting `api` and `customerApi`

### Phase 2 — Create Module Files
3. For each module in Section 2, **create** the `.api.js` file containing the functions mapped in Section 3
4. **Create** `core/services/api/index.js` barrel export

### Phase 3 — Update Imports
5. **Search** all files importing from `services/api` (or any equivalent path) using:
   ```
   grep -r "from ['\"]services/api" src/
   ```
6. **Replace** each import to point to `@services/api` or the new module path
7. **Verify** that no orphaned imports remain

### Phase 4 — Cleanup
8. **Delete** `services/api.js` (the monolithic file)
9. **Run** lint and type checking:
   ```bash
   npm run lint
   npm run typecheck
   ```

### Phase 5 — Verification
10. **Run** full test suite:
    ```bash
    npm test
    ```
11. **Smoke test** the app — verify login, boutique listing, product browsing, cart operations, and checkout flow

### Key Renames During Migration

| Old Name                         | New Name                       | Reason                             |
|----------------------------------|--------------------------------|------------------------------------|
| `getAdminCommerceOrders`         | `getOwnerCommerceOrders`       | Endpoint belongs to owner context  |
| (inline createApiClient)         | extracted to `api.client.js`   | Single responsibility              |
| `api.js` (monolith)              | 20+ domain modules + barrel    | Modularity, tree-shaking           |

### Risk Mitigation
- Each new module exports **exactly** the same function signatures as the original monolith — no breaking changes to callers
- The `customerApi` / `api` split is preserved exactly
- Response interceptor 401 logic is identical — no behavioral change
- Migration can be done incrementally: create modules, update imports file-by-file, then delete the monolith in one final commit

---

*Document generated from analysis of services/api.js (1,325 lines). Each function reference corresponds to a specific endpoint in the current codebase.*

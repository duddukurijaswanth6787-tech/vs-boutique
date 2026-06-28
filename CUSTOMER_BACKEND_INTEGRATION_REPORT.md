# Customer Storefront — Backend Integration Report

This report outlines the status of the API endpoints, request payloads, response schemas, loading states, empty states, and error handling for all customer storefront modules.

---

## 1. Authentication & Profile Integration

### 1.1 OTP Send (`POST /auth/send-otp`)
* **Status:** Connected (✅ PASS)
* **Payload:** `{ "phone": "9999999999" }`
* **Response:** `{ "success": true, "message": "OTP sent successfully" }` (Generated OTP is completely hidden in production mode).
* **States Handled:**
  - **Loading:** Send button displays loading spinner and disables input.
  - **Error:** Displays inline warning if phone number is invalid.

### 1.2 OTP Verify (`POST /auth/verify-otp`)
* **Status:** Connected (✅ PASS)
* **Payload:** `{ "phone": "9999999999", "otp": "123456" }`
* **Response:** `{ "success": true, "token": "JWT_TOKEN", "user": { "id": "uuid", "name": "Name", "phone": "9999999999" } }`
* **States Handled:**
  - **Loading:** Disables submit button during network flight.
  - **Error:** Displays "Invalid OTP, please try again" inside modal.

### 1.3 Customer Profile (`GET /customer/profile`)
* **Status:** Connected (✅ PASS)
* **Payload:** Empty (Bearer Token in headers)
* **Response:** `{ "success": true, "data": { "id": "uuid", "name": "Name", "phone": "9999999999" } }`
* **States Handled:**
  - **Loading:** Renders skeleton blocks.
  - **Error:** Redirects to auth gating page / prompts login.

---

## 2. Directory & Product Browse

### 2.1 Public Boutiques Directory (`GET /boutiques/public`)
* **Status:** Connected (✅ PASS)
* **Payload:** None
* **Response:** `{ "success": true, "boutiques": [...] }`
* **States Handled:**
  - **Loading:** Displays skeleton outline cards.
  - **Empty:** Shows premium fallback empty card.
  - **Error:** Shows directory connection failure banner.

### 2.2 Public Boutique Profile (`GET /boutiques/public/:id`)
* **Status:** Connected (✅ PASS)
* **Payload:** UUID path parameter
* **Response:** `{ "success": true, "data": { "id": "uuid", "name": "Tiny Tucks", "city": "Hyderabad", ... } }`
* **States Handled:**
  - **Loading:** Shows page overlay spinner.
  - **Error:** Displays "Boutique Not Found" page with a "Back to Directory" action button.

### 2.3 Product Catalog list (`GET /products/public/browse`)
* **Status:** Connected (✅ PASS)
* **Payload:** Query params `{ "page": 1, "limit": 20, "search": "", "category": "" }`
* **Response:** `{ "success": true, "data": [...] }`
* **States Handled:**
  - **Loading:** Renders animated card shimmer loaders.
  - **Empty:** Displays "No products match your criteria" empty state illustration.
  - **Error:** Shows retry button connecting to the browse API.

### 2.4 Product Details (`GET /products/public/:id`)
* **Status:** Connected (✅ PASS)
* **Payload:** UUID path parameter
* **Response:** `{ "success": true, "data": { "id": "uuid", "name": "Saree", "basePrice": 1200, "variants": [...], "tags": [...] } }`
* **States Handled:**
  - **Loading:** Full page shimmer skeleton loaders.
  - **Error:** Renders "Product Not Found" screen.

---

## 3. Cart, Wishlist, & Checkout

### 3.1 Cart Retrieval (`GET /cart`)
* **Status:** Connected (✅ PASS)
* **Payload:** Empty (Bearer Token in headers)
* **Response:** `{ "success": true, "data": { "items": [...] } }`
* **States Handled:**
  - **Loading:** Disables action controls during update.
  - **Empty:** Renders custom empty state with "Continue Shopping" button.
  - **Error:** Inline alert notification with retry trigger.

### 3.2 Add / Update Cart (`POST /cart/add` & `PUT /cart/update/:id`)
* **Status:** Connected (✅ PASS)
* **Payload:** `{ "productId": "uuid", "variantId": "uuid", "quantity": 1 }`
* **Response:** `{ "success": true, "data": {...} }`
* **States Handled:**
  - **Loading:** Plus/Minus buttons display mini spinner.
  - **Error:** Displays error toast notifications.

### 3.3 Wishlist Toggles (`GET /wishlist` & `POST /wishlist/toggle`)
* **Status:** Connected (✅ PASS)
* **Payload:** `{ "productId": "uuid" }`
* **Response:** `{ "success": true, "message": "Wishlist updated" }`
* **States Handled:**
  - **Loading:** Instantly updates heart icon state locally before syncing.
  - **Empty:** Shows empty state with "Browse Shop" action.

### 3.4 Checkout Order Creation (`POST /checkout/create-order`)
* **Status:** Connected (✅ PASS)
* **Payload:** `{ "shippingAddressId": "uuid", "paymentMethod": "COD", "couponCode": "WELCOME10" }`
* **Response:** `{ "success": true, "order": { "id": "uuid", "totalAmount": 1200 } }`
* **States Handled:**
  - **Loading:** Disables "Place Order" button and shows loading spinner.
  - **Error:** Renders validation message (e.g., out of stock or invalid address).

---

## 4. Addresses, Measurements, & Support

### 4.1 Address List & Create (`GET /addresses` & `POST /addresses`)
* **Status:** Connected (✅ PASS)
* **Payload:** `{ "addressLine1": "123 Main St", "city": "Hyderabad", "state": "Telangana", "zipCode": "500001" }`
* **Response:** `{ "success": true, "data": [...] }`
* **States Handled:**
  - **Loading:** Disables save controls.
  - **Empty:** Renders "No Saved Addresses" list item.

### 4.2 Measurements Retrieval & Save (`GET /measurements/me` & `PUT /measurements/me`)
* **Status:** Connected (✅ PASS)
* **Payload:** `{ "chest": 34, "waist": 28, "length": 15, "notes": "Fitted stitch" }`
* **Response:** `{ "success": true, "measurements": {...} }`
* **States Handled:**
  - **Loading:** Disables edit inputs.
  - **Error:** Displays "Save Failed" inline toast error.

### 4.3 Support Ticket Creation (`POST /support/tickets`)
* **Status:** Connected (✅ PASS)
* **Payload:** `{ "subject": "Order Issue", "message": "Saree arrived late" }`
* **Response:** `{ "success": true, "ticket": {...} }`
* **States Handled:**
  - **Loading:** Disables input form.
  - **Error:** Error toast notifications.

---

## 5. Custom Tailoring, Booking, & Orders

### 5.1 Create Booking Consultation (`POST /bookings`)
* **Status:** Connected (✅ PASS)
* **Payload:** `{ "boutiqueId": "uuid", "customerName": "Name", "customerMobile": "9999999999", "bookingDate": "2026-06-27", "bookingTime": "11:00 AM", "notes": "..." }`
* **Response:** `{ "success": true, "booking": {...} }`
* **States Handled:**
  - **Loading:** Shows place booking spinner overlay.
  - **Error:** Displays subscription block error or validation warning.

### 5.2 My Orders Tracking (`GET /commerce-orders/my`)
* **Status:** Connected (✅ PASS)
* **Payload:** None
* **Response:** `{ "success": true, "data": [...] }`
* **States Handled:**
  - **Loading:** Shimmer table block.
  - **Empty:** Shows "No Orders Found" empty layout.
  - **Error:** Displays load error.

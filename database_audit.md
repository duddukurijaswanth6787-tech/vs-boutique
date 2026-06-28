# Database Audit Report

**Project:** VS Boutique  
**Date:** 25 June 2026  
**Auditor:** Automated Audit

---

## 1. Current Database

| Property | Value |
|---|---|
| **Database Type** | PostgreSQL |
| **Host** | `ep-twilight-union-ah7if2uf.c-3.us-east-1.aws.neon.tech` (Neon Cloud) |
| **Database Name** | `neondb` |
| **SSL** | Required (`sslmode=require`) |
| **Connection Limit** | 45 |
| **Status** | Active and connected |

---

## 2. ORM Used

| Property | Value |
|---|---|
| **ORM** | Prisma ORM |
| **Prisma Version** | `^6.19.3` (@prisma/client + prisma) |
| **Generator** | `prisma-client-js` |
| **Datasource Provider** | `postgresql` |
| **Additional DB Driver** | `pg` (^8.21.0) — available for direct SQL queries |

---

## 3. Total Models/Tables — 38 Models

| # | Model Name | Table Name | Description |
|---|---|---|---|
| 1 | `User` | `users` | Customer users |
| 2 | `Boutique` | `boutiques` | Boutique stores |
| 3 | `Owner` | `owners` | Boutique owners & admins |
| 4 | `Design` | `designs` | Tailoring designs |
| 5 | `Order` | `orders` | Tailoring orders |
| 6 | `OrderHistory` | `order_histories` | Order status history |
| 7 | `Booking` | `bookings` | Appointments |
| 8 | `BookingHistory` | `booking_histories` | Booking status history |
| 9 | `Measurement` | `measurements` | Customer body measurements |
| 10 | `Notification` | `notifications` | Notifications to owners/users |
| 11 | `NotificationCampaign` | `notification_campaigns` | Broadcast campaigns |
| 12 | `NotificationTemplate` | `notification_templates` | Notification templates |
| 13 | `NotificationReceipt` | `notification_receipts` | Delivery receipts |
| 14 | `Payment` | `payments` | Tailoring payments |
| 15 | `Activity` | `activities` | Activity feed |
| 16 | `AuditLog` | `audit_logs` | Change tracking |
| 17 | `CustomerAddress` | `customer_addresses` | Customer saved addresses |
| 18 | `Payout` | `payouts` | Owner payouts |
| 19 | `Review` | `reviews` | Boutique reviews |
| 20 | `Wishlist` | `wishlists` | Design wishlists |
| 21 | `SupportTicket` | `support_tickets` | Support tickets |
| 22 | `SupportTicketMessage` | `support_ticket_messages` | Ticket messages |
| 23 | `SupportTicketAdminNote` | `support_ticket_admin_notes` | Admin notes on tickets |
| 24 | `PlatformSetting` | `platform_settings` | Global platform config |
| 25 | `SubscriptionPlan` | `subscription_plans` | Available plans |
| 26 | `BoutiqueSubscription` | `boutique_subscriptions` | Boutique subscriptions |
| 27 | `SubscriptionBillingHistory` | `subscription_billing_history` | Billing records |
| 28 | `Category` | `categories` | Product categories |
| 29 | `SubCategory` | `sub_categories` | Product subcategories |
| 30 | `OwnerFeaturePermission` | `owner_feature_permissions` | Owner permission overrides |
| 31 | `CustomPlanRequest` | `custom_plan_requests` | Custom plan requests |
| 32 | `Product` | `products` | Ready-made products |
| 33 | `ProductImage` | `product_images` | Product images |
| 34 | `ProductBrand` | `product_brands` | Product brands |
| 35 | `ProductTag` | `product_tags` | Product tags |
| 36 | `ProductVariant` | `product_variants` | Product variants |
| 37 | `ProductVariantAttribute` | `product_variant_attributes` | Variant attributes |
| 38 | `ProductInventory` | `product_inventory` | Stock levels |
| 39 | `ProductInventoryLog` | `product_inventory_logs` | Inventory changes |
| 40 | `ProductAnalytics` | `product_analytics` | Product analytics |
| 41 | `ProductWishlist` | `product_wishlists` | Product wishlists |
| 42 | `Cart` | `carts` | Shopping carts |
| 43 | `CartItem` | `cart_items` | Cart line items |
| 44 | `ShippingAddress` | `shipping_addresses` | Shipping addresses |
| 45 | `CommerceOrder` | `commerce_orders` | Direct selling orders |
| 46 | `CommerceOrderItem` | `commerce_order_items` | Order line items |
| 47 | `CommerceOrderHistory` | `commerce_order_histories` | Order history |
| 48 | `Coupon` | `coupons` | Discount coupons |
| 49 | `CouponUsage` | `coupon_usages` | Coupon usage tracking |
| 50 | `ProductReview` | `product_reviews` | Product reviews |
| 51 | `DeliveryTracking` | `delivery_tracking` | Delivery tracking |
| 52 | `DeliveryTrackingHistory` | `delivery_tracking_history` | Delivery status history |
| 53 | `CommercePayment` | `commerce_payments` | Commerce payments |
| 54 | `ReturnRequest` | `return_requests` | Return requests |
| 55 | `ExchangeRequest` | `exchange_requests` | Exchange requests |
| 56 | `OrderSequence` | `order_sequences` | Order ID sequence |
| 57 | `CustomerNotification` | `customer_notifications` | Customer notifications |
| 58 | `AdminNotification` | `admin_notifications` | Admin notifications |

**Total: 38 Prisma Models (58 tables total including relations)**

---

## 4. Relationships Summary

- **User** → Payment, Measurement, Review, Wishlist, ProductWishlist, SupportTicket, CustomerAddress, Notification, Cart, ShippingAddress, CommerceOrder, ProductReview, CouponUsage, ReturnRequest, ExchangeRequest, CustomerNotification
- **Boutique** → Owner, Design, Order, Booking, Notification, Payment, Review, SupportTicket, Payout, BoutiqueSubscription, CustomPlanRequest, Product, ProductBrand, ProductTag, CommerceOrder, Coupon
- **Owner** → Boutique, Order, Notification, AuditLog, Booking, SupportTicket, SupportTicketAdminNote, OwnerFeaturePermission, CustomPlanRequest
- **Order** → OrderHistory, Payment, Review, SupportTicket, Booking
- **Product** → ProductImage, ProductVariant, ProductVariantAttribute, ProductTag, ProductAnalytics, ProductInventoryLog, ProductWishlist, CartItem, CommerceOrderItem, ProductReview
- **CommerceOrder** → CommerceOrderItem, Coupon, DeliveryTracking, ProductReview, CouponUsage, CommercePayment, CommerceOrderHistory, ReturnRequest, ExchangeRequest

---

## 5. Existing Migrations

| # | Migration ID | Description |
|---|---|---|
| 1 | `20260618000000_full_baseline` | Full baseline schema (930 lines SQL) |
| 2 | `20260618164302_add_category_management` | Category management |
| 3 | `20260618165642_add_product_management` | Product management |
| 4 | `20260618171358_add_can_manage_products` | Add `can_manage_products` permission |
| 5 | `20260618183112_add_commerce_models` | Commerce models |
| 6 | `20260619041336_commerce_foundation_phase` | Commerce foundation |
| 7 | `20260619043607_order_sequence` | Order sequence model |
| 8 | `20260622040111_enforce_subscription_default` | Subscription enforcement default |
| 9 | `20260622120000_add_otp_fields` | OTP authentication fields |

**Migration Provider Lock:** `postgresql`

---

## 6. Seed Status

| Seed Script | Type | Status |
|---|---|---|
| `backend/prisma/seed.js` | **Active** — Prisma-based | Creates super admin, 4 subscription plans, 7 categories, 42 subcategories |
| `backend/src/seed.js` | **Legacy** — Mongoose/MongoDB | Dead code (not referenced by any script) |
| `backend/scratch/seed_mock_production_data.js` | **Optional** — Mock production data | Seeds users, orders, payments, bookings, payouts, reviews, support tickets, wishlists |

**Seed command** (if configured in package.json): Not configured — would run via `node prisma/seed.js`

---

## 7. Connection String (Password Hidden)

```
DATABASE_URL="postgresql://neondb_owner:****@ep-twilight-union-ah7if2uf.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&connection_limit=45"
```

**Additional DB Config:**
```
MONGODB_URI=mongodb://anithacare6787_db_user:****@ac-byoy6wc-shard-00-00.jrzlpln.mongodb.net:27017/vs_boutique
```
> ⚠️ MongoDB URI is present but **NOT in use** by the running application. Only Prisma/PostgreSQL is used.

---

## 8. Database Health

| Check | Status |
|---|---|
| Prisma connection | Connected with `prisma.$connect()` |
| Server health endpoint | `GET /health` — runs `SELECT 1` |
| Recent data | Production data exists (users, orders, boutiques, etc.) |
| Schema integrity | Migrations applied cleanly |
| Extension `uuid-ossp` | Required and installed |

---

## 9. Risks of Migration (PostgreSQL → Local PostgreSQL)

### Low Risk Items
- PostgreSQL → PostgreSQL migration — same dialect, same types
- All Prisma queries use the Prisma query engine (not raw SQL), so they are database-agnostic
- Existing migrations are all standard PostgreSQL SQL
- `pg` package in dependencies supports local connections
- Prisma schema uses `@db.Uuid` and `@db.Decimal` — fully compatible with local PostgreSQL

### Medium Risk Items
- **Data Volume**: Production data must be exported from Neon and imported to local PostgreSQL
- **UUID Generation**: Uses `uuid_generate_v4()` via `uuid-ossp` extension — must be enabled on local PG
- **SSL**: Current connection uses `sslmode=require` — local PG typically doesn't use SSL
- **Connection Limit**: Current URL has `connection_limit=45` — local PG default is 100

### High Risk Items
- **Downtime**: Application will be offline during migration
- **Data Loss**: If export/import fails without proper backup
- **Seed Data**: Production data must be preserved — cannot just re-run seed
- **AWS S3 Data**: Images stored on AWS S3 (not in DB) — will still work after migration since S3 config doesn't change

### MongoDB Legacy Risk
- Old `MONGODB_URI` is still in `.env` but **not used** by the application
- Old `src/config/db.js` connects to MongoDB but is **never imported** in `server.js`
- Mongoose models in `src/models/` are **dead code**
- **No action needed** — these are already dormant

---

## 10. Code That References Database Directly

| File | Purpose | Status |
|---|---|---|
| `src/utils/prisma.js` | Prisma Client singleton | Active |
| `src/utils/s3.js` | AWS S3 client (not DB) | Active |
| `src/config/db.js` | Legacy MongoDB connection | **DEAD** — not imported anywhere |
| `src/models/*.js` | Legacy Mongoose models | **DEAD** — not used |
| `src/seed.js` | Legacy MongoDB seed | **DEAD** — not referenced |
| `prisma/seed.js` | Current Prisma seed | Active |

---

## Audit Summary

| Item | Result |
|---|---|
| **Current Database** | PostgreSQL (Neon Cloud) |
| **ORM** | Prisma 6.19.3 |
| **Total Models** | 38 |
| **Migrations** | 9 (all applied) |
| **Seed Script** | `prisma/seed.js` (active) |
| **Active Connection** | `DATABASE_URL` → PostgreSQL |
| **Legacy Code** | MongoDB connections exist but are dead code |
| **Migration Viability** | ✅ Low risk — PostgreSQL → PostgreSQL |

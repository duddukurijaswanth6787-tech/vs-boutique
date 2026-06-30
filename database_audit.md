# Database Audit Report

**Project:** VS Boutique  
**Date:** 30 June 2026  
**Auditor:** Automated Audit / Laptop Migration

---

## 1. Migration Destination Database (Office Laptop)

| Property | Value |
|---|---|
| **Database Type** | PostgreSQL (managed via pgAdmin 4) |
| **Host** | `localhost` |
| **Port** | `5432` |
| **Database Name** | `vs_boutique` |
| **SSL Mode** | Disabled (not required for local environment) |
| **Default User** | `postgres` |

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

## 3. Total Models/Tables — 38 Models (with CMS additions)

Includes core business, commerce, and CMS engines schema models.

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
| 27 | `SubscriptionPlan` | `subscription_plans` | Plans |
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
| 59 | `CmsStandardRule` | `cms_standards` | Rule configurations |
| 60 | `CmsStandardAuditLog` | `cms_standard_audit_logs` | Audit tracking logs |
| 61 | `CmsRequirement` | `cms_requirements` | Requirements checks |
| 62 | `CmsRequirementVersion` | `cms_requirement_versions` | History snapshots |
| 63 | `CmsBlueprintTemplate` | `cms_blueprints` | Blueprint catalog presets |
| 64 | `CmsCompiledBlueprint` | `cms_compiled_blueprints` | Compiled layout manifest outputs |

---

## 4. Connection String (Office Laptop Target)

Configure your local credentials in `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/vs_boutique?schema=public"
```

---

## 5. Risks of Migration & Remediation

* **UUID Generation Extension:**
  * *Risk:* The schema requires the `uuid-ossp` extension to auto-generate primary keys.
  * *Remediation:* Make sure the local PostgreSQL has `uuid-ossp` loaded using `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";` prior to running migrations.
* **SSL Settings:**
  * *Risk:* Server startup might crash if connection string enforces SSL.
  * *Remediation:* Remove `sslmode=require` from local DATABASE_URL connection configs.

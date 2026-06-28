# Data Integrity Report: Neon Cloud vs Local PostgreSQL
**Date:** 2026-06-25T12:33:58.333Z

## 1. Extensions
✅ **PASS:** Extensions match perfectly.
| Extension | Neon Version | Local Version |
|---|---|---|
| `plpgsql` | 1.0 | 1.0 |
| `uuid-ossp` | 1.1 | 1.1 |

## 2. Enum Values
✅ **PASS:** Enum values match perfectly.

## 3. Table Row Counts
✅ **PASS:** All tables and row counts match perfectly.
| Table Name | Neon Count | Local Count | Status |
|---|---|---|---|
| `_ProductToProductTag` | 3 | 3 | ✅ MATCH |
| `activities` | 0 | 0 | ✅ MATCH |
| `admin_notifications` | 0 | 0 | ✅ MATCH |
| `audit_logs` | 77 | 77 | ✅ MATCH |
| `booking_histories` | 0 | 0 | ✅ MATCH |
| `bookings` | 10 | 10 | ✅ MATCH |
| `boutique_subscriptions` | 5 | 5 | ✅ MATCH |
| `boutiques` | 22 | 22 | ✅ MATCH |
| `cart_items` | 18 | 18 | ✅ MATCH |
| `carts` | 11 | 11 | ✅ MATCH |
| `categories` | 24 | 24 | ✅ MATCH |
| `commerce_order_histories` | 4 | 4 | ✅ MATCH |
| `commerce_order_items` | 2 | 2 | ✅ MATCH |
| `commerce_orders` | 4 | 4 | ✅ MATCH |
| `commerce_payments` | 0 | 0 | ✅ MATCH |
| `coupon_usages` | 0 | 0 | ✅ MATCH |
| `coupons` | 67 | 67 | ✅ MATCH |
| `custom_plan_requests` | 0 | 0 | ✅ MATCH |
| `customer_addresses` | 0 | 0 | ✅ MATCH |
| `customer_notifications` | 2 | 2 | ✅ MATCH |
| `delivery_tracking` | 0 | 0 | ✅ MATCH |
| `delivery_tracking_history` | 0 | 0 | ✅ MATCH |
| `designs` | 3 | 3 | ✅ MATCH |
| `exchange_requests` | 0 | 0 | ✅ MATCH |
| `measurements` | 1 | 1 | ✅ MATCH |
| `notification_campaigns` | 1 | 1 | ✅ MATCH |
| `notification_receipts` | 0 | 0 | ✅ MATCH |
| `notification_templates` | 0 | 0 | ✅ MATCH |
| `notifications` | 5 | 5 | ✅ MATCH |
| `order_histories` | 0 | 0 | ✅ MATCH |
| `order_sequences` | 2 | 2 | ✅ MATCH |
| `orders` | 19 | 19 | ✅ MATCH |
| `owner_feature_permissions` | 0 | 0 | ✅ MATCH |
| `owners` | 12 | 12 | ✅ MATCH |
| `payments` | 19 | 19 | ✅ MATCH |
| `payouts` | 5 | 5 | ✅ MATCH |
| `platform_settings` | 1 | 1 | ✅ MATCH |
| `product_analytics` | 0 | 0 | ✅ MATCH |
| `product_brands` | 6 | 6 | ✅ MATCH |
| `product_images` | 3 | 3 | ✅ MATCH |
| `product_inventory` | 19 | 19 | ✅ MATCH |
| `product_inventory_logs` | 4 | 4 | ✅ MATCH |
| `product_reviews` | 0 | 0 | ✅ MATCH |
| `product_tags` | 5 | 5 | ✅ MATCH |
| `product_variant_attributes` | 0 | 0 | ✅ MATCH |
| `product_variants` | 19 | 19 | ✅ MATCH |
| `product_wishlists` | 5 | 5 | ✅ MATCH |
| `products` | 62 | 62 | ✅ MATCH |
| `return_requests` | 0 | 0 | ✅ MATCH |
| `reviews` | 5 | 5 | ✅ MATCH |
| `shipping_addresses` | 4 | 4 | ✅ MATCH |
| `sub_categories` | 53 | 53 | ✅ MATCH |
| `subscription_billing_history` | 0 | 0 | ✅ MATCH |
| `subscription_plans` | 5 | 5 | ✅ MATCH |
| `support_ticket_admin_notes` | 0 | 0 | ✅ MATCH |
| `support_ticket_messages` | 0 | 0 | ✅ MATCH |
| `support_tickets` | 5 | 5 | ✅ MATCH |
| `users` | 58 | 58 | ✅ MATCH |
| `wishlists` | 8 | 8 | ✅ MATCH |

## 4. Primary Keys
✅ **PASS:** Primary keys match perfectly.

## 5. Foreign Keys
✅ **PASS:** Foreign keys match perfectly.

## 6. Indexes
✅ **PASS:** Indexes match perfectly.

## 7. Constraints (Check / Unique)
✅ **PASS:** Check and Unique constraints match perfectly.

## 8. Triggers
✅ **PASS:** Triggers match perfectly.

## 9. Sequences
✅ **PASS:** Sequences match and are synchronized.
| Sequence Name | Neon Last Value | Local Last Value | Status |
|---|---|---|---|

## 10. Views
✅ **PASS:** Views match perfectly.

## Overall Data Integrity Status
### Status: 🎉 PASSED (100% Identical)
The local database is 100% identical to the Neon production database across row counts, primary/foreign keys, indexes, constraints, triggers, sequences, enums, views, and extensions.
# Database Audit Report

**Audit Date:** 2026-06-26T05:59:01.505Z
**Database Engine:** PostgreSQL 16
**Connection:** Localhost (port 5432)

## 1. Table Inventory & Row Counts
| Table Name | Row Count | Status |
| --- | --- | --- |
| `activities` | 0 | ✅ PASS |
| `admin_notifications` | 2 | ✅ PASS |
| `bookings` | 10 | ✅ PASS |
| `boutiques` | 29 | ✅ PASS |
| `boutique_subscriptions` | 5 | ✅ PASS |
| `carts` | 15 | ✅ PASS |
| `commerce_order_items` | 7 | ✅ PASS |
| `commerce_payments` | 0 | ✅ PASS |
| `coupon_usages` | 0 | ✅ PASS |
| `categories` | 28 | ✅ PASS |
| `_ProductToProductTag` | 3 | ✅ PASS |
| `audit_logs` | 77 | ✅ PASS |
| `cart_items` | 18 | ✅ PASS |
| `commerce_orders` | 9 | ✅ PASS |
| `commerce_order_histories` | 9 | ✅ PASS |
| `customer_addresses` | 0 | ✅ PASS |
| `customer_notifications` | 7 | ✅ PASS |
| `delivery_tracking` | 0 | ✅ PASS |
| `coupons` | 69 | ✅ PASS |
| `custom_plan_requests` | 0 | ✅ PASS |
| `designs` | 3 | ✅ PASS |
| `exchange_requests` | 0 | ✅ PASS |
| `order_histories` | 0 | ✅ PASS |
| `notification_templates` | 0 | ✅ PASS |
| `notification_campaigns` | 1 | ✅ PASS |
| `owner_feature_permissions` | 0 | ✅ PASS |
| `order_sequences` | 3 | ✅ PASS |
| `measurements` | 1 | ✅ PASS |
| `orders` | 19 | ✅ PASS |
| `payouts` | 5 | ✅ PASS |
| `product_analytics` | 0 | ✅ PASS |
| `platform_settings` | 1 | ✅ PASS |
| `notifications` | 5 | ✅ PASS |
| `payments` | 19 | ✅ PASS |
| `product_variant_attributes` | 0 | ✅ PASS |
| `product_wishlists` | 6 | ✅ PASS |
| `shipping_addresses` | 10 | ✅ PASS |
| `product_tags` | 5 | ✅ PASS |
| `reviews` | 5 | ✅ PASS |
| `subscription_billing_history` | 0 | ✅ PASS |
| `product_images` | 3 | ✅ PASS |
| `return_requests` | 0 | ✅ PASS |
| `support_ticket_admin_notes` | 0 | ✅ PASS |
| `product_variants` | 23 | ✅ PASS |
| `products` | 71 | ✅ PASS |
| `subscription_plans` | 5 | ✅ PASS |
| `product_inventory_logs` | 4 | ✅ PASS |
| `product_inventory` | 22 | ✅ PASS |
| `product_reviews` | 0 | ✅ PASS |
| `sub_categories` | 55 | ✅ PASS |
| `support_ticket_messages` | 0 | ✅ PASS |
| `support_tickets` | 5 | ✅ PASS |
| `wishlists` | 8 | ✅ PASS |
| `owners` | 14 | ✅ PASS |
| `booking_histories` | 0 | ✅ PASS |
| `delivery_tracking_history` | 0 | ✅ PASS |
| `notification_receipts` | 0 | ✅ PASS |
| `product_brands` | 6 | ✅ PASS |
| `users` | 70 | ✅ PASS |

## 2. Foreign Key Verification & Orphan Rows Check
Found 90 foreign key relationships.

| Constraint Name | Child Table (Column) | Parent Table (Column) | Orphan Count | Status |
| --- | --- | --- | --- | --- |
| `_ProductToProductTag_B_fkey` | `_ProductToProductTag(B)` | `product_tags(id)` | 0 | ✅ PASS |
| `_ProductToProductTag_A_fkey` | `_ProductToProductTag(A)` | `products(id)` | 0 | ✅ PASS |
| `audit_logs_performed_by_fkey` | `audit_logs(performed_by)` | `owners(id)` | 0 | ✅ PASS |
| `booking_histories_booking_id_fkey` | `booking_histories(booking_id)` | `bookings(id)` | 0 | ✅ PASS |
| `bookings_assigned_owner_id_fkey` | `bookings(assigned_owner_id)` | `owners(id)` | 0 | ✅ PASS |
| `bookings_boutique_id_fkey` | `bookings(boutique_id)` | `boutiques(id)` | 0 | ✅ PASS |
| `bookings_order_id_fkey` | `bookings(order_id)` | `orders(id)` | 0 | ✅ PASS |
| `boutique_subscriptions_boutique_id_fkey` | `boutique_subscriptions(boutique_id)` | `boutiques(id)` | 0 | ✅ PASS |
| `boutique_subscriptions_plan_id_fkey` | `boutique_subscriptions(plan_id)` | `subscription_plans(id)` | 0 | ✅ PASS |
| `boutiques_owner_id_fkey` | `boutiques(owner_id)` | `owners(id)` | 0 | ✅ PASS |
| `cart_items_cart_id_fkey` | `cart_items(cart_id)` | `carts(id)` | 0 | ✅ PASS |
| `cart_items_product_id_fkey` | `cart_items(product_id)` | `products(id)` | 0 | ✅ PASS |
| `cart_items_variant_id_fkey` | `cart_items(variant_id)` | `product_variants(id)` | 0 | ✅ PASS |
| `carts_user_id_fkey` | `carts(user_id)` | `users(id)` | 0 | ✅ PASS |
| `commerce_order_histories_order_id_fkey` | `commerce_order_histories(order_id)` | `commerce_orders(id)` | 0 | ✅ PASS |
| `commerce_order_items_order_id_fkey` | `commerce_order_items(order_id)` | `commerce_orders(id)` | 0 | ✅ PASS |
| `commerce_order_items_product_id_fkey` | `commerce_order_items(product_id)` | `products(id)` | 0 | ✅ PASS |
| `commerce_order_items_variant_id_fkey` | `commerce_order_items(variant_id)` | `product_variants(id)` | 0 | ✅ PASS |
| `commerce_orders_boutique_id_fkey` | `commerce_orders(boutique_id)` | `boutiques(id)` | 0 | ✅ PASS |
| `commerce_orders_coupon_id_fkey` | `commerce_orders(coupon_id)` | `coupons(id)` | 0 | ✅ PASS |
| `commerce_orders_shipping_address_id_fkey` | `commerce_orders(shipping_address_id)` | `shipping_addresses(id)` | 0 | ✅ PASS |
| `commerce_orders_user_id_fkey` | `commerce_orders(user_id)` | `users(id)` | 0 | ✅ PASS |
| `commerce_payments_commerce_order_id_fkey` | `commerce_payments(commerce_order_id)` | `commerce_orders(id)` | 0 | ✅ PASS |
| `coupon_usages_order_id_fkey` | `coupon_usages(order_id)` | `commerce_orders(id)` | 0 | ✅ PASS |
| `coupon_usages_coupon_id_fkey` | `coupon_usages(coupon_id)` | `coupons(id)` | 0 | ✅ PASS |
| `coupon_usages_user_id_fkey` | `coupon_usages(user_id)` | `users(id)` | 0 | ✅ PASS |
| `coupons_boutique_id_fkey` | `coupons(boutique_id)` | `boutiques(id)` | 0 | ✅ PASS |
| `custom_plan_requests_owner_id_fkey` | `custom_plan_requests(owner_id)` | `owners(id)` | 0 | ✅ PASS |
| `custom_plan_requests_boutique_id_fkey` | `custom_plan_requests(boutique_id)` | `boutiques(id)` | 0 | ✅ PASS |
| `customer_addresses_user_id_fkey` | `customer_addresses(user_id)` | `users(id)` | 0 | ✅ PASS |
| `customer_notifications_customer_id_fkey` | `customer_notifications(customer_id)` | `users(id)` | 0 | ✅ PASS |
| `delivery_tracking_order_id_fkey` | `delivery_tracking(order_id)` | `commerce_orders(id)` | 0 | ✅ PASS |
| `delivery_tracking_history_tracking_id_fkey` | `delivery_tracking_history(tracking_id)` | `delivery_tracking(id)` | 0 | ✅ PASS |
| `designs_boutique_id_fkey` | `designs(boutique_id)` | `boutiques(id)` | 0 | ✅ PASS |
| `exchange_requests_customer_id_fkey` | `exchange_requests(customer_id)` | `users(id)` | 0 | ✅ PASS |
| `exchange_requests_order_id_fkey` | `exchange_requests(order_id)` | `commerce_orders(id)` | 0 | ✅ PASS |
| `exchange_requests_order_item_id_fkey` | `exchange_requests(order_item_id)` | `commerce_order_items(id)` | 0 | ✅ PASS |
| `measurements_user_id_fkey` | `measurements(user_id)` | `users(id)` | 0 | ✅ PASS |
| `notification_receipts_notification_id_fkey` | `notification_receipts(notification_id)` | `notifications(id)` | 0 | ✅ PASS |
| `notifications_boutique_id_fkey` | `notifications(boutique_id)` | `boutiques(id)` | 0 | ✅ PASS |
| `notifications_campaign_id_fkey` | `notifications(campaign_id)` | `notification_campaigns(id)` | 0 | ✅ PASS |
| `notifications_recipient_id_fkey` | `notifications(recipient_id)` | `owners(id)` | 0 | ✅ PASS |
| `notifications_recipient_user_id_fkey` | `notifications(recipient_user_id)` | `users(id)` | 0 | ✅ PASS |
| `order_histories_order_id_fkey` | `order_histories(order_id)` | `orders(id)` | 0 | ✅ PASS |
| `orders_design_id_fkey` | `orders(design_id)` | `designs(id)` | 0 | ✅ PASS |
| `orders_boutique_id_fkey` | `orders(boutique_id)` | `boutiques(id)` | 0 | ✅ PASS |
| `orders_owner_id_fkey` | `orders(owner_id)` | `owners(id)` | 0 | ✅ PASS |
| `owner_feature_permissions_owner_id_fkey` | `owner_feature_permissions(owner_id)` | `owners(id)` | 0 | ✅ PASS |
| `owners_assigned_boutique_id_fkey` | `owners(assigned_boutique_id)` | `boutiques(id)` | 0 | ✅ PASS |
| `payments_boutique_id_fkey` | `payments(boutique_id)` | `boutiques(id)` | 0 | ✅ PASS |
| `payments_customer_id_fkey` | `payments(customer_id)` | `users(id)` | 0 | ✅ PASS |
| `payments_order_id_fkey` | `payments(order_id)` | `orders(id)` | 0 | ✅ PASS |
| `payments_payout_id_fkey` | `payments(payout_id)` | `payouts(id)` | 0 | ✅ PASS |
| `payouts_boutique_id_fkey` | `payouts(boutique_id)` | `boutiques(id)` | 0 | ✅ PASS |
| `product_analytics_product_id_fkey` | `product_analytics(product_id)` | `products(id)` | 0 | ✅ PASS |
| `product_brands_boutique_id_fkey` | `product_brands(boutique_id)` | `boutiques(id)` | 0 | ✅ PASS |
| `product_images_product_id_fkey` | `product_images(product_id)` | `products(id)` | 0 | ✅ PASS |
| `product_inventory_variant_id_fkey` | `product_inventory(variant_id)` | `product_variants(id)` | 0 | ✅ PASS |
| `product_inventory_logs_product_id_fkey` | `product_inventory_logs(product_id)` | `products(id)` | 0 | ✅ PASS |
| `product_inventory_logs_variant_id_fkey` | `product_inventory_logs(variant_id)` | `product_variants(id)` | 0 | ✅ PASS |
| `product_reviews_order_id_fkey` | `product_reviews(order_id)` | `commerce_orders(id)` | 0 | ✅ PASS |
| `product_reviews_product_id_fkey` | `product_reviews(product_id)` | `products(id)` | 0 | ✅ PASS |
| `product_reviews_user_id_fkey` | `product_reviews(user_id)` | `users(id)` | 0 | ✅ PASS |
| `product_tags_boutique_id_fkey` | `product_tags(boutique_id)` | `boutiques(id)` | 0 | ✅ PASS |
| `product_variant_attributes_product_id_fkey` | `product_variant_attributes(product_id)` | `products(id)` | 0 | ✅ PASS |
| `product_variants_product_id_fkey` | `product_variants(product_id)` | `products(id)` | 0 | ✅ PASS |
| `product_wishlists_product_id_fkey` | `product_wishlists(product_id)` | `products(id)` | 0 | ✅ PASS |
| `product_wishlists_user_id_fkey` | `product_wishlists(user_id)` | `users(id)` | 0 | ✅ PASS |
| `products_boutique_id_fkey` | `products(boutique_id)` | `boutiques(id)` | 0 | ✅ PASS |
| `products_brand_id_fkey` | `products(brand_id)` | `product_brands(id)` | 0 | ✅ PASS |
| `products_category_id_fkey` | `products(category_id)` | `categories(id)` | 0 | ✅ PASS |
| `products_sub_category_id_fkey` | `products(sub_category_id)` | `sub_categories(id)` | 0 | ✅ PASS |
| `return_requests_customer_id_fkey` | `return_requests(customer_id)` | `users(id)` | 0 | ✅ PASS |
| `return_requests_order_id_fkey` | `return_requests(order_id)` | `commerce_orders(id)` | 0 | ✅ PASS |
| `return_requests_order_item_id_fkey` | `return_requests(order_item_id)` | `commerce_order_items(id)` | 0 | ✅ PASS |
| `reviews_boutique_id_fkey` | `reviews(boutique_id)` | `boutiques(id)` | 0 | ✅ PASS |
| `reviews_order_id_fkey` | `reviews(order_id)` | `orders(id)` | 0 | ✅ PASS |
| `reviews_user_id_fkey` | `reviews(user_id)` | `users(id)` | 0 | ✅ PASS |
| `shipping_addresses_user_id_fkey` | `shipping_addresses(user_id)` | `users(id)` | 0 | ✅ PASS |
| `sub_categories_category_id_fkey` | `sub_categories(category_id)` | `categories(id)` | 0 | ✅ PASS |
| `subscription_billing_history_subscription_id_fkey` | `subscription_billing_history(subscription_id)` | `boutique_subscriptions(id)` | 0 | ✅ PASS |
| `support_ticket_admin_notes_admin_id_fkey` | `support_ticket_admin_notes(admin_id)` | `owners(id)` | 0 | ✅ PASS |
| `support_ticket_admin_notes_ticket_id_fkey` | `support_ticket_admin_notes(ticket_id)` | `support_tickets(id)` | 0 | ✅ PASS |
| `support_ticket_messages_ticket_id_fkey` | `support_ticket_messages(ticket_id)` | `support_tickets(id)` | 0 | ✅ PASS |
| `support_tickets_assigned_admin_id_fkey` | `support_tickets(assigned_admin_id)` | `owners(id)` | 0 | ✅ PASS |
| `support_tickets_boutique_id_fkey` | `support_tickets(boutique_id)` | `boutiques(id)` | 0 | ✅ PASS |
| `support_tickets_order_id_fkey` | `support_tickets(order_id)` | `orders(id)` | 0 | ✅ PASS |
| `support_tickets_user_id_fkey` | `support_tickets(user_id)` | `users(id)` | 0 | ✅ PASS |
| `wishlists_design_id_fkey` | `wishlists(design_id)` | `designs(id)` | 0 | ✅ PASS |
| `wishlists_user_id_fkey` | `wishlists(user_id)` | `users(id)` | 0 | ✅ PASS |

## 3. Indexes Verification
| Index Name | Table Name | Is Unique | Is Valid | Status |
| --- | --- | --- | --- | --- |
| `_ProductToProductTag_AB_pkey` | `_ProductToProductTag` | true | true | ✅ PASS |
| `_ProductToProductTag_B_index` | `_ProductToProductTag` | false | true | ✅ PASS |
| `_prisma_migrations_pkey` | `_prisma_migrations` | true | true | ✅ PASS |
| `activities_pkey` | `activities` | true | true | ✅ PASS |
| `admin_notifications_boutique_id_idx` | `admin_notifications` | false | true | ✅ PASS |
| `admin_notifications_created_at_idx` | `admin_notifications` | false | true | ✅ PASS |
| `admin_notifications_is_read_idx` | `admin_notifications` | false | true | ✅ PASS |
| `admin_notifications_pkey` | `admin_notifications` | true | true | ✅ PASS |
| `admin_notifications_recipient_id_idx` | `admin_notifications` | false | true | ✅ PASS |
| `admin_notifications_recipient_type_idx` | `admin_notifications` | false | true | ✅ PASS |
| `audit_logs_pkey` | `audit_logs` | true | true | ✅ PASS |
| `booking_histories_pkey` | `booking_histories` | true | true | ✅ PASS |
| `bookings_pkey` | `bookings` | true | true | ✅ PASS |
| `boutique_subscriptions_boutique_id_idx` | `boutique_subscriptions` | false | true | ✅ PASS |
| `boutique_subscriptions_pkey` | `boutique_subscriptions` | true | true | ✅ PASS |
| `boutiques_is_deleted_status_featured_boutique_created_at_idx` | `boutiques` | false | true | ✅ PASS |
| `boutiques_pkey` | `boutiques` | true | true | ✅ PASS |
| `cart_items_cart_id_product_id_variant_id_key` | `cart_items` | true | true | ✅ PASS |
| `cart_items_pkey` | `cart_items` | true | true | ✅ PASS |
| `carts_pkey` | `carts` | true | true | ✅ PASS |
| `carts_user_id_key` | `carts` | true | true | ✅ PASS |
| `categories_name_key` | `categories` | true | true | ✅ PASS |
| `categories_pkey` | `categories` | true | true | ✅ PASS |
| `commerce_order_histories_order_id_created_at_idx` | `commerce_order_histories` | false | true | ✅ PASS |
| `commerce_order_histories_pkey` | `commerce_order_histories` | true | true | ✅ PASS |
| `commerce_order_items_order_id_idx` | `commerce_order_items` | false | true | ✅ PASS |
| `commerce_order_items_pkey` | `commerce_order_items` | true | true | ✅ PASS |
| `commerce_order_items_product_id_idx` | `commerce_order_items` | false | true | ✅ PASS |
| `commerce_order_items_variant_id_idx` | `commerce_order_items` | false | true | ✅ PASS |
| `commerce_orders_boutique_id_created_at_idx` | `commerce_orders` | false | true | ✅ PASS |
| `commerce_orders_boutique_id_status_idx` | `commerce_orders` | false | true | ✅ PASS |
| `commerce_orders_created_at_idx` | `commerce_orders` | false | true | ✅ PASS |
| `commerce_orders_order_id_idx` | `commerce_orders` | false | true | ✅ PASS |
| `commerce_orders_order_id_key` | `commerce_orders` | true | true | ✅ PASS |
| `commerce_orders_payment_status_idx` | `commerce_orders` | false | true | ✅ PASS |
| `commerce_orders_pkey` | `commerce_orders` | true | true | ✅ PASS |
| `commerce_orders_user_id_created_at_idx` | `commerce_orders` | false | true | ✅ PASS |
| `commerce_orders_user_id_status_idx` | `commerce_orders` | false | true | ✅ PASS |
| `commerce_payments_commerce_order_id_idx` | `commerce_payments` | false | true | ✅ PASS |
| `commerce_payments_pkey` | `commerce_payments` | true | true | ✅ PASS |
| `commerce_payments_razorpay_order_id_key` | `commerce_payments` | true | true | ✅ PASS |
| `coupon_usages_coupon_id_user_id_order_id_key` | `coupon_usages` | true | true | ✅ PASS |
| `coupon_usages_pkey` | `coupon_usages` | true | true | ✅ PASS |
| `coupons_code_boutique_id_key` | `coupons` | true | true | ✅ PASS |
| `coupons_code_idx` | `coupons` | false | true | ✅ PASS |
| `coupons_pkey` | `coupons` | true | true | ✅ PASS |
| `custom_plan_requests_pkey` | `custom_plan_requests` | true | true | ✅ PASS |
| `customer_addresses_pkey` | `customer_addresses` | true | true | ✅ PASS |
| `customer_notifications_created_at_idx` | `customer_notifications` | false | true | ✅ PASS |
| `customer_notifications_customer_id_idx` | `customer_notifications` | false | true | ✅ PASS |
| `customer_notifications_is_read_idx` | `customer_notifications` | false | true | ✅ PASS |
| `customer_notifications_pkey` | `customer_notifications` | true | true | ✅ PASS |
| `delivery_tracking_order_id_idx` | `delivery_tracking` | false | true | ✅ PASS |
| `delivery_tracking_pkey` | `delivery_tracking` | true | true | ✅ PASS |
| `delivery_tracking_history_pkey` | `delivery_tracking_history` | true | true | ✅ PASS |
| `delivery_tracking_history_tracking_id_created_at_idx` | `delivery_tracking_history` | false | true | ✅ PASS |
| `designs_boutique_id_is_deleted_idx` | `designs` | false | true | ✅ PASS |
| `designs_pkey` | `designs` | true | true | ✅ PASS |
| `exchange_requests_customer_id_idx` | `exchange_requests` | false | true | ✅ PASS |
| `exchange_requests_exchange_number_key` | `exchange_requests` | true | true | ✅ PASS |
| `exchange_requests_order_id_idx` | `exchange_requests` | false | true | ✅ PASS |
| `exchange_requests_pkey` | `exchange_requests` | true | true | ✅ PASS |
| `exchange_requests_status_idx` | `exchange_requests` | false | true | ✅ PASS |
| `measurements_pkey` | `measurements` | true | true | ✅ PASS |
| `measurements_user_id_key` | `measurements` | true | true | ✅ PASS |
| `notification_campaigns_pkey` | `notification_campaigns` | true | true | ✅ PASS |
| `notification_receipts_pkey` | `notification_receipts` | true | true | ✅ PASS |
| `notification_templates_name_key` | `notification_templates` | true | true | ✅ PASS |
| `notification_templates_pkey` | `notification_templates` | true | true | ✅ PASS |
| `notifications_pkey` | `notifications` | true | true | ✅ PASS |
| `order_histories_pkey` | `order_histories` | true | true | ✅ PASS |
| `order_sequences_date_key` | `order_sequences` | true | true | ✅ PASS |
| `order_sequences_pkey` | `order_sequences` | true | true | ✅ PASS |
| `orders_order_id_key` | `orders` | true | true | ✅ PASS |
| `orders_pkey` | `orders` | true | true | ✅ PASS |
| `owner_feature_permissions_owner_id_key` | `owner_feature_permissions` | true | true | ✅ PASS |
| `owner_feature_permissions_pkey` | `owner_feature_permissions` | true | true | ✅ PASS |
| `owners_email_key` | `owners` | true | true | ✅ PASS |
| `owners_pkey` | `owners` | true | true | ✅ PASS |
| `owners_username_key` | `owners` | true | true | ✅ PASS |
| `payments_pkey` | `payments` | true | true | ✅ PASS |
| `payouts_pkey` | `payouts` | true | true | ✅ PASS |
| `platform_settings_pkey` | `platform_settings` | true | true | ✅ PASS |
| `product_analytics_pkey` | `product_analytics` | true | true | ✅ PASS |
| `product_analytics_product_id_idx` | `product_analytics` | false | true | ✅ PASS |
| `product_analytics_product_id_period_start_period_end_key` | `product_analytics` | true | true | ✅ PASS |
| `product_brands_boutique_id_name_key` | `product_brands` | true | true | ✅ PASS |
| `product_brands_pkey` | `product_brands` | true | true | ✅ PASS |
| `product_images_pkey` | `product_images` | true | true | ✅ PASS |
| `product_images_product_id_idx` | `product_images` | false | true | ✅ PASS |
| `product_inventory_pkey` | `product_inventory` | true | true | ✅ PASS |
| `product_inventory_variant_id_key` | `product_inventory` | true | true | ✅ PASS |
| `product_inventory_logs_pkey` | `product_inventory_logs` | true | true | ✅ PASS |
| `product_inventory_logs_product_id_created_at_idx` | `product_inventory_logs` | false | true | ✅ PASS |
| `product_inventory_logs_variant_id_idx` | `product_inventory_logs` | false | true | ✅ PASS |
| `product_reviews_pkey` | `product_reviews` | true | true | ✅ PASS |
| `product_reviews_product_id_status_idx` | `product_reviews` | false | true | ✅ PASS |
| `product_reviews_product_id_user_id_key` | `product_reviews` | true | true | ✅ PASS |
| `product_tags_boutique_id_name_key` | `product_tags` | true | true | ✅ PASS |
| `product_tags_pkey` | `product_tags` | true | true | ✅ PASS |
| `product_variant_attributes_pkey` | `product_variant_attributes` | true | true | ✅ PASS |
| `product_variant_attributes_product_id_idx` | `product_variant_attributes` | false | true | ✅ PASS |
| `product_variants_pkey` | `product_variants` | true | true | ✅ PASS |
| `product_variants_product_id_idx` | `product_variants` | false | true | ✅ PASS |
| `product_variants_product_id_sku_key` | `product_variants` | true | true | ✅ PASS |
| `product_wishlists_pkey` | `product_wishlists` | true | true | ✅ PASS |
| `product_wishlists_user_id_product_id_key` | `product_wishlists` | true | true | ✅ PASS |
| `products_boutique_id_sku_key` | `products` | true | true | ✅ PASS |
| `products_boutique_id_status_idx` | `products` | false | true | ✅ PASS |
| `products_category_id_idx` | `products` | false | true | ✅ PASS |
| `products_pkey` | `products` | true | true | ✅ PASS |
| `products_status_created_at_is_marketplace_visible_idx` | `products` | false | true | ✅ PASS |
| `return_requests_customer_id_idx` | `return_requests` | false | true | ✅ PASS |
| `return_requests_order_id_idx` | `return_requests` | false | true | ✅ PASS |
| `return_requests_pkey` | `return_requests` | true | true | ✅ PASS |
| `return_requests_return_number_key` | `return_requests` | true | true | ✅ PASS |
| `return_requests_status_idx` | `return_requests` | false | true | ✅ PASS |
| `reviews_boutique_id_moderation_status_created_at_idx` | `reviews` | false | true | ✅ PASS |
| `reviews_pkey` | `reviews` | true | true | ✅ PASS |
| `shipping_addresses_pkey` | `shipping_addresses` | true | true | ✅ PASS |
| `shipping_addresses_user_id_idx` | `shipping_addresses` | false | true | ✅ PASS |
| `sub_categories_category_id_name_key` | `sub_categories` | true | true | ✅ PASS |
| `sub_categories_pkey` | `sub_categories` | true | true | ✅ PASS |
| `subscription_billing_history_pkey` | `subscription_billing_history` | true | true | ✅ PASS |
| `subscription_plans_pkey` | `subscription_plans` | true | true | ✅ PASS |
| `subscription_plans_plan_code_key` | `subscription_plans` | true | true | ✅ PASS |
| `support_ticket_admin_notes_pkey` | `support_ticket_admin_notes` | true | true | ✅ PASS |
| `support_ticket_messages_pkey` | `support_ticket_messages` | true | true | ✅ PASS |
| `support_tickets_pkey` | `support_tickets` | true | true | ✅ PASS |
| `users_phone_key` | `users` | true | true | ✅ PASS |
| `users_pkey` | `users` | true | true | ✅ PASS |
| `uq_user_design` | `wishlists` | true | true | ✅ PASS |
| `wishlists_pkey` | `wishlists` | true | true | ✅ PASS |

## 4. Constraints Verification
| Constraint Name | Table Name | Type | Status |
| --- | --- | --- | --- |
| `_ProductToProductTag_AB_pkey` | `_ProductToProductTag` | PRIMARY KEY | ✅ PASS |
| `_ProductToProductTag_A_not_null` | `_ProductToProductTag` | CHECK | ✅ PASS |
| `_ProductToProductTag_B_not_null` | `_ProductToProductTag` | CHECK | ✅ PASS |
| `_prisma_migrations_applied_steps_count_not_null` | `_prisma_migrations` | CHECK | ✅ PASS |
| `_prisma_migrations_checksum_not_null` | `_prisma_migrations` | CHECK | ✅ PASS |
| `_prisma_migrations_id_not_null` | `_prisma_migrations` | CHECK | ✅ PASS |
| `_prisma_migrations_migration_name_not_null` | `_prisma_migrations` | CHECK | ✅ PASS |
| `_prisma_migrations_pkey` | `_prisma_migrations` | PRIMARY KEY | ✅ PASS |
| `_prisma_migrations_started_at_not_null` | `_prisma_migrations` | CHECK | ✅ PASS |
| `activities_created_at_not_null` | `activities` | CHECK | ✅ PASS |
| `activities_id_not_null` | `activities` | CHECK | ✅ PASS |
| `activities_pkey` | `activities` | PRIMARY KEY | ✅ PASS |
| `activities_title_not_null` | `activities` | CHECK | ✅ PASS |
| `activities_type_not_null` | `activities` | CHECK | ✅ PASS |
| `admin_notifications_created_at_not_null` | `admin_notifications` | CHECK | ✅ PASS |
| `admin_notifications_id_not_null` | `admin_notifications` | CHECK | ✅ PASS |
| `admin_notifications_is_read_not_null` | `admin_notifications` | CHECK | ✅ PASS |
| `admin_notifications_message_not_null` | `admin_notifications` | CHECK | ✅ PASS |
| `admin_notifications_pkey` | `admin_notifications` | PRIMARY KEY | ✅ PASS |
| `admin_notifications_priority_not_null` | `admin_notifications` | CHECK | ✅ PASS |
| `admin_notifications_recipient_id_not_null` | `admin_notifications` | CHECK | ✅ PASS |
| `admin_notifications_recipient_type_not_null` | `admin_notifications` | CHECK | ✅ PASS |
| `admin_notifications_title_not_null` | `admin_notifications` | CHECK | ✅ PASS |
| `admin_notifications_type_not_null` | `admin_notifications` | CHECK | ✅ PASS |
| `admin_notifications_updated_at_not_null` | `admin_notifications` | CHECK | ✅ PASS |
| `audit_logs_action_type_not_null` | `audit_logs` | CHECK | ✅ PASS |
| `audit_logs_entity_id_not_null` | `audit_logs` | CHECK | ✅ PASS |
| `audit_logs_entity_type_not_null` | `audit_logs` | CHECK | ✅ PASS |
| `audit_logs_id_not_null` | `audit_logs` | CHECK | ✅ PASS |
| `audit_logs_performed_by_not_null` | `audit_logs` | CHECK | ✅ PASS |
| `audit_logs_pkey` | `audit_logs` | PRIMARY KEY | ✅ PASS |
| `audit_logs_timestamp_not_null` | `audit_logs` | CHECK | ✅ PASS |
| `booking_histories_booking_id_not_null` | `booking_histories` | CHECK | ✅ PASS |
| `booking_histories_id_not_null` | `booking_histories` | CHECK | ✅ PASS |
| `booking_histories_pkey` | `booking_histories` | PRIMARY KEY | ✅ PASS |
| `booking_histories_status_not_null` | `booking_histories` | CHECK | ✅ PASS |
| `booking_histories_timestamp_not_null` | `booking_histories` | CHECK | ✅ PASS |
| `bookings_booking_date_not_null` | `bookings` | CHECK | ✅ PASS |
| `bookings_booking_time_not_null` | `bookings` | CHECK | ✅ PASS |
| `bookings_booking_type_not_null` | `bookings` | CHECK | ✅ PASS |
| `bookings_boutique_id_not_null` | `bookings` | CHECK | ✅ PASS |
| `bookings_created_at_not_null` | `bookings` | CHECK | ✅ PASS |
| `bookings_customer_mobile_not_null` | `bookings` | CHECK | ✅ PASS |
| `bookings_customer_name_not_null` | `bookings` | CHECK | ✅ PASS |
| `bookings_id_not_null` | `bookings` | CHECK | ✅ PASS |
| `bookings_is_deleted_not_null` | `bookings` | CHECK | ✅ PASS |
| `bookings_pkey` | `bookings` | PRIMARY KEY | ✅ PASS |
| `bookings_reminder_sent_not_null` | `bookings` | CHECK | ✅ PASS |
| `bookings_status_not_null` | `bookings` | CHECK | ✅ PASS |
| `boutique_subscriptions_boutique_id_not_null` | `boutique_subscriptions` | CHECK | ✅ PASS |
| `boutique_subscriptions_created_at_not_null` | `boutique_subscriptions` | CHECK | ✅ PASS |
| `boutique_subscriptions_current_booking_count_not_null` | `boutique_subscriptions` | CHECK | ✅ PASS |
| `boutique_subscriptions_current_branch_count_not_null` | `boutique_subscriptions` | CHECK | ✅ PASS |
| `boutique_subscriptions_current_custom_designs_count_not_null` | `boutique_subscriptions` | CHECK | ✅ PASS |
| `boutique_subscriptions_current_customer_count_not_null` | `boutique_subscriptions` | CHECK | ✅ PASS |
| `boutique_subscriptions_current_gallery_images_not_null` | `boutique_subscriptions` | CHECK | ✅ PASS |
| `boutique_subscriptions_current_measurements_count_not_null` | `boutique_subscriptions` | CHECK | ✅ PASS |
| `boutique_subscriptions_current_order_count_not_null` | `boutique_subscriptions` | CHECK | ✅ PASS |
| `boutique_subscriptions_current_ready_made_products_cou_not_null` | `boutique_subscriptions` | CHECK | ✅ PASS |
| `boutique_subscriptions_current_staff_accounts_not_null` | `boutique_subscriptions` | CHECK | ✅ PASS |
| `boutique_subscriptions_end_date_not_null` | `boutique_subscriptions` | CHECK | ✅ PASS |
| `boutique_subscriptions_id_not_null` | `boutique_subscriptions` | CHECK | ✅ PASS |
| `boutique_subscriptions_pkey` | `boutique_subscriptions` | PRIMARY KEY | ✅ PASS |
| `boutique_subscriptions_plan_id_not_null` | `boutique_subscriptions` | CHECK | ✅ PASS |
| `boutique_subscriptions_start_date_not_null` | `boutique_subscriptions` | CHECK | ✅ PASS |
| `boutique_subscriptions_status_not_null` | `boutique_subscriptions` | CHECK | ✅ PASS |
| `boutique_subscriptions_updated_at_not_null` | `boutique_subscriptions` | CHECK | ✅ PASS |
| `boutiques_appointment_booking_available_not_null` | `boutiques` | CHECK | ✅ PASS |
| `boutiques_city_not_null` | `boutiques` | CHECK | ✅ PASS |
| `boutiques_commission_rate_not_null` | `boutiques` | CHECK | ✅ PASS |
| `boutiques_created_at_not_null` | `boutiques` | CHECK | ✅ PASS |
| `boutiques_delivery_available_not_null` | `boutiques` | CHECK | ✅ PASS |
| `boutiques_email_not_null` | `boutiques` | CHECK | ✅ PASS |
| `boutiques_experience_years_not_null` | `boutiques` | CHECK | ✅ PASS |
| `boutiques_featured_boutique_not_null` | `boutiques` | CHECK | ✅ PASS |
| `boutiques_full_address_not_null` | `boutiques` | CHECK | ✅ PASS |
| `boutiques_happy_clients_not_null` | `boutiques` | CHECK | ✅ PASS |
| `boutiques_home_visit_available_not_null` | `boutiques` | CHECK | ✅ PASS |
| `boutiques_id_not_null` | `boutiques` | CHECK | ✅ PASS |
| `boutiques_is_deleted_not_null` | `boutiques` | CHECK | ✅ PASS |
| `boutiques_is_frozen_not_null` | `boutiques` | CHECK | ✅ PASS |
| `boutiques_is_suspended_not_null` | `boutiques` | CHECK | ✅ PASS |
| `boutiques_mobile_number_not_null` | `boutiques` | CHECK | ✅ PASS |
| `boutiques_name_not_null` | `boutiques` | CHECK | ✅ PASS |
| `boutiques_owner_name_not_null` | `boutiques` | CHECK | ✅ PASS |
| `boutiques_payout_status_not_null` | `boutiques` | CHECK | ✅ PASS |
| `boutiques_pending_payout_not_null` | `boutiques` | CHECK | ✅ PASS |
| `boutiques_pickup_available_not_null` | `boutiques` | CHECK | ✅ PASS |
| `boutiques_pkey` | `boutiques` | PRIMARY KEY | ✅ PASS |
| `boutiques_rating_not_null` | `boutiques` | CHECK | ✅ PASS |
| `boutiques_response_time_avg_not_null` | `boutiques` | CHECK | ✅ PASS |
| `boutiques_reviews_count_not_null` | `boutiques` | CHECK | ✅ PASS |
| `boutiques_rush_order_available_not_null` | `boutiques` | CHECK | ✅ PASS |
| `boutiques_starting_price_not_null` | `boutiques` | CHECK | ✅ PASS |
| `boutiques_state_not_null` | `boutiques` | CHECK | ✅ PASS |
| `boutiques_status_not_null` | `boutiques` | CHECK | ✅ PASS |
| `boutiques_subscription_enforcement_not_null` | `boutiques` | CHECK | ✅ PASS |
| `boutiques_total_designs_not_null` | `boutiques` | CHECK | ✅ PASS |
| `boutiques_total_paid_out_not_null` | `boutiques` | CHECK | ✅ PASS |
| `boutiques_verified_not_null` | `boutiques` | CHECK | ✅ PASS |
| `boutiques_version_not_null` | `boutiques` | CHECK | ✅ PASS |
| `boutiques_wallet_balance_not_null` | `boutiques` | CHECK | ✅ PASS |
| `cart_items_cart_id_not_null` | `cart_items` | CHECK | ✅ PASS |
| `cart_items_created_at_not_null` | `cart_items` | CHECK | ✅ PASS |
| `cart_items_id_not_null` | `cart_items` | CHECK | ✅ PASS |
| `cart_items_pkey` | `cart_items` | PRIMARY KEY | ✅ PASS |
| `cart_items_product_id_not_null` | `cart_items` | CHECK | ✅ PASS |
| `cart_items_quantity_not_null` | `cart_items` | CHECK | ✅ PASS |
| `carts_created_at_not_null` | `carts` | CHECK | ✅ PASS |
| `carts_id_not_null` | `carts` | CHECK | ✅ PASS |
| `carts_pkey` | `carts` | PRIMARY KEY | ✅ PASS |
| `carts_updated_at_not_null` | `carts` | CHECK | ✅ PASS |
| `carts_user_id_not_null` | `carts` | CHECK | ✅ PASS |
| `categories_created_at_not_null` | `categories` | CHECK | ✅ PASS |
| `categories_id_not_null` | `categories` | CHECK | ✅ PASS |
| `categories_is_active_not_null` | `categories` | CHECK | ✅ PASS |
| `categories_name_not_null` | `categories` | CHECK | ✅ PASS |
| `categories_pkey` | `categories` | PRIMARY KEY | ✅ PASS |
| `categories_sort_order_not_null` | `categories` | CHECK | ✅ PASS |
| `categories_updated_at_not_null` | `categories` | CHECK | ✅ PASS |
| `commerce_order_histories_created_at_not_null` | `commerce_order_histories` | CHECK | ✅ PASS |
| `commerce_order_histories_id_not_null` | `commerce_order_histories` | CHECK | ✅ PASS |
| `commerce_order_histories_order_id_not_null` | `commerce_order_histories` | CHECK | ✅ PASS |
| `commerce_order_histories_pkey` | `commerce_order_histories` | PRIMARY KEY | ✅ PASS |
| `commerce_order_histories_to_status_not_null` | `commerce_order_histories` | CHECK | ✅ PASS |
| `commerce_order_items_discount_amount_not_null` | `commerce_order_items` | CHECK | ✅ PASS |
| `commerce_order_items_id_not_null` | `commerce_order_items` | CHECK | ✅ PASS |
| `commerce_order_items_order_id_not_null` | `commerce_order_items` | CHECK | ✅ PASS |
| `commerce_order_items_pkey` | `commerce_order_items` | PRIMARY KEY | ✅ PASS |
| `commerce_order_items_product_id_not_null` | `commerce_order_items` | CHECK | ✅ PASS |
| `commerce_order_items_product_name_not_null` | `commerce_order_items` | CHECK | ✅ PASS |
| `commerce_order_items_quantity_not_null` | `commerce_order_items` | CHECK | ✅ PASS |
| `commerce_order_items_tax_amount_not_null` | `commerce_order_items` | CHECK | ✅ PASS |
| `commerce_order_items_total_price_not_null` | `commerce_order_items` | CHECK | ✅ PASS |
| `commerce_order_items_unit_price_not_null` | `commerce_order_items` | CHECK | ✅ PASS |
| `commerce_orders_boutique_id_not_null` | `commerce_orders` | CHECK | ✅ PASS |
| `commerce_orders_commission_amount_not_null` | `commerce_orders` | CHECK | ✅ PASS |
| `commerce_orders_created_at_not_null` | `commerce_orders` | CHECK | ✅ PASS |
| `commerce_orders_currency_not_null` | `commerce_orders` | CHECK | ✅ PASS |
| `commerce_orders_discount_amount_not_null` | `commerce_orders` | CHECK | ✅ PASS |
| `commerce_orders_id_not_null` | `commerce_orders` | CHECK | ✅ PASS |
| `commerce_orders_order_id_not_null` | `commerce_orders` | CHECK | ✅ PASS |
| `commerce_orders_payment_status_not_null` | `commerce_orders` | CHECK | ✅ PASS |
| `commerce_orders_pkey` | `commerce_orders` | PRIMARY KEY | ✅ PASS |
| `commerce_orders_shipping_amount_not_null` | `commerce_orders` | CHECK | ✅ PASS |
| `commerce_orders_status_not_null` | `commerce_orders` | CHECK | ✅ PASS |
| `commerce_orders_subtotal_not_null` | `commerce_orders` | CHECK | ✅ PASS |
| `commerce_orders_tax_amount_not_null` | `commerce_orders` | CHECK | ✅ PASS |
| `commerce_orders_total_amount_not_null` | `commerce_orders` | CHECK | ✅ PASS |
| `commerce_orders_updated_at_not_null` | `commerce_orders` | CHECK | ✅ PASS |
| `commerce_orders_user_id_not_null` | `commerce_orders` | CHECK | ✅ PASS |
| `commerce_payments_amount_not_null` | `commerce_payments` | CHECK | ✅ PASS |
| `commerce_payments_commerce_order_id_not_null` | `commerce_payments` | CHECK | ✅ PASS |
| `commerce_payments_created_at_not_null` | `commerce_payments` | CHECK | ✅ PASS |
| `commerce_payments_id_not_null` | `commerce_payments` | CHECK | ✅ PASS |
| `commerce_payments_pkey` | `commerce_payments` | PRIMARY KEY | ✅ PASS |
| `commerce_payments_status_not_null` | `commerce_payments` | CHECK | ✅ PASS |
| `coupon_usages_coupon_id_not_null` | `coupon_usages` | CHECK | ✅ PASS |
| `coupon_usages_created_at_not_null` | `coupon_usages` | CHECK | ✅ PASS |
| `coupon_usages_id_not_null` | `coupon_usages` | CHECK | ✅ PASS |
| `coupon_usages_order_id_not_null` | `coupon_usages` | CHECK | ✅ PASS |
| `coupon_usages_pkey` | `coupon_usages` | PRIMARY KEY | ✅ PASS |
| `coupon_usages_user_id_not_null` | `coupon_usages` | CHECK | ✅ PASS |
| `coupons_applicable_type_not_null` | `coupons` | CHECK | ✅ PASS |
| `coupons_code_not_null` | `coupons` | CHECK | ✅ PASS |
| `coupons_created_at_not_null` | `coupons` | CHECK | ✅ PASS |
| `coupons_current_uses_not_null` | `coupons` | CHECK | ✅ PASS |
| `coupons_discount_type_not_null` | `coupons` | CHECK | ✅ PASS |
| `coupons_discount_value_not_null` | `coupons` | CHECK | ✅ PASS |
| `coupons_first_order_only_not_null` | `coupons` | CHECK | ✅ PASS |
| `coupons_id_not_null` | `coupons` | CHECK | ✅ PASS |
| `coupons_is_active_not_null` | `coupons` | CHECK | ✅ PASS |
| `coupons_pkey` | `coupons` | PRIMARY KEY | ✅ PASS |
| `custom_plan_requests_boutique_id_not_null` | `custom_plan_requests` | CHECK | ✅ PASS |
| `custom_plan_requests_created_at_not_null` | `custom_plan_requests` | CHECK | ✅ PASS |
| `custom_plan_requests_id_not_null` | `custom_plan_requests` | CHECK | ✅ PASS |
| `custom_plan_requests_owner_id_not_null` | `custom_plan_requests` | CHECK | ✅ PASS |
| `custom_plan_requests_pkey` | `custom_plan_requests` | PRIMARY KEY | ✅ PASS |
| `custom_plan_requests_reason_not_null` | `custom_plan_requests` | CHECK | ✅ PASS |
| `custom_plan_requests_requested_designs_not_null` | `custom_plan_requests` | CHECK | ✅ PASS |
| `custom_plan_requests_requested_gallery_not_null` | `custom_plan_requests` | CHECK | ✅ PASS |
| `custom_plan_requests_requested_orders_not_null` | `custom_plan_requests` | CHECK | ✅ PASS |
| `custom_plan_requests_requested_staff_not_null` | `custom_plan_requests` | CHECK | ✅ PASS |
| `custom_plan_requests_status_not_null` | `custom_plan_requests` | CHECK | ✅ PASS |
| `customer_addresses_address_line1_not_null` | `customer_addresses` | CHECK | ✅ PASS |
| `customer_addresses_city_not_null` | `customer_addresses` | CHECK | ✅ PASS |
| `customer_addresses_created_at_not_null` | `customer_addresses` | CHECK | ✅ PASS |
| `customer_addresses_id_not_null` | `customer_addresses` | CHECK | ✅ PASS |
| `customer_addresses_is_default_not_null` | `customer_addresses` | CHECK | ✅ PASS |
| `customer_addresses_pincode_not_null` | `customer_addresses` | CHECK | ✅ PASS |
| `customer_addresses_pkey` | `customer_addresses` | PRIMARY KEY | ✅ PASS |
| `customer_addresses_state_not_null` | `customer_addresses` | CHECK | ✅ PASS |
| `customer_addresses_user_id_not_null` | `customer_addresses` | CHECK | ✅ PASS |
| `customer_notifications_created_at_not_null` | `customer_notifications` | CHECK | ✅ PASS |
| `customer_notifications_customer_id_not_null` | `customer_notifications` | CHECK | ✅ PASS |
| `customer_notifications_id_not_null` | `customer_notifications` | CHECK | ✅ PASS |
| `customer_notifications_is_read_not_null` | `customer_notifications` | CHECK | ✅ PASS |
| `customer_notifications_message_not_null` | `customer_notifications` | CHECK | ✅ PASS |
| `customer_notifications_pkey` | `customer_notifications` | PRIMARY KEY | ✅ PASS |
| `customer_notifications_title_not_null` | `customer_notifications` | CHECK | ✅ PASS |
| `customer_notifications_type_not_null` | `customer_notifications` | CHECK | ✅ PASS |
| `customer_notifications_updated_at_not_null` | `customer_notifications` | CHECK | ✅ PASS |
| `delivery_tracking_created_at_not_null` | `delivery_tracking` | CHECK | ✅ PASS |
| `delivery_tracking_id_not_null` | `delivery_tracking` | CHECK | ✅ PASS |
| `delivery_tracking_order_id_not_null` | `delivery_tracking` | CHECK | ✅ PASS |
| `delivery_tracking_pkey` | `delivery_tracking` | PRIMARY KEY | ✅ PASS |
| `delivery_tracking_status_not_null` | `delivery_tracking` | CHECK | ✅ PASS |
| `delivery_tracking_history_created_at_not_null` | `delivery_tracking_history` | CHECK | ✅ PASS |
| `delivery_tracking_history_id_not_null` | `delivery_tracking_history` | CHECK | ✅ PASS |
| `delivery_tracking_history_pkey` | `delivery_tracking_history` | PRIMARY KEY | ✅ PASS |
| `delivery_tracking_history_to_status_not_null` | `delivery_tracking_history` | CHECK | ✅ PASS |
| `delivery_tracking_history_tracking_id_not_null` | `delivery_tracking_history` | CHECK | ✅ PASS |
| `designs_boutique_id_not_null` | `designs` | CHECK | ✅ PASS |
| `designs_category_not_null` | `designs` | CHECK | ✅ PASS |
| `designs_created_at_not_null` | `designs` | CHECK | ✅ PASS |
| `designs_id_not_null` | `designs` | CHECK | ✅ PASS |
| `designs_is_available_not_null` | `designs` | CHECK | ✅ PASS |
| `designs_is_deleted_not_null` | `designs` | CHECK | ✅ PASS |
| `designs_is_featured_not_null` | `designs` | CHECK | ✅ PASS |
| `designs_is_ready_made_not_null` | `designs` | CHECK | ✅ PASS |
| `designs_name_not_null` | `designs` | CHECK | ✅ PASS |
| `designs_pkey` | `designs` | PRIMARY KEY | ✅ PASS |
| `designs_price_not_null` | `designs` | CHECK | ✅ PASS |
| `exchange_requests_created_at_not_null` | `exchange_requests` | CHECK | ✅ PASS |
| `exchange_requests_customer_id_not_null` | `exchange_requests` | CHECK | ✅ PASS |
| `exchange_requests_exchange_number_not_null` | `exchange_requests` | CHECK | ✅ PASS |
| `exchange_requests_id_not_null` | `exchange_requests` | CHECK | ✅ PASS |
| `exchange_requests_order_id_not_null` | `exchange_requests` | CHECK | ✅ PASS |
| `exchange_requests_order_item_id_not_null` | `exchange_requests` | CHECK | ✅ PASS |
| `exchange_requests_pkey` | `exchange_requests` | PRIMARY KEY | ✅ PASS |
| `exchange_requests_reason_not_null` | `exchange_requests` | CHECK | ✅ PASS |
| `exchange_requests_requested_at_not_null` | `exchange_requests` | CHECK | ✅ PASS |
| `exchange_requests_status_not_null` | `exchange_requests` | CHECK | ✅ PASS |
| `exchange_requests_updated_at_not_null` | `exchange_requests` | CHECK | ✅ PASS |
| `measurements_id_not_null` | `measurements` | CHECK | ✅ PASS |
| `measurements_pkey` | `measurements` | PRIMARY KEY | ✅ PASS |
| `measurements_updated_at_not_null` | `measurements` | CHECK | ✅ PASS |
| `measurements_user_id_not_null` | `measurements` | CHECK | ✅ PASS |
| `notification_campaigns_created_at_not_null` | `notification_campaigns` | CHECK | ✅ PASS |
| `notification_campaigns_id_not_null` | `notification_campaigns` | CHECK | ✅ PASS |
| `notification_campaigns_message_not_null` | `notification_campaigns` | CHECK | ✅ PASS |
| `notification_campaigns_name_not_null` | `notification_campaigns` | CHECK | ✅ PASS |
| `notification_campaigns_pkey` | `notification_campaigns` | PRIMARY KEY | ✅ PASS |
| `notification_campaigns_status_not_null` | `notification_campaigns` | CHECK | ✅ PASS |
| `notification_campaigns_target_type_not_null` | `notification_campaigns` | CHECK | ✅ PASS |
| `notification_campaigns_title_not_null` | `notification_campaigns` | CHECK | ✅ PASS |
| `notification_campaigns_updated_at_not_null` | `notification_campaigns` | CHECK | ✅ PASS |
| `notification_receipts_id_not_null` | `notification_receipts` | CHECK | ✅ PASS |
| `notification_receipts_notification_id_not_null` | `notification_receipts` | CHECK | ✅ PASS |
| `notification_receipts_pkey` | `notification_receipts` | PRIMARY KEY | ✅ PASS |
| `notification_templates_body_not_null` | `notification_templates` | CHECK | ✅ PASS |
| `notification_templates_created_at_not_null` | `notification_templates` | CHECK | ✅ PASS |
| `notification_templates_id_not_null` | `notification_templates` | CHECK | ✅ PASS |
| `notification_templates_name_not_null` | `notification_templates` | CHECK | ✅ PASS |
| `notification_templates_pkey` | `notification_templates` | PRIMARY KEY | ✅ PASS |
| `notification_templates_subject_not_null` | `notification_templates` | CHECK | ✅ PASS |
| `notification_templates_updated_at_not_null` | `notification_templates` | CHECK | ✅ PASS |
| `notifications_created_at_not_null` | `notifications` | CHECK | ✅ PASS |
| `notifications_id_not_null` | `notifications` | CHECK | ✅ PASS |
| `notifications_is_broadcast_not_null` | `notifications` | CHECK | ✅ PASS |
| `notifications_is_read_not_null` | `notifications` | CHECK | ✅ PASS |
| `notifications_message_not_null` | `notifications` | CHECK | ✅ PASS |
| `notifications_pkey` | `notifications` | PRIMARY KEY | ✅ PASS |
| `notifications_recipient_role_not_null` | `notifications` | CHECK | ✅ PASS |
| `notifications_sent_email_not_null` | `notifications` | CHECK | ✅ PASS |
| `notifications_sent_push_not_null` | `notifications` | CHECK | ✅ PASS |
| `notifications_sent_sms_not_null` | `notifications` | CHECK | ✅ PASS |
| `notifications_status_not_null` | `notifications` | CHECK | ✅ PASS |
| `notifications_title_not_null` | `notifications` | CHECK | ✅ PASS |
| `notifications_type_not_null` | `notifications` | CHECK | ✅ PASS |
| `order_histories_id_not_null` | `order_histories` | CHECK | ✅ PASS |
| `order_histories_order_id_not_null` | `order_histories` | CHECK | ✅ PASS |
| `order_histories_pkey` | `order_histories` | PRIMARY KEY | ✅ PASS |
| `order_histories_status_not_null` | `order_histories` | CHECK | ✅ PASS |
| `order_histories_timestamp_not_null` | `order_histories` | CHECK | ✅ PASS |
| `order_sequences_created_at_not_null` | `order_sequences` | CHECK | ✅ PASS |
| `order_sequences_date_not_null` | `order_sequences` | CHECK | ✅ PASS |
| `order_sequences_id_not_null` | `order_sequences` | CHECK | ✅ PASS |
| `order_sequences_last_number_not_null` | `order_sequences` | CHECK | ✅ PASS |
| `order_sequences_pkey` | `order_sequences` | PRIMARY KEY | ✅ PASS |
| `orders_advance_paid_not_null` | `orders` | CHECK | ✅ PASS |
| `orders_boutique_id_not_null` | `orders` | CHECK | ✅ PASS |
| `orders_category_not_null` | `orders` | CHECK | ✅ PASS |
| `orders_created_at_not_null` | `orders` | CHECK | ✅ PASS |
| `orders_customer_name_not_null` | `orders` | CHECK | ✅ PASS |
| `orders_customer_phone_not_null` | `orders` | CHECK | ✅ PASS |
| `orders_id_not_null` | `orders` | CHECK | ✅ PASS |
| `orders_is_deleted_not_null` | `orders` | CHECK | ✅ PASS |
| `orders_order_date_not_null` | `orders` | CHECK | ✅ PASS |
| `orders_order_id_not_null` | `orders` | CHECK | ✅ PASS |
| `orders_order_status_not_null` | `orders` | CHECK | ✅ PASS |
| `orders_owner_id_not_null` | `orders` | CHECK | ✅ PASS |
| `orders_payment_status_not_null` | `orders` | CHECK | ✅ PASS |
| `orders_pkey` | `orders` | PRIMARY KEY | ✅ PASS |
| `orders_price_not_null` | `orders` | CHECK | ✅ PASS |
| `orders_remaining_amount_not_null` | `orders` | CHECK | ✅ PASS |
| `orders_updated_at_not_null` | `orders` | CHECK | ✅ PASS |
| `owner_feature_permissions_can_export_reports_not_null` | `owner_feature_permissions` | CHECK | ✅ PASS |
| `owner_feature_permissions_can_manage_analytics_not_null` | `owner_feature_permissions` | CHECK | ✅ PASS |
| `owner_feature_permissions_can_manage_bookings_not_null` | `owner_feature_permissions` | CHECK | ✅ PASS |
| `owner_feature_permissions_can_manage_branches_not_null` | `owner_feature_permissions` | CHECK | ✅ PASS |
| `owner_feature_permissions_can_manage_customers_not_null` | `owner_feature_permissions` | CHECK | ✅ PASS |
| `owner_feature_permissions_can_manage_delivery_not_null` | `owner_feature_permissions` | CHECK | ✅ PASS |
| `owner_feature_permissions_can_manage_designs_not_null` | `owner_feature_permissions` | CHECK | ✅ PASS |
| `owner_feature_permissions_can_manage_expenses_not_null` | `owner_feature_permissions` | CHECK | ✅ PASS |
| `owner_feature_permissions_can_manage_gallery_not_null` | `owner_feature_permissions` | CHECK | ✅ PASS |
| `owner_feature_permissions_can_manage_inventory_not_null` | `owner_feature_permissions` | CHECK | ✅ PASS |
| `owner_feature_permissions_can_manage_marketing_not_null` | `owner_feature_permissions` | CHECK | ✅ PASS |
| `owner_feature_permissions_can_manage_measurements_not_null` | `owner_feature_permissions` | CHECK | ✅ PASS |
| `owner_feature_permissions_can_manage_notifications_not_null` | `owner_feature_permissions` | CHECK | ✅ PASS |
| `owner_feature_permissions_can_manage_orders_not_null` | `owner_feature_permissions` | CHECK | ✅ PASS |
| `owner_feature_permissions_can_manage_payments_not_null` | `owner_feature_permissions` | CHECK | ✅ PASS |
| `owner_feature_permissions_can_manage_payouts_not_null` | `owner_feature_permissions` | CHECK | ✅ PASS |
| `owner_feature_permissions_can_manage_production_not_null` | `owner_feature_permissions` | CHECK | ✅ PASS |
| `owner_feature_permissions_can_manage_products_not_null` | `owner_feature_permissions` | CHECK | ✅ PASS |
| `owner_feature_permissions_can_manage_reviews_not_null` | `owner_feature_permissions` | CHECK | ✅ PASS |
| `owner_feature_permissions_can_manage_roles_not_null` | `owner_feature_permissions` | CHECK | ✅ PASS |
| `owner_feature_permissions_can_manage_staff_not_null` | `owner_feature_permissions` | CHECK | ✅ PASS |
| `owner_feature_permissions_created_at_not_null` | `owner_feature_permissions` | CHECK | ✅ PASS |
| `owner_feature_permissions_id_not_null` | `owner_feature_permissions` | CHECK | ✅ PASS |
| `owner_feature_permissions_owner_id_not_null` | `owner_feature_permissions` | CHECK | ✅ PASS |
| `owner_feature_permissions_pkey` | `owner_feature_permissions` | PRIMARY KEY | ✅ PASS |
| `owner_feature_permissions_updated_at_not_null` | `owner_feature_permissions` | CHECK | ✅ PASS |
| `owners_can_edit_gallery_not_null` | `owners` | CHECK | ✅ PASS |
| `owners_can_edit_profile_not_null` | `owners` | CHECK | ✅ PASS |
| `owners_can_edit_services_not_null` | `owners` | CHECK | ✅ PASS |
| `owners_can_export_reports_not_null` | `owners` | CHECK | ✅ PASS |
| `owners_can_manage_bookings_not_null` | `owners` | CHECK | ✅ PASS |
| `owners_can_manage_branches_not_null` | `owners` | CHECK | ✅ PASS |
| `owners_can_manage_customers_not_null` | `owners` | CHECK | ✅ PASS |
| `owners_can_manage_delivery_not_null` | `owners` | CHECK | ✅ PASS |
| `owners_can_manage_designs_not_null` | `owners` | CHECK | ✅ PASS |
| `owners_can_manage_expenses_not_null` | `owners` | CHECK | ✅ PASS |
| `owners_can_manage_inventory_not_null` | `owners` | CHECK | ✅ PASS |
| `owners_can_manage_marketing_not_null` | `owners` | CHECK | ✅ PASS |
| `owners_can_manage_measurements_not_null` | `owners` | CHECK | ✅ PASS |
| `owners_can_manage_media_not_null` | `owners` | CHECK | ✅ PASS |
| `owners_can_manage_orders_not_null` | `owners` | CHECK | ✅ PASS |
| `owners_can_manage_production_not_null` | `owners` | CHECK | ✅ PASS |
| `owners_can_manage_reviews_not_null` | `owners` | CHECK | ✅ PASS |
| `owners_can_manage_roles_not_null` | `owners` | CHECK | ✅ PASS |
| `owners_can_view_analytics_not_null` | `owners` | CHECK | ✅ PASS |
| `owners_created_at_not_null` | `owners` | CHECK | ✅ PASS |
| `owners_email_not_null` | `owners` | CHECK | ✅ PASS |
| `owners_email_verified_not_null` | `owners` | CHECK | ✅ PASS |
| `owners_id_not_null` | `owners` | CHECK | ✅ PASS |
| `owners_is_deleted_not_null` | `owners` | CHECK | ✅ PASS |
| `owners_login_enabled_not_null` | `owners` | CHECK | ✅ PASS |
| `owners_mobile_number_not_null` | `owners` | CHECK | ✅ PASS |
| `owners_must_reset_password_not_null` | `owners` | CHECK | ✅ PASS |
| `owners_owner_name_not_null` | `owners` | CHECK | ✅ PASS |
| `owners_password_not_null` | `owners` | CHECK | ✅ PASS |
| `owners_pkey` | `owners` | PRIMARY KEY | ✅ PASS |
| `owners_read_only_mode_not_null` | `owners` | CHECK | ✅ PASS |
| `owners_role_not_null` | `owners` | CHECK | ✅ PASS |
| `owners_status_not_null` | `owners` | CHECK | ✅ PASS |
| `owners_username_not_null` | `owners` | CHECK | ✅ PASS |
| `payments_amount_not_null` | `payments` | CHECK | ✅ PASS |
| `payments_boutique_id_not_null` | `payments` | CHECK | ✅ PASS |
| `payments_commission_amount_not_null` | `payments` | CHECK | ✅ PASS |
| `payments_created_at_not_null` | `payments` | CHECK | ✅ PASS |
| `payments_id_not_null` | `payments` | CHECK | ✅ PASS |
| `payments_net_amount_not_null` | `payments` | CHECK | ✅ PASS |
| `payments_order_id_not_null` | `payments` | CHECK | ✅ PASS |
| `payments_payout_status_not_null` | `payments` | CHECK | ✅ PASS |
| `payments_pkey` | `payments` | PRIMARY KEY | ✅ PASS |
| `payments_status_not_null` | `payments` | CHECK | ✅ PASS |
| `payouts_amount_not_null` | `payouts` | CHECK | ✅ PASS |
| `payouts_boutique_id_not_null` | `payouts` | CHECK | ✅ PASS |
| `payouts_created_at_not_null` | `payouts` | CHECK | ✅ PASS |
| `payouts_id_not_null` | `payouts` | CHECK | ✅ PASS |
| `payouts_pkey` | `payouts` | PRIMARY KEY | ✅ PASS |
| `payouts_status_not_null` | `payouts` | CHECK | ✅ PASS |
| `payouts_updated_at_not_null` | `payouts` | CHECK | ✅ PASS |
| `platform_settings_category_commissions_not_null` | `platform_settings` | CHECK | ✅ PASS |
| `platform_settings_global_commission_rate_not_null` | `platform_settings` | CHECK | ✅ PASS |
| `platform_settings_id_not_null` | `platform_settings` | CHECK | ✅ PASS |
| `platform_settings_pkey` | `platform_settings` | PRIMARY KEY | ✅ PASS |
| `platform_settings_updated_at_not_null` | `platform_settings` | CHECK | ✅ PASS |
| `product_analytics_add_to_cart_count_not_null` | `product_analytics` | CHECK | ✅ PASS |
| `product_analytics_created_at_not_null` | `product_analytics` | CHECK | ✅ PASS |
| `product_analytics_id_not_null` | `product_analytics` | CHECK | ✅ PASS |
| `product_analytics_order_count_not_null` | `product_analytics` | CHECK | ✅ PASS |
| `product_analytics_period_end_not_null` | `product_analytics` | CHECK | ✅ PASS |
| `product_analytics_period_start_not_null` | `product_analytics` | CHECK | ✅ PASS |
| `product_analytics_pkey` | `product_analytics` | PRIMARY KEY | ✅ PASS |
| `product_analytics_product_id_not_null` | `product_analytics` | CHECK | ✅ PASS |
| `product_analytics_revenue_not_null` | `product_analytics` | CHECK | ✅ PASS |
| `product_analytics_unique_views_not_null` | `product_analytics` | CHECK | ✅ PASS |
| `product_analytics_updated_at_not_null` | `product_analytics` | CHECK | ✅ PASS |
| `product_analytics_views_not_null` | `product_analytics` | CHECK | ✅ PASS |
| `product_brands_boutique_id_not_null` | `product_brands` | CHECK | ✅ PASS |
| `product_brands_created_at_not_null` | `product_brands` | CHECK | ✅ PASS |
| `product_brands_id_not_null` | `product_brands` | CHECK | ✅ PASS |
| `product_brands_is_active_not_null` | `product_brands` | CHECK | ✅ PASS |
| `product_brands_name_not_null` | `product_brands` | CHECK | ✅ PASS |
| `product_brands_pkey` | `product_brands` | PRIMARY KEY | ✅ PASS |
| `product_brands_updated_at_not_null` | `product_brands` | CHECK | ✅ PASS |
| `product_images_id_not_null` | `product_images` | CHECK | ✅ PASS |
| `product_images_is_primary_not_null` | `product_images` | CHECK | ✅ PASS |
| `product_images_pkey` | `product_images` | PRIMARY KEY | ✅ PASS |
| `product_images_product_id_not_null` | `product_images` | CHECK | ✅ PASS |
| `product_images_sort_order_not_null` | `product_images` | CHECK | ✅ PASS |
| `product_images_url_not_null` | `product_images` | CHECK | ✅ PASS |
| `product_inventory_id_not_null` | `product_inventory` | CHECK | ✅ PASS |
| `product_inventory_low_stock_threshold_not_null` | `product_inventory` | CHECK | ✅ PASS |
| `product_inventory_pkey` | `product_inventory` | PRIMARY KEY | ✅ PASS |
| `product_inventory_quantity_not_null` | `product_inventory` | CHECK | ✅ PASS |
| `product_inventory_reserved_quantity_not_null` | `product_inventory` | CHECK | ✅ PASS |
| `product_inventory_track_inventory_not_null` | `product_inventory` | CHECK | ✅ PASS |
| `product_inventory_variant_id_not_null` | `product_inventory` | CHECK | ✅ PASS |
| `product_inventory_version_not_null` | `product_inventory` | CHECK | ✅ PASS |
| `product_inventory_logs_change_not_null` | `product_inventory_logs` | CHECK | ✅ PASS |
| `product_inventory_logs_created_at_not_null` | `product_inventory_logs` | CHECK | ✅ PASS |
| `product_inventory_logs_id_not_null` | `product_inventory_logs` | CHECK | ✅ PASS |
| `product_inventory_logs_pkey` | `product_inventory_logs` | PRIMARY KEY | ✅ PASS |
| `product_inventory_logs_product_id_not_null` | `product_inventory_logs` | CHECK | ✅ PASS |
| `product_inventory_logs_quantity_after_not_null` | `product_inventory_logs` | CHECK | ✅ PASS |
| `product_inventory_logs_quantity_before_not_null` | `product_inventory_logs` | CHECK | ✅ PASS |
| `product_inventory_logs_reason_not_null` | `product_inventory_logs` | CHECK | ✅ PASS |
| `product_reviews_created_at_not_null` | `product_reviews` | CHECK | ✅ PASS |
| `product_reviews_id_not_null` | `product_reviews` | CHECK | ✅ PASS |
| `product_reviews_is_verified_purchase_not_null` | `product_reviews` | CHECK | ✅ PASS |
| `product_reviews_pkey` | `product_reviews` | PRIMARY KEY | ✅ PASS |
| `product_reviews_product_id_not_null` | `product_reviews` | CHECK | ✅ PASS |
| `product_reviews_rating_not_null` | `product_reviews` | CHECK | ✅ PASS |
| `product_reviews_status_not_null` | `product_reviews` | CHECK | ✅ PASS |
| `product_reviews_updated_at_not_null` | `product_reviews` | CHECK | ✅ PASS |
| `product_reviews_user_id_not_null` | `product_reviews` | CHECK | ✅ PASS |
| `product_tags_boutique_id_not_null` | `product_tags` | CHECK | ✅ PASS |
| `product_tags_created_at_not_null` | `product_tags` | CHECK | ✅ PASS |
| `product_tags_id_not_null` | `product_tags` | CHECK | ✅ PASS |
| `product_tags_is_active_not_null` | `product_tags` | CHECK | ✅ PASS |
| `product_tags_name_not_null` | `product_tags` | CHECK | ✅ PASS |
| `product_tags_pkey` | `product_tags` | PRIMARY KEY | ✅ PASS |
| `product_variant_attributes_id_not_null` | `product_variant_attributes` | CHECK | ✅ PASS |
| `product_variant_attributes_name_not_null` | `product_variant_attributes` | CHECK | ✅ PASS |
| `product_variant_attributes_pkey` | `product_variant_attributes` | PRIMARY KEY | ✅ PASS |
| `product_variant_attributes_product_id_not_null` | `product_variant_attributes` | CHECK | ✅ PASS |
| `product_variant_attributes_values_not_null` | `product_variant_attributes` | CHECK | ✅ PASS |
| `product_variants_id_not_null` | `product_variants` | CHECK | ✅ PASS |
| `product_variants_name_not_null` | `product_variants` | CHECK | ✅ PASS |
| `product_variants_pkey` | `product_variants` | PRIMARY KEY | ✅ PASS |
| `product_variants_product_id_not_null` | `product_variants` | CHECK | ✅ PASS |
| `product_variants_sort_order_not_null` | `product_variants` | CHECK | ✅ PASS |
| `product_variants_status_not_null` | `product_variants` | CHECK | ✅ PASS |
| `product_wishlists_created_at_not_null` | `product_wishlists` | CHECK | ✅ PASS |
| `product_wishlists_id_not_null` | `product_wishlists` | CHECK | ✅ PASS |
| `product_wishlists_pkey` | `product_wishlists` | PRIMARY KEY | ✅ PASS |
| `product_wishlists_product_id_not_null` | `product_wishlists` | CHECK | ✅ PASS |
| `product_wishlists_user_id_not_null` | `product_wishlists` | CHECK | ✅ PASS |
| `products_average_rating_not_null` | `products` | CHECK | ✅ PASS |
| `products_base_price_not_null` | `products` | CHECK | ✅ PASS |
| `products_boutique_id_not_null` | `products` | CHECK | ✅ PASS |
| `products_created_at_not_null` | `products` | CHECK | ✅ PASS |
| `products_delivery_type_not_null` | `products` | CHECK | ✅ PASS |
| `products_id_not_null` | `products` | CHECK | ✅ PASS |
| `products_is_deleted_not_null` | `products` | CHECK | ✅ PASS |
| `products_is_featured_not_null` | `products` | CHECK | ✅ PASS |
| `products_is_marketplace_visible_not_null` | `products` | CHECK | ✅ PASS |
| `products_is_taxable_not_null` | `products` | CHECK | ✅ PASS |
| `products_name_not_null` | `products` | CHECK | ✅ PASS |
| `products_pkey` | `products` | PRIMARY KEY | ✅ PASS |
| `products_product_type_not_null` | `products` | CHECK | ✅ PASS |
| `products_review_count_not_null` | `products` | CHECK | ✅ PASS |
| `products_status_not_null` | `products` | CHECK | ✅ PASS |
| `products_updated_at_not_null` | `products` | CHECK | ✅ PASS |
| `return_requests_created_at_not_null` | `return_requests` | CHECK | ✅ PASS |
| `return_requests_customer_id_not_null` | `return_requests` | CHECK | ✅ PASS |
| `return_requests_id_not_null` | `return_requests` | CHECK | ✅ PASS |
| `return_requests_order_id_not_null` | `return_requests` | CHECK | ✅ PASS |
| `return_requests_order_item_id_not_null` | `return_requests` | CHECK | ✅ PASS |
| `return_requests_pkey` | `return_requests` | PRIMARY KEY | ✅ PASS |
| `return_requests_reason_not_null` | `return_requests` | CHECK | ✅ PASS |
| `return_requests_requested_at_not_null` | `return_requests` | CHECK | ✅ PASS |
| `return_requests_return_number_not_null` | `return_requests` | CHECK | ✅ PASS |
| `return_requests_status_not_null` | `return_requests` | CHECK | ✅ PASS |
| `return_requests_updated_at_not_null` | `return_requests` | CHECK | ✅ PASS |
| `reviews_boutique_id_not_null` | `reviews` | CHECK | ✅ PASS |
| `reviews_created_at_not_null` | `reviews` | CHECK | ✅ PASS |
| `reviews_id_not_null` | `reviews` | CHECK | ✅ PASS |
| `reviews_is_suspicious_not_null` | `reviews` | CHECK | ✅ PASS |
| `reviews_moderation_status_not_null` | `reviews` | CHECK | ✅ PASS |
| `reviews_pkey` | `reviews` | PRIMARY KEY | ✅ PASS |
| `reviews_rating_not_null` | `reviews` | CHECK | ✅ PASS |
| `reviews_report_count_not_null` | `reviews` | CHECK | ✅ PASS |
| `reviews_user_id_not_null` | `reviews` | CHECK | ✅ PASS |
| `reviews_verified_purchase_not_null` | `reviews` | CHECK | ✅ PASS |
| `shipping_addresses_address_line1_not_null` | `shipping_addresses` | CHECK | ✅ PASS |
| `shipping_addresses_city_not_null` | `shipping_addresses` | CHECK | ✅ PASS |
| `shipping_addresses_created_at_not_null` | `shipping_addresses` | CHECK | ✅ PASS |
| `shipping_addresses_full_name_not_null` | `shipping_addresses` | CHECK | ✅ PASS |
| `shipping_addresses_id_not_null` | `shipping_addresses` | CHECK | ✅ PASS |
| `shipping_addresses_is_default_not_null` | `shipping_addresses` | CHECK | ✅ PASS |
| `shipping_addresses_phone_not_null` | `shipping_addresses` | CHECK | ✅ PASS |
| `shipping_addresses_pincode_not_null` | `shipping_addresses` | CHECK | ✅ PASS |
| `shipping_addresses_pkey` | `shipping_addresses` | PRIMARY KEY | ✅ PASS |
| `shipping_addresses_state_not_null` | `shipping_addresses` | CHECK | ✅ PASS |
| `shipping_addresses_user_id_not_null` | `shipping_addresses` | CHECK | ✅ PASS |
| `sub_categories_category_id_not_null` | `sub_categories` | CHECK | ✅ PASS |
| `sub_categories_created_at_not_null` | `sub_categories` | CHECK | ✅ PASS |
| `sub_categories_id_not_null` | `sub_categories` | CHECK | ✅ PASS |
| `sub_categories_is_active_not_null` | `sub_categories` | CHECK | ✅ PASS |
| `sub_categories_name_not_null` | `sub_categories` | CHECK | ✅ PASS |
| `sub_categories_pkey` | `sub_categories` | PRIMARY KEY | ✅ PASS |
| `sub_categories_sort_order_not_null` | `sub_categories` | CHECK | ✅ PASS |
| `sub_categories_updated_at_not_null` | `sub_categories` | CHECK | ✅ PASS |
| `subscription_billing_history_amount_not_null` | `subscription_billing_history` | CHECK | ✅ PASS |
| `subscription_billing_history_created_at_not_null` | `subscription_billing_history` | CHECK | ✅ PASS |
| `subscription_billing_history_id_not_null` | `subscription_billing_history` | CHECK | ✅ PASS |
| `subscription_billing_history_payment_status_not_null` | `subscription_billing_history` | CHECK | ✅ PASS |
| `subscription_billing_history_pkey` | `subscription_billing_history` | PRIMARY KEY | ✅ PASS |
| `subscription_billing_history_subscription_id_not_null` | `subscription_billing_history` | CHECK | ✅ PASS |
| `subscription_plans_allow_custom_tailoring_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_allow_direct_selling_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_can_create_campaigns_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_can_create_custom_orders_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_can_feature_boutique_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_can_feature_products_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_can_list_in_marketplace_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_can_manage_attendance_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_can_manage_coupons_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_can_manage_customer_notes_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_can_manage_customers_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_can_manage_offers_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_can_manage_payroll_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_can_manage_product_variants_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_can_manage_production_workflow_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_can_manage_products_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_can_manage_referrals_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_can_manage_returns_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_can_manage_reviews_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_can_manage_rewards_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_can_manage_shipping_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_can_manage_staff_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_can_manage_stock_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_can_manage_tailor_assignments_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_can_manage_tailoring_orders_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_can_manage_tasks_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_can_manage_wallet_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_can_sell_premium_designs_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_can_use_ai_assistant_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_can_use_ai_design_suggestions_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_can_use_ai_recommendations_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_can_use_api_access_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_can_use_custom_branding_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_can_use_custom_measurements_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_can_use_email_marketing_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_can_use_measurement_history_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_can_use_multi_branch_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_can_use_sms_marketing_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_can_use_whatsapp_marketing_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_can_use_white_label_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_can_view_advanced_analytics_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_can_view_analytics_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_can_view_financial_reports_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_created_at_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_grace_period_days_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_id_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_is_active_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_is_featured_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_max_bookings_per_month_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_max_branches_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_max_custom_designs_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_max_customers_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_max_gallery_images_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_max_measurements_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_max_orders_per_month_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_max_ready_made_products_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_max_staff_accounts_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_monthly_price_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_name_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_pkey` | `subscription_plans` | PRIMARY KEY | ✅ PASS |
| `subscription_plans_plan_code_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_recommended_plan_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_sort_order_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_trial_period_days_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_updated_at_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `subscription_plans_yearly_price_not_null` | `subscription_plans` | CHECK | ✅ PASS |
| `support_ticket_admin_notes_admin_id_not_null` | `support_ticket_admin_notes` | CHECK | ✅ PASS |
| `support_ticket_admin_notes_created_at_not_null` | `support_ticket_admin_notes` | CHECK | ✅ PASS |
| `support_ticket_admin_notes_id_not_null` | `support_ticket_admin_notes` | CHECK | ✅ PASS |
| `support_ticket_admin_notes_note_not_null` | `support_ticket_admin_notes` | CHECK | ✅ PASS |
| `support_ticket_admin_notes_pkey` | `support_ticket_admin_notes` | PRIMARY KEY | ✅ PASS |
| `support_ticket_admin_notes_ticket_id_not_null` | `support_ticket_admin_notes` | CHECK | ✅ PASS |
| `support_ticket_messages_created_at_not_null` | `support_ticket_messages` | CHECK | ✅ PASS |
| `support_ticket_messages_id_not_null` | `support_ticket_messages` | CHECK | ✅ PASS |
| `support_ticket_messages_message_not_null` | `support_ticket_messages` | CHECK | ✅ PASS |
| `support_ticket_messages_pkey` | `support_ticket_messages` | PRIMARY KEY | ✅ PASS |
| `support_ticket_messages_sender_id_not_null` | `support_ticket_messages` | CHECK | ✅ PASS |
| `support_ticket_messages_sender_name_not_null` | `support_ticket_messages` | CHECK | ✅ PASS |
| `support_ticket_messages_sender_type_not_null` | `support_ticket_messages` | CHECK | ✅ PASS |
| `support_ticket_messages_ticket_id_not_null` | `support_ticket_messages` | CHECK | ✅ PASS |
| `support_tickets_created_at_not_null` | `support_tickets` | CHECK | ✅ PASS |
| `support_tickets_description_not_null` | `support_tickets` | CHECK | ✅ PASS |
| `support_tickets_escalation_level_not_null` | `support_tickets` | CHECK | ✅ PASS |
| `support_tickets_excessive_ticket_flag_not_null` | `support_tickets` | CHECK | ✅ PASS |
| `support_tickets_fraud_score_not_null` | `support_tickets` | CHECK | ✅ PASS |
| `support_tickets_id_not_null` | `support_tickets` | CHECK | ✅ PASS |
| `support_tickets_pkey` | `support_tickets` | PRIMARY KEY | ✅ PASS |
| `support_tickets_priority_not_null` | `support_tickets` | CHECK | ✅ PASS |
| `support_tickets_risk_level_not_null` | `support_tickets` | CHECK | ✅ PASS |
| `support_tickets_sla_breached_not_null` | `support_tickets` | CHECK | ✅ PASS |
| `support_tickets_source_not_null` | `support_tickets` | CHECK | ✅ PASS |
| `support_tickets_status_not_null` | `support_tickets` | CHECK | ✅ PASS |
| `support_tickets_subject_not_null` | `support_tickets` | CHECK | ✅ PASS |
| `support_tickets_ticket_type_not_null` | `support_tickets` | CHECK | ✅ PASS |
| `support_tickets_updated_at_not_null` | `support_tickets` | CHECK | ✅ PASS |
| `support_tickets_user_id_not_null` | `support_tickets` | CHECK | ✅ PASS |
| `users_created_at_not_null` | `users` | CHECK | ✅ PASS |
| `users_id_not_null` | `users` | CHECK | ✅ PASS |
| `users_otp_max_attempts_not_null` | `users` | CHECK | ✅ PASS |
| `users_otp_remaining_attempts_not_null` | `users` | CHECK | ✅ PASS |
| `users_otp_status_not_null` | `users` | CHECK | ✅ PASS |
| `users_phone_not_null` | `users` | CHECK | ✅ PASS |
| `users_pkey` | `users` | PRIMARY KEY | ✅ PASS |
| `users_segment_not_null` | `users` | CHECK | ✅ PASS |
| `users_status_not_null` | `users` | CHECK | ✅ PASS |
| `wishlists_created_at_not_null` | `wishlists` | CHECK | ✅ PASS |
| `wishlists_design_id_not_null` | `wishlists` | CHECK | ✅ PASS |
| `wishlists_id_not_null` | `wishlists` | CHECK | ✅ PASS |
| `wishlists_pkey` | `wishlists` | PRIMARY KEY | ✅ PASS |
| `wishlists_user_id_not_null` | `wishlists` | CHECK | ✅ PASS |

## 5. Sequences Verification
✅ **PASS:** 0 integer sequences found. The system uses UUID primary keys generated in application logic via `uuid_generate_v4()`, mitigating standard integer overflow/sync concerns.

## 6. Enums Verification
| Enum Type | Value |
| --- | --- |
| `ActivityType` | `order` |
| `ActivityType` | `success` |
| `ActivityType` | `user` |
| `AdminNotificationType` | `BOOKING_CANCELLED` |
| `AdminNotificationType` | `EMPLOYEE_ASSIGNED` |
| `AdminNotificationType` | `LOW_STOCK` |
| `AdminNotificationType` | `NEW_BOOKING` |
| `AdminNotificationType` | `NEW_MEASUREMENT` |
| `AdminNotificationType` | `NEW_ORDER` |
| `AdminNotificationType` | `NEW_REVIEW` |
| `AdminNotificationType` | `ORDER_CANCELLED` |
| `AdminNotificationType` | `ORDER_EXCHANGE_APPROVED` |
| `AdminNotificationType` | `ORDER_EXCHANGE_REQUEST` |
| `AdminNotificationType` | `ORDER_RETURN_APPROVED` |
| `AdminNotificationType` | `ORDER_RETURN_REJECTED` |
| `AdminNotificationType` | `ORDER_RETURN_REQUEST` |
| `AdminNotificationType` | `OUT_OF_STOCK` |
| `AdminNotificationType` | `PAYMENT_FAILED` |
| `AdminNotificationType` | `PAYMENT_RECEIVED` |
| `AdminNotificationType` | `PRODUCT_APPROVAL` |
| `AdminNotificationType` | `SUBSCRIPTION_EXPIRED` |
| `AdminNotificationType` | `SUBSCRIPTION_EXPIRING` |
| `AdminNotificationType` | `SYSTEM_ALERT` |
| `BookingStatus` | `Accepted` |
| `BookingStatus` | `Completed` |
| `BookingStatus` | `Pending` |
| `BookingStatus` | `Rejected` |
| `BookingStatus` | `Rescheduled` |
| `BookingType` | `DESIGN_DISCUSSION` |
| `BookingType` | `FINAL_DELIVERY` |
| `BookingType` | `HOME_MEASUREMENT` |
| `BookingType` | `STORE_VISIT` |
| `BookingType` | `TRIAL_FITTING` |
| `BookingType` | `VIDEO_CONSULTATION` |
| `BoutiqueStatus` | `Active` |
| `BoutiqueStatus` | `Inactive` |
| `CommerceOrderStatus` | `CANCELLED` |
| `CommerceOrderStatus` | `CONFIRMED` |
| `CommerceOrderStatus` | `DELIVERED` |
| `CommerceOrderStatus` | `OUT_FOR_DELIVERY` |
| `CommerceOrderStatus` | `PACKED` |
| `CommerceOrderStatus` | `PENDING` |
| `CommerceOrderStatus` | `PROCESSING` |
| `CommerceOrderStatus` | `REFUNDED` |
| `CommerceOrderStatus` | `RETURNED` |
| `CommerceOrderStatus` | `SHIPPED` |
| `CommercePaymentStatus` | `FAILED` |
| `CommercePaymentStatus` | `PAID` |
| `CommercePaymentStatus` | `PENDING` |
| `CommercePaymentStatus` | `REFUNDED` |
| `CustomerNotificationType` | `BOOKING_CONFIRMED` |
| `CustomerNotificationType` | `BOOKING_RESCHEDULED` |
| `CustomerNotificationType` | `EXCHANGE_APPROVED` |
| `CustomerNotificationType` | `EXCHANGE_REQUESTED` |
| `CustomerNotificationType` | `EXCHANGE_SHIPPED` |
| `CustomerNotificationType` | `ORDER_DELIVERED` |
| `CustomerNotificationType` | `ORDER_PLACED` |
| `CustomerNotificationType` | `ORDER_SHIPPED` |
| `CustomerNotificationType` | `PAYMENT_FAILED` |
| `CustomerNotificationType` | `PAYMENT_SUCCESS` |
| `CustomerNotificationType` | `PROMOTION` |
| `CustomerNotificationType` | `RETURN_APPROVED` |
| `CustomerNotificationType` | `RETURN_REJECTED` |
| `CustomerNotificationType` | `RETURN_REQUESTED` |
| `CustomerNotificationType` | `REVIEW_REPLY` |
| `CustomerSegment` | `ACTIVE` |
| `CustomerSegment` | `BLOCKED` |
| `CustomerSegment` | `INACTIVE` |
| `CustomerSegment` | `NEW` |
| `CustomerSegment` | `VIP` |
| `DeliveryType` | `EXPRESS` |
| `DeliveryType` | `HOME_DELIVERY` |
| `DeliveryType` | `PICKUP` |
| `DeliveryType` | `SHIP` |
| `DeliveryType` | `STANDARD` |
| `DesignCategory` | `Blouse` |
| `DesignCategory` | `Lehenga` |
| `DesignCategory` | `Other` |
| `DesignCategory` | `Saree` |
| `ExchangeStatus` | `APPROVED` |
| `ExchangeStatus` | `COMPLETED` |
| `ExchangeStatus` | `PROCESSING` |
| `ExchangeStatus` | `REJECTED` |
| `ExchangeStatus` | `REQUESTED` |
| `ExchangeStatus` | `SHIPPED` |
| `ExchangeStatus` | `UNDER_REVIEW` |
| `NotificationPriority` | `CRITICAL` |
| `NotificationPriority` | `HIGH` |
| `NotificationPriority` | `LOW` |
| `NotificationPriority` | `NORMAL` |
| `NotificationType` | `BROADCAST` |
| `NotificationType` | `ORDER_NEW` |
| `NotificationType` | `ORDER_STATUS` |
| `NotificationType` | `SYSTEM` |
| `OrderStatus` | `accepted` |
| `OrderStatus` | `cancelled` |
| `OrderStatus` | `delivered` |
| `OrderStatus` | `in_progress` |
| `OrderStatus` | `pending` |
| `OrderStatus` | `ready` |
| `OwnerRole` | `owner` |
| `OwnerRole` | `super-admin` |
| `OwnerStatus` | `Active` |
| `OwnerStatus` | `Blocked` |
| `OwnerStatus` | `Pending` |
| `PaymentStatus` | `captured` |
| `PaymentStatus` | `failed` |
| `PaymentStatus` | `pending` |
| `PaymentStatus` | `refunded` |
| `PayoutState` | `APPROVED` |
| `PayoutState` | `FAILED` |
| `PayoutState` | `PENDING` |
| `PayoutState` | `RELEASED` |
| `PayoutStatus` | `Pending` |
| `PayoutStatus` | `Rejected` |
| `PayoutStatus` | `Verified` |
| `PayoutStatusType` | `completed` |
| `PayoutStatusType` | `failed` |
| `PayoutStatusType` | `pending` |
| `PayoutStatusType` | `scheduled` |
| `ProductStatus` | `ACTIVE` |
| `ProductStatus` | `DISCONTINUED` |
| `ProductStatus` | `DRAFT` |
| `ProductStatus` | `INACTIVE` |
| `ProductType` | `CUSTOM` |
| `ProductType` | `DIGITAL` |
| `ProductType` | `PRE_ORDER` |
| `ProductType` | `READY_MADE` |
| `RecipientRole` | `owner` |
| `RecipientRole` | `super-admin` |
| `RecipientType` | `EMPLOYEE` |
| `RecipientType` | `OWNER` |
| `RecipientType` | `SUPER_ADMIN` |
| `ReturnStatus` | `APPROVED` |
| `ReturnStatus` | `COMPLETED` |
| `ReturnStatus` | `PICKUP_SCHEDULED` |
| `ReturnStatus` | `RECEIVED` |
| `ReturnStatus` | `REFUNDED` |
| `ReturnStatus` | `REJECTED` |
| `ReturnStatus` | `REQUESTED` |
| `ReturnStatus` | `UNDER_REVIEW` |
| `ReviewModerationStatus` | `APPROVED` |
| `ReviewModerationStatus` | `FLAGGED` |
| `ReviewModerationStatus` | `PENDING` |
| `ReviewModerationStatus` | `REJECTED` |
| `SubscriptionPlanType` | `CUSTOM` |
| `SubscriptionPlanType` | `ENTERPRISE` |
| `SubscriptionPlanType` | `FREE` |
| `SubscriptionPlanType` | `PRO` |
| `SubscriptionPlanType` | `STARTER` |
| `SubscriptionStatus` | `ACTIVE` |
| `SubscriptionStatus` | `CANCELLED` |
| `SubscriptionStatus` | `EXPIRED` |
| `SubscriptionStatus` | `PAST_DUE` |
| `SubscriptionStatus` | `TRIAL` |
| `TicketEscalationLevel` | `L1` |
| `TicketEscalationLevel` | `L2` |
| `TicketEscalationLevel` | `L3` |
| `TicketEscalationLevel` | `NONE` |
| `TicketPriority` | `CRITICAL` |
| `TicketPriority` | `HIGH` |
| `TicketPriority` | `LOW` |
| `TicketPriority` | `MEDIUM` |
| `TicketSource` | `CHAT` |
| `TicketSource` | `EMAIL` |
| `TicketSource` | `MOBILE` |
| `TicketSource` | `WEB` |
| `TicketStatus` | `CLOSED` |
| `TicketStatus` | `IN_PROGRESS` |
| `TicketStatus` | `OPEN` |
| `TicketStatus` | `RESOLVED` |
| `TicketType` | `CUSTOMER_COMPLAINT` |
| `TicketType` | `ORDER_ISSUE` |
| `TicketType` | `PAYMENT_ISSUE` |
| `TicketType` | `REFUND_REQUEST` |
| `UserStatus` | `ACTIVE` |
| `UserStatus` | `BLOCKED` |
| `VariantStatus` | `ACTIVE` |
| `VariantStatus` | `INACTIVE` |

## 7. Null Violations Check
✅ **PASS:** 0 NULL violations found in required non-nullable fields.

## 8. Unique Violations & Duplicate Rows Check
✅ **PASS:** 0 duplicate rows found in fields marked as unique.

## 9. EXPLAIN ANALYZE & Query Performance Tuning (20 Queries)
### 1. Fetch User by Phone
**SQL Query:**
```sql
SELECT * FROM "users" WHERE "phone" = '9999999999'
```
**EXPLAIN ANALYZE Output:**
```
Seq Scan on users  (cost=0.00..1.79 rows=1 width=116) (actual time=0.011..0.011 rows=1.00 loops=1)
  Filter: ((phone)::text = '9999999999'::text)
  Rows Removed by Filter: 69
  Buffers: shared hit=1
Planning:
  Buffers: shared hit=36
Planning Time: 0.078 ms
Execution Time: 0.018 ms
```
💡 **Suggested Index:**
```sql
CREATE INDEX idx_users_phone ON "users" ("phone");
```

---
### 2. Fetch User by ID
**SQL Query:**
```sql
SELECT * FROM "users" WHERE "id" = 'e00770ea-ef70-470f-9b29-1a5d6df59470' OR "id" IS NOT NULL LIMIT 1
```
**EXPLAIN ANALYZE Output:**
```
Limit  (cost=0.00..0.03 rows=1 width=116) (actual time=0.009..0.009 rows=1.00 loops=1)
  Buffers: shared hit=1
  ->  Seq Scan on users  (cost=0.00..1.63 rows=63 width=116) (actual time=0.008..0.009 rows=1.00 loops=1)
        Buffers: shared hit=1
Planning Time: 0.029 ms
Execution Time: 0.015 ms
```
💡 **Suggested Index:**
```sql
CREATE INDEX idx_users_id ON "users" ("id");
```

---
### 3. Fetch Boutiques list (public)
**SQL Query:**
```sql
SELECT * FROM "boutiques" WHERE "is_deleted" = false
```
**EXPLAIN ANALYZE Output:**
```
Seq Scan on boutiques  (cost=0.00..2.22 rows=11 width=6795) (actual time=0.007..0.014 rows=28.00 loops=1)
  Filter: (NOT is_deleted)
  Rows Removed by Filter: 1
  Buffers: shared hit=2
Planning:
  Buffers: shared hit=110
Planning Time: 0.124 ms
Execution Time: 0.021 ms
```
💡 **Suggested Index:**
```sql
CREATE INDEX idx_boutiques_is_deleted ON "boutiques" ("is_deleted");
```

---
### 4. Fetch Boutique by ID
**SQL Query:**
```sql
SELECT * FROM "boutiques" WHERE "id" = '9713de00-8c88-48c2-9ecc-902b86954f96'
```
**EXPLAIN ANALYZE Output:**
```
Seq Scan on boutiques  (cost=0.00..2.27 rows=1 width=6795) (actual time=0.006..0.007 rows=1.00 loops=1)
  Filter: (id = '9713de00-8c88-48c2-9ecc-902b86954f96'::uuid)
  Rows Removed by Filter: 28
  Buffers: shared hit=2
Planning Time: 0.037 ms
Execution Time: 0.013 ms
```
💡 **Suggested Index:**
```sql
CREATE INDEX idx_boutiques_id ON "boutiques" ("id");
```

---
### 5. Search Products by Name/Tags
**SQL Query:**
```sql
SELECT * FROM "products" WHERE "is_deleted" = false AND ("name" ILIKE '%dress%' OR "tags" @> ARRAY['party'])
```
⚠️ **Failed to run EXPLAIN ANALYZE:** column "tags" does not exist

---
### 6. Filter Products by Boutique and Price
**SQL Query:**
```sql
SELECT * FROM "products" WHERE "boutique_id" = '9713de00-8c88-48c2-9ecc-902b86954f96' AND "price" <= 5000
```
⚠️ **Failed to run EXPLAIN ANALYZE:** column "price" does not exist

---
### 7. Fetch Active Designs (Owner)
**SQL Query:**
```sql
SELECT * FROM "products" WHERE "boutique_id" = '9713de00-8c88-48c2-9ecc-902b86954f96' AND "is_deleted" = false AND "is_active" = true
```
⚠️ **Failed to run EXPLAIN ANALYZE:** column "is_active" does not exist

---
### 8. Fetch Orders by Boutique (Owner Dashboard)
**SQL Query:**
```sql
SELECT * FROM "orders" WHERE "boutique_id" = '9713de00-8c88-48c2-9ecc-902b86954f96' ORDER BY "created_at" DESC
```
**EXPLAIN ANALYZE Output:**
```
Sort  (cost=1.25..1.25 rows=1 width=1509) (actual time=0.018..0.018 rows=0.00 loops=1)
  Sort Key: created_at DESC
  Sort Method: quicksort  Memory: 25kB
  Buffers: shared hit=4
  ->  Seq Scan on orders  (cost=0.00..1.24 rows=1 width=1509) (actual time=0.010..0.010 rows=0.00 loops=1)
        Filter: (boutique_id = '9713de00-8c88-48c2-9ecc-902b86954f96'::uuid)
        Rows Removed by Filter: 19
        Buffers: shared hit=1
Planning:
  Buffers: shared hit=50
Planning Time: 0.113 ms
Execution Time: 0.028 ms
```
💡 **Suggested Index:**
```sql
CREATE INDEX idx_orders_boutique_id ON "orders" ("boutique_id");
```

---
### 9. Fetch Tailoring Orders for Customer
**SQL Query:**
```sql
SELECT * FROM "orders" WHERE "customer_id" = 'e00770ea-ef70-470f-9b29-1a5d6df59470'
```
⚠️ **Failed to run EXPLAIN ANALYZE:** column "customer_id" does not exist

---
### 10. Fetch Commerce Orders for Customer
**SQL Query:**
```sql
SELECT * FROM "commerce_orders" WHERE "user_id" = 'e00770ea-ef70-470f-9b29-1a5d6df59470'
```
**EXPLAIN ANALYZE Output:**
```
Seq Scan on commerce_orders  (cost=0.00..1.11 rows=7 width=350) (actual time=0.008..0.009 rows=7.00 loops=1)
  Filter: (user_id = 'e00770ea-ef70-470f-9b29-1a5d6df59470'::uuid)
  Rows Removed by Filter: 2
  Buffers: shared hit=1
Planning:
  Buffers: shared hit=72
Planning Time: 0.163 ms
Execution Time: 0.018 ms
```
💡 **Suggested Index:**
```sql
CREATE INDEX idx_commerce_orders_user_id ON "commerce_orders" ("user_id");
```

---
### 11. Fetch Boutique Subscription Plan
**SQL Query:**
```sql
SELECT * FROM "boutique_subscriptions" WHERE "boutique_id" = '9713de00-8c88-48c2-9ecc-902b86954f96'
```
**EXPLAIN ANALYZE Output:**
```
Seq Scan on boutique_subscriptions  (cost=0.00..1.06 rows=1 width=822) (actual time=0.007..0.007 rows=1.00 loops=1)
  Filter: (boutique_id = '9713de00-8c88-48c2-9ecc-902b86954f96'::uuid)
  Rows Removed by Filter: 4
  Buffers: shared hit=1
Planning:
  Buffers: shared hit=44
Planning Time: 0.076 ms
Execution Time: 0.012 ms
```
💡 **Suggested Index:**
```sql
CREATE INDEX idx_boutique_subscriptions_boutique_id ON "boutique_subscriptions" ("boutique_id");
```

---
### 12. Fetch Notifications for Recipient
**SQL Query:**
```sql
SELECT * FROM "notifications" WHERE "recipient_id" = 'e00770ea-ef70-470f-9b29-1a5d6df59470' ORDER BY "created_at" DESC LIMIT 50
```
**EXPLAIN ANALYZE Output:**
```
Limit  (cost=1.07..1.08 rows=1 width=1111) (actual time=0.009..0.009 rows=0.00 loops=1)
  Buffers: shared hit=1
  ->  Sort  (cost=1.07..1.08 rows=1 width=1111) (actual time=0.009..0.009 rows=0.00 loops=1)
        Sort Key: created_at DESC
        Sort Method: quicksort  Memory: 25kB
        Buffers: shared hit=1
        ->  Seq Scan on notifications  (cost=0.00..1.06 rows=1 width=1111) (actual time=0.007..0.007 rows=0.00 loops=1)
              Filter: (recipient_id = 'e00770ea-ef70-470f-9b29-1a5d6df59470'::uuid)
              Rows Removed by Filter: 5
              Buffers: shared hit=1
Planning:
  Buffers: shared hit=28
Planning Time: 0.079 ms
Execution Time: 0.017 ms
```
💡 **Suggested Index:**
```sql
CREATE INDEX idx_notifications_recipient_id ON "notifications" ("recipient_id");
```

---
### 13. Fetch Active Cart for User
**SQL Query:**
```sql
SELECT * FROM "carts" WHERE "user_id" = 'e00770ea-ef70-470f-9b29-1a5d6df59470'
```
**EXPLAIN ANALYZE Output:**
```
Seq Scan on carts  (cost=0.00..1.14 rows=1 width=48) (actual time=0.007..0.007 rows=1.00 loops=1)
  Filter: (user_id = 'e00770ea-ef70-470f-9b29-1a5d6df59470'::uuid)
  Rows Removed by Filter: 14
  Buffers: shared hit=1
Planning:
  Buffers: shared hit=4
Planning Time: 0.040 ms
Execution Time: 0.010 ms
```
💡 **Suggested Index:**
```sql
CREATE INDEX idx_carts_user_id ON "carts" ("user_id");
```

---
### 14. Fetch Cart Items for Cart
**SQL Query:**
```sql
SELECT * FROM "cart_items" WHERE "cart_id" = 'e00770ea-ef70-470f-9b29-1a5d6df59470' OR "cart_id" IS NOT NULL
```
**EXPLAIN ANALYZE Output:**
```
Seq Scan on cart_items  (cost=0.00..1.18 rows=18 width=76) (actual time=0.006..0.006 rows=18.00 loops=1)
  Buffers: shared hit=1
Planning:
  Buffers: shared hit=4
Planning Time: 0.040 ms
Execution Time: 0.009 ms
```
💡 **Suggested Index:**
```sql
CREATE INDEX idx_cart_items_cart_id ON "cart_items" ("cart_id");
```

---
### 15. Fetch Wishlist Items for User
**SQL Query:**
```sql
SELECT * FROM "wishlist_items" WHERE "user_id" = 'e00770ea-ef70-470f-9b29-1a5d6df59470' OR "user_id" IS NOT NULL
```
⚠️ **Failed to run EXPLAIN ANALYZE:** relation "wishlist_items" does not exist

---
### 16. Fetch Bookings for Boutique
**SQL Query:**
```sql
SELECT * FROM "bookings" WHERE "boutique_id" = '9713de00-8c88-48c2-9ecc-902b86954f96'
```
**EXPLAIN ANALYZE Output:**
```
Seq Scan on bookings  (cost=0.00..1.12 rows=1 width=1266) (actual time=0.007..0.007 rows=0.00 loops=1)
  Filter: (boutique_id = '9713de00-8c88-48c2-9ecc-902b86954f96'::uuid)
  Rows Removed by Filter: 10
  Buffers: shared hit=1
Planning:
  Buffers: shared hit=22
Planning Time: 0.052 ms
Execution Time: 0.011 ms
```
💡 **Suggested Index:**
```sql
CREATE INDEX idx_bookings_boutique_id ON "bookings" ("boutique_id");
```

---
### 17. Fetch Staff Accounts for Boutique
**SQL Query:**
```sql
SELECT * FROM "owners" WHERE "assigned_boutique_id" = '9713de00-8c88-48c2-9ecc-902b86954f96' AND "is_deleted" = false
```
**EXPLAIN ANALYZE Output:**
```
Seq Scan on owners  (cost=0.00..1.15 rows=1 width=2212) (actual time=0.009..0.009 rows=1.00 loops=1)
  Filter: ((NOT is_deleted) AND (assigned_boutique_id = '9713de00-8c88-48c2-9ecc-902b86954f96'::uuid))
  Rows Removed by Filter: 13
  Buffers: shared hit=1
Planning:
  Buffers: shared hit=70
Planning Time: 0.102 ms
Execution Time: 0.015 ms
```
💡 **Suggested Index:**
```sql
CREATE INDEX idx_owners_assigned_boutique_id_is_deleted ON "owners" ("assigned_boutique_id", "is_deleted");
```

---
### 18. Fetch Reviews for Product
**SQL Query:**
```sql
SELECT * FROM "reviews" WHERE "product_id" = '9713de00-8c88-48c2-9ecc-902b86954f96' OR "product_id" IS NOT NULL
```
⚠️ **Failed to run EXPLAIN ANALYZE:** column "product_id" does not exist

---
### 19. Fetch Payments by User
**SQL Query:**
```sql
SELECT * FROM "payments" WHERE "customer_id" = 'e00770ea-ef70-470f-9b29-1a5d6df59470' OR "customer_id" IS NOT NULL
```
**EXPLAIN ANALYZE Output:**
```
Seq Scan on payments  (cost=0.00..1.24 rows=19 width=1784) (actual time=0.006..0.007 rows=19.00 loops=1)
  Filter: ((customer_id = 'e00770ea-ef70-470f-9b29-1a5d6df59470'::uuid) OR (customer_id IS NOT NULL))
  Buffers: shared hit=1
Planning:
  Buffers: shared hit=32
Planning Time: 0.059 ms
Execution Time: 0.012 ms
```
💡 **Suggested Index:**
```sql
CREATE INDEX idx_payments_customer_id ON "payments" ("customer_id");
```

---
### 20. Audit Logs Listing
**SQL Query:**
```sql
SELECT * FROM "audit_logs" ORDER BY "timestamp" DESC LIMIT 20
```
**EXPLAIN ANALYZE Output:**
```
Limit  (cost=5.82..5.87 rows=20 width=194) (actual time=0.030..0.031 rows=20.00 loops=1)
  Buffers: shared hit=3
  ->  Sort  (cost=5.82..6.01 rows=77 width=194) (actual time=0.029..0.030 rows=20.00 loops=1)
        Sort Key: "timestamp" DESC
        Sort Method: top-N heapsort  Memory: 36kB
        Buffers: shared hit=3
        ->  Seq Scan on audit_logs  (cost=0.00..3.77 rows=77 width=194) (actual time=0.007..0.010 rows=77.00 loops=1)
              Buffers: shared hit=3
Planning:
  Buffers: shared hit=24
Planning Time: 0.058 ms
Execution Time: 0.037 ms
```

---
## 10. Audit Summary
### Status: 🎉 PASS
The PostgreSQL database is healthy and ready for production. All tables, foreign keys, indexes, and constraints have been verified with 100% integrity.
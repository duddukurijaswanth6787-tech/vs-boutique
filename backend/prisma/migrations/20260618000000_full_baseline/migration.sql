-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateEnum
CREATE TYPE "OwnerRole" AS ENUM ('owner', 'super-admin');

-- CreateEnum
CREATE TYPE "OwnerStatus" AS ENUM ('Pending', 'Active', 'Blocked');

-- CreateEnum
CREATE TYPE "BoutiqueStatus" AS ENUM ('Active', 'Inactive');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('Pending', 'Verified', 'Rejected');

-- CreateEnum
CREATE TYPE "SubscriptionPlanType" AS ENUM ('FREE', 'STARTER', 'PRO', 'ENTERPRISE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIAL', 'CANCELLED', 'EXPIRED', 'PAST_DUE');

-- CreateEnum
CREATE TYPE "DesignCategory" AS ENUM ('Blouse', 'Lehenga', 'Saree', 'Other');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'accepted', 'in_progress', 'ready', 'delivered', 'cancelled');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'captured', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "PayoutStatusType" AS ENUM ('pending', 'scheduled', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('order', 'user', 'success');

-- CreateEnum
CREATE TYPE "RecipientRole" AS ENUM ('super-admin', 'owner');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ORDER_NEW', 'ORDER_STATUS', 'SYSTEM', 'BROADCAST');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ReviewModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FLAGGED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('Pending', 'Accepted', 'Rejected', 'Rescheduled', 'Completed');

-- CreateEnum
CREATE TYPE "BookingType" AS ENUM ('HOME_MEASUREMENT', 'STORE_VISIT', 'VIDEO_CONSULTATION', 'DESIGN_DISCUSSION', 'TRIAL_FITTING', 'FINAL_DELIVERY');

-- CreateEnum
CREATE TYPE "TicketType" AS ENUM ('REFUND_REQUEST', 'ORDER_ISSUE', 'PAYMENT_ISSUE', 'CUSTOMER_COMPLAINT');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "TicketEscalationLevel" AS ENUM ('NONE', 'L1', 'L2', 'L3');

-- CreateEnum
CREATE TYPE "TicketSource" AS ENUM ('MOBILE', 'WEB', 'EMAIL', 'CHAT');

-- CreateEnum
CREATE TYPE "PayoutState" AS ENUM ('PENDING', 'APPROVED', 'RELEASED', 'FAILED');

-- CreateEnum
CREATE TYPE "CustomerSegment" AS ENUM ('NEW', 'ACTIVE', 'VIP', 'INACTIVE', 'BLOCKED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "phone" VARCHAR(20) NOT NULL,
    "name" VARCHAR(255) DEFAULT 'New User',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "segment" "CustomerSegment" NOT NULL DEFAULT 'NEW',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boutiques" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "owner_name" VARCHAR(255) NOT NULL,
    "description" TEXT DEFAULT '',
    "experience_years" INTEGER NOT NULL DEFAULT 0,
    "status" "BoutiqueStatus" NOT NULL DEFAULT 'Active',
    "featured_boutique" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "owner_id" UUID,
    "happy_clients" INTEGER NOT NULL DEFAULT 0,
    "total_designs" INTEGER NOT NULL DEFAULT 0,
    "mobile_number" VARCHAR(20) NOT NULL,
    "whatsapp_number" VARCHAR(20) DEFAULT '',
    "email" VARCHAR(255) NOT NULL,
    "full_address" TEXT NOT NULL,
    "area" VARCHAR(100) DEFAULT '',
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "pincode" VARCHAR(20) DEFAULT '',
    "google_maps_link" VARCHAR(512) DEFAULT '',
    "service_radius" VARCHAR(100) DEFAULT '',
    "open_days" VARCHAR(255) DEFAULT '',
    "opening_time" VARCHAR(20) DEFAULT '',
    "closing_time" VARCHAR(20) DEFAULT '',
    "weekly_holiday" VARCHAR(50) DEFAULT '',
    "services_offered" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "work_type_specialty" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pickup_available" BOOLEAN NOT NULL DEFAULT false,
    "delivery_available" BOOLEAN NOT NULL DEFAULT false,
    "home_visit_available" BOOLEAN NOT NULL DEFAULT false,
    "appointment_booking_available" BOOLEAN NOT NULL DEFAULT false,
    "rush_order_available" BOOLEAN NOT NULL DEFAULT false,
    "starting_price" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "turnaround_time" VARCHAR(100) DEFAULT '',
    "logo_url" VARCHAR(512) DEFAULT '',
    "cover_image_url" VARCHAR(512) DEFAULT '',
    "gallery_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "instagram_handle" VARCHAR(100) DEFAULT '',
    "facebook_page" VARCHAR(255) DEFAULT '',
    "website_link" VARCHAR(512) DEFAULT '',
    "verification_documents" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "payout_details" TEXT DEFAULT '',
    "payout_status" "PayoutStatus" NOT NULL DEFAULT 'Pending',
    "internal_notes" TEXT DEFAULT '',
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "rating" DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    "reviews_count" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "commission_rate" DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    "response_time_avg" INTEGER NOT NULL DEFAULT 0,
    "wallet_balance" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "pending_payout" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "total_paid_out" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "is_frozen" BOOLEAN NOT NULL DEFAULT false,
    "is_suspended" BOOLEAN NOT NULL DEFAULT false,
    "subscription_enforcement" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "boutiques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owners" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "owner_name" VARCHAR(255) NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "mobile_number" VARCHAR(20) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" "OwnerRole" NOT NULL DEFAULT 'owner',
    "status" "OwnerStatus" NOT NULL DEFAULT 'Pending',
    "assigned_boutique_id" UUID,
    "invite_token_hash" VARCHAR(64),
    "invite_expires_at" TIMESTAMP(3),
    "reset_password_token" VARCHAR(64),
    "reset_password_expire" TIMESTAMP(3),
    "must_reset_password" BOOLEAN NOT NULL DEFAULT true,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "last_login" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "login_enabled" BOOLEAN NOT NULL DEFAULT true,
    "read_only_mode" BOOLEAN NOT NULL DEFAULT false,
    "can_edit_profile" BOOLEAN NOT NULL DEFAULT true,
    "can_edit_services" BOOLEAN NOT NULL DEFAULT true,
    "can_edit_gallery" BOOLEAN NOT NULL DEFAULT true,
    "can_manage_designs" BOOLEAN NOT NULL DEFAULT true,
    "can_manage_orders" BOOLEAN NOT NULL DEFAULT true,
    "can_manage_bookings" BOOLEAN NOT NULL DEFAULT true,
    "can_manage_reviews" BOOLEAN NOT NULL DEFAULT true,
    "can_manage_media" BOOLEAN NOT NULL DEFAULT true,
    "can_view_analytics" BOOLEAN NOT NULL DEFAULT true,
    "can_manage_customers" BOOLEAN NOT NULL DEFAULT true,
    "can_manage_measurements" BOOLEAN NOT NULL DEFAULT true,
    "can_manage_inventory" BOOLEAN NOT NULL DEFAULT true,
    "can_manage_expenses" BOOLEAN NOT NULL DEFAULT true,
    "can_manage_production" BOOLEAN NOT NULL DEFAULT true,
    "can_manage_delivery" BOOLEAN NOT NULL DEFAULT true,
    "can_manage_marketing" BOOLEAN NOT NULL DEFAULT true,
    "can_manage_roles" BOOLEAN NOT NULL DEFAULT true,
    "can_manage_branches" BOOLEAN NOT NULL DEFAULT true,
    "can_export_reports" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "owners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "designs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "boutique_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" "DesignCategory" NOT NULL,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "price" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "is_ready_made" BOOLEAN NOT NULL DEFAULT false,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "designs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "order_id" VARCHAR(50) NOT NULL,
    "boutique_id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "customer_name" VARCHAR(255) NOT NULL,
    "customer_phone" VARCHAR(20) NOT NULL,
    "customer_address" TEXT,
    "design_id" UUID,
    "design_name" VARCHAR(255),
    "category" "DesignCategory" NOT NULL DEFAULT 'Blouse',
    "measurement_bust" DECIMAL(5,2),
    "measurement_waist" DECIMAL(5,2),
    "measurement_hip" DECIMAL(5,2),
    "measurement_shoulder" DECIMAL(5,2),
    "measurement_sleeve_length" DECIMAL(5,2),
    "measurement_blouse_length" DECIMAL(5,2),
    "measurement_notes" TEXT,
    "price" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "advance_paid" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "remaining_amount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "order_status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "order_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expected_delivery_date" TIMESTAMP(3),
    "actual_delivery_date" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_histories" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "order_id" UUID NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "note" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "boutique_id" UUID NOT NULL,
    "booking_type" "BookingType" NOT NULL DEFAULT 'STORE_VISIT',
    "customer_name" VARCHAR(255) NOT NULL,
    "customer_email" VARCHAR(255),
    "customer_mobile" VARCHAR(20) NOT NULL,
    "booking_date" DATE NOT NULL,
    "booking_time" VARCHAR(20) NOT NULL,
    "notes" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'Pending',
    "assigned_owner_id" UUID,
    "reminder_sent" BOOLEAN NOT NULL DEFAULT false,
    "order_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "measurements" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "chest" DECIMAL(5,2),
    "waist" DECIMAL(5,2),
    "length" DECIMAL(5,2),
    "shoulder" DECIMAL(5,2),
    "sleeve_length" DECIMAL(5,2),
    "neck" DECIMAL(5,2),
    "notes" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "measurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "recipient_role" "RecipientRole" NOT NULL,
    "recipient_id" UUID,
    "recipient_user_id" UUID,
    "boutique_id" UUID,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'SYSTEM',
    "status" VARCHAR(50) NOT NULL DEFAULT 'sent',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "scheduled_at" TIMESTAMP(3),
    "is_broadcast" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL,
    "target_type" VARCHAR(50),
    "target_value" VARCHAR(100),
    "sent_push" BOOLEAN NOT NULL DEFAULT false,
    "sent_email" BOOLEAN NOT NULL DEFAULT false,
    "sent_sms" BOOLEAN NOT NULL DEFAULT false,
    "campaign_id" UUID,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "order_id" UUID NOT NULL,
    "boutique_id" UUID NOT NULL,
    "customer_id" UUID,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(10) DEFAULT 'INR',
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "method" VARCHAR(50),
    "commission_amount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "net_amount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "payout_status" "PayoutStatusType" NOT NULL DEFAULT 'pending',
    "payout_id" UUID,
    "refund_id" VARCHAR(100),
    "refund_reason" TEXT,
    "razorpay_order_id" VARCHAR(100),
    "razorpay_payment_id" VARCHAR(100),
    "razorpay_signature" VARCHAR(255),
    "receipt" VARCHAR(100),
    "description" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "type" "ActivityType" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "price" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "action_type" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_id" VARCHAR(50) NOT NULL,
    "performed_by" UUID NOT NULL,
    "changes_before" JSONB,
    "changes_after" JSONB,
    "metadata" JSONB,
    "ip_address" VARCHAR(45),
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_addresses" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "address_line1" VARCHAR(255) NOT NULL,
    "address_line2" VARCHAR(255),
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "pincode" VARCHAR(20) NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "boutique_id" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "PayoutState" NOT NULL DEFAULT 'PENDING',
    "payout_id" VARCHAR(100),
    "reference_code" VARCHAR(100),
    "payout_date" TIMESTAMP(3),
    "error_msg" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "boutique_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "order_id" UUID,
    "rating" INTEGER NOT NULL,
    "rating_stitching" INTEGER,
    "rating_measurement" INTEGER,
    "rating_delivery" INTEGER,
    "rating_communication" INTEGER,
    "rating_value" INTEGER,
    "comment" TEXT,
    "reply" TEXT,
    "verified_purchase" BOOLEAN NOT NULL DEFAULT false,
    "review_images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "report_count" INTEGER NOT NULL DEFAULT 0,
    "moderation_status" "ReviewModerationStatus" NOT NULL DEFAULT 'PENDING',
    "is_suspicious" BOOLEAN NOT NULL DEFAULT false,
    "suspicious_reason" TEXT,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlists" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "design_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_histories" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "booking_id" UUID NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "note" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "boutique_id" UUID,
    "order_id" UUID,
    "ticket_type" "TicketType" NOT NULL,
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "escalation_level" "TicketEscalationLevel" NOT NULL DEFAULT 'NONE',
    "source" "TicketSource" NOT NULL DEFAULT 'WEB',
    "subject" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "assigned_admin_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "first_response_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "escalated_at" TIMESTAMP(3),
    "sla_breached" BOOLEAN NOT NULL DEFAULT false,
    "fraud_score" INTEGER NOT NULL DEFAULT 0,
    "risk_level" TEXT NOT NULL DEFAULT 'LOW',
    "excessive_ticket_flag" BOOLEAN NOT NULL DEFAULT false,
    "attachment_url" VARCHAR(512),
    "attachment_type" VARCHAR(50),

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_ticket_messages" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "ticket_id" UUID NOT NULL,
    "sender_type" VARCHAR(50) NOT NULL,
    "sender_id" UUID NOT NULL,
    "sender_name" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "attachment_url" VARCHAR(512),
    "attachment_type" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_ticket_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_ticket_admin_notes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "ticket_id" UUID NOT NULL,
    "admin_id" UUID NOT NULL,
    "note" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_ticket_admin_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(100) NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "body" TEXT NOT NULL,
    "channels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_campaigns" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "target_type" VARCHAR(50) NOT NULL,
    "target_value" VARCHAR(100),
    "channels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "scheduled_at" TIMESTAMP(3),
    "status" VARCHAR(50) NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_settings" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "global_commission_rate" DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    "category_commissions" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(100) NOT NULL,
    "plan_code" VARCHAR(100) NOT NULL,
    "description" TEXT DEFAULT '',
    "monthly_price" DECIMAL(12,2) NOT NULL,
    "yearly_price" DECIMAL(12,2) NOT NULL,
    "trial_period_days" INTEGER NOT NULL DEFAULT 14,
    "grace_period_days" INTEGER NOT NULL DEFAULT 3,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "recommended_plan" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "allow_direct_selling" BOOLEAN NOT NULL DEFAULT true,
    "allow_custom_tailoring" BOOLEAN NOT NULL DEFAULT false,
    "max_ready_made_products" INTEGER NOT NULL DEFAULT -1,
    "max_custom_designs" INTEGER NOT NULL DEFAULT 50,
    "max_orders_per_month" INTEGER NOT NULL DEFAULT 100,
    "max_bookings_per_month" INTEGER NOT NULL DEFAULT 50,
    "max_customers" INTEGER NOT NULL DEFAULT -1,
    "max_measurements" INTEGER NOT NULL DEFAULT -1,
    "max_gallery_images" INTEGER NOT NULL DEFAULT 20,
    "max_staff_accounts" INTEGER NOT NULL DEFAULT 5,
    "max_branches" INTEGER NOT NULL DEFAULT 1,
    "can_manage_products" BOOLEAN NOT NULL DEFAULT false,
    "can_manage_stock" BOOLEAN NOT NULL DEFAULT false,
    "can_manage_shipping" BOOLEAN NOT NULL DEFAULT false,
    "can_manage_returns" BOOLEAN NOT NULL DEFAULT false,
    "can_manage_coupons" BOOLEAN NOT NULL DEFAULT false,
    "can_manage_offers" BOOLEAN NOT NULL DEFAULT false,
    "can_manage_product_variants" BOOLEAN NOT NULL DEFAULT false,
    "can_manage_reviews" BOOLEAN NOT NULL DEFAULT true,
    "can_use_custom_measurements" BOOLEAN NOT NULL DEFAULT true,
    "can_use_measurement_history" BOOLEAN NOT NULL DEFAULT false,
    "can_create_custom_orders" BOOLEAN NOT NULL DEFAULT true,
    "can_manage_tailoring_orders" BOOLEAN NOT NULL DEFAULT true,
    "can_manage_production_workflow" BOOLEAN NOT NULL DEFAULT false,
    "can_manage_tailor_assignments" BOOLEAN NOT NULL DEFAULT false,
    "can_manage_customers" BOOLEAN NOT NULL DEFAULT true,
    "can_manage_customer_notes" BOOLEAN NOT NULL DEFAULT true,
    "can_manage_rewards" BOOLEAN NOT NULL DEFAULT false,
    "can_manage_referrals" BOOLEAN NOT NULL DEFAULT false,
    "can_manage_wallet" BOOLEAN NOT NULL DEFAULT false,
    "can_manage_staff" BOOLEAN NOT NULL DEFAULT true,
    "can_manage_attendance" BOOLEAN NOT NULL DEFAULT false,
    "can_manage_tasks" BOOLEAN NOT NULL DEFAULT false,
    "can_manage_payroll" BOOLEAN NOT NULL DEFAULT false,
    "can_use_whatsapp_marketing" BOOLEAN NOT NULL DEFAULT false,
    "can_use_sms_marketing" BOOLEAN NOT NULL DEFAULT false,
    "can_use_email_marketing" BOOLEAN NOT NULL DEFAULT false,
    "can_create_campaigns" BOOLEAN NOT NULL DEFAULT false,
    "can_view_analytics" BOOLEAN NOT NULL DEFAULT false,
    "can_view_advanced_analytics" BOOLEAN NOT NULL DEFAULT false,
    "can_view_financial_reports" BOOLEAN NOT NULL DEFAULT false,
    "can_list_in_marketplace" BOOLEAN NOT NULL DEFAULT true,
    "can_feature_products" BOOLEAN NOT NULL DEFAULT false,
    "can_feature_boutique" BOOLEAN NOT NULL DEFAULT false,
    "can_sell_premium_designs" BOOLEAN NOT NULL DEFAULT false,
    "can_use_ai_assistant" BOOLEAN NOT NULL DEFAULT false,
    "can_use_ai_recommendations" BOOLEAN NOT NULL DEFAULT false,
    "can_use_ai_design_suggestions" BOOLEAN NOT NULL DEFAULT false,
    "can_use_api_access" BOOLEAN NOT NULL DEFAULT false,
    "can_use_custom_branding" BOOLEAN NOT NULL DEFAULT false,
    "can_use_white_label" BOOLEAN NOT NULL DEFAULT false,
    "can_use_multi_branch" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boutique_subscriptions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "boutique_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "trial_ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "current_ready_made_products_count" INTEGER NOT NULL DEFAULT 0,
    "current_custom_designs_count" INTEGER NOT NULL DEFAULT 0,
    "current_order_count" INTEGER NOT NULL DEFAULT 0,
    "current_booking_count" INTEGER NOT NULL DEFAULT 0,
    "current_customer_count" INTEGER NOT NULL DEFAULT 0,
    "current_measurements_count" INTEGER NOT NULL DEFAULT 0,
    "current_gallery_images" INTEGER NOT NULL DEFAULT 0,
    "current_staff_accounts" INTEGER NOT NULL DEFAULT 0,
    "current_branch_count" INTEGER NOT NULL DEFAULT 0,
    "trial_started_at" TIMESTAMP(3),
    "trial_ended_at" TIMESTAMP(3),
    "converted_at" TIMESTAMP(3),
    "gateway_customer_id" VARCHAR(100),
    "gateway_subscription_id" VARCHAR(100),
    "gateway_payment_id" VARCHAR(100),
    "pending_plan_id" UUID,

    CONSTRAINT "boutique_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_billing_history" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "subscription_id" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "payment_status" VARCHAR(50) NOT NULL,
    "payment_method" VARCHAR(50),
    "invoice_url" VARCHAR(512),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_billing_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "image" VARCHAR(512),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_categories" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "category_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "image" VARCHAR(512),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sub_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_receipts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "notification_id" UUID NOT NULL,
    "recipient_owner_id" UUID,
    "recipient_user_id" UUID,
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "opened_at" TIMESTAMP(3),
    "clicked_at" TIMESTAMP(3),

    CONSTRAINT "notification_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owner_feature_permissions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "owner_id" UUID NOT NULL,
    "can_manage_orders" BOOLEAN NOT NULL DEFAULT true,
    "can_manage_bookings" BOOLEAN NOT NULL DEFAULT true,
    "can_manage_reviews" BOOLEAN NOT NULL DEFAULT true,
    "can_manage_payments" BOOLEAN NOT NULL DEFAULT true,
    "can_manage_payouts" BOOLEAN NOT NULL DEFAULT true,
    "can_manage_gallery" BOOLEAN NOT NULL DEFAULT true,
    "can_manage_designs" BOOLEAN NOT NULL DEFAULT true,
    "can_manage_analytics" BOOLEAN NOT NULL DEFAULT true,
    "can_manage_notifications" BOOLEAN NOT NULL DEFAULT true,
    "can_manage_staff" BOOLEAN NOT NULL DEFAULT true,
    "can_manage_customers" BOOLEAN NOT NULL DEFAULT true,
    "can_manage_measurements" BOOLEAN NOT NULL DEFAULT true,
    "can_manage_inventory" BOOLEAN NOT NULL DEFAULT true,
    "can_manage_expenses" BOOLEAN NOT NULL DEFAULT true,
    "can_manage_production" BOOLEAN NOT NULL DEFAULT true,
    "can_manage_delivery" BOOLEAN NOT NULL DEFAULT true,
    "can_manage_marketing" BOOLEAN NOT NULL DEFAULT true,
    "can_manage_roles" BOOLEAN NOT NULL DEFAULT true,
    "can_manage_branches" BOOLEAN NOT NULL DEFAULT true,
    "can_export_reports" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "owner_feature_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_plan_requests" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "boutique_id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "requested_designs" INTEGER NOT NULL,
    "requested_orders" INTEGER NOT NULL,
    "requested_gallery" INTEGER NOT NULL,
    "requested_staff" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_plan_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "boutiques_is_deleted_status_featured_boutique_created_at_idx" ON "boutiques"("is_deleted", "status", "featured_boutique", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "owners_username_key" ON "owners"("username");

-- CreateIndex
CREATE UNIQUE INDEX "owners_email_key" ON "owners"("email");

-- CreateIndex
CREATE INDEX "designs_boutique_id_is_deleted_idx" ON "designs"("boutique_id", "is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_id_key" ON "orders"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "measurements_user_id_key" ON "measurements"("user_id");

-- CreateIndex
CREATE INDEX "reviews_boutique_id_moderation_status_created_at_idx" ON "reviews"("boutique_id", "moderation_status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_user_design" ON "wishlists"("user_id", "design_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_name_key" ON "notification_templates"("name");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_plan_code_key" ON "subscription_plans"("plan_code");

-- CreateIndex
CREATE INDEX "boutique_subscriptions_boutique_id_idx" ON "boutique_subscriptions"("boutique_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "sub_categories_category_id_name_key" ON "sub_categories"("category_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "owner_feature_permissions_owner_id_key" ON "owner_feature_permissions"("owner_id");

-- AddForeignKey
ALTER TABLE "boutiques" ADD CONSTRAINT "boutiques_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "owners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owners" ADD CONSTRAINT "owners_assigned_boutique_id_fkey" FOREIGN KEY ("assigned_boutique_id") REFERENCES "boutiques"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "designs" ADD CONSTRAINT "designs_boutique_id_fkey" FOREIGN KEY ("boutique_id") REFERENCES "boutiques"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_boutique_id_fkey" FOREIGN KEY ("boutique_id") REFERENCES "boutiques"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "owners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_design_id_fkey" FOREIGN KEY ("design_id") REFERENCES "designs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_histories" ADD CONSTRAINT "order_histories_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_boutique_id_fkey" FOREIGN KEY ("boutique_id") REFERENCES "boutiques"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_assigned_owner_id_fkey" FOREIGN KEY ("assigned_owner_id") REFERENCES "owners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "owners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_boutique_id_fkey" FOREIGN KEY ("boutique_id") REFERENCES "boutiques"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "notification_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_boutique_id_fkey" FOREIGN KEY ("boutique_id") REFERENCES "boutiques"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "payouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "owners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_boutique_id_fkey" FOREIGN KEY ("boutique_id") REFERENCES "boutiques"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_boutique_id_fkey" FOREIGN KEY ("boutique_id") REFERENCES "boutiques"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_design_id_fkey" FOREIGN KEY ("design_id") REFERENCES "designs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_histories" ADD CONSTRAINT "booking_histories_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_boutique_id_fkey" FOREIGN KEY ("boutique_id") REFERENCES "boutiques"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_admin_id_fkey" FOREIGN KEY ("assigned_admin_id") REFERENCES "owners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "support_ticket_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_ticket_admin_notes" ADD CONSTRAINT "support_ticket_admin_notes_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_ticket_admin_notes" ADD CONSTRAINT "support_ticket_admin_notes_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "owners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boutique_subscriptions" ADD CONSTRAINT "boutique_subscriptions_boutique_id_fkey" FOREIGN KEY ("boutique_id") REFERENCES "boutiques"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boutique_subscriptions" ADD CONSTRAINT "boutique_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_billing_history" ADD CONSTRAINT "subscription_billing_history_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "boutique_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_categories" ADD CONSTRAINT "sub_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_receipts" ADD CONSTRAINT "notification_receipts_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner_feature_permissions" ADD CONSTRAINT "owner_feature_permissions_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "owners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_plan_requests" ADD CONSTRAINT "custom_plan_requests_boutique_id_fkey" FOREIGN KEY ("boutique_id") REFERENCES "boutiques"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_plan_requests" ADD CONSTRAINT "custom_plan_requests_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "owners"("id") ON DELETE CASCADE ON UPDATE CASCADE;


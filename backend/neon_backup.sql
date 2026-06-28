--
-- PostgreSQL database dump
--

\restrict w4baiWuMPxymFAnycmd5vpWXO4lh03sAZFcWsqpRmFPpedVI7eyowrUn1Y9RToI

-- Dumped from database version 18.4 (eaf151e)
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: neondb_owner
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO neondb_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: neondb_owner
--

COMMENT ON SCHEMA public IS '';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: ActivityType; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."ActivityType" AS ENUM (
    'order',
    'user',
    'success'
);


ALTER TYPE public."ActivityType" OWNER TO neondb_owner;

--
-- Name: AdminNotificationType; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."AdminNotificationType" AS ENUM (
    'NEW_ORDER',
    'PAYMENT_RECEIVED',
    'PAYMENT_FAILED',
    'ORDER_CANCELLED',
    'ORDER_RETURN_REQUEST',
    'ORDER_RETURN_APPROVED',
    'ORDER_RETURN_REJECTED',
    'ORDER_EXCHANGE_REQUEST',
    'ORDER_EXCHANGE_APPROVED',
    'NEW_BOOKING',
    'BOOKING_CANCELLED',
    'NEW_MEASUREMENT',
    'NEW_REVIEW',
    'LOW_STOCK',
    'OUT_OF_STOCK',
    'PRODUCT_APPROVAL',
    'EMPLOYEE_ASSIGNED',
    'SUBSCRIPTION_EXPIRING',
    'SUBSCRIPTION_EXPIRED',
    'SYSTEM_ALERT'
);


ALTER TYPE public."AdminNotificationType" OWNER TO neondb_owner;

--
-- Name: BookingStatus; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."BookingStatus" AS ENUM (
    'Pending',
    'Accepted',
    'Rejected',
    'Rescheduled',
    'Completed'
);


ALTER TYPE public."BookingStatus" OWNER TO neondb_owner;

--
-- Name: BookingType; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."BookingType" AS ENUM (
    'HOME_MEASUREMENT',
    'STORE_VISIT',
    'VIDEO_CONSULTATION',
    'DESIGN_DISCUSSION',
    'TRIAL_FITTING',
    'FINAL_DELIVERY'
);


ALTER TYPE public."BookingType" OWNER TO neondb_owner;

--
-- Name: BoutiqueStatus; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."BoutiqueStatus" AS ENUM (
    'Active',
    'Inactive'
);


ALTER TYPE public."BoutiqueStatus" OWNER TO neondb_owner;

--
-- Name: CommerceOrderStatus; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."CommerceOrderStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'RETURNED',
    'PACKED',
    'OUT_FOR_DELIVERY',
    'REFUNDED'
);


ALTER TYPE public."CommerceOrderStatus" OWNER TO neondb_owner;

--
-- Name: CommercePaymentStatus; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."CommercePaymentStatus" AS ENUM (
    'PENDING',
    'PAID',
    'FAILED',
    'REFUNDED'
);


ALTER TYPE public."CommercePaymentStatus" OWNER TO neondb_owner;

--
-- Name: CustomerNotificationType; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."CustomerNotificationType" AS ENUM (
    'ORDER_PLACED',
    'PAYMENT_SUCCESS',
    'PAYMENT_FAILED',
    'ORDER_SHIPPED',
    'ORDER_DELIVERED',
    'RETURN_REQUESTED',
    'RETURN_APPROVED',
    'RETURN_REJECTED',
    'EXCHANGE_REQUESTED',
    'EXCHANGE_APPROVED',
    'EXCHANGE_SHIPPED',
    'REVIEW_REPLY',
    'BOOKING_CONFIRMED',
    'BOOKING_RESCHEDULED',
    'PROMOTION'
);


ALTER TYPE public."CustomerNotificationType" OWNER TO neondb_owner;

--
-- Name: CustomerSegment; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."CustomerSegment" AS ENUM (
    'NEW',
    'ACTIVE',
    'VIP',
    'INACTIVE',
    'BLOCKED'
);


ALTER TYPE public."CustomerSegment" OWNER TO neondb_owner;

--
-- Name: DeliveryType; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."DeliveryType" AS ENUM (
    'STANDARD',
    'EXPRESS',
    'PICKUP',
    'HOME_DELIVERY',
    'SHIP'
);


ALTER TYPE public."DeliveryType" OWNER TO neondb_owner;

--
-- Name: DesignCategory; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."DesignCategory" AS ENUM (
    'Blouse',
    'Lehenga',
    'Saree',
    'Other'
);


ALTER TYPE public."DesignCategory" OWNER TO neondb_owner;

--
-- Name: ExchangeStatus; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."ExchangeStatus" AS ENUM (
    'REQUESTED',
    'UNDER_REVIEW',
    'APPROVED',
    'REJECTED',
    'PROCESSING',
    'SHIPPED',
    'COMPLETED'
);


ALTER TYPE public."ExchangeStatus" OWNER TO neondb_owner;

--
-- Name: NotificationPriority; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."NotificationPriority" AS ENUM (
    'LOW',
    'NORMAL',
    'HIGH',
    'CRITICAL'
);


ALTER TYPE public."NotificationPriority" OWNER TO neondb_owner;

--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."NotificationType" AS ENUM (
    'ORDER_NEW',
    'ORDER_STATUS',
    'SYSTEM',
    'BROADCAST'
);


ALTER TYPE public."NotificationType" OWNER TO neondb_owner;

--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'pending',
    'accepted',
    'in_progress',
    'ready',
    'delivered',
    'cancelled'
);


ALTER TYPE public."OrderStatus" OWNER TO neondb_owner;

--
-- Name: OwnerRole; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."OwnerRole" AS ENUM (
    'owner',
    'super-admin'
);


ALTER TYPE public."OwnerRole" OWNER TO neondb_owner;

--
-- Name: OwnerStatus; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."OwnerStatus" AS ENUM (
    'Pending',
    'Active',
    'Blocked'
);


ALTER TYPE public."OwnerStatus" OWNER TO neondb_owner;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'pending',
    'captured',
    'failed',
    'refunded'
);


ALTER TYPE public."PaymentStatus" OWNER TO neondb_owner;

--
-- Name: PayoutState; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."PayoutState" AS ENUM (
    'PENDING',
    'APPROVED',
    'RELEASED',
    'FAILED'
);


ALTER TYPE public."PayoutState" OWNER TO neondb_owner;

--
-- Name: PayoutStatus; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."PayoutStatus" AS ENUM (
    'Pending',
    'Verified',
    'Rejected'
);


ALTER TYPE public."PayoutStatus" OWNER TO neondb_owner;

--
-- Name: PayoutStatusType; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."PayoutStatusType" AS ENUM (
    'pending',
    'scheduled',
    'completed',
    'failed'
);


ALTER TYPE public."PayoutStatusType" OWNER TO neondb_owner;

--
-- Name: ProductStatus; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."ProductStatus" AS ENUM (
    'DRAFT',
    'ACTIVE',
    'INACTIVE',
    'DISCONTINUED'
);


ALTER TYPE public."ProductStatus" OWNER TO neondb_owner;

--
-- Name: ProductType; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."ProductType" AS ENUM (
    'READY_MADE',
    'PRE_ORDER',
    'CUSTOM',
    'DIGITAL'
);


ALTER TYPE public."ProductType" OWNER TO neondb_owner;

--
-- Name: RecipientRole; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."RecipientRole" AS ENUM (
    'super-admin',
    'owner'
);


ALTER TYPE public."RecipientRole" OWNER TO neondb_owner;

--
-- Name: RecipientType; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."RecipientType" AS ENUM (
    'SUPER_ADMIN',
    'OWNER',
    'EMPLOYEE'
);


ALTER TYPE public."RecipientType" OWNER TO neondb_owner;

--
-- Name: ReturnStatus; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."ReturnStatus" AS ENUM (
    'REQUESTED',
    'UNDER_REVIEW',
    'APPROVED',
    'REJECTED',
    'PICKUP_SCHEDULED',
    'RECEIVED',
    'REFUNDED',
    'COMPLETED'
);


ALTER TYPE public."ReturnStatus" OWNER TO neondb_owner;

--
-- Name: ReviewModerationStatus; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."ReviewModerationStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'FLAGGED'
);


ALTER TYPE public."ReviewModerationStatus" OWNER TO neondb_owner;

--
-- Name: SubscriptionPlanType; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."SubscriptionPlanType" AS ENUM (
    'FREE',
    'STARTER',
    'PRO',
    'ENTERPRISE',
    'CUSTOM'
);


ALTER TYPE public."SubscriptionPlanType" OWNER TO neondb_owner;

--
-- Name: SubscriptionStatus; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."SubscriptionStatus" AS ENUM (
    'ACTIVE',
    'TRIAL',
    'CANCELLED',
    'EXPIRED',
    'PAST_DUE'
);


ALTER TYPE public."SubscriptionStatus" OWNER TO neondb_owner;

--
-- Name: TicketEscalationLevel; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."TicketEscalationLevel" AS ENUM (
    'NONE',
    'L1',
    'L2',
    'L3'
);


ALTER TYPE public."TicketEscalationLevel" OWNER TO neondb_owner;

--
-- Name: TicketPriority; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."TicketPriority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);


ALTER TYPE public."TicketPriority" OWNER TO neondb_owner;

--
-- Name: TicketSource; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."TicketSource" AS ENUM (
    'MOBILE',
    'WEB',
    'EMAIL',
    'CHAT'
);


ALTER TYPE public."TicketSource" OWNER TO neondb_owner;

--
-- Name: TicketStatus; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."TicketStatus" AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED'
);


ALTER TYPE public."TicketStatus" OWNER TO neondb_owner;

--
-- Name: TicketType; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."TicketType" AS ENUM (
    'REFUND_REQUEST',
    'ORDER_ISSUE',
    'PAYMENT_ISSUE',
    'CUSTOMER_COMPLAINT'
);


ALTER TYPE public."TicketType" OWNER TO neondb_owner;

--
-- Name: UserStatus; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."UserStatus" AS ENUM (
    'ACTIVE',
    'BLOCKED'
);


ALTER TYPE public."UserStatus" OWNER TO neondb_owner;

--
-- Name: VariantStatus; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."VariantStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE'
);


ALTER TYPE public."VariantStatus" OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _ProductToProductTag; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."_ProductToProductTag" (
    "A" uuid NOT NULL,
    "B" uuid NOT NULL
);


ALTER TABLE public."_ProductToProductTag" OWNER TO neondb_owner;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO neondb_owner;

--
-- Name: activities; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.activities (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    type public."ActivityType" NOT NULL,
    title character varying(255) NOT NULL,
    price character varying(100),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.activities OWNER TO neondb_owner;

--
-- Name: admin_notifications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.admin_notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    recipient_type public."RecipientType" NOT NULL,
    recipient_id uuid NOT NULL,
    boutique_id uuid,
    type public."AdminNotificationType" NOT NULL,
    priority public."NotificationPriority" DEFAULT 'NORMAL'::public."NotificationPriority" NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    entity_type character varying(50),
    entity_id character varying(100),
    is_read boolean DEFAULT false NOT NULL,
    metadata jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.admin_notifications OWNER TO neondb_owner;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    action_type character varying(100) NOT NULL,
    entity_type character varying(100) NOT NULL,
    entity_id character varying(50) NOT NULL,
    performed_by uuid NOT NULL,
    changes_before jsonb,
    changes_after jsonb,
    metadata jsonb,
    ip_address character varying(45),
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO neondb_owner;

--
-- Name: booking_histories; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.booking_histories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    booking_id uuid NOT NULL,
    status character varying(50) NOT NULL,
    note text,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.booking_histories OWNER TO neondb_owner;

--
-- Name: bookings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.bookings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    boutique_id uuid NOT NULL,
    booking_type public."BookingType" DEFAULT 'STORE_VISIT'::public."BookingType" NOT NULL,
    customer_name character varying(255) NOT NULL,
    customer_email character varying(255),
    customer_mobile character varying(20) NOT NULL,
    booking_date date NOT NULL,
    booking_time character varying(20) NOT NULL,
    notes text,
    status public."BookingStatus" DEFAULT 'Pending'::public."BookingStatus" NOT NULL,
    assigned_owner_id uuid,
    reminder_sent boolean DEFAULT false NOT NULL,
    order_id uuid,
    is_deleted boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.bookings OWNER TO neondb_owner;

--
-- Name: boutique_subscriptions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.boutique_subscriptions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    boutique_id uuid NOT NULL,
    plan_id uuid NOT NULL,
    status public."SubscriptionStatus" DEFAULT 'TRIAL'::public."SubscriptionStatus" NOT NULL,
    start_date timestamp(3) without time zone NOT NULL,
    end_date timestamp(3) without time zone NOT NULL,
    trial_ends_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    current_ready_made_products_count integer DEFAULT 0 CONSTRAINT boutique_subscriptions_current_ready_made_products_cou_not_null NOT NULL,
    current_custom_designs_count integer DEFAULT 0 NOT NULL,
    current_order_count integer DEFAULT 0 NOT NULL,
    current_booking_count integer DEFAULT 0 NOT NULL,
    current_customer_count integer DEFAULT 0 NOT NULL,
    current_measurements_count integer DEFAULT 0 NOT NULL,
    current_gallery_images integer DEFAULT 0 NOT NULL,
    current_staff_accounts integer DEFAULT 0 NOT NULL,
    current_branch_count integer DEFAULT 0 NOT NULL,
    trial_started_at timestamp(3) without time zone,
    trial_ended_at timestamp(3) without time zone,
    converted_at timestamp(3) without time zone,
    gateway_customer_id character varying(100),
    gateway_subscription_id character varying(100),
    gateway_payment_id character varying(100),
    pending_plan_id uuid
);


ALTER TABLE public.boutique_subscriptions OWNER TO neondb_owner;

--
-- Name: boutiques; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.boutiques (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    owner_name character varying(255) NOT NULL,
    description text DEFAULT ''::text,
    experience_years integer DEFAULT 0 NOT NULL,
    status public."BoutiqueStatus" DEFAULT 'Active'::public."BoutiqueStatus" NOT NULL,
    featured_boutique boolean DEFAULT false NOT NULL,
    verified boolean DEFAULT false NOT NULL,
    owner_id uuid,
    happy_clients integer DEFAULT 0 NOT NULL,
    total_designs integer DEFAULT 0 NOT NULL,
    mobile_number character varying(20) NOT NULL,
    whatsapp_number character varying(20) DEFAULT ''::character varying,
    email character varying(255) NOT NULL,
    full_address text NOT NULL,
    area character varying(100) DEFAULT ''::character varying,
    city character varying(100) NOT NULL,
    state character varying(100) NOT NULL,
    pincode character varying(20) DEFAULT ''::character varying,
    google_maps_link character varying(512) DEFAULT ''::character varying,
    service_radius character varying(100) DEFAULT ''::character varying,
    open_days character varying(255) DEFAULT ''::character varying,
    opening_time character varying(20) DEFAULT ''::character varying,
    closing_time character varying(20) DEFAULT ''::character varying,
    weekly_holiday character varying(50) DEFAULT ''::character varying,
    services_offered text[] DEFAULT ARRAY[]::text[],
    work_type_specialty text[] DEFAULT ARRAY[]::text[],
    pickup_available boolean DEFAULT false NOT NULL,
    delivery_available boolean DEFAULT false NOT NULL,
    home_visit_available boolean DEFAULT false NOT NULL,
    appointment_booking_available boolean DEFAULT false NOT NULL,
    rush_order_available boolean DEFAULT false NOT NULL,
    starting_price numeric(12,2) DEFAULT 0.00 NOT NULL,
    turnaround_time character varying(100) DEFAULT ''::character varying,
    logo_url character varying(512) DEFAULT ''::character varying,
    cover_image_url character varying(512) DEFAULT ''::character varying,
    gallery_urls text[] DEFAULT ARRAY[]::text[],
    instagram_handle character varying(100) DEFAULT ''::character varying,
    facebook_page character varying(255) DEFAULT ''::character varying,
    website_link character varying(512) DEFAULT ''::character varying,
    verification_documents text[] DEFAULT ARRAY[]::text[],
    payout_details text DEFAULT ''::text,
    payout_status public."PayoutStatus" DEFAULT 'Pending'::public."PayoutStatus" NOT NULL,
    internal_notes text DEFAULT ''::text,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp(3) without time zone,
    rating numeric(3,2) DEFAULT 0.00 NOT NULL,
    reviews_count integer DEFAULT 0 NOT NULL,
    version integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    commission_rate numeric(5,2) DEFAULT 10.00 NOT NULL,
    response_time_avg integer DEFAULT 0 NOT NULL,
    wallet_balance numeric(12,2) DEFAULT 0.00 NOT NULL,
    pending_payout numeric(12,2) DEFAULT 0.00 NOT NULL,
    total_paid_out numeric(12,2) DEFAULT 0.00 NOT NULL,
    is_frozen boolean DEFAULT false NOT NULL,
    is_suspended boolean DEFAULT false NOT NULL,
    subscription_enforcement boolean DEFAULT true NOT NULL
);


ALTER TABLE public.boutiques OWNER TO neondb_owner;

--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.cart_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    cart_id uuid NOT NULL,
    product_id uuid NOT NULL,
    variant_id uuid,
    quantity integer DEFAULT 1 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.cart_items OWNER TO neondb_owner;

--
-- Name: carts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.carts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.carts OWNER TO neondb_owner;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.categories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    image character varying(512),
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.categories OWNER TO neondb_owner;

--
-- Name: commerce_order_histories; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.commerce_order_histories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    order_id uuid NOT NULL,
    from_status character varying(50),
    to_status character varying(50) NOT NULL,
    note text,
    changed_by character varying(50),
    changed_by_id uuid,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.commerce_order_histories OWNER TO neondb_owner;

--
-- Name: commerce_order_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.commerce_order_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    order_id uuid NOT NULL,
    product_id uuid NOT NULL,
    variant_id uuid,
    product_name character varying(255) NOT NULL,
    variant_name character varying(255),
    sku character varying(100),
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    total_price numeric(12,2) NOT NULL,
    image_url character varying(512),
    attributes jsonb,
    discount_amount numeric(12,2) DEFAULT 0 NOT NULL,
    tax_amount numeric(12,2) DEFAULT 0 NOT NULL,
    tax_rate numeric(5,2)
);


ALTER TABLE public.commerce_order_items OWNER TO neondb_owner;

--
-- Name: commerce_orders; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.commerce_orders (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    order_id character varying(50) NOT NULL,
    user_id uuid NOT NULL,
    boutique_id uuid NOT NULL,
    shipping_address_id uuid,
    subtotal numeric(12,2) NOT NULL,
    discount_amount numeric(12,2) DEFAULT 0 NOT NULL,
    shipping_amount numeric(12,2) DEFAULT 0 NOT NULL,
    tax_amount numeric(12,2) DEFAULT 0 NOT NULL,
    total_amount numeric(12,2) NOT NULL,
    coupon_id uuid,
    status public."CommerceOrderStatus" DEFAULT 'PENDING'::public."CommerceOrderStatus" NOT NULL,
    payment_status public."CommercePaymentStatus" DEFAULT 'PENDING'::public."CommercePaymentStatus" NOT NULL,
    customer_note text,
    admin_note text,
    paid_at timestamp(3) without time zone,
    shipped_at timestamp(3) without time zone,
    delivered_at timestamp(3) without time zone,
    cancelled_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    cancellation_reason text,
    commission_amount numeric(12,2) DEFAULT 0 NOT NULL,
    currency character varying(10) DEFAULT 'INR'::character varying NOT NULL,
    net_amount numeric(12,2),
    out_for_delivery_at timestamp(3) without time zone,
    packed_at timestamp(3) without time zone,
    payment_details jsonb,
    payment_method character varying(50),
    refund_amount numeric(12,2),
    refunded_at timestamp(3) without time zone,
    reservation_expires_at timestamp(3) without time zone
);


ALTER TABLE public.commerce_orders OWNER TO neondb_owner;

--
-- Name: commerce_payments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.commerce_payments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    commerce_order_id uuid NOT NULL,
    amount numeric(12,2) NOT NULL,
    method character varying(50),
    status character varying(50) DEFAULT 'PENDING'::character varying NOT NULL,
    razorpay_order_id character varying(100),
    razorpay_payment_id character varying(100),
    razorpay_signature character varying(255),
    refund_id character varying(100),
    refund_amount numeric(12,2),
    refund_reason text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.commerce_payments OWNER TO neondb_owner;

--
-- Name: coupon_usages; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.coupon_usages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    coupon_id uuid NOT NULL,
    user_id uuid NOT NULL,
    order_id uuid NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.coupon_usages OWNER TO neondb_owner;

--
-- Name: coupons; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.coupons (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(50) NOT NULL,
    boutique_id uuid,
    description text,
    discount_type character varying(20) NOT NULL,
    discount_value numeric(12,2) NOT NULL,
    min_order_amount numeric(12,2),
    max_discount numeric(12,2),
    max_uses integer DEFAULT 0,
    current_uses integer DEFAULT 0 NOT NULL,
    max_uses_per_user integer DEFAULT 1,
    is_active boolean DEFAULT true NOT NULL,
    starts_at timestamp(3) without time zone,
    expires_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    applicable_ids text[] DEFAULT ARRAY[]::text[],
    applicable_type character varying(20) DEFAULT 'ALL'::character varying NOT NULL,
    first_order_only boolean DEFAULT false NOT NULL
);


ALTER TABLE public.coupons OWNER TO neondb_owner;

--
-- Name: custom_plan_requests; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.custom_plan_requests (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    boutique_id uuid NOT NULL,
    owner_id uuid NOT NULL,
    requested_designs integer NOT NULL,
    requested_orders integer NOT NULL,
    requested_gallery integer NOT NULL,
    requested_staff integer NOT NULL,
    reason text NOT NULL,
    status character varying(50) DEFAULT 'PENDING'::character varying NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.custom_plan_requests OWNER TO neondb_owner;

--
-- Name: customer_addresses; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.customer_addresses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    address_line1 character varying(255) NOT NULL,
    address_line2 character varying(255),
    city character varying(100) NOT NULL,
    state character varying(100) NOT NULL,
    pincode character varying(20) NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.customer_addresses OWNER TO neondb_owner;

--
-- Name: customer_notifications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.customer_notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    customer_id uuid NOT NULL,
    type public."CustomerNotificationType" NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    entity_type character varying(50),
    entity_id character varying(100),
    is_read boolean DEFAULT false NOT NULL,
    metadata jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.customer_notifications OWNER TO neondb_owner;

--
-- Name: delivery_tracking; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.delivery_tracking (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    order_id uuid NOT NULL,
    carrier character varying(100),
    tracking_number character varying(255),
    status text DEFAULT 'PENDING'::text NOT NULL,
    location character varying(255),
    note text,
    estimated_delivery timestamp(3) without time zone,
    delivered_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    tracking_url character varying(512)
);


ALTER TABLE public.delivery_tracking OWNER TO neondb_owner;

--
-- Name: delivery_tracking_history; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.delivery_tracking_history (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tracking_id uuid NOT NULL,
    from_status character varying(50),
    to_status character varying(50) NOT NULL,
    note text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.delivery_tracking_history OWNER TO neondb_owner;

--
-- Name: designs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.designs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    boutique_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    category public."DesignCategory" NOT NULL,
    images text[] DEFAULT ARRAY[]::text[],
    price numeric(12,2) DEFAULT 0.00 NOT NULL,
    tags text[] DEFAULT ARRAY[]::text[],
    is_featured boolean DEFAULT false NOT NULL,
    is_available boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_ready_made boolean DEFAULT false NOT NULL
);


ALTER TABLE public.designs OWNER TO neondb_owner;

--
-- Name: exchange_requests; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.exchange_requests (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    exchange_number character varying(50) NOT NULL,
    order_id uuid NOT NULL,
    order_item_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    reason character varying(255) NOT NULL,
    notes text,
    status public."ExchangeStatus" DEFAULT 'REQUESTED'::public."ExchangeStatus" NOT NULL,
    requested_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    approved_at timestamp(3) without time zone,
    completed_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.exchange_requests OWNER TO neondb_owner;

--
-- Name: measurements; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.measurements (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    chest numeric(5,2),
    waist numeric(5,2),
    length numeric(5,2),
    shoulder numeric(5,2),
    sleeve_length numeric(5,2),
    neck numeric(5,2),
    notes text,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.measurements OWNER TO neondb_owner;

--
-- Name: notification_campaigns; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.notification_campaigns (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    target_type character varying(50) NOT NULL,
    target_value character varying(100),
    channels text[] DEFAULT ARRAY[]::text[],
    scheduled_at timestamp(3) without time zone,
    status character varying(50) DEFAULT 'draft'::character varying NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.notification_campaigns OWNER TO neondb_owner;

--
-- Name: notification_receipts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.notification_receipts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    notification_id uuid NOT NULL,
    recipient_owner_id uuid,
    recipient_user_id uuid,
    sent_at timestamp(3) without time zone,
    delivered_at timestamp(3) without time zone,
    opened_at timestamp(3) without time zone,
    clicked_at timestamp(3) without time zone
);


ALTER TABLE public.notification_receipts OWNER TO neondb_owner;

--
-- Name: notification_templates; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.notification_templates (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    subject character varying(255) NOT NULL,
    body text NOT NULL,
    channels text[] DEFAULT ARRAY[]::text[],
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.notification_templates OWNER TO neondb_owner;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    recipient_role public."RecipientRole" NOT NULL,
    recipient_id uuid,
    recipient_user_id uuid,
    boutique_id uuid,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    type public."NotificationType" DEFAULT 'SYSTEM'::public."NotificationType" NOT NULL,
    status character varying(50) DEFAULT 'sent'::character varying NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    scheduled_at timestamp(3) without time zone,
    is_broadcast boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone NOT NULL,
    target_type character varying(50),
    target_value character varying(100),
    sent_push boolean DEFAULT false NOT NULL,
    sent_email boolean DEFAULT false NOT NULL,
    sent_sms boolean DEFAULT false NOT NULL,
    campaign_id uuid
);


ALTER TABLE public.notifications OWNER TO neondb_owner;

--
-- Name: order_histories; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.order_histories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    order_id uuid NOT NULL,
    status character varying(50) NOT NULL,
    note text,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.order_histories OWNER TO neondb_owner;

--
-- Name: order_sequences; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.order_sequences (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    date character varying(10) NOT NULL,
    last_number integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.order_sequences OWNER TO neondb_owner;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.orders (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    order_id character varying(50) NOT NULL,
    boutique_id uuid NOT NULL,
    owner_id uuid NOT NULL,
    customer_name character varying(255) NOT NULL,
    customer_phone character varying(20) NOT NULL,
    customer_address text,
    design_id uuid,
    design_name character varying(255),
    category public."DesignCategory" DEFAULT 'Blouse'::public."DesignCategory" NOT NULL,
    measurement_bust numeric(5,2),
    measurement_waist numeric(5,2),
    measurement_hip numeric(5,2),
    measurement_shoulder numeric(5,2),
    measurement_sleeve_length numeric(5,2),
    measurement_blouse_length numeric(5,2),
    measurement_notes text,
    price numeric(12,2) DEFAULT 0.00 NOT NULL,
    advance_paid numeric(12,2) DEFAULT 0.00 NOT NULL,
    remaining_amount numeric(12,2) DEFAULT 0.00 NOT NULL,
    order_status public."OrderStatus" DEFAULT 'pending'::public."OrderStatus" NOT NULL,
    payment_status public."PaymentStatus" DEFAULT 'pending'::public."PaymentStatus" NOT NULL,
    order_date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expected_delivery_date timestamp(3) without time zone,
    actual_delivery_date timestamp(3) without time zone,
    is_deleted boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.orders OWNER TO neondb_owner;

--
-- Name: owner_feature_permissions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.owner_feature_permissions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    owner_id uuid NOT NULL,
    can_manage_orders boolean DEFAULT true NOT NULL,
    can_manage_bookings boolean DEFAULT true NOT NULL,
    can_manage_reviews boolean DEFAULT true NOT NULL,
    can_manage_payments boolean DEFAULT true NOT NULL,
    can_manage_payouts boolean DEFAULT true NOT NULL,
    can_manage_gallery boolean DEFAULT true NOT NULL,
    can_manage_designs boolean DEFAULT true NOT NULL,
    can_manage_analytics boolean DEFAULT true NOT NULL,
    can_manage_notifications boolean DEFAULT true NOT NULL,
    can_manage_staff boolean DEFAULT true NOT NULL,
    can_manage_customers boolean DEFAULT true NOT NULL,
    can_manage_measurements boolean DEFAULT true NOT NULL,
    can_manage_inventory boolean DEFAULT true NOT NULL,
    can_manage_expenses boolean DEFAULT true NOT NULL,
    can_manage_production boolean DEFAULT true NOT NULL,
    can_manage_delivery boolean DEFAULT true NOT NULL,
    can_manage_marketing boolean DEFAULT true NOT NULL,
    can_manage_roles boolean DEFAULT true NOT NULL,
    can_manage_branches boolean DEFAULT true NOT NULL,
    can_export_reports boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    can_manage_products boolean DEFAULT true NOT NULL
);


ALTER TABLE public.owner_feature_permissions OWNER TO neondb_owner;

--
-- Name: owners; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.owners (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    owner_name character varying(255) NOT NULL,
    username character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    mobile_number character varying(20) NOT NULL,
    password character varying(255) NOT NULL,
    role public."OwnerRole" DEFAULT 'owner'::public."OwnerRole" NOT NULL,
    status public."OwnerStatus" DEFAULT 'Pending'::public."OwnerStatus" NOT NULL,
    assigned_boutique_id uuid,
    invite_token_hash character varying(64),
    invite_expires_at timestamp(3) without time zone,
    reset_password_token character varying(64),
    reset_password_expire timestamp(3) without time zone,
    must_reset_password boolean DEFAULT true NOT NULL,
    email_verified boolean DEFAULT false NOT NULL,
    last_login timestamp(3) without time zone,
    is_deleted boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    login_enabled boolean DEFAULT true NOT NULL,
    read_only_mode boolean DEFAULT false NOT NULL,
    can_edit_profile boolean DEFAULT true NOT NULL,
    can_edit_services boolean DEFAULT true NOT NULL,
    can_edit_gallery boolean DEFAULT true NOT NULL,
    can_manage_designs boolean DEFAULT true NOT NULL,
    can_manage_orders boolean DEFAULT true NOT NULL,
    can_manage_bookings boolean DEFAULT true NOT NULL,
    can_manage_reviews boolean DEFAULT true NOT NULL,
    can_manage_media boolean DEFAULT true NOT NULL,
    can_view_analytics boolean DEFAULT true NOT NULL,
    can_manage_customers boolean DEFAULT true NOT NULL,
    can_manage_measurements boolean DEFAULT true NOT NULL,
    can_manage_inventory boolean DEFAULT true NOT NULL,
    can_manage_expenses boolean DEFAULT true NOT NULL,
    can_manage_production boolean DEFAULT true NOT NULL,
    can_manage_delivery boolean DEFAULT true NOT NULL,
    can_manage_marketing boolean DEFAULT true NOT NULL,
    can_manage_roles boolean DEFAULT true NOT NULL,
    can_manage_branches boolean DEFAULT true NOT NULL,
    can_export_reports boolean DEFAULT true NOT NULL
);


ALTER TABLE public.owners OWNER TO neondb_owner;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.payments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    order_id uuid NOT NULL,
    boutique_id uuid NOT NULL,
    customer_id uuid,
    amount numeric(12,2) NOT NULL,
    currency character varying(10) DEFAULT 'INR'::character varying,
    status public."PaymentStatus" DEFAULT 'pending'::public."PaymentStatus" NOT NULL,
    method character varying(50),
    commission_amount numeric(12,2) DEFAULT 0.00 NOT NULL,
    net_amount numeric(12,2) DEFAULT 0.00 NOT NULL,
    payout_status public."PayoutStatusType" DEFAULT 'pending'::public."PayoutStatusType" NOT NULL,
    payout_id uuid,
    refund_id character varying(100),
    refund_reason text,
    razorpay_order_id character varying(100),
    razorpay_payment_id character varying(100),
    razorpay_signature character varying(255),
    receipt character varying(100),
    description text,
    metadata jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.payments OWNER TO neondb_owner;

--
-- Name: payouts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.payouts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    boutique_id uuid NOT NULL,
    amount numeric(12,2) NOT NULL,
    status public."PayoutState" DEFAULT 'PENDING'::public."PayoutState" NOT NULL,
    payout_id character varying(100),
    reference_code character varying(100),
    payout_date timestamp(3) without time zone,
    error_msg text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.payouts OWNER TO neondb_owner;

--
-- Name: platform_settings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.platform_settings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    global_commission_rate numeric(5,2) DEFAULT 10.00 NOT NULL,
    category_commissions jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.platform_settings OWNER TO neondb_owner;

--
-- Name: product_analytics; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.product_analytics (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    product_id uuid NOT NULL,
    period_start timestamp(3) without time zone NOT NULL,
    period_end timestamp(3) without time zone NOT NULL,
    views integer DEFAULT 0 NOT NULL,
    unique_views integer DEFAULT 0 NOT NULL,
    add_to_cart_count integer DEFAULT 0 NOT NULL,
    order_count integer DEFAULT 0 NOT NULL,
    revenue numeric(12,2) DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.product_analytics OWNER TO neondb_owner;

--
-- Name: product_brands; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.product_brands (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    logo character varying(512),
    boutique_id uuid NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.product_brands OWNER TO neondb_owner;

--
-- Name: product_images; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.product_images (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    product_id uuid NOT NULL,
    url character varying(512) NOT NULL,
    alt character varying(255),
    sort_order integer DEFAULT 0 NOT NULL,
    is_primary boolean DEFAULT false NOT NULL
);


ALTER TABLE public.product_images OWNER TO neondb_owner;

--
-- Name: product_inventory; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.product_inventory (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    variant_id uuid NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    reserved_quantity integer DEFAULT 0 NOT NULL,
    low_stock_threshold integer DEFAULT 5 NOT NULL,
    track_inventory boolean DEFAULT true NOT NULL,
    version integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.product_inventory OWNER TO neondb_owner;

--
-- Name: product_inventory_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.product_inventory_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    product_id uuid NOT NULL,
    variant_id uuid,
    change integer NOT NULL,
    quantity_before integer NOT NULL,
    quantity_after integer NOT NULL,
    reason character varying(100) NOT NULL,
    reference character varying(255),
    created_by character varying(100),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.product_inventory_logs OWNER TO neondb_owner;

--
-- Name: product_reviews; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.product_reviews (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    product_id uuid NOT NULL,
    user_id uuid NOT NULL,
    order_id uuid,
    rating integer NOT NULL,
    title character varying(255),
    comment text,
    images text[] DEFAULT ARRAY[]::text[],
    is_verified_purchase boolean DEFAULT false NOT NULL,
    status text DEFAULT 'APPROVED'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    reply text,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.product_reviews OWNER TO neondb_owner;

--
-- Name: product_tags; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.product_tags (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    boutique_id uuid NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.product_tags OWNER TO neondb_owner;

--
-- Name: product_variant_attributes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.product_variant_attributes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    product_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    "values" jsonb NOT NULL
);


ALTER TABLE public.product_variant_attributes OWNER TO neondb_owner;

--
-- Name: product_variants; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.product_variants (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    product_id uuid NOT NULL,
    sku character varying(100),
    name character varying(255) NOT NULL,
    attributes jsonb,
    price numeric(12,2),
    compare_at_price numeric(12,2),
    status public."VariantStatus" DEFAULT 'ACTIVE'::public."VariantStatus" NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.product_variants OWNER TO neondb_owner;

--
-- Name: product_wishlists; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.product_wishlists (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    product_id uuid NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.product_wishlists OWNER TO neondb_owner;

--
-- Name: products; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.products (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    boutique_id uuid NOT NULL,
    brand_id uuid,
    category_id uuid,
    sub_category_id uuid,
    product_type public."ProductType" DEFAULT 'READY_MADE'::public."ProductType" NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    short_description character varying(500),
    sku character varying(100),
    barcode character varying(100),
    base_price numeric(12,2) NOT NULL,
    compare_at_price numeric(12,2),
    cost_price numeric(12,2),
    delivery_type public."DeliveryType" DEFAULT 'STANDARD'::public."DeliveryType" NOT NULL,
    weight numeric(8,2),
    length numeric(8,2),
    width numeric(8,2),
    height numeric(8,2),
    status public."ProductStatus" DEFAULT 'DRAFT'::public."ProductStatus" NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,
    is_marketplace_visible boolean DEFAULT true NOT NULL,
    is_taxable boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    seo_title character varying(255),
    seo_description text,
    seo_slug character varying(255),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    average_rating double precision DEFAULT 0 NOT NULL,
    review_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.products OWNER TO neondb_owner;

--
-- Name: return_requests; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.return_requests (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    return_number character varying(50) NOT NULL,
    order_id uuid NOT NULL,
    order_item_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    reason character varying(255) NOT NULL,
    notes text,
    status public."ReturnStatus" DEFAULT 'REQUESTED'::public."ReturnStatus" NOT NULL,
    refund_amount numeric(12,2),
    requested_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    approved_at timestamp(3) without time zone,
    rejected_at timestamp(3) without time zone,
    completed_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.return_requests OWNER TO neondb_owner;

--
-- Name: reviews; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.reviews (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    boutique_id uuid NOT NULL,
    user_id uuid NOT NULL,
    order_id uuid,
    rating integer NOT NULL,
    rating_stitching integer,
    rating_measurement integer,
    rating_delivery integer,
    rating_communication integer,
    rating_value integer,
    comment text,
    reply text,
    verified_purchase boolean DEFAULT false NOT NULL,
    review_images text[] DEFAULT ARRAY[]::text[],
    report_count integer DEFAULT 0 NOT NULL,
    moderation_status public."ReviewModerationStatus" DEFAULT 'PENDING'::public."ReviewModerationStatus" NOT NULL,
    is_suspicious boolean DEFAULT false NOT NULL,
    suspicious_reason text,
    ip_address character varying(45),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.reviews OWNER TO neondb_owner;

--
-- Name: shipping_addresses; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.shipping_addresses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    full_name character varying(255) NOT NULL,
    phone character varying(20) NOT NULL,
    address_line1 character varying(255) NOT NULL,
    address_line2 character varying(255),
    city character varying(100) NOT NULL,
    state character varying(100) NOT NULL,
    pincode character varying(20) NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.shipping_addresses OWNER TO neondb_owner;

--
-- Name: sub_categories; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sub_categories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    category_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    image character varying(512),
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.sub_categories OWNER TO neondb_owner;

--
-- Name: subscription_billing_history; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.subscription_billing_history (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    subscription_id uuid NOT NULL,
    amount numeric(12,2) NOT NULL,
    payment_status character varying(50) NOT NULL,
    payment_method character varying(50),
    invoice_url character varying(512),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.subscription_billing_history OWNER TO neondb_owner;

--
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.subscription_plans (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    plan_code character varying(100) NOT NULL,
    description text DEFAULT ''::text,
    monthly_price numeric(12,2) NOT NULL,
    yearly_price numeric(12,2) NOT NULL,
    trial_period_days integer DEFAULT 14 NOT NULL,
    grace_period_days integer DEFAULT 3 NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,
    recommended_plan boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    allow_direct_selling boolean DEFAULT true NOT NULL,
    allow_custom_tailoring boolean DEFAULT false NOT NULL,
    max_ready_made_products integer DEFAULT '-1'::integer NOT NULL,
    max_custom_designs integer DEFAULT 50 NOT NULL,
    max_orders_per_month integer DEFAULT 100 NOT NULL,
    max_bookings_per_month integer DEFAULT 50 NOT NULL,
    max_customers integer DEFAULT '-1'::integer NOT NULL,
    max_measurements integer DEFAULT '-1'::integer NOT NULL,
    max_gallery_images integer DEFAULT 20 NOT NULL,
    max_staff_accounts integer DEFAULT 5 NOT NULL,
    max_branches integer DEFAULT 1 NOT NULL,
    can_manage_products boolean DEFAULT false NOT NULL,
    can_manage_stock boolean DEFAULT false NOT NULL,
    can_manage_shipping boolean DEFAULT false NOT NULL,
    can_manage_returns boolean DEFAULT false NOT NULL,
    can_manage_coupons boolean DEFAULT false NOT NULL,
    can_manage_offers boolean DEFAULT false NOT NULL,
    can_manage_product_variants boolean DEFAULT false NOT NULL,
    can_manage_reviews boolean DEFAULT true NOT NULL,
    can_use_custom_measurements boolean DEFAULT true NOT NULL,
    can_use_measurement_history boolean DEFAULT false NOT NULL,
    can_create_custom_orders boolean DEFAULT true NOT NULL,
    can_manage_tailoring_orders boolean DEFAULT true NOT NULL,
    can_manage_production_workflow boolean DEFAULT false NOT NULL,
    can_manage_tailor_assignments boolean DEFAULT false NOT NULL,
    can_manage_customers boolean DEFAULT true NOT NULL,
    can_manage_customer_notes boolean DEFAULT true NOT NULL,
    can_manage_rewards boolean DEFAULT false NOT NULL,
    can_manage_referrals boolean DEFAULT false NOT NULL,
    can_manage_wallet boolean DEFAULT false NOT NULL,
    can_manage_staff boolean DEFAULT true NOT NULL,
    can_manage_attendance boolean DEFAULT false NOT NULL,
    can_manage_tasks boolean DEFAULT false NOT NULL,
    can_manage_payroll boolean DEFAULT false NOT NULL,
    can_use_whatsapp_marketing boolean DEFAULT false NOT NULL,
    can_use_sms_marketing boolean DEFAULT false NOT NULL,
    can_use_email_marketing boolean DEFAULT false NOT NULL,
    can_create_campaigns boolean DEFAULT false NOT NULL,
    can_view_analytics boolean DEFAULT false NOT NULL,
    can_view_advanced_analytics boolean DEFAULT false NOT NULL,
    can_view_financial_reports boolean DEFAULT false NOT NULL,
    can_list_in_marketplace boolean DEFAULT true NOT NULL,
    can_feature_products boolean DEFAULT false NOT NULL,
    can_feature_boutique boolean DEFAULT false NOT NULL,
    can_sell_premium_designs boolean DEFAULT false NOT NULL,
    can_use_ai_assistant boolean DEFAULT false NOT NULL,
    can_use_ai_recommendations boolean DEFAULT false NOT NULL,
    can_use_ai_design_suggestions boolean DEFAULT false NOT NULL,
    can_use_api_access boolean DEFAULT false NOT NULL,
    can_use_custom_branding boolean DEFAULT false NOT NULL,
    can_use_white_label boolean DEFAULT false NOT NULL,
    can_use_multi_branch boolean DEFAULT false NOT NULL
);


ALTER TABLE public.subscription_plans OWNER TO neondb_owner;

--
-- Name: support_ticket_admin_notes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.support_ticket_admin_notes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    ticket_id uuid NOT NULL,
    admin_id uuid NOT NULL,
    note text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.support_ticket_admin_notes OWNER TO neondb_owner;

--
-- Name: support_ticket_messages; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.support_ticket_messages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    ticket_id uuid NOT NULL,
    sender_type character varying(50) NOT NULL,
    sender_id uuid NOT NULL,
    sender_name character varying(255) NOT NULL,
    message text NOT NULL,
    attachment_url character varying(512),
    attachment_type character varying(50),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.support_ticket_messages OWNER TO neondb_owner;

--
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.support_tickets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    boutique_id uuid,
    order_id uuid,
    ticket_type public."TicketType" NOT NULL,
    priority public."TicketPriority" DEFAULT 'MEDIUM'::public."TicketPriority" NOT NULL,
    escalation_level public."TicketEscalationLevel" DEFAULT 'NONE'::public."TicketEscalationLevel" NOT NULL,
    source public."TicketSource" DEFAULT 'WEB'::public."TicketSource" NOT NULL,
    subject character varying(255) NOT NULL,
    description text NOT NULL,
    status public."TicketStatus" DEFAULT 'OPEN'::public."TicketStatus" NOT NULL,
    assigned_admin_id uuid,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    first_response_at timestamp(3) without time zone,
    resolved_at timestamp(3) without time zone,
    escalated_at timestamp(3) without time zone,
    sla_breached boolean DEFAULT false NOT NULL,
    fraud_score integer DEFAULT 0 NOT NULL,
    risk_level text DEFAULT 'LOW'::text NOT NULL,
    excessive_ticket_flag boolean DEFAULT false NOT NULL,
    attachment_url character varying(512),
    attachment_type character varying(50)
);


ALTER TABLE public.support_tickets OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    phone character varying(20) NOT NULL,
    name character varying(255) DEFAULT 'New User'::character varying,
    status public."UserStatus" DEFAULT 'ACTIVE'::public."UserStatus" NOT NULL,
    segment public."CustomerSegment" DEFAULT 'NEW'::public."CustomerSegment" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    otp character varying(6),
    otp_expires_at timestamp(3) without time zone
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: wishlists; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.wishlists (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    design_id uuid NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.wishlists OWNER TO neondb_owner;

--
-- Data for Name: _ProductToProductTag; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."_ProductToProductTag" ("A", "B") FROM stdin;
39d029a5-b0aa-4f31-8b3a-0f256bbe86d3	fc4d7943-f8ce-4e64-8a01-5d06858f3c39
5d3f8cfb-5c57-4234-92b1-54e5775cc71f	6fe072e6-7b8a-4acd-b466-f936c359686a
9e953786-5208-482b-9aad-9fd59d522801	e2e8899b-4eb9-4c92-ad26-925cd257d16e
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
6f904cd5-e33f-4af0-9f74-da54a3765d44	ebefa6f29a9ecabbc21dfd63717f1c33646bb95898ef43fde9f755186f9f9752	2026-06-18 16:41:47.178254+00	20260618000000_full_baseline		\N	2026-06-18 16:41:47.178254+00	0
06fc20f9-d8cc-4a54-ae9e-9d4829b0807b	122d743a0403e77ad7e0ed9447f5b8826f2fbdbc55612d936eff004dd13c2eec	2026-06-18 16:43:31.819138+00	20260618164302_add_category_management	\N	\N	2026-06-18 16:43:30.530172+00	1
ff58bf33-3ad9-4ccc-8a11-0bff9ace6eaa	64dc5477d1c7ab236f9a81973c3e9c20f47e834298e7863f4c3a950e75c7de13	2026-06-18 16:57:03.938384+00	20260618165642_add_product_management	\N	\N	2026-06-18 16:57:02.424135+00	1
a4f9ec9c-beca-4b44-8406-c44815748f6b	348db90e49102eb1f0bb14f7a4a8bd8b31339c7d53df7dd31e245995b4cb3ba6	2026-06-18 17:14:17.638795+00	20260618171358_add_can_manage_products	\N	\N	2026-06-18 17:14:16.32855+00	1
f82249d6-4c14-4a38-9a10-291febffaeca	8acea29873c6257e079097673d14791c4b6c4cc461c035d53a02aca1e458e1d5	2026-06-18 18:31:16.273644+00	20260618183112_add_commerce_models	\N	\N	2026-06-18 18:31:14.466296+00	1
fd96cf37-903d-46cc-81c5-9f326fd9748e	c3f46ec2cc3aaadfe322d18bd57e581fc4a39bf63d45bdcc307cb62c9fd3cf13	2026-06-19 04:14:39.965516+00	20260619041336_commerce_foundation_phase	\N	\N	2026-06-19 04:14:38.621631+00	1
3f77bbb2-e845-4b6d-8041-93256379d208	c5354e56c807025583ef918f71bd010b774bc76999118e5748618102816a9e49	2026-06-19 04:36:10.6871+00	20260619043607_order_sequence	\N	\N	2026-06-19 04:36:09.259697+00	1
14c645b1-c19c-45b0-87a4-b29fe24094a0	c5893d1324a41aa86e9b316401cb916f0e11f3157286088c1898f48501342936	2026-06-22 04:01:14.914166+00	20260622040111_enforce_subscription_default	\N	\N	2026-06-22 04:01:13.314609+00	1
926d22b8-a52d-4973-a15d-7d233ac3fed5	59bb9b46af2ac9977b6dc8033030c97cfb73acfdf933adabcc56c9990cca25ca	2026-06-22 04:21:35.455335+00	20260622120000_add_otp_fields	\N	\N	2026-06-22 04:21:33.936018+00	1
\.


--
-- Data for Name: activities; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.activities (id, type, title, price, created_at) FROM stdin;
\.


--
-- Data for Name: admin_notifications; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.admin_notifications (id, recipient_type, recipient_id, boutique_id, type, priority, title, message, entity_type, entity_id, is_read, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.audit_logs (id, action_type, entity_type, entity_id, performed_by, changes_before, changes_after, metadata, ip_address, "timestamp") FROM stdin;
71ea4e96-eb1a-4860-8f0e-31cc751e0832	CREATE_BOUTIQUE	Boutique	69f203f2ceddcfe9b7035ef5	f190aceb-e440-4cb2-b483-403ab4bb0797	{}	{}	{"name": "Tiny Tucks"}		2026-04-29 13:13:23.058
6f6904be-819a-4eab-a309-3025f50413f2	CREATE_OWNER_DIRECT	Owner	69f203f3ceddcfe9b7035ef9	f190aceb-e440-4cb2-b483-403ab4bb0797	{}	{}	{"username": "sanjana_tiny_admin"}		2026-04-29 13:13:23.324
72e74614-4836-42d3-88b9-c7b6818ab315	UNLINK_OWNER	Owner	69f203f3ceddcfe9b7035ef9	f190aceb-e440-4cb2-b483-403ab4bb0797	{}	{}	{"boutiqueId": "69f203f2ceddcfe9b7035ef5"}		2026-04-30 05:15:21.286
6765dced-b061-4ad1-bce8-d42e8f89b3ca	LINK_OWNER	Owner	69f203f3ceddcfe9b7035ef9	f190aceb-e440-4cb2-b483-403ab4bb0797	{}	{}	{"boutiqueId": "69f203f2ceddcfe9b7035ef5"}		2026-04-30 05:47:22.48
4a118179-752d-4442-b6a9-8a84f55e9ce8	UPDATE_OWNER_PERMISSIONS	Owner	69f203f3ceddcfe9b7035ef9	f190aceb-e440-4cb2-b483-403ab4bb0797	{}	{}	{"permissions": {"canEditGallery": true, "canEditProfile": false, "canManageMedia": true, "canEditServices": true, "canManageOrders": true, "canManageDesigns": true, "canManageReviews": true, "canManageBookings": true}}		2026-04-30 05:50:15.585
6f3f9ca8-0e16-4bd6-9343-7fcbab6d5d54	OWNER_UPDATE_BOUTIQUE	Boutique	69f203f2ceddcfe9b7035ef5	d3350b54-b045-480f-99c0-a62951f906a1	{}	{}	{}		2026-04-30 05:50:29.814
e7c612e1-9803-4e50-b41a-be4156063026	OWNER_UPDATE_BOUTIQUE	Boutique	69f203f2ceddcfe9b7035ef5	d3350b54-b045-480f-99c0-a62951f906a1	{}	{}	{}		2026-04-30 05:50:41.958
5dd40340-0c5d-4a43-8604-1805ff0ef277	OWNER_UPDATE_BOUTIQUE	Boutique	69f203f2ceddcfe9b7035ef5	d3350b54-b045-480f-99c0-a62951f906a1	{}	{}	{}		2026-04-30 05:50:48.137
1cba9c75-0bcf-4941-b964-fe8ee361569d	UPDATE_OWNER_PERMISSIONS	Owner	69f203f3ceddcfe9b7035ef9	f190aceb-e440-4cb2-b483-403ab4bb0797	{}	{}	{"permissions": {"canEditGallery": true, "canEditProfile": false, "canManageMedia": true, "canEditServices": false, "canManageOrders": true, "canManageDesigns": true, "canManageReviews": true, "canManageBookings": true}}		2026-04-30 05:53:52.271
6c953106-f133-44b8-afbe-5aaa2a27f9fe	UPDATE_OWNER_PERMISSIONS	Owner	69f203f3ceddcfe9b7035ef9	f190aceb-e440-4cb2-b483-403ab4bb0797	{}	{}	{"permissions": {"canEditGallery": true, "canEditProfile": false, "canManageMedia": true, "canEditServices": true, "canManageOrders": true, "canManageDesigns": true, "canManageReviews": true, "canManageBookings": true}}		2026-04-30 05:54:02.408
c47d04c2-7529-495a-8809-8efa8960dbc4	UPDATE_OWNER_PERMISSIONS	Owner	69f203f3ceddcfe9b7035ef9	f190aceb-e440-4cb2-b483-403ab4bb0797	{}	{}	{"permissions": {"canEditGallery": true, "canEditProfile": false, "canManageMedia": true, "canEditServices": true, "canManageOrders": true, "canManageDesigns": true, "canManageReviews": true, "canManageBookings": true}}		2026-04-30 06:07:15.294
df90d0fa-aea2-41d3-ada3-6741869699e9	UPDATE_OWNER_PERMISSIONS	Owner	69f203f3ceddcfe9b7035ef9	f190aceb-e440-4cb2-b483-403ab4bb0797	{}	{}	{"permissions": {"canEditGallery": true, "canEditProfile": false, "canManageMedia": true, "canEditServices": false, "canManageOrders": true, "canManageDesigns": true, "canManageReviews": true, "canManageBookings": true}}		2026-04-30 06:09:41.094
466e1ec9-2511-4d1b-b76e-774c31c68495	UPDATE_OWNER_PERMISSIONS	Owner	69f203f3ceddcfe9b7035ef9	f190aceb-e440-4cb2-b483-403ab4bb0797	{}	{}	{"permissions": {"canEditGallery": true, "canEditProfile": true, "canManageMedia": true, "canEditServices": false, "canManageOrders": true, "canManageDesigns": true, "canManageReviews": true, "canManageBookings": true}}		2026-04-30 06:09:48.757
b2f8964c-f8d5-4b85-8ecb-15ca33b7b942	UPDATE_OWNER_PERMISSIONS	Owner	69f203f3ceddcfe9b7035ef9	f190aceb-e440-4cb2-b483-403ab4bb0797	{}	{}	{"permissions": {"canEditGallery": true, "canEditProfile": true, "canManageMedia": true, "canEditServices": true, "canManageOrders": true, "canManageDesigns": true, "canManageReviews": true, "canManageBookings": true}}		2026-04-30 06:09:58.079
da2de062-4c03-4f0e-9d07-8546af771ae4	OWNER_UPDATE_GALLERY	Boutique	69f203f2ceddcfe9b7035ef5	d3350b54-b045-480f-99c0-a62951f906a1	{}	{}	{}		2026-04-30 06:45:22.429
17fbb20d-329c-47e8-903e-e7bc4fc06503	OWNER_UPDATE_GALLERY	Boutique	69f203f2ceddcfe9b7035ef5	d3350b54-b045-480f-99c0-a62951f906a1	{}	{}	{}		2026-04-30 06:55:43.583
37663a86-c6e7-4363-92c8-7bf19609749d	OWNER_UPDATE_BOUTIQUE	Boutique	69f203f2ceddcfe9b7035ef5	d3350b54-b045-480f-99c0-a62951f906a1	{}	{}	{}		2026-04-30 07:06:48.971
27f209a9-10d1-43e4-b8a6-7c17c1797c27	OWNER_UPDATE_BOUTIQUE	Boutique	69f203f2ceddcfe9b7035ef5	d3350b54-b045-480f-99c0-a62951f906a1	{}	{}	{}		2026-04-30 07:07:40.935
fd28a82b-e233-422f-8c87-afe5d19444d0	OWNER_UPDATE_MEDIA	Boutique	69f203f2ceddcfe9b7035ef5	d3350b54-b045-480f-99c0-a62951f906a1	{}	{}	{"fields": ["logo", "coverImage"]}		2026-04-30 07:16:22.834
c3a3642f-f063-4404-8753-be48efb4e185	OWNER_UPDATE_BOUTIQUE	Boutique	69f203f2ceddcfe9b7035ef5	d3350b54-b045-480f-99c0-a62951f906a1	{}	{}	{}		2026-04-30 07:16:24.919
3825795c-a9ff-4500-9756-c2467f0127ee	UPDATE_BOUTIQUE	Boutique	69f203f2ceddcfe9b7035ef5	f190aceb-e440-4cb2-b483-403ab4bb0797	{}	{}	{"changes": ["featuredBoutique"]}		2026-04-30 08:36:15.143
2d046165-d4fa-4a60-aa5a-9ddd6aea7775	UPDATE_BOUTIQUE	Boutique	69f203f2ceddcfe9b7035ef5	f190aceb-e440-4cb2-b483-403ab4bb0797	{}	{}	{"changes": ["featuredBoutique"]}		2026-04-30 08:36:15.99
9d4f160f-b33a-420c-8a67-b2398fe5d904	OWNER_UPDATE_SERVICES	Boutique	69f203f2ceddcfe9b7035ef5	d3350b54-b045-480f-99c0-a62951f906a1	{}	{}	{}		2026-04-30 08:47:00.796
c99f2dc6-f8cb-448d-8800-a5ab75fddfa3	OWNER_UPDATE_SERVICES	Boutique	69f203f2ceddcfe9b7035ef5	d3350b54-b045-480f-99c0-a62951f906a1	{}	{}	{}		2026-04-30 09:08:49.692
4010510c-514b-4ba7-ad14-e3cb01b4dc26	OWNER_UPDATE_SERVICES	Boutique	69f203f2ceddcfe9b7035ef5	d3350b54-b045-480f-99c0-a62951f906a1	{}	{}	{}		2026-04-30 09:09:14.411
50aaf8ca-2c42-43c2-9bdc-b9d1895e0941	CREATE_DESIGN	Design	69f31d4c73662dff87b0e105	d3350b54-b045-480f-99c0-a62951f906a1	{}	{}	{}		2026-04-30 09:13:48.288
6971e7c7-f362-410b-9bed-886d88963ff5	DELETE_DESIGN	Design	69f31d4c73662dff87b0e105	d3350b54-b045-480f-99c0-a62951f906a1	{}	{}	{}		2026-04-30 09:21:19.169
13312984-6aef-4278-b5e6-fde29f31ab37	CREATE_DESIGN	Design	69f31f3d05234414c6b812c6	d3350b54-b045-480f-99c0-a62951f906a1	{}	{}	{}		2026-04-30 09:22:05.834
c07df8ef-2829-4436-9544-18e756222d4a	OWNER_UPDATE_BOUTIQUE	Boutique	69f203f2ceddcfe9b7035ef5	d3350b54-b045-480f-99c0-a62951f906a1	{}	{}	{}		2026-04-30 09:49:35.683
869a6ed6-2e97-4152-a605-aa9995d45752	SOFT_DELETE_BOUTIQUE	Boutique	69f1d49f54e6f6a7e249aa36	f190aceb-e440-4cb2-b483-403ab4bb0797	{}	{}	{"name": "Sai Ram"}		2026-05-02 18:15:05.915
12d33cb2-fa0e-4398-9845-4e9b69458476	UPDATE_BOUTIQUE	Boutique	69f203f2ceddcfe9b7035ef5	f190aceb-e440-4cb2-b483-403ab4bb0797	{}	{}	{"changes": ["experienceYears", "logo", "coverImage"]}		2026-05-02 18:27:48.158
1ae54ed2-581a-4824-8661-0e1de6fdea3a	UPDATE_BOUTIQUE	Boutique	69f203f2ceddcfe9b7035ef5	f190aceb-e440-4cb2-b483-403ab4bb0797	{}	{}	{"changes": ["experienceYears"]}		2026-05-02 18:29:51.855
7ed70004-a782-4498-9db0-da86a2f0265e	UPDATE_BOUTIQUE	Boutique	69f203f2ceddcfe9b7035ef5	f190aceb-e440-4cb2-b483-403ab4bb0797	{}	{}	{"changes": ["experienceYears", "logo"]}		2026-05-02 18:33:26.216
cf5bb79b-d1c1-44a3-b335-87b19d2d1e9a	UPDATE_BOUTIQUE	Boutique	69f203f2ceddcfe9b7035ef5	f190aceb-e440-4cb2-b483-403ab4bb0797	{}	{}	{"changes": ["experienceYears", "logo"]}		2026-05-02 18:35:37.828
2950b6ee-cb99-4e82-94e4-bd0586190512	UPDATE_BOUTIQUE	Boutique	69f203f2ceddcfe9b7035ef5	f190aceb-e440-4cb2-b483-403ab4bb0797	{}	{}	{"changes": ["experienceYears", "media"]}		2026-05-02 20:45:17.896
6a895a7b-ca89-48bc-b7b0-d53340603477	UPDATE_OWNER_PERMISSIONS	Owner	69f203f3ceddcfe9b7035ef9	f190aceb-e440-4cb2-b483-403ab4bb0797	{}	{}	{"permissions": {"canEditGallery": true, "canEditProfile": true, "canManageMedia": true, "canEditServices": true, "canManageOrders": true, "canManageDesigns": true, "canManageReviews": true, "canViewAnalytics": true, "canManageBookings": true}}		2026-05-05 12:39:05.12
750ca647-d953-42ed-9410-2339fe14eadf	UPDATE_DESIGN	Design	69f31f3d05234414c6b812c6	d3350b54-b045-480f-99c0-a62951f906a1	{}	{}	{}		2026-05-05 12:39:38.296
86d31b99-e5c0-4215-af72-d5cf633972c4	CREATE_DESIGN	Design	69f9e5625c084be1ac33aae4	d3350b54-b045-480f-99c0-a62951f906a1	{}	{}	{}		2026-05-05 12:41:06.967
f1bc26cf-56e0-471a-9866-302bd77e1323	UPDATE_OWNER_PERMISSIONS	Owner	69f203f3ceddcfe9b7035ef9	f190aceb-e440-4cb2-b483-403ab4bb0797	{}	{}	{"permissions": {"canEditGallery": true, "canEditProfile": true, "canManageMedia": true, "canEditServices": true, "canManageOrders": true, "canManageDesigns": true, "canManageReviews": true, "canViewAnalytics": true, "canManageBookings": true}}		2026-05-05 12:52:05.932
bf9fa0ba-056d-4a49-a7b5-58feec68e3ab	UPDATE_OWNER_PERMISSIONS	Owner	69f203f3ceddcfe9b7035ef9	f190aceb-e440-4cb2-b483-403ab4bb0797	{}	{}	{"permissions": {"canEditGallery": true, "canEditProfile": true, "canManageMedia": true, "canEditServices": true, "canManageOrders": true, "canManageDesigns": true, "canManageReviews": true, "canViewAnalytics": false, "canManageBookings": true}}		2026-05-05 12:52:34.335
b03ff895-f876-439b-a4c4-8a7fa522c0f7	UPDATE_OWNER_PERMISSIONS	Owner	69f203f3ceddcfe9b7035ef9	f190aceb-e440-4cb2-b483-403ab4bb0797	{}	{}	{"permissions": {"canEditGallery": true, "canEditProfile": true, "canManageMedia": true, "canEditServices": true, "canManageOrders": true, "canManageDesigns": true, "canManageReviews": true, "canViewAnalytics": true, "canManageBookings": true}}		2026-05-05 12:59:14.409
4d789211-8155-48fd-abbd-394a2ed73693	UPDATE_OWNER_PERMISSIONS	Owner	69f203f3ceddcfe9b7035ef9	f190aceb-e440-4cb2-b483-403ab4bb0797	{}	{}	{"permissions": {"canEditGallery": true, "canEditProfile": true, "canManageMedia": true, "canEditServices": true, "canManageOrders": true, "canManageDesigns": true, "canManageReviews": true, "canViewAnalytics": false, "canManageBookings": true}}		2026-05-05 13:01:50.449
f7bc1db0-1900-4944-943a-0aed88a5b309	UPDATE_OWNER_PERMISSIONS	Owner	69f203f3ceddcfe9b7035ef9	f190aceb-e440-4cb2-b483-403ab4bb0797	{}	{}	{"permissions": {"canEditGallery": true, "canEditProfile": true, "canManageMedia": true, "canEditServices": true, "canManageOrders": true, "canManageDesigns": true, "canManageReviews": true, "canViewAnalytics": true, "canManageBookings": true}}		2026-05-05 13:01:58.868
d1e27288-94f0-4ef4-946a-ea276ec202ed	BLOCK_CUSTOMER	User	efe55879-1289-40a3-9a73-915ef7742f49	f190aceb-e440-4cb2-b483-403ab4bb0797	null	null	{"reason": "Spamming payment requests"}	\N	2026-06-04 19:12:30.694
c4e31313-6469-4345-8e6b-dfa772eeb060	UNBLOCK_CUSTOMER	User	efe55879-1289-40a3-9a73-915ef7742f49	f190aceb-e440-4cb2-b483-403ab4bb0797	null	null	{"reason": "Verified profile"}	\N	2026-06-04 19:12:30.715
62f7323d-5067-4be4-8326-32c169d0e278	BLOCK_CUSTOMER	User	efe55879-1289-40a3-9a73-915ef7742f49	f190aceb-e440-4cb2-b483-403ab4bb0797	null	null	{"reason": "Spamming payment requests"}	\N	2026-06-04 19:13:54.72
440f1d63-dd70-4611-88a7-290f5b7123c9	UNBLOCK_CUSTOMER	User	efe55879-1289-40a3-9a73-915ef7742f49	f190aceb-e440-4cb2-b483-403ab4bb0797	null	null	{"reason": "Verified profile"}	\N	2026-06-04 19:13:54.738
d7cbe6f5-8b51-4492-8137-3f46f954099b	MODERATE_REVIEW	Review	ca92b9e0-1f0d-4bee-995b-ac5c94d1e8f0	f190aceb-e440-4cb2-b483-403ab4bb0797	"APPROVED"	"APPROVED"	null	\N	2026-06-04 19:23:42.845
7b318255-ebce-4cab-b6cb-5abca7cd747e	MODERATE_REVIEW	Review	63c1a9e2-482d-4a24-ad11-89fc01b9259a	f190aceb-e440-4cb2-b483-403ab4bb0797	"APPROVED"	"APPROVED"	null	\N	2026-06-04 19:23:54.495
33484a56-6c09-40b0-ab7c-404cccafe238	MODERATE_REVIEW	Review	86df8160-c5fb-4e80-97fc-14f2ef2b1b38	f190aceb-e440-4cb2-b483-403ab4bb0797	"APPROVED"	"APPROVED"	null	\N	2026-06-04 19:26:50.828
04c5ae91-6b00-49c8-8a27-ca5ceb28c5e6	UPDATE_COMMISSION_SETTINGS	PlatformSetting	7314c117-a9d5-42dd-9e05-334d7690dbd6	f190aceb-e440-4cb2-b483-403ab4bb0797	{"id": "7314c117-a9d5-42dd-9e05-334d7690dbd6", "updatedAt": "2026-06-04T19:37:17.040Z", "categoryCommissions": {}, "globalCommissionRate": 10}	{"id": "7314c117-a9d5-42dd-9e05-334d7690dbd6", "updatedAt": "2026-06-04T19:37:17.049Z", "categoryCommissions": {"Saree": 15, "Lehenga": 20}, "globalCommissionRate": 12}	null	\N	2026-06-04 19:37:17.049
386e3c64-ccc6-4802-985a-b130621dc076	UPDATE_BOUTIQUE_COMMISSION	Boutique	a8620a56-8cb8-4057-b350-fcd0dd3a1d8a	f190aceb-e440-4cb2-b483-403ab4bb0797	18	18	null	\N	2026-06-04 19:37:17.069
3e964cf6-18c2-495a-b39d-e18404cfdbb1	UPDATE_COMMISSION_SETTINGS	PlatformSetting	7314c117-a9d5-42dd-9e05-334d7690dbd6	f190aceb-e440-4cb2-b483-403ab4bb0797	{"id": "7314c117-a9d5-42dd-9e05-334d7690dbd6", "updatedAt": "2026-06-04T19:37:17.049Z", "categoryCommissions": {"Saree": 15, "Lehenga": 20}, "globalCommissionRate": 12}	{"id": "7314c117-a9d5-42dd-9e05-334d7690dbd6", "updatedAt": "2026-06-04T19:37:53.570Z", "categoryCommissions": {"Saree": 15, "Lehenga": 20}, "globalCommissionRate": 12}	null	\N	2026-06-04 19:37:53.57
94a38100-0c08-4e97-ab1c-84e2b36a2d40	UPDATE_BOUTIQUE_COMMISSION	Boutique	179f2e1b-2d8a-44f0-a74c-4bd7230ff819	f190aceb-e440-4cb2-b483-403ab4bb0797	18	18	null	\N	2026-06-04 19:37:53.595
cc07a2d0-2300-4687-aec6-3bdad34454ae	PAYMENT_VERIFIED	Order	eb9eefd1-07fd-499c-867e-0efdc8eb961e	f190aceb-e440-4cb2-b483-403ab4bb0797	null	null	{"amount": 1000, "orderId": "eb9eefd1-07fd-499c-867e-0efdc8eb961e", "razorpay_payment_id": "pay_global_123"}	\N	2026-06-04 19:37:53.643
1f299414-a8cc-4eb2-9970-dd9324346056	PAYMENT_VERIFIED	Order	db51dce6-fa1f-4bf7-9985-ecf9550c954c	f190aceb-e440-4cb2-b483-403ab4bb0797	null	null	{"amount": 1000, "orderId": "db51dce6-fa1f-4bf7-9985-ecf9550c954c", "razorpay_payment_id": "pay_category_123"}	\N	2026-06-04 19:37:53.666
2a1612e7-a10d-4447-9e20-efe797690988	PAYMENT_VERIFIED	Order	3bde4899-6f19-4c00-a016-8150533b1b57	f190aceb-e440-4cb2-b483-403ab4bb0797	null	null	{"amount": 1000, "orderId": "3bde4899-6f19-4c00-a016-8150533b1b57", "razorpay_payment_id": "pay_boutique_123"}	\N	2026-06-04 19:37:53.685
4e75df8e-e3e4-40d0-a8ef-4e9f4ef9db0d	GENERATE_PAYOUT	Payout	762fd364-34f2-4bb2-848e-315771cbd99a	f190aceb-e440-4cb2-b483-403ab4bb0797	null	null	{"amount": 500, "boutiqueId": "179f2e1b-2d8a-44f0-a74c-4bd7230ff819"}	\N	2026-06-04 19:37:53.712
fbce208f-5eb1-4cbe-a97c-40568bacf94e	UPDATE_PAYOUT_STATUS	Payout	762fd364-34f2-4bb2-848e-315771cbd99a	f190aceb-e440-4cb2-b483-403ab4bb0797	"PENDING"	"FAILED"	null	\N	2026-06-04 19:37:53.726
f88425d4-9750-46d1-9641-9f3233f68c71	GENERATE_PAYOUT	Payout	e6e6fc49-725c-4801-a13d-a88ec5cc375c	f190aceb-e440-4cb2-b483-403ab4bb0797	null	null	{"amount": 500, "boutiqueId": "179f2e1b-2d8a-44f0-a74c-4bd7230ff819"}	\N	2026-06-04 19:37:53.744
612b215d-843e-470b-aae6-47dbbd4560ec	UPDATE_PAYOUT_STATUS	Payout	e6e6fc49-725c-4801-a13d-a88ec5cc375c	f190aceb-e440-4cb2-b483-403ab4bb0797	"PENDING"	"RELEASED"	null	\N	2026-06-04 19:37:53.755
dcf23e39-e42d-452d-86f5-dac20675d3df	PAYMENT_REFUNDED	Order	eb9eefd1-07fd-499c-867e-0efdc8eb961e	f190aceb-e440-4cb2-b483-403ab4bb0797	null	null	{"amount": 1000, "reason": "Customer cancelled design request", "paymentId": "57d8ffc1-a6d3-4e38-8683-3c46ef662759"}	\N	2026-06-04 19:37:53.773
5d0313ea-a964-4cad-8ddb-bc00538bd442	CREATE_PRODUCT	product	836e8c3d-8cfa-44a6-b483-ffbb4e64699a	0b0e0c27-63ab-4aac-b138-99d46e7cbd47	\N	\N	{"boutiqueId": "5ab54e5a-4ef6-4911-8ea1-4224617df55c"}	\N	2026-06-18 18:02:33.476
a198cd47-f2e0-4a29-9a1a-57ce12f69bd4	DELETE_PRODUCT	product	836e8c3d-8cfa-44a6-b483-ffbb4e64699a	0b0e0c27-63ab-4aac-b138-99d46e7cbd47	\N	\N	{"boutiqueId": "5ab54e5a-4ef6-4911-8ea1-4224617df55c"}	\N	2026-06-18 18:02:57.439
e30181f0-9e6a-4e3c-b691-2af183c1acfe	CREATE_PRODUCT	product	45fe0f2a-9e3a-46a2-aa77-9ea846b0ff84	0b0e0c27-63ab-4aac-b138-99d46e7cbd47	\N	\N	{"boutiqueId": "5ab54e5a-4ef6-4911-8ea1-4224617df55c"}	\N	2026-06-18 18:03:35.788
27355f85-00f7-4231-b145-001bab90f244	DELETE_PRODUCT	product	45fe0f2a-9e3a-46a2-aa77-9ea846b0ff84	0b0e0c27-63ab-4aac-b138-99d46e7cbd47	\N	\N	{"boutiqueId": "5ab54e5a-4ef6-4911-8ea1-4224617df55c"}	\N	2026-06-18 18:03:59.609
b448e4c3-f2da-448a-b161-a52e344707c0	CREATE_PRODUCT	product	39d029a5-b0aa-4f31-8b3a-0f256bbe86d3	7f882ccb-f565-4f42-a33d-56c411d82415	\N	\N	{"boutiqueId": "154c28b2-97e5-4179-824e-8179589d5547"}	\N	2026-06-22 04:46:04.623
e193f440-1bf0-4f83-8cb8-9cd49490d29c	CREATE_PRODUCT_IMAGE	product_image	98edaa53-6efc-44c9-9365-51cd37e67d66	7f882ccb-f565-4f42-a33d-56c411d82415	\N	\N	{"productId": "39d029a5-b0aa-4f31-8b3a-0f256bbe86d3", "boutiqueId": "154c28b2-97e5-4179-824e-8179589d5547"}	\N	2026-06-22 04:46:24.854
6224289f-af55-41b8-bd12-0d7162ed1119	DELETE_PRODUCT	product	39d029a5-b0aa-4f31-8b3a-0f256bbe86d3	7f882ccb-f565-4f42-a33d-56c411d82415	\N	\N	{"boutiqueId": "154c28b2-97e5-4179-824e-8179589d5547"}	\N	2026-06-22 04:46:49.802
8442d64d-376c-4e57-a5a2-6ac79ef8dda1	CREATE_PRODUCT	product	5d3f8cfb-5c57-4234-92b1-54e5775cc71f	7f882ccb-f565-4f42-a33d-56c411d82415	\N	\N	{"boutiqueId": "154c28b2-97e5-4179-824e-8179589d5547"}	\N	2026-06-22 04:49:06.204
4346c785-2548-49ff-9294-415e6722070e	CREATE_PRODUCT_IMAGE	product_image	37b0590e-48ee-4835-9751-baebbc2cd1b7	7f882ccb-f565-4f42-a33d-56c411d82415	\N	\N	{"productId": "5d3f8cfb-5c57-4234-92b1-54e5775cc71f", "boutiqueId": "154c28b2-97e5-4179-824e-8179589d5547"}	\N	2026-06-22 04:49:22.731
be17b3b1-e98e-44a0-b5df-6479874a6613	DELETE_PRODUCT	product	5d3f8cfb-5c57-4234-92b1-54e5775cc71f	7f882ccb-f565-4f42-a33d-56c411d82415	\N	\N	{"boutiqueId": "154c28b2-97e5-4179-824e-8179589d5547"}	\N	2026-06-22 04:49:42.834
29893148-d364-485b-b5ab-e84e1065c34a	CREATE_PRODUCT	product	00b503ba-e2ff-4ddd-9551-0a2ff3b2b1aa	7f882ccb-f565-4f42-a33d-56c411d82415	\N	\N	{"boutiqueId": "154c28b2-97e5-4179-824e-8179589d5547"}	\N	2026-06-22 06:12:03.548
a573d531-b604-4aaa-9757-b96313f62f46	CREATE_PRODUCT	product	22fbfc8a-46fa-471e-b1e2-87aac5b94414	7f882ccb-f565-4f42-a33d-56c411d82415	\N	\N	{"boutiqueId": "154c28b2-97e5-4179-824e-8179589d5547"}	\N	2026-06-22 06:12:50.225
ab90540a-8551-4e5b-ac22-6a47f6c9936d	CREATE_PRODUCT	product	9e953786-5208-482b-9aad-9fd59d522801	7f882ccb-f565-4f42-a33d-56c411d82415	\N	\N	{"boutiqueId": "154c28b2-97e5-4179-824e-8179589d5547"}	\N	2026-06-22 06:13:34.889
d0a94de9-9281-4aa0-a788-2726697e13a4	CREATE_PRODUCT_IMAGE	product_image	d9467c6c-b50f-4065-9d4b-f0a12fe1b7bf	7f882ccb-f565-4f42-a33d-56c411d82415	\N	\N	{"productId": "9e953786-5208-482b-9aad-9fd59d522801", "boutiqueId": "154c28b2-97e5-4179-824e-8179589d5547"}	\N	2026-06-22 06:13:52.498
7a97cb15-b9aa-4cde-9c5c-2b3a1ffbdb8f	DELETE_PRODUCT	product	9e953786-5208-482b-9aad-9fd59d522801	7f882ccb-f565-4f42-a33d-56c411d82415	\N	\N	{"boutiqueId": "154c28b2-97e5-4179-824e-8179589d5547"}	\N	2026-06-22 06:14:24.019
\.


--
-- Data for Name: booking_histories; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.booking_histories (id, booking_id, status, note, "timestamp") FROM stdin;
\.


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.bookings (id, boutique_id, booking_type, customer_name, customer_email, customer_mobile, booking_date, booking_time, notes, status, assigned_owner_id, reminder_sent, order_id, is_deleted, created_at) FROM stdin;
79865a15-628c-41ee-b60b-0e8623d07f2a	3b360640-f08b-460c-b06e-4f4ba821e298	STORE_VISIT	Aranya Sen	\N	9876543200	2026-06-05	11:00 AM	Session notes for Aranya Sen	Accepted	d3350b54-b045-480f-99c0-a62951f906a1	f	\N	f	2026-06-05 02:57:04.464
657826ad-3c37-4455-abd1-953723c5e73e	3b360640-f08b-460c-b06e-4f4ba821e298	VIDEO_CONSULTATION	Bhavya Rao	\N	9876543201	2026-06-05	02:00 PM	Session notes for Bhavya Rao	Pending	d3350b54-b045-480f-99c0-a62951f906a1	f	\N	f	2026-06-05 02:57:04.464
3359d4a3-a3cd-4608-9a80-4b2447aea72c	3b360640-f08b-460c-b06e-4f4ba821e298	HOME_MEASUREMENT	Deepika Padukone	\N	9876543202	2026-06-05	04:00 PM	Session notes for Deepika Padukone	Completed	d3350b54-b045-480f-99c0-a62951f906a1	f	\N	f	2026-06-05 02:57:04.464
8b7a628b-eac3-4a92-82fd-3d8ff0a6d7c9	3b360640-f08b-460c-b06e-4f4ba821e298	DESIGN_DISCUSSION	Esha Deol	\N	9876543203	2026-06-04	12:00 PM	Session notes for Esha Deol	Accepted	d3350b54-b045-480f-99c0-a62951f906a1	f	\N	f	2026-06-04 02:57:04.464
834d6abf-74af-4e50-8c41-2927a07b041f	3b360640-f08b-460c-b06e-4f4ba821e298	TRIAL_FITTING	Gauri Khan	\N	9876543204	2026-06-03	03:00 PM	Session notes for Gauri Khan	Completed	d3350b54-b045-480f-99c0-a62951f906a1	f	\N	f	2026-06-03 02:57:04.464
a14c0414-960c-414d-9e75-d67808232c08	3b360640-f08b-460c-b06e-4f4ba821e298	STORE_VISIT	Ishita Sharma	\N	9876543205	2026-05-31	10:00 AM	Session notes for Ishita Sharma	Accepted	d3350b54-b045-480f-99c0-a62951f906a1	f	\N	f	2026-05-31 02:57:04.464
d74e29c6-b674-4af7-b2d6-37e04bcd0d2f	3b360640-f08b-460c-b06e-4f4ba821e298	FINAL_DELIVERY	Kriti Sanon	\N	9876543206	2026-05-26	05:30 PM	Session notes for Kriti Sanon	Completed	d3350b54-b045-480f-99c0-a62951f906a1	f	\N	f	2026-05-26 02:57:04.464
a46228f1-e877-495d-bbf0-81486d849c1b	3b360640-f08b-460c-b06e-4f4ba821e298	STORE_VISIT	Meera Rajput	\N	9876543207	2026-05-21	01:00 PM	Session notes for Meera Rajput	Rejected	d3350b54-b045-480f-99c0-a62951f906a1	f	\N	f	2026-05-21 02:57:04.464
b0c0131b-8c7e-4ef4-898d-2e4efef764e5	3b360640-f08b-460c-b06e-4f4ba821e298	VIDEO_CONSULTATION	Neha Dhupia	\N	9876543208	2026-05-16	04:30 PM	Session notes for Neha Dhupia	Completed	d3350b54-b045-480f-99c0-a62951f906a1	f	\N	f	2026-05-16 02:57:04.464
3769c9bf-0abb-4bfd-a5c7-0d63574a237a	3b360640-f08b-460c-b06e-4f4ba821e298	HOME_MEASUREMENT	Priyanka Chopra	\N	9876543209	2026-05-11	11:30 AM	Session notes for Priyanka Chopra	Accepted	d3350b54-b045-480f-99c0-a62951f906a1	f	\N	f	2026-05-11 02:57:04.464
\.


--
-- Data for Name: boutique_subscriptions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.boutique_subscriptions (id, boutique_id, plan_id, status, start_date, end_date, trial_ends_at, created_at, updated_at, current_ready_made_products_count, current_custom_designs_count, current_order_count, current_booking_count, current_customer_count, current_measurements_count, current_gallery_images, current_staff_accounts, current_branch_count, trial_started_at, trial_ended_at, converted_at, gateway_customer_id, gateway_subscription_id, gateway_payment_id, pending_plan_id) FROM stdin;
c7a592cf-5ccb-40c1-b681-f0e66f5dc25a	3b360640-f08b-460c-b06e-4f4ba821e298	6382ecb7-a82e-49f9-8770-c0edc63e0e4b	ACTIVE	2026-06-04 19:44:29.895	2126-06-04 19:44:29.895	\N	2026-06-04 19:44:29.899	2026-06-04 19:44:29.899	0	0	0	0	0	0	0	0	0	\N	\N	\N	\N	\N	\N	\N
46e9499b-ac36-4561-bf3d-3116c972ff79	444d0792-6d4b-4912-870d-a7084fb4000d	6382ecb7-a82e-49f9-8770-c0edc63e0e4b	ACTIVE	2026-06-18 15:52:24.899	2126-06-18 15:52:24.899	\N	2026-06-18 15:52:25.683	2026-06-18 15:52:25.683	0	0	0	0	0	0	0	0	0	\N	\N	\N	\N	\N	\N	\N
0eb8d144-14ea-42b3-b2d8-7072187902d7	e93b248c-0e8a-4db9-9915-c2fec8f46845	6382ecb7-a82e-49f9-8770-c0edc63e0e4b	ACTIVE	2026-06-18 15:52:24.899	2126-06-18 15:52:24.899	\N	2026-06-18 15:52:26.82	2026-06-18 15:52:26.82	0	0	0	0	0	0	0	0	0	\N	\N	\N	\N	\N	\N	\N
15d93870-b1b6-4d3d-baed-c823f8aac3c4	154c28b2-97e5-4179-824e-8179589d5547	6382ecb7-a82e-49f9-8770-c0edc63e0e4b	ACTIVE	2026-06-22 04:39:12.691	2027-06-22 04:39:12.691	2026-07-22 04:39:12.691	2026-06-22 04:39:12.693	2026-06-22 04:40:54.401	0	0	0	0	0	0	0	1	1	\N	\N	\N	\N	\N	\N	\N
0739942f-32b6-459a-9f75-f73ca7424647	9713de00-8c88-48c2-9ecc-902b86954f96	6382ecb7-a82e-49f9-8770-c0edc63e0e4b	ACTIVE	2026-06-04 19:44:29.895	2126-06-04 19:44:29.895	\N	2026-06-04 19:44:29.904	2026-06-22 09:50:36.551	2	0	0	0	0	0	0	1	1	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: boutiques; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.boutiques (id, name, owner_name, description, experience_years, status, featured_boutique, verified, owner_id, happy_clients, total_designs, mobile_number, whatsapp_number, email, full_address, area, city, state, pincode, google_maps_link, service_radius, open_days, opening_time, closing_time, weekly_holiday, services_offered, work_type_specialty, pickup_available, delivery_available, home_visit_available, appointment_booking_available, rush_order_available, starting_price, turnaround_time, logo_url, cover_image_url, gallery_urls, instagram_handle, facebook_page, website_link, verification_documents, payout_details, payout_status, internal_notes, is_deleted, deleted_at, rating, reviews_count, version, created_at, commission_rate, response_time_avg, wallet_balance, pending_payout, total_paid_out, is_frozen, is_suspended, subscription_enforcement) FROM stdin;
d31a980d-407e-4511-a5eb-436a186d5092	Stress Boutique 1782112020354	Stress Owner		0	Active	f	f	\N	0	0	99999920354		stress1782112020354@boutique.com	Stress Address		City	State								{}	{}	f	f	f	f	f	0.00				{}				{}		Pending		f	\N	0.00	0	0	2026-06-22 07:07:03.505	10.00	0	0.00	0.00	0.00	f	f	t
444d0792-6d4b-4912-870d-a7084fb4000d	Ticket Test Boutique	Test Boutique Owner		3	Active	f	f	\N	0	0	9999999912		ticketing@test.com	456 Ticket Lane		Test City	Test State								{Saree}	{Embroidery}	f	f	f	f	f	300.00				{}				{}		Pending		f	\N	0.00	0	0	2026-06-04 19:59:10.674	10.00	0	0.00	0.00	0.00	f	f	t
e93b248c-0e8a-4db9-9915-c2fec8f46845	Validation Test Boutique	Test Owner		5	Active	f	f	\N	0	0	9999999988		validation@test.com	123 Test Street, Suite 100		Test City	Test State								{Blouse}	{Stitching}	f	f	f	f	f	500.00				{}				{}		Pending		f	\N	0.00	0	0	2026-06-17 18:31:34.649	10.00	0	0.00	0.00	0.00	f	f	t
3b360640-f08b-460c-b06e-4f4ba821e298	Sai Ram	Kumar	Register Complete Boutique Entity Fill in the comprehensive details to onboard a new boutique and generate owner credentials.  1. Basic Information Boutique Name * Sai Ram Owner Name * Kumar Boutique Description  Bridal and custom blouse specialist... Experience Years  e.g. 5+ Years Status Active Featured Boutique? 2. Contact Details Mobile Number * 9876543210 WhatsApp Number  9876543210 Email Address * sri@gmail.com 3. Location Details Full Address * Shop No. 12, Banjara Hills... Area / Locality  Banjara Hills City * Hyderabad State * Telangana Pincode  500034 Google Maps Link  https://maps.google.com/... Service Radius  Within 10 km 4. Business Hours Open Days  Mon-Sat Opening Time  11:00 AM Closing Time  8:00 PM Weekly Holiday  Sunday 5. Services & Specialities Services Offered (comma separated)  Custom blouse, bridal wear, sarees Work Specialty (comma separated)  Maggam work, hand embroidery 6. Features & Availability Pickup Available Delivery Available Tailor Home Visit Appointment Booking Rush Order Ava	8	Active	f	t	\N	0	0	7660922416	9123456789	2100031261cser@gmail.com	Plot 45, Ground Floor, Jubilee Hills Check Post, Road No. 36.	Jubilee Hills	Hyderabad	Telangana	500033	https://maps.app.goo.gl/gQEB7YBivPv13xvw6	Within 10 km	Monday, Tuesday, Wednesday, Thursday, Friday, Saturday	11:00 AM	08:00 PM	Sunday	{"Lehenga Stitching","Blouse Customization","Gown Alterations"}	{"Zardosi Work","Bead Work","Cut-work Embroidery"}	t	t	t	t	f	750.00	3-5 Days			{}	@Sai_Ram			{https://drive.google.com/file/d/gst_doc_ab}		Pending		t	2026-05-02 18:15:05.838	0.00	0	0	2026-06-04 18:19:19.79	10.00	0	0.00	0.00	0.00	f	f	t
9713de00-8c88-48c2-9ecc-902b86954f96	Tiny Tucks	Sanjana Kapoor	Custom-made ethnic wear for newborns to teenagers. We specialize in skin-friendly fabrics and comfortable festive wear.	0	Active	t	f	d3350b54-b045-480f-99c0-a62951f906a1	0	0	9052011447	9052011447	hello@tinytucks.com	Shop G-4, Pearl Residency, Somajiguda Main Road.	Somajiguda	Hyderabad	Telangana	500082	https://maps.google.com/urban_dhaga_madhapur	Within 10 km	Monday, Tuesday, Wednesday, Thursday, Friday, Saturday	11:00 AM	08:00 PM	Sunday	{}	{"Custom Blouse","Soft Cotton Lining"}	t	t	t	f	t	766.00	3-5 Days	https://vs-boutique-images.s3.ap-south-1.amazonaws.com/uploads/logo/1777754714618-df96b370-7674-4c74-ac25-7c10eb32beed.png		{}	@tinytucks_hyd	facebook.com/tinytucks		{}		Pending		f	\N	0.00	0	0	2026-06-04 18:19:19.797	10.00	0	0.00	0.00	0.00	f	f	t
ebb03214-7fe9-48bc-9702-ce513b1fe095	Audit Boutique B 1781809114924	Audit Owner B		0	Active	f	f	\N	0	0	9888888883		auditb1781809114924@boutique.com	2 Audit St		Audit City	Audit State								{}	{}	f	f	f	f	f	0.00				{}				{}		Pending		f	\N	0.00	0	0	2026-06-18 18:58:38.215	10.00	0	0.00	0.00	0.00	f	f	t
154c28b2-97e5-4179-824e-8179589d5547	Product Test Boutique	Product Tester		0	Active	f	f	\N	0	0	9999888777		producttest@boutique.com	456 Test Ave		Testopolis	Test State								{}	{}	f	f	f	f	f	0.00				{}				{}		Pending		f	\N	0.00	0	0	2026-06-18 17:16:58.806	10.00	0	0.00	0.00	0.00	f	f	t
5ab54e5a-4ef6-4911-8ea1-4224617df55c	Owner Product Test Boutique	Owner Product Tester		0	Active	f	f	\N	0	0	9111111111		ownerproducttest@boutique.com	789 Test Lane		Test City	Test State								{}	{}	f	f	f	f	f	0.00				{}				{}		Pending		f	\N	0.00	0	0	2026-06-18 18:02:01.357	10.00	0	0.00	0.00	0.00	f	f	t
49421d96-d408-4133-b700-7977aabbf112	Wrong Boutique 1781805723100	Wrong Owner		0	Active	f	f	\N	0	0	9222222222		wrong1781805723100@boutique.com	1 Wrong St		Wrong City	Wrong State								{}	{}	f	f	f	f	f	0.00				{}				{}		Pending		f	\N	0.00	0	0	2026-06-18 18:02:03.102	10.00	0	0.00	0.00	0.00	f	f	t
aeebf623-d51b-4f89-bd8e-d28d83364469	Wrong Boutique 1781805791506	Wrong Owner		0	Active	f	f	\N	0	0	9222222222		wrong1781805791506@boutique.com	1 Wrong St		Wrong City	Wrong State								{}	{}	f	f	f	f	f	0.00				{}				{}		Pending		f	\N	0.00	0	0	2026-06-18 18:03:11.507	10.00	0	0.00	0.00	0.00	f	f	t
6900ca7f-05c5-4a4a-a636-8d1f9fc3eba8	Wishlist Test Boutique	Wishlist Owner		0	Active	f	f	\N	0	0	9555555551		wishlistowner@boutique.com	55 Wishlist Ave		Wish City	Wish State								{}	{}	f	f	f	f	f	0.00				{}				{}		Pending		f	\N	0.00	0	0	2026-06-18 18:20:05.35	10.00	0	0.00	0.00	0.00	f	f	t
416af8dc-b903-425c-92cd-f12ca2483386	Audit Boutique	Audit Owner		0	Active	f	f	\N	0	0	9888888881		auditowner@boutique.com	1 Audit St		Audit City	Audit State								{}	{}	f	f	f	f	f	0.00				{}				{}		Pending		f	\N	0.00	0	0	2026-06-18 18:37:08.75	10.00	0	0.00	0.00	0.00	f	f	t
af5c6060-19c5-4706-bef9-55ba9fd574a7	Audit Boutique B 1781807824326	Audit Owner B		0	Active	f	f	\N	0	0	9888888883		auditb1781807824326@boutique.com	2 Audit St		Audit City	Audit State								{}	{}	f	f	f	f	f	0.00				{}				{}		Pending		f	\N	0.00	0	0	2026-06-18 18:37:10.138	10.00	0	0.00	0.00	0.00	f	f	t
19859527-fe72-4cd4-99ab-dfc7c544be7f	Audit Boutique B 1781808669195	Audit Owner B		0	Active	f	f	\N	0	0	9888888883		auditb1781808669195@boutique.com	2 Audit St		Audit City	Audit State								{}	{}	f	f	f	f	f	0.00				{}				{}		Pending		f	\N	0.00	0	0	2026-06-18 18:51:15.807	10.00	0	0.00	0.00	0.00	f	f	t
8f5b1639-55db-4043-9069-d90579d02921	Audit Boutique B 1781809334074	Audit Owner B		0	Active	f	f	\N	0	0	9888888883		auditb1781809334074@boutique.com	2 Audit St		Audit City	Audit State								{}	{}	f	f	f	f	f	0.00				{}				{}		Pending		f	\N	0.00	0	0	2026-06-18 19:02:17.47	10.00	0	0.00	0.00	0.00	f	f	t
adace4fb-ac88-4f51-8e3d-02090b6b093d	Audit Boutique B 1781809480752	Audit Owner B		0	Active	f	f	\N	0	0	9888888883		auditb1781809480752@boutique.com	2 Audit St		Audit City	Audit State								{}	{}	f	f	f	f	f	0.00				{}				{}		Pending		f	\N	0.00	0	0	2026-06-18 19:04:44.194	10.00	0	0.00	0.00	0.00	f	f	t
c8bc3d3d-f4d3-4197-9592-4274146afaac	Wrong Boutique 1782103079902	Wrong Owner		0	Active	f	f	\N	0	0	9222222222		wrong1782103079902@boutique.com	1 Wrong St		Wrong City	Wrong State								{}	{}	f	f	f	f	f	0.00				{}				{}		Pending		f	\N	0.00	0	0	2026-06-22 04:37:59.904	10.00	0	0.00	0.00	0.00	f	f	t
ee732cec-30a1-4c83-9238-5cc412f364d8	Coupon Test Boutique	Coupon Owner		0	Active	f	f	\N	0	0	9999999999		coupon1782103293970@boutique.com	Test		City	State								{}	{}	f	f	f	f	f	0.00				{}				{}		Pending		f	\N	0.00	0	0	2026-06-22 04:41:33.972	10.00	0	0.00	0.00	0.00	f	f	t
e4e28167-51e8-4ce9-826a-4c6f4449721c	Coupon Test Boutique	Coupon Owner		0	Active	f	f	\N	0	0	9999999999		coupon1782103626080@boutique.com	Test		City	State								{}	{}	f	f	f	f	f	0.00				{}				{}		Pending		f	\N	0.00	0	0	2026-06-22 04:47:06.083	10.00	0	0.00	0.00	0.00	f	f	t
0f9b0f5a-ad9f-418f-b24c-bb20df336626	Coupon Test Boutique	Coupon Owner		0	Active	f	f	\N	0	0	9999999999		coupon1782103789664@boutique.com	Test		City	State								{}	{}	f	f	f	f	f	0.00				{}				{}		Pending		f	\N	0.00	0	0	2026-06-22 04:49:49.666	10.00	0	0.00	0.00	0.00	f	f	t
41c3ef8d-4fba-4c34-8178-407099d4712f	Coupon Test Boutique	Coupon Owner		0	Active	f	f	\N	0	0	9999999999		coupon1782103808209@boutique.com	Test		City	State								{}	{}	f	f	f	f	f	0.00				{}				{}		Pending		f	\N	0.00	0	0	2026-06-22 04:50:08.211	10.00	0	0.00	0.00	0.00	f	f	t
e348a642-ac02-419e-9c90-dd8ed38616bf	Coupon Test Boutique	Coupon Owner		0	Active	f	f	\N	0	0	9999999999		coupon1782109447118@boutique.com	Test		City	State								{}	{}	f	f	f	f	f	0.00				{}				{}		Pending		f	\N	0.00	0	0	2026-06-22 06:24:07.12	10.00	0	0.00	0.00	0.00	f	f	t
\.


--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.cart_items (id, cart_id, product_id, variant_id, quantity, created_at) FROM stdin;
e8390429-0edf-4419-986e-b01e04ffad77	f2b19d18-e008-4493-8e75-4986819d3aa5	eda35e98-7d92-455e-8f2c-89e6d3648f11	3a96d63b-93eb-4631-9619-7392e42a7709	1	2026-06-18 18:37:23.449
1248dae4-ab84-4d6c-8cf9-9b3b108a1722	f2b19d18-e008-4493-8e75-4986819d3aa5	eda35e98-7d92-455e-8f2c-89e6d3648f11	d604659d-c292-4dd0-967d-e1611b0fb37c	15	2026-06-18 18:37:30.065
98f29083-a6a8-4f98-bed8-56e8c9c26f44	f2b19d18-e008-4493-8e75-4986819d3aa5	eda35e98-7d92-455e-8f2c-89e6d3648f11	\N	1	2026-06-18 18:37:57.837
b30e1bfb-2c32-489b-969f-1f0dfac0a36e	f2b19d18-e008-4493-8e75-4986819d3aa5	eda35e98-7d92-455e-8f2c-89e6d3648f11	\N	1	2026-06-18 18:37:58.429
49a89f13-de2e-4fbc-83f7-d315ba4b10f4	6c599958-ba42-41ba-9ea6-7db5f756caf8	0e1a9224-820b-4e11-92c8-0f76c57eab3f	97d3cfa3-57b5-47e8-ae55-17631860babf	5	2026-06-18 18:51:35.435
d0003717-3d98-4489-99aa-a13008635e6e	6c599958-ba42-41ba-9ea6-7db5f756caf8	e0c8a9b5-baac-4e90-9249-67c6d9fe659f	\N	1	2026-06-18 18:51:46.729
05422c5e-d7b2-4d1e-b758-42e91e5b3de9	6c599958-ba42-41ba-9ea6-7db5f756caf8	136987c9-d75e-4b3e-8106-afcdce03dea9	\N	1	2026-06-18 18:52:14.995
de09b27f-e99a-4d4b-a531-82589664c626	6c599958-ba42-41ba-9ea6-7db5f756caf8	136987c9-d75e-4b3e-8106-afcdce03dea9	\N	2	2026-06-18 18:52:15.505
176a1f09-b688-48fc-b584-5aa1363ff7fe	009b1cb8-13e4-4a6a-9c28-9bbb0a253725	405e28d5-4e8b-46f0-8f7a-8f0582c438c3	743d5892-97a6-4d89-b5ff-810668b6c243	5	2026-06-18 18:58:47.926
671ee07d-45c8-4b69-a974-bb86968e672f	009b1cb8-13e4-4a6a-9c28-9bbb0a253725	c8704420-9b8a-4ba0-a033-cc44c79b129e	\N	1	2026-06-18 18:58:53.876
ebb5b3b1-84f5-4dc6-bb67-4f01d2e7b92a	009b1cb8-13e4-4a6a-9c28-9bbb0a253725	23e62d17-4dd4-42aa-a106-5d4f9ebba6fc	\N	1	2026-06-18 18:59:08.676
704f1c4a-5e41-48d6-9b4a-24aa70a55c31	009b1cb8-13e4-4a6a-9c28-9bbb0a253725	23e62d17-4dd4-42aa-a106-5d4f9ebba6fc	\N	2	2026-06-18 18:59:08.928
336f8903-45ee-4c17-b026-e14446e3bcd6	6189fe64-6b76-46b8-b198-673168de9664	50b5e987-1a09-4714-8293-501d38452549	e489bcf4-42bc-4a45-b0ed-7fdd8345ae52	5	2026-06-18 19:02:25.555
6dbb4dde-48d5-403d-9493-2fbe6936cd4e	6189fe64-6b76-46b8-b198-673168de9664	16c6c907-ae69-46e6-b8fb-d6cc8470de7f	\N	1	2026-06-18 19:02:29.913
5028ede5-6fc2-4d24-af6f-889b182f7998	3020af92-7a61-49df-911a-d31716af0fab	aa35c61c-9cf8-4669-a0d2-0e583774bc3f	66ecd178-f1ea-46ab-a38c-5cbcdc714f6e	5	2026-06-18 19:04:55.634
81be5b0d-c422-4e32-9a1c-8a6a1ff84f75	3020af92-7a61-49df-911a-d31716af0fab	81b7df6a-5fa3-40f0-b361-bf0d9489fa0f	\N	1	2026-06-18 19:05:01.106
81c44e4e-793a-4850-bf8f-60c8fefe5d29	3020af92-7a61-49df-911a-d31716af0fab	ec6195ef-4dda-4fab-a1f1-b10a23c376d9	\N	5	2026-06-18 19:05:09.624
8efd4656-cc19-4ef5-bd53-cd600706c924	3020af92-7a61-49df-911a-d31716af0fab	e787b99c-23a4-40dd-b0e5-598467c46da8	c2af1f7b-96c4-48c7-a743-140a367eb2ba	1	2026-06-18 19:05:16.178
\.


--
-- Data for Name: carts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.carts (id, user_id, created_at, updated_at) FROM stdin;
f2b19d18-e008-4493-8e75-4986819d3aa5	2d115048-c9d1-4a8a-abad-dbfe023b081c	2026-06-18 18:37:18.935	2026-06-18 18:37:18.935
23f6f2c3-7fdc-4163-b36c-2cd72e2aea13	9249b3b6-c219-4c71-884a-c512bf257ecd	2026-06-18 18:37:45.185	2026-06-18 18:37:45.185
6c599958-ba42-41ba-9ea6-7db5f756caf8	7235d5ec-662e-4d1a-9220-d5aec3df6f66	2026-06-18 18:51:31.003	2026-06-18 18:51:31.003
e16a65d8-033e-43ce-9a55-3d9ca3fec8f8	73f26525-68f3-4a72-abc6-58f9ad8c17d3	2026-06-18 18:51:52.57	2026-06-18 18:51:52.57
009b1cb8-13e4-4a6a-9c28-9bbb0a253725	b4ea6dd1-727e-4950-9cc3-709429d9d089	2026-06-18 18:58:45.365	2026-06-18 18:58:45.365
5b3a34dc-c217-4f21-acd7-de36640f6e45	2d3265eb-1ddc-4ef2-8dfb-7da686576ba2	2026-06-18 18:58:58.422	2026-06-18 18:58:58.422
6189fe64-6b76-46b8-b198-673168de9664	c60f6ccc-fd11-4b3e-99fb-08d2a1aa563d	2026-06-18 19:02:24.018	2026-06-18 19:02:24.018
3c7ef12a-eb02-4a63-aea4-28b42f201a42	1de8d272-1b64-4c37-a054-588b565675f8	2026-06-18 19:02:33.52	2026-06-18 19:02:33.52
3020af92-7a61-49df-911a-d31716af0fab	34ba5271-bc6b-4310-8d71-5d1e986724cb	2026-06-18 19:04:53.149	2026-06-18 19:04:53.149
ff611346-49cb-49e0-a935-802220238a34	12b8ad26-5404-42c8-add0-87802fc31f4e	2026-06-18 19:05:05.149	2026-06-18 19:05:05.149
12de19bd-0254-4ebd-8a75-328dda5d9f5d	e00770ea-ef70-470f-9b29-1a5d6df59470	2026-06-25 07:02:35.996	2026-06-25 07:02:35.996
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.categories (id, name, description, image, sort_order, is_active, created_at, updated_at) FROM stdin;
b4566aff-8c5b-4a21-949d-ad00efd8b4cd	Sherwani & Indo-Western	Traditional sherwanis, Indo-western suits for grooms and guests	\N	1	t	2026-06-18 16:30:15.727	2026-06-18 16:30:15.727
410d9117-e13d-4669-96cb-b74026bdd8fa	Kurta & Ethnic Sets	Kurtas, pajamas, and coordinated ethnic sets for men	\N	3	t	2026-06-18 16:30:15.727	2026-06-18 16:30:15.727
6c781dcc-4836-4a88-b444-e0cc35d6fe40	Western & Indo-Western	Western suits, gowns, and fusion wear	\N	5	t	2026-06-18 16:30:15.727	2026-06-18 16:30:15.727
c6310a97-b478-4175-aa80-0ac8a98df22a	Kids Wear	Traditional and western wear for children	\N	6	t	2026-06-18 16:30:15.727	2026-06-18 16:30:15.727
e15d73aa-0bc6-4ce1-8fa0-b5ca874a65cf	Lehenga & Bridal Wear	Bridal lehengas, reception gowns, and wedding trousseau	\N	2	t	2026-06-18 16:30:15.727	2026-06-18 16:30:15.727
2419c616-444d-4e19-9244-ff28eb52c81d	Accessories	Turbans, stoles, jewelry, and other fashion accessories	\N	7	t	2026-06-18 16:30:15.727	2026-06-18 16:30:15.727
5b416adc-f64a-420e-8a50-30c4accf7ca8	Saree & Blouse	Handloom sarees, designer blouses, and saree draping	\N	4	t	2026-06-18 16:30:15.727	2026-06-18 16:30:15.727
4c568875-d770-4045-b0de-1e5bdfa743c7	TestCat 1781805715884	Owner product test category	\N	0	t	2026-06-18 18:01:58.641	2026-06-18 18:01:58.641
6f36e050-bde1-4390-aaaa-704d035a61e6	TestCat 1781805787366	Owner product test category	\N	0	t	2026-06-18 18:03:09.551	2026-06-18 18:03:09.551
ed7fd462-a008-4f79-9af5-306612f4ffd0	WishlistCat 1781806799102	\N	\N	0	t	2026-06-18 18:20:02.494	2026-06-18 18:20:02.494
7d82019f-54b6-47b2-af9c-53e5b74da244	WishlistCat 1781807120927	\N	\N	0	t	2026-06-18 18:25:24.367	2026-06-18 18:25:24.367
392abf64-af32-4e93-99ff-0e7243b54cfc	WishlistCat 1781807140175	\N	\N	0	t	2026-06-18 18:25:43.411	2026-06-18 18:25:43.411
0411488f-4570-4640-9531-fd242a384295	AuditCat 1781807824326	\N	\N	0	t	2026-06-18 18:37:07.081	2026-06-18 18:37:07.081
bde29a4d-e296-4b90-9422-8a8527e427ca	AuditCat 1781808669195	\N	\N	0	t	2026-06-18 18:51:12.634	2026-06-18 18:51:12.634
c9430425-b8a9-490e-8ea3-185fc4ef724f	AuditCat 1781809114924	\N	\N	0	t	2026-06-18 18:58:36.712	2026-06-18 18:58:36.712
42b3ee53-391f-441b-b8b6-73ecd43797c5	AuditCat 1781809334074	\N	\N	0	t	2026-06-18 19:02:15.92	2026-06-18 19:02:15.92
90a299fc-ffdb-45ca-ac79-76144b32e87c	AuditCat 1781809480752	\N	\N	0	t	2026-06-18 19:04:42.642	2026-06-18 19:04:42.642
f538a3af-2b1b-4df1-97d0-560ef35591cf	TestCat 1782103075444	Owner product test category	\N	0	t	2026-06-22 04:37:57.632	2026-06-22 04:37:57.632
6fe04503-3c5c-4299-83c4-5d197647938f	CouponCat1782103294561	\N	\N	0	t	2026-06-22 04:41:34.563	2026-06-22 04:41:34.563
4651ac3a-c744-4a22-ab99-01168f89d1d0	CouponCat1782103626646	\N	\N	0	t	2026-06-22 04:47:06.648	2026-06-22 04:47:06.648
5eec108d-0ff3-4117-9589-8aca4546a828	CouponCat1782103790210	\N	\N	0	t	2026-06-22 04:49:50.212	2026-06-22 04:49:50.212
bd7abb45-4fa2-49ba-935e-05aec1ebbf7f	CouponCat1782103808783	\N	\N	0	t	2026-06-22 04:50:08.784	2026-06-22 04:50:08.784
1d4bfbc7-154d-4ed8-bed0-2a6a2c54e794	CouponCat1782109447945	\N	\N	0	t	2026-06-22 06:24:07.947	2026-06-22 06:24:07.947
24fad22e-2b35-4ab8-95cc-50de54b4abab	StressCat1782112020354	\N	\N	0	t	2026-06-22 07:07:04.214	2026-06-22 07:07:04.214
\.


--
-- Data for Name: commerce_order_histories; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.commerce_order_histories (id, order_id, from_status, to_status, note, changed_by, changed_by_id, created_at) FROM stdin;
82ea61c1-9d9d-4d3f-a891-80fa9930cf61	42bc1fe2-d4f1-42d0-aa05-e9faac7be447	\N	PENDING	Order created	customer	e00770ea-ef70-470f-9b29-1a5d6df59470	2026-06-25 07:26:59.055
da11501e-7ebc-4bc9-bc63-bb6592e4b58e	0cbc45e3-3c91-4dcb-a0c3-0044f7858b0a	\N	PENDING	Order created	customer	e00770ea-ef70-470f-9b29-1a5d6df59470	2026-06-25 07:39:18.877
ea3b8604-80ea-41f3-93e0-e95ca1bd9422	42bc1fe2-d4f1-42d0-aa05-e9faac7be447	PENDING	CANCELLED	Reservation expired	system	\N	2026-06-25 08:31:00.317
592d74bc-0e9e-4304-89fa-8b9d0a00a13a	0cbc45e3-3c91-4dcb-a0c3-0044f7858b0a	PENDING	CANCELLED	Reservation expired	system	\N	2026-06-25 08:40:59.545
\.


--
-- Data for Name: commerce_order_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.commerce_order_items (id, order_id, product_id, variant_id, product_name, variant_name, sku, quantity, unit_price, total_price, image_url, attributes, discount_amount, tax_amount, tax_rate) FROM stdin;
78deea36-540f-442d-a062-be2478d56526	42bc1fe2-d4f1-42d0-aa05-e9faac7be447	dcd60b0d-54f7-4e92-8a22-99e4eb5edea3	4eeda7ca-e8da-4d94-96c2-0d7b83102c61	Stress Product 1782112020354	Stress Variant 1782112020354	\N	2	500.00	1000.00	\N	\N	0.00	0.00	\N
0b1390ad-7a9b-4412-81c2-d135d98c4ced	0cbc45e3-3c91-4dcb-a0c3-0044f7858b0a	dcd60b0d-54f7-4e92-8a22-99e4eb5edea3	\N	Stress Product 1782112020354	\N	\N	1	500.00	500.00	\N	\N	0.00	0.00	\N
\.


--
-- Data for Name: commerce_orders; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.commerce_orders (id, order_id, user_id, boutique_id, shipping_address_id, subtotal, discount_amount, shipping_amount, tax_amount, total_amount, coupon_id, status, payment_status, customer_note, admin_note, paid_at, shipped_at, delivered_at, cancelled_at, created_at, updated_at, cancellation_reason, commission_amount, currency, net_amount, out_for_delivery_at, packed_at, payment_details, payment_method, refund_amount, refunded_at, reservation_expires_at) FROM stdin;
76ae1dc1-9acf-4b69-9c39-efbbf0367810	CPN1782109497881	ec909aba-e303-45a3-9cea-531477024eff	e348a642-ac02-419e-9c90-dd8ed38616bf	\N	100.00	0.00	0.00	0.00	100.00	\N	PENDING	PENDING	\N	\N	\N	\N	\N	\N	2026-06-22 06:24:57.883	2026-06-22 06:24:57.883	\N	0.00	INR	\N	\N	\N	\N	\N	\N	\N	\N
de1a1cc8-960b-4ac4-b89f-6df29cf3094b	CPN21782109501987	ec909aba-e303-45a3-9cea-531477024eff	e348a642-ac02-419e-9c90-dd8ed38616bf	\N	100.00	0.00	0.00	0.00	100.00	\N	PENDING	PENDING	\N	\N	\N	\N	\N	\N	2026-06-22 06:25:01.988	2026-06-22 06:25:01.988	\N	0.00	INR	\N	\N	\N	\N	\N	\N	\N	\N
42bc1fe2-d4f1-42d0-aa05-e9faac7be447	ORD-20260625-0001	e00770ea-ef70-470f-9b29-1a5d6df59470	d31a980d-407e-4511-a5eb-436a186d5092	95255891-8ad3-4062-8647-cff02c80961e	1000.00	0.00	0.00	0.00	1000.00	\N	CANCELLED	PENDING	\N	\N	\N	\N	\N	2026-06-25 08:30:59.009	2026-06-25 07:26:56.789	2026-06-25 08:30:59.013	Reservation expired	0.00	INR	\N	\N	\N	\N	\N	\N	\N	2026-06-25 07:56:56.787
0cbc45e3-3c91-4dcb-a0c3-0044f7858b0a	ORD-20260625-0006	e00770ea-ef70-470f-9b29-1a5d6df59470	d31a980d-407e-4511-a5eb-436a186d5092	95255891-8ad3-4062-8647-cff02c80961e	500.00	0.00	0.00	0.00	500.00	\N	CANCELLED	PENDING	\N	\N	\N	\N	\N	2026-06-25 08:40:59.142	2026-06-25 07:39:16.937	2026-06-25 08:40:59.145	Reservation expired	0.00	INR	\N	\N	\N	\N	\N	\N	\N	2026-06-25 08:09:16.934
\.


--
-- Data for Name: commerce_payments; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.commerce_payments (id, commerce_order_id, amount, method, status, razorpay_order_id, razorpay_payment_id, razorpay_signature, refund_id, refund_amount, refund_reason, created_at) FROM stdin;
\.


--
-- Data for Name: coupon_usages; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.coupon_usages (id, coupon_id, user_id, order_id, created_at) FROM stdin;
\.


--
-- Data for Name: coupons; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.coupons (id, code, boutique_id, description, discount_type, discount_value, min_order_amount, max_discount, max_uses, current_uses, max_uses_per_user, is_active, starts_at, expires_at, created_at, applicable_ids, applicable_type, first_order_only) FROM stdin;
2739aebc-4bea-431f-a41b-15d802087227	OWNER20	\N	20% off	PERCENTAGE	20.00	\N	300.00	0	0	1	t	\N	\N	2026-06-22 04:47:39.392	{}	ALL	f
fcf81249-ffab-4e94-8c62-d55f6a4dd1a1	SAVE10_86716	\N	10% off everything	PERCENTAGE	10.00	500.00	200.00	100	0	1	t	\N	\N	2026-06-22 04:49:52.48	{}	ALL	f
160252fd-b096-4f06-8195-1fecd3dc36c4	SAVE10_66643	\N	Updated: 10% off	PERCENTAGE	10.00	500.00	250.00	100	1	1	f	\N	\N	2026-06-22 04:54:33.044	{}	ALL	f
c7c58740-a9fd-4e78-b9e4-4e462d168803	OWNER20_66643	\N	20% off	PERCENTAGE	20.00	\N	300.00	0	0	1	t	\N	\N	2026-06-22 04:54:45.79	{}	ALL	f
674eb8ef-66ce-4281-8a32-8cccec57fac5	SAVE10_57200	\N	Updated: 10% off	PERCENTAGE	10.00	500.00	250.00	100	1	1	f	\N	\N	2026-06-22 04:51:03.449	{}	ALL	f
93b4c6da-dae8-45b9-835c-d175ace33641	SAVE10_5091	\N	Updated: 10% off	PERCENTAGE	10.00	500.00	250.00	100	0	1	t	\N	\N	2026-06-22 04:50:11.054	{}	ALL	f
e9ab34de-e645-4b71-abd6-1d0132dad00c	SAVE10_1782104425453	\N	Updated: 10% off	PERCENTAGE	10.00	500.00	250.00	100	1	1	f	\N	\N	2026-06-22 05:00:32.207	{}	ALL	f
94674543-2ecb-458c-bd98-a7ca24bf0008	OWNER20_1782104425453	\N	20% off	PERCENTAGE	20.00	\N	300.00	0	0	1	t	\N	\N	2026-06-22 05:00:44.843	{}	ALL	f
b17551b9-330f-47a7-a7eb-b7199899c1ae	BOUTIQUE20_57200	\N	\N	PERCENTAGE	10.00	\N	\N	0	0	1	t	\N	\N	2026-06-22 04:51:15.685	{}	ALL	f
0625f01f-4823-463f-a49f-482fd77fb435	LIMITED	\N	\N	FIXED	20.00	\N	\N	1	0	1	t	\N	\N	2026-06-22 04:43:24.772	{}	ALL	f
9f41ead3-00f2-4bad-94ab-1c4da697cfc4	BOUTIQUE20_5091	41c3ef8d-4fba-4c34-8178-407099d4712f	\N	PERCENTAGE	10.00	\N	\N	0	0	1	t	\N	\N	2026-06-22 04:50:22.501	{}	ALL	f
ec6c231a-638c-46b7-ad4b-a066fbbdc3cd	OWNER20_5091	41c3ef8d-4fba-4c34-8178-407099d4712f	20% off	PERCENTAGE	20.00	\N	300.00	0	0	1	t	\N	\N	2026-06-22 04:50:23.888	{}	ALL	f
a826f958-2855-48b5-878a-46210e5476d3	OWNER20_57200	\N	20% off	PERCENTAGE	20.00	\N	300.00	0	0	1	t	\N	\N	2026-06-22 04:51:16.907	{}	ALL	f
560d9beb-3e95-4aa1-be7d-343ecf235188	SAVE10	\N	Updated: 10% off	PERCENTAGE	10.00	500.00	250.00	100	1	1	t	\N	\N	2026-06-22 04:42:59.445	{}	ALL	f
4108f362-8a98-4bf0-a608-d5c5c430af7c	OWNER20	\N	20% off	PERCENTAGE	20.00	\N	300.00	0	0	1	t	\N	\N	2026-06-22 04:43:15.598	{}	ALL	f
3a14166d-4f4f-41a4-a732-7b48a9cd9a95	SAVE10_22130	\N	Updated: 10% off	PERCENTAGE	10.00	500.00	250.00	100	1	1	f	\N	\N	2026-06-22 04:55:28.22	{}	ALL	f
22e8e613-0a76-4610-92ae-aa5fc7bce8df	SAVE10_1782106118384	\N	Updated: 10% off	PERCENTAGE	10.00	500.00	250.00	100	1	1	t	\N	\N	2026-06-22 05:28:44.296	{}	ALL	f
29c8501d-0555-4173-af2d-81f02c154319	OWNER20_1782106118384	\N	20% off	PERCENTAGE	20.00	\N	300.00	0	0	1	t	\N	\N	2026-06-22 05:28:56.053	{}	ALL	f
fbb7a1ed-cdbf-4a9c-9d30-a582b7e7078e	LIMITED_22130	\N	\N	FIXED	20.00	\N	\N	1	0	1	t	\N	\N	2026-06-22 04:55:51.652	{}	ALL	f
bfba183f-b384-42c7-9abf-1cff03103003	LIMITED_57200	\N	\N	FIXED	20.00	\N	\N	1	0	1	t	\N	\N	2026-06-22 04:51:26.697	{}	ALL	f
5cd3d5f8-31a6-4ebf-8855-21af8efea101	OWNER20_22130	\N	20% off	PERCENTAGE	20.00	\N	300.00	0	0	1	t	\N	\N	2026-06-22 04:55:41.737	{}	ALL	f
70e3e35e-f844-482e-af83-f0f8b2f85c78	OWNER20_1782104865368	\N	20% off	PERCENTAGE	20.00	\N	300.00	0	0	1	t	\N	\N	2026-06-22 05:08:03.377	{}	ALL	f
ecfa04b7-e4ff-4acb-bf5b-42ea49966e33	LIMITED_1782104697495	\N	\N	FIXED	20.00	\N	\N	1	0	1	t	\N	\N	2026-06-22 05:05:25.897	{}	ALL	f
1b46d7a1-ea1c-4079-a257-e58c805785a2	OWNER20	\N	20% off	PERCENTAGE	20.00	\N	300.00	0	0	1	t	\N	\N	2026-06-22 04:44:31.015	{}	ALL	f
f8d102a9-4cc9-40cb-a7e9-96e757212fe9	LIMITED_1782107635197	\N	\N	FIXED	20.00	\N	\N	1	1	1	t	\N	\N	2026-06-22 05:54:26.644	{}	ALL	f
0fa5465d-f287-4ad3-b399-68fa46c5410e	SAVE10_1782104697495	\N	Updated: 10% off	PERCENTAGE	10.00	500.00	250.00	100	1	1	t	\N	\N	2026-06-22 05:05:03.953	{}	ALL	f
8d8e8fa4-3e30-4f40-9659-03805e301cd5	OWNER20	\N	20% off	PERCENTAGE	20.00	\N	300.00	0	0	1	t	\N	\N	2026-06-22 04:45:55.884	{}	ALL	f
d9f6c4f7-401e-4702-8862-0ef7f45d6afc	OWNER20_1782104697495	\N	20% off	PERCENTAGE	20.00	\N	300.00	0	0	1	t	\N	\N	2026-06-22 05:05:15.978	{}	ALL	f
4d303e61-47b5-4cf0-bf79-ba9c3ac4ae30	TEMP	\N	\N	FIXED	50.00	\N	\N	0	0	1	t	\N	\N	2026-06-22 04:47:11.982	{}	ALL	f
3ff0ab5d-c392-4882-8b62-81fc8aa14aa1	LIMITED_1727	\N	\N	FIXED	20.00	\N	\N	1	0	1	t	\N	\N	2026-06-22 04:53:52.106	{}	ALL	f
ace5c518-876e-4733-858c-bb79bb62977a	LIMITED_57869	\N	\N	FIXED	20.00	\N	\N	1	0	1	t	\N	\N	2026-06-22 04:58:09.73	{}	ALL	f
41fc0b8d-7c60-49fe-91d3-14cc19195a51	SAVE10_57869	\N	Updated: 10% off	PERCENTAGE	10.00	500.00	250.00	100	1	1	f	\N	\N	2026-06-22 04:57:44.93	{}	ALL	f
e9876c67-a8e5-4104-a2ce-e7307a09ae69	SAVE10_1782107635197	\N	Updated: 10% off	PERCENTAGE	10.00	500.00	250.00	100	1	1	t	\N	\N	2026-06-22 05:54:02.203	{}	ALL	f
f84e6b07-8a12-405d-b243-6076939f3ebe	OWNER20_57869	\N	20% off	PERCENTAGE	20.00	\N	300.00	0	0	1	t	\N	\N	2026-06-22 04:57:59.79	{}	ALL	f
afe7363e-3895-4f4c-987c-7f48a37a27a5	OWNER20_1782107635197	\N	20% off	PERCENTAGE	20.00	\N	300.00	0	0	1	t	\N	\N	2026-06-22 05:54:15.7	{}	ALL	f
86296c2f-274a-4699-b016-51c27a650a4e	LIMITED_1782104360950	\N	\N	FIXED	20.00	\N	\N	1	0	1	t	\N	\N	2026-06-22 04:59:48.569	{}	ALL	f
c9c5983c-8b25-4d92-944c-cf14caa41fe3	SAVE10_1727	\N	Updated: 10% off	PERCENTAGE	10.00	500.00	250.00	100	1	1	f	\N	\N	2026-06-22 04:53:28.935	{}	ALL	f
e1ea8675-5eb9-458c-9944-a8cae4ea6d1f	OWNER20_1727	\N	20% off	PERCENTAGE	20.00	\N	300.00	0	0	1	t	\N	\N	2026-06-22 04:53:42.374	{}	ALL	f
ed915b26-02aa-4d9f-8417-ca76f04b0c7a	OWNER20_1782107740544	\N	20% off	PERCENTAGE	20.00	\N	300.00	0	0	1	t	\N	\N	2026-06-22 05:56:01.332	{}	ALL	f
461a3039-7094-44fe-b8ea-ba2a0aba39cb	SAVE10_1782104802248	\N	Updated: 10% off	PERCENTAGE	10.00	500.00	250.00	100	1	1	t	\N	\N	2026-06-22 05:06:48.658	{}	ALL	f
1e1eeb78-9d88-4c1d-a874-693d2665d1e9	LIMITED_66643	\N	\N	FIXED	20.00	\N	\N	1	0	1	t	\N	\N	2026-06-22 04:54:55.543	{}	ALL	f
d8e5363c-2d69-4d66-93ba-61c69b3e103d	OWNER20_1782104802248	\N	20% off	PERCENTAGE	20.00	\N	300.00	0	0	1	t	\N	\N	2026-06-22 05:07:00.991	{}	ALL	f
eae1c0b5-e431-434c-b156-4c966c074437	SAVE10_1782104360950	\N	Updated: 10% off	PERCENTAGE	10.00	500.00	250.00	100	1	1	f	\N	\N	2026-06-22 04:59:27.369	{}	ALL	f
68e127cf-c3b3-43a8-9ae7-e62dc9e2cc27	OWNER20_1782104360950	\N	20% off	PERCENTAGE	20.00	\N	300.00	0	0	1	t	\N	\N	2026-06-22 04:59:39.302	{}	ALL	f
b0706e7e-54e5-40f5-9f08-eda5a3870c3c	SAVE10_1782107740544	\N	Updated: 10% off	PERCENTAGE	10.00	500.00	250.00	100	1	1	t	\N	\N	2026-06-22 05:55:47.58	{}	ALL	f
0cb172f7-9606-4190-a29b-5e06f607a134	LIMITED_1782104425453	\N	\N	FIXED	20.00	\N	\N	1	0	1	t	\N	\N	2026-06-22 05:00:54.566	{}	ALL	f
e8516ff2-ca0e-414f-b408-1c7d721a80d4	OWNER20_1782109438041	e348a642-ac02-419e-9c90-dd8ed38616bf	20% off	PERCENTAGE	20.00	\N	300.00	0	0	1	t	\N	\N	2026-06-22 06:24:36.62	{}	ALL	f
583f1ff9-60b3-45e7-b8dd-677c4d0fdb0d	SAVE10_1782104865368	\N	Updated: 10% off	PERCENTAGE	10.00	500.00	250.00	100	1	1	t	\N	\N	2026-06-22 05:07:51.505	{}	ALL	f
26b06987-eee5-4f86-8e09-c87f5bbef812	CONC_1782109438041	\N	\N	FIXED	10.00	\N	\N	999	1	1	t	\N	\N	2026-06-22 06:25:07.852	{}	ALL	f
67764fa5-90e1-40d8-b58c-b86902415ad9	CONC3_1782109438041	\N	\N	FIXED	10.00	\N	\N	3	2	999	t	\N	\N	2026-06-22 06:25:13.481	{}	ALL	f
0ee416d7-5fbb-459c-8356-4b636e273c3e	SAVE10_1782109438041	\N	Updated: 10% off	PERCENTAGE	10.00	500.00	250.00	100	1	1	t	\N	\N	2026-06-22 06:24:13.338	{}	ALL	f
e3ec7e0e-4ef2-42ae-b35c-d90232d6060a	SAVE10_1782109715044	\N	Updated: 10% off	PERCENTAGE	10.00	500.00	250.00	100	1	1	t	\N	\N	2026-06-22 06:28:42.326	{}	ALL	f
9b37ab47-b3e8-4d9b-9797-3a83fb569443	OWNER20_1782109715044	\N	20% off	PERCENTAGE	20.00	\N	300.00	0	0	1	t	\N	\N	2026-06-22 06:28:56.782	{}	ALL	f
16c5f3e9-bd9e-4aaf-a639-375332bff28b	SAVE10_1782372685020	\N	Updated: 10% off	PERCENTAGE	10.00	500.00	250.00	100	1	1	t	\N	\N	2026-06-25 07:31:29.824	{}	ALL	f
a526946f-21c6-43a6-9ec4-18111dcb6c25	OWNER20_1782372685020	\N	20% off	PERCENTAGE	20.00	\N	300.00	0	0	1	t	\N	\N	2026-06-25 07:31:38.824	{}	ALL	f
1471d059-4d25-4f74-ad79-419cd5d8dc21	SAVE10_1782110282541	\N	Updated: 10% off	PERCENTAGE	10.00	500.00	250.00	100	1	1	t	\N	\N	2026-06-22 06:38:09.603	{}	ALL	f
2893c5f6-d7c1-4570-9a6b-33e26610a86e	OWNER20_1782110282541	\N	20% off	PERCENTAGE	20.00	\N	300.00	0	0	1	t	\N	\N	2026-06-22 06:38:23.362	{}	ALL	f
bcaa6fdd-cc10-459b-ad60-e3813a2463a1	SAVE10_1782109795783	\N	Updated: 10% off	PERCENTAGE	10.00	500.00	250.00	100	1	1	t	\N	\N	2026-06-22 06:30:03.119	{}	ALL	f
515cfd8f-d3e0-4fb8-aa9a-802a3d4bb5c8	OWNER20_1782109795783	\N	20% off	PERCENTAGE	20.00	\N	300.00	0	0	1	t	\N	\N	2026-06-22 06:30:17.919	{}	ALL	f
2d555d61-63f3-4958-ad82-ef781f7fe372	SAVE10_1782109883404	\N	Updated: 10% off	PERCENTAGE	10.00	500.00	250.00	100	1	1	t	\N	\N	2026-06-22 06:31:31.019	{}	ALL	f
c86383c7-07b0-4a33-a27b-d2518c634337	OWNER20_1782109883404	\N	20% off	PERCENTAGE	20.00	\N	300.00	0	0	1	t	\N	\N	2026-06-22 06:31:45.038	{}	ALL	f
292dfa30-5104-42d2-9225-5ee3718f4421	SAVE10_1782109981898	\N	Updated: 10% off	PERCENTAGE	10.00	500.00	250.00	100	1	1	t	\N	\N	2026-06-22 06:33:09.05	{}	ALL	f
d7b59ac3-670e-46e3-acd7-e5e139f77774	OWNER20_1782109981898	\N	20% off	PERCENTAGE	20.00	\N	300.00	0	0	1	t	\N	\N	2026-06-22 06:33:23.201	{}	ALL	f
00fb1276-084d-403a-a5a0-f34249938298	SAVE10_1782111768012	\N	Updated: 10% off	PERCENTAGE	10.00	500.00	250.00	100	1	1	t	\N	\N	2026-06-22 07:02:56.015	{}	ALL	f
81f8b425-194d-4adf-a20b-d428f9240dc9	OWNER20_1782111768012	\N	20% off	PERCENTAGE	20.00	\N	300.00	0	0	1	t	\N	\N	2026-06-22 07:03:11.026	{}	ALL	f
7b5b053d-426e-431e-a362-85c825271ef0	SAVE10_1782371853472	\N	Updated: 10% off	PERCENTAGE	10.00	500.00	250.00	100	1	1	t	\N	\N	2026-06-25 07:17:38.422	{}	ALL	f
365e6af1-8c42-4a13-a6a8-1b1e45129bf7	OWNER20_1782371853472	\N	20% off	PERCENTAGE	20.00	\N	300.00	0	0	1	t	\N	\N	2026-06-25 07:17:47.028	{}	ALL	f
\.


--
-- Data for Name: custom_plan_requests; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.custom_plan_requests (id, boutique_id, owner_id, requested_designs, requested_orders, requested_gallery, requested_staff, reason, status, created_at) FROM stdin;
\.


--
-- Data for Name: customer_addresses; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.customer_addresses (id, user_id, address_line1, address_line2, city, state, pincode, is_default, created_at) FROM stdin;
\.


--
-- Data for Name: customer_notifications; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.customer_notifications (id, customer_id, type, title, message, entity_type, entity_id, is_read, metadata, created_at, updated_at) FROM stdin;
69520498-7b7e-4543-ad05-e508d630de59	e00770ea-ef70-470f-9b29-1a5d6df59470	ORDER_PLACED	Order Placed Successfully	Your order ORD-20260625-0001 has been placed. Complete payment to confirm.	commerce_order	ORD-20260625-0001	f	null	2026-06-25 07:27:00.097	2026-06-25 07:27:00.097
417b6b04-0ade-4417-ab53-6013639e705c	e00770ea-ef70-470f-9b29-1a5d6df59470	ORDER_PLACED	Order Placed Successfully	Your order ORD-20260625-0006 has been placed. Complete payment to confirm.	commerce_order	ORD-20260625-0006	f	null	2026-06-25 07:39:19.936	2026-06-25 07:39:19.936
\.


--
-- Data for Name: delivery_tracking; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.delivery_tracking (id, order_id, carrier, tracking_number, status, location, note, estimated_delivery, delivered_at, created_at, tracking_url) FROM stdin;
\.


--
-- Data for Name: delivery_tracking_history; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.delivery_tracking_history (id, tracking_id, from_status, to_status, note, created_at) FROM stdin;
\.


--
-- Data for Name: designs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.designs (id, boutique_id, name, description, category, images, price, tags, is_featured, is_available, is_deleted, created_at, is_ready_made) FROM stdin;
0a821036-397c-47dc-bbca-2de894aa5655	9713de00-8c88-48c2-9ecc-902b86954f96	Organza	a variation in spelling for a saree (or sari), a traditional garment from the Indian subcontinent, often featured in online retail collections	Saree	{}	500.00	{}	f	t	t	2026-04-30 09:13:48.24	f
e27e6d01-211e-429a-8dec-eb5128d73245	9713de00-8c88-48c2-9ecc-902b86954f96	Simulator 	a variation in spelling for a saree (or sari), a traditional garment from the Indian subcontinent, often featured in online retail collections	Blouse	{https://vs-boutique-images.s3.ap-south-1.amazonaws.com/uploads/gallery/1777984773846-1862cac3-73a2-472e-8d1f-869063884817.png}	600.00	{}	f	t	f	2026-04-30 09:22:05.782	f
acfbc0e2-0851-401f-953e-7a28293167c3	9713de00-8c88-48c2-9ecc-902b86954f96	google	pink	Blouse	{https://vs-boutique-images.s3.ap-south-1.amazonaws.com/uploads/gallery/1777984860863-ee08c8a3-416f-4f0a-ab44-891d0f560f05.png}	400.00	{}	f	t	f	2026-05-05 12:41:06.923	f
\.


--
-- Data for Name: exchange_requests; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.exchange_requests (id, exchange_number, order_id, order_item_id, customer_id, reason, notes, status, requested_at, approved_at, completed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: measurements; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.measurements (id, user_id, chest, waist, length, shoulder, sleeve_length, neck, notes, updated_at) FROM stdin;
51379918-1281-468f-ae12-3caa39869ead	05969429-152d-4041-b84d-edc8786bbde3	38.50	34.00	28.00	\N	\N	\N		2026-06-05 02:57:10.88
\.


--
-- Data for Name: notification_campaigns; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.notification_campaigns (id, name, title, message, target_type, target_value, channels, scheduled_at, status, created_at, updated_at) FROM stdin;
df7617fb-478c-4f09-b36a-9f4e0051ad61	VIP Customer Update Campaign	Special VIP Offer	Exclusive 20% discount on boutique designer dresses.	VIP_CUSTOMERS	\N	{push,email}	\N	completed	2026-06-04 19:59:10.711	2026-06-04 19:59:10.711
\.


--
-- Data for Name: notification_receipts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.notification_receipts (id, notification_id, recipient_owner_id, recipient_user_id, sent_at, delivered_at, opened_at, clicked_at) FROM stdin;
\.


--
-- Data for Name: notification_templates; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.notification_templates (id, name, subject, body, channels, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.notifications (id, recipient_role, recipient_id, recipient_user_id, boutique_id, title, message, type, status, is_read, scheduled_at, is_broadcast, created_at, target_type, target_value, sent_push, sent_email, sent_sms, campaign_id) FROM stdin;
b7f61e79-60c2-43b3-88e5-4695ad8a4798	owner	\N	\N	9713de00-8c88-48c2-9ecc-902b86954f96	Appointment Status Update: Completed	Your booking request for 7/6/2026 is Completed. Note: Design consultation finished and order converted successfully	SYSTEM	sent	f	\N	f	2026-06-04 19:22:02.437	\N	\N	f	f	f	\N
9e63eca0-d66a-4fcc-99d5-15b2d8b64af4	owner	\N	\N	9713de00-8c88-48c2-9ecc-902b86954f96	Appointment Status Update: Completed	Your booking request for 7/6/2026 is Completed. Note: Design consultation finished and order converted successfully	SYSTEM	sent	f	\N	f	2026-06-04 19:23:16.812	\N	\N	f	f	f	\N
212a1c5b-648b-49f8-8ef2-44bc49168ecf	owner	\N	\N	9713de00-8c88-48c2-9ecc-902b86954f96	Appointment Status Update: Completed	Your booking request for 7/6/2026 is Completed. Note: Design consultation finished and order converted successfully	SYSTEM	sent	f	\N	f	2026-06-04 19:23:42.805	\N	\N	f	f	f	\N
b7b626d0-246e-4cf8-affa-6b5c90b9138e	owner	\N	\N	9713de00-8c88-48c2-9ecc-902b86954f96	Appointment Status Update: Completed	Your booking request for 7/6/2026 is Completed. Note: Design consultation finished and order converted successfully	SYSTEM	sent	f	\N	f	2026-06-04 19:23:54.449	\N	\N	f	f	f	\N
3a40ddc5-7e14-48b9-a1aa-3e2f2a355aea	owner	\N	\N	9713de00-8c88-48c2-9ecc-902b86954f96	Appointment Status Update: Completed	Your booking request for 7/6/2026 is Completed. Note: Design consultation finished and order converted successfully	SYSTEM	sent	f	\N	f	2026-06-04 19:26:50.781	\N	\N	f	f	f	\N
\.


--
-- Data for Name: order_histories; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.order_histories (id, order_id, status, note, "timestamp") FROM stdin;
\.


--
-- Data for Name: order_sequences; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.order_sequences (id, date, last_number, created_at) FROM stdin;
86310cb4-bd6e-4f87-abd7-27d1b87e7c0f	2026-06-22	20	2026-06-22 03:49:05.611
94c28afb-9ee7-4ee6-93b6-beb601069951	2026-06-25	6	2026-06-25 07:26:56.366
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.orders (id, order_id, boutique_id, owner_id, customer_name, customer_phone, customer_address, design_id, design_name, category, measurement_bust, measurement_waist, measurement_hip, measurement_shoulder, measurement_sleeve_length, measurement_blouse_length, measurement_notes, price, advance_paid, remaining_amount, order_status, payment_status, order_date, expected_delivery_date, actual_delivery_date, is_deleted, created_at, updated_at) FROM stdin;
a06444b3-8f9a-40ca-a1e1-835fb4f90f6d	ORD-1780628224464-0	3b360640-f08b-460c-b06e-4f4ba821e298	d3350b54-b045-480f-99c0-a62951f906a1	Aranya Sen	9876543200	\N	0a821036-397c-47dc-bbca-2de894aa5655	Organza	Saree	\N	\N	\N	\N	\N	\N	\N	12000.00	12000.00	0.00	delivered	captured	2026-06-05 02:57:04.464	\N	\N	f	2026-06-05 02:57:04.464	2026-06-05 02:57:04.464
18438d1a-646f-48b2-9cab-6cd0d41c16f1	ORD-1780628224464-1	3b360640-f08b-460c-b06e-4f4ba821e298	d3350b54-b045-480f-99c0-a62951f906a1	Bhavya Rao	9876543201	\N	0a821036-397c-47dc-bbca-2de894aa5655	Organza	Saree	\N	\N	\N	\N	\N	\N	\N	8000.00	8000.00	0.00	pending	captured	2026-06-05 02:57:04.464	\N	\N	f	2026-06-05 02:57:04.464	2026-06-05 02:57:04.464
aa79a373-0486-4c02-8099-6fefdbbbd010	ORD-1780628224464-2	3b360640-f08b-460c-b06e-4f4ba821e298	d3350b54-b045-480f-99c0-a62951f906a1	Deepika Padukone	9876543202	\N	0a821036-397c-47dc-bbca-2de894aa5655	Organza	Saree	\N	\N	\N	\N	\N	\N	\N	5000.00	5000.00	0.00	delivered	captured	2026-06-05 02:57:04.464	\N	\N	f	2026-06-05 02:57:04.464	2026-06-05 02:57:04.464
e2341de8-1a28-4866-a724-dc787c498997	ORD-1780628224464-3	3b360640-f08b-460c-b06e-4f4ba821e298	d3350b54-b045-480f-99c0-a62951f906a1	Esha Deol	9876543203	\N	0a821036-397c-47dc-bbca-2de894aa5655	Organza	Saree	\N	\N	\N	\N	\N	\N	\N	15000.00	0.00	15000.00	pending	failed	2026-06-05 02:57:04.464	\N	\N	f	2026-06-05 02:57:04.464	2026-06-05 02:57:04.464
daf4de09-6e65-4a48-a9fe-3b5044280e33	ORD-1780541824464-4	3b360640-f08b-460c-b06e-4f4ba821e298	d3350b54-b045-480f-99c0-a62951f906a1	Gauri Khan	9876543204	\N	0a821036-397c-47dc-bbca-2de894aa5655	Organza	Saree	\N	\N	\N	\N	\N	\N	\N	10000.00	10000.00	0.00	delivered	captured	2026-06-04 02:57:04.464	\N	\N	f	2026-06-04 02:57:04.464	2026-06-04 02:57:04.464
d2ffc7af-bf10-459b-aec7-0dd8cd132ce2	ORD-1780541824464-5	3b360640-f08b-460c-b06e-4f4ba821e298	d3350b54-b045-480f-99c0-a62951f906a1	Ishita Sharma	9876543205	\N	0a821036-397c-47dc-bbca-2de894aa5655	Organza	Saree	\N	\N	\N	\N	\N	\N	\N	12000.00	12000.00	0.00	delivered	captured	2026-06-04 02:57:04.464	\N	\N	f	2026-06-04 02:57:04.464	2026-06-04 02:57:04.464
bb55fdf1-2125-4303-a935-c08ccf736fe5	ORD-1780369024464-6	3b360640-f08b-460c-b06e-4f4ba821e298	d3350b54-b045-480f-99c0-a62951f906a1	Kriti Sanon	9876543206	\N	0a821036-397c-47dc-bbca-2de894aa5655	Organza	Saree	\N	\N	\N	\N	\N	\N	\N	15000.00	15000.00	0.00	delivered	captured	2026-06-02 02:57:04.464	\N	\N	f	2026-06-02 02:57:04.464	2026-06-02 02:57:04.464
61afc9a3-e7df-43b5-8176-1b0728259330	ORD-1780196224464-7	3b360640-f08b-460c-b06e-4f4ba821e298	d3350b54-b045-480f-99c0-a62951f906a1	Meera Rajput	9876543207	\N	0a821036-397c-47dc-bbca-2de894aa5655	Organza	Saree	\N	\N	\N	\N	\N	\N	\N	9000.00	9000.00	0.00	delivered	captured	2026-05-31 02:57:04.464	\N	\N	f	2026-05-31 02:57:04.464	2026-05-31 02:57:04.464
92755504-baa2-4cc5-9d4d-9915f08be21f	ORD-1779937024464-8	3b360640-f08b-460c-b06e-4f4ba821e298	d3350b54-b045-480f-99c0-a62951f906a1	Neha Dhupia	9876543208	\N	0a821036-397c-47dc-bbca-2de894aa5655	Organza	Saree	\N	\N	\N	\N	\N	\N	\N	22000.00	22000.00	0.00	delivered	captured	2026-05-28 02:57:04.464	\N	\N	f	2026-05-28 02:57:04.464	2026-05-28 02:57:04.464
c296e7a1-d9a6-474a-a77c-6622a06f9ce8	ORD-1779764224464-9	3b360640-f08b-460c-b06e-4f4ba821e298	d3350b54-b045-480f-99c0-a62951f906a1	Priyanka Chopra	9876543209	\N	0a821036-397c-47dc-bbca-2de894aa5655	Organza	Saree	\N	\N	\N	\N	\N	\N	\N	18000.00	18000.00	0.00	delivered	captured	2026-05-26 02:57:04.464	\N	\N	f	2026-05-26 02:57:04.464	2026-05-26 02:57:04.464
8d91be37-2788-4bd5-afe7-762d98d0aa9a	ORD-1779591424464-10	3b360640-f08b-460c-b06e-4f4ba821e298	d3350b54-b045-480f-99c0-a62951f906a1	Rhea Chakraborty	9876543210	\N	0a821036-397c-47dc-bbca-2de894aa5655	Organza	Saree	\N	\N	\N	\N	\N	\N	\N	14000.00	14000.00	0.00	pending	captured	2026-05-24 02:57:04.464	\N	\N	f	2026-05-24 02:57:04.464	2026-05-24 02:57:04.464
37764aa1-23b7-4875-9756-281a34c58a14	ORD-1779332224464-11	3b360640-f08b-460c-b06e-4f4ba821e298	d3350b54-b045-480f-99c0-a62951f906a1	Shraddha Kapoor	9876543211	\N	0a821036-397c-47dc-bbca-2de894aa5655	Organza	Saree	\N	\N	\N	\N	\N	\N	\N	30000.00	30000.00	0.00	delivered	captured	2026-05-21 02:57:04.464	\N	\N	f	2026-05-21 02:57:04.464	2026-05-21 02:57:04.464
e23b2747-9259-4425-a19c-3814d94da88a	ORD-1779073024464-12	3b360640-f08b-460c-b06e-4f4ba821e298	d3350b54-b045-480f-99c0-a62951f906a1	Taapsee Pannu	9876543212	\N	0a821036-397c-47dc-bbca-2de894aa5655	Organza	Saree	\N	\N	\N	\N	\N	\N	\N	25000.00	25000.00	0.00	delivered	captured	2026-05-18 02:57:04.464	\N	\N	f	2026-05-18 02:57:04.464	2026-05-18 02:57:04.464
0f1e111b-f026-47b5-953d-f51a204b0bc9	ORD-1778900224464-13	3b360640-f08b-460c-b06e-4f4ba821e298	d3350b54-b045-480f-99c0-a62951f906a1	Vidya Balan	9876543213	\N	0a821036-397c-47dc-bbca-2de894aa5655	Organza	Saree	\N	\N	\N	\N	\N	\N	\N	8500.00	8500.00	0.00	delivered	captured	2026-05-16 02:57:04.464	\N	\N	f	2026-05-16 02:57:04.464	2026-05-16 02:57:04.464
bc3274ba-cc30-4a1f-9113-d29d1ab5e1d2	ORD-1778727424464-14	3b360640-f08b-460c-b06e-4f4ba821e298	d3350b54-b045-480f-99c0-a62951f906a1	Yami Gautam	9876543214	\N	0a821036-397c-47dc-bbca-2de894aa5655	Organza	Saree	\N	\N	\N	\N	\N	\N	\N	11000.00	11000.00	0.00	delivered	captured	2026-05-14 02:57:04.464	\N	\N	f	2026-05-14 02:57:04.464	2026-05-14 02:57:04.464
55d00626-0ebd-40fd-ab46-7e7b61063a2e	ORD-1778468224464-15	3b360640-f08b-460c-b06e-4f4ba821e298	d3350b54-b045-480f-99c0-a62951f906a1	Aranya Sen	9876543200	\N	0a821036-397c-47dc-bbca-2de894aa5655	Organza	Saree	\N	\N	\N	\N	\N	\N	\N	16000.00	16000.00	0.00	delivered	captured	2026-05-11 02:57:04.464	\N	\N	f	2026-05-11 02:57:04.464	2026-05-11 02:57:04.464
cc57d890-2688-4dd1-92e9-b5d986824ddf	ORD-1778209024464-16	3b360640-f08b-460c-b06e-4f4ba821e298	d3350b54-b045-480f-99c0-a62951f906a1	Bhavya Rao	9876543201	\N	0a821036-397c-47dc-bbca-2de894aa5655	Organza	Saree	\N	\N	\N	\N	\N	\N	\N	45000.00	45000.00	0.00	delivered	captured	2026-05-08 02:57:04.464	\N	\N	f	2026-05-08 02:57:04.464	2026-05-08 02:57:04.464
d5deea96-b1b9-4502-8dcd-9303521f3bd0	ORD-1779418624464-17	3b360640-f08b-460c-b06e-4f4ba821e298	d3350b54-b045-480f-99c0-a62951f906a1	Deepika Padukone	9876543202	\N	0a821036-397c-47dc-bbca-2de894aa5655	Organza	Saree	\N	\N	\N	\N	\N	\N	\N	7500.00	0.00	7500.00	pending	failed	2026-05-22 02:57:04.464	\N	\N	f	2026-05-22 02:57:04.464	2026-05-22 02:57:04.464
ee6d989b-0704-4255-bbe5-df8358651bc5	ORD-1778813824464-18	3b360640-f08b-460c-b06e-4f4ba821e298	d3350b54-b045-480f-99c0-a62951f906a1	Esha Deol	9876543203	\N	0a821036-397c-47dc-bbca-2de894aa5655	Organza	Saree	\N	\N	\N	\N	\N	\N	\N	9800.00	0.00	9800.00	pending	failed	2026-05-15 02:57:04.464	\N	\N	f	2026-05-15 02:57:04.464	2026-05-15 02:57:04.464
\.


--
-- Data for Name: owner_feature_permissions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.owner_feature_permissions (id, owner_id, can_manage_orders, can_manage_bookings, can_manage_reviews, can_manage_payments, can_manage_payouts, can_manage_gallery, can_manage_designs, can_manage_analytics, can_manage_notifications, can_manage_staff, can_manage_customers, can_manage_measurements, can_manage_inventory, can_manage_expenses, can_manage_production, can_manage_delivery, can_manage_marketing, can_manage_roles, can_manage_branches, can_export_reports, created_at, updated_at, can_manage_products) FROM stdin;
\.


--
-- Data for Name: owners; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.owners (id, owner_name, username, email, mobile_number, password, role, status, assigned_boutique_id, invite_token_hash, invite_expires_at, reset_password_token, reset_password_expire, must_reset_password, email_verified, last_login, is_deleted, created_at, login_enabled, read_only_mode, can_edit_profile, can_edit_services, can_edit_gallery, can_manage_designs, can_manage_orders, can_manage_bookings, can_manage_reviews, can_manage_media, can_view_analytics, can_manage_customers, can_manage_measurements, can_manage_inventory, can_manage_expenses, can_manage_production, can_manage_delivery, can_manage_marketing, can_manage_roles, can_manage_branches, can_export_reports) FROM stdin;
d9dbed07-d640-4d1e-846a-30d6211874a6	Test Boutique Owner	boutiqueowner_1780603150678	boutiqueowner_1780603150678@test.com	9999999912	mock_password_hash	owner	Active	444d0792-6d4b-4912-870d-a7084fb4000d	\N	\N	\N	\N	t	f	\N	f	2026-06-04 19:59:10.679	t	f	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t
b17ed420-862f-4cad-8d4a-64e9bb67de1a	Test Super Admin	superadmin_1780603150681	superadmin_1780603150681@test.com	9999999913	mock_password_hash	super-admin	Active	\N	\N	\N	\N	\N	t	f	\N	f	2026-06-04 19:59:10.682	t	f	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t
8775c411-56ab-4bba-b4c6-2b55f49ae545	Test Owner	testowner_1781721095218	testowner_1781721095218@test.com	9999999988	mock_password_hash	owner	Active	e93b248c-0e8a-4db9-9915-c2fec8f46845	\N	\N	\N	\N	t	f	\N	f	2026-06-17 18:31:35.22	t	f	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t
f2191c23-335d-4330-b3c8-e65128c64faf	Wishlist Owner	wishlistowner	wishlistowner@test.com	9555555552	$2b$10$UbG7GpMVrFWGE/GmFkaur.z2K1SCmO3tNKAeutKSsWvXK5QJUd5H2	owner	Active	6900ca7f-05c5-4a4a-a636-8d1f9fc3eba8	\N	\N	\N	\N	f	t	\N	f	2026-06-18 18:20:06.253	t	f	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t
9270afe8-2ed2-45fc-931c-0d144deca0d9	Audit Owner	auditowner	auditowner@test.com	9888888882	$2b$10$zKogkHV2X.Rw/i9Ot2gvseW9A7CfraHiYlLAwV5H3PJYqBi2WEO0O	owner	Active	416af8dc-b903-425c-92cd-f12ca2483386	\N	\N	\N	\N	f	t	\N	f	2026-06-18 18:37:09.306	t	f	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t
feb9ae23-eb39-423a-9bd8-cdb70ec3b2ab	Wrong Owner	wrongowner1782103080631	wrong1782103080631@test.com	9222222223	$2b$10$K0rUMA0Kx6APt/poHS7g.O/CDyStyNyDvh9xMwFK9zdP61.7VvYte	owner	Active	c8bc3d3d-f4d3-4197-9592-4274146afaac	\N	\N	\N	\N	f	t	\N	f	2026-06-22 04:38:00.633	t	f	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t
72113f32-8253-4630-b3c5-0417c2ecb46b	Wrong Owner	wrongowner1781805723489	wrong1781805723489@test.com	9222222223	$2b$10$Bri/4k9PnFveLtkCEuvQFexvtU.36EKWHv1QUUfqUBup4tv3MyUeS	owner	Active	49421d96-d408-4133-b700-7977aabbf112	\N	\N	\N	\N	f	t	2026-06-18 18:02:07.461	f	2026-06-18 18:02:03.491	t	f	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t
0b0e0c27-63ab-4aac-b138-99d46e7cbd47	Owner Product Tester	ownerproducttester	ownerproducttest@test.com	9111111112	$2b$10$mj9kW026VRodxnaFUTvQXuwfIV.gkC0jlZHycfJtPiiGkhkfK6zd6	owner	Active	5ab54e5a-4ef6-4911-8ea1-4224617df55c	\N	\N	\N	\N	f	t	2026-06-18 18:03:15.728	f	2026-06-18 18:02:02.159	t	f	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t
f74f1bbe-4788-44ff-adf3-f10e1a7636e1	Wrong Owner	wrongowner1781805792774	wrong1781805792774@test.com	9222222223	$2b$10$vBZtbtJb1q5ZuRLc4r5kl.qyfw2FCI7abSl027aQMfaaX0glOeHjq	owner	Active	aeebf623-d51b-4f89-bd8e-d28d83364469	\N	\N	\N	\N	f	t	2026-06-18 18:03:16.513	f	2026-06-18 18:03:12.775	t	f	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t
7f882ccb-f565-4f42-a33d-56c411d82415	Product Tester	producttester	producttest@owner.com	9999888776	$2b$10$aS62Phvpflpo5kF9hlF1auG9EcD06El9uWexrdoO0Hqx5sImDQjGW	owner	Active	154c28b2-97e5-4179-824e-8179589d5547	\N	\N	\N	\N	f	t	2026-06-22 06:13:06.122	f	2026-06-18 17:16:59.341	t	f	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t
f190aceb-e440-4cb2-b483-403ab4bb0797	Super Administrator	superadmin	admin@vsboutique.com	0000000000	$2b$10$EVAZy6.waStoWIU4GGI.eelBUagqirP./eN6tXaeLV2x1WUfcup3K	super-admin	Active	\N	\N	\N	\N	\N	f	f	2026-06-22 09:44:55.193	f	2026-04-29 06:51:20.945	t	f	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t
d3350b54-b045-480f-99c0-a62951f906a1	Sanjana Kapoor	sanjana_tiny_admin	hello@tinytucks.com	9052011447	$2b$10$Bh9EIIVWCJN00q0JWMOQEO8fHcQsB7rECsshupXaWM6THjWdXTO9i	owner	Active	9713de00-8c88-48c2-9ecc-902b86954f96	\N	\N	\N	\N	f	t	2026-06-22 09:49:07.197	f	2026-04-29 13:13:23.243	t	f	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.payments (id, order_id, boutique_id, customer_id, amount, currency, status, method, commission_amount, net_amount, payout_status, payout_id, refund_id, refund_reason, razorpay_order_id, razorpay_payment_id, razorpay_signature, receipt, description, metadata, created_at) FROM stdin;
19a153e1-cc8d-4821-8d99-4e1178354794	a06444b3-8f9a-40ca-a1e1-835fb4f90f6d	3b360640-f08b-460c-b06e-4f4ba821e298	b29700ad-222e-42e1-9137-ef0f389be22f	12000.00	INR	captured	Razorpay	1200.00	10800.00	pending	\N	\N	\N	\N	\N	\N	\N	\N	null	2026-06-05 02:57:04.464
8d560a5d-df7b-4fe5-a031-4ca74fa9c4d9	18438d1a-646f-48b2-9cab-6cd0d41c16f1	3b360640-f08b-460c-b06e-4f4ba821e298	6d8d307c-ca33-4b53-b7a2-4726acf44c0e	8000.00	INR	captured	Razorpay	800.00	7200.00	pending	\N	\N	\N	\N	\N	\N	\N	\N	null	2026-06-05 02:57:04.464
2f46b237-e04f-461f-a08f-8ec563143cc4	aa79a373-0486-4c02-8099-6fefdbbbd010	3b360640-f08b-460c-b06e-4f4ba821e298	7a003ffa-76ed-4e4a-8f98-316e8a95dfc5	5000.00	INR	captured	Razorpay	500.00	4500.00	pending	\N	\N	\N	\N	\N	\N	\N	\N	null	2026-06-05 02:57:04.464
f3e4d58e-0c50-4e5c-a8e1-3ec1bb53f24e	e2341de8-1a28-4866-a724-dc787c498997	3b360640-f08b-460c-b06e-4f4ba821e298	f0b801e0-baa1-4344-8897-6c1f83b3dcba	15000.00	INR	failed	Razorpay	1500.00	13500.00	failed	\N	\N	\N	\N	\N	\N	\N	\N	null	2026-06-05 02:57:04.464
bbd02789-d34b-4b13-ba40-06559fadfff7	daf4de09-6e65-4a48-a9fe-3b5044280e33	3b360640-f08b-460c-b06e-4f4ba821e298	ed855518-26d3-4eaf-9e17-43b290fbadfd	10000.00	INR	captured	Razorpay	1000.00	9000.00	pending	\N	\N	\N	\N	\N	\N	\N	\N	null	2026-06-04 02:57:04.464
4940f5de-284b-4e8f-bbca-9f66ce7cb7e8	d2ffc7af-bf10-459b-aec7-0dd8cd132ce2	3b360640-f08b-460c-b06e-4f4ba821e298	98402b40-f980-4afd-94c9-24e655be507f	12000.00	INR	captured	Razorpay	1200.00	10800.00	pending	\N	\N	\N	\N	\N	\N	\N	\N	null	2026-06-04 02:57:04.464
5005feb1-6c2e-43b7-83f1-42e1d7cafbb3	bb55fdf1-2125-4303-a935-c08ccf736fe5	3b360640-f08b-460c-b06e-4f4ba821e298	c253196e-0a2f-42be-9d25-0703dc299a11	15000.00	INR	captured	Razorpay	1500.00	13500.00	pending	\N	\N	\N	\N	\N	\N	\N	\N	null	2026-06-02 02:57:04.464
8fbdb492-a105-4012-8bba-2737787fab61	61afc9a3-e7df-43b5-8176-1b0728259330	3b360640-f08b-460c-b06e-4f4ba821e298	e4cac1e9-af60-43e1-95d3-f1e25cc16aab	9000.00	INR	captured	Razorpay	900.00	8100.00	pending	\N	\N	\N	\N	\N	\N	\N	\N	null	2026-05-31 02:57:04.464
c6b0e3d6-68dd-42fa-ab28-bd2f31061bb6	92755504-baa2-4cc5-9d4d-9915f08be21f	3b360640-f08b-460c-b06e-4f4ba821e298	d7ff1fc4-53d3-4c65-8099-5b1df71612da	22000.00	INR	captured	Razorpay	2200.00	19800.00	pending	\N	\N	\N	\N	\N	\N	\N	\N	null	2026-05-28 02:57:04.464
f9f5eabc-80d4-4703-b1a1-42399d04032e	c296e7a1-d9a6-474a-a77c-6622a06f9ce8	3b360640-f08b-460c-b06e-4f4ba821e298	a0e40168-e5a0-4d52-8c38-5dc7b699a801	18000.00	INR	captured	Razorpay	1800.00	16200.00	pending	\N	\N	\N	\N	\N	\N	\N	\N	null	2026-05-26 02:57:04.464
19e69781-f359-4829-8bf1-98e221cffabc	8d91be37-2788-4bd5-afe7-762d98d0aa9a	3b360640-f08b-460c-b06e-4f4ba821e298	9a52b57d-9943-4e91-9482-de1d2700fb0c	14000.00	INR	captured	Razorpay	1400.00	12600.00	pending	\N	\N	\N	\N	\N	\N	\N	\N	null	2026-05-24 02:57:04.464
56b69dac-db70-4050-879a-a94d18feef2b	37764aa1-23b7-4875-9756-281a34c58a14	3b360640-f08b-460c-b06e-4f4ba821e298	ddc3a65c-48f8-47aa-903a-f168e46332b7	30000.00	INR	captured	Razorpay	3000.00	27000.00	pending	\N	\N	\N	\N	\N	\N	\N	\N	null	2026-05-21 02:57:04.464
f9819aa3-e6ae-46ab-9f79-1ba4b8f64125	e23b2747-9259-4425-a19c-3814d94da88a	3b360640-f08b-460c-b06e-4f4ba821e298	23a107f5-551c-4bb6-8a82-905048ddbd09	25000.00	INR	captured	Razorpay	2500.00	22500.00	pending	\N	\N	\N	\N	\N	\N	\N	\N	null	2026-05-18 02:57:04.464
a71f66a1-c213-44fa-97ff-a5e192b9d93a	0f1e111b-f026-47b5-953d-f51a204b0bc9	3b360640-f08b-460c-b06e-4f4ba821e298	67487184-01c0-457c-b4b0-b213bd587291	8500.00	INR	captured	Razorpay	850.00	7650.00	pending	\N	\N	\N	\N	\N	\N	\N	\N	null	2026-05-16 02:57:04.464
0f36a269-4119-44d7-8f4b-d0910a1e7646	bc3274ba-cc30-4a1f-9113-d29d1ab5e1d2	3b360640-f08b-460c-b06e-4f4ba821e298	54b57369-6046-4e12-8855-c5c8a0dd5825	11000.00	INR	captured	Razorpay	1100.00	9900.00	pending	\N	\N	\N	\N	\N	\N	\N	\N	null	2026-05-14 02:57:04.464
397827a2-5148-4c1d-b104-d1954df15b76	55d00626-0ebd-40fd-ab46-7e7b61063a2e	3b360640-f08b-460c-b06e-4f4ba821e298	b29700ad-222e-42e1-9137-ef0f389be22f	16000.00	INR	captured	Razorpay	1600.00	14400.00	pending	\N	\N	\N	\N	\N	\N	\N	\N	null	2026-05-11 02:57:04.464
5d18507e-d4a3-4479-a938-c52e6bcd6c9a	cc57d890-2688-4dd1-92e9-b5d986824ddf	3b360640-f08b-460c-b06e-4f4ba821e298	6d8d307c-ca33-4b53-b7a2-4726acf44c0e	45000.00	INR	captured	Razorpay	4500.00	40500.00	pending	\N	\N	\N	\N	\N	\N	\N	\N	null	2026-05-08 02:57:04.464
370918d3-fec0-4024-8e19-94a92d80e19e	d5deea96-b1b9-4502-8dcd-9303521f3bd0	3b360640-f08b-460c-b06e-4f4ba821e298	7a003ffa-76ed-4e4a-8f98-316e8a95dfc5	7500.00	INR	failed	Razorpay	750.00	6750.00	failed	\N	\N	\N	\N	\N	\N	\N	\N	null	2026-05-22 02:57:04.464
2d93b5d8-0e18-41dc-a350-ebbfa4a1a1a5	ee6d989b-0704-4255-bbe5-df8358651bc5	3b360640-f08b-460c-b06e-4f4ba821e298	f0b801e0-baa1-4344-8897-6c1f83b3dcba	9800.00	INR	failed	Razorpay	980.00	8820.00	failed	\N	\N	\N	\N	\N	\N	\N	\N	null	2026-05-15 02:57:04.464
\.


--
-- Data for Name: payouts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.payouts (id, boutique_id, amount, status, payout_id, reference_code, payout_date, error_msg, created_at, updated_at) FROM stdin;
f8da7619-8b47-4563-9669-1949d89b61ea	3b360640-f08b-460c-b06e-4f4ba821e298	15000.00	PENDING	\N	\N	\N	\N	2026-06-04 02:57:04.464	2026-06-04 02:57:04.464
a2484bcb-35c2-4ee8-a9b8-c4a3fab07650	3b360640-f08b-460c-b06e-4f4ba821e298	25000.00	APPROVED	\N	\N	\N	\N	2026-06-02 02:57:04.464	2026-06-02 02:57:04.464
64d5f951-6dcc-45ef-93c0-09b928eff4b9	3b360640-f08b-460c-b06e-4f4ba821e298	45000.00	PENDING	\N	\N	\N	\N	2026-05-26 02:57:04.464	2026-05-26 02:57:04.464
67d52f68-b5ef-41b6-a468-9f0bb6961099	3b360640-f08b-460c-b06e-4f4ba821e298	35000.00	RELEASED	PAY-1779591424464	REF-1779591424464	2026-05-24 02:57:04.464	\N	2026-05-24 02:57:04.464	2026-05-24 02:57:04.464
add270db-045c-4aa7-b14b-b31e06c876f2	3b360640-f08b-460c-b06e-4f4ba821e298	20000.00	RELEASED	PAY-1778900224464	REF-1778900224464	2026-05-16 02:57:04.464	\N	2026-05-16 02:57:04.464	2026-05-16 02:57:04.464
\.


--
-- Data for Name: platform_settings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.platform_settings (id, global_commission_rate, category_commissions, updated_at) FROM stdin;
7314c117-a9d5-42dd-9e05-334d7690dbd6	12.00	{"Saree": 15, "Lehenga": 20}	2026-06-04 19:37:53.57
\.


--
-- Data for Name: product_analytics; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.product_analytics (id, product_id, period_start, period_end, views, unique_views, add_to_cart_count, order_count, revenue, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: product_brands; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.product_brands (id, name, description, logo, boutique_id, is_active, created_at, updated_at) FROM stdin;
d0c06ed9-3f3d-4ca6-997c-68d04a4d78ac	Test Brand 1782103176158	\N	\N	154c28b2-97e5-4179-824e-8179589d5547	t	2026-06-22 04:39:40.377	2026-06-22 04:39:40.377
dd6db5a6-f2be-4458-9f14-6dffc80b6c7a	Test	\N	\N	154c28b2-97e5-4179-824e-8179589d5547	t	2026-06-22 04:40:19.658	2026-06-22 04:40:19.658
8030e266-ef49-4963-adc9-3c36f92c55aa	E2E Brand	\N	\N	154c28b2-97e5-4179-824e-8179589d5547	t	2026-06-22 04:43:37.75	2026-06-22 04:43:37.75
003ac880-776e-4b84-95b4-23e1ffd8e799	E2E Brand 1782103531674	\N	\N	154c28b2-97e5-4179-824e-8179589d5547	t	2026-06-22 04:45:37.014	2026-06-22 04:45:37.014
e70ee2b1-84ff-41b7-beb2-3bbc003968b9	E2E Brand 1782103723366	\N	\N	154c28b2-97e5-4179-824e-8179589d5547	t	2026-06-22 04:48:48.141	2026-06-22 04:48:48.141
663309c9-c87d-4589-9ef3-4c94d9930892	E2E Brand 1782108788974	\N	\N	154c28b2-97e5-4179-824e-8179589d5547	t	2026-06-22 06:13:11.885	2026-06-22 06:13:11.885
\.


--
-- Data for Name: product_images; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.product_images (id, product_id, url, alt, sort_order, is_primary) FROM stdin;
98edaa53-6efc-44c9-9365-51cd37e67d66	39d029a5-b0aa-4f31-8b3a-0f256bbe86d3	https://placehold.co/600x400	Test	1	t
37b0590e-48ee-4835-9751-baebbc2cd1b7	5d3f8cfb-5c57-4234-92b1-54e5775cc71f	https://placehold.co/600x400	Test	1	t
d9467c6c-b50f-4065-9d4b-f0a12fe1b7bf	9e953786-5208-482b-9aad-9fd59d522801	https://placehold.co/600x400	Test	1	t
\.


--
-- Data for Name: product_inventory; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.product_inventory (id, variant_id, quantity, reserved_quantity, low_stock_threshold, track_inventory, version) FROM stdin;
4f6acad5-6b7a-4a54-bc0a-850365001d8b	ad4279f2-c1bc-4d18-be91-f5f44204b621	100	0	10	t	0
717c0779-c636-4f66-b73e-26bdedbd9cef	21e2f17f-5f31-4a1d-aa73-5adf50c75d5d	100	0	10	t	0
44cd9c75-c135-44c1-944f-06596292c850	cdd72089-0945-41f9-b773-0cddf3f83552	100	0	10	t	0
cae7ad28-a14c-48d4-a14b-9626aea63c87	9803bbed-b544-4c21-8419-8447bdab7c56	0	0	5	t	0
636a2c97-67b9-4d6b-93f2-5e9691f5fc30	36caacef-7a28-439a-9f65-c45f51bc2f09	100	0	10	t	0
965fa60b-c631-4fb8-b96b-056171ac05e5	d604659d-c292-4dd0-967d-e1611b0fb37c	10	0	5	t	0
76055194-3aeb-4422-83b5-9f18050ac0e9	3a96d63b-93eb-4631-9619-7392e42a7709	0	0	5	t	0
9505b11f-8574-44db-854c-5f0df2d49acf	97d3cfa3-57b5-47e8-ae55-17631860babf	10	0	5	t	0
f347da93-3c9a-401c-abb6-b00835814804	bee1418c-6741-4e87-bc17-cd9a0af7c405	0	0	5	t	0
5ffa93b7-e228-48aa-b66c-86cd6eb0de9b	743d5892-97a6-4d89-b5ff-810668b6c243	10	0	5	t	0
38343eca-40c8-4b9e-bb79-ccd100c31e8a	5a5b4424-e24b-4486-9387-b26c97e54c27	0	0	5	t	0
fc652c6f-d59a-4640-b96e-ba7790379edb	e489bcf4-42bc-4a45-b0ed-7fdd8345ae52	10	0	5	t	0
1110bb7b-0c78-41bc-b35c-5d64ca9d30b0	433e36de-7ac8-48e3-889f-1a02c7b49755	0	0	5	t	0
4260d455-e926-406c-8d94-7c3c24ed3ba0	66ecd178-f1ea-46ab-a38c-5cbcdc714f6e	10	0	5	t	0
fb9866e2-c2a5-4e8f-b618-eda57707a1ba	179a2ce9-3b42-4873-a4ce-cc7594d95ee7	0	0	5	t	0
ee111402-2746-428c-93e9-ae95e2c2c517	c2af1f7b-96c4-48c7-a743-140a367eb2ba	10	0	5	t	0
b9ecd88c-c041-467c-8fcc-b3321072e9c6	4eeda7ca-e8da-4d94-96c2-0d7b83102c61	50	13	5	t	15
c0af1d54-ca4f-458c-882e-a22a525ff1db	6bf206e2-a522-48fb-a71b-36cabdd11509	0	0	5	t	0
e7899b97-6467-4163-acfa-fbc062ee13fa	c7e8df3d-fd36-40f7-8dce-f0e8d94dc669	75	0	10	t	0
\.


--
-- Data for Name: product_inventory_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.product_inventory_logs (id, product_id, variant_id, change, quantity_before, quantity_after, reason, reference, created_by, created_at) FROM stdin;
a0643581-9e5c-434f-8f97-08c21cdf4dfd	cf950f37-6a80-4d8f-8a55-22395ccd8cad	ad4279f2-c1bc-4d18-be91-f5f44204b621	50	100	150	STOCK_ADDITION	Manual restock	7f882ccb-f565-4f42-a33d-56c411d82415	2026-06-18 17:24:46.429
2604e429-663d-48aa-b1a3-bb147025139c	bfde2c1b-a675-4c10-9164-583039eec97a	21e2f17f-5f31-4a1d-aa73-5adf50c75d5d	50	100	150	STOCK_ADDITION	Manual restock	7f882ccb-f565-4f42-a33d-56c411d82415	2026-06-18 17:26:30.337
0616ab87-92d4-4e3f-a624-16bd5f174dd6	42a91c88-7d36-4df1-bd3c-764192fc9cff	cdd72089-0945-41f9-b773-0cddf3f83552	50	100	150	STOCK_ADDITION	Manual restock	7f882ccb-f565-4f42-a33d-56c411d82415	2026-06-18 17:28:55.72
7d613250-5150-4759-b46a-72d10fa47bd0	e146c366-ec72-40f4-a985-43a011c8d79f	36caacef-7a28-439a-9f65-c45f51bc2f09	50	100	150	STOCK_ADDITION	Manual restock	7f882ccb-f565-4f42-a33d-56c411d82415	2026-06-18 18:17:40.36
\.


--
-- Data for Name: product_reviews; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.product_reviews (id, product_id, user_id, order_id, rating, title, comment, images, is_verified_purchase, status, created_at, reply, updated_at) FROM stdin;
\.


--
-- Data for Name: product_tags; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.product_tags (id, name, boutique_id, is_active, created_at) FROM stdin;
c01299c2-8e4c-4b1a-8398-5a819e817ea1	Test Tag 1782103180936	154c28b2-97e5-4179-824e-8179589d5547	t	2026-06-22 04:39:43.605
2dfe4031-ae38-4c67-964c-87eb7d2f5932	E2E Tag	154c28b2-97e5-4179-824e-8179589d5547	t	2026-06-22 04:43:44.652
fc4d7943-f8ce-4e64-8a01-5d06858f3c39	E2E Tag 1782103538226	154c28b2-97e5-4179-824e-8179589d5547	t	2026-06-22 04:45:42.217
6fe072e6-7b8a-4acd-b466-f936c359686a	E2E Tag 1782103728780	154c28b2-97e5-4179-824e-8179589d5547	t	2026-06-22 04:48:51.457
e2e8899b-4eb9-4c92-ad26-925cd257d16e	E2E Tag 1782108792523	154c28b2-97e5-4179-824e-8179589d5547	t	2026-06-22 06:13:16.48
\.


--
-- Data for Name: product_variant_attributes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.product_variant_attributes (id, product_id, name, "values") FROM stdin;
\.


--
-- Data for Name: product_variants; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.product_variants (id, product_id, sku, name, attributes, price, compare_at_price, status, sort_order) FROM stdin;
ad4279f2-c1bc-4d18-be91-f5f44204b621	cf950f37-6a80-4d8f-8a55-22395ccd8cad	VAR-1781803472424	Medium	{"Size": "M"}	1199.99	\N	ACTIVE	1
21e2f17f-5f31-4a1d-aa73-5adf50c75d5d	bfde2c1b-a675-4c10-9164-583039eec97a	VAR-1781803578649	Medium	{"Size": "M"}	1199.99	\N	ACTIVE	1
cdd72089-0945-41f9-b773-0cddf3f83552	42a91c88-7d36-4df1-bd3c-764192fc9cff	VAR-1781803722311	Medium	{"Size": "M"}	1199.99	\N	ACTIVE	1
9803bbed-b544-4c21-8419-8447bdab7c56	292d4168-93db-4fe9-9d98-f6295e9a4d72	VAR-1781806524861	Medium	{"Size": "M"}	1199.99	\N	ACTIVE	1
36caacef-7a28-439a-9f65-c45f51bc2f09	e146c366-ec72-40f4-a985-43a011c8d79f	VAR-1781806640328	Medium	{"Size": "M"}	1199.99	\N	ACTIVE	1
d604659d-c292-4dd0-967d-e1611b0fb37c	eda35e98-7d92-455e-8f2c-89e6d3648f11	AUDIT-V1-1781807824326	Size M	\N	1100.00	\N	ACTIVE	0
3a96d63b-93eb-4631-9619-7392e42a7709	eda35e98-7d92-455e-8f2c-89e6d3648f11	AUDIT-V2-1781807824326	Size L	\N	1200.00	\N	ACTIVE	0
97d3cfa3-57b5-47e8-ae55-17631860babf	0e1a9224-820b-4e11-92c8-0f76c57eab3f	AUDIT-V1-1781808669195	Size M	\N	1100.00	\N	ACTIVE	0
bee1418c-6741-4e87-bc17-cd9a0af7c405	0e1a9224-820b-4e11-92c8-0f76c57eab3f	AUDIT-V2-1781808669195	Size L	\N	1200.00	\N	ACTIVE	0
743d5892-97a6-4d89-b5ff-810668b6c243	405e28d5-4e8b-46f0-8f7a-8f0582c438c3	AUDIT-V1-1781809114924	Size M	\N	1100.00	\N	ACTIVE	0
5a5b4424-e24b-4486-9387-b26c97e54c27	405e28d5-4e8b-46f0-8f7a-8f0582c438c3	AUDIT-V2-1781809114924	Size L	\N	1200.00	\N	ACTIVE	0
e489bcf4-42bc-4a45-b0ed-7fdd8345ae52	50b5e987-1a09-4714-8293-501d38452549	AUDIT-V1-1781809334074	Size M	\N	1100.00	\N	ACTIVE	0
433e36de-7ac8-48e3-889f-1a02c7b49755	50b5e987-1a09-4714-8293-501d38452549	AUDIT-V2-1781809334074	Size L	\N	1200.00	\N	ACTIVE	0
66ecd178-f1ea-46ab-a38c-5cbcdc714f6e	aa35c61c-9cf8-4669-a0d2-0e583774bc3f	AUDIT-V1-1781809480752	Size M	\N	1100.00	\N	ACTIVE	0
179a2ce9-3b42-4873-a4ce-cc7594d95ee7	aa35c61c-9cf8-4669-a0d2-0e583774bc3f	AUDIT-V2-1781809480752	Size L	\N	1200.00	\N	ACTIVE	0
c2af1f7b-96c4-48c7-a743-140a367eb2ba	e787b99c-23a4-40dd-b0e5-598467c46da8	CONST-1781809514628	Test	\N	200.00	\N	ACTIVE	0
6bf206e2-a522-48fb-a71b-36cabdd11509	22fbfc8a-46fa-471e-b1e2-87aac5b94414	VT-SKU-1782108770226	Small	{"size": "S"}	899.00	\N	ACTIVE	0
c7e8df3d-fd36-40f7-8dce-f0e8d94dc669	9e953786-5208-482b-9aad-9fd59d522801	VAR-1782108832499	Large	{"size": "L"}	1799.00	\N	ACTIVE	0
4eeda7ca-e8da-4d94-96c2-0d7b83102c61	dcd60b0d-54f7-4e92-8a22-99e4eb5edea3	\N	Stress Variant 1782112020354	\N	500.00	\N	ACTIVE	0
\.


--
-- Data for Name: product_wishlists; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.product_wishlists (id, user_id, product_id, created_at) FROM stdin;
89475ebb-666f-4d4e-abc9-da5ca1563f7b	c4c6b80e-7521-42db-9aca-f5ba44393974	a1e2ae9a-db7e-41a2-9dc3-0c3886526342	2026-06-18 18:20:26.922
1b7c224b-ab8f-40a5-b5f4-33f0673f2a81	d354509d-581a-492a-9d6f-5b5bf8a0da00	dcd60b0d-54f7-4e92-8a22-99e4eb5edea3	2026-06-23 03:30:55.364
7bd581c8-79df-415c-912c-72041f16e506	d354509d-581a-492a-9d6f-5b5bf8a0da00	6d454bed-36d1-456e-95e8-18897fe26f1c	2026-06-23 03:30:56.134
a7d5b84d-9e11-490b-9610-9ed725d4cf5e	a57183cb-996a-41dc-aecb-27a68b06212e	dcd60b0d-54f7-4e92-8a22-99e4eb5edea3	2026-06-23 03:30:58.94
d010b50c-6b5e-4306-830e-ade6ba40e755	e00770ea-ef70-470f-9b29-1a5d6df59470	dcd60b0d-54f7-4e92-8a22-99e4eb5edea3	2026-06-25 07:35:03.681
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.products (id, boutique_id, brand_id, category_id, sub_category_id, product_type, name, description, short_description, sku, barcode, base_price, compare_at_price, cost_price, delivery_type, weight, length, width, height, status, is_featured, is_marketplace_visible, is_taxable, is_deleted, seo_title, seo_description, seo_slug, created_at, updated_at, average_rating, review_count) FROM stdin;
eda35e98-7d92-455e-8f2c-89e6d3648f11	416af8dc-b903-425c-92cd-f12ca2483386	\N	0411488f-4570-4640-9531-fd242a384295	23ef7a87-ea4d-4ad5-988b-aaa443b4ebe9	READY_MADE	Audit Prod 1 1781807824326	\N	\N	\N	\N	1000.00	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	f	t	t	f	\N	\N	\N	2026-06-18 18:37:10.395	2026-06-18 18:37:10.395	0	0
cf950f37-6a80-4d8f-8a55-22395ccd8cad	154c28b2-97e5-4179-824e-8179589d5547	\N	\N	\N	READY_MADE	Updated Product	Updated description	Test product short desc	SKU-1781803440277	\N	1499.99	\N	\N	STANDARD	\N	\N	\N	\N	DRAFT	t	t	t	t	\N	\N	\N	2026-06-18 17:24:01.863	2026-06-18 17:24:53.529	0	0
6ec10ba4-c9a8-4d47-ae7c-e2f4a87cc267	416af8dc-b903-425c-92cd-f12ca2483386	\N	0411488f-4570-4640-9531-fd242a384295	23ef7a87-ea4d-4ad5-988b-aaa443b4ebe9	READY_MADE	Audit Prod 2 1781807824326	\N	\N	\N	\N	500.00	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	f	t	t	f	\N	\N	\N	2026-06-18 18:37:11.068	2026-06-18 18:37:11.068	0	0
bfde2c1b-a675-4c10-9164-583039eec97a	154c28b2-97e5-4179-824e-8179589d5547	\N	\N	\N	READY_MADE	Updated Product	Updated description	Test product short desc	SKU-1781803550509	\N	1499.99	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	t	t	t	t	\N	\N	\N	2026-06-18 17:25:52.356	2026-06-18 17:26:40.868	0	0
9277f24d-3008-4d04-8c1e-da1551747912	af5c6060-19c5-4706-bef9-55ba9fd574a7	\N	0411488f-4570-4640-9531-fd242a384295	23ef7a87-ea4d-4ad5-988b-aaa443b4ebe9	READY_MADE	Boutique B Product 1781807824326	\N	\N	\N	\N	999.00	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	f	t	t	f	\N	\N	\N	2026-06-18 18:37:11.325	2026-06-18 18:37:11.325	0	0
42a91c88-7d36-4df1-bd3c-764192fc9cff	154c28b2-97e5-4179-824e-8179589d5547	\N	\N	\N	READY_MADE	Updated Product	Updated description	Test product short desc	SKU-1781803687825	\N	1499.99	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	t	t	t	t	\N	\N	\N	2026-06-18 17:28:09.371	2026-06-18 17:29:10.258	0	0
b6334ebb-7a64-4da4-930b-1e889c1998ce	154c28b2-97e5-4179-824e-8179589d5547	\N	\N	\N	READY_MADE	Direct Test 1781804386075	\N	\N	DIR-1781804386075	\N	500.00	\N	\N	STANDARD	\N	\N	\N	\N	DRAFT	f	t	t	f	\N	\N	\N	2026-06-18 17:39:48.393	2026-06-18 17:39:48.393	0	0
8c32ad02-289c-4543-b384-6cb1c0b8d9e4	154c28b2-97e5-4179-824e-8179589d5547	\N	\N	\N	READY_MADE	Test	\N	\N	T-1781804420404	\N	10.00	\N	\N	STANDARD	\N	\N	\N	\N	DRAFT	f	t	t	f	\N	\N	\N	2026-06-18 17:40:23.047	2026-06-18 17:40:23.047	0	0
836e8c3d-8cfa-44a6-b483-ffbb4e64699a	5ab54e5a-4ef6-4911-8ea1-4224617df55c	\N	4c568875-d770-4045-b0de-1e5bdfa743c7	5ae10054-9bd2-4a17-a042-0855590cd119	READY_MADE	Updated Owner Product	Updated description	\N	OWNER-SKU-1781805745364	\N	1999.99	\N	\N	STANDARD	\N	\N	\N	\N	DRAFT	t	t	t	t	\N	\N	\N	2026-06-18 18:02:27.594	2026-06-18 18:02:56.916	0	0
45fe0f2a-9e3a-46a2-aa77-9ea846b0ff84	5ab54e5a-4ef6-4911-8ea1-4224617df55c	\N	6f36e050-bde1-4390-aaaa-704d035a61e6	8c573535-1946-4e53-a4dc-f32880e43416	READY_MADE	Updated Owner Product	Updated description	\N	OWNER-SKU-1781805810285	\N	1999.99	\N	\N	STANDARD	\N	\N	\N	\N	DRAFT	t	t	t	t	\N	\N	\N	2026-06-18 18:03:32.434	2026-06-18 18:03:59.23	0	0
24c56af1-bd37-48b8-8570-dd473100019a	5ab54e5a-4ef6-4911-8ea1-4224617df55c	\N	6f36e050-bde1-4390-aaaa-704d035a61e6	8c573535-1946-4e53-a4dc-f32880e43416	READY_MADE	Temp Product 1781805849546	\N	\N	\N	\N	500.00	\N	\N	STANDARD	\N	\N	\N	\N	DRAFT	f	t	t	f	\N	\N	\N	2026-06-18 18:04:09.548	2026-06-18 18:04:09.548	0	0
ca917ea6-0ccb-40ac-b8cd-eac7bf309c22	416af8dc-b903-425c-92cd-f12ca2483386	\N	0411488f-4570-4640-9531-fd242a384295	23ef7a87-ea4d-4ad5-988b-aaa443b4ebe9	READY_MADE	Audit To Delete 1781807824326	\N	\N	\N	\N	300.00	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	f	t	t	t	\N	\N	\N	2026-06-18 18:37:13.208	2026-06-18 18:37:42.589	0	0
292d4168-93db-4fe9-9d98-f6295e9a4d72	154c28b2-97e5-4179-824e-8179589d5547	\N	\N	\N	READY_MADE	Updated Product	Updated description	Test product short desc	SKU-1781806459459	\N	1499.99	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	t	t	t	f	\N	\N	\N	2026-06-18 18:14:21.887	2026-06-18 18:14:55.577	0	0
0e81677e-b675-4b5d-98de-b5501683ce37	416af8dc-b903-425c-92cd-f12ca2483386	\N	0411488f-4570-4640-9531-fd242a384295	23ef7a87-ea4d-4ad5-988b-aaa443b4ebe9	READY_MADE	Audit To Inactivate 1781807824326	\N	\N	\N	\N	400.00	\N	\N	STANDARD	\N	\N	\N	\N	INACTIVE	f	t	t	f	\N	\N	\N	2026-06-18 18:37:13.681	2026-06-18 18:37:43.645	0	0
e146c366-ec72-40f4-a985-43a011c8d79f	154c28b2-97e5-4179-824e-8179589d5547	\N	\N	\N	READY_MADE	Updated Product	Updated description	Test product short desc	SKU-1781806589948	\N	1499.99	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	t	t	t	t	\N	\N	\N	2026-06-18 18:16:32.336	2026-06-18 18:18:05.401	0	0
0dfce70b-f384-4642-ba1f-365211b229b2	6900ca7f-05c5-4a4a-a636-8d1f9fc3eba8	\N	ed7fd462-a008-4f79-9af5-306612f4ffd0	661e45bd-0c95-4ea3-abb6-a827d1c9bdb2	READY_MADE	Wishlist Active Product 1781806807337	\N	\N	\N	\N	999.00	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	f	t	t	f	\N	\N	\N	2026-06-18 18:20:07.339	2026-06-18 18:20:07.339	0	0
a1e2ae9a-db7e-41a2-9dc3-0c3886526342	6900ca7f-05c5-4a4a-a636-8d1f9fc3eba8	\N	ed7fd462-a008-4f79-9af5-306612f4ffd0	661e45bd-0c95-4ea3-abb6-a827d1c9bdb2	READY_MADE	Wishlist To Delete 1781806808386	\N	\N	\N	\N	100.00	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	f	t	t	t	\N	\N	\N	2026-06-18 18:20:08.388	2026-06-18 18:20:08.711	0	0
2867ecfa-5340-4b57-bc67-cb5631f8d740	6900ca7f-05c5-4a4a-a636-8d1f9fc3eba8	\N	ed7fd462-a008-4f79-9af5-306612f4ffd0	661e45bd-0c95-4ea3-abb6-a827d1c9bdb2	READY_MADE	Wishlist Inactive Product 1781806809844	\N	\N	\N	\N	500.00	\N	\N	STANDARD	\N	\N	\N	\N	INACTIVE	f	t	t	f	\N	\N	\N	2026-06-18 18:20:09.846	2026-06-18 18:20:09.846	0	0
3ea8c88d-dd24-47e0-bcd6-267a04a8cc9d	6900ca7f-05c5-4a4a-a636-8d1f9fc3eba8	\N	7d82019f-54b6-47b2-af9c-53e5b74da244	568bd02b-1535-43d6-af0b-e2befdb7839a	READY_MADE	Wishlist Active Product 1781807127334	\N	\N	\N	\N	999.00	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	f	t	t	f	\N	\N	\N	2026-06-18 18:25:27.337	2026-06-18 18:25:27.337	0	0
8730ca20-b208-44a8-8eec-77d77207e9ca	6900ca7f-05c5-4a4a-a636-8d1f9fc3eba8	\N	7d82019f-54b6-47b2-af9c-53e5b74da244	568bd02b-1535-43d6-af0b-e2befdb7839a	READY_MADE	Wishlist To Delete 1781807128460	\N	\N	\N	\N	100.00	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	f	t	t	t	\N	\N	\N	2026-06-18 18:25:28.462	2026-06-18 18:25:28.901	0	0
711c60aa-72b7-49d5-88aa-1763096fb04b	6900ca7f-05c5-4a4a-a636-8d1f9fc3eba8	\N	7d82019f-54b6-47b2-af9c-53e5b74da244	568bd02b-1535-43d6-af0b-e2befdb7839a	READY_MADE	Wishlist Inactive Product 1781807130137	\N	\N	\N	\N	500.00	\N	\N	STANDARD	\N	\N	\N	\N	INACTIVE	f	t	t	f	\N	\N	\N	2026-06-18 18:25:30.139	2026-06-18 18:25:30.139	0	0
112e139b-9e3f-459f-8ec0-92e6007f7d94	6900ca7f-05c5-4a4a-a636-8d1f9fc3eba8	\N	392abf64-af32-4e93-99ff-0e7243b54cfc	0de91bc3-d70d-49d7-b3c9-10ba282d78da	READY_MADE	Wishlist Active Product 1781807145868	\N	\N	\N	\N	999.00	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	f	t	t	f	\N	\N	\N	2026-06-18 18:25:45.869	2026-06-18 18:25:45.869	0	0
351ba216-97d6-49ce-929a-1ffad941220b	6900ca7f-05c5-4a4a-a636-8d1f9fc3eba8	\N	392abf64-af32-4e93-99ff-0e7243b54cfc	0de91bc3-d70d-49d7-b3c9-10ba282d78da	READY_MADE	Wishlist To Delete 1781807146764	\N	\N	\N	\N	100.00	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	f	t	t	t	\N	\N	\N	2026-06-18 18:25:46.765	2026-06-18 18:25:47.477	0	0
06cfa9d4-f449-48b7-878e-058a9dc10a70	6900ca7f-05c5-4a4a-a636-8d1f9fc3eba8	\N	392abf64-af32-4e93-99ff-0e7243b54cfc	0de91bc3-d70d-49d7-b3c9-10ba282d78da	READY_MADE	Wishlist Inactive Product 1781807148127	\N	\N	\N	\N	500.00	\N	\N	STANDARD	\N	\N	\N	\N	INACTIVE	f	t	t	f	\N	\N	\N	2026-06-18 18:25:48.128	2026-06-18 18:25:48.128	0	0
0e1a9224-820b-4e11-92c8-0f76c57eab3f	416af8dc-b903-425c-92cd-f12ca2483386	\N	bde29a4d-e296-4b90-9422-8a8527e427ca	a97eacc2-95d5-4fb0-9754-e2de9562927b	READY_MADE	Audit Prod 1 1781808669195	\N	\N	\N	\N	1000.00	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	f	t	t	f	\N	\N	\N	2026-06-18 18:51:17.508	2026-06-18 18:51:17.508	0	0
136987c9-d75e-4b3e-8106-afcdce03dea9	416af8dc-b903-425c-92cd-f12ca2483386	\N	bde29a4d-e296-4b90-9422-8a8527e427ca	a97eacc2-95d5-4fb0-9754-e2de9562927b	READY_MADE	Audit Prod 2 1781808669195	\N	\N	\N	\N	500.00	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	f	t	t	f	\N	\N	\N	2026-06-18 18:51:18.778	2026-06-18 18:51:18.778	0	0
e0c8a9b5-baac-4e90-9249-67c6d9fe659f	19859527-fe72-4cd4-99ab-dfc7c544be7f	\N	bde29a4d-e296-4b90-9422-8a8527e427ca	a97eacc2-95d5-4fb0-9754-e2de9562927b	READY_MADE	Boutique B Product 1781808669195	\N	\N	\N	\N	999.00	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	f	t	t	f	\N	\N	\N	2026-06-18 18:51:19.459	2026-06-18 18:51:19.459	0	0
bf84e631-a059-4424-87c3-648cbc36eb28	416af8dc-b903-425c-92cd-f12ca2483386	\N	bde29a4d-e296-4b90-9422-8a8527e427ca	a97eacc2-95d5-4fb0-9754-e2de9562927b	READY_MADE	Audit To Delete 1781808669195	\N	\N	\N	\N	300.00	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	f	t	t	t	\N	\N	\N	2026-06-18 18:51:23.119	2026-06-18 18:51:49.193	0	0
884bac17-0917-4b96-a1c3-0166e5480b1b	416af8dc-b903-425c-92cd-f12ca2483386	\N	bde29a4d-e296-4b90-9422-8a8527e427ca	a97eacc2-95d5-4fb0-9754-e2de9562927b	READY_MADE	Audit To Inactivate 1781808669195	\N	\N	\N	\N	400.00	\N	\N	STANDARD	\N	\N	\N	\N	INACTIVE	f	t	t	f	\N	\N	\N	2026-06-18 18:51:23.592	2026-06-18 18:51:50.726	0	0
405e28d5-4e8b-46f0-8f7a-8f0582c438c3	416af8dc-b903-425c-92cd-f12ca2483386	\N	c9430425-b8a9-490e-8ea3-185fc4ef724f	6e754310-e84b-4d00-a6d6-8ef8d0ae2e1b	READY_MADE	Audit Prod 1 1781809114924	\N	\N	\N	\N	1000.00	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	f	t	t	f	\N	\N	\N	2026-06-18 18:58:38.718	2026-06-18 18:58:38.718	0	0
23e62d17-4dd4-42aa-a106-5d4f9ebba6fc	416af8dc-b903-425c-92cd-f12ca2483386	\N	c9430425-b8a9-490e-8ea3-185fc4ef724f	6e754310-e84b-4d00-a6d6-8ef8d0ae2e1b	READY_MADE	Audit Prod 2 1781809114924	\N	\N	\N	\N	500.00	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	f	t	t	f	\N	\N	\N	2026-06-18 18:58:39.219	2026-06-18 18:58:39.219	0	0
c8704420-9b8a-4ba0-a033-cc44c79b129e	ebb03214-7fe9-48bc-9702-ce513b1fe095	\N	c9430425-b8a9-490e-8ea3-185fc4ef724f	6e754310-e84b-4d00-a6d6-8ef8d0ae2e1b	READY_MADE	Boutique B Product 1781809114924	\N	\N	\N	\N	999.00	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	f	t	t	f	\N	\N	\N	2026-06-18 18:58:39.471	2026-06-18 18:58:39.471	0	0
fe9da2dd-36cb-4173-8cab-1fd28fa92da6	416af8dc-b903-425c-92cd-f12ca2483386	\N	c9430425-b8a9-490e-8ea3-185fc4ef724f	6e754310-e84b-4d00-a6d6-8ef8d0ae2e1b	READY_MADE	Audit To Delete 1781809114924	\N	\N	\N	\N	300.00	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	f	t	t	t	\N	\N	\N	2026-06-18 18:58:41.224	2026-06-18 18:58:56.397	0	0
143309f2-b0f1-4277-8182-babe121a4551	416af8dc-b903-425c-92cd-f12ca2483386	\N	c9430425-b8a9-490e-8ea3-185fc4ef724f	6e754310-e84b-4d00-a6d6-8ef8d0ae2e1b	READY_MADE	Audit To Inactivate 1781809114924	\N	\N	\N	\N	400.00	\N	\N	STANDARD	\N	\N	\N	\N	INACTIVE	f	t	t	f	\N	\N	\N	2026-06-18 18:58:41.475	2026-06-18 18:58:57.403	0	0
50b5e987-1a09-4714-8293-501d38452549	416af8dc-b903-425c-92cd-f12ca2483386	\N	42b3ee53-391f-441b-b8b6-73ecd43797c5	6cb4dbc7-b424-4ab8-a120-5309c7486514	READY_MADE	Audit Prod 1 1781809334074	\N	\N	\N	\N	1000.00	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	f	t	t	f	\N	\N	\N	2026-06-18 19:02:18.006	2026-06-18 19:02:18.006	0	0
40d28def-27f1-417a-8c6c-18cdf1671b3f	416af8dc-b903-425c-92cd-f12ca2483386	\N	42b3ee53-391f-441b-b8b6-73ecd43797c5	6cb4dbc7-b424-4ab8-a120-5309c7486514	READY_MADE	Audit Prod 2 1781809334074	\N	\N	\N	\N	500.00	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	f	t	t	f	\N	\N	\N	2026-06-18 19:02:18.525	2026-06-18 19:02:18.525	0	0
16c6c907-ae69-46e6-b8fb-d6cc8470de7f	8f5b1639-55db-4043-9069-d90579d02921	\N	42b3ee53-391f-441b-b8b6-73ecd43797c5	6cb4dbc7-b424-4ab8-a120-5309c7486514	READY_MADE	Boutique B Product 1781809334074	\N	\N	\N	\N	999.00	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	f	t	t	f	\N	\N	\N	2026-06-18 19:02:18.785	2026-06-18 19:02:18.785	0	0
3b675a38-55b3-45e6-a773-3e80e88f6936	416af8dc-b903-425c-92cd-f12ca2483386	\N	42b3ee53-391f-441b-b8b6-73ecd43797c5	6cb4dbc7-b424-4ab8-a120-5309c7486514	READY_MADE	Audit To Delete 1781809334074	\N	\N	\N	\N	300.00	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	f	t	t	t	\N	\N	\N	2026-06-18 19:02:20.595	2026-06-18 19:02:31.451	0	0
c5000fd0-42fc-47d3-8fbb-0e40814e7980	416af8dc-b903-425c-92cd-f12ca2483386	\N	42b3ee53-391f-441b-b8b6-73ecd43797c5	6cb4dbc7-b424-4ab8-a120-5309c7486514	READY_MADE	Audit To Inactivate 1781809334074	\N	\N	\N	\N	400.00	\N	\N	STANDARD	\N	\N	\N	\N	INACTIVE	f	t	t	f	\N	\N	\N	2026-06-18 19:02:20.854	2026-06-18 19:02:32.487	0	0
aa35c61c-9cf8-4669-a0d2-0e583774bc3f	416af8dc-b903-425c-92cd-f12ca2483386	\N	90a299fc-ffdb-45ca-ac79-76144b32e87c	01a9b824-1943-4286-ad32-4345edc17c81	READY_MADE	Audit Prod 1 1781809480752	\N	\N	\N	\N	1000.00	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	f	t	t	f	\N	\N	\N	2026-06-18 19:04:44.711	2026-06-18 19:04:44.711	0	0
ec6195ef-4dda-4fab-a1f1-b10a23c376d9	416af8dc-b903-425c-92cd-f12ca2483386	\N	90a299fc-ffdb-45ca-ac79-76144b32e87c	01a9b824-1943-4286-ad32-4345edc17c81	READY_MADE	Audit Prod 2 1781809480752	\N	\N	\N	\N	500.00	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	f	t	t	f	\N	\N	\N	2026-06-18 19:04:45.229	2026-06-18 19:04:45.229	0	0
81b7df6a-5fa3-40f0-b361-bf0d9489fa0f	adace4fb-ac88-4f51-8e3d-02090b6b093d	\N	90a299fc-ffdb-45ca-ac79-76144b32e87c	01a9b824-1943-4286-ad32-4345edc17c81	READY_MADE	Boutique B Product 1781809480752	\N	\N	\N	\N	999.00	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	f	t	t	f	\N	\N	\N	2026-06-18 19:04:45.49	2026-06-18 19:04:45.49	0	0
a5aab1d0-a86b-40da-bfda-abe0f5c83ffb	416af8dc-b903-425c-92cd-f12ca2483386	\N	90a299fc-ffdb-45ca-ac79-76144b32e87c	01a9b824-1943-4286-ad32-4345edc17c81	READY_MADE	Audit To Delete 1781809480752	\N	\N	\N	\N	300.00	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	f	t	t	t	\N	\N	\N	2026-06-18 19:04:47.298	2026-06-18 19:05:03.102	0	0
0c0d325e-111f-49b6-96b5-b72b9006621d	416af8dc-b903-425c-92cd-f12ca2483386	\N	90a299fc-ffdb-45ca-ac79-76144b32e87c	01a9b824-1943-4286-ad32-4345edc17c81	READY_MADE	Audit To Inactivate 1781809480752	\N	\N	\N	\N	400.00	\N	\N	STANDARD	\N	\N	\N	\N	INACTIVE	f	t	t	f	\N	\N	\N	2026-06-18 19:04:47.558	2026-06-18 19:05:04.129	0	0
e787b99c-23a4-40dd-b0e5-598467c46da8	416af8dc-b903-425c-92cd-f12ca2483386	\N	90a299fc-ffdb-45ca-ac79-76144b32e87c	01a9b824-1943-4286-ad32-4345edc17c81	READY_MADE	Audit Constraint Prod 1781809514369	\N	\N	\N	\N	100.00	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	f	t	t	f	\N	\N	\N	2026-06-18 19:05:14.37	2026-06-18 19:05:14.37	0	0
39d029a5-b0aa-4f31-8b3a-0f256bbe86d3	154c28b2-97e5-4179-824e-8179589d5547	003ac880-776e-4b84-95b4-23e1ffd8e799	392abf64-af32-4e93-99ff-0e7243b54cfc	0de91bc3-d70d-49d7-b3c9-10ba282d78da	READY_MADE	E2E Updated	\N	\N	E2E-1782103543855	\N	1999.00	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	t	t	t	t	\N	\N	\N	2026-06-22 04:45:55.385	2026-06-22 04:46:49.228	0	0
abc779aa-b799-4d31-95da-24d92a3117e2	e4e28167-51e8-4ce9-826a-4c6f4449721c	\N	4651ac3a-c744-4a22-ab99-01168f89d1d0	\N	READY_MADE	Coupon Test Product	\N	\N	\N	\N	1000.00	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	f	t	t	f	\N	\N	\N	2026-06-22 04:47:07.183	2026-06-22 04:47:07.183	0	0
203e6454-b477-49fb-8fca-963537bbdfe3	e4e28167-51e8-4ce9-826a-4c6f4449721c	\N	\N	\N	READY_MADE	Coupon Test Product 2	\N	\N	\N	\N	500.00	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	f	t	t	f	\N	\N	\N	2026-06-22 04:47:07.729	2026-06-22 04:47:07.729	0	0
5d3f8cfb-5c57-4234-92b1-54e5775cc71f	154c28b2-97e5-4179-824e-8179589d5547	e70ee2b1-84ff-41b7-beb2-3bbc003968b9	0411488f-4570-4640-9531-fd242a384295	23ef7a87-ea4d-4ad5-988b-aaa443b4ebe9	READY_MADE	E2E Updated	\N	\N	E2E-1782103732085	\N	1999.00	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	t	t	t	t	\N	\N	\N	2026-06-22 04:49:00.115	2026-06-22 04:49:42.275	0	0
9e953786-5208-482b-9aad-9fd59d522801	154c28b2-97e5-4179-824e-8179589d5547	663309c9-c87d-4589-9ef3-4c94d9930892	c9430425-b8a9-490e-8ea3-185fc4ef724f	6e754310-e84b-4d00-a6d6-8ef8d0ae2e1b	READY_MADE	E2E Updated	\N	\N	E2E-1782108797325	\N	1999.00	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	t	t	t	t	\N	\N	\N	2026-06-22 06:13:26.479	2026-06-22 06:14:23.16	0	0
e2325ca0-ecb2-492f-99a3-95f0aadf455b	0f9b0f5a-ad9f-418f-b24c-bb20df336626	\N	5eec108d-0ff3-4117-9589-8aca4546a828	\N	READY_MADE	Coupon Test Product	\N	\N	\N	\N	1000.00	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	f	t	t	f	\N	\N	\N	2026-06-22 04:49:50.811	2026-06-22 04:49:50.811	0	0
b05123c2-365a-403b-b1e5-c7e90ed58a8e	0f9b0f5a-ad9f-418f-b24c-bb20df336626	\N	\N	\N	READY_MADE	Coupon Test Product 2	\N	\N	\N	\N	500.00	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	f	t	t	f	\N	\N	\N	2026-06-22 04:49:51.362	2026-06-22 04:49:51.362	0	0
03b55a79-956a-450b-a907-cde762bad400	41c3ef8d-4fba-4c34-8178-407099d4712f	\N	bd7abb45-4fa2-49ba-935e-05aec1ebbf7f	\N	READY_MADE	Coupon Test Product	\N	\N	\N	\N	1000.00	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	f	t	t	f	\N	\N	\N	2026-06-22 04:50:09.334	2026-06-22 04:50:09.334	0	0
0e08bf12-e1b5-48ed-ba94-626bcbfb65af	41c3ef8d-4fba-4c34-8178-407099d4712f	\N	\N	\N	READY_MADE	Coupon Test Product 2	\N	\N	\N	\N	500.00	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	f	t	t	f	\N	\N	\N	2026-06-22 04:50:09.914	2026-06-22 04:50:09.914	0	0
e6432376-09bf-4ade-b6fb-9404a3e48070	e348a642-ac02-419e-9c90-dd8ed38616bf	\N	1d4bfbc7-154d-4ed8-bed0-2a6a2c54e794	\N	READY_MADE	Coupon Test Product	\N	\N	\N	\N	1000.00	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	f	t	t	f	\N	\N	\N	2026-06-22 06:24:09.171	2026-06-22 06:24:09.171	0	0
6d454bed-36d1-456e-95e8-18897fe26f1c	e348a642-ac02-419e-9c90-dd8ed38616bf	\N	\N	\N	READY_MADE	Coupon Test Product 2	\N	\N	\N	\N	500.00	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	f	t	t	f	\N	\N	\N	2026-06-22 06:24:10.774	2026-06-22 06:24:10.774	0	0
d4224e8d-0794-4f10-804e-7ee4ea720d65	ee732cec-30a1-4c83-9238-5cc412f364d8	\N	6fe04503-3c5c-4299-83c4-5d197647938f	\N	READY_MADE	Coupon Test Product	\N	\N	\N	\N	1000.00	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	f	t	t	f	\N	\N	\N	2026-06-22 04:41:35.134	2026-06-22 04:41:35.134	0	0
f0875728-b869-40aa-839e-0e85d2a13935	ee732cec-30a1-4c83-9238-5cc412f364d8	\N	\N	\N	READY_MADE	Coupon Test Product 2	\N	\N	\N	\N	500.00	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	f	t	t	f	\N	\N	\N	2026-06-22 04:41:35.796	2026-06-22 04:41:35.796	0	0
0ee12b9b-3586-421c-bc67-d7ecb00344df	154c28b2-97e5-4179-824e-8179589d5547	\N	f538a3af-2b1b-4df1-97d0-560ef35591cf	094a73d7-c694-4291-a1bb-0930e6a2a4bf	READY_MADE	API Test Product	\N	\N	\N	\N	999.00	\N	\N	STANDARD	\N	\N	\N	\N	DRAFT	f	t	t	f	\N	\N	\N	2026-06-22 04:41:57.447	2026-06-22 04:41:57.447	0	0
00b503ba-e2ff-4ddd-9551-0a2ff3b2b1aa	154c28b2-97e5-4179-824e-8179589d5547	\N	f538a3af-2b1b-4df1-97d0-560ef35591cf	094a73d7-c694-4291-a1bb-0930e6a2a4bf	READY_MADE	Variant Test	\N	\N	VT-1782108706770	\N	999.00	\N	\N	STANDARD	\N	\N	\N	\N	DRAFT	f	t	t	f	\N	\N	\N	2026-06-22 06:11:58.809	2026-06-22 06:11:58.809	0	0
22fbfc8a-46fa-471e-b1e2-87aac5b94414	154c28b2-97e5-4179-824e-8179589d5547	\N	f538a3af-2b1b-4df1-97d0-560ef35591cf	094a73d7-c694-4291-a1bb-0930e6a2a4bf	READY_MADE	Variant Test	\N	\N	VT-1782108756652	\N	999.00	\N	\N	STANDARD	\N	\N	\N	\N	DRAFT	f	t	t	f	\N	\N	\N	2026-06-22 06:12:45.251	2026-06-22 06:12:45.251	0	0
dcd60b0d-54f7-4e92-8a22-99e4eb5edea3	d31a980d-407e-4511-a5eb-436a186d5092	\N	24fad22e-2b35-4ab8-95cc-50de54b4abab	\N	READY_MADE	Stress Product 1782112020354	\N	\N	\N	\N	500.00	\N	\N	STANDARD	\N	\N	\N	\N	ACTIVE	f	t	t	f	\N	\N	\N	2026-06-22 07:07:04.955	2026-06-22 07:07:04.955	0	0
\.


--
-- Data for Name: return_requests; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.return_requests (id, return_number, order_id, order_item_id, customer_id, reason, notes, status, refund_amount, requested_at, approved_at, rejected_at, completed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.reviews (id, boutique_id, user_id, order_id, rating, rating_stitching, rating_measurement, rating_delivery, rating_communication, rating_value, comment, reply, verified_purchase, review_images, report_count, moderation_status, is_suspicious, suspicious_reason, ip_address, created_at) FROM stdin;
8c59698e-e9f6-4f23-b4a6-961e7a2554ea	3b360640-f08b-460c-b06e-4f4ba821e298	b29700ad-222e-42e1-9137-ef0f389be22f	\N	5	\N	\N	\N	\N	\N	Absolutely beautiful stitching! Perfect fit.	\N	t	{}	0	APPROVED	f	\N	\N	2026-06-05 02:57:04.464
39728810-4dfe-4572-a24b-c45c71c8a94b	3b360640-f08b-460c-b06e-4f4ba821e298	6d8d307c-ca33-4b53-b7a2-4726acf44c0e	\N	5	\N	\N	\N	\N	\N	Amazing designer Blouse. Loved it.	\N	f	{}	0	APPROVED	f	\N	\N	2026-06-02 02:57:04.464
d8c6344e-1f03-4e34-b37e-c2b9d82bf36f	3b360640-f08b-460c-b06e-4f4ba821e298	7a003ffa-76ed-4e4a-8f98-316e8a95dfc5	\N	1	\N	\N	\N	\N	\N	SCAM BOUTIQUE! THEY TOOK MY MONEY AND STOLE MY DRESS!	\N	t	{}	0	PENDING	t	High NLP negative intensity	\N	2026-05-30 02:57:04.464
ede707bf-7492-466b-b333-1d78a25a3672	3b360640-f08b-460c-b06e-4f4ba821e298	f0b801e0-baa1-4344-8897-6c1f83b3dcba	\N	2	\N	\N	\N	\N	\N	Not satisfied, delayed delivery	\N	f	{}	0	PENDING	f	\N	\N	2026-05-27 02:57:04.464
6b5ef43e-873c-47bf-a39a-02bd55f98442	3b360640-f08b-460c-b06e-4f4ba821e298	ed855518-26d3-4eaf-9e17-43b290fbadfd	\N	5	\N	\N	\N	\N	\N	This is the best boutique ever, very fast delivery check out discount code: GET50!	\N	t	{}	0	FLAGGED	t	Contains promotional links/codes	\N	2026-05-24 02:57:04.464
\.


--
-- Data for Name: shipping_addresses; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.shipping_addresses (id, user_id, full_name, phone, address_line1, address_line2, city, state, pincode, is_default, created_at) FROM stdin;
c46b7564-18bb-4eb5-837e-623b58754eeb	eb75e40e-a0c8-46c6-953c-c914e399f9d4	Auto Default	9999999999	Auto St	\N	Auto City	Auto State	999999	t	2026-06-19 03:11:22.35
8e2e7a10-c5cf-49c1-8e3c-9ccfb1c4a37d	c1df2ddb-66de-4151-8d57-dafc9fbb08d0	John	1234567890	1 Main St	\N	Mumbai	Maharashtra	400001	t	2026-06-19 03:14:07.846
e235047d-b7f4-4b9a-b573-d03a3065a4cc	a4b291d0-5aa4-40e5-a813-d49e7d309480	Auto Default	9999999999	Auto St	\N	Auto City	Auto State	999999	t	2026-06-19 03:14:36.721
95255891-8ad3-4062-8647-cff02c80961e	e00770ea-ef70-470f-9b29-1a5d6df59470	Test User	9999999999	123 Test Street	\N	Hyderabad	Telangana	500001	t	2026-06-25 07:25:52.364
\.


--
-- Data for Name: sub_categories; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sub_categories (id, category_id, name, description, image, sort_order, is_active, created_at, updated_at) FROM stdin;
6e3a887a-6d59-4de2-b8c2-be585f1133d9	b4566aff-8c5b-4a21-949d-ad00efd8b4cd	Classic Sherwani	\N	\N	0	t	2026-06-18 16:30:19.74	2026-06-18 16:30:19.74
ff04fa73-08c7-4a48-9d8a-808a553b6db7	b4566aff-8c5b-4a21-949d-ad00efd8b4cd	Indo-Western Suit	\N	\N	0	t	2026-06-18 16:30:21.865	2026-06-18 16:30:21.865
72a29b80-3667-4ce8-a2e8-72813b34f882	b4566aff-8c5b-4a21-949d-ad00efd8b4cd	Jodhpuri Suit	\N	\N	0	t	2026-06-18 16:30:23.197	2026-06-18 16:30:23.197
cc491ba7-2c6e-4376-a7ea-ae47e420d6aa	b4566aff-8c5b-4a21-949d-ad00efd8b4cd	Bandhgala	\N	\N	0	t	2026-06-18 16:30:24.526	2026-06-18 16:30:24.526
ea7bfe71-0845-4602-b98c-41966c55d036	b4566aff-8c5b-4a21-949d-ad00efd8b4cd	Wedding Sherwani	\N	\N	0	t	2026-06-18 16:30:25.856	2026-06-18 16:30:25.856
131a4a6f-a529-4269-af3c-976cae996c48	b4566aff-8c5b-4a21-949d-ad00efd8b4cd	Reception Suit	\N	\N	0	t	2026-06-18 16:30:27.186	2026-06-18 16:30:27.186
83248087-7bce-4bfa-9f00-01b4c9f895df	e15d73aa-0bc6-4ce1-8fa0-b5ca874a65cf	Bridal Lehenga	\N	\N	0	t	2026-06-18 16:30:28.518	2026-06-18 16:30:28.518
3fc0471e-68fd-40e3-8bfa-35465a9beb5d	e15d73aa-0bc6-4ce1-8fa0-b5ca874a65cf	Reception Gown	\N	\N	0	t	2026-06-18 16:30:29.847	2026-06-18 16:30:29.847
b451d11f-6123-451a-860f-6f1054a8bc2f	e15d73aa-0bc6-4ce1-8fa0-b5ca874a65cf	Engagement Outfit	\N	\N	0	t	2026-06-18 16:30:31.177	2026-06-18 16:30:31.177
dbc88d4a-13cf-4ed0-be33-9e537ac59628	e15d73aa-0bc6-4ce1-8fa0-b5ca874a65cf	Mehendi Ensemble	\N	\N	0	t	2026-06-18 16:30:32.504	2026-06-18 16:30:32.504
91954027-3632-48c4-b9d7-92a713be7166	e15d73aa-0bc6-4ce1-8fa0-b5ca874a65cf	Sangeet Lehenga	\N	\N	0	t	2026-06-18 16:30:33.837	2026-06-18 16:30:33.837
16fbd89d-e6da-486b-94ba-c3b0e22046f0	e15d73aa-0bc6-4ce1-8fa0-b5ca874a65cf	Cocktail Dress	\N	\N	0	t	2026-06-18 16:30:35.431	2026-06-18 16:30:35.431
de5a4f56-ac49-4d14-9964-299ca8ff5613	410d9117-e13d-4669-96cb-b74026bdd8fa	Cotton Kurta	\N	\N	0	t	2026-06-18 16:30:36.76	2026-06-18 16:30:36.76
1148451a-161e-4612-b22e-c276cc20881e	410d9117-e13d-4669-96cb-b74026bdd8fa	Silk Kurta	\N	\N	0	t	2026-06-18 16:30:38.094	2026-06-18 16:30:38.094
44cef1d8-ad69-4ae6-ba41-657f44d29e59	410d9117-e13d-4669-96cb-b74026bdd8fa	Kurta Pajama Set	\N	\N	0	t	2026-06-18 16:30:39.424	2026-06-18 16:30:39.424
6fb489f7-8658-4f03-9706-fd670fa71e2d	410d9117-e13d-4669-96cb-b74026bdd8fa	Dhoti Kurta	\N	\N	0	t	2026-06-18 16:30:40.754	2026-06-18 16:30:40.754
59cda24f-2484-4f8c-adf1-b4afd7c193eb	410d9117-e13d-4669-96cb-b74026bdd8fa	Pathani Suit	\N	\N	0	t	2026-06-18 16:30:42.087	2026-06-18 16:30:42.087
9bf3bdef-d3d6-49ce-ad6a-6ce1ae8cfcae	410d9117-e13d-4669-96cb-b74026bdd8fa	Nehru Jacket	\N	\N	0	t	2026-06-18 16:30:43.411	2026-06-18 16:30:43.411
b1429980-8eb0-48ee-a4c2-312bbc4faea7	5b416adc-f64a-420e-8a50-30c4accf7ca8	Handloom Saree	\N	\N	0	t	2026-06-18 16:30:45.216	2026-06-18 16:30:45.216
5c9a2e8a-7f62-4e59-837b-635aa33594c2	5b416adc-f64a-420e-8a50-30c4accf7ca8	Designer Saree	\N	\N	0	t	2026-06-18 16:30:46.552	2026-06-18 16:30:46.552
9ae7d7b8-0c82-4406-a2c2-0a9ff83a42a1	5b416adc-f64a-420e-8a50-30c4accf7ca8	Silk Saree	\N	\N	0	t	2026-06-18 16:30:47.88	2026-06-18 16:30:47.88
a26ec249-d038-4333-85f0-25ad5bfa2808	5b416adc-f64a-420e-8a50-30c4accf7ca8	Printed Saree	\N	\N	0	t	2026-06-18 16:30:49.205	2026-06-18 16:30:49.205
347cf4e9-e1a5-43bc-bed0-28be9a453924	5b416adc-f64a-420e-8a50-30c4accf7ca8	Blouse Stitching	\N	\N	0	t	2026-06-18 16:30:50.8	2026-06-18 16:30:50.8
33877a08-94ac-471f-98be-6e9b330499f0	5b416adc-f64a-420e-8a50-30c4accf7ca8	Saree Draping	\N	\N	0	t	2026-06-18 16:30:52.133	2026-06-18 16:30:52.133
246b3689-ec05-4cd7-a407-2ecae0590d3a	6c781dcc-4836-4a88-b444-e0cc35d6fe40	Blazer & Suit	\N	\N	0	t	2026-06-18 16:30:53.462	2026-06-18 16:30:53.462
767b53f1-f84b-441e-9c42-39f91e3c4bf4	6c781dcc-4836-4a88-b444-e0cc35d6fe40	Western Gown	\N	\N	0	t	2026-06-18 16:30:54.791	2026-06-18 16:30:54.791
8885de29-65fc-453d-b247-bba544735182	6c781dcc-4836-4a88-b444-e0cc35d6fe40	Crop Top & Skirt	\N	\N	0	t	2026-06-18 16:30:56.12	2026-06-18 16:30:56.12
1c7d415d-ad83-43ca-a92a-ae332b4295a9	6c781dcc-4836-4a88-b444-e0cc35d6fe40	Jumpsuit	\N	\N	0	t	2026-06-18 16:30:57.451	2026-06-18 16:30:57.451
9bfc9eab-f5b1-4e2c-bdab-3558a60edc25	6c781dcc-4836-4a88-b444-e0cc35d6fe40	Fusion Dress	\N	\N	0	t	2026-06-18 16:30:58.78	2026-06-18 16:30:58.78
821af8ba-1410-4dd4-8b16-11de4201c3cc	6c781dcc-4836-4a88-b444-e0cc35d6fe40	Pant & Shirt	\N	\N	0	t	2026-06-18 16:31:00.111	2026-06-18 16:31:00.111
f1e510d5-5453-41d8-a2fe-ee74ba405f31	c6310a97-b478-4175-aa80-0ac8a98df22a	Boys Sherwani	\N	\N	0	t	2026-06-18 16:31:01.438	2026-06-18 16:31:01.438
ca54d95b-9d51-40d1-92a6-9eb3cf0dcf3c	c6310a97-b478-4175-aa80-0ac8a98df22a	Girls Lehenga	\N	\N	0	t	2026-06-18 16:31:02.764	2026-06-18 16:31:02.764
79c2f0fe-17c7-46c3-babd-c0007d697410	c6310a97-b478-4175-aa80-0ac8a98df22a	Kids Kurta	\N	\N	0	t	2026-06-18 16:31:04.092	2026-06-18 16:31:04.092
77456393-afd3-4923-8d16-17f3d38df797	c6310a97-b478-4175-aa80-0ac8a98df22a	Kids Indo-Western	\N	\N	0	t	2026-06-18 16:31:05.421	2026-06-18 16:31:05.421
cbc75785-9e35-4d43-97f0-3593d4913a47	c6310a97-b478-4175-aa80-0ac8a98df22a	Kids Western	\N	\N	0	t	2026-06-18 16:32:09.974	2026-06-18 16:32:09.974
6ba7613b-e3e0-4a19-ad80-9a2997a487bc	c6310a97-b478-4175-aa80-0ac8a98df22a	School Uniform	\N	\N	0	t	2026-06-18 16:32:11.813	2026-06-18 16:32:11.813
0c46c58b-91fa-4cd4-a195-3858c73b1f48	2419c616-444d-4e19-9244-ff28eb52c81d	Turban / Pagdi	\N	\N	0	t	2026-06-18 16:32:13.125	2026-06-18 16:32:13.125
5ed0d5c0-9147-4f63-9b92-308a521c91f3	2419c616-444d-4e19-9244-ff28eb52c81d	Stole / Dupatta	\N	\N	0	t	2026-06-18 16:32:14.437	2026-06-18 16:32:14.437
b4fa4c16-d112-4514-b94b-de7f32726297	2419c616-444d-4e19-9244-ff28eb52c81d	Fashion Jewelry	\N	\N	0	t	2026-06-18 16:32:15.751	2026-06-18 16:32:15.751
33c0e00c-9b44-4bcc-ab60-78ca3b24afc6	2419c616-444d-4e19-9244-ff28eb52c81d	Cufflinks	\N	\N	0	t	2026-06-18 16:32:17.065	2026-06-18 16:32:17.065
8c5e296f-c618-4739-9624-5a9ba745d1fe	2419c616-444d-4e19-9244-ff28eb52c81d	Footwear	\N	\N	0	t	2026-06-18 16:32:18.377	2026-06-18 16:32:18.377
a3046e14-4008-4083-b027-456b61e00e5f	2419c616-444d-4e19-9244-ff28eb52c81d	Brooch / Lapel Pin	\N	\N	0	t	2026-06-18 16:32:19.688	2026-06-18 16:32:19.688
5ae10054-9bd2-4a17-a042-0855590cd119	4c568875-d770-4045-b0de-1e5bdfa743c7	TestSubCat 1781805719560	Owner product test subcategory	\N	0	t	2026-06-18 18:01:59.562	2026-06-18 18:01:59.562
8c573535-1946-4e53-a4dc-f32880e43416	6f36e050-bde1-4390-aaaa-704d035a61e6	TestSubCat 1781805790048	Owner product test subcategory	\N	0	t	2026-06-18 18:03:10.049	2026-06-18 18:03:10.049
661e45bd-0c95-4ea3-abb6-a827d1c9bdb2	ed7fd462-a008-4f79-9af5-306612f4ffd0	WishlistSubCat 1781806803179	\N	\N	0	t	2026-06-18 18:20:03.181	2026-06-18 18:20:03.181
568bd02b-1535-43d6-af0b-e2befdb7839a	7d82019f-54b6-47b2-af9c-53e5b74da244	WishlistSubCat 1781807125019	\N	\N	0	t	2026-06-18 18:25:25.02	2026-06-18 18:25:25.02
0de91bc3-d70d-49d7-b3c9-10ba282d78da	392abf64-af32-4e93-99ff-0e7243b54cfc	WishlistSubCat 1781807144393	\N	\N	0	t	2026-06-18 18:25:44.394	2026-06-18 18:25:44.394
23ef7a87-ea4d-4ad5-988b-aaa443b4ebe9	0411488f-4570-4640-9531-fd242a384295	AuditSubCat 1781807824326	\N	\N	0	t	2026-06-18 18:37:07.662	2026-06-18 18:37:07.662
a97eacc2-95d5-4fb0-9754-e2de9562927b	bde29a4d-e296-4b90-9422-8a8527e427ca	AuditSubCat 1781808669195	\N	\N	0	t	2026-06-18 18:51:13.635	2026-06-18 18:51:13.635
6e754310-e84b-4d00-a6d6-8ef8d0ae2e1b	c9430425-b8a9-490e-8ea3-185fc4ef724f	AuditSubCat 1781809114924	\N	\N	0	t	2026-06-18 18:58:37.214	2026-06-18 18:58:37.214
6cb4dbc7-b424-4ab8-a120-5309c7486514	42b3ee53-391f-441b-b8b6-73ecd43797c5	AuditSubCat 1781809334074	\N	\N	0	t	2026-06-18 19:02:16.439	2026-06-18 19:02:16.439
01a9b824-1943-4286-ad32-4345edc17c81	90a299fc-ffdb-45ca-ac79-76144b32e87c	AuditSubCat 1781809480752	\N	\N	0	t	2026-06-18 19:04:43.16	2026-06-18 19:04:43.16
094a73d7-c694-4291-a1bb-0930e6a2a4bf	f538a3af-2b1b-4df1-97d0-560ef35591cf	TestSubCat 1782103078229	Owner product test subcategory	\N	0	t	2026-06-22 04:37:58.23	2026-06-22 04:37:58.23
\.


--
-- Data for Name: subscription_billing_history; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.subscription_billing_history (id, subscription_id, amount, payment_status, payment_method, invoice_url, created_at) FROM stdin;
\.


--
-- Data for Name: subscription_plans; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.subscription_plans (id, name, plan_code, description, monthly_price, yearly_price, trial_period_days, grace_period_days, sort_order, is_active, is_featured, recommended_plan, created_at, updated_at, allow_direct_selling, allow_custom_tailoring, max_ready_made_products, max_custom_designs, max_orders_per_month, max_bookings_per_month, max_customers, max_measurements, max_gallery_images, max_staff_accounts, max_branches, can_manage_products, can_manage_stock, can_manage_shipping, can_manage_returns, can_manage_coupons, can_manage_offers, can_manage_product_variants, can_manage_reviews, can_use_custom_measurements, can_use_measurement_history, can_create_custom_orders, can_manage_tailoring_orders, can_manage_production_workflow, can_manage_tailor_assignments, can_manage_customers, can_manage_customer_notes, can_manage_rewards, can_manage_referrals, can_manage_wallet, can_manage_staff, can_manage_attendance, can_manage_tasks, can_manage_payroll, can_use_whatsapp_marketing, can_use_sms_marketing, can_use_email_marketing, can_create_campaigns, can_view_analytics, can_view_advanced_analytics, can_view_financial_reports, can_list_in_marketplace, can_feature_products, can_feature_boutique, can_sell_premium_designs, can_use_ai_assistant, can_use_ai_recommendations, can_use_ai_design_suggestions, can_use_api_access, can_use_custom_branding, can_use_white_label, can_use_multi_branch) FROM stdin;
4f2694be-9a84-4415-8b33-169f758b65fd	STARTER	starter_monthly	Starter subscription plan	999.00	9990.00	14	3	1	t	f	f	2026-06-17 18:00:22.972	2026-06-18 16:31:16.296	t	f	100	0	500	0	-1	0	200	5	1	t	t	f	f	t	t	f	t	f	f	f	t	f	f	t	t	f	f	f	t	f	f	f	f	f	f	f	t	f	f	t	f	f	f	f	f	f	f	f	f	f
e036df85-63ec-4c83-8ce1-ea1cd9cff6f1	PRO	pro_monthly	Pro subscription plan	2999.00	29990.00	14	3	2	t	t	t	2026-06-17 18:00:23.232	2026-06-18 16:31:17.058	t	t	999999	999999	999999	100	-1	-1	999999	20	2	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	f	t	t	t	t	t	t	f	t	t	t	f	t	t	f	f	t	f	f
fdedbcb8-5649-48fc-a79f-7a47254c876f	ENTERPRISE	enterprise_monthly	Enterprise subscription plan	9999.00	99990.00	14	3	3	t	f	f	2026-06-17 18:00:23.493	2026-06-18 16:31:17.82	t	t	999999	999999	999999	999999	-1	-1	999999	999999	999999	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t
6382ecb7-a82e-49f9-8770-c0edc63e0e4b	FREE	free_monthly	Free subscription plan	0.00	0.00	0	3	0	t	f	f	2026-06-17 18:00:22.268	2026-06-22 06:12:25.878	t	f	999999	0	999999	0	999999	0	20	1	1	t	t	f	f	f	f	t	t	f	f	f	t	f	f	t	t	f	f	f	t	f	f	f	f	f	f	f	f	f	f	t	f	f	f	f	f	f	f	f	f	f
6b6997d9-5663-4d45-811f-1766a5353d17	FREE	free_monthly_copy	Free subscription plan	0.00	0.00	0	3	0	f	f	f	2026-06-22 09:46:24.347	2026-06-22 09:46:36.89	t	f	999999	0	999999	0	999999	0	20	1	1	t	t	f	f	f	f	t	t	f	f	f	t	f	f	t	t	f	f	f	t	f	f	f	f	f	f	f	f	f	f	t	f	f	f	f	f	f	f	f	f	f
\.


--
-- Data for Name: support_ticket_admin_notes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.support_ticket_admin_notes (id, ticket_id, admin_id, note, created_at) FROM stdin;
\.


--
-- Data for Name: support_ticket_messages; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.support_ticket_messages (id, ticket_id, sender_type, sender_id, sender_name, message, attachment_url, attachment_type, created_at) FROM stdin;
\.


--
-- Data for Name: support_tickets; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.support_tickets (id, user_id, boutique_id, order_id, ticket_type, priority, escalation_level, source, subject, description, status, assigned_admin_id, created_at, updated_at, first_response_at, resolved_at, escalated_at, sla_breached, fraud_score, risk_level, excessive_ticket_flag, attachment_url, attachment_type) FROM stdin;
3b5bd8dc-b5b1-4a9f-bc24-a358ec45af83	b29700ad-222e-42e1-9137-ef0f389be22f	3b360640-f08b-460c-b06e-4f4ba821e298	\N	ORDER_ISSUE	MEDIUM	NONE	WEB	Expected delivery date query	When will order ORD-123 be delivered?	OPEN	\N	2026-06-05 00:57:04.464	2026-06-05 02:57:04.632	\N	\N	\N	f	10	LOW	f	\N	\N
1f0851cf-3c1e-4c4d-b0b6-60cd3a1ccbbd	6d8d307c-ca33-4b53-b7a2-4726acf44c0e	3b360640-f08b-460c-b06e-4f4ba821e298	\N	PAYMENT_ISSUE	HIGH	NONE	WEB	Double charge on my credit card	I was charged twice for booking.	OPEN	\N	2026-06-04 21:57:04.464	2026-06-05 02:57:04.636	\N	\N	\N	f	10	LOW	f	\N	\N
e62517e3-9e75-498e-a4d9-cbf137d5d273	7a003ffa-76ed-4e4a-8f98-316e8a95dfc5	3b360640-f08b-460c-b06e-4f4ba821e298	\N	REFUND_REQUEST	CRITICAL	NONE	WEB	Refund delay	Refund not received yet.	IN_PROGRESS	\N	2026-06-03 14:57:04.464	2026-06-05 02:57:04.639	\N	\N	\N	t	60	HIGH	f	\N	\N
34144fff-1a0a-46b2-84fb-674b1b6e10a9	f0b801e0-baa1-4344-8897-6c1f83b3dcba	3b360640-f08b-460c-b06e-4f4ba821e298	\N	CUSTOMER_COMPLAINT	MEDIUM	NONE	WEB	Bad communication	Boutique owner is not responsive.	OPEN	\N	2026-06-03 02:57:04.464	2026-06-05 02:57:04.641	\N	\N	\N	t	10	LOW	t	\N	\N
84233fb4-be51-4460-bbde-6fe36820ed22	ed855518-26d3-4eaf-9e17-43b290fbadfd	3b360640-f08b-460c-b06e-4f4ba821e298	\N	ORDER_ISSUE	LOW	NONE	WEB	Address change request	Update my address please.	RESOLVED	\N	2026-06-02 02:57:04.464	2026-06-05 02:57:04.644	\N	\N	\N	f	10	LOW	f	\N	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, phone, name, status, segment, created_at, otp, otp_expires_at) FROM stdin;
b29700ad-222e-42e1-9137-ef0f389be22f	9876543200	Aranya Sen	ACTIVE	VIP	2026-06-05 02:57:04.424	\N	\N
6d8d307c-ca33-4b53-b7a2-4726acf44c0e	9876543201	Bhavya Rao	ACTIVE	VIP	2026-06-03 02:57:04.433	\N	\N
7a003ffa-76ed-4e4a-8f98-316e8a95dfc5	9876543202	Deepika Padukone	ACTIVE	VIP	2026-06-01 02:57:04.435	\N	\N
f0b801e0-baa1-4344-8897-6c1f83b3dcba	9876543203	Esha Deol	ACTIVE	ACTIVE	2026-05-30 02:57:04.437	\N	\N
ed855518-26d3-4eaf-9e17-43b290fbadfd	9876543204	Gauri Khan	ACTIVE	ACTIVE	2026-05-28 02:57:04.44	\N	\N
98402b40-f980-4afd-94c9-24e655be507f	9876543205	Ishita Sharma	ACTIVE	ACTIVE	2026-05-26 02:57:04.442	\N	\N
c253196e-0a2f-42be-9d25-0703dc299a11	9876543206	Kriti Sanon	ACTIVE	ACTIVE	2026-05-24 02:57:04.445	\N	\N
e4cac1e9-af60-43e1-95d3-f1e25cc16aab	9876543207	Meera Rajput	ACTIVE	ACTIVE	2026-05-22 02:57:04.447	\N	\N
d7ff1fc4-53d3-4c65-8099-5b1df71612da	9876543208	Neha Dhupia	ACTIVE	NEW	2026-05-20 02:57:04.449	\N	\N
a0e40168-e5a0-4d52-8c38-5dc7b699a801	9876543209	Priyanka Chopra	ACTIVE	NEW	2026-05-18 02:57:04.451	\N	\N
9a52b57d-9943-4e91-9482-de1d2700fb0c	9876543210	Rhea Chakraborty	ACTIVE	NEW	2026-05-16 02:57:04.453	\N	\N
ddc3a65c-48f8-47aa-903a-f168e46332b7	9876543211	Shraddha Kapoor	ACTIVE	NEW	2026-05-14 02:57:04.456	\N	\N
23a107f5-551c-4bb6-8a82-905048ddbd09	9876543212	Taapsee Pannu	ACTIVE	NEW	2026-05-12 02:57:04.458	\N	\N
67487184-01c0-457c-b4b0-b213bd587291	9876543213	Vidya Balan	ACTIVE	NEW	2026-05-10 02:57:04.46	\N	\N
54b57369-6046-4e12-8855-c5c8a0dd5825	9876543214	Yami Gautam	ACTIVE	NEW	2026-05-08 02:57:04.462	\N	\N
05969429-152d-4041-b84d-edc8786bbde3	9999988888	New User	ACTIVE	NEW	2026-06-05 02:57:10.871	\N	\N
c4c6b80e-7521-42db-9aca-f5ba44393974	9111111001	Customer One	ACTIVE	NEW	2026-06-18 18:20:10.616	\N	\N
7c28ff2a-e342-4bc1-8570-db66548f7eab	9111111002	Customer Two	ACTIVE	NEW	2026-06-18 18:20:11.468	\N	\N
d8227294-8b84-422f-b1a6-83578207ae94	91111111781807148965	Customer One	ACTIVE	NEW	2026-06-18 18:25:48.967	\N	\N
bfb31d8b-253c-47ba-9658-e93823f7342d	92222221781807148965	Customer Two	ACTIVE	NEW	2026-06-18 18:25:49.971	\N	\N
2d115048-c9d1-4a8a-abad-dbfe023b081c	99990001781807824326	Cart Customer 1	ACTIVE	NEW	2026-06-18 18:37:13.988	\N	\N
9249b3b6-c219-4c71-884a-c512bf257ecd	99990011781807824326	Cart Customer 2	ACTIVE	NEW	2026-06-18 18:37:14.812	\N	\N
7235d5ec-662e-4d1a-9220-d5aec3df6f66	99990001781808669195	Cart Customer 1	ACTIVE	NEW	2026-06-18 18:51:23.999	\N	\N
73f26525-68f3-4a72-abc6-58f9ad8c17d3	99990011781808669195	Cart Customer 2	ACTIVE	NEW	2026-06-18 18:51:25.128	\N	\N
b4ea6dd1-727e-4950-9cc3-709429d9d089	99990001781809114924	Cart Customer 1	ACTIVE	NEW	2026-06-18 18:58:41.726	\N	\N
2d3265eb-1ddc-4ef2-8dfb-7da686576ba2	99990011781809114924	Cart Customer 2	ACTIVE	NEW	2026-06-18 18:58:42.227	\N	\N
c60f6ccc-fd11-4b3e-99fb-08d2a1aa563d	99990001781809334074	Cart Customer 1	ACTIVE	NEW	2026-06-18 19:02:21.113	\N	\N
1de8d272-1b64-4c37-a054-588b565675f8	99990011781809334074	Cart Customer 2	ACTIVE	NEW	2026-06-18 19:02:21.632	\N	\N
34ba5271-bc6b-4310-8d71-5d1e986724cb	99990001781809480752	Cart Customer 1	ACTIVE	NEW	2026-06-18 19:04:47.818	\N	\N
12b8ad26-5404-42c8-add0-87802fc31f4e	99990011781809480752	Cart Customer 2	ACTIVE	NEW	2026-06-18 19:04:48.337	\N	\N
e70e0a7f-77e5-4ede-b101-2e48de465c26	99999001781812074548	Ship Customer 1	ACTIVE	NEW	2026-06-18 19:47:56.403	\N	\N
64fdca53-c61a-4ea1-82a3-814b6d4ead49	99999011781812074548	Ship Customer 2	ACTIVE	NEW	2026-06-18 19:47:56.927	\N	\N
eb75e40e-a0c8-46c6-953c-c914e399f9d4	99999001781838665165	Ship Customer 1	ACTIVE	NEW	2026-06-19 03:11:07.508	\N	\N
feb4cc98-5ff7-4c75-9e60-8fb6308f4aa5	99999011781838665165	Ship Customer 2	ACTIVE	NEW	2026-06-19 03:11:08.101	\N	\N
c1df2ddb-66de-4151-8d57-dafc9fbb08d0	99999001781838844835	Test	ACTIVE	NEW	2026-06-19 03:14:06.759	\N	\N
a4b291d0-5aa4-40e5-a813-d49e7d309480	99999001781838864320	Ship Customer 1	ACTIVE	NEW	2026-06-19 03:14:26.113	\N	\N
7dab5182-fe06-4221-b7d7-5e225078776e	99999011781838864320	Ship Customer 2	ACTIVE	NEW	2026-06-19 03:14:26.625	\N	\N
2c924802-3ea6-46c9-8b49-ac757eb5ff00	9999999996	New User	ACTIVE	NEW	2026-06-22 04:25:39.179	\N	\N
8cea8464-3433-4bd9-a7ac-3b5951a79db5	9999999995	New User	ACTIVE	NEW	2026-06-22 04:26:55.045	\N	\N
304da0e9-2ce8-402a-8df3-0d3cf51dc0ce	9999999994	New User	ACTIVE	NEW	2026-06-22 04:27:10.885	\N	\N
37ee804a-b95d-4e47-b37d-9d45baecd16b	9999999993	New User	ACTIVE	NEW	2026-06-22 04:27:45.03	\N	\N
2ac33923-61ac-4c42-bc02-539a1bcf2aff	9999999998	New User	ACTIVE	NEW	2026-06-22 04:24:50.704	\N	\N
e00770ea-ef70-470f-9b29-1a5d6df59470	9999999999	New User	ACTIVE	NEW	2026-06-23 03:24:55.77	\N	\N
ec909aba-e303-45a3-9cea-531477024eff	+91999900005798	Coupon Customer	ACTIVE	NEW	2026-06-22 06:24:05.8	\N	\N
3ffa4abd-b926-452b-b849-1eb9fcaf41d7	+91999900001138	Coupon Customer	ACTIVE	NEW	2026-06-22 04:41:33.133	\N	\N
687f8b7b-74b9-4355-a365-726d1bee2cac	+91888800003685	Coupon Customer 2	ACTIVE	NEW	2026-06-22 04:41:33.687	\N	\N
16d12870-dc25-4d43-bd65-13ef687be3e4	+91888800006730	Coupon Customer 2	ACTIVE	NEW	2026-06-22 06:24:06.732	\N	\N
2b25d884-74a8-46ff-9a3f-c267f4c3685a	+91999900003125	Coupon Customer	ACTIVE	NEW	2026-06-22 04:47:05.271	\N	\N
a3b3ee5e-3819-4667-9fee-45fb70087bd1	+91888800005818	Coupon Customer 2	ACTIVE	NEW	2026-06-22 04:47:05.82	\N	\N
a2ec72ca-4dd6-42c0-a066-0da0481ea2c8	+91999900006717	Coupon Customer	ACTIVE	NEW	2026-06-22 04:49:48.859	\N	\N
060dd72d-39f8-4ed4-aefb-7e2e78960dbd	+91888800009395	Coupon Customer 2	ACTIVE	NEW	2026-06-22 04:49:49.396	\N	\N
7b529a89-bcd7-44ab-a822-80f0c6c38ed6	+91999900005093	Coupon Customer	ACTIVE	NEW	2026-06-22 04:50:07.246	\N	\N
3d285609-0e23-4da3-b7f0-9a11dadf0bdf	+91888800007862	Coupon Customer 2	ACTIVE	NEW	2026-06-22 04:50:07.864	\N	\N
0d723df8-bc81-41bb-aa70-f254c6671f3f	+91999920354	Stress Tester	ACTIVE	NEW	2026-06-22 07:07:02.701	\N	\N
06fb2c69-4a4a-44a4-a77c-5c9a64bf3215	8575848930	New User	ACTIVE	NEW	2026-06-22 09:30:40.269	903413	2026-06-22 09:35:40.266
d354509d-581a-492a-9d6f-5b5bf8a0da00	9000000001	New User	ACTIVE	NEW	2026-06-23 03:30:46.661	\N	\N
a57183cb-996a-41dc-aecb-27a68b06212e	9000000002	New User	ACTIVE	NEW	2026-06-23 03:30:48.203	\N	\N
8afa4bb0-89e7-4da4-8f18-d7d604cc6e6f	7660922416	New User	ACTIVE	NEW	2026-06-22 09:25:18.226	\N	\N
\.


--
-- Data for Name: wishlists; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.wishlists (id, user_id, design_id, created_at) FROM stdin;
2b0b3151-c802-4faf-81e7-a4dbbb2264f3	b29700ad-222e-42e1-9137-ef0f389be22f	0a821036-397c-47dc-bbca-2de894aa5655	2026-06-05 02:57:04.464
1731ce7e-ad68-42a8-8e7e-79d0d42c645c	6d8d307c-ca33-4b53-b7a2-4726acf44c0e	0a821036-397c-47dc-bbca-2de894aa5655	2026-06-03 02:57:04.464
f3820740-ee0c-40f8-b6bc-b776b82ec7a5	7a003ffa-76ed-4e4a-8f98-316e8a95dfc5	0a821036-397c-47dc-bbca-2de894aa5655	2026-06-01 02:57:04.464
b90f7326-91ef-47ae-949d-0bf0035852b5	f0b801e0-baa1-4344-8897-6c1f83b3dcba	0a821036-397c-47dc-bbca-2de894aa5655	2026-05-30 02:57:04.464
891870dc-3e58-4c9d-96a6-fbc93b1bdbde	ed855518-26d3-4eaf-9e17-43b290fbadfd	0a821036-397c-47dc-bbca-2de894aa5655	2026-05-28 02:57:04.464
f748c257-cf47-42a9-80fd-ef0595174d29	98402b40-f980-4afd-94c9-24e655be507f	0a821036-397c-47dc-bbca-2de894aa5655	2026-05-26 02:57:04.464
551d1aaf-14f9-4e69-927a-46dd1a828d3e	c253196e-0a2f-42be-9d25-0703dc299a11	0a821036-397c-47dc-bbca-2de894aa5655	2026-05-24 02:57:04.464
f2fd88c5-7045-4641-a344-c719f810189b	e4cac1e9-af60-43e1-95d3-f1e25cc16aab	0a821036-397c-47dc-bbca-2de894aa5655	2026-05-22 02:57:04.464
\.


--
-- Name: _ProductToProductTag _ProductToProductTag_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."_ProductToProductTag"
    ADD CONSTRAINT "_ProductToProductTag_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: activities activities_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_pkey PRIMARY KEY (id);


--
-- Name: admin_notifications admin_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admin_notifications
    ADD CONSTRAINT admin_notifications_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: booking_histories booking_histories_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.booking_histories
    ADD CONSTRAINT booking_histories_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: boutique_subscriptions boutique_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.boutique_subscriptions
    ADD CONSTRAINT boutique_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: boutiques boutiques_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.boutiques
    ADD CONSTRAINT boutiques_pkey PRIMARY KEY (id);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: commerce_order_histories commerce_order_histories_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.commerce_order_histories
    ADD CONSTRAINT commerce_order_histories_pkey PRIMARY KEY (id);


--
-- Name: commerce_order_items commerce_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.commerce_order_items
    ADD CONSTRAINT commerce_order_items_pkey PRIMARY KEY (id);


--
-- Name: commerce_orders commerce_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.commerce_orders
    ADD CONSTRAINT commerce_orders_pkey PRIMARY KEY (id);


--
-- Name: commerce_payments commerce_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.commerce_payments
    ADD CONSTRAINT commerce_payments_pkey PRIMARY KEY (id);


--
-- Name: coupon_usages coupon_usages_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.coupon_usages
    ADD CONSTRAINT coupon_usages_pkey PRIMARY KEY (id);


--
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);


--
-- Name: custom_plan_requests custom_plan_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.custom_plan_requests
    ADD CONSTRAINT custom_plan_requests_pkey PRIMARY KEY (id);


--
-- Name: customer_addresses customer_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT customer_addresses_pkey PRIMARY KEY (id);


--
-- Name: customer_notifications customer_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customer_notifications
    ADD CONSTRAINT customer_notifications_pkey PRIMARY KEY (id);


--
-- Name: delivery_tracking_history delivery_tracking_history_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.delivery_tracking_history
    ADD CONSTRAINT delivery_tracking_history_pkey PRIMARY KEY (id);


--
-- Name: delivery_tracking delivery_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.delivery_tracking
    ADD CONSTRAINT delivery_tracking_pkey PRIMARY KEY (id);


--
-- Name: designs designs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.designs
    ADD CONSTRAINT designs_pkey PRIMARY KEY (id);


--
-- Name: exchange_requests exchange_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.exchange_requests
    ADD CONSTRAINT exchange_requests_pkey PRIMARY KEY (id);


--
-- Name: measurements measurements_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.measurements
    ADD CONSTRAINT measurements_pkey PRIMARY KEY (id);


--
-- Name: notification_campaigns notification_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notification_campaigns
    ADD CONSTRAINT notification_campaigns_pkey PRIMARY KEY (id);


--
-- Name: notification_receipts notification_receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notification_receipts
    ADD CONSTRAINT notification_receipts_pkey PRIMARY KEY (id);


--
-- Name: notification_templates notification_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notification_templates
    ADD CONSTRAINT notification_templates_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: order_histories order_histories_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.order_histories
    ADD CONSTRAINT order_histories_pkey PRIMARY KEY (id);


--
-- Name: order_sequences order_sequences_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.order_sequences
    ADD CONSTRAINT order_sequences_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: owner_feature_permissions owner_feature_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.owner_feature_permissions
    ADD CONSTRAINT owner_feature_permissions_pkey PRIMARY KEY (id);


--
-- Name: owners owners_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.owners
    ADD CONSTRAINT owners_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: payouts payouts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payouts
    ADD CONSTRAINT payouts_pkey PRIMARY KEY (id);


--
-- Name: platform_settings platform_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.platform_settings
    ADD CONSTRAINT platform_settings_pkey PRIMARY KEY (id);


--
-- Name: product_analytics product_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_analytics
    ADD CONSTRAINT product_analytics_pkey PRIMARY KEY (id);


--
-- Name: product_brands product_brands_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_brands
    ADD CONSTRAINT product_brands_pkey PRIMARY KEY (id);


--
-- Name: product_images product_images_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_pkey PRIMARY KEY (id);


--
-- Name: product_inventory_logs product_inventory_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_inventory_logs
    ADD CONSTRAINT product_inventory_logs_pkey PRIMARY KEY (id);


--
-- Name: product_inventory product_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_inventory
    ADD CONSTRAINT product_inventory_pkey PRIMARY KEY (id);


--
-- Name: product_reviews product_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_reviews
    ADD CONSTRAINT product_reviews_pkey PRIMARY KEY (id);


--
-- Name: product_tags product_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_tags
    ADD CONSTRAINT product_tags_pkey PRIMARY KEY (id);


--
-- Name: product_variant_attributes product_variant_attributes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_variant_attributes
    ADD CONSTRAINT product_variant_attributes_pkey PRIMARY KEY (id);


--
-- Name: product_variants product_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_pkey PRIMARY KEY (id);


--
-- Name: product_wishlists product_wishlists_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_wishlists
    ADD CONSTRAINT product_wishlists_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: return_requests return_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.return_requests
    ADD CONSTRAINT return_requests_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: shipping_addresses shipping_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shipping_addresses
    ADD CONSTRAINT shipping_addresses_pkey PRIMARY KEY (id);


--
-- Name: sub_categories sub_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sub_categories
    ADD CONSTRAINT sub_categories_pkey PRIMARY KEY (id);


--
-- Name: subscription_billing_history subscription_billing_history_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.subscription_billing_history
    ADD CONSTRAINT subscription_billing_history_pkey PRIMARY KEY (id);


--
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


--
-- Name: support_ticket_admin_notes support_ticket_admin_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.support_ticket_admin_notes
    ADD CONSTRAINT support_ticket_admin_notes_pkey PRIMARY KEY (id);


--
-- Name: support_ticket_messages support_ticket_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.support_ticket_messages
    ADD CONSTRAINT support_ticket_messages_pkey PRIMARY KEY (id);


--
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: wishlists wishlists_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_pkey PRIMARY KEY (id);


--
-- Name: _ProductToProductTag_B_index; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "_ProductToProductTag_B_index" ON public."_ProductToProductTag" USING btree ("B");


--
-- Name: admin_notifications_boutique_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX admin_notifications_boutique_id_idx ON public.admin_notifications USING btree (boutique_id);


--
-- Name: admin_notifications_created_at_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX admin_notifications_created_at_idx ON public.admin_notifications USING btree (created_at);


--
-- Name: admin_notifications_is_read_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX admin_notifications_is_read_idx ON public.admin_notifications USING btree (is_read);


--
-- Name: admin_notifications_recipient_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX admin_notifications_recipient_id_idx ON public.admin_notifications USING btree (recipient_id);


--
-- Name: admin_notifications_recipient_type_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX admin_notifications_recipient_type_idx ON public.admin_notifications USING btree (recipient_type);


--
-- Name: boutique_subscriptions_boutique_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX boutique_subscriptions_boutique_id_idx ON public.boutique_subscriptions USING btree (boutique_id);


--
-- Name: boutiques_is_deleted_status_featured_boutique_created_at_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX boutiques_is_deleted_status_featured_boutique_created_at_idx ON public.boutiques USING btree (is_deleted, status, featured_boutique, created_at);


--
-- Name: cart_items_cart_id_product_id_variant_id_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX cart_items_cart_id_product_id_variant_id_key ON public.cart_items USING btree (cart_id, product_id, variant_id);


--
-- Name: carts_user_id_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX carts_user_id_key ON public.carts USING btree (user_id);


--
-- Name: categories_name_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX categories_name_key ON public.categories USING btree (name);


--
-- Name: commerce_order_histories_order_id_created_at_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX commerce_order_histories_order_id_created_at_idx ON public.commerce_order_histories USING btree (order_id, created_at);


--
-- Name: commerce_order_items_order_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX commerce_order_items_order_id_idx ON public.commerce_order_items USING btree (order_id);


--
-- Name: commerce_order_items_product_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX commerce_order_items_product_id_idx ON public.commerce_order_items USING btree (product_id);


--
-- Name: commerce_order_items_variant_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX commerce_order_items_variant_id_idx ON public.commerce_order_items USING btree (variant_id);


--
-- Name: commerce_orders_boutique_id_created_at_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX commerce_orders_boutique_id_created_at_idx ON public.commerce_orders USING btree (boutique_id, created_at);


--
-- Name: commerce_orders_boutique_id_status_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX commerce_orders_boutique_id_status_idx ON public.commerce_orders USING btree (boutique_id, status);


--
-- Name: commerce_orders_created_at_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX commerce_orders_created_at_idx ON public.commerce_orders USING btree (created_at);


--
-- Name: commerce_orders_order_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX commerce_orders_order_id_idx ON public.commerce_orders USING btree (order_id);


--
-- Name: commerce_orders_order_id_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX commerce_orders_order_id_key ON public.commerce_orders USING btree (order_id);


--
-- Name: commerce_orders_payment_status_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX commerce_orders_payment_status_idx ON public.commerce_orders USING btree (payment_status);


--
-- Name: commerce_orders_user_id_created_at_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX commerce_orders_user_id_created_at_idx ON public.commerce_orders USING btree (user_id, created_at);


--
-- Name: commerce_orders_user_id_status_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX commerce_orders_user_id_status_idx ON public.commerce_orders USING btree (user_id, status);


--
-- Name: commerce_payments_commerce_order_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX commerce_payments_commerce_order_id_idx ON public.commerce_payments USING btree (commerce_order_id);


--
-- Name: commerce_payments_razorpay_order_id_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX commerce_payments_razorpay_order_id_key ON public.commerce_payments USING btree (razorpay_order_id);


--
-- Name: coupon_usages_coupon_id_user_id_order_id_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX coupon_usages_coupon_id_user_id_order_id_key ON public.coupon_usages USING btree (coupon_id, user_id, order_id);


--
-- Name: coupons_code_boutique_id_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX coupons_code_boutique_id_key ON public.coupons USING btree (code, boutique_id);


--
-- Name: coupons_code_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX coupons_code_idx ON public.coupons USING btree (code);


--
-- Name: customer_notifications_created_at_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX customer_notifications_created_at_idx ON public.customer_notifications USING btree (created_at);


--
-- Name: customer_notifications_customer_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX customer_notifications_customer_id_idx ON public.customer_notifications USING btree (customer_id);


--
-- Name: customer_notifications_is_read_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX customer_notifications_is_read_idx ON public.customer_notifications USING btree (is_read);


--
-- Name: delivery_tracking_history_tracking_id_created_at_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX delivery_tracking_history_tracking_id_created_at_idx ON public.delivery_tracking_history USING btree (tracking_id, created_at);


--
-- Name: delivery_tracking_order_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX delivery_tracking_order_id_idx ON public.delivery_tracking USING btree (order_id);


--
-- Name: designs_boutique_id_is_deleted_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX designs_boutique_id_is_deleted_idx ON public.designs USING btree (boutique_id, is_deleted);


--
-- Name: exchange_requests_customer_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX exchange_requests_customer_id_idx ON public.exchange_requests USING btree (customer_id);


--
-- Name: exchange_requests_exchange_number_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX exchange_requests_exchange_number_key ON public.exchange_requests USING btree (exchange_number);


--
-- Name: exchange_requests_order_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX exchange_requests_order_id_idx ON public.exchange_requests USING btree (order_id);


--
-- Name: exchange_requests_status_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX exchange_requests_status_idx ON public.exchange_requests USING btree (status);


--
-- Name: measurements_user_id_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX measurements_user_id_key ON public.measurements USING btree (user_id);


--
-- Name: notification_templates_name_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX notification_templates_name_key ON public.notification_templates USING btree (name);


--
-- Name: order_sequences_date_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX order_sequences_date_key ON public.order_sequences USING btree (date);


--
-- Name: orders_order_id_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX orders_order_id_key ON public.orders USING btree (order_id);


--
-- Name: owner_feature_permissions_owner_id_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX owner_feature_permissions_owner_id_key ON public.owner_feature_permissions USING btree (owner_id);


--
-- Name: owners_email_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX owners_email_key ON public.owners USING btree (email);


--
-- Name: owners_username_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX owners_username_key ON public.owners USING btree (username);


--
-- Name: product_analytics_product_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX product_analytics_product_id_idx ON public.product_analytics USING btree (product_id);


--
-- Name: product_analytics_product_id_period_start_period_end_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX product_analytics_product_id_period_start_period_end_key ON public.product_analytics USING btree (product_id, period_start, period_end);


--
-- Name: product_brands_boutique_id_name_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX product_brands_boutique_id_name_key ON public.product_brands USING btree (boutique_id, name);


--
-- Name: product_images_product_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX product_images_product_id_idx ON public.product_images USING btree (product_id);


--
-- Name: product_inventory_logs_product_id_created_at_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX product_inventory_logs_product_id_created_at_idx ON public.product_inventory_logs USING btree (product_id, created_at);


--
-- Name: product_inventory_logs_variant_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX product_inventory_logs_variant_id_idx ON public.product_inventory_logs USING btree (variant_id);


--
-- Name: product_inventory_variant_id_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX product_inventory_variant_id_key ON public.product_inventory USING btree (variant_id);


--
-- Name: product_reviews_product_id_status_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX product_reviews_product_id_status_idx ON public.product_reviews USING btree (product_id, status);


--
-- Name: product_reviews_product_id_user_id_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX product_reviews_product_id_user_id_key ON public.product_reviews USING btree (product_id, user_id);


--
-- Name: product_tags_boutique_id_name_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX product_tags_boutique_id_name_key ON public.product_tags USING btree (boutique_id, name);


--
-- Name: product_variant_attributes_product_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX product_variant_attributes_product_id_idx ON public.product_variant_attributes USING btree (product_id);


--
-- Name: product_variants_product_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX product_variants_product_id_idx ON public.product_variants USING btree (product_id);


--
-- Name: product_variants_product_id_sku_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX product_variants_product_id_sku_key ON public.product_variants USING btree (product_id, sku);


--
-- Name: product_wishlists_user_id_product_id_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX product_wishlists_user_id_product_id_key ON public.product_wishlists USING btree (user_id, product_id);


--
-- Name: products_boutique_id_sku_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX products_boutique_id_sku_key ON public.products USING btree (boutique_id, sku);


--
-- Name: products_boutique_id_status_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX products_boutique_id_status_idx ON public.products USING btree (boutique_id, status);


--
-- Name: products_category_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX products_category_id_idx ON public.products USING btree (category_id);


--
-- Name: products_status_created_at_is_marketplace_visible_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX products_status_created_at_is_marketplace_visible_idx ON public.products USING btree (status, created_at, is_marketplace_visible);


--
-- Name: return_requests_customer_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX return_requests_customer_id_idx ON public.return_requests USING btree (customer_id);


--
-- Name: return_requests_order_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX return_requests_order_id_idx ON public.return_requests USING btree (order_id);


--
-- Name: return_requests_return_number_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX return_requests_return_number_key ON public.return_requests USING btree (return_number);


--
-- Name: return_requests_status_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX return_requests_status_idx ON public.return_requests USING btree (status);


--
-- Name: reviews_boutique_id_moderation_status_created_at_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX reviews_boutique_id_moderation_status_created_at_idx ON public.reviews USING btree (boutique_id, moderation_status, created_at);


--
-- Name: shipping_addresses_user_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX shipping_addresses_user_id_idx ON public.shipping_addresses USING btree (user_id);


--
-- Name: sub_categories_category_id_name_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX sub_categories_category_id_name_key ON public.sub_categories USING btree (category_id, name);


--
-- Name: subscription_plans_plan_code_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX subscription_plans_plan_code_key ON public.subscription_plans USING btree (plan_code);


--
-- Name: uq_user_design; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX uq_user_design ON public.wishlists USING btree (user_id, design_id);


--
-- Name: users_phone_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX users_phone_key ON public.users USING btree (phone);


--
-- Name: _ProductToProductTag _ProductToProductTag_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."_ProductToProductTag"
    ADD CONSTRAINT "_ProductToProductTag_A_fkey" FOREIGN KEY ("A") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _ProductToProductTag _ProductToProductTag_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."_ProductToProductTag"
    ADD CONSTRAINT "_ProductToProductTag_B_fkey" FOREIGN KEY ("B") REFERENCES public.product_tags(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.owners(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: booking_histories booking_histories_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.booking_histories
    ADD CONSTRAINT booking_histories_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bookings bookings_assigned_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_assigned_owner_id_fkey FOREIGN KEY (assigned_owner_id) REFERENCES public.owners(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: bookings bookings_boutique_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_boutique_id_fkey FOREIGN KEY (boutique_id) REFERENCES public.boutiques(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bookings bookings_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: boutique_subscriptions boutique_subscriptions_boutique_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.boutique_subscriptions
    ADD CONSTRAINT boutique_subscriptions_boutique_id_fkey FOREIGN KEY (boutique_id) REFERENCES public.boutiques(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: boutique_subscriptions boutique_subscriptions_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.boutique_subscriptions
    ADD CONSTRAINT boutique_subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: boutiques boutiques_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.boutiques
    ADD CONSTRAINT boutiques_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.owners(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cart_items cart_items_cart_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.carts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cart_items cart_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cart_items cart_items_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: carts carts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: commerce_order_histories commerce_order_histories_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.commerce_order_histories
    ADD CONSTRAINT commerce_order_histories_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.commerce_orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: commerce_order_items commerce_order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.commerce_order_items
    ADD CONSTRAINT commerce_order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.commerce_orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: commerce_order_items commerce_order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.commerce_order_items
    ADD CONSTRAINT commerce_order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: commerce_order_items commerce_order_items_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.commerce_order_items
    ADD CONSTRAINT commerce_order_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: commerce_orders commerce_orders_boutique_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.commerce_orders
    ADD CONSTRAINT commerce_orders_boutique_id_fkey FOREIGN KEY (boutique_id) REFERENCES public.boutiques(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: commerce_orders commerce_orders_coupon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.commerce_orders
    ADD CONSTRAINT commerce_orders_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.coupons(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: commerce_orders commerce_orders_shipping_address_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.commerce_orders
    ADD CONSTRAINT commerce_orders_shipping_address_id_fkey FOREIGN KEY (shipping_address_id) REFERENCES public.shipping_addresses(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: commerce_orders commerce_orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.commerce_orders
    ADD CONSTRAINT commerce_orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: commerce_payments commerce_payments_commerce_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.commerce_payments
    ADD CONSTRAINT commerce_payments_commerce_order_id_fkey FOREIGN KEY (commerce_order_id) REFERENCES public.commerce_orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: coupon_usages coupon_usages_coupon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.coupon_usages
    ADD CONSTRAINT coupon_usages_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.coupons(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: coupon_usages coupon_usages_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.coupon_usages
    ADD CONSTRAINT coupon_usages_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.commerce_orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: coupon_usages coupon_usages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.coupon_usages
    ADD CONSTRAINT coupon_usages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: coupons coupons_boutique_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_boutique_id_fkey FOREIGN KEY (boutique_id) REFERENCES public.boutiques(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: custom_plan_requests custom_plan_requests_boutique_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.custom_plan_requests
    ADD CONSTRAINT custom_plan_requests_boutique_id_fkey FOREIGN KEY (boutique_id) REFERENCES public.boutiques(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: custom_plan_requests custom_plan_requests_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.custom_plan_requests
    ADD CONSTRAINT custom_plan_requests_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.owners(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: customer_addresses customer_addresses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT customer_addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: customer_notifications customer_notifications_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customer_notifications
    ADD CONSTRAINT customer_notifications_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: delivery_tracking_history delivery_tracking_history_tracking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.delivery_tracking_history
    ADD CONSTRAINT delivery_tracking_history_tracking_id_fkey FOREIGN KEY (tracking_id) REFERENCES public.delivery_tracking(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: delivery_tracking delivery_tracking_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.delivery_tracking
    ADD CONSTRAINT delivery_tracking_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.commerce_orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: designs designs_boutique_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.designs
    ADD CONSTRAINT designs_boutique_id_fkey FOREIGN KEY (boutique_id) REFERENCES public.boutiques(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: exchange_requests exchange_requests_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.exchange_requests
    ADD CONSTRAINT exchange_requests_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: exchange_requests exchange_requests_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.exchange_requests
    ADD CONSTRAINT exchange_requests_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.commerce_orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: exchange_requests exchange_requests_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.exchange_requests
    ADD CONSTRAINT exchange_requests_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.commerce_order_items(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: measurements measurements_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.measurements
    ADD CONSTRAINT measurements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notification_receipts notification_receipts_notification_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notification_receipts
    ADD CONSTRAINT notification_receipts_notification_id_fkey FOREIGN KEY (notification_id) REFERENCES public.notifications(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_boutique_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_boutique_id_fkey FOREIGN KEY (boutique_id) REFERENCES public.boutiques(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.notification_campaigns(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: notifications notifications_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.owners(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_recipient_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_recipient_user_id_fkey FOREIGN KEY (recipient_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_histories order_histories_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.order_histories
    ADD CONSTRAINT order_histories_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: orders orders_boutique_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_boutique_id_fkey FOREIGN KEY (boutique_id) REFERENCES public.boutiques(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: orders orders_design_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_design_id_fkey FOREIGN KEY (design_id) REFERENCES public.designs(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: orders orders_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.owners(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: owner_feature_permissions owner_feature_permissions_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.owner_feature_permissions
    ADD CONSTRAINT owner_feature_permissions_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.owners(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: owners owners_assigned_boutique_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.owners
    ADD CONSTRAINT owners_assigned_boutique_id_fkey FOREIGN KEY (assigned_boutique_id) REFERENCES public.boutiques(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payments payments_boutique_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_boutique_id_fkey FOREIGN KEY (boutique_id) REFERENCES public.boutiques(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payments payments_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payments payments_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payments payments_payout_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_payout_id_fkey FOREIGN KEY (payout_id) REFERENCES public.payouts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payouts payouts_boutique_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payouts
    ADD CONSTRAINT payouts_boutique_id_fkey FOREIGN KEY (boutique_id) REFERENCES public.boutiques(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_analytics product_analytics_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_analytics
    ADD CONSTRAINT product_analytics_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_brands product_brands_boutique_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_brands
    ADD CONSTRAINT product_brands_boutique_id_fkey FOREIGN KEY (boutique_id) REFERENCES public.boutiques(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: product_images product_images_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_inventory_logs product_inventory_logs_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_inventory_logs
    ADD CONSTRAINT product_inventory_logs_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_inventory_logs product_inventory_logs_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_inventory_logs
    ADD CONSTRAINT product_inventory_logs_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: product_inventory product_inventory_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_inventory
    ADD CONSTRAINT product_inventory_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_reviews product_reviews_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_reviews
    ADD CONSTRAINT product_reviews_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.commerce_orders(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: product_reviews product_reviews_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_reviews
    ADD CONSTRAINT product_reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: product_reviews product_reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_reviews
    ADD CONSTRAINT product_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: product_tags product_tags_boutique_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_tags
    ADD CONSTRAINT product_tags_boutique_id_fkey FOREIGN KEY (boutique_id) REFERENCES public.boutiques(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: product_variant_attributes product_variant_attributes_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_variant_attributes
    ADD CONSTRAINT product_variant_attributes_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_variants product_variants_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_wishlists product_wishlists_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_wishlists
    ADD CONSTRAINT product_wishlists_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_wishlists product_wishlists_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_wishlists
    ADD CONSTRAINT product_wishlists_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: products products_boutique_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_boutique_id_fkey FOREIGN KEY (boutique_id) REFERENCES public.boutiques(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: products products_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.product_brands(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_sub_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sub_category_id_fkey FOREIGN KEY (sub_category_id) REFERENCES public.sub_categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: return_requests return_requests_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.return_requests
    ADD CONSTRAINT return_requests_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: return_requests return_requests_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.return_requests
    ADD CONSTRAINT return_requests_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.commerce_orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: return_requests return_requests_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.return_requests
    ADD CONSTRAINT return_requests_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.commerce_order_items(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reviews reviews_boutique_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_boutique_id_fkey FOREIGN KEY (boutique_id) REFERENCES public.boutiques(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reviews reviews_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: reviews reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: shipping_addresses shipping_addresses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shipping_addresses
    ADD CONSTRAINT shipping_addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sub_categories sub_categories_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sub_categories
    ADD CONSTRAINT sub_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: subscription_billing_history subscription_billing_history_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.subscription_billing_history
    ADD CONSTRAINT subscription_billing_history_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.boutique_subscriptions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: support_ticket_admin_notes support_ticket_admin_notes_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.support_ticket_admin_notes
    ADD CONSTRAINT support_ticket_admin_notes_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.owners(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: support_ticket_admin_notes support_ticket_admin_notes_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.support_ticket_admin_notes
    ADD CONSTRAINT support_ticket_admin_notes_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.support_tickets(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: support_ticket_messages support_ticket_messages_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.support_ticket_messages
    ADD CONSTRAINT support_ticket_messages_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.support_tickets(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: support_tickets support_tickets_assigned_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_assigned_admin_id_fkey FOREIGN KEY (assigned_admin_id) REFERENCES public.owners(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: support_tickets support_tickets_boutique_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_boutique_id_fkey FOREIGN KEY (boutique_id) REFERENCES public.boutiques(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: support_tickets support_tickets_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: support_tickets support_tickets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: wishlists wishlists_design_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_design_id_fkey FOREIGN KEY (design_id) REFERENCES public.designs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: wishlists wishlists_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: neondb_owner
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

\unrestrict w4baiWuMPxymFAnycmd5vpWXO4lh03sAZFcWsqpRmFPpedVI7eyowrUn1Y9RToI


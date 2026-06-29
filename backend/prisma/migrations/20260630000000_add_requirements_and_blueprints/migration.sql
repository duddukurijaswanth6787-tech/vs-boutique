-- CreateEnum
CREATE TYPE "CustomerNotificationType" AS ENUM ('ORDER_PLACED', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'ORDER_SHIPPED', 'ORDER_DELIVERED', 'RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURN_REJECTED', 'EXCHANGE_REQUESTED', 'EXCHANGE_APPROVED', 'EXCHANGE_SHIPPED', 'REVIEW_REPLY', 'BOOKING_CONFIRMED', 'BOOKING_RESCHEDULED', 'PROMOTION');

-- CreateEnum
CREATE TYPE "RecipientType" AS ENUM ('SUPER_ADMIN', 'OWNER', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AdminNotificationType" AS ENUM ('NEW_ORDER', 'PAYMENT_RECEIVED', 'PAYMENT_FAILED', 'ORDER_CANCELLED', 'ORDER_RETURN_REQUEST', 'ORDER_RETURN_APPROVED', 'ORDER_RETURN_REJECTED', 'ORDER_EXCHANGE_REQUEST', 'ORDER_EXCHANGE_APPROVED', 'NEW_BOOKING', 'BOOKING_CANCELLED', 'NEW_MEASUREMENT', 'NEW_REVIEW', 'LOW_STOCK', 'OUT_OF_STOCK', 'PRODUCT_APPROVAL', 'EMPLOYEE_ASSIGNED', 'SUBSCRIPTION_EXPIRING', 'SUBSCRIPTION_EXPIRED', 'SYSTEM_ALERT');

-- CreateEnum
CREATE TYPE "ReturnStatus" AS ENUM ('REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PICKUP_SCHEDULED', 'RECEIVED', 'REFUNDED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ExchangeStatus" AS ENUM ('REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PROCESSING', 'SHIPPED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ExecutionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'RETRYING');

-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('INFO', 'WARN', 'ERROR');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'PLATFORM_ADMIN', 'BUSINESS_OWNER', 'MANAGER', 'EMPLOYEE', 'CUSTOMER', 'GUEST');

-- CreateEnum
CREATE TYPE "CertificationStatus" AS ENUM ('DRAFT', 'REVIEWING', 'NEEDS_FIXES', 'APPROVED', 'CERTIFIED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "SafetyLevel" AS ENUM ('SAFE_AUTO_FIX', 'SUGGESTED', 'MANUAL_APPROVAL_REQUIRED');

-- CreateEnum
CREATE TYPE "QueueStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'APPLIED');

-- CreateEnum
CREATE TYPE "MarketplacePackageStatus" AS ENUM ('DRAFT', 'IN_MODERATION', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MarketplaceLicenseStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "PublisherRole" AS ENUM ('DEVELOPER', 'ADMIN');

-- CreateEnum
CREATE TYPE "CmsStandardStatus" AS ENUM ('DRAFT', 'TESTING', 'PUBLISHED', 'DEPRECATED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CmsRequirementStatus" AS ENUM ('DRAFT', 'REVIEW', 'APPROVED', 'ACTIVE', 'DEPRECATED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CmsRequirementRelationType" AS ENUM ('DEPENDS_ON', 'REQUIRES', 'CONFLICTS_WITH', 'OPTIONAL_WITH', 'RECOMMENDED_WITH', 'REPLACES', 'DEPRECATED_BY');

-- DropIndex
DROP INDEX "commerce_payments_razorpay_order_id_idx";

-- DropIndex
DROP INDEX "product_reviews_product_id_user_id_order_id_key";

-- AlterTable
ALTER TABLE "boutiques" ADD COLUMN     "business_id" UUID;

-- AlterTable
ALTER TABLE "coupons" ADD COLUMN     "applicable_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "applicable_type" VARCHAR(20) NOT NULL DEFAULT 'ALL',
ADD COLUMN     "first_order_only" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "delivery_tracking" ADD COLUMN     "tracking_url" VARCHAR(512);

-- AlterTable
ALTER TABLE "product_reviews" ADD COLUMN     "reply" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "average_rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "review_count" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "otp_generated_at" TIMESTAMP(3),
ADD COLUMN     "otp_max_attempts" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "otp_remaining_attempts" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "otp_status" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "otp_updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "otp_verified_at" TIMESTAMP(3),
ALTER COLUMN "otp_expires_at" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "delivery_tracking_history" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tracking_id" UUID NOT NULL,
    "from_status" VARCHAR(50),
    "to_status" VARCHAR(50) NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_tracking_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_requests" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "return_number" VARCHAR(50) NOT NULL,
    "order_id" UUID NOT NULL,
    "order_item_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "reason" VARCHAR(255) NOT NULL,
    "notes" TEXT,
    "status" "ReturnStatus" NOT NULL DEFAULT 'REQUESTED',
    "refund_amount" DECIMAL(12,2),
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "return_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_requests" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "exchange_number" VARCHAR(50) NOT NULL,
    "order_id" UUID NOT NULL,
    "order_item_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "reason" VARCHAR(255) NOT NULL,
    "notes" TEXT,
    "status" "ExchangeStatus" NOT NULL DEFAULT 'REQUESTED',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchange_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_notifications" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "customer_id" UUID NOT NULL,
    "type" "CustomerNotificationType" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "entity_type" VARCHAR(50),
    "entity_id" VARCHAR(100),
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_notifications" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "recipient_type" "RecipientType" NOT NULL,
    "recipient_id" UUID NOT NULL,
    "boutique_id" UUID,
    "type" "AdminNotificationType" NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "entity_type" VARCHAR(50),
    "entity_id" VARCHAR(100),
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIKnowledgeBase" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "tags" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIKnowledgeBase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIContext" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "activeAgentId" TEXT NOT NULL,
    "variables" JSONB NOT NULL,

    CONSTRAINT "AIContext_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIConversation" (
    "id" TEXT NOT NULL,
    "contextId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIArtifact" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "createdByAgent" TEXT NOT NULL,
    "schemaVersion" TEXT NOT NULL DEFAULT 'v1.0.0',
    "parentArtifactId" TEXT,
    "status" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AITool" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "inputSchema" JSONB NOT NULL,
    "outputSchema" JSONB NOT NULL,
    "permissions" JSONB NOT NULL,
    "timeout" INTEGER NOT NULL DEFAULT 5000,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AITool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalRequest" (
    "id" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "requesterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalHistory" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "comments" TEXT,
    "reviewerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AICacheRecord" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "responseVal" TEXT NOT NULL,
    "ttl" INTEGER NOT NULL,
    "hits" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AICacheRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAgent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "maxTokens" INTEGER NOT NULL DEFAULT 2048,
    "inputSchema" JSONB NOT NULL,
    "outputSchema" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "executionOrder" INTEGER NOT NULL,
    "retryPolicy" JSONB NOT NULL,
    "timeout" INTEGER NOT NULL DEFAULT 30000,
    "promptTemplateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "activeVersion" TEXT NOT NULL,
    "variables" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromptTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptHistory" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "promptContent" TEXT NOT NULL,
    "changeNotes" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromptHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AISession" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "vertical" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AISession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIExecution" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "status" "ExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "inputPayload" JSONB NOT NULL,
    "outputPayload" JSONB,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIExecutionLog" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "level" "LogLevel" NOT NULL DEFAULT 'INFO',
    "message" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIExecutionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "domain" VARCHAR(255) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "businesses" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "niche_vertical" VARCHAR(100) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "websites" (
    "id" TEXT NOT NULL,
    "business_id" UUID NOT NULL,
    "domain" VARCHAR(255),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "websites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mobile_apps" (
    "id" TEXT NOT NULL,
    "business_id" UUID NOT NULL,
    "app_name" VARCHAR(255) NOT NULL,
    "bundle_id" VARCHAR(255) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mobile_apps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "universal_contents" (
    "id" TEXT NOT NULL,
    "business_id" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "baseText" TEXT NOT NULL,
    "seoTags" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "universal_contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_translations" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "locale" VARCHAR(10) NOT NULL,
    "translatedText" TEXT NOT NULL,
    "translatedSeo" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_libraries" (
    "id" TEXT NOT NULL,
    "business_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "url" VARCHAR(512) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "meta" JSONB NOT NULL,
    "is_ai" BOOLEAN NOT NULL DEFAULT false,
    "prompt_log" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_libraries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_agent_registry" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "role" VARCHAR(100) NOT NULL,
    "promptTemplate" TEXT NOT NULL,
    "requiredInputs" JSONB NOT NULL,
    "producedOutputs" JSONB NOT NULL,
    "dependencies" TEXT[],
    "retryPolicy" JSONB NOT NULL,
    "estimatedCost" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "estimatedTokens" INTEGER NOT NULL DEFAULT 0,
    "timeoutMs" INTEGER NOT NULL DEFAULT 30000,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_agent_registry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_definitions" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_stages" (
    "id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_tasks" (
    "id" TEXT NOT NULL,
    "stage_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "order" INTEGER NOT NULL,
    "agent_id" TEXT,
    "artifact_type" TEXT NOT NULL,
    "dependencies" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_executions" (
    "id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boutique_themes" (
    "id" TEXT NOT NULL,
    "business_id" UUID NOT NULL,
    "colorsLight" JSONB NOT NULL,
    "colorsDark" JSONB NOT NULL,
    "typography" JSONB NOT NULL,
    "spacingScale" JSONB NOT NULL,
    "borderStyles" JSONB NOT NULL,
    "elevationShadows" JSONB NOT NULL,
    "animationScale" JSONB NOT NULL,
    "accessibilityTheme" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boutique_themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boutique_pages" (
    "id" TEXT NOT NULL,
    "website_id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boutique_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_component_nodes" (
    "id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "name" VARCHAR(100) NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "variant" VARCHAR(50) NOT NULL DEFAULT 'default',
    "order" INTEGER NOT NULL,
    "styleTokens" JSONB NOT NULL,
    "editableProperties" JSONB NOT NULL,
    "responsiveRules" JSONB NOT NULL,
    "animations" JSONB,
    "visibilityRules" JSONB,
    "permissions" JSONB,
    "contentKeysBind" JSONB NOT NULL,
    "data_source_bind" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_component_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boutique_plugins" (
    "id" TEXT NOT NULL,
    "business_id" UUID NOT NULL,
    "plugin_key" VARCHAR(100) NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "settings" JSONB NOT NULL,
    "permissions" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boutique_plugins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_role_mappings" (
    "id" TEXT NOT NULL,
    "business_id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'GUEST',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_role_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "immutable_releases" (
    "id" TEXT NOT NULL,
    "business_id" UUID NOT NULL,
    "release_tag" VARCHAR(50) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "environment" TEXT NOT NULL DEFAULT 'DEV',
    "payloadDump" JSONB NOT NULL,
    "checksum" VARCHAR(64) NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "immutable_releases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_installs" (
    "id" TEXT NOT NULL,
    "business_id" UUID NOT NULL,
    "item_key" VARCHAR(100) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "version" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_installs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_learning_records" (
    "id" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "blueprint_id" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "generation_time_ms" INTEGER NOT NULL,
    "errors" TEXT[],
    "userChanges" JSONB NOT NULL,
    "acceptance_rate" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_learning_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certification_workflow_definitions" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "version" VARCHAR(50) NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "target_type" TEXT NOT NULL DEFAULT 'WEBSITE',
    "stages" JSONB NOT NULL,
    "rollback_policy" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certification_workflow_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certification_workflows" (
    "id" TEXT NOT NULL,
    "business_id" UUID NOT NULL,
    "release_tag" VARCHAR(50) NOT NULL,
    "definition_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "current_stage" TEXT NOT NULL DEFAULT 'INITIALIZING',
    "execution_history" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certification_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qa_agent_registries" (
    "id" TEXT NOT NULL,
    "agent_key" VARCHAR(100) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "execution_order" INTEGER NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "version" VARCHAR(50) NOT NULL,
    "timeout_ms" INTEGER NOT NULL DEFAULT 10000,
    "configuration" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qa_agent_registries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certification_profiles" (
    "id" TEXT NOT NULL,
    "business_id" UUID,
    "name" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "agentWeights" JSONB NOT NULL,
    "thresholds" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certification_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boutique_certifications" (
    "id" TEXT NOT NULL,
    "business_id" UUID NOT NULL,
    "targetType" TEXT NOT NULL DEFAULT 'WEBSITE',
    "target_id" TEXT NOT NULL,
    "release_tag" VARCHAR(50) NOT NULL,
    "profile_id" TEXT NOT NULL,
    "overall_score" DOUBLE PRECISION NOT NULL,
    "scoresMap" JSONB NOT NULL,
    "agentRuns" JSONB NOT NULL,
    "issues" JSONB NOT NULL,
    "suggestions" JSONB NOT NULL,
    "visualArtifacts" JSONB NOT NULL,
    "status" "CertificationStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "boutique_certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autofix_queue_items" (
    "id" TEXT NOT NULL,
    "business_id" UUID NOT NULL,
    "release_tag" VARCHAR(50) NOT NULL,
    "issue_key" VARCHAR(100) NOT NULL,
    "safetyLevel" "SafetyLevel" NOT NULL DEFAULT 'SUGGESTED',
    "description" TEXT NOT NULL,
    "proposedChange" JSONB NOT NULL,
    "status" "QueueStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "autofix_queue_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certification_chat_messages" (
    "id" TEXT NOT NULL,
    "certification_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certification_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_publishers" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "owner_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "website" VARCHAR(255),
    "role" "PublisherRole" NOT NULL DEFAULT 'DEVELOPER',
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_publishers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_packages" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "publisher_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(150) NOT NULL,
    "description" TEXT NOT NULL,
    "status" "MarketplacePackageStatus" NOT NULL DEFAULT 'DRAFT',
    "ratings_avg" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "reviews_count" INTEGER NOT NULL DEFAULT 0,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_versions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "package_id" UUID NOT NULL,
    "version" VARCHAR(50) NOT NULL,
    "manifest_json" JSONB NOT NULL,
    "download_url" VARCHAR(512) NOT NULL,
    "checksum" VARCHAR(256) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_capabilities" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "version_id" UUID NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "handler_path" VARCHAR(255) NOT NULL,
    "config_schema" JSONB NOT NULL,

    CONSTRAINT "marketplace_capabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_dependencies" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "version_id" UUID NOT NULL,
    "dependency_slug" VARCHAR(150) NOT NULL,
    "version_constraint" VARCHAR(100) NOT NULL,

    CONSTRAINT "marketplace_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_installations" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "business_id" UUID NOT NULL,
    "package_id" UUID NOT NULL,
    "installed_version_id" UUID NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "settings_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_installations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_licenses" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "business_id" UUID NOT NULL,
    "package_id" UUID NOT NULL,
    "license_key" VARCHAR(255) NOT NULL,
    "status" "MarketplaceLicenseStatus" NOT NULL DEFAULT 'ACTIVE',
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_reviews" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "package_id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_standards" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "category" VARCHAR(100) NOT NULL,
    "key" VARCHAR(150) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "status" "CmsStandardStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "parent_id" UUID,
    "config" JSONB NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_standards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_standard_versions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "standard_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "config" JSONB NOT NULL,
    "status" "CmsStandardStatus" NOT NULL,
    "description" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cms_standard_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_blueprint_templates" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "key" VARCHAR(150) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "status" "CmsStandardStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "standard_id" UUID,
    "pages" JSONB NOT NULL,
    "components" JSONB NOT NULL,
    "apis" JSONB NOT NULL,
    "databaseModels" JSONB NOT NULL,
    "features" JSONB NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_blueprint_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_blueprint_template_versions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "blueprint_template_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "pages" JSONB NOT NULL,
    "components" JSONB NOT NULL,
    "apis" JSONB NOT NULL,
    "databaseModels" JSONB NOT NULL,
    "features" JSONB NOT NULL,
    "status" "CmsStandardStatus" NOT NULL,
    "description" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cms_blueprint_template_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_builder_profiles" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "key" VARCHAR(150) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "status" "CmsStandardStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "standard_id" UUID,
    "framework" VARCHAR(100) NOT NULL,
    "promptTemplate" TEXT NOT NULL,
    "folderStructure" JSONB NOT NULL,
    "limitations" JSONB NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_builder_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_builder_profile_versions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "builder_profile_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "framework" VARCHAR(100) NOT NULL,
    "promptTemplate" TEXT NOT NULL,
    "folderStructure" JSONB NOT NULL,
    "limitations" JSONB NOT NULL,
    "status" "CmsStandardStatus" NOT NULL,
    "description" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cms_builder_profile_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_standard_audit_logs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "standard_id" UUID,
    "action" VARCHAR(50) NOT NULL,
    "user_id" UUID NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "ip_address" VARCHAR(45) NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cms_standard_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_requirements" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "key" VARCHAR(150) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "status" "CmsRequirementStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "priority" INTEGER NOT NULL DEFAULT 3,
    "criticality" INTEGER NOT NULL DEFAULT 3,
    "business_value" INTEGER NOT NULL DEFAULT 3,
    "development_cost" INTEGER NOT NULL DEFAULT 3,
    "ai_complexity" INTEGER NOT NULL DEFAULT 3,
    "verification_weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "certification_weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "config_schema" JSONB NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_requirement_versions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "requirement_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "config_schema" JSONB NOT NULL,
    "status" "CmsRequirementStatus" NOT NULL,
    "description" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cms_requirement_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_requirement_relations" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "source_requirement_id" UUID NOT NULL,
    "target_requirement_id" UUID NOT NULL,
    "type" "CmsRequirementRelationType" NOT NULL,

    CONSTRAINT "cms_requirement_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_requirement_templates" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "key" VARCHAR(150) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_requirement_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_template_requirement_joins" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "template_id" UUID NOT NULL,
    "requirement_id" UUID NOT NULL,

    CONSTRAINT "cms_template_requirement_joins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_blueprint_pages" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "blueprint_template_id" UUID NOT NULL,
    "route" VARCHAR(255) NOT NULL,
    "title" VARCHAR(255) NOT NULL,

    CONSTRAINT "cms_blueprint_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_blueprint_components" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "page_id" UUID NOT NULL,
    "component_name" VARCHAR(150) NOT NULL,
    "props_schema" JSONB,

    CONSTRAINT "cms_blueprint_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_blueprint_apis" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "blueprint_template_id" UUID NOT NULL,
    "path" VARCHAR(255) NOT NULL,
    "method" VARCHAR(20) NOT NULL,
    "response_schema" JSONB,

    CONSTRAINT "cms_blueprint_apis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_blueprint_features" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "blueprint_template_id" UUID NOT NULL,
    "requirement_id" UUID NOT NULL,

    CONSTRAINT "cms_blueprint_features_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "delivery_tracking_history_tracking_id_created_at_idx" ON "delivery_tracking_history"("tracking_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "return_requests_return_number_key" ON "return_requests"("return_number");

-- CreateIndex
CREATE INDEX "return_requests_order_id_idx" ON "return_requests"("order_id");

-- CreateIndex
CREATE INDEX "return_requests_customer_id_idx" ON "return_requests"("customer_id");

-- CreateIndex
CREATE INDEX "return_requests_status_idx" ON "return_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_requests_exchange_number_key" ON "exchange_requests"("exchange_number");

-- CreateIndex
CREATE INDEX "exchange_requests_order_id_idx" ON "exchange_requests"("order_id");

-- CreateIndex
CREATE INDEX "exchange_requests_customer_id_idx" ON "exchange_requests"("customer_id");

-- CreateIndex
CREATE INDEX "exchange_requests_status_idx" ON "exchange_requests"("status");

-- CreateIndex
CREATE INDEX "customer_notifications_created_at_idx" ON "customer_notifications"("created_at");

-- CreateIndex
CREATE INDEX "customer_notifications_customer_id_idx" ON "customer_notifications"("customer_id");

-- CreateIndex
CREATE INDEX "customer_notifications_is_read_idx" ON "customer_notifications"("is_read");

-- CreateIndex
CREATE INDEX "admin_notifications_recipient_type_idx" ON "admin_notifications"("recipient_type");

-- CreateIndex
CREATE INDEX "admin_notifications_recipient_id_idx" ON "admin_notifications"("recipient_id");

-- CreateIndex
CREATE INDEX "admin_notifications_boutique_id_idx" ON "admin_notifications"("boutique_id");

-- CreateIndex
CREATE INDEX "admin_notifications_is_read_idx" ON "admin_notifications"("is_read");

-- CreateIndex
CREATE INDEX "admin_notifications_created_at_idx" ON "admin_notifications"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "AIKnowledgeBase_key_key" ON "AIKnowledgeBase"("key");

-- CreateIndex
CREATE UNIQUE INDEX "AITool_name_key" ON "AITool"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AICacheRecord_cacheKey_key" ON "AICacheRecord"("cacheKey");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_domain_key" ON "tenants"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "websites_domain_key" ON "websites"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "mobile_apps_bundle_id_key" ON "mobile_apps"("bundle_id");

-- CreateIndex
CREATE UNIQUE INDEX "universal_contents_business_id_key_key" ON "universal_contents"("business_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "content_translations_content_id_locale_key" ON "content_translations"("content_id", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "ai_agent_registry_name_key" ON "ai_agent_registry"("name");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_definitions_name_key" ON "workflow_definitions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "boutique_themes_business_id_key" ON "boutique_themes"("business_id");

-- CreateIndex
CREATE UNIQUE INDEX "boutique_pages_website_id_slug_key" ON "boutique_pages"("website_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "boutique_plugins_business_id_plugin_key_key" ON "boutique_plugins"("business_id", "plugin_key");

-- CreateIndex
CREATE UNIQUE INDEX "user_role_mappings_business_id_user_id_key" ON "user_role_mappings"("business_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "immutable_releases_business_id_release_tag_environment_key" ON "immutable_releases"("business_id", "release_tag", "environment");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_installs_business_id_item_key_key" ON "marketplace_installs"("business_id", "item_key");

-- CreateIndex
CREATE UNIQUE INDEX "certification_workflow_definitions_name_version_key" ON "certification_workflow_definitions"("name", "version");

-- CreateIndex
CREATE UNIQUE INDEX "qa_agent_registries_agent_key_key" ON "qa_agent_registries"("agent_key");

-- CreateIndex
CREATE UNIQUE INDEX "certification_profiles_business_id_name_key" ON "certification_profiles"("business_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "boutique_certifications_business_id_target_id_release_tag_key" ON "boutique_certifications"("business_id", "target_id", "release_tag");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_publishers_email_key" ON "marketplace_publishers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_packages_slug_key" ON "marketplace_packages"("slug");

-- CreateIndex
CREATE INDEX "marketplace_packages_status_created_at_idx" ON "marketplace_packages"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_versions_package_id_version_key" ON "marketplace_versions"("package_id", "version");

-- CreateIndex
CREATE INDEX "marketplace_capabilities_type_idx" ON "marketplace_capabilities"("type");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_installations_business_id_package_id_key" ON "marketplace_installations"("business_id", "package_id");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_licenses_license_key_key" ON "marketplace_licenses"("license_key");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_reviews_business_id_package_id_key" ON "marketplace_reviews"("business_id", "package_id");

-- CreateIndex
CREATE UNIQUE INDEX "cms_standards_key_key" ON "cms_standards"("key");

-- CreateIndex
CREATE UNIQUE INDEX "cms_standard_versions_standard_id_version_key" ON "cms_standard_versions"("standard_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "cms_blueprint_templates_key_key" ON "cms_blueprint_templates"("key");

-- CreateIndex
CREATE UNIQUE INDEX "cms_blueprint_template_versions_blueprint_template_id_versi_key" ON "cms_blueprint_template_versions"("blueprint_template_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "cms_builder_profiles_key_key" ON "cms_builder_profiles"("key");

-- CreateIndex
CREATE UNIQUE INDEX "cms_builder_profile_versions_builder_profile_id_version_key" ON "cms_builder_profile_versions"("builder_profile_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "cms_requirements_key_key" ON "cms_requirements"("key");

-- CreateIndex
CREATE UNIQUE INDEX "cms_requirement_versions_requirement_id_version_key" ON "cms_requirement_versions"("requirement_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "cms_requirement_relations_source_requirement_id_target_requ_key" ON "cms_requirement_relations"("source_requirement_id", "target_requirement_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "cms_requirement_templates_key_key" ON "cms_requirement_templates"("key");

-- CreateIndex
CREATE UNIQUE INDEX "cms_template_requirement_joins_template_id_requirement_id_key" ON "cms_template_requirement_joins"("template_id", "requirement_id");

-- CreateIndex
CREATE UNIQUE INDEX "cms_blueprint_pages_blueprint_template_id_route_key" ON "cms_blueprint_pages"("blueprint_template_id", "route");

-- CreateIndex
CREATE UNIQUE INDEX "cms_blueprint_apis_blueprint_template_id_path_method_key" ON "cms_blueprint_apis"("blueprint_template_id", "path", "method");

-- CreateIndex
CREATE UNIQUE INDEX "cms_blueprint_features_blueprint_template_id_requirement_id_key" ON "cms_blueprint_features"("blueprint_template_id", "requirement_id");

-- CreateIndex
CREATE UNIQUE INDEX "boutiques_business_id_key" ON "boutiques"("business_id");

-- CreateIndex
CREATE UNIQUE INDEX "commerce_payments_razorpay_order_id_key" ON "commerce_payments"("razorpay_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_reviews_product_id_user_id_key" ON "product_reviews"("product_id", "user_id");

-- AddForeignKey
ALTER TABLE "boutiques" ADD CONSTRAINT "boutiques_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_tracking_history" ADD CONSTRAINT "delivery_tracking_history_tracking_id_fkey" FOREIGN KEY ("tracking_id") REFERENCES "delivery_tracking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "commerce_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "commerce_order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_requests" ADD CONSTRAINT "exchange_requests_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_requests" ADD CONSTRAINT "exchange_requests_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "commerce_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_requests" ADD CONSTRAINT "exchange_requests_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "commerce_order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_notifications" ADD CONSTRAINT "customer_notifications_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIConversation" ADD CONSTRAINT "AIConversation_contextId_fkey" FOREIGN KEY ("contextId") REFERENCES "AIContext"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalHistory" ADD CONSTRAINT "ApprovalHistory_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ApprovalRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAgent" ADD CONSTRAINT "AIAgent_promptTemplateId_fkey" FOREIGN KEY ("promptTemplateId") REFERENCES "PromptTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptHistory" ADD CONSTRAINT "PromptHistory_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PromptTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIExecution" ADD CONSTRAINT "AIExecution_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AISession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIExecutionLog" ADD CONSTRAINT "AIExecutionLog_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "AIExecution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "websites" ADD CONSTRAINT "websites_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mobile_apps" ADD CONSTRAINT "mobile_apps_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "universal_contents" ADD CONSTRAINT "universal_contents_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_translations" ADD CONSTRAINT "content_translations_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "universal_contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_libraries" ADD CONSTRAINT "asset_libraries_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_stages" ADD CONSTRAINT "workflow_stages_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflow_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_tasks" ADD CONSTRAINT "workflow_tasks_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "workflow_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_tasks" ADD CONSTRAINT "workflow_tasks_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "ai_agent_registry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflow_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boutique_themes" ADD CONSTRAINT "boutique_themes_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boutique_pages" ADD CONSTRAINT "boutique_pages_website_id_fkey" FOREIGN KEY ("website_id") REFERENCES "websites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_component_nodes" ADD CONSTRAINT "page_component_nodes_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "boutique_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boutique_plugins" ADD CONSTRAINT "boutique_plugins_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_mappings" ADD CONSTRAINT "user_role_mappings_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "immutable_releases" ADD CONSTRAINT "immutable_releases_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certification_workflows" ADD CONSTRAINT "certification_workflows_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certification_workflows" ADD CONSTRAINT "certification_workflows_definition_id_fkey" FOREIGN KEY ("definition_id") REFERENCES "certification_workflow_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certification_profiles" ADD CONSTRAINT "certification_profiles_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boutique_certifications" ADD CONSTRAINT "boutique_certifications_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boutique_certifications" ADD CONSTRAINT "boutique_certifications_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "certification_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autofix_queue_items" ADD CONSTRAINT "autofix_queue_items_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_publishers" ADD CONSTRAINT "marketplace_publishers_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "owners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_packages" ADD CONSTRAINT "marketplace_packages_publisher_id_fkey" FOREIGN KEY ("publisher_id") REFERENCES "marketplace_publishers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_versions" ADD CONSTRAINT "marketplace_versions_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "marketplace_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_capabilities" ADD CONSTRAINT "marketplace_capabilities_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "marketplace_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_dependencies" ADD CONSTRAINT "marketplace_dependencies_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "marketplace_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_installations" ADD CONSTRAINT "marketplace_installations_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_installations" ADD CONSTRAINT "marketplace_installations_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "marketplace_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_installations" ADD CONSTRAINT "marketplace_installations_installed_version_id_fkey" FOREIGN KEY ("installed_version_id") REFERENCES "marketplace_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_licenses" ADD CONSTRAINT "marketplace_licenses_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_licenses" ADD CONSTRAINT "marketplace_licenses_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "marketplace_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_reviews" ADD CONSTRAINT "marketplace_reviews_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "marketplace_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_standards" ADD CONSTRAINT "cms_standards_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "cms_standards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_standard_versions" ADD CONSTRAINT "cms_standard_versions_standard_id_fkey" FOREIGN KEY ("standard_id") REFERENCES "cms_standards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_blueprint_templates" ADD CONSTRAINT "cms_blueprint_templates_standard_id_fkey" FOREIGN KEY ("standard_id") REFERENCES "cms_standards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_blueprint_template_versions" ADD CONSTRAINT "cms_blueprint_template_versions_blueprint_template_id_fkey" FOREIGN KEY ("blueprint_template_id") REFERENCES "cms_blueprint_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_builder_profiles" ADD CONSTRAINT "cms_builder_profiles_standard_id_fkey" FOREIGN KEY ("standard_id") REFERENCES "cms_standards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_builder_profile_versions" ADD CONSTRAINT "cms_builder_profile_versions_builder_profile_id_fkey" FOREIGN KEY ("builder_profile_id") REFERENCES "cms_builder_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_requirement_versions" ADD CONSTRAINT "cms_requirement_versions_requirement_id_fkey" FOREIGN KEY ("requirement_id") REFERENCES "cms_requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_requirement_relations" ADD CONSTRAINT "cms_requirement_relations_source_requirement_id_fkey" FOREIGN KEY ("source_requirement_id") REFERENCES "cms_requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_requirement_relations" ADD CONSTRAINT "cms_requirement_relations_target_requirement_id_fkey" FOREIGN KEY ("target_requirement_id") REFERENCES "cms_requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_template_requirement_joins" ADD CONSTRAINT "cms_template_requirement_joins_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "cms_requirement_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_template_requirement_joins" ADD CONSTRAINT "cms_template_requirement_joins_requirement_id_fkey" FOREIGN KEY ("requirement_id") REFERENCES "cms_requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_blueprint_pages" ADD CONSTRAINT "cms_blueprint_pages_blueprint_template_id_fkey" FOREIGN KEY ("blueprint_template_id") REFERENCES "cms_blueprint_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_blueprint_components" ADD CONSTRAINT "cms_blueprint_components_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "cms_blueprint_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_blueprint_apis" ADD CONSTRAINT "cms_blueprint_apis_blueprint_template_id_fkey" FOREIGN KEY ("blueprint_template_id") REFERENCES "cms_blueprint_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_blueprint_features" ADD CONSTRAINT "cms_blueprint_features_blueprint_template_id_fkey" FOREIGN KEY ("blueprint_template_id") REFERENCES "cms_blueprint_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_blueprint_features" ADD CONSTRAINT "cms_blueprint_features_requirement_id_fkey" FOREIGN KEY ("requirement_id") REFERENCES "cms_requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE;


/*
  Warnings:

  - You are about to drop the `marketplace_installs` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "DeploymentEnvironmentType" AS ENUM ('DEVELOPMENT', 'TESTING', 'STAGING', 'PRODUCTION');

-- CreateEnum
CREATE TYPE "DeploymentStatus" AS ENUM ('PENDING', 'BUILDING', 'BUILD_FAILED', 'VALIDATING', 'VALIDATION_FAILED', 'PACKAGING', 'UPLOADING', 'DEPLOYING', 'DEPLOYED', 'FAILED', 'ROLLED_BACK', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DeploymentDomainStatus" AS ENUM ('PENDING_VERIFICATION', 'VERIFYING_DNS', 'DNS_VERIFIED', 'SSL_PENDING', 'SSL_ACTIVE', 'SSL_FAILED', 'ACTIVE', 'FAILED', 'PROPAGATING');

-- CreateEnum
CREATE TYPE "DeploymentDomainType" AS ENUM ('CUSTOM', 'SUBDOMAIN');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('DRAFT', 'CONFIGURING', 'READY', 'DEPLOYING', 'ACTIVE', 'SUSPENDED', 'ARCHIVED', 'FAILED');

-- CreateEnum
CREATE TYPE "ValidationReportStatus" AS ENUM ('DRAFT', 'GENERATING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ValidationReportSectionType" AS ENUM ('FOLDER', 'COMPONENTS', 'APIS', 'CMS_COMPATIBILITY', 'PERFORMANCE', 'SEO', 'ACCESSIBILITY', 'SECURITY', 'RESPONSIVE', 'AI_RECOMMENDATIONS', 'SUMMARY', 'OVERALL_SCORE');

-- CreateEnum
CREATE TYPE "ExportFormat" AS ENUM ('JSON', 'CSV', 'PDF', 'EXCEL', 'MARKDOWN');

-- AlterTable
ALTER TABLE "notifications" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "marketplace_installs";

-- CreateTable
CREATE TABLE "deployment_environments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(100) NOT NULL,
    "type" "DeploymentEnvironmentType" NOT NULL DEFAULT 'DEVELOPMENT',
    "business_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deployment_environments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "business_id" UUID NOT NULL,
    "environment_id" UUID,
    "version" VARCHAR(50) NOT NULL,
    "blueprint_version" VARCHAR(50),
    "requirement_version" VARCHAR(50),
    "commit_hash" VARCHAR(64),
    "builder" VARCHAR(100) DEFAULT 'manual',
    "status" "DeploymentStatus" NOT NULL DEFAULT 'PENDING',
    "duration" INTEGER DEFAULT 0,
    "logs" JSONB,
    "metadata" JSONB,
    "artifact_url" VARCHAR(512),
    "artifact_checksum" VARCHAR(64),
    "deployed_by" UUID,
    "rollback_target_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deployments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployment_build_logs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "deployment_id" UUID NOT NULL,
    "level" VARCHAR(20) NOT NULL DEFAULT 'INFO',
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deployment_build_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployment_artifacts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "deployment_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "url" VARCHAR(512) NOT NULL,
    "size" INTEGER NOT NULL DEFAULT 0,
    "checksum" VARCHAR(64),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deployment_artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployment_domains" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "business_id" UUID NOT NULL,
    "environment_id" UUID,
    "domain" VARCHAR(255) NOT NULL,
    "type" "DeploymentDomainType" NOT NULL DEFAULT 'SUBDOMAIN',
    "status" "DeploymentDomainStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "dns_verified" BOOLEAN NOT NULL DEFAULT false,
    "ssl_enabled" BOOLEAN NOT NULL DEFAULT true,
    "ssl_status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "ssl_expires_at" TIMESTAMP(3),
    "cname_target" VARCHAR(255),
    "txt_record" VARCHAR(255),
    "propagation_status" VARCHAR(50) NOT NULL DEFAULT 'UNKNOWN',
    "last_checked_at" TIMESTAMP(3),
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deployment_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployment_environment_variables" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "environment_id" UUID NOT NULL,
    "key" VARCHAR(255) NOT NULL,
    "encrypted_value" TEXT NOT NULL,
    "is_secret" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deployment_environment_variables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployment_variable_histories" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "variable_id" UUID NOT NULL,
    "key" VARCHAR(255) NOT NULL,
    "encrypted_value" TEXT NOT NULL,
    "is_secret" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL,
    "changed_by" UUID,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deployment_variable_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_uploads" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "business_id" UUID NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "blueprint_id" VARCHAR(100),
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "progress_percent" INTEGER NOT NULL DEFAULT 0,
    "virus_scan_result" VARCHAR(20),
    "sandbox_path" VARCHAR(512),
    "error_details" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_templates" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "industry" VARCHAR(100),
    "status" VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    "tier" VARCHAR(50) NOT NULL DEFAULT 'FREE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "thumbnail" TEXT,
    "preview_image" TEXT,
    "preview_video" TEXT,
    "live_demo_url" TEXT,
    "zip_artifact" TEXT,
    "manifest_url" TEXT,
    "manifest" JSONB,
    "prompt_id" UUID,
    "blueprint_id" UUID,
    "certification_id" UUID,
    "category_id" UUID,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_template_categories" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "key" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_template_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_template_tags" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "key" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cms_template_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_template_tag_template" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "template_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "cms_template_tag_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_template_versions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "template_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "name" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "manifest" JSONB,
    "thumbnail" TEXT,
    "preview_image" TEXT,
    "preview_video" TEXT,
    "live_demo_url" TEXT,
    "zip_artifact" TEXT,
    "manifest_url" TEXT,
    "change_notes" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cms_template_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_template_favorites" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "template_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cms_template_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_template_ratings" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "template_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_template_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_template_analytics" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "template_id" UUID NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "user_id" UUID,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cms_template_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_template_pipeline_stages" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "template_id" UUID NOT NULL,
    "stage" VARCHAR(50) NOT NULL,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "duration_ms" INTEGER,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "input_artifact" TEXT,
    "output_artifact" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "agent" VARCHAR(100),
    "error" TEXT,

    CONSTRAINT "cms_template_pipeline_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_template_builder_compat" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "template_id" UUID NOT NULL,
    "builder_key" VARCHAR(100) NOT NULL,

    CONSTRAINT "cms_template_builder_compat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_template_assignments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "business_id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "subscription_id" UUID,
    "deployment_id" UUID,
    "environment_id" UUID,
    "assigned_by" UUID,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "business_template_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_assignment_configurations" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "assignment_id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "theme" VARCHAR(50) DEFAULT 'default',
    "primaryColor" VARCHAR(7) DEFAULT '#3B82F6',
    "secondaryColor" VARCHAR(7) DEFAULT '#10B981',
    "logo_url" VARCHAR(512),
    "favicon_url" VARCHAR(512),
    "language" VARCHAR(10) DEFAULT 'en',
    "currency" VARCHAR(3) DEFAULT 'INR',
    "timezone" VARCHAR(50) DEFAULT 'Asia/Kolkata',
    "contact_email" VARCHAR(255),
    "contact_phone" VARCHAR(20),
    "meta_title" VARCHAR(255),
    "meta_description" TEXT,
    "google_analytics_id" VARCHAR(50),
    "facebook_pixel_id" VARCHAR(50),
    "storage_provider" VARCHAR(50) DEFAULT 'auto',
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_assignment_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_assignment_histories" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "assignment_id" UUID NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "previousStatus" "AssignmentStatus",
    "newStatus" "AssignmentStatus",
    "changes" JSONB,
    "snapshot" JSONB,
    "performed_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cms_assignment_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_validation_reports" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "business_id" UUID NOT NULL,
    "upload_id" UUID,
    "certification_id" UUID,
    "template_id" UUID,
    "certification_summary" JSONB,
    "ai_recommendations" JSONB,
    "template_version" JSONB,
    "overall_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "ValidationReportStatus" NOT NULL DEFAULT 'COMPLETED',
    "generated_by" UUID NOT NULL,
    "source_type" VARCHAR(50) NOT NULL DEFAULT 'CERTIFICATION',
    "source_label" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_validation_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_validation_report_sections" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "report_id" UUID NOT NULL,
    "section_type" "ValidationReportSectionType" NOT NULL,
    "score" DOUBLE PRECISION,
    "max_score" DOUBLE PRECISION,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PASSED',
    "issues" JSONB NOT NULL DEFAULT '[]',
    "suggestions" JSONB NOT NULL DEFAULT '[]',
    "data" JSONB NOT NULL DEFAULT '{}',
    "execution_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cms_validation_report_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_validation_report_comparisons" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "business_id" UUID NOT NULL,
    "report_id_1" UUID NOT NULL,
    "report_id_2" UUID NOT NULL,
    "diff_data" JSONB NOT NULL,
    "summary" JSONB NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cms_validation_report_comparisons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_validation_report_exports" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "report_id" UUID NOT NULL,
    "format" "ExportFormat" NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "file_url" VARCHAR(512),
    "file_size" INTEGER,
    "error_details" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "cms_validation_report_exports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_validation_report_analytics" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "business_id" UUID NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "total_reports" INTEGER NOT NULL DEFAULT 0,
    "avg_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pass_count" INTEGER NOT NULL DEFAULT 0,
    "fail_count" INTEGER NOT NULL DEFAULT 0,
    "section_averages" JSONB NOT NULL DEFAULT '{}',
    "score_distribution" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cms_validation_report_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_validation_report_history" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "report_id" UUID NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "previous_status" VARCHAR(20),
    "new_status" VARCHAR(20),
    "changes" JSONB NOT NULL DEFAULT '{}',
    "performed_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cms_validation_report_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_ai_providers" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "model" VARCHAR(255) NOT NULL DEFAULT 'gemini-1.5-pro',
    "base_url" VARCHAR(512),
    "api_key" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "max_tokens" INTEGER NOT NULL DEFAULT 4096,
    "supports_streaming" BOOLEAN NOT NULL DEFAULT true,
    "supports_thinking" BOOLEAN NOT NULL DEFAULT false,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "cost_per_million_tokens" JSONB NOT NULL DEFAULT '{}',
    "rate_limit" JSONB NOT NULL DEFAULT '{}',
    "retry_policy" JSONB NOT NULL DEFAULT '{"maxRetries":3,"backoffMs":1000}',
    "timeout" INTEGER NOT NULL DEFAULT 30000,
    "last_health_check" TIMESTAMP(3),
    "health_status" VARCHAR(20) NOT NULL DEFAULT 'unknown',
    "health_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_ai_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_ai_agents" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(50) NOT NULL,
    "source" VARCHAR(50) NOT NULL,
    "source_id" VARCHAR(255),
    "provider_id" UUID,
    "model" VARCHAR(255),
    "system_prompt" TEXT,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "execution_order" INTEGER NOT NULL DEFAULT 0,
    "dependencies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "timeout" INTEGER NOT NULL DEFAULT 30000,
    "retry_policy" JSONB NOT NULL DEFAULT '{}',
    "version" VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    "health_status" VARCHAR(20) NOT NULL DEFAULT 'unknown',
    "metrics" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_ai_agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_ai_workflows" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "stages" JSONB NOT NULL DEFAULT '[]',
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "trigger" VARCHAR(20) NOT NULL DEFAULT 'manual',
    "schedule" VARCHAR(100),
    "event_trigger" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_ai_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_ai_execution_steps" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "execution_id" UUID NOT NULL,
    "agent_key" VARCHAR(100) NOT NULL,
    "agent_name" VARCHAR(255) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "input_payload" JSONB,
    "output_payload" JSONB,
    "tokens_used" INTEGER NOT NULL DEFAULT 0,
    "latency_ms" INTEGER NOT NULL DEFAULT 0,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cms_ai_execution_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_ai_usage" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "provider_id" UUID,
    "agent_key" VARCHAR(100),
    "execution_id" UUID,
    "model" VARCHAR(255) NOT NULL,
    "prompt_tokens" INTEGER NOT NULL DEFAULT 0,
    "completion_tokens" INTEGER NOT NULL DEFAULT 0,
    "total_tokens" INTEGER NOT NULL DEFAULT 0,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cms_ai_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_ai_costs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "provider_id" UUID,
    "agent_key" VARCHAR(100),
    "execution_id" UUID,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "description" TEXT,
    "category" VARCHAR(50) NOT NULL DEFAULT 'execution',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cms_ai_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_ai_settings" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "key" VARCHAR(100) NOT NULL,
    "value" JSONB NOT NULL,
    "category" VARCHAR(50) NOT NULL DEFAULT 'general',
    "description" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cms_ai_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "developer_api_keys" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "business_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "key" VARCHAR(128) NOT NULL,
    "prefix" VARCHAR(20) NOT NULL,
    "scopes" JSONB NOT NULL DEFAULT '[]',
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "environment" VARCHAR(20) NOT NULL DEFAULT 'PRODUCTION',
    "created_by" UUID,
    "expires_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),
    "rotated_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "last_ip_address" VARCHAR(45),
    "allowedIps" JSONB NOT NULL DEFAULT '[]',
    "rate_limit_override" INTEGER,
    "webhook_signing_secret" VARCHAR(128),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "developer_api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "deployment_environments_business_id_name_key" ON "deployment_environments"("business_id", "name");

-- CreateIndex
CREATE INDEX "deployments_business_id_status_idx" ON "deployments"("business_id", "status");

-- CreateIndex
CREATE INDEX "deployments_business_id_environment_id_idx" ON "deployments"("business_id", "environment_id");

-- CreateIndex
CREATE INDEX "deployments_business_id_created_at_idx" ON "deployments"("business_id", "created_at");

-- CreateIndex
CREATE INDEX "deployment_build_logs_deployment_id_created_at_idx" ON "deployment_build_logs"("deployment_id", "created_at");

-- CreateIndex
CREATE INDEX "deployment_artifacts_deployment_id_idx" ON "deployment_artifacts"("deployment_id");

-- CreateIndex
CREATE INDEX "deployment_domains_business_id_status_idx" ON "deployment_domains"("business_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "deployment_domains_business_id_domain_key" ON "deployment_domains"("business_id", "domain");

-- CreateIndex
CREATE UNIQUE INDEX "deployment_environment_variables_environment_id_key_key" ON "deployment_environment_variables"("environment_id", "key");

-- CreateIndex
CREATE INDEX "deployment_variable_histories_variable_id_version_idx" ON "deployment_variable_histories"("variable_id", "version");

-- CreateIndex
CREATE INDEX "cms_templates_status_is_deleted_idx" ON "cms_templates"("status", "is_deleted");

-- CreateIndex
CREATE INDEX "cms_templates_tier_is_deleted_idx" ON "cms_templates"("tier", "is_deleted");

-- CreateIndex
CREATE INDEX "cms_templates_category_id_idx" ON "cms_templates"("category_id");

-- CreateIndex
CREATE INDEX "cms_templates_created_at_idx" ON "cms_templates"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "cms_template_categories_key_key" ON "cms_template_categories"("key");

-- CreateIndex
CREATE UNIQUE INDEX "cms_template_tags_key_key" ON "cms_template_tags"("key");

-- CreateIndex
CREATE UNIQUE INDEX "cms_template_tag_template_template_id_tag_id_key" ON "cms_template_tag_template"("template_id", "tag_id");

-- CreateIndex
CREATE INDEX "cms_template_versions_template_id_idx" ON "cms_template_versions"("template_id");

-- CreateIndex
CREATE UNIQUE INDEX "cms_template_versions_template_id_version_key" ON "cms_template_versions"("template_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "cms_template_favorites_template_id_user_id_key" ON "cms_template_favorites"("template_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "cms_template_ratings_template_id_user_id_key" ON "cms_template_ratings"("template_id", "user_id");

-- CreateIndex
CREATE INDEX "cms_template_analytics_template_id_action_idx" ON "cms_template_analytics"("template_id", "action");

-- CreateIndex
CREATE INDEX "cms_template_analytics_created_at_idx" ON "cms_template_analytics"("created_at");

-- CreateIndex
CREATE INDEX "cms_template_pipeline_stages_template_id_stage_idx" ON "cms_template_pipeline_stages"("template_id", "stage");

-- CreateIndex
CREATE UNIQUE INDEX "cms_template_builder_compat_template_id_builder_key_key" ON "cms_template_builder_compat"("template_id", "builder_key");

-- CreateIndex
CREATE INDEX "business_template_assignments_business_id_idx" ON "business_template_assignments"("business_id");

-- CreateIndex
CREATE INDEX "business_template_assignments_template_id_idx" ON "business_template_assignments"("template_id");

-- CreateIndex
CREATE INDEX "business_template_assignments_status_idx" ON "business_template_assignments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "business_template_assignments_business_id_template_id_key" ON "business_template_assignments"("business_id", "template_id");

-- CreateIndex
CREATE UNIQUE INDEX "cms_assignment_configurations_assignment_id_key" ON "cms_assignment_configurations"("assignment_id");

-- CreateIndex
CREATE INDEX "cms_assignment_histories_assignment_id_created_at_idx" ON "cms_assignment_histories"("assignment_id", "created_at");

-- CreateIndex
CREATE INDEX "cms_validation_reports_business_id_idx" ON "cms_validation_reports"("business_id");

-- CreateIndex
CREATE INDEX "cms_validation_reports_certification_id_idx" ON "cms_validation_reports"("certification_id");

-- CreateIndex
CREATE INDEX "cms_validation_reports_template_id_idx" ON "cms_validation_reports"("template_id");

-- CreateIndex
CREATE INDEX "cms_validation_reports_upload_id_idx" ON "cms_validation_reports"("upload_id");

-- CreateIndex
CREATE UNIQUE INDEX "cms_validation_report_sections_report_id_section_type_key" ON "cms_validation_report_sections"("report_id", "section_type");

-- CreateIndex
CREATE INDEX "cms_validation_report_comparisons_business_id_idx" ON "cms_validation_report_comparisons"("business_id");

-- CreateIndex
CREATE INDEX "cms_validation_report_exports_report_id_idx" ON "cms_validation_report_exports"("report_id");

-- CreateIndex
CREATE UNIQUE INDEX "cms_validation_report_analytics_business_id_period_start_pe_key" ON "cms_validation_report_analytics"("business_id", "period_start", "period_end");

-- CreateIndex
CREATE INDEX "cms_validation_report_history_report_id_idx" ON "cms_validation_report_history"("report_id");

-- CreateIndex
CREATE UNIQUE INDEX "cms_ai_providers_key_key" ON "cms_ai_providers"("key");

-- CreateIndex
CREATE INDEX "cms_ai_providers_provider_idx" ON "cms_ai_providers"("provider");

-- CreateIndex
CREATE INDEX "cms_ai_providers_is_enabled_idx" ON "cms_ai_providers"("is_enabled");

-- CreateIndex
CREATE INDEX "cms_ai_providers_priority_idx" ON "cms_ai_providers"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "cms_ai_agents_key_key" ON "cms_ai_agents"("key");

-- CreateIndex
CREATE INDEX "cms_ai_agents_category_idx" ON "cms_ai_agents"("category");

-- CreateIndex
CREATE INDEX "cms_ai_agents_is_enabled_idx" ON "cms_ai_agents"("is_enabled");

-- CreateIndex
CREATE INDEX "cms_ai_agents_source_idx" ON "cms_ai_agents"("source");

-- CreateIndex
CREATE INDEX "cms_ai_workflows_status_idx" ON "cms_ai_workflows"("status");

-- CreateIndex
CREATE INDEX "cms_ai_execution_steps_execution_id_idx" ON "cms_ai_execution_steps"("execution_id");

-- CreateIndex
CREATE INDEX "cms_ai_execution_steps_status_idx" ON "cms_ai_execution_steps"("status");

-- CreateIndex
CREATE INDEX "cms_ai_usage_provider_id_idx" ON "cms_ai_usage"("provider_id");

-- CreateIndex
CREATE INDEX "cms_ai_usage_date_idx" ON "cms_ai_usage"("date");

-- CreateIndex
CREATE INDEX "cms_ai_usage_agent_key_idx" ON "cms_ai_usage"("agent_key");

-- CreateIndex
CREATE INDEX "cms_ai_costs_provider_id_idx" ON "cms_ai_costs"("provider_id");

-- CreateIndex
CREATE INDEX "cms_ai_costs_created_at_idx" ON "cms_ai_costs"("created_at");

-- CreateIndex
CREATE INDEX "cms_ai_costs_category_idx" ON "cms_ai_costs"("category");

-- CreateIndex
CREATE UNIQUE INDEX "cms_ai_settings_key_key" ON "cms_ai_settings"("key");

-- CreateIndex
CREATE INDEX "cms_ai_settings_category_idx" ON "cms_ai_settings"("category");

-- CreateIndex
CREATE UNIQUE INDEX "developer_api_keys_key_key" ON "developer_api_keys"("key");

-- CreateIndex
CREATE INDEX "developer_api_keys_business_id_idx" ON "developer_api_keys"("business_id");

-- CreateIndex
CREATE INDEX "developer_api_keys_key_idx" ON "developer_api_keys"("key");

-- CreateIndex
CREATE INDEX "developer_api_keys_status_idx" ON "developer_api_keys"("status");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_timestamp_idx" ON "audit_logs"("entity_type", "entity_id", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_action_type_idx" ON "audit_logs"("action_type");

-- CreateIndex
CREATE INDEX "audit_logs_performed_by_idx" ON "audit_logs"("performed_by");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "bookings_boutique_id_idx" ON "bookings"("boutique_id");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_booking_date_idx" ON "bookings"("booking_date");

-- CreateIndex
CREATE INDEX "businesses_status_idx" ON "businesses"("status");

-- CreateIndex
CREATE INDEX "notification_receipts_notification_id_idx" ON "notification_receipts"("notification_id");

-- CreateIndex
CREATE INDEX "notification_receipts_recipient_user_id_idx" ON "notification_receipts"("recipient_user_id");

-- CreateIndex
CREATE INDEX "notifications_recipient_user_id_idx" ON "notifications"("recipient_user_id");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "orders_order_status_idx" ON "orders"("order_status");

-- CreateIndex
CREATE INDEX "orders_boutique_id_idx" ON "orders"("boutique_id");

-- CreateIndex
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at");

-- CreateIndex
CREATE INDEX "owners_role_idx" ON "owners"("role");

-- CreateIndex
CREATE INDEX "owners_status_idx" ON "owners"("status");

-- CreateIndex
CREATE INDEX "payments_order_id_idx" ON "payments"("order_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "product_reviews_product_id_idx" ON "product_reviews"("product_id");

-- CreateIndex
CREATE INDEX "product_reviews_status_idx" ON "product_reviews"("status");

-- CreateIndex
CREATE INDEX "products_boutique_id_idx" ON "products"("boutique_id");

-- CreateIndex
CREATE INDEX "products_status_idx" ON "products"("status");

-- CreateIndex
CREATE INDEX "subscription_billing_history_subscription_id_idx" ON "subscription_billing_history"("subscription_id");

-- CreateIndex
CREATE INDEX "subscription_billing_history_payment_status_idx" ON "subscription_billing_history"("payment_status");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "workflow_executions_status_idx" ON "workflow_executions"("status");

-- AddForeignKey
ALTER TABLE "deployment_environments" ADD CONSTRAINT "deployment_environments_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_environment_id_fkey" FOREIGN KEY ("environment_id") REFERENCES "deployment_environments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_rollback_target_id_fkey" FOREIGN KEY ("rollback_target_id") REFERENCES "deployments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployment_build_logs" ADD CONSTRAINT "deployment_build_logs_deployment_id_fkey" FOREIGN KEY ("deployment_id") REFERENCES "deployments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployment_artifacts" ADD CONSTRAINT "deployment_artifacts_deployment_id_fkey" FOREIGN KEY ("deployment_id") REFERENCES "deployments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployment_domains" ADD CONSTRAINT "deployment_domains_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployment_domains" ADD CONSTRAINT "deployment_domains_environment_id_fkey" FOREIGN KEY ("environment_id") REFERENCES "deployment_environments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployment_environment_variables" ADD CONSTRAINT "deployment_environment_variables_environment_id_fkey" FOREIGN KEY ("environment_id") REFERENCES "deployment_environments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_uploads" ADD CONSTRAINT "cms_uploads_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_templates" ADD CONSTRAINT "cms_templates_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "cms_template_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_template_tag_template" ADD CONSTRAINT "cms_template_tag_template_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "cms_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_template_tag_template" ADD CONSTRAINT "cms_template_tag_template_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "cms_template_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_template_versions" ADD CONSTRAINT "cms_template_versions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "cms_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_template_favorites" ADD CONSTRAINT "cms_template_favorites_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "cms_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_template_ratings" ADD CONSTRAINT "cms_template_ratings_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "cms_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_template_analytics" ADD CONSTRAINT "cms_template_analytics_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "cms_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_template_pipeline_stages" ADD CONSTRAINT "cms_template_pipeline_stages_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "cms_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_template_builder_compat" ADD CONSTRAINT "cms_template_builder_compat_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "cms_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_template_assignments" ADD CONSTRAINT "business_template_assignments_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_template_assignments" ADD CONSTRAINT "business_template_assignments_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "cms_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_assignment_configurations" ADD CONSTRAINT "cms_assignment_configurations_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "business_template_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_assignment_configurations" ADD CONSTRAINT "cms_assignment_configurations_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_assignment_histories" ADD CONSTRAINT "cms_assignment_histories_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "business_template_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_validation_reports" ADD CONSTRAINT "cms_validation_reports_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_validation_report_sections" ADD CONSTRAINT "cms_validation_report_sections_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "cms_validation_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_validation_report_comparisons" ADD CONSTRAINT "cms_validation_report_comparisons_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_validation_report_analytics" ADD CONSTRAINT "cms_validation_report_analytics_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_ai_agents" ADD CONSTRAINT "cms_ai_agents_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "cms_ai_providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_ai_usage" ADD CONSTRAINT "cms_ai_usage_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "cms_ai_providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_ai_costs" ADD CONSTRAINT "cms_ai_costs_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "cms_ai_providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "developer_api_keys" ADD CONSTRAINT "developer_api_keys_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

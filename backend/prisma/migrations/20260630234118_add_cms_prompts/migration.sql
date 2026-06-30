-- CreateTable
CREATE TABLE "cms_ai_builders" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "key" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "logo" VARCHAR(512),
    "provider" VARCHAR(100) NOT NULL,
    "model" VARCHAR(255) NOT NULL,
    "promptFormat" VARCHAR(50) NOT NULL DEFAULT 'markdown',
    "systemPrompt" TEXT,
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "maxTokens" INTEGER NOT NULL DEFAULT 4096,
    "supports_markdown" BOOLEAN NOT NULL DEFAULT true,
    "supports_streaming" BOOLEAN NOT NULL DEFAULT false,
    "supports_files" BOOLEAN NOT NULL DEFAULT false,
    "supports_images" BOOLEAN NOT NULL DEFAULT false,
    "supports_thinking" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_ai_builders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_prompt_categories" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "key" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "icon" VARCHAR(100),
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_prompt_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_prompt_tags" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "key" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cms_prompt_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_prompt_tag_prompts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "prompt_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "cms_prompt_tag_prompts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_prompts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "title" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "promptType" VARCHAR(100) NOT NULL,
    "category_id" UUID,
    "builder_id" UUID,
    "instructions" TEXT,
    "rules" TEXT,
    "outputFormat" TEXT,
    "expectedFiles" JSONB,
    "expectedFolderStructure" JSONB,
    "codingStandards" TEXT,
    "framework" VARCHAR(255),
    "libraries" JSONB,
    "dependencies" JSONB,
    "apiRequirements" TEXT,
    "dbRequirements" TEXT,
    "responsiveRules" TEXT,
    "performanceRules" TEXT,
    "securityRules" TEXT,
    "accessibilityRules" TEXT,
    "seoRules" TEXT,
    "testingRules" TEXT,
    "acceptanceCriteria" TEXT,
    "variables" JSONB,
    "templateContent" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "business_id" UUID,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_prompts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_prompt_versions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "prompt_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "rules" TEXT,
    "outputFormat" TEXT,
    "expectedFiles" JSONB,
    "expectedFolderStructure" JSONB,
    "codingStandards" TEXT,
    "templateContent" TEXT,
    "variables" JSONB,
    "changeNotes" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cms_prompt_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_prompt_variables" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "key" VARCHAR(100) NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "default_value" TEXT,
    "variable_type" VARCHAR(50) NOT NULL DEFAULT 'string',
    "options" JSONB,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_prompt_variables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_prompt_executions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "prompt_id" UUID NOT NULL,
    "builder_id" UUID,
    "rendered_content" TEXT,
    "variables" JSONB,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "error" TEXT,
    "duration_ms" INTEGER,
    "performed_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cms_prompt_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_prompt_favorites" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "prompt_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cms_prompt_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_prompt_histories" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "prompt_id" UUID NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "snapshot" JSONB,
    "user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cms_prompt_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_prompt_collections" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "user_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_prompt_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_prompt_collection_items" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "collection_id" UUID NOT NULL,
    "prompt_id" UUID NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "cms_prompt_collection_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_prompt_ratings" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "prompt_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cms_prompt_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_prompt_usage_analytics" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "prompt_id" UUID NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "user_id" UUID,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cms_prompt_usage_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_prompt_audit_logs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "prompt_id" UUID NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "field" VARCHAR(100),
    "oldValue" JSONB,
    "newValue" JSONB,
    "performed_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cms_prompt_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cms_ai_builders_key_key" ON "cms_ai_builders"("key");

-- CreateIndex
CREATE UNIQUE INDEX "cms_prompt_categories_key_key" ON "cms_prompt_categories"("key");

-- CreateIndex
CREATE UNIQUE INDEX "cms_prompt_tags_key_key" ON "cms_prompt_tags"("key");

-- CreateIndex
CREATE UNIQUE INDEX "cms_prompt_tag_prompts_prompt_id_tag_id_key" ON "cms_prompt_tag_prompts"("prompt_id", "tag_id");

-- CreateIndex
CREATE INDEX "cms_prompts_business_id_is_deleted_idx" ON "cms_prompts"("business_id", "is_deleted");

-- CreateIndex
CREATE INDEX "cms_prompts_promptType_is_deleted_idx" ON "cms_prompts"("promptType", "is_deleted");

-- CreateIndex
CREATE INDEX "cms_prompts_category_id_idx" ON "cms_prompts"("category_id");

-- CreateIndex
CREATE INDEX "cms_prompts_created_at_idx" ON "cms_prompts"("created_at");

-- CreateIndex
CREATE INDEX "cms_prompt_versions_prompt_id_idx" ON "cms_prompt_versions"("prompt_id");

-- CreateIndex
CREATE UNIQUE INDEX "cms_prompt_versions_prompt_id_version_key" ON "cms_prompt_versions"("prompt_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "cms_prompt_variables_key_key" ON "cms_prompt_variables"("key");

-- CreateIndex
CREATE INDEX "cms_prompt_executions_prompt_id_idx" ON "cms_prompt_executions"("prompt_id");

-- CreateIndex
CREATE INDEX "cms_prompt_executions_status_idx" ON "cms_prompt_executions"("status");

-- CreateIndex
CREATE INDEX "cms_prompt_executions_created_at_idx" ON "cms_prompt_executions"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "cms_prompt_favorites_prompt_id_user_id_key" ON "cms_prompt_favorites"("prompt_id", "user_id");

-- CreateIndex
CREATE INDEX "cms_prompt_histories_prompt_id_created_at_idx" ON "cms_prompt_histories"("prompt_id", "created_at");

-- CreateIndex
CREATE INDEX "cms_prompt_collections_user_id_idx" ON "cms_prompt_collections"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "cms_prompt_collection_items_collection_id_prompt_id_key" ON "cms_prompt_collection_items"("collection_id", "prompt_id");

-- CreateIndex
CREATE UNIQUE INDEX "cms_prompt_ratings_prompt_id_user_id_key" ON "cms_prompt_ratings"("prompt_id", "user_id");

-- CreateIndex
CREATE INDEX "cms_prompt_usage_analytics_prompt_id_action_idx" ON "cms_prompt_usage_analytics"("prompt_id", "action");

-- CreateIndex
CREATE INDEX "cms_prompt_usage_analytics_created_at_idx" ON "cms_prompt_usage_analytics"("created_at");

-- CreateIndex
CREATE INDEX "cms_prompt_audit_logs_prompt_id_created_at_idx" ON "cms_prompt_audit_logs"("prompt_id", "created_at");

-- AddForeignKey
ALTER TABLE "cms_prompt_tag_prompts" ADD CONSTRAINT "cms_prompt_tag_prompts_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "cms_prompts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_prompt_tag_prompts" ADD CONSTRAINT "cms_prompt_tag_prompts_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "cms_prompt_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_prompts" ADD CONSTRAINT "cms_prompts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "cms_prompt_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_prompts" ADD CONSTRAINT "cms_prompts_builder_id_fkey" FOREIGN KEY ("builder_id") REFERENCES "cms_ai_builders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_prompt_versions" ADD CONSTRAINT "cms_prompt_versions_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "cms_prompts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_prompt_executions" ADD CONSTRAINT "cms_prompt_executions_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "cms_prompts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_prompt_executions" ADD CONSTRAINT "cms_prompt_executions_builder_id_fkey" FOREIGN KEY ("builder_id") REFERENCES "cms_ai_builders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_prompt_favorites" ADD CONSTRAINT "cms_prompt_favorites_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "cms_prompts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_prompt_histories" ADD CONSTRAINT "cms_prompt_histories_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "cms_prompts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_prompt_collection_items" ADD CONSTRAINT "cms_prompt_collection_items_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "cms_prompt_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_prompt_collection_items" ADD CONSTRAINT "cms_prompt_collection_items_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "cms_prompts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_prompt_ratings" ADD CONSTRAINT "cms_prompt_ratings_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "cms_prompts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_prompt_usage_analytics" ADD CONSTRAINT "cms_prompt_usage_analytics_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "cms_prompts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_prompt_audit_logs" ADD CONSTRAINT "cms_prompt_audit_logs_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "cms_prompts"("id") ON DELETE CASCADE ON UPDATE CASCADE;


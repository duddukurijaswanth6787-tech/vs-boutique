-- CreateTable
CREATE TABLE "instagram_reels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "videoUrl" TEXT,
    "thumbnailUrl" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "position" INTEGER NOT NULL DEFAULT 0,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "autoPlay" BOOLEAN NOT NULL DEFAULT true,
    "muted" BOOLEAN NOT NULL DEFAULT true,
    "loop" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "playCount" INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "instagram_reels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instagram_reel_products" (
    "id" TEXT NOT NULL,
    "reelId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "instagram_reel_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instagram_reel_analytics" (
    "id" TEXT NOT NULL,
    "reelId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "plays" INTEGER NOT NULL DEFAULT 0,
    "productClicks" INTEGER NOT NULL DEFAULT 0,
    "wishlistClicks" INTEGER NOT NULL DEFAULT 0,
    "cartClicks" INTEGER NOT NULL DEFAULT 0,
    "ordersGenerated" INTEGER NOT NULL DEFAULT 0,
    "conversionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "instagram_reel_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rag_agents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "agentKey" TEXT NOT NULL,
    "description" TEXT,
    "systemPrompt" TEXT,
    "modelProvider" TEXT NOT NULL DEFAULT 'gemini',
    "model" TEXT DEFAULT 'gemini-2.5-flash',
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "maxTokens" INTEGER NOT NULL DEFAULT 4096,
    "tools" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "rag_agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rag_agent_knowledge_sources" (
    "agentId" TEXT NOT NULL,
    "knowledgeSourceId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rag_agent_knowledge_sources_pkey" PRIMARY KEY ("agentId","knowledgeSourceId")
);

-- CreateTable
CREATE TABLE "rag_conversations" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "customerId" TEXT,
    "guestId" TEXT,
    "title" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastMessageAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "rag_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rag_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "intent" TEXT,
    "confidence" DOUBLE PRECISION,
    "modelProvider" TEXT,
    "model" TEXT,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "totalTokens" INTEGER,
    "responseTimeMs" INTEGER,
    "metadata" JSONB,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "rag_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rag_message_citations" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "knowledgeSourceId" TEXT NOT NULL,
    "documentId" TEXT,
    "chunkId" TEXT,
    "citationIndex" INTEGER NOT NULL,
    "label" TEXT,
    "excerpt" TEXT,
    "relevanceScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rag_message_citations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rag_knowledge_sources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "s3Key" TEXT,
    "originalFileName" TEXT,
    "mimeType" TEXT,
    "rawText" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "checksum" TEXT,
    "indexingError" TEXT,
    "lastIndexedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "rag_knowledge_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rag_documents" (
    "id" TEXT NOT NULL,
    "knowledgeSourceId" TEXT NOT NULL,
    "title" TEXT,
    "contentHash" TEXT,
    "metadata" JSONB,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "rag_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rag_document_chunks" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "knowledgeSourceId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "tokenCount" INTEGER,
    "embedding" DOUBLE PRECISION[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rag_document_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rag_embedding_jobs" (
    "id" TEXT NOT NULL,
    "knowledgeSourceId" TEXT,
    "documentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "totalChunks" INTEGER NOT NULL DEFAULT 0,
    "processedChunks" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rag_embedding_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rag_feedback" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT,
    "rating" INTEGER,
    "isHelpful" BOOLEAN,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rag_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "instagram_reels_slug_key" ON "instagram_reels"("slug");

-- CreateIndex
CREATE INDEX "instagram_reels_status_idx" ON "instagram_reels"("status");

-- CreateIndex
CREATE INDEX "instagram_reels_visibility_idx" ON "instagram_reels"("visibility");

-- CreateIndex
CREATE INDEX "instagram_reels_featured_idx" ON "instagram_reels"("featured");

-- CreateIndex
CREATE INDEX "instagram_reels_displayOrder_idx" ON "instagram_reels"("displayOrder");

-- CreateIndex
CREATE INDEX "instagram_reels_deletedAt_idx" ON "instagram_reels"("deletedAt");

-- CreateIndex
CREATE INDEX "instagram_reel_products_reelId_idx" ON "instagram_reel_products"("reelId");

-- CreateIndex
CREATE INDEX "instagram_reel_products_productId_idx" ON "instagram_reel_products"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "instagram_reel_products_reelId_productId_key" ON "instagram_reel_products"("reelId", "productId");

-- CreateIndex
CREATE INDEX "instagram_reel_analytics_reelId_idx" ON "instagram_reel_analytics"("reelId");

-- CreateIndex
CREATE INDEX "instagram_reel_analytics_date_idx" ON "instagram_reel_analytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "instagram_reel_analytics_reelId_date_key" ON "instagram_reel_analytics"("reelId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "rag_agents_agentKey_key" ON "rag_agents"("agentKey");

-- CreateIndex
CREATE INDEX "rag_agents_agentKey_idx" ON "rag_agents"("agentKey");

-- CreateIndex
CREATE INDEX "rag_agents_status_idx" ON "rag_agents"("status");

-- CreateIndex
CREATE INDEX "rag_agents_deletedAt_idx" ON "rag_agents"("deletedAt");

-- CreateIndex
CREATE INDEX "rag_agent_knowledge_sources_agentId_idx" ON "rag_agent_knowledge_sources"("agentId");

-- CreateIndex
CREATE INDEX "rag_agent_knowledge_sources_knowledgeSourceId_idx" ON "rag_agent_knowledge_sources"("knowledgeSourceId");

-- CreateIndex
CREATE INDEX "rag_conversations_agentId_idx" ON "rag_conversations"("agentId");

-- CreateIndex
CREATE INDEX "rag_conversations_customerId_idx" ON "rag_conversations"("customerId");

-- CreateIndex
CREATE INDEX "rag_conversations_guestId_idx" ON "rag_conversations"("guestId");

-- CreateIndex
CREATE INDEX "rag_conversations_status_idx" ON "rag_conversations"("status");

-- CreateIndex
CREATE INDEX "rag_conversations_deletedAt_idx" ON "rag_conversations"("deletedAt");

-- CreateIndex
CREATE INDEX "rag_messages_conversationId_idx" ON "rag_messages"("conversationId");

-- CreateIndex
CREATE INDEX "rag_messages_role_idx" ON "rag_messages"("role");

-- CreateIndex
CREATE INDEX "rag_messages_createdAt_idx" ON "rag_messages"("createdAt");

-- CreateIndex
CREATE INDEX "rag_messages_deletedAt_idx" ON "rag_messages"("deletedAt");

-- CreateIndex
CREATE INDEX "rag_message_citations_messageId_idx" ON "rag_message_citations"("messageId");

-- CreateIndex
CREATE INDEX "rag_knowledge_sources_sourceType_idx" ON "rag_knowledge_sources"("sourceType");

-- CreateIndex
CREATE INDEX "rag_knowledge_sources_status_idx" ON "rag_knowledge_sources"("status");

-- CreateIndex
CREATE INDEX "rag_knowledge_sources_deletedAt_idx" ON "rag_knowledge_sources"("deletedAt");

-- CreateIndex
CREATE INDEX "rag_documents_knowledgeSourceId_idx" ON "rag_documents"("knowledgeSourceId");

-- CreateIndex
CREATE INDEX "rag_documents_deletedAt_idx" ON "rag_documents"("deletedAt");

-- CreateIndex
CREATE INDEX "rag_document_chunks_documentId_idx" ON "rag_document_chunks"("documentId");

-- CreateIndex
CREATE INDEX "rag_document_chunks_knowledgeSourceId_idx" ON "rag_document_chunks"("knowledgeSourceId");

-- CreateIndex
CREATE INDEX "rag_document_chunks_chunkIndex_idx" ON "rag_document_chunks"("chunkIndex");

-- CreateIndex
CREATE INDEX "rag_embedding_jobs_status_idx" ON "rag_embedding_jobs"("status");

-- CreateIndex
CREATE INDEX "rag_embedding_jobs_knowledgeSourceId_idx" ON "rag_embedding_jobs"("knowledgeSourceId");

-- CreateIndex
CREATE INDEX "rag_embedding_jobs_createdAt_idx" ON "rag_embedding_jobs"("createdAt");

-- CreateIndex
CREATE INDEX "rag_feedback_messageId_idx" ON "rag_feedback"("messageId");

-- CreateIndex
CREATE INDEX "rag_feedback_userId_idx" ON "rag_feedback"("userId");

-- AddForeignKey
ALTER TABLE "instagram_reel_products" ADD CONSTRAINT "instagram_reel_products_reelId_fkey" FOREIGN KEY ("reelId") REFERENCES "instagram_reels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instagram_reel_products" ADD CONSTRAINT "instagram_reel_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instagram_reel_analytics" ADD CONSTRAINT "instagram_reel_analytics_reelId_fkey" FOREIGN KEY ("reelId") REFERENCES "instagram_reels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rag_agent_knowledge_sources" ADD CONSTRAINT "rag_agent_knowledge_sources_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "rag_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rag_agent_knowledge_sources" ADD CONSTRAINT "rag_agent_knowledge_sources_knowledgeSourceId_fkey" FOREIGN KEY ("knowledgeSourceId") REFERENCES "rag_knowledge_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rag_conversations" ADD CONSTRAINT "rag_conversations_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "rag_agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rag_messages" ADD CONSTRAINT "rag_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "rag_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rag_message_citations" ADD CONSTRAINT "rag_message_citations_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "rag_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rag_documents" ADD CONSTRAINT "rag_documents_knowledgeSourceId_fkey" FOREIGN KEY ("knowledgeSourceId") REFERENCES "rag_knowledge_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rag_document_chunks" ADD CONSTRAINT "rag_document_chunks_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "rag_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rag_feedback" ADD CONSTRAINT "rag_feedback_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "rag_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

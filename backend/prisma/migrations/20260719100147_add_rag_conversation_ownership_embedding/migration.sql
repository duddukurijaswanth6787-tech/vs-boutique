/*
  Warnings:

  - You are about to drop the column `customerId` on the `rag_conversations` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "rag_conversations_customerId_idx";

-- DropIndex
DROP INDEX "rag_conversations_guestId_idx";

-- AlterTable
ALTER TABLE "rag_conversations" DROP COLUMN "customerId",
ADD COLUMN     "sessionId" TEXT,
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "rag_knowledge_sources" ADD COLUMN     "embeddingDimension" INTEGER,
ADD COLUMN     "embeddingModel" TEXT,
ADD COLUMN     "embeddingStatus" TEXT,
ADD COLUMN     "embeddingVersion" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "rag_conversations_userId_updatedAt_idx" ON "rag_conversations"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "rag_conversations_guestId_updatedAt_idx" ON "rag_conversations"("guestId", "updatedAt");

-- CreateIndex
CREATE INDEX "rag_conversations_sessionId_idx" ON "rag_conversations"("sessionId");

-- CreateIndex
CREATE INDEX "rag_knowledge_sources_embeddingStatus_idx" ON "rag_knowledge_sources"("embeddingStatus");

-- Conversation ownership: exactly one of userId or guestId must be set, never both
ALTER TABLE "rag_conversations"
ADD CONSTRAINT "rag_conversations_owner_check"
CHECK (
  (("userId" IS NOT NULL)::integer + ("guestId" IS NOT NULL)::integer) = 1
);

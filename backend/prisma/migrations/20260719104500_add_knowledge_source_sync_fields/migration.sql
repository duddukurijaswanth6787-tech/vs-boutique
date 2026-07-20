-- Add knowledge source sync/versioning fields
-- ponytail: reuses existing status/checksum/lastIndexedAt/indexingError fields for sync tracking.
-- enabled/priority/version/syncMode are new; syncStatus is a higher-level view than the existing status.
ALTER TABLE "rag_knowledge_sources" ADD COLUMN     "enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "syncMode" TEXT NOT NULL DEFAULT 'manual',
ADD COLUMN     "syncStatus" TEXT,
ADD COLUMN     "lastSyncAt" TIMESTAMP(3),
ADD COLUMN     "lastSyncDuration" INTEGER,
ADD COLUMN     "documentsSynced" INTEGER;

-- Index for enabled/priority queries (adapter health, sync ordering)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "rag_knowledge_sources_enabled_priority_idx"
  ON "rag_knowledge_sources"("enabled", "priority");

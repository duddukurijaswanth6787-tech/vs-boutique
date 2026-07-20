-- Enable pgvector extension (safe if already installed)
CREATE EXTENSION IF NOT EXISTS vector;

-- Add new columns and migrate embedding to vector(1536)
-- ponytail: DROP+ADD is safe — no embedding data exists yet (no embedding service running)
ALTER TABLE "rag_document_chunks" ADD COLUMN     "embeddingDimension" INTEGER,
ADD COLUMN     "embeddingModel" TEXT,
ADD COLUMN     "embeddingVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "indexedAt" TIMESTAMP(3),
DROP COLUMN "embedding",
ADD COLUMN     "embedding" vector(1536);

-- HNSW index for approximate nearest neighbor search (cosine distance)
-- ponytail: HNSW only (no IVFFlat). Add IVFFlat if HNSW build time becomes a bottleneck for >1M vectors.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "rag_document_chunks_embedding_idx"
  ON "rag_document_chunks"
  USING hnsw ("embedding" vector_cosine_ops)
  WITH (m = 16, ef_construction = 200);

-- B-tree indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS "rag_document_chunks_indexedAt_idx"
  ON "rag_document_chunks"("indexedAt");

-- ponytail: documentId, knowledgeSourceId, chunkIndex B-tree indexes already exist from Phase 1

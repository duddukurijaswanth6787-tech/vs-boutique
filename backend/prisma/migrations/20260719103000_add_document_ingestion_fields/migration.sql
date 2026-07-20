-- Add ingestion pipeline fields to rag_documents
-- ponytail: filename/size/mimeType are required for upload flow, status tracks pipeline progress
ALTER TABLE "rag_documents" ADD COLUMN     "filename" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "size" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "mimeType" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "storagePath" TEXT,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "pageCount" INTEGER,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "errorMessage" TEXT;

-- Add chunk offset metadata for traceability
ALTER TABLE "rag_document_chunks" ADD COLUMN     "startOffset" INTEGER,
ADD COLUMN     "endOffset" INTEGER,
ADD COLUMN     "characterCount" INTEGER;

-- Index for document status queries (admin dashboard, batch operations)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "rag_documents_status_idx" ON "rag_documents"("status");

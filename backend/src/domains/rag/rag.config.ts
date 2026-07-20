import { registerAs } from '@nestjs/config';

export default registerAs('rag', () => ({
  enabled: process.env.ENABLE_RAG !== 'false',
  adminEnabled: process.env.ENABLE_RAG_ADMIN !== 'false',
  chatEnabled: process.env.ENABLE_RAG_CHAT !== 'false',
  ingestionEnabled: process.env.ENABLE_RAG_INGESTION !== 'false',
  retrievalEnabled: process.env.ENABLE_RAG_RETRIEVAL !== 'false',
  embeddingsEnabled: process.env.ENABLE_RAG_EMBEDDINGS !== 'false',
  analyticsEnabled: process.env.ENABLE_RAG_ANALYTICS !== 'false',
  documentUploadEnabled: process.env.ENABLE_RAG_DOCUMENT_UPLOAD !== 'false',
  playgroundEnabled: process.env.ENABLE_RAG_PLAYGROUND !== 'false',
  toolsEnabled: process.env.TOOLS_ENABLED !== 'false',
  llmProvider: process.env.RAG_LLM_PROVIDER || 'gemini',
  embeddingProvider: process.env.RAG_EMBEDDING_PROVIDER || 'gemini',
  embeddingBatchSize: Number(process.env.RAG_EMBEDDING_BATCH_SIZE) || 10,
  embeddingTimeout: Number(process.env.RAG_EMBEDDING_TIMEOUT) || 30000,
  embeddingMaxRetries: Number(process.env.RAG_EMBEDDING_MAX_RETRIES) || 3,
  embeddingRetryDelay: Number(process.env.RAG_EMBEDDING_RETRY_DELAY) || 1000,
  embeddingDimension: Number(process.env.RAG_EMBEDDING_DIMENSION) || 768,
  embeddingCacheEnabled: process.env.RAG_EMBEDDING_CACHE_ENABLED === 'true',
  chunkSize: Number(process.env.RAG_CHUNK_SIZE) || 800,
  chunkOverlap: Number(process.env.RAG_CHUNK_OVERLAP) || 120,
  requestTimeoutMs: Number(process.env.RAG_REQUEST_TIMEOUT_MS) || 30000,
  topK: Number(process.env.RAG_RETRIEVAL_TOP_K) || 5,
  minScore: Number(process.env.RAG_RETRIEVAL_MIN_SCORE) || 0.65,
  vectorDimension: Number(process.env.VECTOR_DIMENSION) || 1536,
  vectorDistance: process.env.VECTOR_DISTANCE || 'cosine',
  vectorIndex: process.env.VECTOR_INDEX || 'hnsw',
  vectorTopK: Number(process.env.VECTOR_TOP_K) || 10,
  vectorThreshold: Number(process.env.VECTOR_THRESHOLD) || 0.7,
  vectorBatchSize: Number(process.env.VECTOR_BATCH_SIZE) || 100,

  // Ingestion config
  maxUploadSize: Number(process.env.UPLOAD_MAX_SIZE) || 20971520,
  allowedTypes: process.env.UPLOAD_ALLOWED_TYPES || 'pdf,docx,txt,md,csv,json',
  maxChunks: Number(process.env.MAX_CHUNKS) || 1000,
  storageProvider: process.env.DEFAULT_STORAGE || 'local',
  storageRoot: process.env.STORAGE_ROOT || './storage/documents',

  // Knowledge source config
  syncBatchSize: Number(process.env.KNOWLEDGE_SYNC_BATCH_SIZE) || 10,
  syncTimeout: Number(process.env.KNOWLEDGE_SYNC_TIMEOUT) || 300000,
  hashAlgorithm: process.env.KNOWLEDGE_HASH_ALGORITHM || 'sha256',
  defaultPriority: Number(process.env.KNOWLEDGE_DEFAULT_PRIORITY) || 5,
  retryLimit: Number(process.env.KNOWLEDGE_RETRY_LIMIT) || 3,

  // Retrieval config
  maxContextChars: Number(process.env.RETRIEVAL_MAX_CONTEXT_CHARS) || 10000,
  dedupEnabled: process.env.RETRIEVAL_DEDUP_ENABLED !== 'false',
  hybridEnabled: process.env.RETRIEVAL_HYBRID_ENABLED === 'true',
  recencyWeight: Number(process.env.RETRIEVAL_RECENCY_WEIGHT) || 0.1,
  priorityWeight: Number(process.env.RETRIEVAL_PRIORITY_WEIGHT) || 0.05,

  // LLM / Orchestrator config
  llmApiKey: process.env.GEMINI_API_KEY || '',
  llmModel: process.env.GEMINI_LLM_MODEL || 'gemini-1.5-flash',
  llmTimeout: Number(process.env.RAG_LLM_TIMEOUT) || 30000,
  llmMaxTokens: Number(process.env.RAG_LLM_MAX_TOKENS) || 1024,
  llmTemperature: Number(process.env.RAG_LLM_TEMPERATURE) || 0.7,
  memoryMaxMessages: Number(process.env.RAG_MEMORY_MAX_MESSAGES) || 20,
  promptMaxTokens: Number(process.env.RAG_PROMPT_MAX_TOKENS) || 4000,

  // Admin console config
  adminAiEnabled: process.env.ADMIN_AI_ENABLED !== 'false',
  adminPlaygroundEnabled: process.env.ADMIN_PLAYGROUND_ENABLED !== 'false',
  promptPreviewLimit: Number(process.env.PROMPT_PREVIEW_LIMIT) || 4000,
  maxTestQueryLength: Number(process.env.MAX_TEST_QUERY_LENGTH) || 2000,

  // Customer chat config
  chatMaxMessageLength: Number(process.env.CHAT_MAX_MESSAGE_LENGTH) || 4000,
  chatMaxHistory: Number(process.env.CHAT_MAX_HISTORY) || 20,
  chatStreamEnabled: process.env.CHAT_STREAM_ENABLED === 'true',
  chatFeedbackEnabled: process.env.CHAT_FEEDBACK_ENABLED !== 'false',
  chatSuggestionsEnabled: process.env.CHAT_SUGGESTIONS_ENABLED !== 'false',

  // Business tools config
  productToolEnabled: process.env.PRODUCT_TOOL_ENABLED !== 'false',
  orderToolEnabled: process.env.ORDER_TOOL_ENABLED !== 'false',
  inventoryToolEnabled: process.env.INVENTORY_TOOL_ENABLED !== 'false',
  customerToolEnabled: process.env.CUSTOMER_TOOL_ENABLED !== 'false',

  // Analytics & monitoring config (analyticsEnabled defined above)
  metricsEnabled: process.env.METRICS_ENABLED !== 'false',
  tracingEnabled: process.env.TRACING_ENABLED !== 'false',
  prometheusEnabled: process.env.PROMETHEUS_ENABLED !== 'false',
  healthHistoryEnabled: process.env.HEALTH_HISTORY_ENABLED === 'true',
}));

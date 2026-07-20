import * as Joi from 'joi';

// Map alternative AWS S3 environment variable names to the expected standard keys
if (process.env.AWS_BUCKET_NAME) {
  process.env.AWS_S3_BUCKET =
    process.env.AWS_S3_BUCKET || process.env.AWS_BUCKET_NAME;
}
if (process.env.AWS_ACCESS_KEY) {
  process.env.AWS_ACCESS_KEY_ID =
    process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY;
}
if (process.env.AWS_SECRET_KEY) {
  process.env.AWS_SECRET_ACCESS_KEY =
    process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_KEY;
}

/**
 * Joi validation schema for application environment variables.
 */
// ponytail: throws a real Error so Joi doesn't try to parse the message as a template ref (the `${` confuses it)
const s3Var = (name: string) =>
  Joi.string().custom((v: string) => {
    if (v && v.includes('${')) {
      throw new Error(
        `${name} must be a real value, not a "\${...}" placeholder`,
      );
    }
    return v;
  });

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(4000),
  DATABASE_URL: Joi.string()
    .required()
    .description('PostgreSQL Connection URL'),
  SLOW_QUERY_THRESHOLD: Joi.number().integer().min(0).default(1000),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  // ponytail: require Redis auth in prod — unauthenticated Redis = cache poisoning / data exposure
  REDIS_PASSWORD: Joi.string()
    .allow('')
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.string()
        .min(8)
        .required()
        .description('REDIS_PASSWORD is required in production'),
      otherwise: Joi.string().allow('').default(''),
    }),
  REDIS_DB: Joi.number().integer().min(0).default(0),
  BULLMQ_PREFIX: Joi.string().default('vasanthi'),
  THROTTLE_TTL: Joi.number().integer().min(1).default(60),
  THROTTLE_LIMIT: Joi.number().integer().min(1).default(100),
  CORS_ORIGIN: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.string()
      .required()
      .description('Production CORS origin must be explicit'),
    otherwise: Joi.string().default('*'),
  }),

  // Security Configuration
  TRUST_PROXY_COUNT: Joi.number().integer().min(0).default(1),
  CORS_METHODS: Joi.string().default('GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS'),
  CORS_ALLOWED_HEADERS: Joi.string().default(
    'Content-Type,Accept,Authorization,x-correlation-id,x-request-id',
  ),
  BODY_JSON_LIMIT: Joi.string().default('2mb'),
  BODY_URLENCODED_LIMIT: Joi.string().default('2mb'),
  HELMET_CSP_ENABLED: Joi.boolean().default(true),
  HELMET_COEP_ENABLED: Joi.boolean().default(true),
  SECURITY_EVENT_LOG_ENABLED: Joi.boolean().default(true),

  // Storage Configuration
  STORAGE_PROVIDER: Joi.string().valid('local', 's3').default('local'),
  STORAGE_MAX_FILE_SIZE: Joi.number().integer().min(1).default(10485760),
  STORAGE_ALLOWED_MIME_TYPES: Joi.string().default(
    'image/jpeg,image/png,image/webp,image/avif,application/pdf,video/mp4',
  ),
  // ponytail: local-only, keep for dev backward compat
  STORAGE_ROOT: Joi.string().default('./storage'),
  STORAGE_PUBLIC_URL: Joi.string().default('/storage'),

  // AWS S3 Configuration (required when STORAGE_PROVIDER=s3)
  // ponytail: reject literal "${...}" placeholders — they pass `.required()` but break signing silently
  AWS_REGION: s3Var('AWS_REGION')
    .allow('')
    .when('STORAGE_PROVIDER', {
      is: 's3',
      then: Joi.string()
        .min(1)
        .required()
        .description('AWS_REGION is required when STORAGE_PROVIDER=s3'),
      otherwise: Joi.string().allow('').default('ap-south-1'),
    }),
  AWS_S3_BUCKET: s3Var('AWS_S3_BUCKET')
    .allow('')
    .when('STORAGE_PROVIDER', {
      is: 's3',
      then: Joi.string()
        .min(1)
        .required()
        .description('AWS_S3_BUCKET is required when STORAGE_PROVIDER=s3'),
      otherwise: Joi.string().allow('').default(''),
    }),
  AWS_ACCESS_KEY_ID: s3Var('AWS_ACCESS_KEY_ID')
    .allow('')
    .when('STORAGE_PROVIDER', {
      is: 's3',
      then: Joi.string()
        .min(1)
        .required()
        .description('AWS_ACCESS_KEY_ID is required when STORAGE_PROVIDER=s3'),
      otherwise: Joi.string().allow('').default(''),
    }),
  AWS_SECRET_ACCESS_KEY: s3Var('AWS_SECRET_ACCESS_KEY')
    .allow('')
    .when('STORAGE_PROVIDER', {
      is: 's3',
      then: Joi.string()
        .min(1)
        .required()
        .description(
          'AWS_SECRET_ACCESS_KEY is required when STORAGE_PROVIDER=s3',
        ),
      otherwise: Joi.string().allow('').default(''),
    }),
  AWS_S3_ENDPOINT: Joi.string().uri().allow('').optional().default(''),
  AWS_S3_PUBLIC_URL: Joi.string().allow('', null).optional().default(''),
  AWS_S3_FORCE_PATH_STYLE: Joi.boolean().default(false),
  AWS_S3_SIGNED_URL_EXPIRY: Joi.number().integer().min(60).default(3600),

  // Razorpay Configuration — ponytail: require credentials in prod when payments enabled
  RAZORPAY_KEY_ID: Joi.string()
    .allow('')
    .default('')
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.when('ENABLE_RAZORPAY', {
        is: true,
        then: Joi.required().description(
          'RAZORPAY_KEY_ID is required when ENABLE_RAZORPAY=true in production',
        ),
      }),
    }),
  RAZORPAY_KEY_SECRET: Joi.string()
    .allow('')
    .default('')
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.when('ENABLE_RAZORPAY', {
        is: true,
        then: Joi.required().description(
          'RAZORPAY_KEY_SECRET is required when ENABLE_RAZORPAY=true in production',
        ),
      }),
    }),
  RAZORPAY_WEBHOOK_SECRET: Joi.string()
    .allow('')
    .default('')
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.when('ENABLE_RAZORPAY', {
        is: true,
        then: Joi.required().description(
          'RAZORPAY_WEBHOOK_SECRET is required when ENABLE_RAZORPAY=true in production',
        ),
      }),
    }),
  RAZORPAY_API_BASE_URL: Joi.string()
    .uri()
    .default('https://api.razorpay.com/v1'),
  ENABLE_RAZORPAY: Joi.boolean().default(true),
  PAYMENT_PROVIDER: Joi.string().valid('razorpay', 'dummy').default('razorpay'),

  // Frontend URL Configuration
  FRONTEND_URL: Joi.string()
    .uri()
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.string()
        .uri()
        .required()
        .description(
          'FRONTEND_URL is required in production for share links and CORS',
        ),
      otherwise: Joi.string()
        .uri({ allowRelative: true })
        .default('http://localhost:3000'),
    }),

  // Monitoring Configuration
  ENABLE_MONITORING: Joi.boolean().default(true),
  MONITORING_SLOW_REQUEST_THRESHOLD: Joi.number()
    .integer()
    .min(100)
    .default(1000),

  // JWT Configuration
  JWT_SECRET: Joi.string()
    .min(16)
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.string()
        .required()
        .description('JWT_SECRET is required in production'),
      otherwise: Joi.string().default('dev-secret-change-in-production'),
    }),
  JWT_EXPIRES_IN: Joi.number().integer().min(60).default(900),
  JWT_REMEMBER_ME_EXPIRES_IN: Joi.number().integer().min(3600).default(2592000),
  JWT_REFRESH_TOKEN_EXPIRY_DAYS: Joi.number()
    .integer()
    .min(1)
    .max(90)
    .default(7),
  JWT_ISSUER: Joi.string().default('vasanthi-designers'),

  // Feature Flags
  // ponytail: feature flags validate as boolean strings or boolean values dynamically
  ENABLE_SWAGGER: Joi.boolean().default(true),
  ENABLE_REDIS: Joi.boolean().default(true),
  ENABLE_BULLMQ: Joi.boolean().default(true),
  ENABLE_EMAIL: Joi.boolean().default(false),
  ENABLE_SMS: Joi.boolean().default(false),
  ENABLE_STORAGE: Joi.boolean().default(false),
  ENABLE_QUEUE: Joi.boolean().default(true),
  ENABLE_LOGGER: Joi.boolean().default(true),

  // HTTP Logger Configuration
  HTTP_LOG_ENABLED: Joi.boolean().default(true),
  HTTP_LOG_REQUEST_BODY: Joi.boolean().default(true),
  HTTP_LOG_RESPONSE_BODY: Joi.boolean().default(true),
  HTTP_LOG_MAX_BODY_LENGTH: Joi.number().integer().min(0).default(10000),
  HTTP_LOG_HEALTH_REQUESTS: Joi.boolean().default(false),

  // RAG Configuration
  RAG_ENABLED: Joi.boolean().default(true),
  RAG_DEFAULT_AGENT_KEY: Joi.string().default('customer_support_agent'),
  RAG_CHUNK_SIZE: Joi.number().integer().default(800),
  RAG_CHUNK_OVERLAP: Joi.number().integer().default(120),
  RAG_TOP_K: Joi.number().integer().default(8),
  RAG_MIN_RELEVANCE_SCORE: Joi.number().default(0.65),
  RAG_MAX_CONTEXT_CHUNKS: Joi.number().integer().default(6),
  RAG_CONVERSATION_HISTORY_LIMIT: Joi.number().integer().default(12),
  RAG_TOOL_MAX_EXECUTIONS: Joi.number().integer().default(5),
  RAG_REQUEST_TIMEOUT_MS: Joi.number().integer().default(30000),
  RAG_MAX_MESSAGE_LENGTH: Joi.number().integer().default(4000),
  RAG_URL_FETCH_TIMEOUT_MS: Joi.number().integer().default(10000),
  RAG_URL_MAX_REDIRECTS: Joi.number().integer().default(3),
  RAG_URL_MAX_CONTENT_BYTES: Joi.number().integer().default(5242880),

  VECTOR_DIMENSION: Joi.number().integer().min(128).max(3072).default(1536),
  VECTOR_DISTANCE: Joi.string()
    .valid('cosine', 'l2', 'inner')
    .default('cosine'),
  VECTOR_INDEX: Joi.string().valid('hnsw', 'ivfflat').default('hnsw'),
  VECTOR_TOP_K: Joi.number().integer().min(1).max(100).default(10),
  VECTOR_THRESHOLD: Joi.number().min(0).max(1).default(0.7),
  VECTOR_BATCH_SIZE: Joi.number().integer().min(1).max(1000).default(100),

  RAG_EMBEDDING_BATCH_SIZE: Joi.number().integer().min(1).max(100).default(10),
  RAG_EMBEDDING_TIMEOUT: Joi.number()
    .integer()
    .min(1000)
    .max(120000)
    .default(30000),
  RAG_EMBEDDING_MAX_RETRIES: Joi.number().integer().min(0).max(10).default(3),
  RAG_EMBEDDING_RETRY_DELAY: Joi.number()
    .integer()
    .min(100)
    .max(30000)
    .default(1000),
  RAG_EMBEDDING_DIMENSION: Joi.number()
    .integer()
    .valid(768, 1536, 3072)
    .default(768),
  RAG_EMBEDDING_CACHE_ENABLED: Joi.boolean().default(false),

  // Document Ingestion Configuration
  UPLOAD_MAX_SIZE: Joi.number()
    .integer()
    .min(1024)
    .max(1073741824)
    .default(20971520),
  UPLOAD_ALLOWED_TYPES: Joi.string().default('pdf,docx,txt,md,csv,json'),
  MAX_CHUNKS: Joi.number().integer().min(1).max(100000).default(1000),
  DEFAULT_STORAGE: Joi.string().valid('local', 's3').default('local'),

  // Knowledge Source Configuration
  KNOWLEDGE_SYNC_BATCH_SIZE: Joi.number()
    .integer()
    .min(1)
    .max(1000)
    .default(10),
  KNOWLEDGE_SYNC_TIMEOUT: Joi.number()
    .integer()
    .min(1000)
    .max(3600000)
    .default(300000),
  KNOWLEDGE_HASH_ALGORITHM: Joi.string()
    .valid('sha256', 'md5')
    .default('sha256'),
  KNOWLEDGE_DEFAULT_PRIORITY: Joi.number().integer().min(1).max(100).default(5),
  KNOWLEDGE_RETRY_LIMIT: Joi.number().integer().min(0).max(10).default(3),

  // Retrieval Configuration
  RETRIEVAL_MAX_CONTEXT_CHARS: Joi.number()
    .integer()
    .min(100)
    .max(100000)
    .default(10000),
  RETRIEVAL_DEDUP_ENABLED: Joi.boolean().default(true),
  RETRIEVAL_HYBRID_ENABLED: Joi.boolean().default(false),
  RETRIEVAL_RECENCY_WEIGHT: Joi.number().min(0).max(1).default(0.1),
  RETRIEVAL_PRIORITY_WEIGHT: Joi.number().min(0).max(1).default(0.05),

  RAG_LLM_PROVIDER: Joi.string().valid('gemini', 'openai').default('gemini'),
  RAG_EMBEDDING_PROVIDER: Joi.string()
    .valid('gemini', 'openai')
    .default('gemini'),
  GEMINI_LLM_MODEL: Joi.string().default('gemini-1.5-flash'),
  GEMINI_EMBEDDING_MODEL: Joi.string().default('text-embedding-004'),
  OPENAI_LLM_MODEL: Joi.string().default('gpt-4o-mini'),
  OPENAI_EMBEDDING_MODEL: Joi.string().default('text-embedding-3-small'),

  GEMINI_API_KEY: Joi.string()
    .allow('')
    .default('')
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.string().when('RAG_ENABLED', {
        is: true,
        then: Joi.string().when('RAG_LLM_PROVIDER', {
          is: 'gemini',
          then: Joi.required(),
          otherwise: Joi.string().when('RAG_EMBEDDING_PROVIDER', {
            is: 'gemini',
            then: Joi.required(),
            otherwise: Joi.optional(),
          }),
        }),
        otherwise: Joi.optional(),
      }),
      otherwise: Joi.optional(),
    }),

  OPENAI_API_KEY: Joi.string()
    .allow('')
    .default('')
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.string().when('RAG_ENABLED', {
        is: true,
        then: Joi.string().when('RAG_LLM_PROVIDER', {
          is: 'openai',
          then: Joi.required(),
          otherwise: Joi.string().when('RAG_EMBEDDING_PROVIDER', {
            is: 'openai',
            then: Joi.required(),
            otherwise: Joi.optional(),
          }),
        }),
        otherwise: Joi.optional(),
      }),
      otherwise: Joi.optional(),
    }),

  // Orchestrator Configuration
  RAG_LLM_TIMEOUT: Joi.number().integer().min(5000).max(300000).default(30000),
  RAG_LLM_MAX_TOKENS: Joi.number().integer().min(100).max(8192).default(1024),
  RAG_LLM_TEMPERATURE: Joi.number().min(0).max(2).default(0.7),
  RAG_MEMORY_MAX_MESSAGES: Joi.number().integer().min(5).max(100).default(20),
  RAG_PROMPT_MAX_TOKENS: Joi.number()
    .integer()
    .min(500)
    .max(32000)
    .default(4000),

  // Admin AI Console Configuration
  ADMIN_AI_ENABLED: Joi.boolean().default(true),
  ADMIN_PLAYGROUND_ENABLED: Joi.boolean().default(true),
  PROMPT_PREVIEW_LIMIT: Joi.number()
    .integer()
    .min(200)
    .max(32000)
    .default(4000),
  MAX_TEST_QUERY_LENGTH: Joi.number()
    .integer()
    .min(50)
    .max(10000)
    .default(2000),

  // Customer Chat Configuration
  CHAT_MAX_MESSAGE_LENGTH: Joi.number()
    .integer()
    .min(100)
    .max(20000)
    .default(4000),
  CHAT_MAX_HISTORY: Joi.number().integer().min(5).max(100).default(20),
  CHAT_STREAM_ENABLED: Joi.boolean().default(false),
  CHAT_FEEDBACK_ENABLED: Joi.boolean().default(true),
  CHAT_SUGGESTIONS_ENABLED: Joi.boolean().default(true),

  // Business AI Tools Configuration
  TOOLS_ENABLED: Joi.boolean().default(true),
  PRODUCT_TOOL_ENABLED: Joi.boolean().default(true),
  ORDER_TOOL_ENABLED: Joi.boolean().default(true),
  INVENTORY_TOOL_ENABLED: Joi.boolean().default(true),
  CUSTOMER_TOOL_ENABLED: Joi.boolean().default(true),

  // Analytics & Monitoring Configuration
  ANALYTICS_ENABLED: Joi.boolean().default(true),
  METRICS_ENABLED: Joi.boolean().default(true),
  TRACING_ENABLED: Joi.boolean().default(true),
  PROMETHEUS_ENABLED: Joi.boolean().default(true),
  HEALTH_HISTORY_ENABLED: Joi.boolean().default(false),
});

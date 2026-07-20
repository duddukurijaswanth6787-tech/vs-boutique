import { registerAs } from '@nestjs/config';
import { SECURITY_CONSTANTS } from '@common/security';

/**
 * Maps environment variables to a nested, strongly-typed configuration object.
 */
export default registerAs('app', () => ({
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  database: {
    url: process.env.DATABASE_URL,
    slowQueryThreshold: parseInt(
      process.env.SLOW_QUERY_THRESHOLD || '1000',
      10,
    ),
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
  bullmq: {
    prefix: process.env.BULLMQ_PREFIX || 'vasanthi',
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
    limit: parseInt(
      process.env.THROTTLE_LIMIT ||
        `${SECURITY_CONSTANTS.DEFAULT_THROTTLE_LIMIT}`,
      10,
    ),
  },
  cors: {
    origin:
      process.env.CORS_ORIGIN ||
      (process.env.NODE_ENV === 'production' ? '' : '*'),
    methods:
      process.env.CORS_METHODS || 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders:
      process.env.CORS_ALLOWED_HEADERS ||
      'Content-Type,Accept,Authorization,x-correlation-id,x-request-id',
  },
  security: {
    trustProxyCount: parseInt(process.env.TRUST_PROXY_COUNT || '1', 10),
    bodyJsonLimit: process.env.BODY_JSON_LIMIT || '2mb',
    bodyUrlencodedLimit: process.env.BODY_URLENCODED_LIMIT || '2mb',
    helmetCspEnabled: process.env.HELMET_CSP_ENABLED !== 'false',
    helmetCoepEnabled: process.env.HELMET_COEP_ENABLED !== 'false',
    eventLogEnabled: process.env.SECURITY_EVENT_LOG_ENABLED !== 'false',
  },
  storage: {
    provider: process.env.STORAGE_PROVIDER || 'local',
    maxFileSize: parseInt(process.env.STORAGE_MAX_FILE_SIZE || '10485760', 10),
    allowedMimeTypes:
      process.env.STORAGE_ALLOWED_MIME_TYPES ||
      'image/jpeg,image/png,image/webp,image/avif,application/pdf,video/mp4',
    // ponytail: local-only fields, ignored when provider=s3
    root: process.env.STORAGE_ROOT || './storage',
    publicUrl: process.env.STORAGE_PUBLIC_URL || '/storage',
    s3: {
      region: process.env.AWS_REGION || 'ap-south-1',
      bucket: process.env.AWS_S3_BUCKET || '',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      endpoint: process.env.AWS_S3_ENDPOINT || undefined,
      publicUrl: process.env.AWS_S3_PUBLIC_URL || '',
      forcePathStyle: process.env.AWS_S3_FORCE_PATH_STYLE === 'true',
      signedUrlExpiry: parseInt(
        process.env.AWS_S3_SIGNED_URL_EXPIRY || '3600',
        10,
      ),
    },
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
    apiBaseUrl:
      process.env.RAZORPAY_API_BASE_URL || 'https://api.razorpay.com/v1',
    enabled: process.env.ENABLE_RAZORPAY !== 'false',
    provider: process.env.PAYMENT_PROVIDER || 'razorpay',
  },
  jwt: {
    secret:
      process.env.JWT_SECRET ||
      (process.env.NODE_ENV === 'production'
        ? ''
        : 'dev-secret-change-in-production'),
    expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '900', 10),
    rememberMeExpiresIn: parseInt(
      process.env.JWT_REMEMBER_ME_EXPIRES_IN || '2592000',
      10,
    ),
    refreshTokenExpiryDays: parseInt(
      process.env.JWT_REFRESH_TOKEN_EXPIRY_DAYS || '7',
      10,
    ),
    issuer: process.env.JWT_ISSUER || 'vasanthi-designers',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  hostname: process.env.HOSTNAME || 'localhost',
  monitoring: {
    enabled: process.env.ENABLE_MONITORING !== 'false',
    slowRequestThreshold: parseInt(
      process.env.MONITORING_SLOW_REQUEST_THRESHOLD || '1000',
      10,
    ),
  },
  features: {
    swagger: process.env.ENABLE_SWAGGER !== 'false',
    redis: process.env.ENABLE_REDIS !== 'false',
    bullmq: process.env.ENABLE_BULLMQ !== 'false',
    email: process.env.ENABLE_EMAIL === 'true',
    sms: process.env.ENABLE_SMS === 'true',
    storage: process.env.ENABLE_STORAGE === 'true',
    queue: process.env.ENABLE_QUEUE !== 'false',
    logger: process.env.ENABLE_LOGGER !== 'false',
  },
  httpLog: {
    enabled: process.env.HTTP_LOG_ENABLED !== 'false',
    requestBody: process.env.HTTP_LOG_REQUEST_BODY !== 'false',
    responseBody: process.env.HTTP_LOG_RESPONSE_BODY !== 'false',
    maxBodyLength: parseInt(
      process.env.HTTP_LOG_MAX_BODY_LENGTH || '10000',
      10,
    ),
    healthRequests: process.env.HTTP_LOG_HEALTH_REQUESTS === 'true',
  },
  rag: {
    enabled: process.env.RAG_ENABLED !== 'false',
    llmProvider: process.env.RAG_LLM_PROVIDER || 'gemini',
    embeddingProvider: process.env.RAG_EMBEDDING_PROVIDER || 'gemini',
    requestTimeoutMs: parseInt(
      process.env.RAG_REQUEST_TIMEOUT_MS || '30000',
      10,
    ),
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    llmModel: process.env.GEMINI_LLM_MODEL || 'gemini-1.5-flash',
    embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    llmModel: process.env.OPENAI_LLM_MODEL || 'gpt-4o-mini',
    embeddingModel:
      process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
  },
}));

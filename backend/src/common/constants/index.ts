/**
 * System-wide error codes to identify operational failures uniquely.
 */
export const ERROR_CODES = {
  // Authentication & Authorization Error Codes
  /** Authentication validation and credential failures. */
  AUTH_001: 'AUTH_001',
  /** Access tokens expired or missing. */
  AUTH_002: 'AUTH_002',

  // General System Error Codes
  /** General system or runtime crash. */
  SYSTEM_001: 'SYSTEM_001',

  // Database Error Codes
  /** Connection failure or unexpected database exception. */
  DATABASE_001: 'DATABASE_001',
  /** Unique constraint or duplicate entry database violation. */
  DATABASE_002: 'DATABASE_002',
  /** Database lookup target not found. */
  DATABASE_003: 'DATABASE_003',
  /** Connection timeouts. */
  DATABASE_TIMEOUT: 'DATABASE_TIMEOUT',
  /** Database general constraints. */
  DATABASE_CONSTRAINT: 'DATABASE_CONSTRAINT',
  /** Database record lookup not found. */
  DATABASE_RECORD_NOT_FOUND: 'DATABASE_RECORD_NOT_FOUND',

  // Configuration Error Codes
  /** Missing configuration parameters during application startup. */
  CONFIG_001: 'CONFIG_001',

  // Validation Error Codes
  /** DTO payload parameter validation check failure. */
  VALIDATION_001: 'VALIDATION_001',
  /** Request body constraints violated. */
  INVALID_INPUT: 'INVALID_INPUT',
  /** Invalid file uploads. */
  INVALID_FILE: 'INVALID_FILE',
  /** Invalid general request parameters. */
  INVALID_REQUEST: 'INVALID_REQUEST',

  // Business Error Codes
  /** Standard business logic assertion failure. */
  BUSINESS_RULE_FAILED: 'BUSINESS_RULE_FAILED',
  /** Invalid domain operation. */
  INVALID_OPERATION: 'INVALID_OPERATION',
  /** Resource conflicts (e.g. duplicate SKU). */
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',

  // Infrastructure Error Codes
  /** Caching driver exceptions. */
  CACHE_FAILURE: 'CACHE_FAILURE',
  /** BullMQ worker/queue failures. */
  QUEUE_FAILURE: 'QUEUE_FAILURE',
  /** Mailing provider errors. */
  EMAIL_FAILURE: 'EMAIL_FAILURE',
  /** SMS provider errors. */
  SMS_FAILURE: 'SMS_FAILURE',
  /** S3/Local file storage errors. */
  STORAGE_FAILURE: 'STORAGE_FAILURE',

  // External APIs Error Codes
  /** Payment gateway (Razorpay) connectivity issues. */
  PAYMENT_PROVIDER_FAILURE: 'PAYMENT_PROVIDER_FAILURE',
  /** Shipping client (DTDC) connectivity issues. */
  SHIPPING_PROVIDER_FAILURE: 'SHIPPING_PROVIDER_FAILURE',
  /** General third-party timeouts. */
  THIRD_PARTY_TIMEOUT: 'THIRD_PARTY_TIMEOUT',
} as const;

/**
 * Metadata parameters describing the system deployment.
 */
export const APP_METADATA = {
  NAME: 'Vasanthi Designers',
  VERSION: '1.0.0',
  API_PREFIX: 'api/v1',
  DEFAULT_TIMEZONE: 'Asia/Kolkata',
  DEFAULT_COUNTRY: 'IN',
  DEFAULT_CURRENCY: 'INR',
  DEFAULT_LANGUAGE: 'en',
} as const;

/**
 * Standard configuration settings for query pagination.
 */
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

/**
 * Restrictive criteria for file uploading layers.
 */
export const FILE_LIMITS = {
  /** Max uploaded file size limit (10 Megabytes). */
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  /** Permitted upload file types. */
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    'application/pdf',
    'video/mp4',
    'video/quicktime',
    'video/webm',
  ],
  VIDEO_MAX_FILE_SIZE: 200 * 1024 * 1024,
} as const;

/**
 * Mandatory structural requirements for password hashes.
 */
export const PASSWORD_RULES = {
  MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL_CHARACTER: true,
} as const;

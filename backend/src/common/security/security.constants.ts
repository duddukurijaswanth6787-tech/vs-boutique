/**
 * Centralized platform security constants, sizes, limits, and configurations.
 */
export const SECURITY_CONSTANTS = {
  /** Maximum body payload size for incoming JSON requests (2 Megabytes). */
  MAX_JSON_SIZE: '2mb',
  /** Maximum body payload size for URL-encoded requests (2 Megabytes). */
  MAX_URLENCODED_SIZE: '2mb',
  /** Default rate limit window (TTL) in seconds. */
  DEFAULT_THROTTLE_TTL: 60,
  /** Default rate limit max requests per IP inside the TTL window. */
  DEFAULT_THROTTLE_LIMIT: 100,
  /** Headers trusted for reverse proxy client lookup. */
  TRUSTED_HEADERS: [
    'x-correlation-id',
    'x-request-id',
    'x-forwarded-for',
    'x-real-ip',
  ] as const,
  /** Security cookie key placeholders. */
  COOKIE_NAMES: {
    SESSION: 'vd_session',
    CSRF: 'vd_csrf',
  } as const,
  /** Security error codes for correlation and security events. */
  ERROR_CODES: {
    SEC_001: 'SEC_001',
    SEC_002: 'SEC_002',
  } as const,
  /** Correlation ID UUID v4 regex pattern. */
  CORRELATION_ID_REGEX:
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
} as const;

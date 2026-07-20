/**
 * Recursively scans and masks sensitive keys (passwords, tokens, pins, cards) inside objects.
 */
export function maskSensitiveData(data: unknown): unknown {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => maskSensitiveData(item));
  }

  const sensitiveKeys = [
    'password',
    'token',
    'jwt',
    'authorization',
    'secret',
    'apikey',
    'api_key',
    'otp',
    'card',
    'payment',
    'cookie',
    'access_token',
    'refresh_token',
  ];

  const obj = data as Record<string, unknown>;
  const masked: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveKeys.some((sKey) => lowerKey.includes(sKey));

    if (isSensitive) {
      masked[key] = '***MASKED***';
    } else if (typeof value === 'object') {
      masked[key] = maskSensitiveData(value);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

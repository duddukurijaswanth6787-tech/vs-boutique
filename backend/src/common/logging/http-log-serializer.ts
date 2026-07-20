export function isSensitiveKey(key: string): boolean {
  const lowerKey = key.toLowerCase();
  const exactKeys = new Set([
    'password',
    'currentpassword',
    'newpassword',
    'confirmpassword',
    'passwordhash',
    'token',
    'accesstoken',
    'refreshtoken',
    'idtoken',
    'authorization',
    'cookie',
    'set-cookie',
    'secret',
    'clientsecret',
    'apikey',
    'keysecret',
    'api_key',
    'otp',
    'pin',
    'cvv',
    'cvc',
    'cardnumber',
    'accountnumber',
    'razorpay_signature',
    'awsaccesskeyid',
    'awssecretaccesskey',
    'privatekey',
    'webhooksecret',
  ]);

  if (exactKeys.has(lowerKey)) {
    return true;
  }

  const sensitiveSubstrings = [
    'password',
    'token',
    'secret',
    'apikey',
    'api_key',
    'privatekey',
    'cardnumber',
  ];
  return sensitiveSubstrings.some((sub) => lowerKey.includes(sub));
}

export function sanitizeAmzUrls(str: string): string {
  if (typeof str !== 'string') return str;
  return str
    .replace(/(X-Amz-Signature)=([^&\s]*)/gi, '$1=[REDACTED]')
    .replace(/(X-Amz-Credential)=([^&\s]*)/gi, '$1=[REDACTED]')
    .replace(/(X-Amz-Security-Token)=([^&\s]*)/gi, '$1=[REDACTED]');
}

export function redactObject(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle Buffer
  if (Buffer.isBuffer(data)) {
    return {
      type: 'Buffer',
      length: data.length,
    };
  }

  // Handle Multer upload files
  if (
    data &&
    typeof data === 'object' &&
    ('fieldname' in data || 'originalname' in data || 'mimetype' in data)
  ) {
    const file = data;
    return {
      fieldname: file.fieldname,
      originalname: file.originalname,
      encoding: file.encoding,
      mimetype: file.mimetype,
      size: file.size,
    };
  }

  if (Array.isArray(data)) {
    return data.map((item) => redactObject(item));
  }

  if (typeof data === 'object') {
    // Handle Decimal-like values
    if (data.constructor && data.constructor.name === 'Decimal') {
      return data.toString();
    }
    if (data instanceof Date) {
      return new Date(data.getTime());
    }
    if (data instanceof Error) {
      return data;
    }

    const deepCloneAndRedact = (obj: any, currentSeen: WeakSet<any>): any => {
      if (obj === null || obj === undefined) return obj;
      if (Buffer.isBuffer(obj)) return { type: 'Buffer', length: obj.length };

      // Multer file upload
      if (
        obj &&
        typeof obj === 'object' &&
        ('fieldname' in obj || 'originalname' in obj || 'mimetype' in obj)
      ) {
        return {
          fieldname: obj.fieldname,
          originalname: obj.originalname,
          encoding: obj.encoding,
          mimetype: obj.mimetype,
          size: obj.size,
        };
      }

      if (Array.isArray(obj)) {
        return obj.map((item) => deepCloneAndRedact(item, currentSeen));
      }

      if (typeof obj === 'object') {
        if (obj.constructor && obj.constructor.name === 'Decimal') {
          return obj.toString();
        }
        if (obj instanceof Date) {
          return new Date(obj.getTime());
        }
        if (obj instanceof Error) {
          return obj;
        }
        if (currentSeen.has(obj)) {
          return '[Circular]';
        }
        currentSeen.add(obj);

        const clone: Record<string, any> = {};
        for (const [key, value] of Object.entries(obj)) {
          if (isSensitiveKey(key)) {
            clone[key] = '[REDACTED]';
          } else if (typeof value === 'string') {
            clone[key] = sanitizeAmzUrls(value);
          } else {
            clone[key] = deepCloneAndRedact(value, currentSeen);
          }
        }
        return clone;
      }

      return obj;
    };

    const cloneSeen = new WeakSet<any>();
    return deepCloneAndRedact(data, cloneSeen);
  }

  if (typeof data === 'string') {
    return sanitizeAmzUrls(data);
  }

  return data;
}

export function safeSerialize(val: any): string {
  if (val === undefined) return 'undefined';
  if (val === null) return 'null';

  const seen = new WeakSet<any>();

  return JSON.stringify(
    val,
    (_key, value) => {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      if (value && typeof value === 'object') {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);

        // Handle Date
        if (value instanceof Date) {
          return value.toISOString();
        }
        // Handle Error
        if (value instanceof Error) {
          return {
            name: value.name,
            message: value.message,
            stack: value.stack,
          };
        }
        // Handle Buffer
        if (value.type === 'Buffer' && Array.isArray(value.data)) {
          return `[Buffer (${value.data.length} bytes)]`;
        }
        if (Buffer.isBuffer(value)) {
          return `[Buffer (${value.length} bytes)]`;
        }
        // Handle Decimal-like
        if (value.constructor && value.constructor.name === 'Decimal') {
          return value.toString();
        }
      }
      return value;
    },
    2,
  );
}

export function formatAndTruncate(val: any, maxLength = 10000): string {
  if (val === undefined) return '{}';
  const redacted = redactObject(val);
  const serialized = safeSerialize(redacted);
  if (serialized.length > maxLength) {
    return (
      serialized.substring(0, maxLength) +
      `\n... [TRUNCATED — original serialized length: ${serialized.length} characters]`
    );
  }
  return serialized;
}

export function validateAndSanitizeRequestId(
  requestId: string | undefined,
): string | null {
  if (!requestId) return null;

  // Reject original if it contains CR, LF, or tab
  if (/[\r\n\t]/.test(requestId)) {
    return null;
  }

  const trimmed = requestId.trim();
  if (trimmed.length > 50) return null;

  // Reject CR/LF, control characters, or unsafe characters
  const safePattern = /^[a-zA-Z0-9-_]+$/;
  if (!safePattern.test(trimmed)) {
    return null;
  }

  return trimmed;
}

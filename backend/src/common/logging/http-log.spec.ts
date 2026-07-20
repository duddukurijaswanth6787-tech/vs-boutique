import {
  isSensitiveKey,
  sanitizeAmzUrls,
  redactObject,
  safeSerialize,
  formatAndTruncate,
  validateAndSanitizeRequestId,
} from './http-log-serializer';

describe('HTTP Logging Infrastructure', () => {
  describe('isSensitiveKey', () => {
    it('should detect sensitive keys case-insensitively', () => {
      expect(isSensitiveKey('password')).toBe(true);
      expect(isSensitiveKey('PASSWORD')).toBe(true);
      expect(isSensitiveKey('currentPassword')).toBe(true);
      expect(isSensitiveKey('accessToken')).toBe(true);
      expect(isSensitiveKey('refreshToken')).toBe(true);
      expect(isSensitiveKey('authorization')).toBe(true);
      expect(isSensitiveKey('cookie')).toBe(true);
      expect(isSensitiveKey('razorpay_key_secret')).toBe(true);
      expect(isSensitiveKey('awsSecretAccessKey')).toBe(true);
      expect(isSensitiveKey('normalField')).toBe(false);
    });
  });

  describe('sanitizeAmzUrls', () => {
    it('should redact S3 presigned credentials in URLs', () => {
      const url =
        'https://bucket.s3.amazonaws.com/img.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAIOSFODNN7EXAMPLE&X-Amz-Date=20260711&X-Amz-Signature=sig123&X-Amz-Security-Token=token456';
      const sanitized = sanitizeAmzUrls(url);
      expect(sanitized).toContain('X-Amz-Credential=[REDACTED]');
      expect(sanitized).toContain('X-Amz-Signature=[REDACTED]');
      expect(sanitized).toContain('X-Amz-Security-Token=[REDACTED]');
      expect(sanitized).not.toContain('sig123');
      expect(sanitized).not.toContain('token456');
    });
  });

  describe('redactObject', () => {
    it('should recursively redact sensitive fields and preserve others', () => {
      const input = {
        email: 'user@test.com',
        password: 'secret_password',
        nested: {
          token: 'token_val',
          keep: 'value',
        },
        arr: [{ pin: '1234' }, { val: 'test' }],
      };

      const result = redactObject(input);
      expect(result.email).toBe('user@test.com');
      expect(result.password).toBe('[REDACTED]');
      expect(result.nested.token).toBe('[REDACTED]');
      expect(result.nested.keep).toBe('value');
      expect(result.arr[0].pin).toBe('[REDACTED]');
      expect(result.arr[1].val).toBe('test');
    });

    it('should NOT mutate the original object', () => {
      const input = {
        password: 'my-password',
        data: 'keep',
      };
      const copy = { ...input };
      redactObject(input);
      expect(input).toEqual(copy);
    });

    it('should handle Buffer object and return metadata only', () => {
      const buf = Buffer.from('hello world');
      const result = redactObject(buf);
      expect(result).toEqual({ type: 'Buffer', length: 11 });
    });

    it('should handle Multer files and return metadata only', () => {
      const file = {
        fieldname: 'avatar',
        originalname: 'profile.png',
        encoding: '7bit',
        mimetype: 'image/png',
        size: 512,
        buffer: Buffer.from('fake'),
      };
      const result = redactObject(file);
      expect(result).toEqual({
        fieldname: 'avatar',
        originalname: 'profile.png',
        encoding: '7bit',
        mimetype: 'image/png',
        size: 512,
      });
      expect(result).not.toHaveProperty('buffer');
    });
  });

  describe('safeSerialize', () => {
    it('should serialize BigInt', () => {
      const result = safeSerialize({ id: BigInt(9007199254740991) });
      expect(result).toContain('"id": "9007199254740991"');
    });

    it('should serialize Decimal-like values', () => {
      class Decimal {
        constructor(private val: string) {}
        toString() {
          return this.val;
        }
      }
      const result = safeSerialize({ price: new Decimal('99.99') });
      expect(result).toContain('"price": "99.99"');
    });

    it('should serialize Date objects', () => {
      const date = new Date('2026-07-11T12:00:00.000Z');
      const result = safeSerialize({ date });
      expect(result).toContain('"date": "2026-07-11T12:00:00.000Z"');
    });

    it('should serialize Error objects', () => {
      const error = new Error('Test message');
      const result = safeSerialize({ error });
      expect(result).toContain('"name": "Error"');
      expect(result).toContain('"message": "Test message"');
      expect(result).toContain('"stack":');
    });

    it('should handle circular references', () => {
      const obj: any = { a: 1 };
      obj.circular = obj;
      const result = safeSerialize(obj);
      expect(result).toContain('"circular": "[Circular]"');
    });
  });

  describe('formatAndTruncate', () => {
    it('should truncate serialized text if it exceeds maxLength', () => {
      const input = { data: 'a'.repeat(100) };
      const truncated = formatAndTruncate(input, 30);
      expect(truncated.length).toBeLessThan(120);
      expect(truncated).toContain('[TRUNCATED — original serialized length:');
    });
  });

  describe('validateAndSanitizeRequestId', () => {
    it('should allow valid request IDs', () => {
      expect(validateAndSanitizeRequestId('req-123')).toBe('req-123');
      expect(
        validateAndSanitizeRequestId('550e8400-e29b-41d4-a716-446655440000'),
      ).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should reject request IDs with malicious CR/LF or control characters', () => {
      expect(validateAndSanitizeRequestId('req-123\r\n')).toBeNull();
      expect(validateAndSanitizeRequestId('req-123\n')).toBeNull();
      expect(validateAndSanitizeRequestId('req-123\r')).toBeNull();
      expect(validateAndSanitizeRequestId('req-123\t')).toBeNull();
    });

    it('should reject request IDs that are too long', () => {
      expect(validateAndSanitizeRequestId('a'.repeat(51))).toBeNull();
    });

    it('should reject request IDs with unsafe characters', () => {
      expect(validateAndSanitizeRequestId('req_123$')).toBeNull();
      expect(validateAndSanitizeRequestId('req_123;')).toBeNull();
      expect(validateAndSanitizeRequestId('req_123<')).toBeNull();
    });
  });
});

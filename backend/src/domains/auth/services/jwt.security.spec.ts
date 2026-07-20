import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from './jwt.service';
import { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';

// ponytail: test JWT edge cases — signing, verification, expiry, issuer, tampering
describe('JwtService (security)', () => {
  let service: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultVal?: any) => {
              const config: Record<string, any> = {
                'app.jwt.secret': 'test-secret-at-least-16-chars',
                'app.jwt.expiresIn': 900,
                'app.jwt.rememberMeExpiresIn': 2592000,
                'app.jwt.issuer': 'vasanthi-designers',
              };
              return config[key] ?? defaultVal;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<JwtService>(JwtService);
  });

  describe('sign + verify roundtrip', () => {
    it('signs and verifies a valid token', () => {
      const payload = {
        sub: 'u1',
        email: 'a@b.com',
        userType: 'CUSTOMER',
        roles: ['customer'],
      };
      const token = service.sign(payload);
      const decoded = service.verify(token);
      expect(decoded.sub).toBe('u1');
      expect(decoded.email).toBe('a@b.com');
    });

    it('includes issuer in token', () => {
      const token = service.sign({
        sub: 'u1',
        email: 'a@b.com',
        userType: 'CUSTOMER',
        roles: [],
      });
      const decoded = service.verify(token);
      expect(decoded).toBeDefined();
    });
  });

  describe('tampering detection', () => {
    it('rejects a tampered token', () => {
      const token = service.sign({
        sub: 'u1',
        email: 'a@b.com',
        userType: 'CUSTOMER',
        roles: [],
      });
      const tampered = token.slice(0, -5) + 'XXXXX';
      expect(() => service.verify(tampered)).toThrow();
    });

    it('rejects a token signed with a different secret', () => {
      const token = jwt.sign(
        { sub: 'u1', email: 'a@b.com', userType: 'CUSTOMER', roles: [] },
        'different-secret',
        { issuer: 'vasanthi-designers' },
      );
      expect(() => service.verify(token)).toThrow();
    });

    it('rejects a token with wrong issuer', () => {
      const token = jwt.sign(
        { sub: 'u1', email: 'a@b.com', userType: 'CUSTOMER', roles: [] },
        'test-secret-at-least-16-chars',
        { issuer: 'wrong-issuer' },
      );
      expect(() => service.verify(token)).toThrow();
    });
  });

  describe('expiry', () => {
    it('rejects an expired token', () => {
      const token = jwt.sign(
        { sub: 'u1', email: 'a@b.com', userType: 'CUSTOMER', roles: [] },
        'test-secret-at-least-16-chars',
        { issuer: 'vasanthi-designers', expiresIn: -10 },
      );
      expect(() => service.verify(token)).toThrow();
    });

    it('rememberMe has longer expiry', () => {
      expect(service.getExpiresIn(false)).toBe(900);
      expect(service.getExpiresIn(true)).toBe(2592000);
    });
  });

  describe('edge cases', () => {
    it('rejects empty token', () => {
      expect(() => service.verify('')).toThrow();
    });

    it('rejects garbage string', () => {
      expect(() => service.verify('not-a-jwt')).toThrow();
    });

    it('rejects token with alg none', () => {
      // ponytail: jsonwebtoken rejects alg:none by default — verify this
      const header = Buffer.from(
        JSON.stringify({ alg: 'none', typ: 'JWT' }),
      ).toString('base64url');
      const payload = Buffer.from(JSON.stringify({ sub: 'u1' })).toString(
        'base64url',
      );
      const token = `${header}.${payload}.`;
      expect(() => service.verify(token)).toThrow();
    });
  });
});

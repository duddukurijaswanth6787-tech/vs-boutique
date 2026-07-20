import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';

// ponytail: controller-level tests — verify HTTP wiring, response format
describe('AuthController (HTTP)', () => {
  let app: INestApplication;
  const mockAuthService = {
    register: jest.fn().mockResolvedValue({
      accessToken: 'at',
      refreshToken: 'rt',
      expiresIn: 900,
    }),
    login: jest.fn().mockResolvedValue({
      accessToken: 'at',
      refreshToken: 'rt',
      expiresIn: 900,
    }),
    logout: jest.fn().mockResolvedValue(undefined),
    refresh: jest.fn().mockResolvedValue({
      accessToken: 'at2',
      refreshToken: 'rt2',
      expiresIn: 900,
    }),
    me: jest.fn().mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      roles: ['customer'],
      permissions: [],
    }),
    changePassword: jest.fn().mockResolvedValue(undefined),
    verifyToken: jest.fn().mockReturnValue({ sub: 'u1' }),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (ctx: any) => {
          const req = ctx.switchToHttp().getRequest();
          if (!req.headers.authorization) return false;
          req.user = {
            sub: 'u1',
            email: 'a@b.com',
            userType: 'CUSTOMER',
            roles: ['customer'],
          };
          return true;
        },
      })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('returns 201 with tokens for valid input', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'new@example.com',
          password: 'Password1!',
          firstName: 'New',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.data.accessToken).toBe('at');
          expect(res.body.data.refreshToken).toBe('rt');
        });
    });

    it('returns 400 for missing email', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ password: 'Password1!', firstName: 'New' })
        .expect(400);
    });

    it('returns 400 for short password', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'a@b.com', password: 'short', firstName: 'New' })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('returns 200 with tokens', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'a@b.com', password: 'Password1!' })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.accessToken).toBeDefined();
        });
    });

    it('returns 400 for missing password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'a@b.com' })
        .expect(400);
    });
  });

  describe('POST /auth/logout', () => {
    it('returns 200 with valid token', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', 'Bearer test-token')
        .send({ refreshToken: 'rt' })
        .expect(200);
    });
  });

  describe('GET /auth/me', () => {
    it('returns user info with valid token', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer test-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.id).toBe('u1');
        });
    });
  });

  describe('POST /auth/verify-token', () => {
    it('returns 200 with valid flag', () => {
      return request(app.getHttpServer())
        .post('/auth/verify-token')
        .send({ token: 'some-jwt' })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.valid).toBeDefined();
        });
    });
  });
});

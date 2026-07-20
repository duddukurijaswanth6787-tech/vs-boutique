import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { JwtService } from '@domains/auth/services/jwt.service';
import { JwtAuthGuard } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@domains/auth/guards/roles.guard';
import { PermissionsGuard } from '@domains/auth/guards/permissions.guard';
import { ThrottlerBehindProxyGuard } from '@common/security/throttler-behind-proxy.guard';

// ponytail: controller-level tests — verify HTTP wiring, auth, roles, response format
describe('ProductsController (HTTP)', () => {
  let app: INestApplication;
  const mockJwtService = {
    verify: jest.fn().mockReturnValue({ sub: 'u1', email: 'a@b.com' }),
  };
  const mockService = {
    findAll: jest.fn().mockResolvedValue({
      data: [{ id: 'p1', name: 'Test' }],
      meta: { total: 1 },
    }),
    findById: jest.fn().mockResolvedValue({ id: 'p1', name: 'Test' }),
    getStats: jest.fn().mockResolvedValue({ totalProducts: 1 }),
    create: jest.fn().mockResolvedValue({ id: 'p1', name: 'New' }),
    update: jest.fn().mockResolvedValue({ id: 'p1', name: 'Updated' }),
    delete: jest.fn().mockResolvedValue(undefined),
    restore: jest.fn().mockResolvedValue({ id: 'p1' }),
    publish: jest.fn().mockResolvedValue({ id: 'p1' }),
    bulk: jest.fn().mockResolvedValue({
      success: [{ id: 'p1' }],
      failed: [],
      successCount: 1,
      failureCount: 0,
    }),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        { provide: ProductsService, useValue: mockService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (ctx: any) => {
          const req = ctx.switchToHttp().getRequest();
          const auth = req.headers.authorization;
          if (!auth) return false;
          req.user = {
            sub: 'u1',
            email: 'a@b.com',
            userType: 'STAFF',
            roles: ['super_admin'],
          };
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ThrottlerBehindProxyGuard)
      .useValue({ canActivate: () => true })
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

  describe('GET /products', () => {
    it('returns paginated products', () => {
      return request(app.getHttpServer())
        .get('/products')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.data).toHaveLength(1);
          expect(res.body.data.data[0].id).toBe('p1');
        });
    });
  });

  describe('GET /products/stats', () => {
    it('returns product stats', () => {
      return request(app.getHttpServer()).get('/products/stats').expect(200);
    });
  });

  describe('GET /products/:id', () => {
    it('returns a product', () => {
      return request(app.getHttpServer())
        .get('/products/p1')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.id).toBe('p1');
        });
    });
  });

  describe('POST /products', () => {
    it('returns 401 without auth', async () => {
      const module2 = await Test.createTestingModule({
        controllers: [ProductsController],
        providers: [
          { provide: ProductsService, useValue: mockService },
          { provide: JwtService, useValue: mockJwtService },
        ],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue({ canActivate: () => false })
        .overrideGuard(RolesGuard)
        .useValue({ canActivate: () => true })
        .overrideGuard(ThrottlerBehindProxyGuard)
        .useValue({ canActivate: () => true })
        .compile();
      const app2 = module2.createNestApplication();
      app2.useGlobalPipes(
        new ValidationPipe({ whitelist: true, transform: true }),
      );
      await app2.init();
      await request(app2.getHttpServer())
        .post('/products')
        .send({ name: 'Test', sku: 'S1', basePrice: 100 })
        .expect(403);
      await app2.close();
    });

    it('creates product with valid auth', () => {
      return request(app.getHttpServer())
        .post('/products')
        .set('Authorization', 'Bearer test-token')
        .send({
          name: 'New',
          basePrice: 500,
          brandId: '550e8400-e29b-41d4-a716-446655440000',
        })
        .expect(201);
    });

    it('returns 400 for missing required fields', () => {
      return request(app.getHttpServer())
        .post('/products')
        .set('Authorization', 'Bearer test-token')
        .send({ name: 'Missing brandId' })
        .expect(400);
    });
  });

  describe('DELETE /products/:id', () => {
    it('deletes a product', () => {
      return request(app.getHttpServer())
        .delete('/products/p1')
        .set('Authorization', 'Bearer test-token')
        .expect(200);
    });
  });

  describe('POST /products/bulk', () => {
    it('performs bulk operation', () => {
      return request(app.getHttpServer())
        .post('/products/bulk')
        .set('Authorization', 'Bearer test-token')
        .send({ ids: ['p1'], action: 'delete' })
        .expect(201)
        .expect((res) => {
          expect(res.body.data.successCount).toBe(1);
        });
    });
  });
});

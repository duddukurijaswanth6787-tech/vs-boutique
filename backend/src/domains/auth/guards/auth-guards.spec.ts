import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard, IS_PUBLIC_KEY } from './jwt-auth.guard';
import { RolesGuard, ROLES_KEY } from './roles.guard';
import { PermissionsGuard, PERMISSIONS_KEY } from './permissions.guard';
import { JwtService } from '../services/jwt.service';
import { SecurityEventType } from '@common/security';

// ponytail: minimal mock factory — reuse across guard tests
function mockContext(opts: {
  headers?: Record<string, string>;
  user?: any;
  isPublic?: boolean;
  handlerRoles?: string[];
  handlerPerms?: string[];
}): ExecutionContext {
  const handler = () => {};
  const cls = class {};
  if (opts.handlerRoles)
    Reflect.metadata(ROLES_KEY, opts.handlerRoles)(handler);
  if (opts.handlerPerms)
    Reflect.metadata(PERMISSIONS_KEY, opts.handlerPerms)(handler);
  if (opts.isPublic) Reflect.metadata(IS_PUBLIC_KEY, true)(handler);

  return {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: opts.headers || {},
        user: opts.user,
        ip: '127.0.0.1',
        url: '/test',
        method: 'GET',
      }),
    }),
    getHandler: () => handler,
    getClass: () => cls,
  } as any;
}

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: jest.Mocked<JwtService>;
  let reflector: Reflector;

  beforeEach(() => {
    jwtService = { verify: jest.fn() } as any;
    reflector = new Reflector();
    guard = new JwtAuthGuard(jwtService, reflector);
  });

  it('allows access when @Public() decorator is set', () => {
    const ctx = mockContext({ isPublic: true });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('throws UnauthorizedException when no Authorization header', () => {
    const ctx = mockContext({});
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when Authorization header is not Bearer', () => {
    const ctx = mockContext({ headers: { authorization: 'Basic abc' } });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when token is invalid', () => {
    jwtService.verify.mockImplementation(() => {
      throw new Error('bad token');
    });
    const ctx = mockContext({ headers: { authorization: 'Bearer bad-token' } });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('sets request.user and returns true for valid token', () => {
    const payload = {
      sub: 'u1',
      email: 'a@b.com',
      userType: 'CUSTOMER',
      roles: ['customer'],
    };
    jwtService.verify.mockReturnValue(payload);
    const ctx = mockContext({
      headers: { authorization: 'Bearer good-token' },
    });
    expect(guard.canActivate(ctx)).toBe(true);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(jwtService.verify).toHaveBeenCalledWith('good-token');
  });
});

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('allows access when no @Roles() metadata', () => {
    const ctx = mockContext({ user: { roles: ['customer'] } });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows access when user has a matching role', () => {
    const ctx = mockContext({
      user: { roles: ['admin', 'customer'] },
      handlerRoles: ['admin'],
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('denies access when user lacks required role', () => {
    const ctx = mockContext({
      user: { roles: ['customer'] },
      handlerRoles: ['admin'],
    });
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('denies access when no user on request', () => {
    const ctx = mockContext({ handlerRoles: ['admin'] });
    expect(guard.canActivate(ctx)).toBe(false);
  });
});

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;
  let mockPrisma: any;
  let mockCache: any;
  let mockSecurityEvent: any;

  beforeEach(() => {
    reflector = new Reflector();
    mockPrisma = { userRole: { findMany: jest.fn() } };
    mockCache = {
      getOrSet: jest.fn((_key: string, factory: () => any) => factory()),
    };
    mockSecurityEvent = { log: jest.fn() };

    guard = new PermissionsGuard(
      reflector,
      mockPrisma,
      mockCache,
      mockSecurityEvent,
    );
  });

  it('allows access when no @Permissions() metadata', async () => {
    const ctx = mockContext({ user: { sub: 'u1' } });
    expect(await guard.canActivate(ctx)).toBe(true);
  });

  it('allows access when user has all required permissions', async () => {
    mockPrisma.userRole.findMany.mockResolvedValue([
      {
        role: {
          rolePermissions: [
            { permission: { code: 'products:read' } },
            { permission: { code: 'products:write' } },
          ],
        },
      },
    ]);
    const ctx = mockContext({
      user: { sub: 'u1' },
      handlerPerms: ['products:read'],
    });
    expect(await guard.canActivate(ctx)).toBe(true);
  });

  it('denies access and emits security event when user lacks permission', async () => {
    mockPrisma.userRole.findMany.mockResolvedValue([
      {
        role: { rolePermissions: [{ permission: { code: 'products:read' } }] },
      },
    ]);
    const ctx = mockContext({
      user: { sub: 'u1' },
      handlerPerms: ['products:delete'],
    });
    expect(await guard.canActivate(ctx)).toBe(false);
    expect(mockSecurityEvent.log).toHaveBeenCalledWith(
      expect.objectContaining({ type: SecurityEventType.PERMISSION_DENIED }),
    );
  });

  it('denies access when no user on request', async () => {
    const ctx = mockContext({ handlerPerms: ['products:read'] });
    expect(await guard.canActivate(ctx)).toBe(false);
  });

  it('uses cache for permission lookups', async () => {
    mockCache.getOrSet = jest
      .fn()
      .mockResolvedValue(new Set(['products:read']));
    const ctx = mockContext({
      user: { sub: 'u1' },
      handlerPerms: ['products:read'],
    });
    expect(await guard.canActivate(ctx)).toBe(true);
    expect(mockCache.getOrSet).toHaveBeenCalledWith(
      'perms:u1',
      expect.any(Function),
      300,
    );
  });
});

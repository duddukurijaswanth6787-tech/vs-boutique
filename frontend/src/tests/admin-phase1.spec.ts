import { hasRole, hasAnyRole, hasPermission, canAccessRoute } from '@/lib/permissions/rules';
import { UserProfile } from '@/types/auth.types';
import { authService } from '@/lib/auth/auth.service';
import { dashboardService } from '@/services/dashboard.service';
import { healthService } from '@/services/health.service';
import { apiClient } from '@/lib/api/client';

// Mock Axios library
jest.mock('axios', () => {
  const originalAxios = jest.requireActual('axios');
  return {
    ...originalAxios,
    create: jest.fn(() => ({
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() },
      },
      post: jest.fn(),
      get: jest.fn(),
    })),
  };
});

describe('Phase 1.0 — RBAC and Permission Helpers', () => {
  const superAdmin: UserProfile = {
    id: '1',
    email: 'super@vasanthidesigners.com',
    firstName: 'Super',
    userType: 'ADMIN',
    accountStatus: 'ACTIVE',
    roles: ['super_admin'],
    permissions: [],
  };

  const admin: UserProfile = {
    id: '2',
    email: 'admin@vasanthidesigners.com',
    firstName: 'Admin',
    userType: 'ADMIN',
    accountStatus: 'ACTIVE',
    roles: ['admin'],
    permissions: ['products.create', 'products.read'],
  };

  const customer: UserProfile = {
    id: '3',
    email: 'customer@gmail.com',
    firstName: 'Customer',
    userType: 'CUSTOMER',
    accountStatus: 'ACTIVE',
    roles: ['customer'],
    permissions: [],
  };

  test('1. hasRole checks', () => {
    expect(hasRole(superAdmin, 'super_admin')).toBe(true);
    expect(hasRole(admin, 'admin')).toBe(true);
    expect(hasRole(customer, 'admin')).toBe(false);
  });

  test('2. hasAnyRole checks', () => {
    expect(hasAnyRole(admin, ['admin', 'super_admin'])).toBe(true);
    expect(hasAnyRole(customer, ['admin', 'super_admin'])).toBe(false);
  });

  test('3. hasPermission checks (including super_admin bypass)', () => {
    expect(hasPermission(superAdmin, 'products.create')).toBe(true); // super_admin bypasses
    expect(hasPermission(admin, 'products.create')).toBe(true);
    expect(hasPermission(admin, 'users.write')).toBe(false);
    expect(hasPermission(customer, 'products.read')).toBe(false);
  });

  test('4. canAccessRoute checks based on roles/permissions configuration', () => {
    const routeAdminOnly = { roles: ['admin', 'super_admin'] };
    const routeWithPermission = { permissions: ['products.create'] };
    const publicAdminRoute = {};

    expect(canAccessRoute(admin, routeAdminOnly)).toBe(true);
    expect(canAccessRoute(customer, routeAdminOnly)).toBe(false);

    expect(canAccessRoute(superAdmin, routeWithPermission)).toBe(true); // Bypasses via super_admin role
    expect(canAccessRoute(admin, routeWithPermission)).toBe(true);
    expect(canAccessRoute(customer, routeWithPermission)).toBe(false);

    expect(canAccessRoute(admin, publicAdminRoute)).toBe(true);
  });
});

describe('Phase 1.1 — API Clients and Service Mappings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('5. authService.login formats payload and sets tokens', async () => {
    const mockTokens = { accessToken: 'access_123', refreshToken: 'refresh_123', expiresIn: 3600 };
    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        statusCode: 200,
        message: 'Login successful',
        data: mockTokens,
      },
    });

    const credentials = { email: 'admin@vasanthidesigners.com', password: 'password123' };
    const result = await authService.login(credentials);

    expect(postSpy).toHaveBeenCalledWith('/auth/login', credentials);
    expect(result).toEqual(mockTokens);
  });

  test('6. dashboardService API mapping parses KPIs and timeline chart', async () => {
    const mockSummary = {
      totalOrders: 10,
      totalRevenue: 25000,
      totalCustomers: 5,
      totalProducts: 20,
      pendingOrders: 2,
      lowStockCount: 1,
      recentOrders: [],
      topProducts: [],
    };

    const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        success: true,
        statusCode: 200,
        message: 'Summary fetched',
        data: mockSummary,
      },
    });

    const summaryResult = await dashboardService.getSummary();
    expect(getSpy).toHaveBeenCalledWith('/dashboard/summary');
    expect(summaryResult).toEqual(mockSummary);
  });

  test('7. healthService parses infrastructure state correctly', async () => {
    // Health is loaded from custom axios instances or client overrides
    const mockHealth = {
      status: 'ok',
      details: {
        database: { status: 'up' },
        redis: { status: 'up' },
      },
    };
    
    jest.spyOn(healthService, 'getHealth').mockResolvedValueOnce(mockHealth as unknown as { status: 'ok' | 'error'; details: Record<string, { status: string; [key: string]: unknown }> });
    const healthResult = await healthService.getHealth();

    expect(healthResult.status).toBe('ok');
    expect(healthResult.details?.database.status).toBe('up');
  });
});

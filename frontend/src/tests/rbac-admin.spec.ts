import { customersService } from '@/features/customers/customers.service';
import { staffService } from '@/features/staff/staff.service';
import { accessService } from '@/features/access/access.service';
import { settingsService } from '@/features/settings/settings.service';
import { auditService } from '@/features/audit/audit.service';
import { apiClient } from '@/lib/api/client';

// Mock Axios client
jest.mock('@/lib/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('Phase 6.15 — Customers, Staff, RBAC & Settings Admin Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('1. Customer response and status badge mapping', async () => {
    const mockCustomer = {
      id: 'customer-101',
      email: 'customer@gmail.com',
      firstName: 'Jashwanth',
      userType: 'CUSTOMER',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
      createdAt: new Date().toISOString(),
    };

    (apiClient.get as jest.Mock).mockResolvedValueOnce({
      data: { success: true, data: mockCustomer },
    });

    const result = await customersService.getCustomerById('customer-101');
    expect(result.id).toBe('customer-101');
    expect(result.accountStatus).toBe('ACTIVE');
    expect(result.userType).toBe('CUSTOMER');
  });

  test('2. Staff response and action validation', async () => {
    const mockStaff = {
      id: 'staff-101',
      userId: 'user-staff-101',
      email: 'staff@vasanthidesigners.com',
      firstName: 'Ramesh',
      department: 'SALES',
      designation: 'ASSOCIATE',
      employeeId: 'EMP-1001',
      employmentStatus: 'ACTIVE',
      accountStatus: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    (apiClient.get as jest.Mock).mockResolvedValueOnce({
      data: { success: true, data: mockStaff },
    });

    const result = await staffService.getStaffById('staff-101');
    expect(result.employeeId).toBe('EMP-1001');
    expect(result.department).toBe('SALES');
  });

  test('3. Role and permission mapping', async () => {
    const mockRole = {
      id: 'role-manager',
      name: 'order_manager',
      displayName: 'Order Manager',
      scope: 'DOMAIN',
      hierarchy: 1,
      isSystem: false,
      isActive: true,
      permissions: ['orders.read', 'orders.write'],
      createdAt: new Date().toISOString(),
    };

    (apiClient.get as jest.Mock).mockResolvedValueOnce({
      data: { success: true, data: mockRole },
    });

    const result = await accessService.getRoleById('role-manager');
    expect(result.name).toBe('order_manager');
    expect(result.permissions).toContain('orders.read');
  });

  test('4. Permission grouping logic mock simulation', () => {
    const permissions = [
      { id: '1', code: 'catalog.read', module: 'catalog' },
      { id: '2', code: 'catalog.write', module: 'catalog' },
      { id: '3', code: 'orders.read', module: 'orders' },
    ];

    const grouped = permissions.reduce((acc, curr) => {
      const group = curr.module.toUpperCase();
      if (!acc[group]) acc[group] = [];
      acc[group].push(curr);
      return acc;
    }, {} as Record<string, unknown[]>);

    expect(grouped.CATALOG.length).toBe(2);
    expect(grouped.ORDERS.length).toBe(1);
  });

  test('5. RBAC matrix checked-state logic', () => {
    const rolePermissions = ['catalog.read', 'catalog.write'];
    const hasPermission = (code: string) => rolePermissions.includes(code);

    expect(hasPermission('catalog.read')).toBe(true);
    expect(hasPermission('orders.read')).toBe(false);
  });

  test('6. RBAC mutation failure handling', async () => {
    (apiClient.post as jest.Mock).mockRejectedValueOnce({
      response: {
        status: 403,
        data: { message: 'Forbidden resource: require Super Admin role' },
      },
    });

    await expect(accessService.assignPermissionsToRole('role-1', ['perm-1'])).rejects.toBeDefined();
  });

  test('7. Audit metadata recursive secrets redaction', () => {
    const auditMeta = {
      action: 'LOGIN',
      input: {
        password: 'superSecretPassword123',
        user: 'admin',
        token: 'jwt_access_token_goes_here',
        apiKey: 'gemini-api-key-test',
      },
    };

    const redactSecrets = (obj: Record<string, unknown>): Record<string, unknown> => {
      const copy = JSON.parse(JSON.stringify(obj));
      const sensitiveKeys = ['password', 'token', 'apikey'];
      const traverse = (item: unknown) => {
        if (typeof item === 'object' && item !== null) {
          for (const key in item) {
            if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
              item[key] = '[REDACTED]';
            } else {
              traverse(item[key]);
            }
          }
        }
      };
      traverse(copy);
      return copy;
    };

    const redacted = redactSecrets(auditMeta);
    expect(redacted.input.password).toBe('[REDACTED]');
    expect(redacted.input.token).toBe('[REDACTED]');
    expect(redacted.input.apiKey).toBe('[REDACTED]');
    expect(redacted.input.user).toBe('admin');
  });

  test('8. Settings secret-value suppression', async () => {
    const mockSetting = {
      id: 'settings-1',
      key: 'GEMINI_API_KEY',
      value: 'sk-proj-xyz123',
      type: 'STRING',
      group: 'AI',
      createdAt: new Date().toISOString(),
    };

    (apiClient.get as jest.Mock).mockResolvedValueOnce({
      data: { success: true, data: mockSetting },
    });

    const result = await settingsService.getSettingByKey('GEMINI_API_KEY');
    expect(result.key).toBe('GEMINI_API_KEY');

    // Simulate settings component check
    const isSensitive = (key: string) => {
      const sensitiveKeys = ['secret', 'token', 'key', 'password'];
      return sensitiveKeys.some((sk) => key.toLowerCase().includes(sk));
    };

    expect(isSensitive(result.key)).toBe(true);
  });
});

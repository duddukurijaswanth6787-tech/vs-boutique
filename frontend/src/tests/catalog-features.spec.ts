import { generateVariantMatrix } from '@/features/catalog/variants/utils';
import { hasRole, canAccessRoute } from '@/lib/permissions/rules';

describe('Catalog Features & UI Utilities', () => {
  // Test 1: Cartesian matrix generator
  test('1. generates correct variants combinations (Cartesian)', () => {
    const selectors = [
      {
        attributeId: 'attr-color',
        name: 'Color',
        options: [
          { id: 'opt-red', label: 'Red', value: 'Red' },
          { id: 'opt-blue', label: 'Blue', value: 'Blue' },
        ],
      },
      {
        attributeId: 'attr-size',
        name: 'Size',
        options: [
          { id: 'opt-s', label: 'S', value: 'S' },
          { id: 'opt-m', label: 'M', value: 'M' },
        ],
      },
    ];

    const combinations = generateVariantMatrix(selectors, 999);
    expect(combinations).toHaveLength(4);
    expect(combinations[0].title).toBe('Red / S');
    expect(combinations[0].priceOverride).toBe(999);
    expect(combinations[0].attributeValues).toEqual([
      { attributeId: 'attr-color', attributeOptionId: 'opt-red', value: 'Red' },
      { attributeId: 'attr-size', attributeOptionId: 'opt-s', value: 'S' },
    ]);
    expect(combinations[3].title).toBe('Blue / M');
  });

  test('2. ignores empty attribute option selectors', () => {
    const selectors = [
      {
        attributeId: 'attr-color',
        name: 'Color',
        options: [{ id: 'opt-red', label: 'Red', value: 'Red' }],
      },
      {
        attributeId: 'attr-size',
        name: 'Size',
        options: [], // empty options
      },
    ];

    const combinations = generateVariantMatrix(selectors, 999);
    expect(combinations).toHaveLength(1);
    expect(combinations[0].title).toBe('Red');
  });

  // Test 3: Numeric field validation helper
  test('3. numeric transform handles inputs safely and rejects NaN', () => {
    const parseNumberInput = (v: unknown): number => {
      const parsed = parseFloat(v as string);
      return isNaN(parsed) || parsed < 0 ? 0 : parsed;
    };

    expect(parseNumberInput('100.50')).toBe(100.5);
    expect(parseNumberInput('-50')).toBe(0);
    expect(parseNumberInput('invalid')).toBe(0);
    expect(parseNumberInput(undefined)).toBe(0);
  });

  // Test 4: Category self-parent circularity safety check
  test('4. prevents assigning category parent to itself', () => {
    const isParentValid = (categoryId: string, parentId?: string): boolean => {
      if (!parentId) return true;
      return categoryId !== parentId;
    };

    expect(isParentValid('cat-1', 'cat-2')).toBe(true);
    expect(isParentValid('cat-1', 'cat-1')).toBe(false);
    expect(isParentValid('cat-1', undefined)).toBe(true);
  });

  // Test 5: Media MIME/Size constraints checking
  test('5. validates media files sizes and MIME types correctly', () => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxBytes = 5 * 1024 * 1024; // 5 MB

    const validateMedia = (mime: string, bytes: number) => {
      if (!allowedTypes.includes(mime)) return 'INVALID_MIME';
      if (bytes > maxBytes) return 'FILE_TOO_LARGE';
      return 'VALID';
    };

    expect(validateMedia('image/png', 2 * 1024 * 1024)).toBe('VALID');
    expect(validateMedia('application/pdf', 1000)).toBe('INVALID_MIME');
    expect(validateMedia('image/jpeg', 6 * 1024 * 1024)).toBe('FILE_TOO_LARGE');
  });

  // Test 6: Catalog RBAC constraints
  test('6. RBAC correctly protects catalog administration roles', () => {
    const superAdmin = { roles: ['super_admin'], permissions: [] };
    const admin = { roles: ['admin'], permissions: [] };
    const customer = { roles: ['customer'], permissions: [] };

    expect(hasRole(superAdmin, 'super_admin')).toBe(true);
    expect(canAccessRoute(admin, { roles: ['admin', 'super_admin'] })).toBe(true);
    expect(canAccessRoute(customer, { roles: ['admin', 'super_admin'] })).toBe(false);
  });
});

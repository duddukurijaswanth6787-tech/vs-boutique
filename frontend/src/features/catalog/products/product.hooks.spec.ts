import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useProducts, useCreateProduct, useDeleteProduct } from './product.hooks';

// ponytail: hook tests — verify hooks return expected shape
jest.mock('./product.service', () => ({
  productService: {
    findAll: jest.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
    create: jest.fn().mockResolvedValue({ id: 'p1', name: 'New' }),
    delete: jest.fn().mockResolvedValue(undefined),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useProducts', () => {
  it('returns loading state initially', () => {
    const { result } = renderHook(() => useProducts({}), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBeDefined();
  });
});

describe('useCreateProduct', () => {
  it('returns mutate function', () => {
    const { result } = renderHook(() => useCreateProduct(), { wrapper: createWrapper() });
    expect(result.current.mutate).toBeDefined();
  });
});

describe('useDeleteProduct', () => {
  it('returns mutate function', () => {
    const { result } = renderHook(() => useDeleteProduct(), { wrapper: createWrapper() });
    expect(result.current.mutate).toBeDefined();
  });
});

import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useExport } from './useExport';

describe('useExport', () => {
  it('provides triggerExport and isExporting', () => {
    const { result } = renderHook(() => useExport());
    expect(result.current.triggerExport).toBeDefined();
    expect(result.current.isExporting).toBe(false);
  });
});

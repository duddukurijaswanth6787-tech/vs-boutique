'use client';

import React, { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './client';
import { initializeClientTokens } from '@/lib/api/client';

export function VDQueryProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Bootstrap auth state tokens from client Storage
    initializeClientTokens();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

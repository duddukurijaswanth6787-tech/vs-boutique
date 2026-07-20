'use client';

import React, { createContext, useContext, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from './auth.service';
import { queryKeys } from '@/lib/query/client';
import { UserProfile } from '@/types/auth.types';
import { recentlyViewedService } from '@/features/recently-viewed/recently-viewed.service';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (credentials: Record<string, unknown>) => Promise<unknown>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<unknown>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [hasToken, setHasToken] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('vd_refresh_token');
    }
    return false;
  });

  // Fetch current user profile if session exists
  const {
    data: user = null,
    isLoading,
    refetch: refetchUser,
  } = useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: authService.getMe,
    enabled: hasToken,
    retry: false,
    staleTime: 10 * 60 * 1000, // 10 minutes cache freshness
  });

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: async () => {
      setHasToken(true);
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
      const result = await refetchUser();
      const profile = result.data;
      const guestItems = recentlyViewedService.getLocal();
      if (guestItems.length > 0 && profile?.id) {
        try {
          await recentlyViewedService.mergeGuest(profile.id, guestItems);
          recentlyViewedService.clearStorage();
        } catch { /* merge best-effort */ }
      }
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      setHasToken(false);
      queryClient.setQueryData(queryKeys.auth.me(), null);
      queryClient.clear();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    },
  });

  // System initializing state: true only when checking session but no response yet
  const isInitializing = hasToken && isLoading;

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user && (user.roles.includes('admin') || user.roles.includes('super_admin') || user.roles.includes('staff')),
    isInitializing,
    login: async (credentials) => loginMutation.mutateAsync(credentials),
    logout: async () => logoutMutation.mutateAsync(),
    refetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

import { useEffect, useCallback } from 'react';
import { useRecentlyViewedStore } from './recently-viewed.store';
import { useAuth } from '@/lib/auth/AuthContext';
import { recentlyViewedService } from './recently-viewed.service';

export function useRecentlyViewed(userId: string | null) {
  const store = useRecentlyViewedStore();

  useEffect(() => {
    if (userId) {
      store.loadUser(userId);
    } else {
      store.loadGuest();
    }
  }, [userId]);

  return store;
}

export function useRecordView() {
  return useRecentlyViewedStore((s) => s.record);
}

export function useMergeRecentlyViewed() {
  return useRecentlyViewedStore((s) => s.mergeOnLogin);
}

export function useAutoRecordView() {
  const { user } = useAuth();
  const record = useRecentlyViewedStore((s) => s.record);
  const userId = user?.id ?? null;

  return useCallback((productId: string) => {
    record(userId, productId);
  }, [userId, record]);
}


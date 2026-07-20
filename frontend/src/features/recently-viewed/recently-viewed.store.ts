import { create } from 'zustand';
import type { RecentlyViewedItem } from './recently-viewed.types';
import { recentlyViewedService } from './recently-viewed.service';

interface RecentlyViewedState {
  items: RecentlyViewedItem[];
  loading: boolean;
  error: string | null;
  loadGuest: () => void;
  loadUser: (userId: string) => Promise<void>;
  record: (userId: string | null, productId: string) => void;
  deleteOne: (userId: string | null, productId: string) => Promise<void>;
  deleteAll: (userId: string | null) => Promise<void>;
  mergeOnLogin: (userId: string) => Promise<void>;
}

export const useRecentlyViewedStore = create<RecentlyViewedState>((set) => ({
  items: [],
  loading: false,
  error: null,

  loadGuest: () => {
    const items = recentlyViewedService.getAllLocal();
    set({ items, loading: false, error: null });
  },

  loadUser: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const items = await recentlyViewedService.getAll(userId);
      set({ items, loading: false });
    } catch (e: any) {
      set({ error: e?.userMessage || 'Failed to load recently viewed', loading: false });
    }
  },

  record: (userId, productId) => {
    if (userId) {
      recentlyViewedService.record(userId, productId).catch(() => {});
    } else {
      recentlyViewedService.recordLocal(productId);
      const items = recentlyViewedService.getAllLocal();
      set({ items });
    }
  },

  deleteOne: async (userId, productId) => {
    if (userId) {
      await recentlyViewedService.deleteOne(userId, productId);
      const items = await recentlyViewedService.getAll(userId);
      set({ items });
    } else {
      const items = recentlyViewedService.getLocal().filter(i => i.productId !== productId);
      localStorage.setItem('recently_viewed_products', JSON.stringify(items));
      set({ items: items.map(i => ({ productId: i.productId, name: '', viewedAt: i.viewedAt })) });
    }
  },

  deleteAll: async (userId) => {
    if (userId) {
      await recentlyViewedService.deleteAll(userId);
    }
    recentlyViewedService.clearStorage();
    set({ items: [] });
  },

  mergeOnLogin: async (userId: string) => {
    const guestItems = recentlyViewedService.getLocal();
    if (guestItems.length) {
      await recentlyViewedService.mergeGuest(userId, guestItems);
      recentlyViewedService.clearStorage();
    }
    const items = await recentlyViewedService.getAll(userId);
    set({ items });
  },
}));

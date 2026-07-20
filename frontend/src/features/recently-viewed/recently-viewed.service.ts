import { apiClient } from '@/lib/api/client';
import type { RecentlyViewedItem } from './recently-viewed.types';
import type { StandardResponse } from '@/types/api.types';

const LS_KEY = 'recently_viewed_products';
const MAX_ITEMS = 20;

function readStorage(): { productId: string; viewedAt: string }[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  } catch { return []; }
}

function writeStorage(items: { productId: string; viewedAt: string }[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
}

export const recentlyViewedService = {
  recordLocal(productId: string) {
    const items = readStorage();
    const idx = items.findIndex(i => i.productId === productId);
    if (idx >= 0) items.splice(idx, 1);
    items.unshift({ productId, viewedAt: new Date().toISOString() });
    writeStorage(items);
  },

  getLocal(): { productId: string; viewedAt: string }[] {
    return readStorage();
  },

  getAllLocal(): RecentlyViewedItem[] {
    return readStorage().map(i => ({ productId: i.productId, name: '', viewedAt: i.viewedAt }));
  },

  async record(userId: string, productId: string): Promise<void> {
    await apiClient.post('/recently-viewed', { productId });
  },

  async getAll(userId: string, page = 1, limit = 10): Promise<RecentlyViewedItem[]> {
    const res = await apiClient.get<StandardResponse<{ data: RecentlyViewedItem[] }>>('/recently-viewed', { params: { page, limit } });
    return res.data.data!.data;
  },

  async deleteAll(userId: string): Promise<void> {
    await apiClient.delete('/recently-viewed');
  },

  async deleteOne(userId: string, productId: string): Promise<void> {
    await apiClient.delete(`/recently-viewed/${productId}`);
  },

  async mergeGuest(userId: string, items: { productId: string; viewedAt: string }[]): Promise<void> {
    await apiClient.post('/recently-viewed/merge-guest', { items });
  },

  clearStorage() {
    localStorage.removeItem(LS_KEY);
  },
};

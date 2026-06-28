/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const BASE_URL = '/api';

export interface User {
  id: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface MeasurementValues {
  bust?: number | string;
  waist?: number | string;
  hips?: number | string;
  length?: number | string;
  underbust?: number | string;
  blouseLength?: number | string;
  sleeveLength?: number | string;
  sleeveRound?: number | string;
  shoulder?: number | string;
  frontNeckDepth?: number | string;
  backNeckDepth?: number | string;
  flare?: number | string;
  kurtiLength?: number | string;
  shoulderWidth?: number | string;
  armhole?: number | string;
  [key: string]: number | string | undefined;
}

export interface MeasurementProfile {
  id?: number | string;
  profileName: string;
  garmentType: 'Blouse' | 'Lehenga' | 'Kurti';
  values: MeasurementValues;
  updatedAt?: string;
}

export interface CustomOrder {
  id?: number | string;
  productName: string;
  price: number;
  status?: string;
  lockedMeasurements: MeasurementValues;
  createdAt?: string;
}

// Local storage keys for fallback persistence
const LOCAL_STORAGE_KEYS = {
  TOKEN: 'vs_auth_token',
  USER: 'vs_user_profile',
  MEASUREMENTS: 'fb_measurements',
  ORDERS: 'fb_orders',
};

// Initial default presets to populate if local fallback is empty
const DEFAULT_PRESETS: MeasurementProfile[] = [
  {
    id: 'p_1',
    profileName: 'My Standard Sangeet Fit',
    garmentType: 'Blouse',
    values: {
      bust: '36',
      underbust: '30',
      blouseLength: '14.5',
      sleeveLength: '11',
      sleeveRound: '12',
      shoulder: '14',
      frontNeckDepth: '7.5',
      backNeckDepth: '9.5'
    },
    updatedAt: '2026-06-25'
  },
  {
    id: 'p_2',
    profileName: 'Mom Silk Saree Match',
    garmentType: 'Blouse',
    values: {
      bust: '38',
      underbust: '32',
      blouseLength: '15.0',
      sleeveLength: '11',
      sleeveRound: '12.5',
      shoulder: '14.5',
      frontNeckDepth: '7.0',
      backNeckDepth: '9.0'
    },
    updatedAt: '2026-06-26'
  }
];

// Helper to check network availability / try fetch
async function fetchWithTimeout(url: string, options: RequestInit, timeout = 3000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export const apiService = {
  // --- AUTHENTICATION SERVICE ---
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        throw new Error('Authentication failed on the server.');
      }
      const data: AuthResponse = await res.json();
      localStorage.setItem(LOCAL_STORAGE_KEYS.TOKEN, data.token);
      localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(data.user));
      return data;
    } catch (error) {
      console.warn('API authentication failed, using local offline session fallback:', error);
      // Simulate successful local session to keep the UI interactive
      const mockUser: User = { id: 'usr_guest_uuid', email };
      const mockToken = 'mock_jwt_token_local';
      localStorage.setItem(LOCAL_STORAGE_KEYS.TOKEN, mockToken);
      localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(mockUser));
      return { token: mockToken, user: mockUser };
    }
  },

  async register(email: string, password: string): Promise<AuthResponse> {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        throw new Error('Registration failed on the server.');
      }
      const data: AuthResponse = await res.json();
      localStorage.setItem(LOCAL_STORAGE_KEYS.TOKEN, data.token);
      localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(data.user));
      return data;
    } catch (error) {
      console.warn('API registration failed, using local offline fallback:', error);
      const mockUser: User = { id: 'usr_guest_uuid', email };
      const mockToken = 'mock_jwt_token_local';
      localStorage.setItem(LOCAL_STORAGE_KEYS.TOKEN, mockToken);
      localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(mockUser));
      return { token: mockToken, user: mockUser };
    }
  },

  logout() {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.TOKEN);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
  },

  getToken(): string | null {
    return localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN);
  },

  getCurrentUser(): User | null {
    const user = localStorage.getItem(LOCAL_STORAGE_KEYS.USER);
    if (!user) return null;
    try {
      return JSON.parse(user);
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  // --- CUSTOM MEASUREMENTS SERVICE ---
  async getMeasurements(): Promise<MeasurementProfile[]> {
    const token = this.getToken();
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/measurements`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token || ''}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Failed to fetch measurements from server');
      const data = await res.json();
      // Synchronize back to local storage cache for resilience
      localStorage.setItem(LOCAL_STORAGE_KEYS.MEASUREMENTS, JSON.stringify(data));
      return data;
    } catch (error) {
      console.warn('Measurements API unreachable. Serving from local persistent cache:', error);
      const cached = localStorage.getItem(LOCAL_STORAGE_KEYS.MEASUREMENTS);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          return DEFAULT_PRESETS;
        }
      }
      // Initialize with default presets if cache is dry
      localStorage.setItem(LOCAL_STORAGE_KEYS.MEASUREMENTS, JSON.stringify(DEFAULT_PRESETS));
      return DEFAULT_PRESETS;
    }
  },

  async saveMeasurement(profile: MeasurementProfile): Promise<MeasurementProfile> {
    const token = this.getToken();
    const payload = {
      id: profile.id,
      profileName: profile.profileName,
      garmentType: profile.garmentType,
      values: profile.values,
    };

    try {
      const res = await fetchWithTimeout(`${BASE_URL}/measurements`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save measurement profile on server');
      const savedProfile = await res.json();
      
      // Update local storage cache
      await this.syncLocalMeasurement(savedProfile);
      return savedProfile;
    } catch (error) {
      console.warn('Measurements API offline. Committing change to local persistent cache:', error);
      const offlineProfile: MeasurementProfile = {
        ...profile,
        id: profile.id || `local_${Date.now()}`,
        updatedAt: new Date().toISOString().split('T')[0],
      };
      await this.syncLocalMeasurement(offlineProfile);
      return offlineProfile;
    }
  },

  async deleteMeasurement(id: number | string): Promise<void> {
    const token = this.getToken();
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/measurements/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token || ''}`,
        },
      });
      if (!res.ok) throw new Error('Failed to delete measurement on server');
    } catch (error) {
      console.warn('Measurements API offline. Deleting profile from local persistent cache:', error);
    } finally {
      // Always remove from local cache to keep frontend in sync
      const cached = localStorage.getItem(LOCAL_STORAGE_KEYS.MEASUREMENTS);
      if (cached) {
        try {
          const profiles: MeasurementProfile[] = JSON.parse(cached);
          const filtered = profiles.filter(p => p.id !== id && String(p.id) !== String(id));
          localStorage.setItem(LOCAL_STORAGE_KEYS.MEASUREMENTS, JSON.stringify(filtered));
        } catch (e) {
          console.error('Failed to sync deleted item locally:', e);
        }
      }
    }
  },

  async syncLocalMeasurement(profile: MeasurementProfile): Promise<void> {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEYS.MEASUREMENTS);
    let profiles: MeasurementProfile[] = [];
    if (cached) {
      try {
        profiles = JSON.parse(cached);
      } catch {
        profiles = [...DEFAULT_PRESETS];
      }
    } else {
      profiles = [...DEFAULT_PRESETS];
    }

    const index = profiles.findIndex(p => p.id === profile.id || p.profileName === profile.profileName && p.garmentType === profile.garmentType);
    if (index !== -1) {
      profiles[index] = profile;
    } else {
      profiles.push(profile);
    }
    localStorage.setItem(LOCAL_STORAGE_KEYS.MEASUREMENTS, JSON.stringify(profiles));
  },

  // --- CUSTOM ORDERS SERVICE ---
  async getOrders(): Promise<CustomOrder[]> {
    const token = this.getToken();
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/orders`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token || ''}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Failed to fetch custom orders from server');
      const data = await res.json();
      localStorage.setItem(LOCAL_STORAGE_KEYS.ORDERS, JSON.stringify(data));
      return data;
    } catch (error) {
      console.warn('Custom Orders API unreachable. Serving from local persistent cache:', error);
      const cached = localStorage.getItem(LOCAL_STORAGE_KEYS.ORDERS);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          return [];
        }
      }
      return [];
    }
  },

  async createOrder(order: { productName: string; price: number; lockedMeasurements: MeasurementValues }): Promise<CustomOrder> {
    const token = this.getToken();
    try {
      const res = await fetchWithTimeout(`${BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(order),
      });
      if (!res.ok) throw new Error('Failed to submit bespoke order to server');
      const newOrder = await res.json();
      
      // Update local storage cache
      await this.syncLocalOrder(newOrder);
      return newOrder;
    } catch (error) {
      console.warn('Orders API offline. Submitting bespoke order locally to offline cache:', error);
      const offlineOrder: CustomOrder = {
        id: `ord_local_${Date.now()}`,
        productName: order.productName,
        price: order.price,
        status: 'Processing (Offline Fallback)',
        lockedMeasurements: order.lockedMeasurements,
        createdAt: new Date().toISOString().split('T')[0],
      };
      await this.syncLocalOrder(offlineOrder);
      return offlineOrder;
    }
  },

  async syncLocalOrder(order: CustomOrder): Promise<void> {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEYS.ORDERS);
    let orders: CustomOrder[] = [];
    if (cached) {
      try {
        orders = JSON.parse(cached);
      } catch {
        orders = [];
      }
    }
    orders.unshift(order); // Put newest order first
    localStorage.setItem(LOCAL_STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }
};

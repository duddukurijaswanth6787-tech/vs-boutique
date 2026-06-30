const BASE_URL = '';

const LOCAL_STORAGE_KEYS = {
  TOKEN: 'vs_auth_token',
  USER: 'vs_user_profile',
};

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

const fetchWithTimeout = (url: string, options: RequestInit = {}, timeout = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
};

async function request(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN);
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  const response = await fetchWithTimeout(`${BASE_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || err.message || `Request failed with status ${response.status}`);
  }
  return response.json();
}

export const apiService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const data: AuthResponse = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem(LOCAL_STORAGE_KEYS.TOKEN, data.token);
    localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(data.user));
    return data;
  },

  async register(email: string, password: string): Promise<AuthResponse> {
    const data: AuthResponse = await request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone: email }),
    });
    return data;
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

  async getMeasurements(): Promise<MeasurementProfile[]> {
    return await request('/measurements/me');
  },

  async saveMeasurement(profile: MeasurementProfile): Promise<MeasurementProfile> {
    return await request('/measurements/me', {
      method: 'PUT',
      body: JSON.stringify({
        profileName: profile.profileName,
        garmentType: profile.garmentType,
        values: profile.values,
      }),
    });
  },

  async deleteMeasurement(id: number | string): Promise<void> {
    await request('/measurements/me', { method: 'DELETE' });
  },

  async getOrders(): Promise<CustomOrder[]> {
    return await request('/orders/my');
  },

  async createOrder(order: { productName: string; price: number; lockedMeasurements: MeasurementValues }): Promise<CustomOrder> {
    return await request('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  },
};

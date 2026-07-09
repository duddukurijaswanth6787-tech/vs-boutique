const BASE_URL = '';

function getToken() {
  return localStorage.getItem('vs_auth_token');
}

export function setToken(token: string) {
  localStorage.setItem('vs_auth_token', token);
}

export function clearToken() {
  localStorage.removeItem('vs_auth_token');
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = {
  async register(email: string, password: string) {
    const res = await request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone: email }),
    });
    return res;
  },

  async login(email: string, password: string) {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.token) setToken(res.token);
    return res;
  },

  async getMeasurements() {
    return await request('/measurements/me');
  },

  async saveMeasurement(profile: { profileName: string; garmentType: string; values: any }) {
    return await request('/measurements/me', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  },

  async deleteMeasurement(id: string) {
    return await request(`/measurements/me`, {
      method: 'DELETE',
    });
  },

  async placeOrder(productName: string, price: number, lockedMeasurements: any) {
    return await request('/orders', {
      method: 'POST',
      body: JSON.stringify({ productName, price, lockedMeasurements }),
    });
  },

  async getOrders() {
    return await request('/orders/my');
  },

  async getSiteSettings() {
    return await request('/api/site-settings');
  },

  async updateSiteSettings(key: string, value: any) {
    return await request('/api/site-settings', {
      method: 'POST',
      body: JSON.stringify({ key, value }),
    });
  },

  async getStorefrontReports() {
    return await request('/api/admin/storefront-reports');
  },

  async updateOrderStatus(orderId: number, status: string) {
    return await request(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }
};

export default api;

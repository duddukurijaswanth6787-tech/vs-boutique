import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const createApiClient = (tokenKey) => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use((config) => {
    const token = localStorage.getItem(tokenKey);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem(tokenKey);
        if (tokenKey === 'token') {
          localStorage.removeItem('user');
          const path = window.location.pathname;
          const isCustomerPath = path === '/' || path.startsWith('/customer') || path.startsWith('/products') || path.startsWith('/boutique') || path === '/wishlist' || path.startsWith('/design-system');
          if (!isCustomerPath) {
            window.location.href = '/admin';
          }
        } else {
          localStorage.removeItem('customerUser');
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
};

export const api = createApiClient('token');
export const customerApi = createApiClient('customerToken');

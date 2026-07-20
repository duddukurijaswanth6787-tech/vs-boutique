import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { AuthTokens } from '@/types/auth.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Memory token cache to avoid scattered localStorage reads
let currentAccessToken: string | null = null;
let currentRefreshToken: string | null = null;

// Synchronization lock to ensure a single-flight refresh request
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

// Initialize tokens from localStorage (safe check for SSR environment)
export const initializeClientTokens = () => {
  if (typeof window !== 'undefined') {
    currentAccessToken = localStorage.getItem('vd_access_token');
    currentRefreshToken = localStorage.getItem('vd_refresh_token');
  }
};

export const setClientTokens = (tokens: AuthTokens | null) => {
  currentAccessToken = tokens?.accessToken || null;
  currentRefreshToken = tokens?.refreshToken || null;

  if (typeof window !== 'undefined') {
    if (tokens) {
      localStorage.setItem('vd_access_token', tokens.accessToken);
      localStorage.setItem('vd_refresh_token', tokens.refreshToken);
    } else {
      localStorage.removeItem('vd_access_token');
      localStorage.removeItem('vd_refresh_token');
    }
  }
};

export const getClientRefreshToken = (): string | null => {
  if (!currentRefreshToken && typeof window !== 'undefined') {
    currentRefreshToken = localStorage.getItem('vd_refresh_token');
  }
  return currentRefreshToken;
};

// Intercept outgoing requests to attach JWT Authorization Bearer header
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (!currentAccessToken && typeof window !== 'undefined') {
      currentAccessToken = localStorage.getItem('vd_access_token');
    }
    if (currentAccessToken && config.headers) {
      config.headers.Authorization = `Bearer ${currentAccessToken}`;
    }
    // Correlation trace support
    const correlationId = typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).substring(2);
    config.headers['x-correlation-id'] = correlationId;
    config.headers['x-request-id'] = correlationId;

    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept responses to handle standard errors and token expirations (401)
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Network / timeout errors — no response
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        (error as AxiosError & { userMessage?: string }).userMessage = 'Request timed out. Please try again.';
      } else {
        (error as AxiosError & { userMessage?: string }).userMessage = 'Could not reach the server. Check your connection.';
      }
      return Promise.reject(error);
    }

    const { status } = error.response;

    // Handle session expirations and token refresh
    if (status === 401 && !originalRequest._retry) {
      // Avoid looping if the refresh endpoint itself returns 401
      if (originalRequest.url?.includes('/auth/refresh') || originalRequest.url?.includes('/auth/login')) {
        handleAuthFailure();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getClientRefreshToken();

      if (!refreshToken) {
        handleAuthFailure();
        return Promise.reject(error);
      }

      try {
        // ponytail: call refresh token API directly via base axios client to avoid header interception loops
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const newTokens = response.data?.data;
        if (newTokens && newTokens.accessToken) {
          setClientTokens(newTokens);
          onRefreshed(newTokens.accessToken);
          isRefreshing = false;

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          }
          return apiClient(originalRequest);
        } else {
          throw new Error('Refresh failed');
        }
      } catch (refreshError) {
        isRefreshing = false;
        handleAuthFailure();
        return Promise.reject(refreshError);
      }
    }

    // Normalize error message for non-401 errors
    const data = error.response?.data as { message?: string | string[]; error?: string } | undefined;
    const serverMessage = data?.message
      ? (Array.isArray(data.message) ? data.message.join(', ') : String(data.message))
      : data?.error;
    (error as AxiosError & { userMessage?: string }).userMessage = serverMessage || undefined;

    return Promise.reject(error);
  }
);

function handleAuthFailure() {
  setClientTokens(null);
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    if (currentPath !== '/login') {
      // Preserve destination for redirect post-login
      window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
    }
  }
}

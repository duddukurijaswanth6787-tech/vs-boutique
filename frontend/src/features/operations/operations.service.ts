import { apiClient } from '@/lib/api/client';
import { SystemHealth } from './operations.types';

export const operationsService = {
  async getHealth(): Promise<SystemHealth> {
    // Get the base API URL (e.g. http://localhost:4000/api/v1)
    const base = apiClient.defaults.baseURL || 'http://localhost:4000/api/v1';
    const rootBaseUrl = base.replace('/api/v1', '');
    
    // Call the public health check endpoint (which is excluded from global prefix and served at root)
    const res = await apiClient.get<SystemHealth>('/health', {
      baseURL: rootBaseUrl,
    });
    return res.data;
  },
};

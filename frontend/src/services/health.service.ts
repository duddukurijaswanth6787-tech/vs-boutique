import axios from 'axios';

const HEALTH_URL = process.env.NEXT_PUBLIC_HEALTH_URL || 'http://localhost:4000/health';

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  info?: Record<string, { status: string; [key: string]: unknown }>;
  error?: Record<string, { status: string; [key: string]: unknown }>;
  details?: Record<string, { status: string; [key: string]: unknown }>;
}

export const healthService = {
  getHealth: async (): Promise<HealthCheckResponse> => {
    // Call raw health check endpoint directly
    const response = await axios.get<HealthCheckResponse>(HEALTH_URL, {
      timeout: 5000,
    });
    return response.data;
  },
};

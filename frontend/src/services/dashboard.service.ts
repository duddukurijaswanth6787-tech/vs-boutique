import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';

export interface DashboardSummary {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  pendingOrders: number;
  lowStockCount: number;
  recentOrders: unknown[];
  topProducts: unknown[];
}

export interface SalesChartData {
  labels: string[];
  data: number[];
}

export const dashboardService = {
  getSummary: async (): Promise<DashboardSummary> => {
    const response = await apiClient.get<StandardResponse<DashboardSummary>>('/dashboard/summary');
    if (!response.data.data) throw new Error(response.data.message || 'Failed to fetch summary');
    return response.data.data;
  },

  getSalesChart: async (period?: string): Promise<SalesChartData> => {
    const response = await apiClient.get<StandardResponse<SalesChartData>>('/dashboard/sales-chart', {
      params: { period },
    });
    if (!response.data.data) throw new Error(response.data.message || 'Failed to fetch sales chart');
    return response.data.data;
  },
};

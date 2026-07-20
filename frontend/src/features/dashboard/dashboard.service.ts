import { apiClient } from '@/lib/api/client';
import {
  DashboardSummary,
  SalesChartData,
  CancellationRefundTrends,
  InventoryValuation,
  WarehouseStock,
  PaymentStatusDistribution,
  CouponUsageSummary,
} from './dashboard.types';
import { StandardResponse } from '@/types/api.types';

type ApiResponse<T> = StandardResponse<T>;

export const dashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    const res = await apiClient.get<ApiResponse<DashboardSummary>>('/dashboard/summary');
    return res.data.data!;
  },

  async getSalesChart(period?: string): Promise<SalesChartData> {
    const res = await apiClient.get<ApiResponse<SalesChartData>>('/dashboard/sales-chart', {
      params: { period },
    });
    return res.data.data!;
  },

  async getCancellationRefundTrends(): Promise<CancellationRefundTrends> {
    const res = await apiClient.get<ApiResponse<CancellationRefundTrends>>(
      '/dashboard/cancellation-refund-trends',
    );
    return res.data.data!;
  },

  async getInventoryValuation(): Promise<InventoryValuation> {
    const res = await apiClient.get<ApiResponse<InventoryValuation>>('/dashboard/inventory-valuation');
    return res.data.data!;
  },

  async getWarehouseStock(): Promise<WarehouseStock[]> {
    const res = await apiClient.get<ApiResponse<WarehouseStock[]>>('/dashboard/warehouse-stock');
    return res.data.data!;
  },

  async getPaymentStatusDistribution(
    startDate?: string,
    endDate?: string,
  ): Promise<PaymentStatusDistribution[]> {
    const res = await apiClient.get<ApiResponse<PaymentStatusDistribution[]>>(
      '/dashboard/payment-status-distribution',
      { params: { startDate, endDate } },
    );
    return res.data.data!;
  },

  async getCouponUsageSummary(
    startDate?: string,
    endDate?: string,
  ): Promise<CouponUsageSummary> {
    const res = await apiClient.get<ApiResponse<CouponUsageSummary>>('/dashboard/coupon-usage', {
      params: { startDate, endDate },
    });
    return res.data.data!;
  },
};

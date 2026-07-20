import { useQuery } from '@tanstack/react-query';
import { dashboardService } from './dashboard.service';

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => dashboardService.getSummary(),
  });
}

export function useDashboardSalesChart(period?: string) {
  return useQuery({
    queryKey: ['dashboard-sales-chart', period],
    queryFn: () => dashboardService.getSalesChart(period),
  });
}

export function useCancellationRefundTrends() {
  return useQuery({
    queryKey: ['dashboard-cancellation-refund-trends'],
    queryFn: () => dashboardService.getCancellationRefundTrends(),
  });
}

export function useInventoryValuation() {
  return useQuery({
    queryKey: ['dashboard-inventory-valuation'],
    queryFn: () => dashboardService.getInventoryValuation(),
  });
}

export function useWarehouseStock() {
  return useQuery({
    queryKey: ['dashboard-warehouse-stock'],
    queryFn: () => dashboardService.getWarehouseStock(),
  });
}

export function usePaymentStatusDistribution(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['dashboard-payment-status-distribution', startDate, endDate],
    queryFn: () => dashboardService.getPaymentStatusDistribution(startDate, endDate),
  });
}

export function useCouponUsageSummary(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['dashboard-coupon-usage', startDate, endDate],
    queryFn: () => dashboardService.getCouponUsageSummary(startDate, endDate),
  });
}

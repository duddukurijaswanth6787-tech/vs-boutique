import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsService } from './reports.service';
import { GenerateReportDto } from './reports.types';

export function useSalesReport(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['sales-report', startDate, endDate],
    queryFn: () => reportsService.getSalesReport(startDate, endDate),
  });
}

export function useInventoryReport(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['inventory-report', startDate, endDate],
    queryFn: () => reportsService.getInventoryReport(startDate, endDate),
  });
}

export function useCustomerReport(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['customer-report', startDate, endDate],
    queryFn: () => reportsService.getCustomerReport(startDate, endDate),
  });
}

export function usePaymentReport(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['payment-report', startDate, endDate],
    queryFn: () => reportsService.getPaymentReport(startDate, endDate),
  });
}

export function useOrderReport(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['order-report', startDate, endDate],
    queryFn: () => reportsService.getOrderReport(startDate, endDate),
  });
}

export function useCreateExportJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: GenerateReportDto) => reportsService.createExportJob(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['export-jobs'] });
    },
  });
}

export function useExportJobs(page = 1, limit = 10, refetchInterval?: number) {
  return useQuery({
    queryKey: ['export-jobs', page, limit],
    queryFn: () => reportsService.getExportJobs(page, limit),
    refetchInterval,
  });
}

export function useExportJobDownloadUrl(id: string, enabled = false) {
  return useQuery({
    queryKey: ['export-download-url', id],
    queryFn: () => reportsService.getExportJobDownloadUrl(id),
    enabled: enabled && !!id,
  });
}

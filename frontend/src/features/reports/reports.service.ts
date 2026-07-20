import { apiClient } from '@/lib/api/client';
import { GenerateReportDto, ReportResponse, ExportJob, ExportJobResponse } from './reports.types';
import { StandardResponse, PaginatedResponse } from '@/types/api.types';

type ApiResponse<T> = StandardResponse<T>;

export const reportsService = {
  async getSalesReport(startDate?: string, endDate?: string): Promise<ReportResponse> {
    const res = await apiClient.get<ApiResponse<ReportResponse>>('/reports/sales', {
      params: { startDate, endDate },
    });
    return res.data.data!;
  },

  async getInventoryReport(startDate?: string, endDate?: string): Promise<ReportResponse> {
    const res = await apiClient.get<ApiResponse<ReportResponse>>('/reports/inventory', {
      params: { startDate, endDate },
    });
    return res.data.data!;
  },

  async getCustomerReport(startDate?: string, endDate?: string): Promise<ReportResponse> {
    const res = await apiClient.get<ApiResponse<ReportResponse>>('/reports/customers', {
      params: { startDate, endDate },
    });
    return res.data.data!;
  },

  async getPaymentReport(startDate?: string, endDate?: string): Promise<ReportResponse> {
    const res = await apiClient.get<ApiResponse<ReportResponse>>('/reports/payments', {
      params: { startDate, endDate },
    });
    return res.data.data!;
  },

  async getOrderReport(startDate?: string, endDate?: string): Promise<ReportResponse> {
    const res = await apiClient.get<ApiResponse<ReportResponse>>('/reports/orders', {
      params: { startDate, endDate },
    });
    return res.data.data!;
  },

  async createExportJob(dto: GenerateReportDto): Promise<ExportJobResponse> {
    const res = await apiClient.post<ApiResponse<ExportJobResponse>>('/reports/export', dto);
    return res.data.data!;
  },

  async getExportJobs(page = 1, limit = 10): Promise<PaginatedResponse<ExportJob>> {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<ExportJob>>>('/reports/exports', {
      params: { page, limit },
    });
    return res.data.data!;
  },

  async getExportJobDownloadUrl(id: string): Promise<{ url: string }> {
    const res = await apiClient.get<ApiResponse<{ url: string }>>(`/reports/exports/${id}/download`);
    return res.data.data!;
  },
};

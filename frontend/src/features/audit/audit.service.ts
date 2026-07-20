import { apiClient } from '@/lib/api/client';
import { AuditLogQueryDto, AuditLogResponse } from './audit.types';
import { StandardResponse, PaginatedResponse } from '@/types/api.types';

type ApiResponse<T> = StandardResponse<T>;

export const auditService = {
  async getAuditLogs(query: AuditLogQueryDto): Promise<PaginatedResponse<AuditLogResponse>> {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<AuditLogResponse>>>('/audit-logs', {
      params: query,
    });
    return res.data.data!;
  },

  async getAuditLogById(id: string): Promise<AuditLogResponse> {
    const res = await apiClient.get<ApiResponse<AuditLogResponse>>(`/audit-logs/${id}`);
    return res.data.data!;
  },
};

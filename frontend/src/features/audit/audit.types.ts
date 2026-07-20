export interface AuditLogResponse {
  id: string;
  userId?: string;
  staffId?: string;
  action: string;
  module: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  status: string;
  message?: string;
  oldValue?: unknown;
  newValue?: unknown;
  createdAt: string;
}

export interface AuditLogQueryDto {
  module?: string;
  action?: string;
  userId?: string;
  staffId?: string;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

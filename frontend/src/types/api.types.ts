export interface StandardResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  meta: {
    timestamp: string;
    correlationId: string;
    path: string;
    apiVersion: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
    [key: string]: unknown;
  };
}

export interface ApiErrorResponse {
  success: boolean;
  error: string;
  code: string;
  message: string;
  timestamp: string;
  correlationId: string;
  path: string;
  metadata: {
    validationErrors?: string[];
    [key: string]: unknown;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

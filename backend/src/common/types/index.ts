import { EnvironmentType } from '../enums';

/**
 * Standard Universally Unique Identifier type.
 */
export type UUID = string;

/**
 * Common pagination query parameters.
 */
export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/**
 * Structured envelope for success API responses.
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  meta: {
    timestamp: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    [key: string]: unknown;
  };
}

/**
 * Metadata representing the execution context of the request.
 * Useful for logging, security audits, and request tracking.
 */
export interface RequestContext {
  requestId: string;
  ip: string;
  userAgent: string;
  userId?: UUID;
  role?: string;
}

/**
 * Reusable type representing the active runtime environment.
 */
export type Environment = EnvironmentType;

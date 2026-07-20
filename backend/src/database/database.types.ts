export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export type SortDirection = 'asc' | 'desc';

export interface FindAllParams {
  page?: number;
  limit?: number;
  search?: string;
  orderBy?: string;
  orderDirection?: SortDirection;
}

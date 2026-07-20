export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditableEntity extends BaseEntity {
  createdBy?: string;
  updatedBy?: string;
}

export interface SoftDeleteEntity extends AuditableEntity {
  deletedAt?: Date | null;
  deletedBy?: string | null;
}

export interface MediaFile {
  url: string;
  alt?: string;
  type: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
}

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

export interface SearchFilter {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface SortOptions {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

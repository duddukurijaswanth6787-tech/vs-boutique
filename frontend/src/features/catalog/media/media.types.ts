export interface CreateMediaDto {
  productId: string;
  variantId?: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | '360_IMAGE';
  title?: string;
  altText?: string;
  url: string;
  thumbnailUrl?: string;
  displayOrder?: number;
  isPrimary?: boolean;
}

export interface UpdateMediaDto {
  title?: string;
  altText?: string;
  url?: string;
  thumbnailUrl?: string;
  displayOrder?: number;
  isPrimary?: boolean;
}

export interface MediaQueryDto {
  productId?: string;
  variantId?: string;
  mediaType?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ReorderMediaDto {
  items: {
    id: string;
    displayOrder: number;
  }[];
}

export interface MediaResponse {
  id: string;
  productId: string;
  variantId?: string;
  mediaType: string;
  title?: string;
  altText?: string;
  url: string;
  thumbnailUrl?: string;
  displayOrder: number;
  isPrimary: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaListResponse {
  data: MediaResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface UploadUrlResponse {
  uploadUrl: string;
  s3Key: string;
  url: string;
}

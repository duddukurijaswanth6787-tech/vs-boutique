export interface CreateBrandDto {
  name: string;
  slug?: string;
  description?: string;
  logo?: string;
  bannerImage?: string;
  website?: string;
  isFeatured?: boolean;
  isVisible?: boolean;
  displayOrder?: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
}

export interface UpdateBrandDto extends Partial<CreateBrandDto> {
  status?: string;
}

export interface BrandQueryDto {
  search?: string;
  isFeatured?: boolean;
  isVisible?: boolean;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BrandResponse {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  bannerImage?: string;
  website?: string;
  isFeatured: boolean;
  isVisible: boolean;
  displayOrder: number;
  status: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BrandListResponse {
  data: BrandResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

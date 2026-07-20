export interface CreateCmsPageDto {
  title: string;
  slug: string;
  content?: string;
  metaTitle?: string;
  metaDescription?: string;
  status?: string;
}

export interface UpdateCmsPageDto {
  title?: string;
  slug?: string;
  content?: string;
  metaTitle?: string;
  metaDescription?: string;
  status?: string;
}

export interface CmsPageQueryDto {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface CmsPageResponse {
  id: string;
  title: string;
  slug: string;
  content?: string;
  metaTitle?: string;
  metaDescription?: string;
  status: string;
  createdAt: string;
}

export interface CmsPageListResponse {
  data: CmsPageResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface CreateCmsSectionDto {
  name: string;
  slug: string;
  type: string;
  content?: unknown;
  displayOrder?: number;
  isActive?: boolean;
}

export interface CmsSectionResponse {
  id: string;
  name: string;
  slug: string;
  type: string;
  content?: unknown;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

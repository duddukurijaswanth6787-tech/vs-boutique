export interface CreateCategoryDto {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  image?: string;
  bannerImage?: string;
  parentId?: string;
  displayOrder?: number;
  isFeatured?: boolean;
  isVisible?: boolean;
  isMenuVisible?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  status?: string;
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {
  status?: string;
}

export interface MoveCategoryDto {
  newParentId?: string;
}

export interface ReorderCategoriesDto {
  items: {
    id: string;
    displayOrder: number;
  }[];
}

export interface CategoryQueryDto {
  search?: string;
  parentId?: string;
  isFeatured?: boolean;
  isVisible?: boolean;
  status?: string;
  page?: number;
  limit?: number;
  deleted?: string;
}

export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  bannerImage?: string;
  parentId?: string;
  level: number;
  path: string;
  displayOrder: number;
  isFeatured: boolean;
  isVisible: boolean;
  isMenuVisible: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  children?: CategoryResponse[];
  parent?: {
    id: string;
    name: string;
  } | null;
  productCount?: number;
}

export interface CategorySummaryResponse {
  totalCategories: number;
  activeCategories: number;
  activePercentage: number;
  inactiveCategories: number;
  inactivePercentage: number;
  categoriesWithProducts: number;
  categoriesWithProductsPercentage: number;
  createdThisMonth: number;
}

export interface CategoryListResponse {
  data: CategoryResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

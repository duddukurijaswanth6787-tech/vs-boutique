export enum ProductStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
  DISCONTINUED = 'DISCONTINUED',
}

export enum ProductType {
  READYMADE = 'READYMADE',
  WHOLESALE = 'WHOLESALE',
  FEATURED = 'FEATURED',
  NEW_ARRIVAL = 'NEW_ARRIVAL',
  BESTSELLER = 'BESTSELLER',
}

export enum GenderType {
  WOMEN = 'WOMEN',
  GIRLS = 'GIRLS',
  UNISEX = 'UNISEX',
}

export enum AgeGroup {
  AGE_4_6 = '4-6',
  AGE_7_9 = '7-9',
  AGE_10_12 = '10-12',
  AGE_13_17 = '13-17',
  AGE_18_22 = '18-22',
  AGE_23_29 = '23-29',
  AGE_30_35 = '30-35',
  AGE_35_PLUS = '35+',
}

export enum ProductVisibility {
  VISIBLE = 'VISIBLE',
  HIDDEN = 'HIDDEN',
  SEARCHABLE = 'SEARCHABLE',
}

export enum AttributeType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  COLOR = 'COLOR',
  DATE = 'DATE',
  SELECT = 'SELECT',
  MULTI_SELECT = 'MULTI_SELECT',
  SIZE = 'SIZE',
  IMAGE = 'IMAGE',
  URL = 'URL',
}

export interface ProductAttributeEntry {
  attributeId: string;
  value?: string;
}

export interface CreateProductDto {
  name: string;
  brandId: string;
  shortDescription?: string;
  description?: string;
  type?: ProductType;
  basePrice: number;
  salePrice?: number;
  wholesalePrice?: number;
  costPrice?: number;
  taxPercentage?: number;
  discountType?: string;
  discountValue?: number;
  trackInventory?: boolean;
  allowBackorder?: boolean;
  minimumOrderQuantity?: number;
  maximumOrderQuantity?: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  displayOrder?: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  canonicalUrl?: string;
  searchKeywords?: string;
  gender?: GenderType;
  ageGroup?: AgeGroup;
  occasion?: string;
  season?: string;
  tags?: string[];
  collections?: string[];
  categoryIds?: string[];
  attributes?: ProductAttributeEntry[];
}

export interface UpdateProductDto extends Partial<CreateProductDto> {
  status?: ProductStatus;
  visibility?: ProductVisibility;
}

export interface ProductQueryDto {
  search?: string;
  brandId?: string;
  status?: string;
  visibility?: string;
  type?: ProductType;
  gender?: GenderType;
  ageGroup?: AgeGroup;
  occasion?: string;
  season?: string;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isPublished?: boolean;
  minPrice?: number;
  maxPrice?: number;
  categoryId?: string;
  deleted?: 'only' | 'all';
  createdBy?: string;
  updatedBy?: string;
  tags?: string[];
  createdAfter?: string;
  createdBefore?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProductCategoryInfo {
  categoryId: string;
  categoryName: string;
  categorySlug: string;
}

export interface ProductAttributeInfo {
  attributeId: string;
  attributeName: string;
  attributeType: AttributeType;
  value?: string;
}

export interface ProductRelatedInfo {
  productId: string;
  productName: string;
}

export interface ProductResponse {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  slug: string;
  primaryImageUrl?: string;
  shortDescription?: string;
  description?: string;
  brandId: string;
  brandName?: string;
  type: string;
  status: string;
  visibility: string;
  basePrice: number;
  salePrice?: number;
  wholesalePrice?: number;
  costPrice?: number;
  taxPercentage?: number;
  discountType?: string;
  discountValue?: number;
  trackInventory: boolean;
  allowBackorder: boolean;
  minimumOrderQuantity: number;
  maximumOrderQuantity: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isPublished: boolean;
  publishedAt?: string;
  displayOrder: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  canonicalUrl?: string;
  searchKeywords?: string;
  gender?: string;
  ageGroup?: string;
  occasion?: string;
  season?: string;
  tags?: string[];
  collections?: string[];
  categories?: ProductCategoryInfo[];
  attributes?: ProductAttributeInfo[];
  relatedProducts?: ProductRelatedInfo[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductStatsResponse {
  total: number;
  active: number;
  draft: number;
  outOfStock: number;
  lowStock: number;
}

export interface ProductListResponse {
  data: ProductResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface AssignCategoriesDto {
  categoryIds: string[];
}

export interface AssignAttributesDto {
  attributes: {
    attributeId: string;
    value: string;
  }[];
}

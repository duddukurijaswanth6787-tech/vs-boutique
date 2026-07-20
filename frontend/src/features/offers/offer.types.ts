export enum OfferType {
  PRODUCT = 'PRODUCT',
  CATEGORY = 'CATEGORY',
  BRAND = 'BRAND',
  FESTIVAL = 'FESTIVAL',
  FLASH_SALE = 'FLASH_SALE',
}

export interface CreateOfferDto {
  name: string;
  description?: string;
  type: OfferType;
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  applicableTo?: string;
  applicableIds?: string[];
  priority?: number;
  startDate: string;
  endDate: string;
}

export interface UpdateOfferDto {
  name?: string;
  description?: string;
  type?: OfferType;
  value?: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  applicableTo?: string;
  applicableIds?: string[];
  priority?: number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export interface OfferQueryDto {
  search?: string;
  isActive?: boolean;
  type?: OfferType;
  page?: number;
  limit?: number;
}

export interface OfferResponse {
  id: string;
  name: string;
  description?: string;
  type: OfferType;
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  applicableTo?: string;
  applicableIds?: string[];
  priority: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface OfferListResponse {
  data: OfferResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface CreateReelDto {
  name: string;
  slug?: string;
  description?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  position?: number;
  displayOrder?: number;
  featured?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  status?: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED';
  visibility?: 'PUBLIC' | 'HIDDEN';
  startDate?: string;
  endDate?: string;
}

export interface UpdateReelDto {
  name?: string;
  slug?: string;
  description?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  position?: number;
  displayOrder?: number;
  featured?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  status?: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED';
  visibility?: 'PUBLIC' | 'HIDDEN';
  startDate?: string;
  endDate?: string;
}

export interface ReelQueryDto {
  search?: string;
  status?: string;
  visibility?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ReelProductDto {
  id: string;
  productId: string;
  displayOrder: number;
  productName?: string;
  productSlug?: string;
  primaryImageUrl?: string;
}

export interface ReelResponse {
  id: string;
  name: string;
  slug: string;
  description?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration: number;
  position: number;
  displayOrder: number;
  featured: boolean;
  autoPlay: boolean;
  muted: boolean;
  loop: boolean;
  status: string;
  visibility: string;
  startDate?: string;
  endDate?: string;
  viewCount: number;
  playCount: number;
  clickCount: number;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  products?: ReelProductDto[];
  productCount?: number;
}

export interface ReelListResponse {
  data: ReelResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface UpdateReelStatusDto {
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

export interface ReorderItem {
  id: string;
  displayOrder: number;
}

export interface ReorderReelsDto {
  items: ReorderItem[];
}

export interface AttachProductsDto {
  productIds: string[];
}

export interface UploadUrlDto {
  extension: string;
  type?: 'video' | 'thumbnail';
}

export interface UploadUrlResponse {
  url: string;
  filePath: string;
}

export interface ReelAnalyticsSummary {
  totalViews: number;
  totalPlays: number;
  totalProductClicks: number;
  totalWishlistClicks: number;
  totalCartClicks: number;
  totalOrdersGenerated: number;
  averageConversionRate: number;
}

export interface DailyAnalytics {
  id: string;
  date: string;
  views: number;
  plays: number;
  productClicks: number;
  wishlistClicks: number;
  cartClicks: number;
  ordersGenerated: number;
  conversionRate: number;
}

export interface ReelAnalyticsResponse {
  summary: ReelAnalyticsSummary;
  daily: DailyAnalytics[];
}

export interface CreateReviewDto {
  productId: string;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
}

export interface UpdateReviewDto {
  rating?: number;
  title?: string;
  comment?: string;
}

export interface ReviewQueryDto {
  productId?: string;
  customerId?: string;
  rating?: number;
  status?: string;
  page?: number;
  limit?: number;
}

export interface ReviewImageResponse {
  id: string;
  url: string;
  altText?: string;
  displayOrder: number;
}

export interface ReviewResponse {
  id: string;
  productId: string;
  customerId: string;
  rating: number;
  title?: string;
  comment?: string;
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  helpfulCount: number;
  unhelpfulCount: number;
  status: string;
  images?: ReviewImageResponse[];
  createdAt: string;
}

export interface ReviewListResponse {
  data: ReviewResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface ProductRatingSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
}

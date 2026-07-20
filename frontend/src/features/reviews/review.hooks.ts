import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewService } from './review.service';
import { ReviewQueryDto } from './review.types';

export const reviewKeys = {
  all: ['reviews'] as const,
  lists: () => [...reviewKeys.all, 'list'] as const,
  list: (query: ReviewQueryDto) => [...reviewKeys.lists(), query] as const,
  summaries: () => [...reviewKeys.all, 'summary'] as const,
  summary: (productId: string) => [...reviewKeys.summaries(), productId] as const,
  details: () => [...reviewKeys.all, 'detail'] as const,
  detail: (id: string) => [...reviewKeys.details(), id] as const,
};

export function useReviews(query: ReviewQueryDto = {}) {
  return useQuery({
    queryKey: reviewKeys.list(query),
    queryFn: () => reviewService.findAll(query),
  });
}

export function useProductReviewSummary(productId: string, enabled = true) {
  return useQuery({
    queryKey: reviewKeys.summary(productId),
    queryFn: () => reviewService.getProductRatingSummary(productId),
    enabled: !!productId && enabled,
  });
}

export function useReview(id: string, enabled = true) {
  return useQuery({
    queryKey: reviewKeys.detail(id),
    queryFn: () => reviewService.findById(id),
    enabled: !!id && enabled,
  });
}

export function useApproveReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reviewService.approve(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.lists() });
      queryClient.invalidateQueries({ queryKey: reviewKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: reviewKeys.summary(data.productId) });
      queryClient.invalidateQueries({ queryKey: ['marketing-summary'] });
    },
  });
}

export function useRejectReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reviewService.reject(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.lists() });
      queryClient.invalidateQueries({ queryKey: reviewKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: reviewKeys.summary(data.productId) });
      queryClient.invalidateQueries({ queryKey: ['marketing-summary'] });
    },
  });
}

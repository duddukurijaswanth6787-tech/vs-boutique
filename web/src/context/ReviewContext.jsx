import { createContext, useCallback, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProductReviews, getProductReviewSummary, createProductReview, updateProductReview, deleteProductReview } from '../services/api';

export const ReviewContext = createContext();

export function ReviewProvider({ children }) {
  const queryClient = useQueryClient();

  const value = {
    useReviews: (productId) => {
      const { data: reviews = [], isLoading: reviewsLoading, error: reviewsError } = useQuery({
        queryKey: ['product-reviews', productId],
        queryFn: () => getProductReviews(productId),
        enabled: !!productId,
      });

      const { data: summary, isLoading: summaryLoading } = useQuery({
        queryKey: ['product-review-summary', productId],
        queryFn: () => getProductReviewSummary(productId),
        enabled: !!productId,
      });

      const addMutation = useMutation({
        mutationFn: (data) => createProductReview(productId, data),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
          queryClient.invalidateQueries({ queryKey: ['product-review-summary', productId] });
          queryClient.invalidateQueries({ queryKey: ['product', productId] });
        },
      });

      const editMutation = useMutation({
        mutationFn: ({ reviewId, data }) => updateProductReview(productId, reviewId, data),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
          queryClient.invalidateQueries({ queryKey: ['product-review-summary', productId] });
          queryClient.invalidateQueries({ queryKey: ['product', productId] });
        },
      });

      const removeMutation = useMutation({
        mutationFn: (reviewId) => deleteProductReview(productId, reviewId),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
          queryClient.invalidateQueries({ queryKey: ['product-review-summary', productId] });
          queryClient.invalidateQueries({ queryKey: ['product', productId] });
        },
      });

      const refresh = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
        queryClient.invalidateQueries({ queryKey: ['product-review-summary', productId] });
      }, [queryClient, productId]);

      return {
        reviews,
        summary,
        loading: reviewsLoading || summaryLoading,
        error: reviewsError,
        refresh,
        addReview: addMutation.mutateAsync,
        editReview: editMutation.mutateAsync,
        removeReview: removeMutation.mutateAsync,
        isAdding: addMutation.isPending,
        isEditing: editMutation.isPending,
        isRemoving: removeMutation.isPending,
        addError: addMutation.error,
        editError: editMutation.error,
        removeError: removeMutation.error,
      };
    },
  };

  return (
    <ReviewContext.Provider value={value}>
      {children}
    </ReviewContext.Provider>
  );
}

export function useReview() {
  const ctx = useContext(ReviewContext);
  if (!ctx) throw new Error('useReview must be used within ReviewProvider');
  return ctx;
}

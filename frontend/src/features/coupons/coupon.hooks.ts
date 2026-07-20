import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { couponService } from './coupon.service';
import { CouponQueryDto, CreateCouponDto, UpdateCouponDto, ApplyCouponDto } from './coupon.types';

export const couponKeys = {
  all: ['coupons'] as const,
  lists: () => [...couponKeys.all, 'list'] as const,
  list: (query: CouponQueryDto) => [...couponKeys.lists(), query] as const,
  details: () => [...couponKeys.all, 'detail'] as const,
  detail: (id: string) => [...couponKeys.details(), id] as const,
};

export function useCoupons(query: CouponQueryDto = {}) {
  return useQuery({
    queryKey: couponKeys.list(query),
    queryFn: () => couponService.findAll(query),
  });
}

export function useCoupon(id: string, enabled = true) {
  return useQuery({
    queryKey: couponKeys.detail(id),
    queryFn: () => couponService.findById(id),
    enabled: !!id && enabled,
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCouponDto) => couponService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: couponKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['marketing-summary'] });
    },
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCouponDto }) =>
      couponService.update(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: couponKeys.lists() });
      queryClient.invalidateQueries({ queryKey: couponKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: ['marketing-summary'] });
    },
  });
}

export function useApplyCoupon() {
  return useMutation({
    mutationFn: (dto: ApplyCouponDto) => couponService.apply(dto),
  });
}

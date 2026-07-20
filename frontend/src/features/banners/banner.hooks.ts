import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { bannerService } from './banner.service';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { BannerQueryDto, CreateBannerDto, UpdateBannerDto } from './banner.types';

export const bannerKeys = {
  all: ['banners'] as const,
  lists: () => [...bannerKeys.all, 'list'] as const,
  list: (query: BannerQueryDto) => [...bannerKeys.lists(), query] as const,
  details: () => [...bannerKeys.all, 'detail'] as const,
  detail: (id: string) => [...bannerKeys.details(), id] as const,
};

export function useBanners(query: BannerQueryDto = {}) {
  return useQuery({
    queryKey: bannerKeys.list(query),
    queryFn: () => bannerService.findBanners(query),
  });
}

export function useBanner(id: string, enabled = true) {
  return useQuery({
    queryKey: bannerKeys.detail(id),
    queryFn: () => bannerService.findById(id),
    enabled: !!id && enabled,
  });
}

export function useCreateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateBannerDto) => bannerService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bannerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['marketing-summary'] });
    },
  });
}

export function useUpdateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateBannerDto }) =>
      bannerService.update(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: bannerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bannerKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: ['marketing-summary'] });
    },
  });
}

export function useDeleteBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bannerService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: bannerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bannerKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ['marketing-summary'] });
    },
  });
}

export function useCloneBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bannerService.clone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bannerKeys.all });
      toast.success('Banner cloned');
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err) || 'Failed to clone banner');
    },
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reelService } from './reel.service';
import {
  ReelQueryDto,
  CreateReelDto,
  UpdateReelDto,
  UpdateReelStatusDto,
  ReorderReelsDto,
  AttachProductsDto,
  UploadUrlDto,
} from './reel.types';
import { toast } from 'sonner';

export const reelKeys = {
  all: ['reels'] as const,
  lists: () => [...reelKeys.all, 'list'] as const,
  list: (query: ReelQueryDto) => [...reelKeys.lists(), query] as const,
  details: () => [...reelKeys.all, 'detail'] as const,
  detail: (id: string) => [...reelKeys.details(), id] as const,
  analytics: (id: string) => [...reelKeys.all, 'analytics', id] as const,
};

export function useReels(query: ReelQueryDto) {
  return useQuery({
    queryKey: reelKeys.list(query),
    queryFn: () => reelService.findAll(query),
  });
}

export function useReel(id: string) {
  return useQuery({
    queryKey: reelKeys.detail(id),
    queryFn: () => reelService.findById(id),
    enabled: !!id,
  });
}

export function useCreateReel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateReelDto) => reelService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reelKeys.lists() });
      toast.success('Reel created');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateReel(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateReelDto) => reelService.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reelKeys.lists() });
      queryClient.invalidateQueries({ queryKey: reelKeys.detail(id) });
      toast.success('Reel updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteReel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reelService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reelKeys.lists() });
      toast.success('Reel deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCloneReel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reelService.clone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reelKeys.lists() });
      toast.success('Reel duplicated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateReelStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateReelStatusDto) => reelService.updateStatus(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reelKeys.lists() });
      queryClient.invalidateQueries({ queryKey: reelKeys.detail(id) });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useReorderReels() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: ReorderReelsDto) => reelService.reorder(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reelKeys.lists() });
      toast.success('Reels reordered');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useAttachProducts(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: AttachProductsDto) => reelService.attachProducts(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reelKeys.detail(id) });
      toast.success('Products attached');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRemoveProduct(reelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => reelService.removeProduct(reelId, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reelKeys.detail(reelId) });
      toast.success('Product removed');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useReelAnalytics(id: string) {
  return useQuery({
    queryKey: reelKeys.analytics(id),
    queryFn: () => reelService.getAnalytics(id),
    enabled: !!id,
  });
}

export function useGetUploadUrl() {
  return useMutation({
    mutationFn: (dto: UploadUrlDto) => reelService.getUploadUrl(dto),
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { brandService } from './brand.service';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { BrandQueryDto, CreateBrandDto, UpdateBrandDto } from './brand.types';

export const brandKeys = {
  all: ['brands'] as const,
  lists: () => [...brandKeys.all, 'list'] as const,
  list: (query: BrandQueryDto) => [...brandKeys.lists(), query] as const,
  details: () => [...brandKeys.all, 'detail'] as const,
  detail: (id: string) => [...brandKeys.details(), id] as const,
};

export function useBrands(query: BrandQueryDto = {}) {
  return useQuery({
    queryKey: brandKeys.list(query),
    queryFn: () => brandService.findAll(query),
  });
}

export function useBrand(id: string, enabled = true) {
  return useQuery({
    queryKey: brandKeys.detail(id),
    queryFn: () => brandService.findById(id),
    enabled: !!id && enabled,
  });
}

export function useCreateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateBrandDto) => brandService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandKeys.lists() });
    },
  });
}

export function useUpdateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateBrandDto }) =>
      brandService.update(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: brandKeys.all });
      queryClient.invalidateQueries({ queryKey: brandKeys.detail(data.id) });
    },
  });
}

export function useDeleteBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => brandService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: brandKeys.all });
      queryClient.invalidateQueries({ queryKey: brandKeys.detail(id) });
    },
  });
}

export function useRestoreBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => brandService.restore(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: brandKeys.all });
      queryClient.invalidateQueries({ queryKey: brandKeys.detail(data.id) });
    },
  });
}

export function useBulkBrands() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: { ids: string[]; action: string }) => brandService.bulk(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandKeys.all });
      toast.success('Bulk operation completed');
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err) || 'Bulk operation failed');
    },
  });
}

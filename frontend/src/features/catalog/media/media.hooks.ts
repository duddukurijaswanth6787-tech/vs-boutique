import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mediaService } from './media.service';
import { MediaQueryDto, CreateMediaDto, UpdateMediaDto, ReorderMediaDto } from './media.types';

export const mediaKeys = {
  all: ['media'] as const,
  lists: () => [...mediaKeys.all, 'list'] as const,
  list: (query: MediaQueryDto) => [...mediaKeys.lists(), query] as const,
  details: () => [...mediaKeys.all, 'detail'] as const,
  detail: (id: string) => [...mediaKeys.details(), id] as const,
};

export function useMediaList(query: MediaQueryDto = {}) {
  return useQuery({
    queryKey: mediaKeys.list(query),
    queryFn: () => mediaService.findAll(query),
    enabled: !!(query.productId || query.variantId),
  });
}

export function useCreateMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateMediaDto) => mediaService.create(dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['products', data.productId] });
    },
  });
}

export function useUpdateMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateMediaDto }) =>
      mediaService.update(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['products', data.productId] });
    },
  });
}

export function useDeleteMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, productId }: { id: string; productId: string }) => mediaService.delete(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['products', variables.productId] });
    },
  });
}

export function useSetPrimaryMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, productId }: { id: string; productId: string }) => mediaService.setPrimary(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['products', data.productId] });
    },
  });
}

export function useReorderMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ dto, productId }: { dto: ReorderMediaDto; productId: string }) => mediaService.reorder(dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['products', variables.productId] });
    },
  });
}

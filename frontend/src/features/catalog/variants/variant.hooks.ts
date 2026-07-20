import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { variantService } from './variant.service';
import { VariantQueryDto, CreateVariantDto, UpdateVariantDto, AssignAttributeValuesDto } from './variant.types';

export const variantKeys = {
  all: ['variants'] as const,
  lists: () => [...variantKeys.all, 'list'] as const,
  list: (query: VariantQueryDto) => [...variantKeys.lists(), query] as const,
  details: () => [...variantKeys.all, 'detail'] as const,
  detail: (id: string) => [...variantKeys.details(), id] as const,
};

export function useVariants(query: VariantQueryDto = {}) {
  return useQuery({
    queryKey: variantKeys.list(query),
    queryFn: () => variantService.findAll(query),
    enabled: !!(query.productId || query.status),
  });
}

export function useVariant(id: string, enabled = true) {
  return useQuery({
    queryKey: variantKeys.detail(id),
    queryFn: () => variantService.findById(id),
    enabled: !!id && enabled,
  });
}

export function useCreateVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateVariantDto) => variantService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: variantKeys.lists() });
      // Also invalidate product queries as product contains variant info
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateVariantDto }) =>
      variantService.update(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: variantKeys.lists() });
      queryClient.invalidateQueries({ queryKey: variantKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => variantService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: variantKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useActivateVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => variantService.activate(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: variantKeys.lists() });
      queryClient.invalidateQueries({ queryKey: variantKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeactivateVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => variantService.deactivate(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: variantKeys.lists() });
      queryClient.invalidateQueries({ queryKey: variantKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useSetDefaultVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => variantService.setDefault(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: variantKeys.lists() });
      queryClient.invalidateQueries({ queryKey: variantKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useAssignVariantAttributes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: AssignAttributeValuesDto }) =>
      variantService.assignAttributeValues(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: variantKeys.lists() });
      queryClient.invalidateQueries({ queryKey: variantKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

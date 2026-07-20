import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attributeService } from './attribute.service';
import {
  CreateAttributeGroupDto,
  UpdateAttributeGroupDto,
  AttributeGroupQueryDto,
  CreateAttributeDto,
  UpdateAttributeDto,
  AttributeQueryDto,
  CreateAttributeOptionDto,
  UpdateAttributeOptionDto,
  AttributeOptionQueryDto,
  CreateCategoryAttributeDto,
  UpdateCategoryAttributeDto,
} from './attribute.types';

export const attributeKeys = {
  all: ['attributes'] as const,
  groups: () => [...attributeKeys.all, 'groups'] as const,
  groupList: (query: AttributeGroupQueryDto) => [...attributeKeys.groups(), query] as const,
  groupDetail: (id: string) => [...attributeKeys.all, 'group-detail', id] as const,
  
  attributes: () => [...attributeKeys.all, 'items'] as const,
  attributeList: (query: AttributeQueryDto) => [...attributeKeys.attributes(), query] as const,
  attributeDetail: (id: string) => [...attributeKeys.all, 'item-detail', id] as const,

  options: () => [...attributeKeys.all, 'options'] as const,
  optionList: (query: AttributeOptionQueryDto) => [...attributeKeys.options(), query] as const,
  optionDetail: (id: string) => [...attributeKeys.all, 'option-detail', id] as const,

  categoryMappings: (categoryId: string) => [...attributeKeys.all, 'category-mappings', categoryId] as const,
};

// Groups
export function useAttributeGroups(query: AttributeGroupQueryDto = {}) {
  return useQuery({
    queryKey: attributeKeys.groupList(query),
    queryFn: () => attributeService.findAllGroups(query),
  });
}

export function useCreateAttributeGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAttributeGroupDto) => attributeService.createGroup(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attributeKeys.groups() });
    },
  });
}

export function useUpdateAttributeGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateAttributeGroupDto }) =>
      attributeService.updateGroup(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: attributeKeys.groups() });
      queryClient.invalidateQueries({ queryKey: attributeKeys.groupDetail(data.id) });
    },
  });
}

export function useDeleteAttributeGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => attributeService.deleteGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attributeKeys.groups() });
    },
  });
}

// Attributes
export function useAttributes(query: AttributeQueryDto = {}) {
  return useQuery({
    queryKey: attributeKeys.attributeList(query),
    queryFn: () => attributeService.findAllAttributes(query),
  });
}

export function useAttribute(id: string, enabled = true) {
  return useQuery({
    queryKey: attributeKeys.attributeDetail(id),
    queryFn: () => attributeService.findAttributeById(id),
    enabled: !!id && enabled,
  });
}

export function useCreateAttribute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAttributeDto) => attributeService.createAttribute(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attributeKeys.attributes() });
    },
  });
}

export function useUpdateAttribute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateAttributeDto }) =>
      attributeService.updateAttribute(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: attributeKeys.attributes() });
      queryClient.invalidateQueries({ queryKey: attributeKeys.attributeDetail(data.id) });
    },
  });
}

export function useDeleteAttribute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => attributeService.deleteAttribute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attributeKeys.attributes() });
    },
  });
}

// Options
export function useAttributeOptions(query: AttributeOptionQueryDto = {}) {
  return useQuery({
    queryKey: attributeKeys.optionList(query),
    queryFn: () => attributeService.findAllOptions(query),
  });
}

export function useCreateAttributeOption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAttributeOptionDto) => attributeService.createOption(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attributeKeys.options() });
    },
  });
}

export function useUpdateAttributeOption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateAttributeOptionDto }) =>
      attributeService.updateOption(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attributeKeys.options() });
    },
  });
}

export function useDeleteAttributeOption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => attributeService.deleteOption(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attributeKeys.options() });
    },
  });
}

// Category Mappings
export function useCategoryAttributes(categoryId: string) {
  return useQuery({
    queryKey: attributeKeys.categoryMappings(categoryId),
    queryFn: () => attributeService.findAllCategoryMappings(categoryId),
    enabled: !!categoryId,
  });
}

export function useCreateCategoryMapping() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCategoryAttributeDto) => attributeService.createCategoryMapping(dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: attributeKeys.categoryMappings(variables.categoryId) });
    },
  });
}

export function useDeleteCategoryMapping() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, attributeId }: { categoryId: string; attributeId: string }) =>
      attributeService.deleteCategoryMapping(categoryId, attributeId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: attributeKeys.categoryMappings(variables.categoryId) });
    },
  });
}

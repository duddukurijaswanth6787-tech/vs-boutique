import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cmsService } from './cms.service';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { CmsPageQueryDto, CreateCmsPageDto, UpdateCmsPageDto, CreateCmsSectionDto } from './cms.types';

export const cmsKeys = {
  all: ['cms'] as const,
  pages: () => [...cmsKeys.all, 'pages'] as const,
  pageList: (query: CmsPageQueryDto) => [...cmsKeys.pages(), 'list', query] as const,
  pageDetail: (slug: string) => [...cmsKeys.pages(), 'detail', slug] as const,
  sections: () => [...cmsKeys.all, 'sections'] as const,
};

export function useCmsPages(query: CmsPageQueryDto = {}) {
  return useQuery({
    queryKey: cmsKeys.pageList(query),
    queryFn: () => cmsService.findPages(query),
  });
}

export function useCmsPage(slug: string, enabled = true) {
  return useQuery({
    queryKey: cmsKeys.pageDetail(slug),
    queryFn: () => cmsService.findPageBySlug(slug),
    enabled: !!slug && enabled,
  });
}

export function useCreateCmsPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCmsPageDto) => cmsService.createPage(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cmsKeys.pages() });
      queryClient.invalidateQueries({ queryKey: ['marketing-summary'] });
    },
  });
}

export function useUpdateCmsPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCmsPageDto }) =>
      cmsService.updatePage(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: cmsKeys.pages() });
      queryClient.invalidateQueries({ queryKey: cmsKeys.pageDetail(data.slug) });
      queryClient.invalidateQueries({ queryKey: ['marketing-summary'] });
    },
  });
}

export function useCmsSections() {
  return useQuery({
    queryKey: cmsKeys.sections(),
    queryFn: () => cmsService.findSections(),
  });
}

export function useCreateCmsSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCmsSectionDto) => cmsService.createSection(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cmsKeys.sections() });
    },
  });
}

export function useCloneCmsPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cmsService.clonePage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cmsKeys.all });
      toast.success('Page cloned');
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err) || 'Failed to clone page');
    },
  });
}

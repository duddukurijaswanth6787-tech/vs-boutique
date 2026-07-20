import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { socialService } from './social.service';
import { AdminSocialQueryDto, CreateSocialPostDto, UpdateSocialPostDto, PostMediaDto, ProductTagDto, ResolveReportDto, AdminReportsQueryDto } from './social.types';

export const socialKeys = {
  all: ['social'] as const,
  posts: () => [...socialKeys.all, 'posts'] as const,
  postList: (query: AdminSocialQueryDto) => [...socialKeys.posts(), 'list', query] as const,
  postDetails: () => [...socialKeys.posts(), 'detail'] as const,
  postDetail: (id: string) => [...socialKeys.postDetails(), id] as const,
  reports: () => [...socialKeys.all, 'reports'] as const,
  reportList: (query: AdminReportsQueryDto) => [...socialKeys.reports(), 'list', query] as const,
};

export function useSocialPosts(query: AdminSocialQueryDto = {}) {
  return useQuery({
    queryKey: socialKeys.postList(query),
    queryFn: () => socialService.getPosts(query),
  });
}

export function useSocialPost(id: string, enabled = true) {
  return useQuery({
    queryKey: socialKeys.postDetail(id),
    queryFn: () => socialService.getPostById(id),
    enabled: !!id && enabled,
  });
}

export function useCreateSocialPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateSocialPostDto) => socialService.createPost(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialKeys.posts() });
    },
  });
}

export function useUpdateSocialPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateSocialPostDto }) =>
      socialService.updatePost(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: socialKeys.posts() });
      queryClient.invalidateQueries({ queryKey: socialKeys.postDetail(data.id) });
    },
  });
}

export function useUpdatePostStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      socialService.updateStatus(id, action),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: socialKeys.posts() });
      queryClient.invalidateQueries({ queryKey: socialKeys.postDetail(data.id) });
    },
  });
}

export function useAttachMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, media }: { id: string; media: PostMediaDto[] }) =>
      socialService.attachMedia(id, media),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: socialKeys.postDetail(variables.id) });
    },
  });
}

export function useTagProducts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, tags }: { id: string; tags: ProductTagDto[] }) =>
      socialService.tagProducts(id, tags),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: socialKeys.postDetail(variables.id) });
    },
  });
}

export function useDeleteSocialPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => socialService.deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialKeys.posts() });
    },
  });
}

export function useRestoreSocialPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => socialService.restorePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialKeys.posts() });
    },
  });
}

export function useSocialReports(query: AdminReportsQueryDto = {}) {
  return useQuery({
    queryKey: socialKeys.reportList(query),
    queryFn: () => socialService.getReports(query),
  });
}

export function useResolveReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ResolveReportDto }) =>
      socialService.resolveReport(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialKeys.reports() });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => socialService.deleteComment(commentId),
    onSuccess: () => {
      // Invalidate posts detail to update comment counts
      queryClient.invalidateQueries({ queryKey: socialKeys.posts() });
    },
  });
}

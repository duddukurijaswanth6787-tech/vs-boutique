import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';
import {
  SocialPostListResponse,
  SocialPostResponse,
  CreateSocialPostDto,
  UpdateSocialPostDto,
  AdminSocialQueryDto,
  PostMediaDto,
  ProductTagDto,
  SocialReportListResponse,
  SocialReportResponse,
  ResolveReportDto,
  AdminReportsQueryDto,
} from './social.types';

export const socialService = {
  getPosts: async (query: AdminSocialQueryDto = {}): Promise<SocialPostListResponse> => {
    const params: Record<string, string | number | boolean> = {};
    if (query.contentType) params.contentType = query.contentType;
    if (query.status) params.status = query.status;
    if (query.page) params.page = query.page;
    if (query.limit) params.limit = query.limit;

    const response = await apiClient.get<StandardResponse<SocialPostListResponse>>('/admin/social/posts', { params });
    return response.data.data!;
  },

  createPost: async (dto: CreateSocialPostDto): Promise<SocialPostResponse> => {
    const response = await apiClient.post<StandardResponse<SocialPostResponse>>('/admin/social/posts', dto);
    return response.data.data!;
  },

  getPostById: async (id: string): Promise<SocialPostResponse> => {
    const response = await apiClient.get<StandardResponse<SocialPostResponse>>(`/admin/social/posts/${id}`);
    return response.data.data!;
  },

  updatePost: async (id: string, dto: UpdateSocialPostDto): Promise<SocialPostResponse> => {
    const response = await apiClient.put<StandardResponse<SocialPostResponse>>(`/admin/social/posts/${id}`, dto);
    return response.data.data!;
  },

  updateStatus: async (id: string, action: string): Promise<SocialPostResponse> => {
    const response = await apiClient.put<StandardResponse<SocialPostResponse>>(`/admin/social/posts/${id}/status`, { action });
    return response.data.data!;
  },

  attachMedia: async (id: string, media: PostMediaDto[]): Promise<unknown> => {
    const response = await apiClient.put<StandardResponse<unknown>>(`/admin/social/posts/${id}/media`, media);
    return response.data.data!;
  },

  tagProducts: async (id: string, tags: ProductTagDto[]): Promise<unknown> => {
    const response = await apiClient.put<StandardResponse<unknown>>(`/admin/social/posts/${id}/products`, tags);
    return response.data.data!;
  },

  getUploadUrl: async (
    id: string,
    mediaType: 'IMAGE' | 'VIDEO',
    extension: string,
  ): Promise<{ uploadUrl: string; s3Key: string; url: string }> => {
    const response = await apiClient.post<StandardResponse<{ uploadUrl: string; s3Key: string; url: string }>>(
      `/admin/social/posts/${id}/upload-url`,
      { mediaType, extension }
    );
    return response.data.data!;
  },

  deletePost: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/social/posts/${id}`);
  },

  restorePost: async (id: string): Promise<void> => {
    await apiClient.post(`/admin/social/posts/${id}/restore`);
  },

  getReports: async (query: AdminReportsQueryDto = {}): Promise<SocialReportListResponse> => {
    const params: Record<string, string | number | boolean> = {};
    if (query.status) params.status = query.status;
    if (query.reason) params.reason = query.reason;
    if (query.postId) params.postId = query.postId;
    if (query.page) params.page = query.page;
    if (query.limit) params.limit = query.limit;

    const response = await apiClient.get<StandardResponse<SocialReportListResponse>>('/admin/social/reports', { params });
    return response.data.data!;
  },

  resolveReport: async (id: string, dto: ResolveReportDto): Promise<SocialReportResponse> => {
    const response = await apiClient.put<StandardResponse<SocialReportResponse>>(`/admin/social/reports/${id}`, dto);
    return response.data.data!;
  },

  deleteComment: async (commentId: string): Promise<void> => {
    await apiClient.delete(`/social/comments/${commentId}`);
  },
};

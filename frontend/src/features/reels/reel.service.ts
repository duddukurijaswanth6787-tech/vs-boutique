import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';
import axios from 'axios';
import {
  ReelListResponse,
  ReelResponse,
  CreateReelDto,
  UpdateReelDto,
  ReelQueryDto,
  UpdateReelStatusDto,
  ReorderReelsDto,
  AttachProductsDto,
  UploadUrlDto,
  UploadUrlResponse,
  ReelAnalyticsResponse,
} from './reel.types';

export const reelService = {
  findAll: async (query: ReelQueryDto = {}): Promise<ReelListResponse> => {
    const params: Record<string, string | number | boolean> = {};
    if (query.search) params.search = query.search;
    if (query.status) params.status = query.status;
    if (query.visibility) params.visibility = query.visibility;
    if (query.featured !== undefined) params.featured = query.featured;
    if (query.page) params.page = query.page;
    if (query.limit) params.limit = query.limit;
    if (query.sortBy) params.sortBy = query.sortBy;
    if (query.sortOrder) params.sortOrder = query.sortOrder;

    const response = await apiClient.get<StandardResponse<ReelListResponse>>('/admin/instagram-reels', { params });
    return response.data.data!;
  },

  findById: async (id: string): Promise<ReelResponse> => {
    const response = await apiClient.get<StandardResponse<ReelResponse>>(`/admin/instagram-reels/${id}`);
    return response.data.data!;
  },

  create: async (dto: CreateReelDto): Promise<ReelResponse> => {
    const response = await apiClient.post<StandardResponse<ReelResponse>>('/admin/instagram-reels', dto);
    return response.data.data!;
  },

  update: async (id: string, dto: UpdateReelDto): Promise<ReelResponse> => {
    const response = await apiClient.patch<StandardResponse<ReelResponse>>(`/admin/instagram-reels/${id}`, dto);
    return response.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/instagram-reels/${id}`);
  },

  clone: async (id: string): Promise<ReelResponse> => {
    const response = await apiClient.post<StandardResponse<ReelResponse>>(`/admin/instagram-reels/${id}/duplicate`);
    return response.data.data!;
  },

  updateStatus: async (id: string, dto: UpdateReelStatusDto): Promise<ReelResponse> => {
    const response = await apiClient.patch<StandardResponse<ReelResponse>>(`/admin/instagram-reels/${id}/status`, dto);
    return response.data.data!;
  },

  reorder: async (dto: ReorderReelsDto): Promise<void> => {
    await apiClient.patch('/admin/instagram-reels/reorder', dto);
  },

  attachProducts: async (id: string, dto: AttachProductsDto): Promise<ReelResponse> => {
    const response = await apiClient.post<StandardResponse<ReelResponse>>(`/admin/instagram-reels/${id}/products`, dto);
    return response.data.data!;
  },

  removeProduct: async (reelId: string, productId: string): Promise<ReelResponse> => {
    const response = await apiClient.delete<StandardResponse<ReelResponse>>(`/admin/instagram-reels/${reelId}/products/${productId}`);
    return response.data.data!;
  },

  getAnalytics: async (id: string): Promise<ReelAnalyticsResponse> => {
    const response = await apiClient.get<StandardResponse<ReelAnalyticsResponse>>(`/admin/instagram-reels/${id}/analytics`);
    return response.data.data!;
  },

  getUploadUrl: async (dto: UploadUrlDto): Promise<UploadUrlResponse> => {
    const response = await apiClient.post<StandardResponse<UploadUrlResponse>>('/admin/instagram-reels/upload-url', dto);
    return response.data.data!;
  },

  uploadToS3: async (uploadUrl: string, file: File, onProgress?: (pct: number) => void): Promise<void> => {
    await axios.put(uploadUrl, file, {
      headers: { 'Content-Type': file.type },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          onProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
        }
      },
    });
  },
};

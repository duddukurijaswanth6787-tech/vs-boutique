import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';
import axios from 'axios';
import {
  CreateMediaDto,
  UpdateMediaDto,
  MediaQueryDto,
  MediaResponse,
  MediaListResponse,
  ReorderMediaDto,
  UploadUrlResponse,
} from './media.types';

export const mediaService = {
  findAll: async (query: MediaQueryDto = {}): Promise<MediaListResponse> => {
    const params: Record<string, string | number | boolean> = {};
    if (query.productId) params.productId = query.productId;
    if (query.variantId) params.variantId = query.variantId;
    if (query.mediaType) params.mediaType = query.mediaType;
    if (query.page) params.page = query.page;
    if (query.limit) params.limit = query.limit;
    if (query.sortBy) params.sortBy = query.sortBy;
    if (query.sortOrder) params.sortOrder = query.sortOrder;

    const response = await apiClient.get<StandardResponse<MediaListResponse>>('/media', { params });
    return response.data.data!;
  },

  findById: async (id: string): Promise<MediaResponse> => {
    const response = await apiClient.get<StandardResponse<MediaResponse>>(`/media/${id}`);
    return response.data.data!;
  },

  create: async (dto: CreateMediaDto): Promise<MediaResponse> => {
    const response = await apiClient.post<StandardResponse<MediaResponse>>('/media', dto);
    return response.data.data!;
  },

  update: async (id: string, dto: UpdateMediaDto): Promise<MediaResponse> => {
    const response = await apiClient.patch<StandardResponse<MediaResponse>>(`/media/${id}`, dto);
    return response.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/media/${id}`);
  },

  restore: async (id: string): Promise<MediaResponse> => {
    const response = await apiClient.post<StandardResponse<MediaResponse>>(`/media/${id}/restore`);
    return response.data.data!;
  },

  setPrimary: async (id: string): Promise<MediaResponse> => {
    const response = await apiClient.post<StandardResponse<MediaResponse>>(`/media/${id}/set-primary`);
    return response.data.data!;
  },

  reorder: async (dto: ReorderMediaDto): Promise<{ updated: number }> => {
    const response = await apiClient.post<StandardResponse<{ updated: number }>>('/media/reorder', dto);
    return response.data.data!;
  },

  // S3 Orchestration upload method
  getUploadUrl: async (
    productId: string,
    mediaType: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | '360_IMAGE',
    extension: string,
  ): Promise<UploadUrlResponse> => {
    const response = await apiClient.post<StandardResponse<UploadUrlResponse>>('/media/upload-url', {
      productId,
      mediaType,
      extension,
    });
    return response.data.data!;
  },

  // Upload file binary to S3 directly via presigned URL
  uploadToS3: async (uploadUrl: string, file: File, onProgress?: (pct: number) => void): Promise<void> => {
    await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type,
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(pct);
        }
      },
    });
  },
};

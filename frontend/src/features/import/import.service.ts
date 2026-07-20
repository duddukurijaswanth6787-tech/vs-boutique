import { apiClient } from '@/lib/api/client';

export interface ImportPreviewResponse {
  totalRows: number;
  validRows: number;
  errorRows: number;
  preview: Record<string, unknown>[];
  errors: { row: number; message: string }[];
  columns: string[];
}

export interface ImportResultResponse {
  imported: number;
  skipped: number;
  failed: number;
  errors: { row?: number; message: string }[];
  entity: string;
  createdAt: Date;
}

export const importService = {
  preview: async (entity: string, file: File): Promise<ImportPreviewResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(`/import/preview/${entity}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data!;
  },
  confirm: async (entity: string, rows: Record<string, unknown>[]): Promise<ImportResultResponse> => {
    const response = await apiClient.post(`/import/confirm/${entity}`, { rows, entity });
    return response.data.data!;
  },
  getHistory: async (): Promise<ImportResultResponse[]> => {
    const response = await apiClient.get('/import/history');
    return response.data.data!;
  },
};

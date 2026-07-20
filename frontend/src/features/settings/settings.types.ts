export interface SettingResponse {
  id: string;
  key: string;
  value: string;
  type: string;
  group?: string;
  description?: string;
  createdAt: string;
}

export interface CreateSettingDto {
  key: string;
  value: string;
  type?: string;
  group?: string;
  description?: string;
}

export interface UpdateSettingDto {
  value: string;
  description?: string;
}

export interface SettingQueryDto {
  group?: string;
  page?: number;
  limit?: number;
}

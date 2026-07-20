export interface CreateCampaignDto {
  name: string;
  description?: string;
  type: string;
  channel: string;
  subject?: string;
  content?: string;
  audience?: string[];
  scheduledAt?: string;
}

export interface UpdateCampaignDto {
  name?: string;
  description?: string;
  type?: string;
  channel?: string;
  subject?: string;
  content?: string;
  audience?: string[];
  scheduledAt?: string;
}

export interface CampaignResponse {
  id: string;
  name: string;
  description?: string;
  type: string;
  channel: string;
  subject?: string;
  content?: string;
  status: string;
  audience?: unknown;
  sentCount: number;
  openCount: number;
  clickCount: number;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
}

export interface CampaignQueryDto {
  type?: string;
  channel?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface CampaignListResponse {
  data: CampaignResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

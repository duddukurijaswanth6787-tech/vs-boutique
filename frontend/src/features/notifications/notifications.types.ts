export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string | null;
}

export interface NotificationQueryDto {
  page?: number;
  limit?: number;
  isRead?: boolean;
  search?: string;
  type?: string;
}

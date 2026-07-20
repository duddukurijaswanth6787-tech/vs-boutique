import { apiClient } from '@/lib/api/client';
import { Notification, NotificationQueryDto } from './notifications.types';
import { StandardResponse, PaginatedResponse } from '@/types/api.types';

type ApiResponse<T> = StandardResponse<T>;

export const notificationsService = {
  async getNotifications(query?: NotificationQueryDto): Promise<PaginatedResponse<Notification>> {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<Notification>>>('/notifications', {
      params: query,
    });
    return res.data.data!;
  },

  async getUnreadCount(): Promise<number> {
    const res = await apiClient.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
    return res.data.data!.count;
  },

  async markAsRead(id: string): Promise<Notification> {
    const res = await apiClient.patch<ApiResponse<Notification>>(`/notifications/${id}/read`);
    return res.data.data!;
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.patch<ApiResponse<void>>('/notifications/read-all');
  },

  async deleteNotification(id: string): Promise<void> {
    await apiClient.delete(`/notifications/${id}`);
  },
};

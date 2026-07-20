import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsService } from './notifications.service';
import { NotificationQueryDto } from './notifications.types';

export function useNotifications(query?: NotificationQueryDto) {
  return useQuery({
    queryKey: ['notifications', query],
    queryFn: () => notificationsService.getNotifications(query),
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ['unread-notifications-count'],
    queryFn: () => notificationsService.getUnreadCount(),
    refetchInterval: 30000, // Safe background polling (30s)
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsService.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
    },
  });
}

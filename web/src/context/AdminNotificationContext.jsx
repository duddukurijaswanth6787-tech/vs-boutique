import { createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminNotifications,
  getAdminUnreadNotificationCount,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  deleteAdminNotification,
} from '../services/api';

const AdminNotificationContext = createContext(null);

export function AdminNotificationProvider({ children }) {
  const queryClient = useQueryClient();

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['adminNotifications'],
    queryFn: () => getAdminNotifications({ limit: 100 }),
    refetchInterval: 30000,
  });

  const { data: unreadData } = useQuery({
    queryKey: ['adminNotificationUnreadCount'],
    queryFn: getAdminUnreadNotificationCount,
    refetchInterval: 15000,
  });

  const markReadMutation = useMutation({
    mutationFn: markAdminNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['adminNotificationUnreadCount'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllAdminNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['adminNotificationUnreadCount'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['adminNotificationUnreadCount'] });
    },
  });

  const notifications = notificationsData?.notifications || [];
  const total = notificationsData?.total || 0;
  const unreadCount = unreadData?.count || 0;

  return (
    <AdminNotificationContext.Provider value={{
      notifications,
      total,
      unreadCount,
      loading: isLoading,
      markRead: (id) => markReadMutation.mutate(id),
      markAllRead: () => markAllReadMutation.mutate(),
      removeNotification: (id) => deleteMutation.mutate(id),
      refreshNotifications: () => {
        queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
        queryClient.invalidateQueries({ queryKey: ['adminNotificationUnreadCount'] });
      },
    }}>
      {children}
    </AdminNotificationContext.Provider>
  );
}

export function useAdminNotifications() {
  const ctx = useContext(AdminNotificationContext);
  if (!ctx) throw new Error('useAdminNotifications must be used within AdminNotificationProvider');
  return ctx;
}

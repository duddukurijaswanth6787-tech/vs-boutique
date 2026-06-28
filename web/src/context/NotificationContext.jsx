import { createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCustomerNotifications, getCustomerUnreadNotificationCount, markCustomerNotificationRead, markAllCustomerNotificationsRead, deleteCustomerNotification } from '../services/api';
import { useCustomerAuth } from './CustomerAuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useCustomerAuth();

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['customerNotifications', isAuthenticated],
    queryFn: () => getCustomerNotifications({ limit: 100 }),
    refetchInterval: isAuthenticated ? 30000 : false,
    enabled: isAuthenticated,
  });

  const { data: unreadData } = useQuery({
    queryKey: ['notificationUnreadCount', isAuthenticated],
    queryFn: getCustomerUnreadNotificationCount,
    refetchInterval: isAuthenticated ? 15000 : false,
    enabled: isAuthenticated,
  });

  const markReadMutation = useMutation({
    mutationFn: markCustomerNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['notificationUnreadCount'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllCustomerNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['notificationUnreadCount'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCustomerNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['notificationUnreadCount'] });
    },
  });

  const notifications = notificationsData?.notifications || [];
  const total = notificationsData?.total || 0;
  const unreadCount = unreadData?.count || 0;

  return (
    <NotificationContext.Provider value={{
      notifications,
      total,
      unreadCount,
      loading: isLoading,
      markRead: (id) => markReadMutation.mutate(id),
      markAllRead: () => markAllReadMutation.mutate(),
      removeNotification: (id) => deleteMutation.mutate(id),
      refreshNotifications: () => {
        queryClient.invalidateQueries({ queryKey: ['customerNotifications'] });
        queryClient.invalidateQueries({ queryKey: ['notificationUnreadCount'] });
      },
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}

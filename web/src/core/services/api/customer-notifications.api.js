import { customerApi } from './client.api.js';

export const getCustomerNotifications = async (params = {}) => {
  const response = await customerApi.get('/customer/notifications', { params });
  return response.data;
};

export const getCustomerUnreadNotificationCount = async () => {
  const response = await customerApi.get('/customer/notifications/unread-count');
  return response.data;
};

export const markCustomerNotificationRead = async (id) => {
  const response = await customerApi.patch(`/customer/notifications/${id}/read`);
  return response.data;
};

export const markAllCustomerNotificationsRead = async () => {
  const response = await customerApi.patch('/customer/notifications/read-all');
  return response.data;
};

export const deleteCustomerNotification = async (id) => {
  const response = await customerApi.delete(`/customer/notifications/${id}`);
  return response.data;
};

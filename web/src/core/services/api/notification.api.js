import { api } from './client.api.js';

export const getNotifications = async () => {
  const response = await api.get('/notifications');
  return response.data;
};

export const markNotificationRead = async (id) => {
  const response = await api.put(`/notifications/${id}/read`);
  return response.data;
};

export const broadcastNotification = async (notifData) => {
  const response = await api.post('/notifications/broadcast', notifData);
  return response.data;
};

export const getNotificationAnalytics = async () => {
  const response = await api.get('/notifications/admin/analytics');
  return response.data;
};

export const getNotificationTemplates = async () => {
  const response = await api.get('/notifications/templates');
  return response.data;
};

export const createNotificationTemplate = async (templateData) => {
  const response = await api.post('/notifications/templates', templateData);
  return response.data;
};

export const getNotificationCampaigns = async () => {
  const response = await api.get('/notifications/campaigns');
  return response.data;
};

export const createNotificationCampaign = async (campaignData) => {
  const response = await api.post('/notifications/campaigns', campaignData);
  return response.data;
};

export const getAdminNotifications = async (params = {}) => {
  const response = await api.get('/admin/notifications', { params });
  return response.data;
};

export const getAdminUnreadNotificationCount = async () => {
  const response = await api.get('/admin/notifications/unread-count');
  return response.data;
};

export const markAdminNotificationRead = async (id) => {
  const response = await api.patch(`/admin/notifications/${id}/read`);
  return response.data;
};

export const markAllAdminNotificationsRead = async () => {
  const response = await api.patch('/admin/notifications/read-all');
  return response.data;
};

export const deleteAdminNotification = async (id) => {
  const response = await api.delete(`/admin/notifications/${id}`);
  return response.data;
};

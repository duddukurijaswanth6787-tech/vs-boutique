import { api, customerApi } from './client.api.js';

export const getOrderTracking = async (orderId) => {
  const response = await api.get(`/owner/orders/${orderId}/tracking`);
  return response.data.data;
};

export const createOrderTracking = async (orderId, data) => {
  const response = await api.post(`/owner/orders/${orderId}/tracking`, data);
  return response.data.data;
};

export const updateTrackingStatus = async (orderId, data) => {
  const response = await api.put(`/owner/orders/${orderId}/tracking/status`, data);
  return response.data.data;
};

export const getCustomerOrderTracking = async (orderId) => {
  const response = await customerApi.get(`/orders/${orderId}/tracking`);
  return response.data.data;
};

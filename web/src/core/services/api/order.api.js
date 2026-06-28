import { api, customerApi } from './client.api.js';

export const getOrders = async () => {
  const response = await api.get('/orders');
  return response.data;
};

export const getOrderById = async (id) => {
  const response = await api.get(`/orders/${id}`);
  return response.data;
};

export const createOrder = async (orderData) => {
  const response = await api.post('/orders', orderData);
  return response.data;
};

export const updateOrderStatus = async (id, statusData) => {
  const response = await api.put(`/orders/${id}/status`, statusData);
  return response.data;
};

export const updateOrderPayment = async (id, paymentData) => {
  const response = await api.put(`/orders/${id}/payment`, paymentData);
  return response.data;
};

export const updateOrderMeasurements = async (id, measurements) => {
  const response = await api.put(`/orders/${id}/measurements`, measurements);
  return response.data;
};

export const getAdminCommerceOrders = async () => {
  const response = await api.get('/owner/orders');
  return response.data.data;
};

export const getAdminCommerceOrder = async (id) => {
  const response = await api.get(`/owner/orders/${id}`);
  return response.data.data;
};

export const confirmCommerceOrder = async (id) => {
  const response = await api.put(`/owner/orders/${id}/confirm`);
  return response.data.data;
};

export const packCommerceOrder = async (id) => {
  const response = await api.put(`/owner/orders/${id}/pack`);
  return response.data.data;
};

export const shipCommerceOrder = async (id) => {
  const response = await api.put(`/owner/orders/${id}/ship`);
  return response.data.data;
};

export const outForDeliveryCommerceOrder = async (id) => {
  const response = await api.put(`/owner/orders/${id}/out-for-delivery`);
  return response.data.data;
};

export const deliverCommerceOrder = async (id) => {
  const response = await api.put(`/owner/orders/${id}/deliver`);
  return response.data.data;
};

export const cancelCommerceOrder = async (id, note) => {
  const response = await api.put(`/owner/orders/${id}/cancel`, { note });
  return response.data.data;
};

// Customer Commerce Orders
export const getMyCommerceOrders = async () => {
  const response = await customerApi.get('/commerce-orders/my');
  return response.data.data;
};

export const getMyCommerceOrder = async (id) => {
  const response = await customerApi.get(`/commerce-orders/my/${id}`);
  return response.data.data;
};

export const customerCancelOrder = async (id, reason) => {
  const response = await customerApi.post(`/commerce-orders/${id}/cancel`, { reason });
  return response.data;
};

export const getOrderTimeline = async (id) => {
  const response = await customerApi.get(`/commerce-orders/${id}/timeline`);
  return response.data.data;
};

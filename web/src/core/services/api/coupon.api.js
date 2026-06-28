import { api, customerApi } from './client.api.js';

export const getAdminCoupons = async () => {
  const response = await api.get('/admin/coupons');
  return response.data.data;
};

export const getAdminCoupon = async (id) => {
  const response = await api.get(`/admin/coupons/${id}`);
  return response.data.data;
};

export const createAdminCoupon = async (data) => {
  const response = await api.post('/admin/coupons', data);
  return response.data.data;
};

export const updateAdminCoupon = async (id, data) => {
  const response = await api.put(`/admin/coupons/${id}`, data);
  return response.data.data;
};

export const toggleAdminCoupon = async (id) => {
  const response = await api.patch(`/admin/coupons/${id}/toggle`);
  return response.data.data;
};

export const deleteAdminCoupon = async (id) => {
  const response = await api.delete(`/admin/coupons/${id}`);
  return response.data;
};

export const getOwnerCoupons = async (params) => {
  const response = await api.get('/owner/coupons', { params });
  return response.data.data;
};

export const createOwnerCoupon = async (data) => {
  const response = await api.post('/owner/coupons', data);
  return response.data.data;
};

export const updateOwnerCoupon = async (id, data) => {
  const response = await api.put(`/owner/coupons/${id}`, data);
  return response.data.data;
};

export const toggleOwnerCoupon = async (id) => {
  const response = await api.patch(`/owner/coupons/${id}/toggle`);
  return response.data.data;
};

export const deleteOwnerCoupon = async (id) => {
  const response = await api.delete(`/owner/coupons/${id}`);
  return response.data.data;
};

export const validateCoupon = async (data) => {
  const response = await customerApi.post('/coupons/validate', data);
  return response.data.data;
};

import { api } from './client.api.js';

export const getCustomers = async (params) => {
  const response = await api.get('/admin/customers', { params });
  return response.data;
};

export const getCustomerProfile = async (id) => {
  const response = await api.get(`/admin/customers/${id}`);
  return response.data;
};

export const toggleCustomerBlock = async (id, status, reason) => {
  const response = await api.put(`/admin/customers/${id}/status`, { status, reason });
  return response.data;
};

export const exportCustomerData = async (id) => {
  const response = await api.get(`/admin/customers/${id}/export`);
  return response.data;
};

export const getCustomerAddresses = async (id) => {
  const response = await api.get(`/admin/customers/${id}/addresses`);
  return response.data;
};

export const addCustomerAddress = async (id, addressData) => {
  const response = await api.post(`/admin/customers/${id}/addresses`, addressData);
  return response.data;
};

export const updateCustomerAddress = async (id, addressId, addressData) => {
  const response = await api.put(`/admin/customers/${id}/addresses/${addressId}`, addressData);
  return response.data;
};

export const deleteCustomerAddress = async (id, addressId) => {
  const response = await api.delete(`/admin/customers/${id}/addresses/${addressId}`);
  return response.data;
};

import { customerApi } from './client.api.js';

export const getAddresses = async () => {
  const response = await customerApi.get('/shipping-addresses');
  return response.data.data;
};

export const createAddress = async (data) => {
  const response = await customerApi.post('/shipping-addresses', data);
  return response.data.data;
};

export const updateAddress = async (id, data) => {
  const response = await customerApi.put(`/shipping-addresses/${id}`, data);
  return response.data.data;
};

export const deleteAddress = async (id) => {
  const response = await customerApi.delete(`/shipping-addresses/${id}`);
  return response.data;
};

export const setDefaultAddress = async (id) => {
  const response = await customerApi.put(`/shipping-addresses/${id}/default`);
  return response.data.data;
};

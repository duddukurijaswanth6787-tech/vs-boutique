import { customerApi } from './client.api.js';

export const getCart = async () => {
  const response = await customerApi.get('/cart');
  return response.data.data || response.data;
};

export const addToCart = async (data) => {
  const response = await customerApi.post('/cart/add', data);
  return response.data;
};

export const updateCartItem = async (itemId, data) => {
  const response = await customerApi.put(`/cart/${itemId}`, data);
  return response.data;
};

export const removeCartItem = async (itemId) => {
  const response = await customerApi.delete(`/cart/${itemId}`);
  return response.data;
};

export const clearCart = async () => {
  const response = await customerApi.delete('/cart');
  return response.data;
};

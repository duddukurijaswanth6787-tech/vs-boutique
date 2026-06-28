import { customerApi } from './client.api.js';

export const validateCheckout = async () => {
  const response = await customerApi.post('/checkout/validate');
  return response.data;
};

export const createCommerceOrder = async (data) => {
  const response = await customerApi.post('/checkout/create-order', data);
  return response.data;
};

export const createPayment = async (data) => {
  const response = await customerApi.post('/checkout/create-payment', data);
  return response.data;
};

export const verifyPayment = async (data) => {
  const response = await customerApi.post('/checkout/verify-payment', data);
  return response.data;
};

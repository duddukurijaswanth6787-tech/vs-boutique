import { customerApi } from './client.api.js';

export const createReturnRequest = async (data) => {
  const response = await customerApi.post('/returns', data);
  return response.data.data;
};

export const getMyReturns = async () => {
  const response = await customerApi.get('/returns/my');
  return response.data.data;
};

export const getReturnDetails = async (id) => {
  const response = await customerApi.get(`/returns/${id}`);
  return response.data.data;
};

export const createExchangeRequest = async (data) => {
  const response = await customerApi.post('/exchanges', data);
  return response.data.data;
};

export const getMyExchanges = async () => {
  const response = await customerApi.get('/exchanges/my');
  return response.data.data;
};

export const getExchangeDetails = async (id) => {
  const response = await customerApi.get(`/exchanges/${id}`);
  return response.data.data;
};

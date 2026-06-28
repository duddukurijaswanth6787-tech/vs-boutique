import { customerApi } from './client.api.js';

export const getMyMeasurements = async () => {
  const response = await customerApi.get('/measurements/me');
  return response.data;
};

export const saveMyMeasurements = async (data) => {
  const response = await customerApi.put('/measurements/me', data);
  return response.data;
};

export const deleteMyMeasurements = async () => {
  const response = await customerApi.delete('/measurements/me');
  return response.data;
};

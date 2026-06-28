import { customerApi } from './client.api.js';

export const createTicket = async (data) => {
  const response = await customerApi.post('/tickets', data);
  return response.data;
};

import { api } from './client.api.js';

export const getAdminTickets = async (params) => {
  const response = await api.get('/tickets/admin', { params });
  return response.data;
};

export const getOwnerTickets = async () => {
  const response = await api.get('/tickets/owner');
  return response.data;
};

export const getCustomerTickets = async (userId) => {
  const response = await api.get('/tickets/customer', { params: { userId } });
  return response.data;
};

export const getTicketById = async (id) => {
  const response = await api.get(`/tickets/${id}`);
  return response.data;
};

export const getTicketMessages = async (id) => {
  const response = await api.get(`/tickets/${id}/messages`);
  return response.data;
};

export const createTicketMessage = async (id, messageData) => {
  const response = await api.post(`/tickets/${id}/messages`, messageData);
  return response.data;
};

export const getTicketNotes = async (id) => {
  const response = await api.get(`/tickets/${id}/notes`);
  return response.data;
};

export const createTicketNote = async (id, noteData) => {
  const response = await api.post(`/tickets/${id}/notes`, noteData);
  return response.data;
};

export const assignTicket = async (id, assignedAdminId) => {
  const response = await api.put(`/tickets/${id}/assign`, { assignedAdminId });
  return response.data;
};

export const updateTicketStatusText = async (id, status) => {
  const response = await api.put(`/tickets/${id}/status`, { status });
  return response.data;
};

export const getTicketAnalytics = async () => {
  const response = await api.get('/tickets/admin/analytics');
  return response.data;
};

import { api, customerApi } from './client.api.js';

export const getBookings = async (params) => {
  const response = await api.get('/bookings/admin', { params });
  return response.data;
};

export const getOwnerBookings = async (params) => {
  const response = await api.get('/bookings/owner', { params });
  return response.data;
};

export const getBookingStats = async () => {
  const response = await api.get('/bookings/stats');
  return response.data;
};

export const updateBookingStatus = async (id, status, note, orderId) => {
  const response = await api.put(`/bookings/${id}/status`, { status, note, orderId });
  return response.data;
};

export const rescheduleBooking = async (id, bookingDate, bookingTime, note) => {
  const response = await api.put(`/bookings/${id}/reschedule`, { bookingDate, bookingTime, note });
  return response.data;
};

export const assignBooking = async (id, assignedOwnerId) => {
  const response = await api.put(`/bookings/${id}/assign`, { assignedOwnerId });
  return response.data;
};

export const updateBookingNotes = async (id, notes) => {
  const response = await api.put(`/bookings/${id}/notes`, { notes });
  return response.data;
};

export const triggerReminder = async (id) => {
  const response = await api.post(`/bookings/${id}/remind`);
  return response.data;
};

export const getMyBookings = async () => {
  const response = await customerApi.get('/bookings/my');
  return response.data;
};

export const createBooking = async (data) => {
  const response = await customerApi.post('/bookings', data);
  return response.data;
};

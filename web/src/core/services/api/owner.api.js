import { api } from './client.api.js';

export const updateOwnerPermissions = async (ownerId, permissions) => {
  const response = await api.put(`/owners/${ownerId}/permissions`, { permissions });
  return response.data;
};

export const updateOwnerStatus = async (ownerId, status) => {
  const response = await api.put(`/owners/${ownerId}/status`, { status });
  return response.data;
};

export const sendPasswordResetLink = async (ownerId) => {
  const response = await api.post(`/owners/${ownerId}/send-reset-link`);
  return response.data;
};

export const getUnassignedOwners = async () => {
  const response = await api.get('/owners/unassigned');
  return response.data;
};

export const inviteOwner = async (inviteData) => {
  const response = await api.post('/owners/invite', inviteData);
  return response.data;
};

export const linkOwner = async (linkData) => {
  const response = await api.post('/owners/link', linkData);
  return response.data;
};

export const unlinkOwner = async (unlinkData) => {
  const response = await api.post('/owners/unlink', unlinkData);
  return response.data;
};

export const resendInvite = async (ownerId) => {
  const response = await api.post(`/owners/${ownerId}/resend-invite`);
  return response.data;
};

export const setPassword = async (setData) => {
  const response = await api.post('/auth/set-password', setData);
  return response.data;
};

export const resetPassword = async (token, password) => {
  const response = await api.post(`/auth/reset-password/${token}`, { password });
  return response.data;
};

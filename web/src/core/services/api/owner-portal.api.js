import { api } from './client.api.js';

export const getOwnerDashboard = async () => {
  const response = await api.get('/owner/dashboard');
  return response.data;
};

// Fetch current owner's fresh profile + permissions from DB (bypasses stale localStorage)
export const getOwnerProfile = async () => {
  const response = await api.get('/owner/me');
  return response.data;
};

export const getOwnerBoutique = async () => {
  const response = await api.get('/owner/boutique');
  return response.data;
};

export const updateOwnerBoutique = async (boutiqueData) => {
  const response = await api.put('/owner/boutique', boutiqueData);
  return response.data;
};

export const updateOwnerServices = async (serviceData) => {
  const response = await api.put('/owner/services', serviceData);
  return response.data;
};

export const updateOwnerGallery = async (galleryData) => {
  const response = await api.put('/owner/gallery', galleryData);
  return response.data;
};

export const updateOwnerMedia = async (mediaData) => {
  const response = await api.put('/owner/media', mediaData);
  return response.data;
};

export const getDesigns = async () => {
  const response = await api.get('/designs');
  return response.data;
};

export const createDesign = async (designData) => {
  const response = await api.post('/designs', designData);
  return response.data;
};

export const updateDesign = async (id, designData) => {
  const response = await api.put(`/designs/${id}`, designData);
  return response.data;
};

export const deleteDesign = async (id) => {
  const response = await api.delete(`/designs/${id}`);
  return response.data;
};

export const getOwnerStaff = async () => {
  const response = await api.get('/owner/staff');
  return response.data;
};

export const changeOwnerPassword = async (currentPassword, newPassword) => {
  const response = await api.post('/owner/change-password', { currentPassword, newPassword });
  return response.data;
};

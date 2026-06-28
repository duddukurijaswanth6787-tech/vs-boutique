import { api } from './client.api.js';

export const getBoutiques = async () => {
  const response = await api.get('/boutiques');
  return response.data;
};

export const getPublicBoutiques = async () => {
  const response = await api.get('/boutiques/public');
  return response.data;
};

export const getBoutiqueDetails = async (id) => {
  const response = await api.get(`/boutiques/${id}/details`);
  return response.data;
};

export const getDashboardStats = async () => {
  const response = await api.get('/dashboard/stats');
  return response.data;
};

export const addBoutique = async (boutiqueData) => {
  const response = await api.post('/boutiques/add', boutiqueData);
  return response.data;
};

export const updateBoutique = async (id, boutiqueData) => {
  const response = await api.put(`/boutiques/${id}`, boutiqueData);
  return response.data;
};

export const updateBoutiqueStatus = async (id, statusData) => {
  const response = await api.put(`/boutiques/${id}/status`, statusData);
  return response.data;
};

export const deleteBoutique = async (id, adminPassword) => {
  const response = await api.delete(`/boutiques/${id}`, {
    data: { adminPassword }
  });
  return response.data;
};

export const uploadImage = async (file, type = 'gallery') => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await api.post(`/upload?type=${encodeURIComponent(type)}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const data = response.data;
  if (!data?.success || !data?.url) {
    const err = new Error(data?.message || 'Upload failed');
    err.response = response;
    throw err;
  }
  console.log('Uploaded URL:', data.url);
  return data;
};

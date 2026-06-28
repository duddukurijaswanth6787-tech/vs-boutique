import { api } from './client.api.js';

export const getAdminCategories = async () => {
  const response = await api.get('/categories/admin');
  return response.data.data;
};

export const getActiveCategories = async () => {
  const response = await api.get('/categories');
  return response.data.data;
};

export const getCategory = async (id) => {
  const response = await api.get(`/categories/${id}`);
  return response.data.data;
};

export const createCategory = async (data) => {
  const response = await api.post('/categories', data);
  return response.data.data;
};

export const updateCategory = async (id, data) => {
  const response = await api.put(`/categories/${id}`, data);
  return response.data.data;
};

export const deleteCategory = async (id, adminPassword) => {
  const response = await api.delete(`/categories/${id}`, { data: { adminPassword } });
  return response.data;
};

export const toggleCategory = async (id) => {
  const response = await api.put(`/categories/${id}/toggle`);
  return response.data.data;
};

export const createSubCategory = async (categoryId, data) => {
  const response = await api.post(`/categories/${categoryId}/subcategories`, data);
  return response.data.data;
};

export const updateSubCategory = async (id, data) => {
  const response = await api.put(`/categories/subcategories/${id}`, data);
  return response.data.data;
};

export const deleteSubCategory = async (id, adminPassword) => {
  const response = await api.delete(`/categories/subcategories/${id}`, { data: { adminPassword } });
  return response.data;
};

export const toggleSubCategory = async (id) => {
  const response = await api.put(`/categories/subcategories/${id}/toggle`);
  return response.data.data;
};

export const getAdminSubscriptions = async () => {
  const response = await api.get('/admin/subscriptions');
  return response.data;
};

export const updateAdminSubscription = async (updateData) => {
  const response = await api.put('/admin/subscriptions/update', updateData);
  return response.data;
};

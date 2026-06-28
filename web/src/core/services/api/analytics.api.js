import { api } from './client.api.js';

export const getMarketplaceInsights = async () => {
  const response = await api.get('/admin/marketplace-insights');
  return response.data;
};

export const getAdminRevenue = async () => {
  const response = await api.get('/admin/revenue');
  return response.data;
};

export const getAdminFraud = async () => {
  const response = await api.get('/admin/fraud');
  return response.data;
};

export const getAdminWishlists = async () => {
  const response = await api.get('/admin/wishlists');
  return response.data;
};

export const getAdminCommandCenter = async () => {
  const response = await api.get('/admin/command-center');
  return response.data;
};

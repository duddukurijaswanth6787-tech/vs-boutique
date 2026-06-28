import { api, customerApi } from './client.api.js';

export const getAllReviews = async (params) => {
  const response = await api.get('/reviews/admin', { params });
  return response.data;
};

export const getOwnerReviews = async (params) => {
  const response = await api.get('/reviews/owner', { params });
  return response.data;
};

export const getReviewStats = async () => {
  const response = await api.get('/reviews/stats');
  return response.data;
};

export const moderateReview = async (id, moderationStatus) => {
  const response = await api.put(`/reviews/${id}/moderation`, { moderationStatus });
  return response.data;
};

export const replyToReview = async (id, reply) => {
  const response = await api.put(`/reviews/${id}/reply`, { reply });
  return response.data;
};

export const getAdminProductReviews = async (params) => {
  const response = await api.get('/admin/product-reviews', { params });
  return response.data.data;
};

export const approveProductReview = async (productId, reviewId) => {
  const response = await api.put(`/admin/products/${productId}/reviews/${reviewId}/approve`);
  return response.data.data;
};

export const rejectProductReview = async (productId, reviewId) => {
  const response = await api.put(`/admin/products/${productId}/reviews/${reviewId}/reject`);
  return response.data.data;
};

export const hideProductReview = async (productId, reviewId) => {
  const response = await api.put(`/admin/products/${productId}/reviews/${reviewId}/hide`);
  return response.data.data;
};

export const adminDeleteProductReview = async (productId, reviewId) => {
  const response = await api.delete(`/admin/products/${productId}/reviews/${reviewId}`);
  return response.data;
};

export const getOwnerProductReviews = async (productId, params) => {
  const response = await api.get(`/owner/products/${productId}/reviews`, { params });
  return response.data.data;
};

export const replyToOwnerProductReview = async (productId, reviewId, data) => {
  const response = await api.post(`/owner/products/${productId}/reviews/${reviewId}/reply`, data);
  return response.data.data;
};

export const deleteOwnerProductReviewReply = async (productId, reviewId) => {
  const response = await api.delete(`/owner/products/${productId}/reviews/${reviewId}/reply`);
  return response.data.data;
};

export const getProductReviews = async (productId) => {
  const response = await api.get(`/products/${productId}/reviews`);
  return response.data.data;
};

export const getProductReviewSummary = async (productId) => {
  const response = await api.get(`/products/${productId}/reviews/summary`);
  return response.data.data;
};

export const createProductReview = async (productId, data) => {
  const response = await customerApi.post(`/products/${productId}/reviews`, data);
  return response.data.data;
};

export const updateProductReview = async (productId, reviewId, data) => {
  const response = await customerApi.put(`/products/${productId}/reviews/${reviewId}`, data);
  return response.data.data;
};

export const deleteProductReview = async (productId, reviewId) => {
  const response = await customerApi.delete(`/products/${productId}/reviews/${reviewId}`);
  return response.data;
};

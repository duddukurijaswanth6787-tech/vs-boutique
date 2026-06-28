import { api, customerApi } from './client.api.js';

export const getOwnerProducts = async (params) => {
    const response = await api.get('/owner/products', { params });
    return response.data;
};

export const getOwnerProduct = async (id) => {
    const response = await api.get(`/owner/products/${id}`);
    return response.data;
};

export const createOwnerProduct = async (data) => {
    const response = await api.post('/owner/products', data);
    return response.data;
};

export const updateOwnerProduct = async (id, data) => {
    const response = await api.put(`/owner/products/${id}`, data);
    return response.data;
};

export const deleteOwnerProduct = async (id) => {
    const response = await api.delete(`/owner/products/${id}`);
    return response.data;
};

export const getOwnerProductImages = async (productId) => {
    const response = await api.get(`/owner/products/${productId}/images`);
    return response.data;
};

export const addOwnerProductImage = async (productId, data) => {
    const response = await api.post(`/owner/products/${productId}/images`, data);
    return response.data;
};

export const deleteOwnerProductImage = async (productId, imageId) => {
    const response = await api.delete(`/owner/products/${productId}/images/${imageId}`);
    return response.data;
};

export const getOwnerBrands = async () => {
    const response = await api.get('/products/brands');
    return response.data;
};

export const createOwnerBrand = async (data) => {
    const response = await api.post('/products/brands', data);
    return response.data;
};

export const updateOwnerBrand = async (id, data) => {
    const response = await api.put(`/products/brands/${id}`, data);
    return response.data;
};

export const deleteOwnerBrand = async (id) => {
    const response = await api.delete(`/products/brands/${id}`);
    return response.data;
};

export const getOwnerTags = async () => {
    const response = await api.get('/products/tags');
    return response.data;
};

export const createOwnerTag = async (data) => {
    const response = await api.post('/products/tags', data);
    return response.data;
};

export const updateOwnerTag = async (id, data) => {
    const response = await api.put(`/products/tags/${id}`, data);
    return response.data;
};

export const deleteOwnerTag = async (id) => {
    const response = await api.delete(`/products/tags/${id}`);
    return response.data;
};

export const getProductVariants = async (productId) => {
    const response = await api.get(`/products/${productId}/variants`);
    return response.data;
};

export const createProductVariant = async (productId, data) => {
    const response = await api.post(`/products/${productId}/variants`, data);
    return response.data;
};

export const updateProductVariant = async (productId, variantId, data) => {
    const response = await api.put(`/products/${productId}/variants/${variantId}`, data);
    return response.data;
};

export const deleteProductVariant = async (productId, variantId) => {
    const response = await api.delete(`/products/${productId}/variants/${variantId}`);
    return response.data;
};

export const updateProductInventory = async (productId, variantId, data) => {
    const response = await api.put(`/products/${productId}/variants/${variantId}/inventory`, data);
    return response.data;
};

export const getProductInventoryLogs = async (productId) => {
    const response = await api.get(`/products/${productId}/inventory-logs`);
    return response.data;
};

export const getPublicProducts = async (params) => {
    const response = await api.get('/products/public/browse', { params });
    return response.data;
};

export const getPublicProduct = async (id) => {
    const response = await api.get(`/products/public/${id}`);
    return response.data;
};

export const getWishlist = async () => {
    const response = await customerApi.get('/products/wishlists/my');
    return response.data;
};

export const addToWishlist = async (productId) => {
    const response = await customerApi.post(`/products/wishlists/${productId}`);
    return response.data;
};

export const removeFromWishlist = async (productId) => {
    const response = await customerApi.delete(`/products/wishlists/${productId}`);
    return response.data;
};

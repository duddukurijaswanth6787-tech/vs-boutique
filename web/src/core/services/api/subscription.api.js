import { api } from './client.api.js';

export const getOwnerSubscription = async () => {
  const response = await api.get('/subscriptions/owner');
  return response.data;
};

export const upgradeSubscription = async (planName) => {
  const response = await api.post('/subscriptions/owner/upgrade', { planName });
  return response.data;
};

export const createSubscriptionPaymentOrder = async (planName) => {
  const response = await api.post('/subscriptions/owner/create-payment', { planName });
  return response.data;
};

export const verifySubscriptionPayment = async (paymentDetails) => {
  const response = await api.post('/subscriptions/owner/verify-payment', paymentDetails);
  return response.data;
};

export const cancelSubscription = async () => {
  const response = await api.post('/subscriptions/owner/cancel');
  return response.data;
};

export const getSubscriptionPlans = async (includeInactive = false) => {
  const response = await api.get(`/subscriptions/plans?includeInactive=${includeInactive}`);
  return response.data;
};

export const createSubscriptionPlan = async (planData) => {
  const response = await api.post('/subscriptions/plans', planData);
  return response.data;
};

export const updateSubscriptionPlan = async (id, planData) => {
  const response = await api.put(`/subscriptions/plans/${id}`, planData);
  return response.data;
};

export const cloneSubscriptionPlan = async (id, cloneData) => {
  const response = await api.post(`/subscriptions/plans/${id}/clone`, cloneData);
  return response.data;
};

export const deleteSubscriptionPlan = async (id) => {
  const response = await api.delete(`/subscriptions/plans/${id}`);
  return response.data;
};

export const requestCustomPlan = async (requestData) => {
  const response = await api.post('/subscriptions/owner/request-custom', requestData);
  return response.data;
};

export const getOwnerCustomPlanRequests = async () => {
  const response = await api.get('/subscriptions/owner/requests');
  return response.data;
};

export const getCustomPlanRequests = async () => {
  const response = await api.get('/subscriptions/admin/requests');
  return response.data;
};

export const updateCustomPlanRequest = async (id, status) => {
  const response = await api.put(`/subscriptions/admin/requests/${id}`, { status });
  return response.data;
};

export const getAdminSubscriptionAnalytics = async () => {
  const response = await api.get('/subscriptions/admin/analytics');
  return response.data;
};

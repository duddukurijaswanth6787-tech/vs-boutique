import { api } from './client.api.js';

export const getAllPayments = async (params) => {
  const response = await api.get('/payments', { params });
  return response.data;
};

export const getPaymentReports = async () => {
  const response = await api.get('/payments/reports');
  return response.data;
};

export const refundPayment = async (refundData) => {
  const response = await api.post('/payments/refund', refundData);
  return response.data;
};

export const processPayout = async (paymentIds) => {
  const response = await api.post('/payments/payout', { paymentIds });
  return response.data;
};

export const getPlatformCommissionSettings = async () => {
  const response = await api.get('/payouts/commission-settings');
  return response.data;
};

export const updatePlatformCommissionSettings = async (settingsData) => {
  const response = await api.put('/payouts/commission-settings', settingsData);
  return response.data;
};

export const setBoutiqueCommissionOverride = async (boutiqueId, commissionRate) => {
  const response = await api.put(`/payouts/boutiques/${boutiqueId}/commission`, { commissionRate });
  return response.data;
};

export const getAdminPayouts = async (params) => {
  const response = await api.get('/payouts/admin', { params });
  return response.data;
};

export const getOwnerPayouts = async () => {
  const response = await api.get('/payouts/owner');
  return response.data;
};

export const generatePayout = async (payoutData) => {
  const response = await api.post('/payouts/admin/generate', payoutData);
  return response.data;
};

export const updatePayoutStatus = async (id, statusData) => {
  const response = await api.put(`/payouts/admin/${id}/status`, statusData);
  return response.data;
};

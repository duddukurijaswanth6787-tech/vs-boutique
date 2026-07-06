const API_BASE = '/api/v1/cms/partners';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Request failed: ${res.status}`);
  return data;
}

export function getPartners() { return request('/'); }
export function getPartnerOverview() { return request('/overview'); }
export function getPartner(id) { return request(`/${id}`); }
export function createPartner(data) { return request('/', { method: 'POST', body: JSON.stringify(data) }); }
export function updatePartner(id, data) { return request(`/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
export function deletePartner(id) { return request(`/${id}`, { method: 'DELETE' }); }
export function getPartnerAnalytics(id) { return request(`/${id}/analytics`); }
export function getPartnerHealth(id) { return request(`/${id}/health`); }
export function getPartnerInfrastructure(id) { return request(`/${id}/infrastructure`); }
export function getPartnerDeployments(id) { return request(`/${id}/deployments`); }
export function getPartnerCompliance(id) { return request(`/${id}/compliance`); }
export function getPartnerMonitoring(id) { return request(`/${id}/monitoring`); }
export function getPartnerMarketplace(id) { return request(`/${id}/marketplace`); }
export function getBrandKits() { return request('/branding/kits'); }
export function createBrandKit(data) { return request('/branding/kits', { method: 'POST', body: JSON.stringify(data) }); }
export function updateBrandKit(kitId, data) { return request(`/branding/kits/${kitId}`, { method: 'PUT', body: JSON.stringify(data) }); }
export function deleteBrandKit(kitId) { return request(`/branding/kits/${kitId}`, { method: 'DELETE' }); }
export function getBrandingConfig() { return request('/branding/config'); }
export function updateBrandingConfig(data) { return request('/branding/config', { method: 'PUT', body: JSON.stringify(data) }); }
export function getPartnerTheme(businessId) { return request(`/themes/${businessId}`); }
export function updatePartnerTheme(businessId, data) { return request(`/themes/${businessId}`, { method: 'PUT', body: JSON.stringify(data) }); }
export function getAgencies() { return request('/agencies'); }
export function createAgency(data) { return request('/agencies', { method: 'POST', body: JSON.stringify(data) }); }
export function getResellers() { return request('/resellers'); }
export function createReseller(data) { return request('/resellers', { method: 'POST', body: JSON.stringify(data) }); }
export function getFranchises() { return request('/franchises'); }
export function createFranchise(data) { return request('/franchises', { method: 'POST', body: JSON.stringify(data) }); }
export function getOEMs() { return request('/oem'); }
export function createOEM(data) { return request('/oem', { method: 'POST', body: JSON.stringify(data) }); }
export function getLicenses() { return request('/licenses'); }
export function createLicense(data) { return request('/licenses', { method: 'POST', body: JSON.stringify(data) }); }
export function getPackages() { return request('/packages'); }
export function getPartnerRevenueAnalytics() { return request('/analytics/revenue'); }
export function getPartnerGrowthAnalytics() { return request('/analytics/growth'); }
export function initializePartnerDefaults() { return request('/initialize', { method: 'POST' }); }
export function refreshPartnerCache() { return request('/refresh', { method: 'POST' }); }

const API_BASE = '/api/v1/cms/customer-success';

function getToken() {
  return localStorage.getItem('vs_auth_token');
}

async function request(url, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
    ...options
  });
  if (!res.ok) { const err = await res.json().catch(() => ({ error: res.statusText })); throw new Error(err.error || 'Request failed'); }
  return res.json();
}

export const getBusinesses = (params) => request(`/?${new URLSearchParams(params)}`);
export const getBusinessOverview = (id) => request(`/${id}`);
export const getBusinessHealth = (id) => request(`/${id}/health`);
export const getBusinessTimeline = (id, params) => request(`/${id}/timeline?${new URLSearchParams(params || {})}`);
export const getBusinessRecommendations = (id) => request(`/${id}/recommendations`);
export const getSuccessAnalytics = () => request('/analytics');
export const refreshCache = () => request('/refresh', { method: 'POST' });

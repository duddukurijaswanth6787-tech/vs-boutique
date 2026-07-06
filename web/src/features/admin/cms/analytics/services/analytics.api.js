const API_BASE = '/api/v1/cms/analytics';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Request failed: ${res.status}`);
  return data;
}

export function getAnalyticsOverview() {
  return request('/');
}

export function getExecutiveDashboard() {
  return request('/executive');
}

export function getFinancialAnalytics() {
  return request('/financial');
}

export function getOperationsAnalytics() {
  return request('/operations');
}

export function getCustomerAnalytics() {
  return request('/customers');
}

export function getAIAnalytics() {
  return request('/ai');
}

export function getForecastAnalytics() {
  return request('/forecast');
}

export function getBenchmarkAnalytics() {
  return request('/benchmark');
}

export function getKpiScorecard() {
  return request('/kpis');
}

export function getReportsAnalytics() {
  return request('/reports');
}

export function getAnalyticsHealth() {
  return request('/health');
}

export function refreshAnalyticsCache() {
  return request('/refresh', { method: 'POST' });
}

export function initializeAnalyticsDefaults() {
  return request('/initialize', { method: 'POST' });
}

export function updateAnalyticsPreference(key, value, category) {
  return request('/preferences', {
    method: 'PUT',
    body: JSON.stringify({ key, value, category })
  });
}

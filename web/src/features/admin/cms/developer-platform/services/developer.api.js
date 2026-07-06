const API_BASE = '/api/v1/cms/developer';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Request failed: ${res.status}`);
  return data;
}

export function getDeveloperOverview() {
  return request('/');
}

export function getRegistry() {
  return request('/registry');
}

export function getOpenApi() {
  return request('/openapi');
}

export function getDocumentation() {
  return request('/documentation');
}

export function getSdk(language = 'javascript') {
  return request(`/sdk?language=${language}`);
}

export function getApiKeys() {
  return request('/apikeys');
}

export function createApiKey(data) {
  return request('/apikeys', { method: 'POST', body: JSON.stringify(data) });
}

export function updateApiKey(id, data) {
  return request(`/apikeys/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteApiKey(id) {
  return request(`/apikeys/${id}`, { method: 'DELETE' });
}

export function revokeApiKey(id) {
  return request(`/apikeys/${id}/revoke`, { method: 'POST' });
}

export function rotateApiKey(id) {
  return request(`/apikeys/${id}/rotate`, { method: 'POST' });
}

export function getWebhooks() {
  return request('/webhooks');
}

export function createWebhook(data) {
  return request('/webhooks', { method: 'POST', body: JSON.stringify(data) });
}

export function deleteWebhook(id) {
  return request(`/webhooks/${id}`, { method: 'DELETE' });
}

export function getDeveloperAnalytics() {
  return request('/analytics');
}

export function getHealth() {
  return request('/health');
}

export function refreshCache() {
  return request('/refresh', { method: 'POST' });
}

export function initializeRegistry() {
  return request('/initialize', { method: 'POST' });
}

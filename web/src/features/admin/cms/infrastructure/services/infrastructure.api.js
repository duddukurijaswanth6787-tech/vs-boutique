const API_BASE = '/api/v1/cms/infrastructure';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Request failed: ${res.status}`);
  return data;
}

export function getInfrastructureOverview() {
  return request('/overview');
}

export function getRegions() {
  return request('/regions');
}

export function createRegion(data) {
  return request('/regions', { method: 'POST', body: JSON.stringify(data) });
}

export function updateRegion(id, data) {
  return request(`/regions/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteRegion(id) {
  return request(`/regions/${id}`, { method: 'DELETE' });
}

export function getInfrastructureEnvironments() {
  return request('/environments');
}

export function getServers() {
  return request('/servers');
}

export function getStorage() {
  return request('/storage');
}

export function getDNS() {
  return request('/dns');
}

export function getSSL() {
  return request('/ssl');
}

export function getCapacity() {
  return request('/capacity');
}

export function getInfrastructureAnalytics() {
  return request('/analytics');
}

export function getInfrastructureHealth() {
  return request('/health');
}

export function refreshInfrastructureCache() {
  return request('/refresh', { method: 'POST' });
}

export function initializeInfrastructureDefaults() {
  return request('/initialize', { method: 'POST' });
}

export function updateInfrastructurePolicy(type, data) {
  return request(`/policies/${type}`, { method: 'PUT', body: JSON.stringify(data) });
}

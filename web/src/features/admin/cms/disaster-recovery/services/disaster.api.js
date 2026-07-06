const API_BASE = '/api/v1/cms/disaster';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Request failed: ${res.status}`);
  return data;
}

export function getDisasterOverview() {
  return request('/overview');
}

export function getBackups() {
  return request('/backups');
}

export function createBackup(data) {
  return request('/backup', { method: 'POST', body: JSON.stringify(data) });
}

export function simulateBackup() {
  return request('/simulate', { method: 'POST' });
}

export function getSnapshots() {
  return request('/snapshots');
}

export function getRecoveryItems() {
  return request('/recovery');
}

export function restoreDeployment(deploymentId) {
  return request('/restore', { method: 'POST', body: JSON.stringify({ deploymentId }) });
}

export function getRollbackTargets() {
  return request('/rollback', { method: 'POST', body: JSON.stringify({}) });
}

export function executeRollback(deploymentId) {
  return request('/rollback', { method: 'POST', body: JSON.stringify({ deploymentId }) });
}

export function getQueueMetrics() {
  return request('/jobs');
}

export function getDisasterAnalytics() {
  return request('/analytics');
}

export function getRecoveryHealth() {
  return request('/health');
}

export function getPolicies() {
  return request('/policies');
}

export function updatePolicy(type, data) {
  return request(`/policies/${type}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function getRetentionStatus() {
  return request('/retention/status');
}

export function initializeDefaults() {
  return request('/initialize', { method: 'POST' });
}

export function refreshDisasterCache() {
  return request('/refresh', { method: 'POST' });
}

export function getRestoreHistory(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/restore-history${qs ? '?' + qs : ''}`);
}

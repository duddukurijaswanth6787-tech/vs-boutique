const API_BASE = '/api/v1/cms/compliance';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Request failed: ${res.status}`);
  return data;
}

export function getComplianceOverview() {
  return request('/');
}

export function getAuditLogs(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/audit-logs${qs ? '?' + qs : ''}`);
}

export function getAuditSummary() {
  return request('/audit-summary');
}

export function getCrossModuleActivity() {
  return request('/cross-module');
}

export function getSecurityPosture() {
  return request('/security');
}

export function getRiskScore() {
  return request('/risk');
}

export function getPolicies() {
  return request('/policies');
}

export function updatePolicy(framework, data) {
  return request(`/policies/${framework}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function getFrameworks() {
  return request('/frameworks');
}

export function getRetentionConfig() {
  return request('/retention');
}

export function updateRetentionConfig(data) {
  return request('/retention', { method: 'PUT', body: JSON.stringify(data) });
}

export function getRetentionStatus() {
  return request('/retention/status');
}

export function getComplianceAnalytics() {
  return request('/analytics');
}

export function getComplianceSummary() {
  return request('/summary');
}

export function getComplianceHealth() {
  return request('/health');
}

export function refreshComplianceCache() {
  return request('/refresh', { method: 'POST' });
}

const API_BASE = '/api/v1/cms/devops';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Request failed: ${res.status}`);
  return data;
}

export function getDevOpsOverview() { return request('/'); }
export function getDevOpsDashboard() { return request('/overview'); }
export function getPipelines() { return request('/pipelines'); }
export function getReleases() { return request('/releases'); }
export function getBuilds() { return request('/builds'); }
export function getArtifacts() { return request('/artifacts'); }
export function getDeployments() { return request('/deployments'); }
export function getEnvironments() { return request('/environments'); }
export function getDevOpsAnalytics() { return request('/analytics'); }
export function getDevOpsHealth() { return request('/health'); }
export function runPipeline(definitionId) { return request('/pipeline/run', { method: 'POST', body: JSON.stringify({ definitionId }) }); }
export function pausePipeline(executionId) { return request('/pipeline/pause', { method: 'POST', body: JSON.stringify({ executionId }) }); }
export function resumePipeline(executionId) { return request('/pipeline/resume', { method: 'POST', body: JSON.stringify({ executionId }) }); }
export function cancelPipeline(executionId) { return request('/pipeline/cancel', { method: 'POST', body: JSON.stringify({ executionId }) }); }
export function createRelease(data) { return request('/release', { method: 'POST', body: JSON.stringify(data) }); }
export function executeRollback(deploymentId) { return request('/rollback', { method: 'POST', body: JSON.stringify({ deploymentId }) }); }
export function refreshDevOpsCache() { return request('/refresh', { method: 'POST' }); }
export function initializeDevOpsDefaults() { return request('/initialize', { method: 'POST' }); }

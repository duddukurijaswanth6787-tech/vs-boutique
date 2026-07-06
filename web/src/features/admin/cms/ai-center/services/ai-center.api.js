const BASE_URL = '/api/v1/cms/ai-center';

function getToken() {
  return localStorage.getItem('vs_auth_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Request failed with status ${response.status}`);
  }
  return response.json();
}

export const aiCenterApi = {
  // Providers
  getProviders: () => request('/providers'),
  getProvider: (id) => request(`/providers/${id}`),
  createProvider: (data) => request('/providers', { method: 'POST', body: JSON.stringify(data) }),
  updateProvider: (id, data) => request(`/providers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProvider: (id) => request(`/providers/${id}`, { method: 'DELETE' }),
  testProvider: (id) => request(`/providers/${id}/test`, { method: 'POST' }),
  checkAllProviders: () => request('/providers/check-all', { method: 'POST' }),
  getFallbackChain: () => request('/providers/fallback-chain'),

  // Agents
  getAgents: (params) => request(`/agents?${new URLSearchParams(params)}`),
  getAgent: (id) => request(`/agents/${id}`),
  updateAgent: (id, data) => request(`/agents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAgent: (id) => request(`/agents/${id}`, { method: 'DELETE' }),
  syncAgents: () => request('/agents/sync', { method: 'POST' }),
  getAgentSources: () => request('/agents/sources'),
  testAgent: (id) => request(`/agents/${id}/test`, { method: 'POST' }),

  // Workflows
  getWorkflows: () => request('/workflows'),
  getWorkflow: (id) => request(`/workflows/${id}`),
  createWorkflow: (data) => request('/workflows', { method: 'POST', body: JSON.stringify(data) }),
  updateWorkflow: (id, data) => request(`/workflows/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteWorkflow: (id) => request(`/workflows/${id}`, { method: 'DELETE' }),
  executeWorkflow: (id) => request(`/workflows/${id}/execute`, { method: 'POST' }),
  toggleWorkflow: (id, action) => request(`/workflows/${id}/toggle`, { method: 'POST', body: JSON.stringify({ action }) }),
  getEngineIntegrations: () => request('/workflows/integrations/engines'),

  // Executions
  getExecutions: (params) => request(`/executions?${new URLSearchParams(params)}`),
  getExecution: (id) => request(`/executions/${id}`),
  getExecutionLogs: (id) => request(`/executions/${id}/logs`),
  getExecutionSteps: (id) => request(`/executions/${id}/steps`),

  // Sessions
  getSessions: (params) => request(`/sessions?${new URLSearchParams(params)}`),

  // Usage
  getUsage: (params) => request(`/usage?${new URLSearchParams(params)}`),
  getUsageSummary: () => request('/usage/summary'),

  // Cost
  getCost: (params) => request(`/cost?${new URLSearchParams(params)}`),
  getCostSummary: () => request('/cost/summary'),

  // Health
  getHealth: () => request('/health'),
  runHealthCheck: () => request('/health/check', { method: 'POST' }),

  // Settings
  getSettings: (category) => request(`/settings${category ? `?category=${category}` : ''}`),
  saveSettings: (data) => request('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  initSettings: () => request('/settings/init', { method: 'POST' }),

  // Queue
  getQueue: () => request('/queue'),
  getJob: (queueName, jobId) => request(`/queue/${queueName}/jobs/${jobId}`),
  retryJob: (queueName, jobId) => request(`/queue/${queueName}/jobs/${jobId}/retry`, { method: 'POST' }),
  getQueueWorkers: () => request('/queue/workers'),

  // Analytics
  getDashboard: () => request('/analytics/dashboard'),
  clearAnalyticsCache: () => request('/analytics/clear-cache', { method: 'POST' })
};

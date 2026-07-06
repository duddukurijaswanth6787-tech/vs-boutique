const BASE_URL = '/api/v1/cms/workflows';

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

export const workflowApi = {
  discover: () => request('/'),
  getTemplates: () => request('/templates'),
  getTemplate: (slug) => request(`/templates/${slug}`),
  execute: (data) => request('/execute', { method: 'POST', body: JSON.stringify(data) }),
  getExecutions: (params) => request(`/executions?${new URLSearchParams(params)}`),
  getExecution: (id, type) => request(`/executions/${id}?type=${type}`),
  getAnalytics: () => request('/analytics'),
  clearCache: () => request('/clear-cache', { method: 'POST' }),
  init: () => request('/init', { method: 'POST' })
};

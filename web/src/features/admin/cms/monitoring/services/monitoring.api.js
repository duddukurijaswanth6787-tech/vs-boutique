const BASE_URL = '/api/v1/cms/monitoring';

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

export const monitoringApi = {
  getOverview: () => request('/overview'),
  getHealth: () => request('/health'),
  getPerformance: () => request('/performance'),
  getQueues: () => request('/queues'),
  getSecurity: () => request('/security'),
  getConfig: () => request('/config'),
  updateConfig: (data) => request('/config', { method: 'PUT', body: JSON.stringify(data) }),
  initialize: () => request('/initialize', { method: 'POST' }),
  emitAlert: (type, message, data) => request('/alert', { method: 'POST', body: JSON.stringify({ type, message, data }) }),
};

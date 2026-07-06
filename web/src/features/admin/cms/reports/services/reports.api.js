const BASE_URL = '/api/v1/cms/reports';

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

function buildQuery(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qs.set(k, v); });
  return qs.toString();
}

export const reportsApi = {
  list(params = {}) { return request(`?${buildQuery(params)}`); },
  get(id) { return request(`/${id}`); },
  generate(data) { return request('/generate', { method: 'POST', body: JSON.stringify(data) }); },
  regenerate(id) { return request(`/${id}/regenerate`, { method: 'POST' }); },
  delete(id) { return request(`/${id}`, { method: 'DELETE' }); },
  getStats() { return request('/stats'); },
  getTrends() { return request('/trends'); },
  getAnalytics(params = {}) { return request(`/analytics?${buildQuery(params)}`); },
  getSources() { return request('/sources'); },
  getHistory(id) { return request(`/${id}/history`); },
  getSection(id, sectionType) { return request(`/${id}/section/${sectionType}`); },
  exportReport(id, format = 'json') { return request(`/${id}/export`, { method: 'POST', body: JSON.stringify({ format }) }); },
  compare(reportId1, reportId2) { return request('/compare', { method: 'POST', body: JSON.stringify({ reportId1, reportId2 }) }); }
};

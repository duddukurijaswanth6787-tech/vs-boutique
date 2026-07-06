const BASE_URL = '/api/v1/cms/business-assignment';

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

export const assignmentApi = {
  list(params = {}) { return request(`?${buildQuery(params)}`); },
  get(id) { return request(`/${id}`); },
  getStats() { return request('/stats'); },
  getHistory(id) { return request(`/${id}/history`); },
  getConfig(id) { return request(`/${id}/config`); },
  getByBusiness(businessId) { return request(`/by-business/${businessId}`); },
  getByTemplate(templateId) { return request(`/by-template/${templateId}`); },
  findBusinesses(search) { return request(`/businesses?search=${encodeURIComponent(search)}`); },
  begin(data) { return request('/begin', { method: 'POST', body: JSON.stringify(data) }); },
  updateConfig(id, data) { return request(`/${id}/config`, { method: 'PUT', body: JSON.stringify(data) }); },
  validate(id) { return request(`/${id}/validate`, { method: 'POST' }); },
  deploy(id) { return request(`/${id}/deploy`, { method: 'POST' }); },
  activate(id) { return request(`/${id}/activate`, { method: 'POST' }); },
  suspend(id) { return request(`/${id}/suspend`, { method: 'POST' }); },
  archive(id) { return request(`/${id}/archive`, { method: 'POST' }); },
  rollback(id) { return request(`/${id}/rollback`, { method: 'POST' }); },
  delete(id) { return request(`/${id}`, { method: 'DELETE' }); },
  getDashboard() { return request('/dashboard'); },
  getJobs() { return request('/jobs'); },
  getJob(jobType, jobId) { return request(`/jobs/${jobType}/${jobId}`); },
  retryJob(jobType, jobId) { return request(`/jobs/${jobType}/${jobId}/retry`, { method: 'POST' }); },
  clearCache() { return request('/cache/clear', { method: 'POST' }); },
  recalculateAnalytics() { return request('/analytics/recalculate', { method: 'POST' }); }
};

const BASE_URL = '/api/v1/cms/templates';

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
  Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v); });
  return qs.toString();
}

export const templatesApi = {
  list(params = {}) { return request(`?${buildQuery(params)}`); },
  get(id) { return request(`/${id}`); },
  create(data) { return request('/', { method: 'POST', body: JSON.stringify(data) }); },
  update(id, data) { return request(`/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  delete(id) { return request(`/${id}`, { method: 'DELETE' }); },
  publishTemplate(id) { return request(`/${id}/publish`, { method: 'POST' }); },
  archiveTemplate(id) { return request(`/${id}/archive`, { method: 'POST' }); },
  deprecateTemplate(id) { return request(`/${id}/deprecate`, { method: 'POST' }); },
  getCategories() { return request('/categories'); },
  getTags() { return request('/tags'); },
  toggleFavorite(id) { return request(`/${id}/favorite`, { method: 'POST' }); },
  rateTemplate(id, rating, comment) { return request(`/${id}/rate`, { method: 'POST', body: JSON.stringify({ rating, comment }) }); },
  getVersions(id) { return request(`/${id}/versions`); },
  rollbackVersion(id, version) { return request(`/${id}/rollback`, { method: 'POST', body: JSON.stringify({ version }) }); },
  getFeatured() { return request('/featured'); },
  getLatest() { return request('/latest'); },
  getPopular() { return request('/popular'); },
  getByTier(tier) { return request(`/tier/${tier}`); },
  getAnalytics(params = {}) { return request(`/analytics?${buildQuery(params)}`); },
  assignToBusiness(id, data) { return request(`/${id}/assign`, { method: 'POST', body: JSON.stringify(data) }); },
  unassignFromBusiness(id, businessId) { return request(`/${id}/unassign`, { method: 'POST', body: JSON.stringify({ businessId }) }); },
  getBusinessAssignments(businessId) { return request(`/assignments/${businessId}`); },
  getPipelineStatus(id) { return request(`/${id}/pipeline`); },
  advancePipeline(id, data) { return request(`/${id}/pipeline`, { method: 'POST', body: JSON.stringify(data) }); },
  exportTemplate(id, format = 'json') { return request(`/${id}/export?format=${format}`); },
  importTemplate(data) { return request('/import', { method: 'POST', body: JSON.stringify(data) }); }
};

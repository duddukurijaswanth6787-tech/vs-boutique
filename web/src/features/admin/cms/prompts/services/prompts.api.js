const BASE_URL = '/api/v1/cms/prompts';

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

export const promptsApi = {
  list(params = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v); });
    return request(`?${qs.toString()}`);
  },
  get(id) { return request(`/${id}`); },
  create(data) { return request('/', { method: 'POST', body: JSON.stringify(data) }); },
  update(id, data) { return request(`/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  delete(id) { return request(`/${id}`, { method: 'DELETE' }); },
  clone(id) { return request(`/${id}/clone`, { method: 'POST' }); },
  render(id, variables = {}) { return request(`/${id}/render`, { method: 'POST', body: JSON.stringify({ variables }) }); },
  execute(id, { variables, builderId } = {}) { return request(`/${id}/execute`, { method: 'POST', body: JSON.stringify({ variables, builderId }) }); },
  favorite(id) { return request(`/${id}/favorite`, { method: 'POST' }); },
  rate(id, rating, comment) { return request(`/${id}/rate`, { method: 'POST', body: JSON.stringify({ rating, comment }) }); },
  exportPrompt(id, format = 'json') { return request(`/${id}/export?format=${format}`); },
  getVersions(id) { return request(`/${id}/versions`); },
  rollback(id, version) { return request(`/${id}/rollback`, { method: 'POST', body: JSON.stringify({ version }) }); },
  getAuditLogs(id) { return request(`/${id}/audit-logs`); },

  getCategories() { return request('/categories'); },
  getBuilders() { return request('/builders'); },
  getVariables() { return request('/variables'); },
  getTags() { return request('/tags'); },
  getHistory(promptId, page = 1) { return request(`/history?promptId=${promptId}&page=${page}`); },
  getAnalytics(params = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v); });
    return request(`/analytics?${qs.toString()}`);
  },
  getFavorites(page = 1) { return request(`/favorites?page=${page}`); },
  getRecent(page = 1) { return request(`/recent?page=${page}`); },
  getPopular(page = 1) { return request(`/popular?page=${page}`); },

  getCollections() { return request('/collections'); },
  createCollection(data) { return request('/collections', { method: 'POST', body: JSON.stringify(data) }); },
  addToCollection(collectionId, promptId, displayOrder) {
    return request(`/collections/${collectionId}/items`, { method: 'POST', body: JSON.stringify({ promptId, displayOrder }) });
  },
  removeFromCollection(collectionId, promptId) {
    return request(`/collections/${collectionId}/items/${promptId}`, { method: 'DELETE' });
  },

  importPrompt(data) { return request('/import', { method: 'POST', body: JSON.stringify(data) }); },

  // CMS Engine Integration
  getIntegrations(engine) { return request(`/integrations/${engine}`); },
  linkToReference(promptId, referenceType, referenceId) {
    return request('/integrations/link', { method: 'POST', body: JSON.stringify({ promptId, referenceType, referenceId }) });
  },
  unlinkFromReference(promptId) {
    return request('/integrations/unlink', { method: 'POST', body: JSON.stringify({ promptId }) });
  },
  getStandardsPrompts() { return request('/integrations/standards'); },
  getRequirementsPrompts() { return request('/integrations/requirements'); },
  getBlueprintsPrompts() { return request('/integrations/blueprints'); },
  getVerificationPrompts() { return request('/integrations/verification'); },
  getCertificationPrompts() { return request('/integrations/certification'); },
  getAIFixPrompts() { return request('/integrations/ai-fix'); },
  getDeploymentPrompts() { return request('/integrations/deployment'); }
};

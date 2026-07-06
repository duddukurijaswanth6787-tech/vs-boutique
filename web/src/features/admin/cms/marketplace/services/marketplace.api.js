const BASE_URL = '/api/v1/cms/marketplace';

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

export const marketplaceApi = {
  getAll: () => request('/'),
  getCategory: (category) => request(`/${category}`),
  updateCategory: (category, data) => request(`/${category}`, { method: 'PUT', body: JSON.stringify(data) }),
  initialize: () => request('/initialize', { method: 'POST' }),
  searchPackages: (params) => request(`/packages/search?${new URLSearchParams(params).toString()}`),
  getPackage: (slug) => request(`/packages/${slug}`),
  publishPackage: (data) => request('/packages/publish', { method: 'POST', body: JSON.stringify(data) }),
  approvePackage: (slug) => request(`/packages/${slug}/approve`, { method: 'POST' }),
  installPackage: (businessId, packageSlug, version) => request('/install', { method: 'POST', body: JSON.stringify({ businessId, packageSlug, version }) }),
  uninstallPackage: (businessId, packageId) => request('/uninstall', { method: 'POST', body: JSON.stringify({ businessId, packageId }) }),
  togglePackage: (businessId, packageId, isEnabled) => request('/toggle', { method: 'PUT', body: JSON.stringify({ businessId, packageId, isEnabled }) }),
  getInstalled: (businessId) => request(`/installed/${businessId}`),
  getDeveloperPackages: (publisherId) => request(`/developer/${publisherId}`),
};

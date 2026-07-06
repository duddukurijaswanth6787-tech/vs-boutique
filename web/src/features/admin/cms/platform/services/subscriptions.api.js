const BASE_URL = '/api/v1/cms/subscriptions';

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

export const subscriptionsApi = {
  getAll: () => request('/'),
  getCategory: (category) => request(`/${category}`),
  updateCategory: (category, data) => request(`/${category}`, { method: 'PUT', body: JSON.stringify(data) }),
  initialize: () => request('/initialize', { method: 'POST' }),
};

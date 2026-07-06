const API_BASE = '/api/v1/cms/notifications';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Request failed: ${res.status}`);
  return data;
}

export function getNotificationOverview() { return request('/'); }
export function getNotificationDashboard() { return request('/overview'); }
export function getRecentNotifications(limit) { return request(`/recent?limit=${limit || 20}`); }
export function getSystemNotifications(limit) { return request(`/system?limit=${limit || 20}`); }

export function getCampaigns() { return request('/campaigns'); }
export function getCampaign(id) { return request(`/campaigns/${id}`); }
export function createCampaign(data) { return request('/campaigns', { method: 'POST', body: JSON.stringify(data) }); }
export function updateCampaign(id, data) { return request(`/campaigns/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
export function deleteCampaign(id) { return request(`/campaigns/${id}`, { method: 'DELETE' }); }
export function launchCampaign(id) { return request(`/campaigns/${id}/launch`, { method: 'POST' }); }
export function completeCampaign(id) { return request(`/campaigns/${id}/complete`, { method: 'POST' }); }
export function getCampaignAnalytics(id) { return request(`/campaigns/${id}/analytics`); }

export function getTemplates() { return request('/templates'); }
export function getTemplate(id) { return request(`/templates/${id}`); }
export function createTemplate(data) { return request('/templates', { method: 'POST', body: JSON.stringify(data) }); }
export function updateTemplate(id, data) { return request(`/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
export function deleteTemplate(id) { return request(`/templates/${id}`, { method: 'DELETE' }); }
export function previewTemplate(id, variables) { return request(`/templates/${id}/preview`, { method: 'POST', body: JSON.stringify({ variables }) }); }
export function getTemplateVariables() { return request('/template-variables'); }

export function getPreferences() { return request('/preferences'); }
export function updatePreferences(data) { return request('/preferences', { method: 'PUT', body: JSON.stringify(data) }); }

export function getChannels() { return request('/channels'); }
export function updateChannel(channel, data) { return request(`/channels/${channel}`, { method: 'PUT', body: JSON.stringify(data) }); }

export function getNotificationAnalytics() { return request('/analytics'); }
export function getDeliveryStatus() { return request('/delivery'); }
export function retryFailed() { return request('/retry', { method: 'POST' }); }
export function retryNotification(id) { return request(`/retry/${id}`, { method: 'POST' }); }

export function getSubscription() { return request('/subscription'); }
export function updateSubscription(data) { return request('/subscription', { method: 'PUT', body: JSON.stringify(data) }); }
export function updateDigest(data) { return request('/digest', { method: 'PUT', body: JSON.stringify(data) }); }
export function updateRetention(data) { return request('/retention', { method: 'PUT', body: JSON.stringify(data) }); }

export function getNotificationHealth() { return request('/health'); }
export function refreshNotificationCache() { return request('/refresh', { method: 'POST' }); }
export function initializeNotificationDefaults() { return request('/initialize', { method: 'POST' }); }

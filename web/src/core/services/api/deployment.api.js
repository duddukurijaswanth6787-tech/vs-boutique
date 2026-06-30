import { api } from './client.api';

const BASE = '/api/v1/cms/deployment';

export const deploymentApi = {
  // Environments
  getEnvironments: (businessId) => api.get(`${BASE}/environments`, { params: { businessId } }),
  createEnvironment: (data) => api.post(`${BASE}/environments`, data),
  updateEnvironment: (id, data) => api.put(`${BASE}/environments/${id}`, data),
  deleteEnvironment: (id) => api.delete(`${BASE}/environments/${id}`),

  // Deployments
  getDeployments: (params) => api.get(BASE, { params }),
  getDeployment: (id) => api.get(`${BASE}/${id}`),
  createDeployment: (data) => api.post(BASE, data),
  startBuild: (id) => api.post(`${BASE}/${id}/build`),
  deployArtifacts: (id, data) => api.post(`${BASE}/${id}/deploy`, data),
  cancelDeployment: (id) => api.post(`${BASE}/${id}/cancel`),
  getDeploymentLogs: (id) => api.get(`${BASE}/${id}/logs`),

  // Domains
  getDomains: (params) => api.get(`${BASE}/domains`, { params }),
  getDomain: (id) => api.get(`${BASE}/domains/${id}`),
  createDomain: (data) => api.post(`${BASE}/domains`, data),
  verifyDomainDns: (id) => api.post(`${BASE}/domains/${id}/verify-dns`),
  checkDomainPropagation: (id) => api.post(`${BASE}/domains/${id}/check-propagation`),
  requestDomainSsl: (id) => api.post(`${BASE}/domains/${id}/request-ssl`),
  activateDomain: (id) => api.post(`${BASE}/domains/${id}/activate`),
  setPrimaryDomain: (id) => api.put(`${BASE}/domains/${id}/primary`),
  deleteDomain: (id) => api.delete(`${BASE}/domains/${id}`),
  getDomainStats: (businessId) => api.get(`${BASE}/domains/stats`, { params: { businessId } }),

  // Environment Variables
  getVariables: (envId) => api.get(`${BASE}/environments/${envId}/variables`),
  createVariable: (envId, data) => api.post(`${BASE}/environments/${envId}/variables`, data),
  updateVariable: (id, data) => api.put(`${BASE}/variables/${id}`, data),
  deleteVariable: (id) => api.delete(`${BASE}/variables/${id}`),
  getVariableHistory: (id) => api.get(`${BASE}/variables/${id}/history`),
  rollbackVariable: (id, version) => api.post(`${BASE}/variables/${id}/rollback`, { version }),

  // Rollback
  getRollbackTargets: (params) => api.get(`${BASE}/rollback/targets`, { params }),
  executeRollback: (deploymentId) => api.post(`${BASE}/rollback/${deploymentId}`),
  getRollbackHistory: (params) => api.get(`${BASE}/rollback/history`, { params }),

  // Health & Stats
  getHealthStatus: (businessId) => api.get(`${BASE}/health/status`, { params: { businessId } }),
  getStats: (businessId) => api.get(`${BASE}/stats/overview`, { params: { businessId } }),
};

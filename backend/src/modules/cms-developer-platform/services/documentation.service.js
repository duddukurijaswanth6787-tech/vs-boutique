const registryService = require('./api-registry.service');

function buildDocumentation() {
  const registry = registryService.getRegistry();
  const groups = [];
  for (const [basePath, info] of Object.entries(registry)) {
    const parts = basePath.split('/').filter(Boolean);
    const groupName = parts[parts.length - 1] || 'root';
    const category = parts[0] || 'uncategorized';
    let existing = groups.find(g => g.name === groupName);
    if (!existing) {
      existing = { name: groupName, category, basePath, endpoints: [] };
      groups.push(existing);
    }
    for (const ep of info.endpoints) {
      existing.endpoints.push({
        method: ep.method,
        path: ep.path,
        description: _describeEndpoint(ep.method, ep.path),
        parameters: _extractParams(ep.path),
        headers: ['Authorization: Bearer <token>', 'Content-Type: application/json']
      });
    }
  }
  groups.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  return {
    version: '1.0.0',
    title: 'Enterprise API Documentation',
    baseUrl: '/api/v1',
    groups,
    totalEndpoints: registryService.getRouteCount(),
    generatedAt: new Date().toISOString()
  };
}

function _describeEndpoint(method, p) {
  const segments = p.split('/').filter(Boolean);
  const last = segments[segments.length - 1] || '';
  if (method === 'GET' && last.includes(':')) return `Get ${last.replace(':', '')} details`;
  if (method === 'GET') return `List ${last || segments[segments.length - 2] || 'items'}`;
  if (method === 'POST' && last.includes(':')) return `Update ${last.replace(':', '')}`;
  if (method === 'POST') return `Create ${last || 'item'}`;
  if (method === 'PUT') return `Replace ${last.replace(':', '') || 'item'}`;
  if (method === 'PATCH') return `Partial update ${last.replace(':', '') || 'item'}`;
  if (method === 'DELETE') return `Delete ${last.replace(':', '') || 'item'}`;
  return `${method} ${p}`;
}

function _extractParams(p) {
  const params = [];
  const regex = /:(\w+)/g;
  let m;
  while ((m = regex.exec(p)) !== null) {
    params.push({ name: m[1], type: 'string', required: true, in: 'path' });
  }
  return params;
}

function getDocumentation() {
  return buildDocumentation();
}

function getEndpointDetail(path) {
  const docs = buildDocumentation();
  for (const group of docs.groups) {
    for (const ep of group.endpoints) {
      if (ep.path === path) return ep;
    }
  }
  return null;
}

module.exports = { getDocumentation, getEndpointDetail };

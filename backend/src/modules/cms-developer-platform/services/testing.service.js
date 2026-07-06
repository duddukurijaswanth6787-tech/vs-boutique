const apikeyService = require('./apikey.service');
const registryService = require('./api-registry.service');

function _buildSamplePayload(method, p) {
  if (method === 'GET' || method === 'DELETE') return null;
  const params = p.match(/:(\w+)/g) || [];
  const payload = {};
  for (const param of params) {
    payload[param.replace(':', '')] = 'string';
  }
  if (p.includes('subscription') || p.includes('plan')) {
    return { name: 'Sample', status: 'ACTIVE' };
  }
  if (p.includes('business') || p.includes('boutique')) {
    return { name: 'Sample Boutique', email: 'sample@example.com' };
  }
  if (p.includes('user') || p.includes('owner')) {
    return { username: 'sample_user', email: 'user@example.com' };
  }
  if (p.includes('product')) {
    return { name: 'Sample Product', price: 29.99 };
  }
  if (p.includes('order')) {
    return { items: [{ productId: 'sample', quantity: 1 }] };
  }
  if (p.includes('payment')) {
    return { amount: 99.99, currency: 'USD' };
  }
  if (p.includes('deployment')) {
    return { version: '1.0.0', environment: 'DEVELOPMENT' };
  }
  if (p.includes('notification')) {
    return { title: 'Test', message: 'Hello', type: 'SYSTEM' };
  }
  if (p.includes('template')) {
    return { name: 'Sample Template', content: {} };
  }
  if (p.includes('report')) {
    return { businessId: 'sample', type: 'validation' };
  }
  if (p.includes('workflow')) {
    return { name: 'Sample Workflow', steps: [] };
  }
  if (p.includes('monitoring')) {
    return { metric: 'cpu', value: 75 };
  }
  if (p.includes('marketplace')) {
    return { packageId: 'sample', version: '1.0.0' };
  }
  if (p.includes('certification')) {
    return { name: 'Sample Cert', score: 85 };
  }
  if (p.includes('ai') || p.includes('prompt')) {
    return { prompt: 'Hello', provider: 'openai' };
  }
  if (p.includes('domain')) {
    return { domain: 'example.com' };
  }
  return { name: 'Sample', description: 'Sample payload for testing' };
}

function getTestEndpoint(apiKey, endpointPath, method) {
  const registry = registryService.getRegistry();
  for (const [, info] of Object.entries(registry)) {
    for (const ep of info.endpoints) {
      if (ep.path === endpointPath && ep.method.toUpperCase() === method.toUpperCase()) {
        return {
          endpoint: ep.path,
          method: ep.method,
          samplePayload: _buildSamplePayload(method, ep.path),
          headers: { Authorization: `Bearer ${apiKey || '<your-api-key>'}` },
          contentType: 'application/json'
        };
      }
    }
  }
  return null;
}

async function executeTest(apiKey, rawKey, endpointPath, method, payload) {
  if (!rawKey) return { success: false, error: 'API key is required' };
  const key = await apikeyService.validateKey(rawKey);
  if (!key) return { success: false, error: 'Invalid or inactive API key' };
  const registry = registryService.getRegistry();
  for (const [, info] of Object.entries(registry)) {
    for (const ep of info.endpoints) {
      if (ep.path === endpointPath && ep.method.toUpperCase() === method.toUpperCase()) {
        return {
          success: true,
          endpoint: ep.path,
          method: ep.method,
          request: { headers: { Authorization: `Bearer dev_${key.prefix}...` }, payload },
          note: 'Sandbox mode. Use actual API endpoints for real execution.',
          timestamp: new Date().toISOString()
        };
      }
    }
  }
  return { success: false, error: `Endpoint ${method} ${endpointPath} not found` };
}

module.exports = { getTestEndpoint, executeTest };

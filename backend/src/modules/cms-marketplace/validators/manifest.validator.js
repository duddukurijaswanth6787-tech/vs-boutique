const allowedPermissions = [
  'business:read', 'business:write',
  'theme:read', 'theme:write',
  'template:read', 'template:write',
  'ai:query', 'ai:train',
  'deployment:read', 'deployment:write',
  'storage:read', 'storage:write',
  'analytics:read',
  'notification:send',
  'plugin:config'
];

function validateManifest(manifest) {
  const errors = [];

  if (!manifest.id || typeof manifest.id !== 'string') errors.push('manifest.id is required and must be a string');
  if (!manifest.version || !/^\d+\.\d+\.\d+$/.test(manifest.version)) errors.push('manifest.version must be semver (x.y.z)');
  if (!manifest.name || typeof manifest.name !== 'string') errors.push('manifest.name is required');

  const type = manifest.type || manifest.category;
  const validTypes = [
    'plugin', 'extension', 'widget', 'integration', 'theme',
    'automation-pack', 'ai-pack', 'developer-package', 'connector',
    'business-pack', 'industry-pack',
    'payment-provider', 'shipping-provider', 'communication-provider',
    'analytics-provider', 'marketing-provider',
    'seo-pack', 'security-pack', 'reports-pack'
  ];
  if (type && !validTypes.includes(type)) {
    errors.push(`Invalid type '${type}'. Valid: ${validTypes.join(', ')}`);
  }

  if (manifest.permissions && Array.isArray(manifest.permissions)) {
    for (const p of manifest.permissions) {
      if (p === 'root:write') errors.push('root:write permission is forbidden');
      if (!allowedPermissions.includes(p) && !p.startsWith('custom:')) {
        errors.push(`Unknown permission '${p}'`);
      }
    }
  }

  if (manifest.dependencies && typeof manifest.dependencies === 'object') {
    for (const [dep, constraint] of Object.entries(manifest.dependencies)) {
      if (!dep || typeof dep !== 'string') errors.push(`Invalid dependency name: ${dep}`);
      if (constraint && !/^[\^~]?\d+\.\d+\.\d+$/.test(constraint)) {
        errors.push(`Invalid version constraint for ${dep}: ${constraint}`);
      }
    }
  }

  if (manifest.capabilities && Array.isArray(manifest.capabilities)) {
    for (const cap of manifest.capabilities) {
      if (!cap.type) errors.push('Capability missing required field: type');
      if (!cap.entrypoint) errors.push(`Capability ${cap.type || 'unknown'} missing entrypoint`);
    }
  }

  return { valid: errors.length === 0, errors };
}

function checkCompatibility(manifest, platformVersion) {
  if (!manifest.platformVersion) return { compatible: true };
  const minVer = manifest.platformVersion;
  if (minVer.startsWith('>=')) {
    const required = minVer.replace('>=', '');
    const partsP = platformVersion.split('.').map(Number);
    const partsR = required.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      if ((partsP[i] || 0) < (partsR[i] || 0)) return { compatible: false, reason: `Requires platform >= ${required}` };
    }
  }
  return { compatible: true };
}

function checkDependencyCycle(dependencies, allPackages) {
  const graph = {};
  for (const [pkg, deps] of Object.entries(allPackages)) {
    graph[pkg] = deps || [];
  }
  const visited = new Set();
  const recursionStack = new Set();

  function dfs(node) {
    visited.add(node);
    recursionStack.add(node);
    const neighbors = graph[node] || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) { if (dfs(neighbor)) return true; }
      else if (recursionStack.has(neighbor)) return true;
    }
    recursionStack.delete(node);
    return false;
  }

  for (const node of Object.keys(graph)) {
    if (!visited.has(node)) { if (dfs(node)) return { hasCycle: true, message: 'Circular dependency detected' }; }
  }
  return { hasCycle: false };
}

module.exports = { validateManifest, checkCompatibility, checkDependencyCycle };

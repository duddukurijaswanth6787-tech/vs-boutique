const prisma = require('../../../utils/prisma');

const DEFAULT_POLICIES = {
  backup: {
    enabled: false,
    scheduleCron: '0 2 * * *',
    retentionDays: 30,
    maxBackups: 50,
    storageProvider: 's3',
    encryptionEnabled: true,
    compressionEnabled: true
  },
  retention: {
    deploymentLogs: 90,
    buildLogs: 90,
    artifacts: 180,
    rollbackHistory: 365,
    envVarHistory: 180
  },
  storage: {
    maxStorageGB: 10,
    alertThresholdPercent: 80,
    preferredProvider: 's3'
  },
  snapshot: {
    maxSnapshots: 100,
    autoDiscover: true,
    includeAssets: true,
    includeUploads: true
  }
};

function _policyKey(businessId, type) { return `disaster:${type}:policy:${businessId}`; }

async function getRetentionPolicies(businessId) {
  const keys = ['backup', 'retention', 'storage', 'snapshot'];
  const results = await Promise.all(
    keys.map(k => prisma.cmsAiSettings.findUnique({ where: { key: _policyKey(businessId, k) } }).catch(() => null))
  );

  const policies = {};
  keys.forEach((k, i) => {
    policies[k] = results[i]?.value || { ...DEFAULT_POLICIES[k] };
  });
  return policies;
}

async function updateRetentionPolicy(businessId, type, updates) {
  const key = _policyKey(businessId, type);
  const existing = await prisma.cmsAiSettings.findUnique({ where: { key } }).catch(() => null);
  const merged = { ...DEFAULT_POLICIES[type], ...(existing?.value || {}), ...updates };

  await prisma.cmsAiSettings.upsert({
    where: { key },
    create: { key, value: merged, category: 'disaster', description: `${type} policy for ${businessId}` },
    update: { value: merged }
  });

  return merged;
}

async function getRecordsBeyondRetention(businessId) {
  const policies = await getRetentionPolicies(businessId);
  const now = new Date();
  const result = {};

  if (policies.retention) {
    const checks = [
      { key: 'deploymentLogs', model: 'deployment', field: 'createdAt', days: policies.retention.deploymentLogs || 90 },
      { key: 'buildLogs', model: 'deploymentBuildLog', field: 'createdAt', days: policies.retention.buildLogs || 90 },
      { key: 'rollbackHistory', model: 'deployment', field: 'createdAt', days: policies.retention.rollbackHistory || 365 }
    ];

    for (const check of checks) {
      const threshold = new Date(now - check.days * 864e5);
      try {
        const modelMap = { deployment: prisma.deployment, deploymentBuildLog: prisma.deploymentBuildLog };
        const count = await modelMap[check.model].count({
          where: { businessId, [check.field]: { lt: threshold } }
        });
        result[check.key] = { retentionDays: check.days, recordsBeyondRetention: count, thresholdDate: threshold.toISOString() };
      } catch {
        result[check.key] = { retentionDays: check.days, recordsBeyondRetention: -1, thresholdDate: threshold.toISOString() };
      }
    }
  }

  return result;
}

module.exports = { getRetentionPolicies, updateRetentionPolicy, getRecordsBeyondRetention };

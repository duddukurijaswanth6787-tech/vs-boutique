const prisma = require('../../../utils/prisma');

const DEFAULT_RETENTION = {
  auditLogs: 365,
  deploymentLogs: 90,
  workflowExecutions: 90,
  aiExecutions: 180,
  apiUsageLogs: 90,
  systemMetrics: 30
};

function _getRetentionKey(businessId) { return `data:retention:${businessId}`; }

async function getRetentionConfig(businessId) {
  const key = _getRetentionKey(businessId);
  const setting = await prisma.cmsAiSettings.findUnique({ where: { key } });

  if (setting && setting.value) {
    return {
      ...DEFAULT_RETENTION,
      ...setting.value,
      source: 'configured',
      calculatedAt: new Date().toISOString()
    };
  }

  return {
    ...DEFAULT_RETENTION,
    source: 'default',
    calculatedAt: new Date().toISOString()
  };
}

async function updateRetentionConfig(businessId, config) {
  const key = _getRetentionKey(businessId);
  const merged = { ...DEFAULT_RETENTION, ...config };

  await prisma.cmsAiSettings.upsert({
    where: { key },
    create: { key, value: merged, category: 'compliance', description: `Data retention config for ${businessId}` },
    update: { value: merged }
  });

  return { ...merged, source: 'configured', updatedAt: new Date().toISOString() };
}

async function getRetentionStatus() {
  const now = new Date();
  const status = {};

  for (const [key, days] of Object.entries(DEFAULT_RETENTION)) {
    const threshold = new Date(now - days * 864e5);
    let count = 0;

    try {
      switch (key) {
        case 'auditLogs':
          count = await prisma.auditLog.count({ where: { timestamp: { lt: threshold } } });
          break;
        case 'deploymentLogs':
          count = await prisma.deployment.count({ where: { createdAt: { lt: threshold } } });
          break;
        case 'workflowExecutions':
          count = await prisma.workflowExecution.count({ where: { createdAt: { lt: threshold } } });
          break;
      }
    } catch {
      count = -1;
    }

    status[key] = {
      retentionDays: days,
      thresholdDate: threshold.toISOString(),
      recordsBeyondRetention: count
    };
  }

  return { status, calculatedAt: now.toISOString() };
}

module.exports = { getRetentionConfig, updateRetentionConfig, getRetentionStatus };

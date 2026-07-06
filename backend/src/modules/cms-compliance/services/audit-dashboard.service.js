const prisma = require('../../../utils/prisma');

async function getAuditLogs(filters = {}) {
  const { entityType, entityId, actionType, performedBy, dateFrom, dateTo, limit = 50, offset = 0 } = filters;
  const where = {};
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;
  if (actionType) where.actionType = Array.isArray(actionType) ? { in: actionType } : { startsWith: actionType };
  if (performedBy) where.performedBy = performedBy;
  if (dateFrom || dateTo) {
    where.timestamp = {};
    if (dateFrom) where.timestamp.gte = new Date(dateFrom);
    if (dateTo) where.timestamp.lte = new Date(dateTo);
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: { owner: { select: { ownerName: true, email: true } } }
    }),
    prisma.auditLog.count({ where })
  ]);

  return { logs, total, limit, offset };
}

async function getAuditSummary(businessId) {
  const now = new Date();
  const [totalLogs, last24h, uniqueActions, uniqueUsers, byActionType, topUsers] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.count({ where: { timestamp: { gte: new Date(now - 864e5) } } }),
    prisma.auditLog.groupBy({ by: ['actionType'], _count: true }),
    prisma.auditLog.groupBy({ by: ['performedBy'] }).then(r => r.length),
    (async () => {
      const raw = await prisma.auditLog.groupBy({ by: ['actionType'], _count: true });
      return raw.sort((a, b) => b._count - a._count).slice(0, 10);
    })(),
    (async () => {
      const raw = await prisma.auditLog.groupBy({ by: ['performedBy'], _count: true });
      const sorted = raw.sort((a, b) => b._count - a._count).slice(0, 5);
      const owners = await prisma.owner.findMany({
        where: { id: { in: sorted.map(s => s.performedBy) } },
        select: { id: true, ownerName: true, email: true }
      });
      const ownerMap = Object.fromEntries(owners.map(o => [o.id, o]));
      return sorted.map(s => ({ ...s, owner: ownerMap[s.performedBy] || null }));
    })()
  ]);

  return {
    totalLogs,
    last24h,
    uniqueActionTypes: uniqueActions.length,
    uniqueUsers,
    topActionTypes: byActionType,
    topUsers,
    calculatedAt: now.toISOString()
  };
}

async function getCrossModuleActivity() {
  const modules = [
    { name: 'owners', model: 'owner' },
    { name: 'boutiques', model: 'boutique' },
    { name: 'tickets', model: 'supportTicket' },
    { name: 'orders', model: 'order' },
    { name: 'payments', model: 'commercePayment' },
    { name: 'products', model: 'product' },
    { name: 'deployments', model: 'deployment' },
    { name: 'workflows', model: 'workflowExecution' },
    { name: 'ai', model: 'cmsAiExecutionStep' },
    { name: 'marketplace', model: 'marketplaceInstallation' }
  ];

  const results = await Promise.allSettled(
    modules.map(m =>
      prisma[m.model].count().catch(() => 0).then(count => ({ module: m.name, totalRecords: count }))
    )
  );

  const moduleActivity = [];
  results.forEach(r => { if (r.status === 'fulfilled') moduleActivity.push(r.value); });

  const auditByEntity = await prisma.auditLog.groupBy({ by: ['entityType'], _count: true });
  const entityCoverage = {};
  auditByEntity.forEach(e => { entityCoverage[e.entityType] = e._count; });

  return { moduleActivity, entityCoverage };
}

module.exports = { getAuditLogs, getAuditSummary, getCrossModuleActivity };

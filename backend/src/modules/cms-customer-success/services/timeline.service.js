const prisma = require('../../../utils/prisma');

async function getTimeline(businessId, options = {}) {
  const limit = options.limit || 50;
  const offset = options.offset || 0;

  try {
    const [auditLogs, deployments, billingHistory, marketplaceEvents, assignmentHistory, workflows] = await Promise.all([
      prisma.auditLog.findMany({
        where: { entityId: businessId },
        orderBy: { timestamp: 'desc' },
        take: limit, skip: offset,
        select: { id: true, actionType: true, entityType: true, metadata: true, timestamp: true, performedBy: true }
      }),
      prisma.deployment.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
        take: limit, skip: offset,
        select: { id: true, status: true, createdAt: true }
      }),
      prisma.subscriptionBillingHistory.findMany({
        where: { subscription: { boutique: { businessId } } },
        orderBy: { createdAt: 'desc' },
        take: limit, skip: offset,
        select: { id: true, amount: true, paymentStatus: true, createdAt: true, description: true }
      }),
      prisma.marketplaceInstallation.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
        take: limit, skip: offset,
        select: { id: true, isEnabled: true, createdAt: true, packageId: true }
      }),
      prisma.cmsAssignmentHistory.findMany({
        where: { assignment: { businessId } },
        orderBy: { createdAt: 'desc' },
        take: limit, skip: offset,
        select: { id: true, action: true, createdAt: true, metadata: true }
      }),
      prisma.workflowExecution.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit, skip: offset,
        select: { id: true, status: true, createdAt: true, payload: true }
      })
    ]);

    const entries = [];

    auditLogs.forEach(a => entries.push({
      id: `audit-${a.id}`, type: 'audit', action: a.actionType, entity: a.entityType,
      detail: a.metadata?.message || a.actionType,
      timestamp: a.timestamp, performedBy: a.performedBy
    }));

    deployments.forEach(d => entries.push({
      id: `deploy-${d.id}`, type: 'deployment', action: `Deployment ${d.status}`,
      detail: `Status: ${d.status}`,
      timestamp: d.createdAt
    }));

    workflows.forEach(w => entries.push({
      id: `wf-${w.id}`, type: 'workflow', action: `Workflow ${w.status}`,
      detail: w.payload?.name || `Execution ${w.id}`,
      timestamp: w.createdAt
    }));

    billingHistory.forEach(b => entries.push({
      id: `bill-${b.id}`, type: 'billing', action: `Billing ${b.paymentStatus}`,
      detail: b.description || `$${b.amount}`,
      timestamp: b.createdAt
    }));

    marketplaceEvents.forEach(m => entries.push({
      id: `mp-${m.id}`, type: 'marketplace', action: m.isEnabled ? 'Package installed' : 'Package disabled',
      detail: `Package: ${m.packageId}`,
      timestamp: m.createdAt
    }));

    assignmentHistory.forEach(a => entries.push({
      id: `assign-${a.id}`, type: 'assignment', action: `Assignment ${a.action}`,
      detail: a.metadata?.message || '',
      timestamp: a.createdAt
    }));

    entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return { businessId, entries: entries.slice(0, limit), total: entries.length };
  } catch {
    return { businessId, entries: [], total: 0 };
  }
}

module.exports = { getTimeline };

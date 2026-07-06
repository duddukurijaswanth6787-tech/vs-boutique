const prisma = require('../../../utils/prisma');

async function getLifecycle(businessId) {
  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true, status: true, createdAt: true, updatedAt: true }
    });
    if (!business) return null;

    const boutique = await prisma.boutique.findFirst({
      where: { businessId },
      select: { id: true }
    });

    const sub = boutique ? await prisma.boutiqueSubscription.findFirst({
      where: { boutiqueId: boutique.id },
      include: { plan: true },
      orderBy: { createdAt: 'desc' }
    }) : null;

    const assignmentCount = await prisma.businessTemplateAssignment.count({ where: { businessId } });

    const firstDeployment = await prisma.deployment.findFirst({
      where: { businessId, status: 'DEPLOYED' },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true }
    });

    const activeDeployments = await prisma.deployment.count({
      where: { businessId, status: 'DEPLOYED' }
    });

    const hasActiveDeployments = activeDeployments > 0;
    const hasAssignments = assignmentCount > 0;
    const hasSubscription = !!sub;
    const hasPaidPlan = sub && sub.status === 'ACTIVE';
    const trialEnded = sub && sub.status === 'TRIAL' && sub.trialEndsAt && new Date(sub.trialEndsAt) < new Date();

    let stage = 'lead';
    if (hasSubscription && hasPaidPlan && hasActiveDeployments && hasAssignments) stage = 'active';
    else if (hasSubscription && hasActiveDeployments) stage = 'onboarding';
    else if (hasSubscription) stage = 'trial';
    else if (business.status === 'INACTIVE' || business.status === 'SUSPENDED') stage = 'churned';
    else if (trialEnded) stage = 'at-risk';
    else if (business.createdAt && (Date.now() - business.createdAt.getTime()) > 90 * 24 * 60 * 60 * 1000) stage = 'dormant';

    const daysSinceCreated = business.createdAt ? Math.floor((Date.now() - business.createdAt.getTime()) / (24 * 60 * 60 * 1000)) : 0;

    return {
      businessId: business.id,
      businessName: business.name,
      stage,
      status: business.status,
      daysSinceCreated,
      subscription: sub ? {
        plan: sub.plan?.name || 'Unknown',
        status: sub.status,
        trialEndsAt: sub.trialEndsAt
      } : null,
      milestones: {
        created: business.createdAt,
        totalAssignments: assignmentCount,
        totalDeployments: activeDeployments
      }
    };
  } catch { return null; }
}

async function getAllLifecycles() {
  const businesses = await prisma.business.findMany({
    select: { id: true, name: true, status: true, createdAt: true }
  });

  const lifecycles = await Promise.allSettled(
    businesses.map(b => getLifecycle(b.id))
  );

  const stages = lifecycles
    .filter(r => r.status === 'fulfilled' && r.value)
    .map(r => r.value);

  const distribution = {
    lead: 0, trial: 0, onboarding: 0, active: 0, dormant: 0, 'at-risk': 0, churned: 0
  };
  stages.forEach(s => { if (distribution[s.stage] !== undefined) distribution[s.stage]++; });

  return { stages, distribution, total: stages.length };
}

module.exports = { getLifecycle, getAllLifecycles };

const prisma = require('../../../utils/prisma');

async function getRecommendations(businessId) {
  const recommendations = [];

  const results = await Promise.allSettled([
    _checkUpgradePlan(businessId),
    _checkStorageWarning(businessId),
    _checkSSLExpiry(businessId),
    _checkInactiveCustomer(businessId),
    _checkHighDeploymentFailures(businessId),
    _checkPaymentDue(businessId),
    _checkBackupMissing(businessId),
    _checkCertificationExpiry(businessId)
  ]);

  results.forEach(r => {
    if (r.status === 'fulfilled' && r.value) recommendations.push(r.value);
  });

  recommendations.sort((a, b) => b.priority - a.priority);

  return { businessId, recommendations, total: recommendations.length };
}

async function _checkUpgradePlan(businessId) {
  try {
    const boutique = await prisma.boutique.findFirst({ where: { businessId }, select: { id: true } });
    if (!boutique) return null;
    const sub = await prisma.boutiqueSubscription.findFirst({
      where: { boutiqueId: boutique.id },
      include: { plan: true },
      orderBy: { createdAt: 'desc' }
    });
    if (!sub || !sub.plan) return null;
    const planName = sub.plan.name.toLowerCase();
    if (planName.includes('free') || planName.includes('starter') || planName.includes('basic')) {
      const deploymentCount = await prisma.deployment.count({ where: { businessId, status: 'DEPLOYED' } });
      if (deploymentCount > 3) {
        return {
          type: 'upgrade_plan', title: 'Upgrade Subscription Plan',
          description: `Current plan (${sub.plan.name}) may not support ${deploymentCount} active deployments. Consider upgrading.`,
          priority: 6, category: 'growth'
        };
      }
    }
    return null;
  } catch { return null; }
}

async function _checkStorageWarning(businessId) {
  try {
    const assets = await prisma.assetLibrary.findMany({ where: { businessId }, select: { fileSize: true } });
    const totalMB = assets.reduce((sum, a) => sum + (a.fileSize || 0), 0) / (1024 * 1024);
    if (totalMB > 800) {
      return {
        type: 'storage_critical', title: 'Storage Almost Full',
        description: `Using ${Math.round(totalMB)} MB. Immediate action recommended.`,
        priority: 8, category: 'infrastructure'
      };
    }
    if (totalMB > 400) {
      return {
        type: 'storage_warning', title: 'Storage Limit Approaching',
        description: `Using ${Math.round(totalMB)} MB. Consider upgrading storage or cleaning unused assets.`,
        priority: 5, category: 'infrastructure'
      };
    }
    return null;
  } catch { return null; }
}

async function _checkSSLExpiry(businessId) {
  try {
    const domains = await prisma.deploymentDomain.findMany({
      where: { businessId, sslStatus: { not: null } },
      select: { domain: true, sslExpiresAt: true, sslStatus: true }
    });
    const expiring = domains.filter(d => d.sslExpiresAt && new Date(d.sslExpiresAt) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    if (expiring.length > 0) {
      return {
        type: 'ssl_expiry', title: 'SSL Certificate(s) Expiring Soon',
        description: `${expiring.length} domain(s) have SSL certificates expiring within 30 days.`,
        priority: 9, category: 'security',
        domains: expiring.map(d => d.domain)
      };
    }
    return null;
  } catch { return null; }
}

async function _checkInactiveCustomer(businessId) {
  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId }, select: { name: true, status: true, createdAt: true }
    });
    if (!business) return null;

    const boutique = await prisma.boutique.findFirst({ where: { businessId }, select: { id: true } });
    const sub = boutique ? await prisma.boutiqueSubscription.findFirst({
      where: { boutiqueId: boutique.id }, orderBy: { createdAt: 'desc' }, select: { status: true, trialEndsAt: true }
    }) : null;

    if (business.status === 'INACTIVE' || business.status === 'SUSPENDED') {
      return {
        type: 'inactive_customer', title: 'Inactive Customer',
        description: `${business.name} has been inactive. Consider re-engagement.`,
        priority: 4, category: 'retention'
      };
    }
    if (sub && sub.status === 'TRIAL' && sub.trialEndsAt && new Date(sub.trialEndsAt) < new Date()) {
      return {
        type: 'trial_ending', title: 'Trial Period Ended',
        description: `${business.name}'s trial has ended. Reach out to discuss conversion.`,
        priority: 7, category: 'retention'
      };
    }
    return null;
  } catch { return null; }
}

async function _checkHighDeploymentFailures(businessId) {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recent = await prisma.deployment.findMany({
      where: { businessId, createdAt: { gte: sevenDaysAgo } },
      select: { status: true }
    });
    if (recent.length >= 3) {
      const failed = recent.filter(d => d.status === 'FAILED' || d.status === 'BUILD_FAILED').length;
      if (failed / recent.length > 0.3) {
        return {
          type: 'high_deployment_failures', title: 'High Deployment Failure Rate',
          description: `${failed}/${recent.length} recent deployments failed. Review deployment configuration.`,
          priority: 7, category: 'reliability'
        };
      }
    }
    return null;
  } catch { return null; }
}

async function _checkPaymentDue(businessId) {
  try {
    const boutiques = await prisma.boutique.findMany({ where: { businessId }, select: { id: true } });
    const boutiqueIds = boutiques.map(b => b.id);
    if (!boutiqueIds.length) return null;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const failedPayments = await prisma.commercePayment.count({
      where: { boutiqueId: { in: boutiqueIds }, status: 'FAILED', createdAt: { gte: thirtyDaysAgo } }
    });
    if (failedPayments >= 2) {
      return {
        type: 'payment_due', title: 'Multiple Payment Failures',
        description: `${failedPayments} payment failures in the last 30 days. Check billing info.`,
        priority: 8, category: 'billing'
      };
    }
    return null;
  } catch { return null; }
}

async function _checkBackupMissing(businessId) {
  try {
    const recentDeployments = await prisma.deployment.findMany({
      where: { businessId, createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } },
      select: { id: true, rollbacks: { select: { id: true } } }
    });
    const hasRollback = recentDeployments.some(d => d.rollbacks?.length > 0);
    if (recentDeployments.length > 0 && !hasRollback) {
      return {
        type: 'backup_missing', title: 'No Recent Backups',
        description: `${recentDeployments.length} recent deployments with no rollback snapshots. Enable backup policy.`,
        priority: 6, category: 'reliability'
      };
    }
    return null;
  } catch { return null; }
}

async function _checkCertificationExpiry(businessId) {
  try {
    const cert = await prisma.boutiqueCertification.findFirst({
      where: { boutique: { businessId } },
      orderBy: { createdAt: 'desc' },
      select: { expiresAt: true, overallScore: true }
    });
    if (cert && cert.expiresAt && new Date(cert.expiresAt) < new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)) {
      return {
        type: 'certification_expiry', title: 'Certification Expiring Soon',
        description: `Certification expires on ${new Date(cert.expiresAt).toISOString().split('T')[0]}. Renew to maintain compliance.`,
        priority: 7, category: 'compliance'
      };
    }
    if (cert && cert.overallScore !== null && cert.overallScore < 50) {
      return {
        type: 'security_issue', title: 'Security Certification Score Low',
        description: `Certification score is ${cert.overallScore}/100. Review security posture.`,
        priority: 9, category: 'security'
      };
    }
    return null;
  } catch { return null; }
}

module.exports = { getRecommendations };

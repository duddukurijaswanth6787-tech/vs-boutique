const prisma = require('../../../utils/prisma');

async function getAnalytics() {
  try {
    const [businesses, subscriptions, deployments, marketplace, reports] = await Promise.all([
      prisma.business.findMany({ select: { id: true, status: true, createdAt: true } }),
      prisma.boutiqueSubscription.findMany({ select: { id: true, status: true, plan: { select: { monthlyPrice: true } } } }),
      prisma.deployment.findMany({ select: { id: true, status: true, environment: { select: { businessId: true } } } }),
      prisma.marketplaceInstallation.findMany({ select: { id: true, businessId: true, isEnabled: true } }),
      prisma.cmsValidationReport.findMany({ select: { id: true, overallScore: true } })
    ]);

    const totalTenants = businesses.length;
    const activeTenants = businesses.filter(b => b.status === 'ACTIVE').length;
    const inactiveTenants = totalTenants - activeTenants;

    const activeSubscriptions = subscriptions.filter(s => s.status === 'ACTIVE');
    const mrr = activeSubscriptions.reduce((sum, s) => sum + (parseFloat(s.plan?.monthlyPrice) || 0), 0);

    const recentBusinesses = businesses.filter(b => {
      const created = b.createdAt ? new Date(b.createdAt) : null;
      return created && (Date.now() - created.getTime()) < 30 * 24 * 60 * 60 * 1000;
    });
    const growthRate = totalTenants > 0 ? Math.round((recentBusinesses.length / totalTenants) * 100) : 0;

    const successfulDeployments = deployments.filter(d => d.status === 'DEPLOYED').length;
    const totalDeployments = deployments.length;
    const deploymentSuccessRate = totalDeployments > 0 ? Math.round((successfulDeployments / totalDeployments) * 100) : 0;

    const businessesWithMarketplace = new Set(marketplace.filter(m => m.isEnabled).map(m => m.businessId)).size;
    const marketplaceAdoptionRate = totalTenants > 0 ? Math.round((businessesWithMarketplace / totalTenants) * 100) : 0;

    const reportScores = reports.filter(r => r.overallScore !== null).map(r => r.overallScore);
    const avgReportScore = reportScores.length > 0 ? Math.round(reportScores.reduce((a, b) => a + b, 0) / reportScores.length) : 0;

    const statusBreakdown = {};
    businesses.forEach(b => {
      statusBreakdown[b.status] = (statusBreakdown[b.status] || 0) + 1;
    });

    const churnedCount = businesses.filter(b => b.status === 'INACTIVE' || b.status === 'SUSPENDED').length;
    const retentionRate = totalTenants > 0 ? Math.round(((totalTenants - churnedCount) / totalTenants) * 100) : 100;

    return {
      totalTenants,
      activeTenants,
      inactiveTenants,
      mrr: Math.round(mrr * 100) / 100,
      arr: Math.round(mrr * 12 * 100) / 100,
      retentionRate,
      churnRate: 100 - retentionRate,
      growthRate,
      statusBreakdown,
      deploymentSuccessRate,
      marketplaceAdoptionRate,
      avgReportScore,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    return {
      totalTenants: 0, activeTenants: 0, inactiveTenants: 0,
      mrr: 0, arr: 0, retentionRate: 100, churnRate: 0,
      growthRate: 0, statusBreakdown: {}, deploymentSuccessRate: 0,
      marketplaceAdoptionRate: 0, avgReportScore: 0,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = { getAnalytics };

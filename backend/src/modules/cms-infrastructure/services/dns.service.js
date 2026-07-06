const prisma = require('../../../utils/prisma');

async function getDNSStatus(businessId) {
  const domains = await prisma.deploymentDomain.findMany({
    where: { businessId, isDeleted: false },
    select: { id: true, domain: true, status: true, dnsVerified: true, cnameTarget: true, propagationStatus: true, lastCheckedAt: true }
  });

  return domains.map(d => ({
    id: d.id, domain: d.domain, status: d.status,
    dnsVerified: d.dnsVerified || false,
    cnameTarget: d.cnameTarget,
    propagationStatus: d.propagationStatus,
    lastCheckedAt: d.lastCheckedAt
  }));
}

async function getDNSHealth(businessId) {
  const domains = await getDNSStatus(businessId);
  const verified = domains.filter(d => d.dnsVerified).length;
  const pending = domains.filter(d => !d.dnsVerified).length;
  const propagated = domains.filter(d => d.propagationStatus === 'PROPAGATED').length;
  const score = domains.length > 0 ? Math.round((verified / domains.length) * 100) : 0;
  return { total: domains.length, verified, pending, propagated, score, domains };
}

async function getDNSCoverage(businessId) {
  const health = await getDNSHealth(businessId);
  return {
    coveragePercent: health.score,
    totalDomains: health.total,
    verifiedDomains: health.verified,
    pendingDomains: health.pending,
    propagatedDomains: health.propagated
  };
}

module.exports = { getDNSStatus, getDNSHealth, getDNSCoverage };

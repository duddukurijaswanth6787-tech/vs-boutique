const prisma = require('../../../utils/prisma');
const { eventBus, Events } = require('../../../services/eventBus');

async function getSSLStatus(businessId) {
  const domains = await prisma.deploymentDomain.findMany({
    where: { businessId, isDeleted: false },
    select: { id: true, domain: true, sslEnabled: true, sslStatus: true, sslExpiresAt: true, lastCheckedAt: true }
  });

  return domains.map(d => {
    const daysUntilExpiry = d.sslExpiresAt ? Math.round((new Date(d.sslExpiresAt) - new Date()) / 86400000) : null;
    if (daysUntilExpiry !== null && daysUntilExpiry <= 0) {
      try { eventBus.emit(Events.INFRA_SSL_EXPIRED, { domain: d.domain, businessId }); } catch (e) { console.error('[SSL Service] SSL expired event error:', e); }
    }
    return {
      id: d.id, domain: d.domain, sslEnabled: d.sslEnabled || false,
      sslStatus: d.sslStatus, sslExpiresAt: d.sslExpiresAt,
      daysUntilExpiry, lastCheckedAt: d.lastCheckedAt
    };
  });
}

async function getSSLHealth(businessId) {
  const domains = await getSSLStatus(businessId);
  const active = domains.filter(d => d.sslStatus === 'ACTIVE').length;
  const expiringSoon = domains.filter(d => d.daysUntilExpiry !== null && d.daysUntilExpiry > 0 && d.daysUntilExpiry <= 30).length;
  const expired = domains.filter(d => d.daysUntilExpiry !== null && d.daysUntilExpiry <= 0).length;
  const noSSL = domains.filter(d => !d.sslEnabled).length;
  const score = domains.length > 0 ? Math.round((active / domains.length) * 100) : 0;
  return { total: domains.length, active, expiringSoon, expired, noSSL, score, domains };
}

async function getSSLCoverage(businessId) {
  const health = await getSSLHealth(businessId);
  return {
    coveragePercent: health.score,
    totalDomains: health.total,
    activeCertificates: health.active,
    expiringSoon: health.expiringSoon,
    expired: health.expired,
    noSSL: health.noSSL
  };
}

module.exports = { getSSLStatus, getSSLHealth, getSSLCoverage };

const prisma = require('../../../utils/prisma');
const crypto = require('crypto');
const dns = require('dns');

class DomainService {
  async listDomains(businessId, options = {}) {
    const { environmentId, status, limit = 50, offset = 0 } = options;
    const where = { businessId, isDeleted: false };
    if (environmentId) where.environmentId = environmentId;
    if (status) where.status = status;

    const [domains, total] = await Promise.all([
      prisma.deploymentDomain.findMany({
        where,
        include: { environment: { select: { name: true, type: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.deploymentDomain.count({ where })
    ]);

    return { domains, total, limit, offset };
  }

  async getDomain(id) {
    return prisma.deploymentDomain.findUnique({
      where: { id },
      include: { environment: true }
    });
  }

  async createDomain(businessId, data) {
    const { domain, type, environmentId, cnameTarget, isPrimary } = data;
    if (!domain) {
      throw new Error('Domain name is required');
    }

    const existing = await prisma.deploymentDomain.findUnique({
      where: { businessId_domain: { businessId, domain } }
    });
    if (existing) {
      throw new Error('Domain already exists for this business');
    }

    const verificationToken = crypto.randomBytes(16).toString('hex');
    const txtRecord = `vs-boutique-verify=${verificationToken}`;

    return prisma.deploymentDomain.create({
      data: {
        businessId,
        domain,
        type: type || 'SUBDOMAIN',
        environmentId,
        cnameTarget: cnameTarget || null,
        txtRecord,
        isPrimary: isPrimary || false,
        status: 'PENDING_VERIFICATION'
      }
    });
  }

  async verifyDns(id) {
    const domain = await prisma.deploymentDomain.findUnique({ where: { id } });
    if (!domain) throw new Error('Domain not found');

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve({ verified: false, error: 'DNS lookup timed out' });
      }, 10000);

      dns.resolveTxt(domain.domain, (err, records) => {
        clearTimeout(timer);
        if (err) {
          resolve({ verified: false, error: err.message });
          return;
        }

        const txtRecords = records.flat().map(r => r.trim());
        const expectedToken = `vs-boutique-verify=${domain.txtRecord.split('=')[1]}`;
        const found = txtRecords.some(r => r === expectedToken);

        if (found) {
          this._markDnsVerified(id);
          resolve({ verified: true, records: txtRecords });
        } else {
          resolve({ verified: false, records: txtRecords });
        }
      });
    });
  }

  async _markDnsVerified(id) {
    return prisma.deploymentDomain.update({
      where: { id },
      data: {
        dnsVerified: true,
        status: 'VERIFYING_DNS',
        lastCheckedAt: new Date()
      }
    });
  }

  async checkPropagation(id) {
    const domain = await prisma.deploymentDomain.findUnique({ where: { id } });
    if (!domain) throw new Error('Domain not found');

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve({ propagated: false, error: 'DNS lookup timed out' });
      }, 10000);

      dns.resolveCname(domain.domain, (err, cnameRecords) => {
        clearTimeout(timer);
        if (err) {
          resolve({ propagated: false, error: err.message });
          return;
        }

        const expectedCname = domain.cnameTarget;
        const propagated = expectedCname ? cnameRecords.some(r => r === expectedCname) : false;

        if (propagated) {
          prisma.deploymentDomain.update({
            where: { id },
            data: { propagationStatus: 'PROPAGATED', lastCheckedAt: new Date() }
          }).catch(() => {});
        }

        resolve({ propagated, cnameRecords });
      });
    });
  }

  async requestSsl(id) {
    const domain = await prisma.deploymentDomain.findUnique({ where: { id } });
    if (!domain) throw new Error('Domain not found');

    return prisma.deploymentDomain.update({
      where: { id },
      data: {
        sslStatus: 'PENDING',
        status: 'SSL_PENDING'
      }
    });
  }

  async activateSsl(id) {
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    return prisma.deploymentDomain.update({
      where: { id },
      data: {
        sslStatus: 'ACTIVE',
        sslExpiresAt: expiresAt,
        status: 'SSL_ACTIVE'
      }
    });
  }

  async activateDomain(id) {
    return prisma.deploymentDomain.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        dnsVerified: true,
        propagationStatus: 'PROPAGATED'
      }
    });
  }

  async setPrimary(id, businessId) {
    return prisma.$transaction(async (tx) => {
      await tx.deploymentDomain.updateMany({
        where: { businessId, isPrimary: true },
        data: { isPrimary: false }
      });
      return tx.deploymentDomain.update({
        where: { id },
        data: { isPrimary: true }
      });
    });
  }

  async deleteDomain(id) {
    return prisma.deploymentDomain.update({
      where: { id },
      data: { isDeleted: true }
    });
  }

  async getDomainStats(businessId) {
    const [total, active, pendingSsl, dnsPending, primary] = await Promise.all([
      prisma.deploymentDomain.count({ where: { businessId, isDeleted: false } }),
      prisma.deploymentDomain.count({ where: { businessId, status: 'ACTIVE', isDeleted: false } }),
      prisma.deploymentDomain.count({ where: { businessId, sslStatus: 'ACTIVE', isDeleted: false } }),
      prisma.deploymentDomain.count({ where: { businessId, dnsVerified: false, isDeleted: false } }),
      prisma.deploymentDomain.findFirst({ where: { businessId, isPrimary: true, isDeleted: false } })
    ]);

    return { total, active, sslActive: pendingSsl, dnsPending, primaryDomain: primary?.domain || null };
  }
}

module.exports = new DomainService();

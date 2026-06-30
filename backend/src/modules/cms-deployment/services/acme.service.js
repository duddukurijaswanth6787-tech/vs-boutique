const acme = require('acme-client');
const prisma = require('../../../utils/prisma');
const fs = require('fs');
const path = require('path');

class AcmeService {
  constructor() {
    this.directoryUrl = process.env.ACME_DIRECTORY_URL || acme.directory.letsencrypt.staging;
    this.accountKey = null;
    this.challengeDir = process.env.ACME_CHALLENGE_DIR || path.join(process.cwd(), '.well-known', 'acme-challenge');
    this.initialized = false;
  }

  async ensureInitialized() {
    if (this.initialized) return;
    this.accountKey = await acme.forge.createPrivateKey();
    this.client = new acme.Client({
      directoryUrl: this.directoryUrl,
      accountKey: this.accountKey
    });
    try {
      const accountUrl = await this.client.createAccount({
        termsOfServiceAgreed: true,
        contact: [`mailto:${process.env.ACME_EMAIL || 'admin@vsboutique.com'}`]
      });
      this.initialized = true;
    } catch (err) {
      console.warn(`[ACME] Account creation failed: ${err.message}. Will retry on next request.`);
    }
  }

  async provisionCertificate(domainName) {
    await this.ensureInitialized();

    if (!this.initialized) {
      throw new Error('ACME client not initialized. Check ACME_EMAIL and network connectivity.');
    }

    const [key, csr] = await acme.forge.createCsr({
      commonName: domainName,
      altNames: [domainName, `www.${domainName}`]
    });

    const cert = await this.client.auto({
      csr,
      email: process.env.ACME_EMAIL || 'admin@vsboutique.com',
      termsOfServiceAgreed: true,
      challengeCreateFn: async (authz, challenge, keyAuthorization) => {
        if (challenge.type !== 'http-01') {
          throw new Error(`Unsupported challenge type: ${challenge.type}`);
        }
        const token = challenge.token;
        const keyAuth = keyAuthorization;
        if (!fs.existsSync(this.challengeDir)) {
          fs.mkdirSync(this.challengeDir, { recursive: true });
        }
        fs.writeFileSync(path.join(this.challengeDir, token), keyAuth);
      },
      challengeRemoveFn: async (authz, challenge, keyAuthorization) => {
        const token = challenge.token;
        const filePath = path.join(this.challengeDir, token);
        try {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch {}
      }
    });

    await prisma.deploymentDomain.updateMany({
      where: { domain: domainName },
      data: {
        sslStatus: 'ACTIVE',
        status: 'SSL_ACTIVE',
        sslExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      }
    });

    return {
      domain: domainName,
      status: 'ACTIVE',
      certificate: cert.toString(),
      privateKey: key.toString(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      provider: 'letsencrypt',
      directoryUrl: this.directoryUrl
    };
  }

  async renewCertificate(domainId) {
    const domain = await prisma.deploymentDomain.findUnique({ where: { id: domainId } });
    if (!domain) throw new Error('Domain not found');
    return this.provisionCertificate(domain.domain);
  }

  async checkCertificateStatus(domainName) {
    const domain = await prisma.deploymentDomain.findFirst({
      where: { domain: domainName, isDeleted: false }
    });
    if (!domain) return { status: 'NOT_CONFIGURED' };
    if (!domain.sslExpiresAt) return { status: 'PENDING' };
    const daysRemaining = Math.floor((domain.sslExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return {
      status: daysRemaining > 0 ? 'ACTIVE' : 'EXPIRED',
      expiresAt: domain.sslExpiresAt,
      daysRemaining: Math.max(0, daysRemaining),
      provider: 'letsencrypt'
    };
  }
}

module.exports = new AcmeService();

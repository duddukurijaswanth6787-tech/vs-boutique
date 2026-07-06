const prisma = require('../../../utils/prisma');
const { eventBus, Events } = require('../../../services/eventBus');
const cache = require('../middleware/partner-cache');
const crypto = require('crypto');

async function getLicenses(businessId) {
  const cacheKey = `licenses:${businessId}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const licenses = await prisma.marketplaceLicense.findMany({
    where: {},
    include: { package: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' }
  });

  const result = licenses.map(l => ({
    id: l.id, businessId: l.businessId, packageId: l.packageId,
    packageName: l.package?.name || 'Unknown',
    packageType: 'partner',
    licenseKey: l.licenseKey, status: l.status,
    expiresAt: l.expiresAt, createdAt: l.createdAt
  }));

  await cache.set(cacheKey, result, 300);
  return result;
}

async function getLicense(businessId, licenseId) {
  if (!licenseId || typeof licenseId !== 'string' || licenseId.length < 8) return null;
  let license;
  try {
    license = await prisma.marketplaceLicense.findUnique({
      where: { id: licenseId },
      include: { package: { select: { id: true, name: true } } }
    });
  } catch { return null; }
  if (!license) return null;
  return {
    id: license.id, businessId: license.businessId, packageId: license.packageId,
    packageName: license.package?.name || 'Unknown',
    packageType: 'partner',
    licenseKey: license.licenseKey, status: license.status,
    expiresAt: license.expiresAt, createdAt: license.createdAt
  };
}

async function createLicense(businessId, data) {
  const { packageId, expiresAt } = data;
  const licenseKey = `PRT-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

  const license = await prisma.marketplaceLicense.create({
    data: { businessId, packageId, licenseKey, expiresAt: expiresAt ? new Date(expiresAt) : null }
  });

  await cache.delPattern('*');

  try { eventBus.emit(Events.PARTNER_LICENSE_UPDATED, { businessId, license: { id: license.id, licenseKey } }); } catch (e) { console.error('[License Service] createLicense event error:', e); }

  return getLicense(businessId, license.id);
}

async function updateLicense(businessId, licenseId, data) {
  const license = await prisma.marketplaceLicense.findUnique({ where: { id: licenseId } });
  if (!license) throw new Error('License not found');

  await prisma.marketplaceLicense.update({
    where: { id: licenseId },
    data: { status: data.status, expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined }
  });

  await cache.delPattern('*');

  try { eventBus.emit(Events.PARTNER_LICENSE_UPDATED, { businessId, licenseId }); } catch (e) { console.error('[License Service] updateLicense event error:', e); }

  return getLicense(businessId, licenseId);
}

async function deleteLicense(businessId, licenseId) {
  const license = await prisma.marketplaceLicense.findUnique({ where: { id: licenseId } });
  if (license) {
    await prisma.marketplaceLicense.delete({ where: { id: licenseId } });
  }
  await cache.delPattern('*');
  return { deleted: true };
}

async function getPackages() {
  const cacheKey = 'packages';
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const packages = await prisma.marketplacePackage.findMany({
    select: { id: true, name: true, description: true, status: true, createdAt: true },
    orderBy: { createdAt: 'desc' }
  });

  await cache.set(cacheKey, packages, 300);
  return packages;
}

async function getPartnerLicenses(partnerBusinessId) {
  return getLicenses(partnerBusinessId);
}

module.exports = { getLicenses, getLicense, createLicense, updateLicense, deleteLicense, getPackages, getPartnerLicenses };

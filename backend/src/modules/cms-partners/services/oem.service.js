const partnerService = require('./partner.service');

async function getOEMs(businessId) {
  return partnerService.getPartners(businessId, 'partner-oem');
}

async function getOEM(businessId, oemId) {
  const partner = await partnerService.getPartner(businessId, oemId);
  if (!partner || partner.partnerType !== 'oem') return null;
  return partner;
}

async function createOEM(businessId, data) {
  return partnerService.createPartner(businessId, { ...data, partnerType: 'oem' });
}

async function updateOEM(businessId, oemId, data) {
  return partnerService.updatePartner(businessId, oemId, { ...data, partnerType: 'oem' });
}

async function deleteOEM(businessId, oemId) {
  return partnerService.deletePartner(businessId, oemId);
}

module.exports = { getOEMs, getOEM, createOEM, updateOEM, deleteOEM };

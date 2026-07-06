const partnerService = require('./partner.service');

async function getResellers(businessId) {
  return partnerService.getPartners(businessId, 'partner-reseller');
}

async function getReseller(businessId, resellerId) {
  const partner = await partnerService.getPartner(businessId, resellerId);
  if (!partner || partner.partnerType !== 'reseller') return null;
  return partner;
}

async function createReseller(businessId, data) {
  return partnerService.createPartner(businessId, { ...data, partnerType: 'reseller' });
}

async function updateReseller(businessId, resellerId, data) {
  return partnerService.updatePartner(businessId, resellerId, { ...data, partnerType: 'reseller' });
}

async function deleteReseller(businessId, resellerId) {
  return partnerService.deletePartner(businessId, resellerId);
}

module.exports = { getResellers, getReseller, createReseller, updateReseller, deleteReseller };

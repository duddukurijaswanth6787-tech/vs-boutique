const partnerService = require('./partner.service');

async function getAgencies(businessId) {
  return partnerService.getPartners(businessId, 'partner-agency');
}

async function getAgency(businessId, agencyId) {
  const partner = await partnerService.getPartner(businessId, agencyId);
  if (!partner || partner.partnerType !== 'agency') return null;
  return partner;
}

async function createAgency(businessId, data) {
  return partnerService.createPartner(businessId, { ...data, partnerType: 'agency' });
}

async function updateAgency(businessId, agencyId, data) {
  return partnerService.updatePartner(businessId, agencyId, { ...data, partnerType: 'agency' });
}

async function deleteAgency(businessId, agencyId) {
  return partnerService.deletePartner(businessId, agencyId);
}

module.exports = { getAgencies, getAgency, createAgency, updateAgency, deleteAgency };

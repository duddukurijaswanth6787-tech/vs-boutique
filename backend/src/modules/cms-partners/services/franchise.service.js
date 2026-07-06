const partnerService = require('./partner.service');

async function getFranchises(businessId) {
  return partnerService.getPartners(businessId, 'partner-franchise');
}

async function getFranchise(businessId, franchiseId) {
  const partner = await partnerService.getPartner(businessId, franchiseId);
  if (!partner || partner.partnerType !== 'franchise') return null;
  return partner;
}

async function createFranchise(businessId, data) {
  return partnerService.createPartner(businessId, { ...data, partnerType: 'franchise' });
}

async function updateFranchise(businessId, franchiseId, data) {
  return partnerService.updatePartner(businessId, franchiseId, { ...data, partnerType: 'franchise' });
}

async function deleteFranchise(businessId, franchiseId) {
  return partnerService.deletePartner(businessId, franchiseId);
}

module.exports = { getFranchises, getFranchise, createFranchise, updateFranchise, deleteFranchise };

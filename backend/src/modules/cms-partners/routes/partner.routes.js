const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../../middleware/authMiddleware');
const partnerService = require('../services/partner.service');
const brandingService = require('../services/branding.service');
const agencyService = require('../services/agency.service');
const resellerService = require('../services/reseller.service');
const franchiseService = require('../services/franchise.service');
const oemService = require('../services/oem.service');
const licenseService = require('../services/license.service');
const partnerAnalyticsService = require('../services/partner-analytics.service');
const cache = require('../middleware/partner-cache');

const auth = [protect, authorize('super-admin')];

router.get('/', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await partnerService.getPartners(bizId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/overview', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await partnerAnalyticsService.getPartnerAnalyticsOverview(bizId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await partnerService.getPartner(bizId, req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'Partner not found' });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await partnerService.createPartner(bizId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await partnerService.updatePartner(bizId, req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await partnerService.deletePartner(bizId, req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id/analytics', ...auth, async (req, res) => {
  try {
    const result = await partnerService.getPartnerAnalytics(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id/health', ...auth, async (req, res) => {
  try {
    const result = await partnerService.getPartnerHealth(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id/infrastructure', ...auth, async (req, res) => {
  try {
    const result = await partnerService.getPartnerInfrastructure(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id/deployments', ...auth, async (req, res) => {
  try {
    const result = await partnerService.getPartnerDeployments(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id/compliance', ...auth, async (req, res) => {
  try {
    const result = await partnerService.getPartnerCompliance(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id/monitoring', ...auth, async (req, res) => {
  try {
    const result = await partnerService.getPartnerMonitoring(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id/marketplace', ...auth, async (req, res) => {
  try {
    const result = await partnerService.getPartnerMarketplace(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Branding endpoints
router.get('/branding/kits', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await brandingService.getBrandKits(bizId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/branding/kits', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await brandingService.createBrandKit(bizId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/branding/kits/:kitId', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await brandingService.updateBrandKit(bizId, req.params.kitId, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/branding/kits/:kitId', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await brandingService.deleteBrandKit(bizId, req.params.kitId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/branding/config', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await brandingService.getBrandingConfig(bizId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/branding/config', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await brandingService.updateBrandingConfig(bizId, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/themes/:businessId', ...auth, async (req, res) => {
  try {
    const result = await brandingService.getPartnerTheme(req.params.businessId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/themes/:businessId', ...auth, async (req, res) => {
  try {
    const result = await brandingService.updatePartnerTheme(req.params.businessId, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Agency endpoints
router.get('/agencies', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await agencyService.getAgencies(bizId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/agencies', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await agencyService.createAgency(bizId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/agencies/:id', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await agencyService.updateAgency(bizId, req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/agencies/:id', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await agencyService.deleteAgency(bizId, req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Reseller endpoints
router.get('/resellers', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await resellerService.getResellers(bizId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/resellers', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await resellerService.createReseller(bizId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/resellers/:id', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await resellerService.updateReseller(bizId, req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/resellers/:id', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await resellerService.deleteReseller(bizId, req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Franchise endpoints
router.get('/franchises', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await franchiseService.getFranchises(bizId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/franchises', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await franchiseService.createFranchise(bizId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/franchises/:id', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await franchiseService.updateFranchise(bizId, req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/franchises/:id', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await franchiseService.deleteFranchise(bizId, req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// OEM endpoints
router.get('/oem', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await oemService.getOEMs(bizId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/oem', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await oemService.createOEM(bizId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/oem/:id', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await oemService.updateOEM(bizId, req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/oem/:id', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await oemService.deleteOEM(bizId, req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// License endpoints
router.get('/licenses', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await licenseService.getLicenses(bizId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/licenses', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await licenseService.createLicense(bizId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/licenses/:licenseId', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await licenseService.updateLicense(bizId, req.params.licenseId, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/licenses/:licenseId', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await licenseService.deleteLicense(bizId, req.params.licenseId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/packages', ...auth, async (req, res) => {
  try {
    const result = await licenseService.getPackages();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Growth analytics
router.get('/analytics/revenue', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await partnerAnalyticsService.getPartnerRevenueAnalytics(bizId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/analytics/growth', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await partnerAnalyticsService.getPartnerGrowthAnalytics(bizId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Initialize & refresh
router.post('/initialize', ...auth, async (req, res) => {
  try {
    const result = await partnerService.initializeDefaults();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/refresh', ...auth, async (req, res) => {
  try {
    const result = await partnerService.refreshCache();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

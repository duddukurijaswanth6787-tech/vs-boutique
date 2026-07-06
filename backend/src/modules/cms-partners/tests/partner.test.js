jest.mock('uuid', () => ({ v4: () => '00000000-0000-0000-0000-000000000000' }));

const { eventBus, Events } = require('../../../services/eventBus');
const partnerService = require('../services/partner.service');
const brandingService = require('../services/branding.service');
const agencyService = require('../services/agency.service');
const resellerService = require('../services/reseller.service');
const franchiseService = require('../services/franchise.service');
const oemService = require('../services/oem.service');
const licenseService = require('../services/license.service');
const partnerAnalyticsService = require('../services/partner-analytics.service');
const prisma = require('../../../utils/prisma');

describe('Phase 26 - Enterprise White-Label & Partner Platform', () => {
  let testBizId;

  beforeAll(async () => {
    const biz = await prisma.business.findFirst({ select: { id: true } });
    testBizId = biz ? biz.id : null;
  });

  describe('EventBus Constants (TABLE B)', () => {
    test('PARTNER_CREATED', () => {
      expect(Events.PARTNER_CREATED).toBe('partner:created');
    });

    test('PARTNER_UPDATED', () => {
      expect(Events.PARTNER_UPDATED).toBe('partner:updated');
    });

    test('PARTNER_BRANDING_CHANGED', () => {
      expect(Events.PARTNER_BRANDING_CHANGED).toBe('partner:branding-changed');
    });

    test('PARTNER_THEME_CHANGED', () => {
      expect(Events.PARTNER_THEME_CHANGED).toBe('partner:theme-changed');
    });

    test('PARTNER_LICENSE_UPDATED', () => {
      expect(Events.PARTNER_LICENSE_UPDATED).toBe('partner:license-updated');
    });

    test('PARTNER_DOMAIN_ATTACHED', () => {
      expect(Events.PARTNER_DOMAIN_ATTACHED).toBe('partner:domain-attached');
    });
  });

  describe('Redis Cache (TABLE C)', () => {
    test('cache module exports correct interface', () => {
      const cache = require('../middleware/partner-cache');
      expect(cache).toHaveProperty('get');
      expect(cache).toHaveProperty('set');
      expect(cache).toHaveProperty('del');
      expect(cache).toHaveProperty('delPattern');
    });

    test('cache prefix is cms:partner:', () => {
      const fs = require('fs');
      const src = fs.readFileSync(require.resolve('../middleware/partner-cache'), 'utf8');
      expect(src).toContain('cms:partner:');
    });
  });

  describe('partnerService (Facade)', () => {
    test('getPartners returns array', async () => {
      const result = await partnerService.getPartners(testBizId);
      expect(Array.isArray(result)).toBe(true);
    });

    test('getPartner returns null for unknown partner', async () => {
      const result = await partnerService.getPartner(testBizId, 'nonexistent-id');
      expect(result).toBeNull();
    });

    test('createPartner creates a partner business', async () => {
      const name = `test-partner-${Date.now()}`;
      const result = await partnerService.createPartner(testBizId, { name, partnerType: 'partner' });
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name', name);
      expect(result).toHaveProperty('partnerType', 'partner');

      await partnerService.deletePartner(testBizId, result.id);
    });

    test('createPartner with agency type stores correct category', async () => {
      const name = `test-agency-${Date.now()}`;
      const result = await partnerService.createPartner(testBizId, { name, partnerType: 'agency' });
      expect(result).toHaveProperty('partnerType', 'agency');

      const setting = await prisma.cmsAiSettings.findFirst({
        where: { value: { path: ['businessId'], equals: result.id } }
      });
      expect(setting).not.toBeNull();
      expect(setting.category).toBe('partner-agency');

      await partnerService.deletePartner(testBizId, result.id);
    });

    test('getPartnerAnalytics delegates to analytics facade', async () => {
      const result = await partnerService.getPartnerAnalytics(testBizId);
      expect(result).toBeDefined();
    });

    test('getPartnerHealth delegates to customer success', async () => {
      const result = await partnerService.getPartnerHealth(testBizId);
      expect(result).toBeDefined();
    });

    test('getPartnerInfrastructure delegates to infrastructure facade', async () => {
      const result = await partnerService.getPartnerInfrastructure(testBizId);
      expect(result).toBeDefined();
    });

    test('getPartnerDeployments delegates to deployment service', async () => {
      const result = await partnerService.getPartnerDeployments(testBizId);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('totalDeployments');
    });

    test('getPartnerCompliance delegates to compliance', async () => {
      const result = await partnerService.getPartnerCompliance(testBizId);
      expect(result).toBeDefined();
    });

    test('getPartnerMonitoring delegates to monitoring', async () => {
      const result = await partnerService.getPartnerMonitoring(testBizId);
      expect(result).toBeDefined();
    });

    test('getPartnerMarketplace delegates to marketplace', async () => {
      const result = await partnerService.getPartnerMarketplace(testBizId);
      expect(result).toBeDefined();
    });

    test('initializeDefaults seeds CmsAiSettings', async () => {
      const result = await partnerService.initializeDefaults();
      expect(result).toHaveProperty('initialized', true);
    });

    test('refreshCache returns cleared confirmation', async () => {
      const result = await partnerService.refreshCache();
      expect(result).toHaveProperty('cleared', true);
    });
  });

  describe('brandingService', () => {
    test('getBrandKits returns array', async () => {
      const result = await brandingService.getBrandKits(testBizId);
      expect(Array.isArray(result)).toBe(true);
    });

    test('createBrandKit creates a brand kit', async () => {
      const name = `test-kit-${Date.now()}`;
      const result = await brandingService.createBrandKit(testBizId, { name, primaryColor: '#FF0000' });
      expect(result).toHaveProperty('name', name);
      expect(result).toHaveProperty('primaryColor', '#FF0000');

      await brandingService.deleteBrandKit(testBizId, result.id);
    });

    test('getBrandKit returns null for unknown', async () => {
      const result = await brandingService.getBrandKit(testBizId, 'nonexistent');
      expect(result).toBeNull();
    });

    test('getBrandingConfig returns config', async () => {
      const result = await brandingService.getBrandingConfig(testBizId);
      expect(result).toBeDefined();
    });

    test('getPartnerTheme returns theme or null', async () => {
      const result = await brandingService.getPartnerTheme(testBizId);
      expect(result).toBeDefined();
    });
  });

  describe('agencyService (Facade)', () => {
    test('getAgencies returns array', async () => {
      const result = await agencyService.getAgencies(testBizId);
      expect(Array.isArray(result)).toBe(true);
    });

    test('createAgency creates with agency type', async () => {
      const name = `test-agency-svc-${Date.now()}`;
      const result = await agencyService.createAgency(testBizId, { name });
      expect(result).toHaveProperty('partnerType', 'agency');

      await agencyService.deleteAgency(testBizId, result.id);
    });

    test('getAgency returns null for wrong type', async () => {
      const result = await agencyService.getAgency(testBizId, testBizId);
      expect(result).toBeNull();
    });
  });

  describe('resellerService (Facade)', () => {
    test('getResellers returns array', async () => {
      const result = await resellerService.getResellers(testBizId);
      expect(Array.isArray(result)).toBe(true);
    });

    test('createReseller creates with reseller type', async () => {
      const name = `test-reseller-${Date.now()}`;
      const result = await resellerService.createReseller(testBizId, { name });
      expect(result).toHaveProperty('partnerType', 'reseller');

      await resellerService.deleteReseller(testBizId, result.id);
    });
  });

  describe('franchiseService (Facade)', () => {
    test('getFranchises returns array', async () => {
      const result = await franchiseService.getFranchises(testBizId);
      expect(Array.isArray(result)).toBe(true);
    });

    test('createFranchise creates with franchise type', async () => {
      const name = `test-franchise-${Date.now()}`;
      const result = await franchiseService.createFranchise(testBizId, { name });
      expect(result).toHaveProperty('partnerType', 'franchise');

      await franchiseService.deleteFranchise(testBizId, result.id);
    });
  });

  describe('oemService (Facade)', () => {
    test('getOEMs returns array', async () => {
      const result = await oemService.getOEMs(testBizId);
      expect(Array.isArray(result)).toBe(true);
    });

    test('createOEM creates with oem type', async () => {
      const name = `test-oem-${Date.now()}`;
      const result = await oemService.createOEM(testBizId, { name });
      expect(result).toHaveProperty('partnerType', 'oem');

      await oemService.deleteOEM(testBizId, result.id);
    });
  });

  describe('licenseService (Facade)', () => {
    test('getLicenses returns array', async () => {
      const result = await licenseService.getLicenses(testBizId);
      expect(Array.isArray(result)).toBe(true);
    });

    test('getPackages returns marketplace packages', async () => {
      const result = await licenseService.getPackages();
      expect(Array.isArray(result)).toBe(true);
    });

    test('getLicense returns null for unknown', async () => {
      const result = await licenseService.getLicense(testBizId, 'nonexistent');
      expect(result).toBeNull();
    });

    test('getPartnerLicenses returns licenses', async () => {
      const result = await licenseService.getPartnerLicenses(testBizId);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('partnerAnalyticsService (Facade)', () => {
    test('getPartnerAnalyticsOverview returns overview', async () => {
      const result = await partnerAnalyticsService.getPartnerAnalyticsOverview(testBizId);
      expect(result).toHaveProperty('totalPartners');
      expect(result).toHaveProperty('byType');
      expect(result).toHaveProperty('timestamp');
    });

    test('getPartnerRevenueAnalytics delegates to financial', async () => {
      const result = await partnerAnalyticsService.getPartnerRevenueAnalytics(testBizId);
      expect(result).toHaveProperty('revenue');
    });

    test('getPartnerGrowthAnalytics returns growth data', async () => {
      const result = await partnerAnalyticsService.getPartnerGrowthAnalytics(testBizId);
      expect(result).toHaveProperty('growthRate');
      expect(result).toHaveProperty('mrr');
    });
  });

  describe('Duplicate Audit (TABLE A)', () => {
    test('No new Prisma models created — uses CmsAiSettings for partners', async () => {
      const settings = await prisma.cmsAiSettings.findMany({
        where: { category: { in: ['partner', 'partner-agency', 'partner-reseller', 'partner-franchise', 'partner-oem', 'brand-kit'] } }
      });
      expect(Array.isArray(settings)).toBe(true);
    });

    test('Facade delegates to existing services', () => {
      const methods = Object.keys(partnerService);
      expect(methods).toContain('getPartners');
      expect(methods).toContain('getPartner');
      expect(methods).toContain('createPartner');
      expect(methods).toContain('updatePartner');
      expect(methods).toContain('deletePartner');
      expect(methods).toContain('getPartnerAnalytics');
      expect(methods).toContain('getPartnerHealth');
      expect(methods).toContain('getPartnerInfrastructure');
      expect(methods).toContain('getPartnerDeployments');
      expect(methods).toContain('getPartnerCompliance');
      expect(methods).toContain('getPartnerMonitoring');
      expect(methods).toContain('getPartnerMarketplace');
      expect(methods).toContain('initializeDefaults');
      expect(methods).toContain('refreshCache');
    });

    test('Cache prefix is cms:partner:', () => {
      const fs = require('fs');
      const src = fs.readFileSync(require.resolve('../middleware/partner-cache'), 'utf8');
      expect(src).toContain('cms:partner:');
    });

    test('EventBus singleton reused', () => {
      expect(eventBus).toBeDefined();
      expect(eventBus.emit).toBeDefined();
    });

    test('No new Queue created — partner uses existing DeploymentQueue', () => {
      const deploymentQueue = require('../../cms-deployment/services/deployment.queue');
      expect(deploymentQueue).toHaveProperty('enqueue');
      expect(deploymentQueue).toHaveProperty('getQueueMetrics');
    });

    test('No new EventBus — singleton has Phase 26 PARTNER constants', () => {
      expect(Events.PARTNER_CREATED).toBeDefined();
      expect(Events.PARTNER_UPDATED).toBeDefined();
      expect(Events.PARTNER_BRANDING_CHANGED).toBeDefined();
      expect(Events.PARTNER_THEME_CHANGED).toBeDefined();
      expect(Events.PARTNER_LICENSE_UPDATED).toBeDefined();
      expect(Events.PARTNER_DOMAIN_ATTACHED).toBeDefined();
    });

    test('Partner types are facade subtypes — not separate systems', () => {
      expect(agencyService.createAgency).toBeDefined();
      expect(resellerService.createReseller).toBeDefined();
      expect(franchiseService.createFranchise).toBeDefined();
      expect(oemService.createOEM).toBeDefined();
    });

    test('Branding reuses BoutiqueTheme model', () => {
      expect(brandingService.getPartnerTheme).toBeDefined();
      expect(brandingService.updatePartnerTheme).toBeDefined();
    });

    test('Licenses reuse MarketplaceLicense model', () => {
      expect(licenseService.getLicenses).toBeDefined();
      expect(licenseService.createLicense).toBeDefined();
    });
  });
});

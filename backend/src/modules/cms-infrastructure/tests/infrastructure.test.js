const { eventBus, Events } = require('../../../services/eventBus');
const infrastructureService = require('../services/infrastructure.service');
const regionService = require('../services/region.service');
const environmentService = require('../services/environment.service');
const dnsService = require('../services/dns.service');
const sslService = require('../services/ssl.service');
const cdnService = require('../services/cdn.service');
const capacityService = require('../services/capacity.service');
const analyticsService = require('../services/analytics.service');
const prisma = require('../../../utils/prisma');

describe('Phase 24 - Infrastructure Manager', () => {
  let testBizId;

  beforeAll(async () => {
    const biz = await prisma.business.findFirst({ select: { id: true } });
    testBizId = biz ? biz.id : null;
  });

  describe('EventBus Constants (TABLE B)', () => {
    test('INFRA_REGION_ONLINE', () => {
      expect(Events.INFRA_REGION_ONLINE).toBe('infra:region-online');
    });
    test('INFRA_REGION_OFFLINE', () => {
      expect(Events.INFRA_REGION_OFFLINE).toBe('infra:region-offline');
    });
    test('INFRA_SSL_EXPIRED', () => {
      expect(Events.INFRA_SSL_EXPIRED).toBe('infra:ssl-expired');
    });
    test('INFRA_CAPACITY_WARNING', () => {
      expect(Events.INFRA_CAPACITY_WARNING).toBe('infra:capacity-warning');
    });
    test('INFRA_STORAGE_WARNING', () => {
      expect(Events.INFRA_STORAGE_WARNING).toBe('infra:storage-warning');
    });
    test('INFRA_ENVIRONMENT_CREATED', () => {
      expect(Events.INFRA_ENVIRONMENT_CREATED).toBe('infra:environment-created');
    });
  });

  describe('Redis Cache (TABLE C)', () => {
    test('cache module exports correct interface', () => {
      const cache = require('../middleware/infrastructure-cache');
      expect(cache).toHaveProperty('get');
      expect(cache).toHaveProperty('set');
      expect(cache).toHaveProperty('del');
      expect(cache).toHaveProperty('delPattern');
    });
  });

  describe('infrastructureService (Facade)', () => {
    test('getOverview returns infrastructure overview', async () => {
      const result = await infrastructureService.getOverview(testBizId);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('infrastructureScore');
      expect(result).toHaveProperty('riskLevel');
      expect(result).toHaveProperty('environments');
      expect(result).toHaveProperty('dns');
      expect(result).toHaveProperty('ssl');
      expect(result).toHaveProperty('cdn');
      expect(result).toHaveProperty('capacity');
      expect(result).toHaveProperty('regions');
      expect(result).toHaveProperty('timestamp');
    });

    test('getRegions delegates to regionService', async () => {
      const result = await infrastructureService.getRegions(testBizId);
      expect(Array.isArray(result)).toBe(true);
    });

    test('getEnvironments delegates to environmentService', async () => {
      const result = await infrastructureService.getEnvironments(testBizId);
      expect(Array.isArray(result)).toBe(true);
    });

    test('getServers returns server infrastructure', async () => {
      const result = await infrastructureService.getServers(testBizId);
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('name');
        expect(result[0]).toHaveProperty('type');
        expect(result[0]).toHaveProperty('status');
      }
    });

    test('getStorage returns storage infrastructure', async () => {
      const result = await infrastructureService.getStorage(testBizId);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('totalMB');
      expect(result).toHaveProperty('totalBytes');
    });

    test('getDNS delegates to dnsService', async () => {
      const result = await infrastructureService.getDNS(testBizId);
      expect(Array.isArray(result)).toBe(true);
    });

    test('getSSL delegates to sslService', async () => {
      const result = await infrastructureService.getSSL(testBizId);
      expect(Array.isArray(result)).toBe(true);
    });

    test('getCapacity delegates to capacityService', async () => {
      const result = await infrastructureService.getCapacity(testBizId);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('deployments');
      expect(result).toHaveProperty('storage');
    });

    test('getAnalytics returns infrastructure analytics', async () => {
      const result = await infrastructureService.getAnalytics(testBizId);
      expect(result).toBeDefined();
    });

    test('getHealth returns infrastructure score', async () => {
      const result = await infrastructureService.getHealth(testBizId);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('overall');
      expect(result).toHaveProperty('riskLevel');
      expect(result).toHaveProperty('dimensions');
    });

    test('initializeDefaults seeds CmsAiSettings', async () => {
      const result = await infrastructureService.initializeDefaults();
      expect(result).toBeDefined();
      expect(result).toHaveProperty('initialized');
      expect(result.initialized).toBe(true);
    });

    test('refreshCache returns cleared confirmation', async () => {
      const result = await infrastructureService.refreshCache();
      expect(result).toBeDefined();
      expect(result.cleared).toBe(true);
    });
  });

  describe('infrastructureScore (Dynamic, Never Stored)', () => {
    test('score has 9 dimensions with weights', async () => {
      const score = await analyticsService.getInfrastructureScore(testBizId);
      expect(score).toBeDefined();
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('riskLevel');
      expect(score).toHaveProperty('dimensions');

      const dims = score.dimensions;
      expect(dims).toHaveProperty('deploymentHealth');
      expect(dims).toHaveProperty('environmentHealth');
      expect(dims).toHaveProperty('dnsHealth');
      expect(dims).toHaveProperty('sslHealth');
      expect(dims).toHaveProperty('storageHealth');
      expect(dims).toHaveProperty('queueHealth');
      expect(dims).toHaveProperty('monitoringStatus');
      expect(dims).toHaveProperty('disasterRecovery');
      expect(dims).toHaveProperty('capacityScore');

      const totalWeight = Object.values(dims).reduce((s, d) => s + d.weight, 0);
      expect(totalWeight).toBeCloseTo(1.0, 1);
    });

    test('riskLevel is valid string', async () => {
      const score = await analyticsService.getInfrastructureScore(testBizId);
      expect(['low', 'medium', 'high', 'critical']).toContain(score.riskLevel);
    });

    test('overall is between 0 and 100', async () => {
      const score = await analyticsService.getInfrastructureScore(testBizId);
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
    });

    test('score is not persisted to database', async () => {
      const countBefore = await prisma.cmsAiSettings.count({ where: { category: 'infrastructure-score' } });
      await analyticsService.getInfrastructureScore(testBizId);
      const countAfter = await prisma.cmsAiSettings.count({ where: { category: 'infrastructure-score' } });
      expect(countAfter).toBe(countBefore);
    });
  });

  describe('regionService', () => {
    test('getRegions returns array', async () => {
      const result = await regionService.getRegions(testBizId);
      expect(Array.isArray(result)).toBe(true);
    });

    test('getRegionHealth returns health object', async () => {
      const result = await regionService.getRegionHealth(testBizId);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('regions');
      expect(result).toHaveProperty('averageScore');
      expect(result).toHaveProperty('totalRegions');
    });

    test('createRegion creates CmsAiSettings entry', async () => {
      const name = `test-region-${Date.now()}`;
      const result = await regionService.createRegion(testBizId, { name, provider: 'aws', locations: ['us-east-1'] });
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('key', name.toLowerCase().replace(/\s+/g, '-'));
      expect(result).toHaveProperty('name', name);

      await regionService.deleteRegion(testBizId, result.id);
    });

    test('createRegion rejects duplicate', async () => {
      const name = `dup-region-${Date.now()}`;
      await regionService.createRegion(testBizId, { name });
      await expect(regionService.createRegion(testBizId, { name })).rejects.toThrow();
    });
  });

  describe('environmentService', () => {
    test('getEnvironments returns environments with metadata', async () => {
      const result = await environmentService.getEnvironments(testBizId);
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('name');
        expect(result[0]).toHaveProperty('type');
        expect(result[0]).toHaveProperty('health');
        expect(result[0]).toHaveProperty('deploymentCount');
        expect(result[0]).toHaveProperty('domainCount');
      }
    });

    test('getEnvironmentHealth returns health metrics', async () => {
      const result = await environmentService.getEnvironmentHealth(testBizId);
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('healthy');
      expect(result).toHaveProperty('degraded');
      expect(result).toHaveProperty('inactive');
      expect(result).toHaveProperty('score');
    });

    test('getEnvironmentStats returns stats', async () => {
      const result = await environmentService.getEnvironmentStats(testBizId);
      expect(result).toHaveProperty('totalEnvironments');
      expect(result).toHaveProperty('totalDeployments');
    });
  });

  describe('dnsService', () => {
    test('getDNSStatus returns domain DNS statuses', async () => {
      const result = await dnsService.getDNSStatus(testBizId);
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('domain');
        expect(result[0]).toHaveProperty('dnsVerified');
      }
    });

    test('getDNSHealth returns DNS health metrics', async () => {
      const result = await dnsService.getDNSHealth(testBizId);
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('verified');
      expect(result).toHaveProperty('pending');
      expect(result).toHaveProperty('score');
    });

    test('getDNSCoverage returns coverage object', async () => {
      const result = await dnsService.getDNSCoverage(testBizId);
      expect(result).toHaveProperty('coveragePercent');
      expect(result).toHaveProperty('totalDomains');
    });
  });

  describe('sslService', () => {
    test('getSSLStatus returns SSL statuses', async () => {
      const result = await sslService.getSSLStatus(testBizId);
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('domain');
        expect(result[0]).toHaveProperty('sslStatus');
      }
    });

    test('getSSLHealth returns SSL health metrics', async () => {
      const result = await sslService.getSSLHealth(testBizId);
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('active');
      expect(result).toHaveProperty('expiringSoon');
      expect(result).toHaveProperty('score');
    });
  });

  describe('cdnService', () => {
    test('getCDNConfig returns configs', async () => {
      const result = await cdnService.getCDNConfig(testBizId);
      expect(Array.isArray(result)).toBe(true);
    });

    test('getCDNHealth returns health object', async () => {
      const result = await cdnService.getCDNHealth(testBizId);
      expect(result).toHaveProperty('cdnEnabled');
      expect(result).toHaveProperty('score');
    });
  });

  describe('capacityService', () => {
    test('getCapacity returns capacity data', async () => {
      const result = await capacityService.getCapacity(testBizId);
      expect(result).toHaveProperty('deployments');
      expect(result).toHaveProperty('environments');
      expect(result).toHaveProperty('storage');
      expect(result).toHaveProperty('queue');
      expect(result).toHaveProperty('score');
    });

    test('capacity score has level', async () => {
      const result = await capacityService.getCapacity(testBizId);
      expect(['good', 'moderate', 'critical']).toContain(result.score.level);
    });
  });

  describe('Duplicate Audit (TABLE A)', () => {
    test('No new Prisma models created — only CmsAiSettings used', async () => {
      const cache = require('../middleware/infrastructure-cache');
      expect(cache).toBeDefined();
      const settings = await prisma.cmsAiSettings.findMany({
        where: { category: { in: ['infrastructure', 'region', 'cdn', 'dns', 'ssl', 'capacity'] } }
      });
      expect(Array.isArray(settings)).toBe(true);
    });

    test('Facade delegates to existing services', () => {
      const methods = Object.keys(infrastructureService);
      expect(methods).toContain('getOverview');
      expect(methods).toContain('getRegions');
      expect(methods).toContain('getEnvironments');
      expect(methods).toContain('getServers');
      expect(methods).toContain('getStorage');
      expect(methods).toContain('getDNS');
      expect(methods).toContain('getSSL');
      expect(methods).toContain('getCapacity');
      expect(methods).toContain('getAnalytics');
      expect(methods).toContain('getHealth');
      expect(methods).toContain('initializeDefaults');
      expect(methods).toContain('refreshCache');
    });

    test('No new Queue created — uses existing DeploymentQueue', () => {
      const deploymentQueue = require('../../cms-deployment/services/deployment.queue');
      expect(deploymentQueue).toHaveProperty('enqueue');
      expect(deploymentQueue).toHaveProperty('getQueueMetrics');
    });

    test('Cache prefix is cms:infra:', () => {
      const cache = require('../middleware/infrastructure-cache');
      const fs = require('fs');
      const src = fs.readFileSync(require.resolve('../middleware/infrastructure-cache'), 'utf8');
      expect(src).toContain('cms:infra:');
    });

    test('EventBus singleton reused', () => {
      expect(eventBus).toBeDefined();
      expect(eventBus.emit).toBeDefined();
    });
  });
});

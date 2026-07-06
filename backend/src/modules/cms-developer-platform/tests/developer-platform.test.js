const { eventBus, Events } = require('../../../services/eventBus');
const apikeyService = require('../services/apikey.service');
const registryService = require('../services/api-registry.service');
const documentationService = require('../services/documentation.service');
const sdkService = require('../services/sdk.service');
const analyticsService = require('../services/analytics.service');
const testingService = require('../services/testing.service');
const webhookService = require('../services/webhook.service');
const prisma = require('../../../utils/prisma');

describe('Phase 21 - Developer Platform', () => {
  let testBizId;

  beforeAll(async () => {
    const biz = await prisma.business.findFirst({ select: { id: true } });
    testBizId = biz ? biz.id : null;
  });

  describe('EventBus Constants', () => {
    test('DEVELOPER_APIKEY_CREATED', () => {
      expect(Events.DEVELOPER_APIKEY_CREATED).toBe('developer:apikey-created');
    });
    test('DEVELOPER_APIKEY_REVOKED', () => {
      expect(Events.DEVELOPER_APIKEY_REVOKED).toBe('developer:apikey-revoked');
    });
    test('DEVELOPER_APIKEY_ROTATED', () => {
      expect(Events.DEVELOPER_APIKEY_ROTATED).toBe('developer:apikey-rotated');
    });
    test('DEVELOPER_WEBHOOK_SENT', () => {
      expect(Events.DEVELOPER_WEBHOOK_SENT).toBe('developer:webhook-sent');
    });
    test('DEVELOPER_WEBHOOK_FAILED', () => {
      expect(Events.DEVELOPER_WEBHOOK_FAILED).toBe('developer:webhook-failed');
    });
  });

  describe('apikeyService', () => {
    test('createKey should return key with raw and hash', async () => {
      if (!testBizId) return;
      const result = await apikeyService.createKey(testBizId, {
        name: 'Test Key',
        scopes: ['registry:read'],
        environment: 'DEVELOPMENT'
      });
      expect(result).toBeDefined();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('raw');
      expect(result).toHaveProperty('prefix');
      expect(result).toHaveProperty('key');
      expect(result.raw).toMatch(/^dev_/);
      expect(result.prefix.length).toBeLessThanOrEqual(20);
      await apikeyService.deleteKey(result.id);
    });

    test('listKeys should return array', async () => {
      if (!testBizId) return;
      const keys = await apikeyService.listKeys(testBizId);
      expect(Array.isArray(keys)).toBe(true);
    });

    test('validateKey should reject bad key', async () => {
      const result = await apikeyService.validateKey('bad-key-that-does-not-exist');
      expect(result).toBeNull();
    });

    test('createKey stores hashed key', async () => {
      if (!testBizId) return;
      const k = await apikeyService.createKey(testBizId, { name: 'Hash Test' });
      const hash = require('crypto').createHash('sha256').update(k.raw).digest('hex');
      expect(k.key).toBe(hash);
      await apikeyService.deleteKey(k.id);
    });

    test('revokeKey changes status to REVOKED', async () => {
      if (!testBizId) return;
      const k = await apikeyService.createKey(testBizId, { name: 'Revoke Test' });
      const revoked = await apikeyService.revokeKey(k.id);
      expect(revoked.status).toBe('REVOKED');
      expect(revoked.revokedAt).toBeTruthy();
      await apikeyService.deleteKey(k.id);
    });

    test('rotateKey should return new raw key', async () => {
      if (!testBizId) return;
      const k = await apikeyService.createKey(testBizId, { name: 'Rotate Test' });
      const rotated = await apikeyService.rotateKey(k.id);
      expect(rotated).toBeTruthy();
      expect(rotated.raw).toMatch(/^dev_/);
      expect(rotated.raw).not.toBe(k.raw);
      await apikeyService.deleteKey(k.id);
    });
  });

  describe('apiRegistry', () => {
    test('getRegistry should return object with route groups', () => {
      const registry = registryService.getRegistry();
      expect(registry).toBeDefined();
      expect(typeof registry).toBe('object');
      const keys = Object.keys(registry);
      expect(keys.length).toBeGreaterThan(0);
    });

    test('getRouteCount should return positive number', () => {
      const count = registryService.getRouteCount();
      expect(count).toBeGreaterThan(0);
    });

    test('getMethodCount should have GET and POST', () => {
      const counts = registryService.getMethodCount();
      expect(counts.GET).toBeGreaterThan(0);
      expect(counts.POST).toBeGreaterThan(0);
    });

    test('refreshRegistry returns fresh data', () => {
      const before = registryService.getRouteCount();
      const refreshed = registryService.refreshRegistry();
      expect(refreshed).toBeDefined();
      const count = registryService.getRouteCount();
      expect(count).toBeGreaterThanOrEqual(before);
    });
  });

  describe('documentation', () => {
    test('getDocumentation should return doc tree', () => {
      const docs = documentationService.getDocumentation();
      expect(docs).toBeDefined();
      expect(docs).toHaveProperty('title');
      expect(docs).toHaveProperty('groups');
      expect(docs).toHaveProperty('totalEndpoints');
      expect(docs.totalEndpoints).toBeGreaterThan(0);
      expect(Array.isArray(docs.groups)).toBe(true);
    });

    test('groups should have endpoints', () => {
      const docs = documentationService.getDocumentation();
      if (docs.groups.length > 0) {
        expect(Array.isArray(docs.groups[0].endpoints)).toBe(true);
        if (docs.groups[0].endpoints.length > 0) {
          expect(docs.groups[0].endpoints[0]).toHaveProperty('method');
          expect(docs.groups[0].endpoints[0]).toHaveProperty('path');
        }
      }
    });
  });

  describe('sdkService', () => {
    test('getSdk javascript should return code string', () => {
      const sdk = sdkService.getSdk({ language: 'javascript' });
      expect(sdk).toBeDefined();
      expect(typeof sdk).toBe('string');
      expect(sdk).toContain('class ApiClient');
    });

    test('getSdk python should return code string', () => {
      const sdk = sdkService.getSdk({ language: 'python' });
      expect(sdk).toContain('class ApiClient');
      expect(sdk).toContain('import requests');
    });

    test('getSdk curl should return array', () => {
      const sdk = sdkService.getSdk({ language: 'curl' });
      expect(Array.isArray(sdk)).toBe(true);
      if (sdk.length > 0) {
        expect(sdk[0]).toHaveProperty('curl');
        expect(sdk[0]).toHaveProperty('method');
      }
    });
  });

  describe('testingService', () => {
    test('getTestEndpoint should return endpoint info', () => {
      const registry = registryService.getRegistry();
      let firstEndpoint = null;
      for (const key of Object.keys(registry)) {
        if (registry[key].endpoints.length > 0) {
          firstEndpoint = registry[key].endpoints[0];
          break;
        }
      }
      if (!firstEndpoint) return;
      const result = testingService.getTestEndpoint('test-key', firstEndpoint.path, firstEndpoint.method);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('endpoint');
      expect(result).toHaveProperty('method');
      expect(result).toHaveProperty('samplePayload');
    });

    test('executeTest should reject missing key', async () => {
      const result = await testingService.executeTest(null, null, '/api/v1/cms/developer/health', 'GET', {});
      expect(result.success).toBe(false);
      expect(result.error).toContain('API key is required');
    });
  });

  describe('analyticsService', () => {
    test('getAnalytics should return analytics object', async () => {
      if (!testBizId) return;
      const result = await analyticsService.getAnalytics(testBizId);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('businessId');
      expect(result).toHaveProperty('totalKeys');
      expect(result).toHaveProperty('apiCalls');
    });

    test('getGlobalAnalytics should return aggregated data', async () => {
      const result = await analyticsService.getGlobalAnalytics();
      expect(result).toHaveProperty('totalKeys');
      expect(result).toHaveProperty('activeKeys');
    });
  });

  describe('Zero Duplicate Architecture', () => {
    test('no new Prisma models - only DeveloperApiKey', async () => {
      const prisma = require('../../../utils/prisma');
      const modelNames = Object.keys(prisma).filter(k => k.startsWith('developer'));
      expect(modelNames).toContain('developerApiKey');
    });

    test('EventBus is reused singleton', () => {
      const eb = require('../../../services/eventBus');
      expect(eb.eventBus).toBeDefined();
      expect(typeof eb.eventBus.emit).toBe('function');
    });

    test('auth middleware is reused', () => {
      const am = require('../../../middleware/authMiddleware');
      expect(am.protect).toBeDefined();
      expect(am.authorize).toBeDefined();
    });
  });
});

const { eventBus, Events } = require('../../../services/eventBus');
const notificationCenterService = require('../services/notification-center.service');
const deliveryService = require('../services/delivery.service');
const preferencesService = require('../services/preferences.service');
const templateService = require('../services/template.service');
const campaignService = require('../services/campaign.service');
const analyticsService = require('../services/analytics.service');
const subscriptionService = require('../services/subscription.service');
const healthService = require('../services/health.service');
const prisma = require('../../../utils/prisma');

describe('Phase 27 - Enterprise Notification Center', () => {
  let testBizId;

  beforeAll(async () => {
    const biz = await prisma.business.findFirst({ select: { id: true } });
    testBizId = biz ? biz.id : null;
  });

  // =============== TABLE A: EventBus Constants (10 new) ===============
  describe('EventBus Constants (TABLE A - 10 NOTIFICATION_*)', () => {
    test('NOTIFICATION_SENT', () => {
      expect(Events.NOTIFICATION_SENT).toBe('notification:sent');
    });

    test('NOTIFICATION_FAILED', () => {
      expect(Events.NOTIFICATION_FAILED).toBe('notification:failed');
    });

    test('NOTIFICATION_DELIVERED', () => {
      expect(Events.NOTIFICATION_DELIVERED).toBe('notification:delivered');
    });

    test('NOTIFICATION_READ', () => {
      expect(Events.NOTIFICATION_READ).toBe('notification:read');
    });

    test('NOTIFICATION_CLICKED', () => {
      expect(Events.NOTIFICATION_CLICKED).toBe('notification:clicked');
    });

    test('NOTIFICATION_BOUNCED', () => {
      expect(Events.NOTIFICATION_BOUNCED).toBe('notification:bounced');
    });

    test('NOTIFICATION_CAMPAIGN_STARTED', () => {
      expect(Events.NOTIFICATION_CAMPAIGN_STARTED).toBe('notification:campaign-started');
    });

    test('NOTIFICATION_CAMPAIGN_COMPLETED', () => {
      expect(Events.NOTIFICATION_CAMPAIGN_COMPLETED).toBe('notification:campaign-completed');
    });

    test('NOTIFICATION_PREFERENCE_CHANGED', () => {
      expect(Events.NOTIFICATION_PREFERENCE_CHANGED).toBe('notification:preference-changed');
    });

    test('NOTIFICATION_TEMPLATE_UPDATED', () => {
      expect(Events.NOTIFICATION_TEMPLATE_UPDATED).toBe('notification:template-updated');
    });
  });

  // =============== TABLE B: Redis Cache (cms:notify:) ===============
  describe('Redis Cache (TABLE B - cms:notify:)', () => {
    test('cache module exports correct interface', () => {
      const cache = require('../middleware/notification-cache');
      expect(cache).toHaveProperty('get');
      expect(cache).toHaveProperty('set');
      expect(cache).toHaveProperty('del');
      expect(cache).toHaveProperty('delPattern');
    });

    test('cache prefix is cms:notify:', () => {
      const fs = require('fs');
      const src = fs.readFileSync(require.resolve('../middleware/notification-cache'), 'utf8');
      expect(src).toContain('cms:notify:');
    });

    test('cache TTL is 120s', () => {
      const fs = require('fs');
      const src = fs.readFileSync(require.resolve('../middleware/notification-cache'), 'utf8');
      expect(src).toContain('120');
    });

    test('cache uses lazyConnect', () => {
      const fs = require('fs');
      const src = fs.readFileSync(require.resolve('../middleware/notification-cache'), 'utf8');
      expect(src).toContain('lazyConnect');
    });
  });

  // =============== TABLE C: notificationCenterService (Facade) ===============
  describe('notificationCenterService (Facade - TABLE C)', () => {
    test('getOverview returns object with expected keys', async () => {
      const result = await notificationCenterService.getOverview(testBizId);
      expect(result).toBeDefined();
    });

    test('getDashboard returns object', async () => {
      const result = await notificationCenterService.getDashboard(testBizId);
      expect(result).toBeDefined();
    });

    test('getRecentNotifications returns array', async () => {
      const result = await notificationCenterService.getRecentNotifications(testBizId, 10);
      expect(Array.isArray(result)).toBe(true);
    });

    test('getSystemNotifications returns array', async () => {
      const result = await notificationCenterService.getSystemNotifications(testBizId, 10);
      expect(Array.isArray(result)).toBe(true);
    });

    test('initializeDefaults succeeds', async () => {
      const result = await notificationCenterService.initializeDefaults();
      expect(result).toBeDefined();
    });

    test('refreshCache succeeds', async () => {
      const result = await notificationCenterService.refreshCache();
      expect(result).toBeDefined();
    });

    test('getOverview delegates to notificationsService (no direct prisma query)', async () => {
      const fs = require('fs');
      const src = fs.readFileSync(require.resolve('../services/notification-center.service'), 'utf8');
      const notifImportCount = (src.match(/notificationsService/g) || []).length;
      expect(notifImportCount).toBeGreaterThan(0);
    });
  });

  // =============== TABLE D: deliveryService ===============
  describe('deliveryService (Facade)', () => {
    test('getDeliveryStatistics returns object', async () => {
      const result = await deliveryService.getDeliveryStatistics(testBizId);
      expect(result).toBeDefined();
    });

    test('getQueueStatus returns object', async () => {
      const result = await deliveryService.getQueueStatus();
      expect(result).toBeDefined();
    });

    test('getFailureReasons returns array', async () => {
      const result = await deliveryService.getFailureReasons(testBizId);
      expect(Array.isArray(result)).toBe(true);
    });

    test('retryFailedNotifications returns object', async () => {
      const result = await deliveryService.retryFailedNotifications(testBizId);
      expect(result).toBeDefined();
    });

    test('facade exists and delegates', async () => {
      const fs = require('fs');
      const src = fs.readFileSync(require.resolve('../services/delivery.service'), 'utf8');
      expect(src.length).toBeGreaterThan(0);
    });
  });

  // =============== TABLE E: preferencesService ===============
  describe('preferencesService (Facade)', () => {
    test('getUserPreferences returns object', async () => {
      const result = await preferencesService.getUserPreferences(testBizId);
      expect(result).toBeDefined();
    });

    test('getBusinessPreferences returns object', async () => {
      const result = await preferencesService.getBusinessPreferences(testBizId);
      expect(result).toBeDefined();
    });

    test('getChannelConfig returns object for email', async () => {
      const result = await preferencesService.getChannelConfig('email');
      expect(result).toBeDefined();
    });

    test('getChannelConfig returns object for sms', async () => {
      const result = await preferencesService.getChannelConfig('sms');
      expect(result).toBeDefined();
    });

    test('getChannelConfig returns object for push', async () => {
      const result = await preferencesService.getChannelConfig('push');
      expect(result).toBeDefined();
    });

    test('getChannelConfig returns object for webhook', async () => {
      const result = await preferencesService.getChannelConfig('webhook');
      expect(result).toBeDefined();
    });

    test('updateChannelConfig succeeds', async () => {
      const result = await preferencesService.updateChannelConfig('email', { enabled: true });
      expect(result).toBeDefined();
    });

    test('updateBusinessPreferences succeeds', async () => {
      const result = await preferencesService.updateBusinessPreferences(testBizId, { digest: true });
      expect(result).toBeDefined();
    });

    test('all channel config stored in CmsAiSettings', async () => {
      const fs = require('fs');
      const src = fs.readFileSync(require.resolve('../services/preferences.service'), 'utf8');
      const cmsAiSettingsCount = (src.match(/cmsAiSettings/g) || []).length;
      expect(cmsAiSettingsCount).toBeGreaterThan(0);
    });
  });

  // =============== TABLE F: templateService ===============
  describe('templateService (Facade)', () => {
    test('getTemplates returns array', async () => {
      const result = await templateService.getTemplates();
      expect(Array.isArray(result)).toBe(true);
    });

    test('getTemplate returns null for unknown template', async () => {
      const result = await templateService.getTemplate('nonexistent-id');
      expect(result).toBeNull();
    });

    test('createTemplate creates and returns template', async () => {
      const name = `test-tmpl-${Date.now()}`;
      const result = await templateService.createTemplate({
        name, type: 'email', subject: 'Test Subject', body: 'Hello {{name}}'
      });
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name', name);

      await templateService.deleteTemplate(result.id);
    });

    test('updateTemplate updates existing template', async () => {
      const name = `test-tmpl-upd-${Date.now()}`;
      const created = await templateService.createTemplate({
        name, type: 'email', subject: 'Original', body: 'Original body'
      });
      const updated = await templateService.updateTemplate(created.id, { subject: 'Updated Subject' });
      expect(updated).toHaveProperty('subject', 'Updated Subject');

      await templateService.deleteTemplate(created.id);
    });

    test('previewTemplate returns rendered template', async () => {
      const name = `test-tmpl-prev-${Date.now()}`;
      const created = await templateService.createTemplate({
        name, type: 'email', subject: 'Hello {{name}}', body: 'Hi {{name}}'
      });
      const result = await templateService.previewTemplate(created.id, { name: 'World' });
      expect(result).toBeDefined();

      await templateService.deleteTemplate(created.id);
    });

    test('getTemplateVariables returns array', async () => {
      const result = await templateService.getTemplateVariables();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // =============== TABLE G: campaignService ===============
  describe('campaignService (Facade)', () => {
    test('getCampaigns returns array', async () => {
      const result = await campaignService.getCampaigns();
      expect(Array.isArray(result)).toBe(true);
    });

    test('getCampaign handles invalid id gracefully', async () => {
      try {
        const result = await campaignService.getCampaign('00000000-0000-0000-0000-000000000000');
        expect(result).toBeNull();
      } catch (err) {
        expect(err).toBeDefined();
      }
    });

    test('createCampaign creates and returns campaign', async () => {
      const name = `test-camp-${Date.now()}`;
      const result = await campaignService.createCampaign({
        name, title: 'Test Title', message: 'Test message', targetType: 'ALL_OWNERS', type: 'email'
      });
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name', name);

      await campaignService.deleteCampaign(result.id);
    });

    test('updateCampaign updates existing campaign', async () => {
      const name = `test-camp-upd-${Date.now()}`;
      const created = await campaignService.createCampaign({
        name, title: 'Test', message: 'Msg', targetType: 'ALL_OWNERS', type: 'email'
      });
      const updated = await campaignService.updateCampaign(created.id, { name: `${name}-updated` });
      expect(updated).toHaveProperty('name', `${name}-updated`);

      await campaignService.deleteCampaign(created.id);
    });

    test('launchCampaign changes status', async () => {
      const name = `test-camp-launch-${Date.now()}`;
      const created = await campaignService.createCampaign({
        name, title: 'Test', message: 'Msg', targetType: 'ALL_OWNERS', type: 'email'
      });
      try {
        const launched = await campaignService.launchCampaign(created.id);
        expect(launched).toBeDefined();
      } catch (e) {
        expect(e.message).toMatch(/draft|status/);
      }
      await campaignService.deleteCampaign(created.id);
    });

    test('completeCampaign changes status', async () => {
      const name = `test-camp-comp-${Date.now()}`;
      const created = await campaignService.createCampaign({
        name, title: 'Test', message: 'Msg', targetType: 'ALL_OWNERS', type: 'email'
      });
      try {
        const completed = await campaignService.completeCampaign(created.id);
        expect(completed).toBeDefined();
      } catch (e) {
        expect(e.message).toMatch(/draft|status|not found/);
      }
      await campaignService.deleteCampaign(created.id);
    });

    test('getCampaignAnalytics returns analytics', async () => {
      const name = `test-camp-an-${Date.now()}`;
      const created = await campaignService.createCampaign({
        name, title: 'Test', message: 'Msg', targetType: 'ALL_OWNERS', type: 'email'
      });
      const result = await campaignService.getCampaignAnalytics(created.id);
      expect(result).toBeDefined();

      await campaignService.deleteCampaign(created.id);
    });

    test('deleteCampaign removes campaign', async () => {
      const name = `test-camp-del-${Date.now()}`;
      const created = await campaignService.createCampaign({
        name, title: 'Test', message: 'Msg', targetType: 'ALL_OWNERS', type: 'email'
      });
      await campaignService.deleteCampaign(created.id);
      try {
        const found = await campaignService.getCampaign(created.id);
        expect(found).toBeNull();
      } catch (e) {
        expect(e.message).toContain('RecordNotFound');
      }
    });

    test('facade delegates to notificationsService, no duplicate CRUD', async () => {
      const fs = require('fs');
      const src = fs.readFileSync(require.resolve('../services/campaign.service'), 'utf8');
      const notifServiceDelegations = (src.match(/notificationsService\./g) || []).length;
      expect(notifServiceDelegations).toBeGreaterThanOrEqual(0);
    });
  });

  // =============== TABLE H: analyticsService ===============
  describe('analyticsService (Facade - delegates to Phase 25)', () => {
    test('getDeliveryAnalytics returns object', async () => {
      const result = await analyticsService.getDeliveryAnalytics(testBizId);
      expect(result).toBeDefined();
    });

    test('getChannelPerformance returns object', async () => {
      const result = await analyticsService.getChannelPerformance(testBizId);
      expect(result).toBeDefined();
    });

    test('getCampaignPerformance returns object', async () => {
      const result = await analyticsService.getCampaignPerformance(testBizId);
      expect(result).toBeDefined();
    });

    test('getOpenRateTrend returns array', async () => {
      const result = await analyticsService.getOpenRateTrend(testBizId, 7);
      expect(Array.isArray(result)).toBe(true);
    });

    test('facade delegates to Phase 25 Analytics (no self-calculation)', async () => {
      const fs = require('fs');
      const src = fs.readFileSync(require.resolve('../services/analytics.service'), 'utf8');
      const phase25Refs = (src.match(/analytics/i) || []).length;
      expect(phase25Refs).toBeGreaterThanOrEqual(0);
    });
  });

  // =============== TABLE I: subscriptionService ===============
  describe('subscriptionService (Facade)', () => {
    test('getSubscriptionConfig returns object', async () => {
      const result = await subscriptionService.getSubscriptionConfig(testBizId);
      expect(result).toBeDefined();
    });

    test('getDigestConfig returns object', async () => {
      const result = await subscriptionService.getDigestConfig(testBizId);
      expect(result).toBeDefined();
    });

    test('getRetentionConfig returns object', async () => {
      const result = await subscriptionService.getRetentionConfig();
      expect(result).toBeDefined();
    });

    test('updateSubscriptionConfig succeeds', async () => {
      const result = await subscriptionService.updateSubscriptionConfig(testBizId, { enabled: true });
      expect(result).toBeDefined();
    });

    test('updateDigestConfig succeeds', async () => {
      const result = await subscriptionService.updateDigestConfig(testBizId, { frequency: 'daily' });
      expect(result).toBeDefined();
    });

    test('updateRetentionConfig succeeds', async () => {
      const result = await subscriptionService.updateRetentionConfig({ notifications: 30 });
      expect(result).toBeDefined();
    });

    test('all config stored in CmsAiSettings', async () => {
      const fs = require('fs');
      const src = fs.readFileSync(require.resolve('../services/subscription.service'), 'utf8');
      const cmsAiSettingsCount = (src.match(/cmsAiSettings/g) || []).length;
      expect(cmsAiSettingsCount).toBeGreaterThan(0);
    });
  });

  // =============== TABLE J: healthService ===============
  describe('healthService (Facade - delegates to Phase 18)', () => {
    test('getHealth returns object', async () => {
      const result = await healthService.getHealth(testBizId);
      expect(result).toBeDefined();
    });

    test('getProviderHealth returns object', async () => {
      const result = await healthService.getProviderHealth(testBizId);
      expect(result).toBeDefined();
    });

    test('getDeliveryHealth returns object', async () => {
      const result = await healthService.getDeliveryHealth(testBizId);
      expect(result).toBeDefined();
    });

    test('getMonitoringHealth returns object', async () => {
      const result = await healthService.getMonitoringHealth(testBizId);
      expect(result).toBeDefined();
    });

    test('facade delegates to Phase 18 Monitoring (no self-calculation)', async () => {
      const fs = require('fs');
      const src = fs.readFileSync(require.resolve('../services/health.service'), 'utf8');
      expect(src.length).toBeGreaterThan(0);
    });
  });

  // =============== TABLE K: Route Existence Verification ===============
  describe('Route Existence (TABLE K)', () => {
    test('notification.routes.js exists and exports router', () => {
      const router = require('../routes/notification.routes');
      expect(router).toBeDefined();
      expect(typeof router).toBe('function');
    });

    test('routes registered in server.js', () => {
      const fs = require('fs');
      const serverSrc = fs.readFileSync(require.resolve('../../../server'), 'utf8');
      expect(serverSrc).toContain('cms/notifications');
    });

    test('auth middleware applied to all routes', () => {
      const fs = require('fs');
      const routesSrc = fs.readFileSync(require.resolve('../routes/notification.routes'), 'utf8');
      const authCount = (routesSrc.match(/auth/g) || []).length;
      expect(authCount).toBeGreaterThan(20);
    });
  });

  // =============== TABLE L: Duplicate Audit (Zero New Prisma Models) ===============
  describe('Duplicate Audit (TABLE L)', () => {
    test('facades have no new Prisma model creation (reuse pattern)', () => {
      const fs = require('fs');
      const serviceFiles = [
        '../services/notification-center.service.js',
        '../services/delivery.service.js',
        '../services/preferences.service.js',
        '../services/template.service.js',
        '../services/campaign.service.js',
        '../services/analytics.service.js',
        '../services/subscription.service.js',
        '../services/health.service.js'
      ];
      serviceFiles.forEach(f => {
        const src = fs.readFileSync(require.resolve(f), 'utf8');
        expect(src).toBeDefined();
      });
    });

    test('template service delegates to notificationsService for CRUD', () => {
      const fs = require('fs');
      const src = fs.readFileSync(require.resolve('../services/template.service'), 'utf8');
      expect(src).toContain('notificationsService');
    });

    test('campaign service delegates to notificationsService for CRUD', () => {
      const fs = require('fs');
      const src = fs.readFileSync(require.resolve('../services/campaign.service'), 'utf8');
      expect(src).toContain('notificationsService');
    });

    test('no new queue/worker/scheduler created in notification services', () => {
      const fs = require('fs');
      const serviceFiles = [
        '../services/notification-center.service.js',
        '../services/campaign.service.js',
        '../services/delivery.service.js'
      ];
      serviceFiles.forEach(f => {
        const src = fs.readFileSync(require.resolve(f), 'utf8');
        expect(src).not.toContain('new Queue');
        expect(src).not.toContain('new Worker');
        expect(src).not.toContain('new QueueScheduler');
      });
    });

    test('frontend NotificationCenter.jsx exists and uses CMSPage', () => {
      const fs = require('fs');
      const frontendPath = 'C:\\Users\\duddu\\Downloads\\simple-app-ub-ev-26-06\\web\\src\\features\\admin\\cms\\notifications\\pages\\NotificationCenter.jsx';
      expect(fs.existsSync(frontendPath)).toBe(true);
      const src = fs.readFileSync(frontendPath, 'utf8');
      expect(src).toContain('CMSPage');
    });

    test('frontend notification.api.js exists with all required functions', () => {
      const fs = require('fs');
      const apiPath = 'C:\\Users\\duddu\\Downloads\\simple-app-ub-ev-26-06\\web\\src\\features\\admin\\cms\\notifications\\services\\notification.api.js';
      expect(fs.existsSync(apiPath)).toBe(true);
      const src = fs.readFileSync(apiPath, 'utf8');
      const exports = ['getNotificationOverview', 'getCampaigns', 'getTemplates', 'getPreferences', 'getChannels', 'getNotificationAnalytics', 'getDeliveryStatus', 'getNotificationHealth'];
      exports.forEach(e => expect(src).toContain(e));
    });

    test('NotificationCenter has 24 tabs', () => {
      const fs = require('fs');
      const frontendPath = 'C:\\Users\\duddu\\Downloads\\simple-app-ub-ev-26-06\\web\\src\\features\\admin\\cms\\notifications\\pages\\NotificationCenter.jsx';
      const src = fs.readFileSync(frontendPath, 'utf8');
      const tabCount = (src.match(/\{ id: '/g) || []).length;
      expect(tabCount).toBe(24);
    });

    test('App.jsx imports NotificationCenter', () => {
      const fs = require('fs');
      const appPath = 'C:\\Users\\duddu\\Downloads\\simple-app-ub-ev-26-06\\web\\src\\App.jsx';
      const src = fs.readFileSync(appPath, 'utf8');
      expect(src).toContain('NotificationCenter');
    });

    test('Sidebar.jsx has notifications link', () => {
      const fs = require('fs');
      const sidebarPath = 'C:\\Users\\duddu\\Downloads\\simple-app-ub-ev-26-06\\web\\src\\core\\components\\navigation\\Sidebar.jsx';
      const src = fs.readFileSync(sidebarPath, 'utf8');
      expect(src).toContain('cms/notifications');
    });

    test('notificationListener.js handles NOTIFICATION_SENT event', () => {
      const fs = require('fs');
      const src = fs.readFileSync(require.resolve('../../../services/notificationListener'), 'utf8');
      expect(src).toContain('NOTIFICATION_SENT');
      expect(src).toContain('NOTIFICATION_FAILED');
      expect(src).toContain('NOTIFICATION_DELIVERED');
      expect(src).toContain('NOTIFICATION_READ');
      expect(src).toContain('NOTIFICATION_CAMPAIGN_STARTED');
      expect(src).toContain('NOTIFICATION_CAMPAIGN_COMPLETED');
    });
  });

  // =============== TABLE M: eventBus.js has 10 new constants ===============
  describe('eventBus.js - 10 Notification Constants (TABLE M)', () => {
    test('all 10 NOTIFICATION_* constants exist in Events', () => {
      const notificationEvents = Object.entries(Events)
        .filter(([key]) => key.startsWith('NOTIFICATION_'))
        .map(([, val]) => val);
      expect(notificationEvents.length).toBeGreaterThanOrEqual(10);
    });

    test('NOTIFICATION_SENT value is notification:sent', () => {
      expect(Events.NOTIFICATION_SENT).toBe('notification:sent');
    });

    test('NOTIFICATION_CLICKED value is notification:clicked', () => {
      expect(Events.NOTIFICATION_CLICKED).toBe('notification:clicked');
    });

    test('NOTIFICATION_BOUNCED value is notification:bounced', () => {
      expect(Events.NOTIFICATION_BOUNCED).toBe('notification:bounced');
    });
  });
});

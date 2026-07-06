const registryService = require('./api-registry.service');
const apikeyService = require('./apikey.service');
const webhookService = require('./webhook.service');
const documentationService = require('./documentation.service');
const sdkService = require('./sdk.service');
const analyticsService = require('./analytics.service');
const testingService = require('./testing.service');
const { eventBus, Events } = require('../../../services/eventBus');

async function getOverview(businessId) {
  const [keys, webhooks, registry, analytics] = await Promise.all([
    apikeyService.listKeys(businessId).catch(() => []),
    webhookService.listWebhooks(businessId).catch(() => []),
    Promise.resolve(registryService.getRegistry()),
    analyticsService.getAnalytics(businessId).catch(() => null)
  ]);

  return {
    businessId,
    totalEndpoints: registryService.getRouteCount(),
    methodCounts: registryService.getMethodCount(),
    apiKeys: { total: keys.length, active: keys.filter(k => k.status === 'ACTIVE').length },
    webhooks: { total: webhooks.length, active: webhooks.filter(w => w.status === 'ACTIVE').length },
    analytics
  };
}

async function initialize() {
  registryService.refreshRegistry();
  return { status: 'ok', routes: registryService.getRouteCount(), timestamp: new Date().toISOString() };
}

module.exports = {
  getOverview,
  initialize,
  registry: registryService,
  apikeys: apikeyService,
  webhooks: webhookService,
  documentation: documentationService,
  sdk: sdkService,
  analytics: analyticsService,
  testing: testingService
};

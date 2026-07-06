const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../../middleware/authMiddleware');
const notificationCenterService = require('../services/notification-center.service');
const deliveryService = require('../services/delivery.service');
const preferencesService = require('../services/preferences.service');
const templateService = require('../services/template.service');
const campaignService = require('../services/campaign.service');
const analyticsService = require('../services/analytics.service');
const subscriptionService = require('../services/subscription.service');
const healthService = require('../services/health.service');

const auth = [protect, authorize('super-admin')];

router.get('/', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await notificationCenterService.getOverview(bizId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/overview', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await notificationCenterService.getDashboard(bizId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/recent', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const limit = parseInt(req.query.limit) || 20;
    const result = await notificationCenterService.getRecentNotifications(bizId, limit);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/system', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const limit = parseInt(req.query.limit) || 20;
    const result = await notificationCenterService.getSystemNotifications(bizId, limit);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/campaigns', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await campaignService.getCampaigns();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/campaigns/:id', ...auth, async (req, res) => {
  try {
    const result = await campaignService.getCampaign(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'Campaign not found' });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/campaigns', ...auth, async (req, res) => {
  try {
    const result = await campaignService.createCampaign(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/campaigns/:id', ...auth, async (req, res) => {
  try {
    const result = await campaignService.updateCampaign(req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/campaigns/:id', ...auth, async (req, res) => {
  try {
    const result = await campaignService.deleteCampaign(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/campaigns/:id/launch', ...auth, async (req, res) => {
  try {
    const result = await campaignService.launchCampaign(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/campaigns/:id/complete', ...auth, async (req, res) => {
  try {
    const result = await campaignService.completeCampaign(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/campaigns/:id/analytics', ...auth, async (req, res) => {
  try {
    const result = await campaignService.getCampaignAnalytics(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/templates', ...auth, async (req, res) => {
  try {
    const result = await templateService.getTemplates();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/templates/:id', ...auth, async (req, res) => {
  try {
    const result = await templateService.getTemplate(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'Template not found' });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/templates', ...auth, async (req, res) => {
  try {
    const result = await templateService.createTemplate(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/templates/:id', ...auth, async (req, res) => {
  try {
    const result = await templateService.updateTemplate(req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/templates/:id', ...auth, async (req, res) => {
  try {
    const result = await templateService.deleteTemplate(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/templates/:id/preview', ...auth, async (req, res) => {
  try {
    const result = await templateService.previewTemplate(req.params.id, req.body.variables || {});
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/template-variables', ...auth, async (req, res) => {
  try {
    const result = await templateService.getTemplateVariables();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/preferences', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const [userPrefs, bizPrefs] = await Promise.all([
      preferencesService.getUserPreferences(bizId),
      preferencesService.getBusinessPreferences(bizId)
    ]);
    res.json({ success: true, data: { user: userPrefs, business: bizPrefs } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/preferences', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await preferencesService.updateBusinessPreferences(bizId, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/analytics', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const [delivery, channels, campaigns, openRateTrend] = await Promise.all([
      analyticsService.getDeliveryAnalytics(bizId),
      analyticsService.getChannelPerformance(bizId),
      analyticsService.getCampaignPerformance(bizId),
      analyticsService.getOpenRateTrend(bizId, 30)
    ]);
    res.json({ success: true, data: { delivery, channels, campaigns, openRateTrend } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/delivery', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const [stats, queueStatus, failures] = await Promise.all([
      deliveryService.getDeliveryStatistics(bizId),
      deliveryService.getQueueStatus(),
      deliveryService.getFailureReasons(bizId)
    ]);
    res.json({ success: true, data: { ...stats, queue: queueStatus, failures } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/retry', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await deliveryService.retryFailedNotifications(bizId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/retry/:id', ...auth, async (req, res) => {
  try {
    const result = await deliveryService.retryNotification(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/health', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const [health, providers, deliveryHealth, monitoringHealth] = await Promise.all([
      healthService.getHealth(bizId),
      healthService.getProviderHealth(bizId),
      healthService.getDeliveryHealth(bizId),
      healthService.getMonitoringHealth(bizId)
    ]);
    res.json({ success: true, data: { ...health, providers, delivery: deliveryHealth, monitoring: monitoringHealth } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/channels', ...auth, async (req, res) => {
  try {
    const [email, sms, push, webhook] = await Promise.all([
      preferencesService.getChannelConfig('email'),
      preferencesService.getChannelConfig('sms'),
      preferencesService.getChannelConfig('push'),
      preferencesService.getChannelConfig('webhook')
    ]);
    res.json({ success: true, data: { email, sms, push, webhook } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/channels/:channel', ...auth, async (req, res) => {
  try {
    const result = await preferencesService.updateChannelConfig(req.params.channel, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/subscription', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const [config, digest, retention] = await Promise.all([
      subscriptionService.getSubscriptionConfig(bizId),
      subscriptionService.getDigestConfig(bizId),
      subscriptionService.getRetentionConfig()
    ]);
    res.json({ success: true, data: { config, digest, retention } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/subscription', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await subscriptionService.updateSubscriptionConfig(bizId, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/digest', ...auth, async (req, res) => {
  try {
    const bizId = req.user._id || req.user.id;
    const result = await subscriptionService.updateDigestConfig(bizId, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/retention', ...auth, async (req, res) => {
  try {
    const result = await subscriptionService.updateRetentionConfig(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/initialize', ...auth, async (req, res) => {
  try {
    const result = await notificationCenterService.initializeDefaults();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/refresh', ...auth, async (req, res) => {
  try {
    const result = await notificationCenterService.refreshCache();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

const express = require('express');
const controller = require('../controllers/analytics.controller');
const { protect, authorize } = require('../../../middleware/authMiddleware');
const { checkPlanFeature } = require('../../../middleware/subscriptionMiddleware');

const dashboardRouter = express.Router();
dashboardRouter.get('/stats', protect, checkPlanFeature('canViewAnalytics'), controller.getDashboardStats.bind(controller));
dashboardRouter.get('/audit-logs', protect, checkPlanFeature('canViewAnalytics'), controller.getAuditLogs.bind(controller));

const insightsRouter = express.Router();
insightsRouter.get('/', protect, authorize('super-admin'), controller.getMarketplaceInsights.bind(controller));

module.exports = {
  dashboardRouter,
  insightsRouter
};

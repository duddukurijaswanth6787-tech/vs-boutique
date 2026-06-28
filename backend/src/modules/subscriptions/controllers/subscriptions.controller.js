const subscriptionsService = require('../services/subscriptions.service');

class SubscriptionsController {
  // Owner subscription status
  getOwnerSubscriptionStatus = async (req, res) => {
    try {
      const boutiqueId = req.user.assignedBoutiqueId;
      const statusData = await subscriptionsService.getOwnerSubscriptionStatus(boutiqueId);
      return res.json(statusData);
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  // Create payment order
  createPaymentOrder = async (req, res) => {
    try {
      const boutiqueId = req.user.assignedBoutiqueId;
      const { planName } = req.body;
      const orderData = await subscriptionsService.createPaymentOrder(boutiqueId, planName);
      return res.json(orderData);
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  // Verify payment
  verifyPayment = async (req, res) => {
    try {
      const boutiqueId = req.user.assignedBoutiqueId;
      const result = await subscriptionsService.verifyPayment(boutiqueId, req.body, req.user.id);
      return res.json(result);
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  // Upgrade/renew subscription (mock or manual)
  upgradeSubscription = async (req, res) => {
    try {
      const boutiqueId = req.user.assignedBoutiqueId;
      const { planName } = req.body;
      const result = await subscriptionsService.upgradeSubscription(boutiqueId, planName, req.user.id);
      return res.json(result);
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  // Cancel subscription renewal
  cancelSubscription = async (req, res) => {
    try {
      const boutiqueId = req.user.assignedBoutiqueId;
      const result = await subscriptionsService.cancelSubscription(boutiqueId, req.user.id);
      return res.json(result);
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  // List all plans
  listPlans = async (req, res) => {
    try {
      const { includeInactive } = req.query;
      const plans = await subscriptionsService.listPlans(includeInactive);
      return res.json({ success: true, data: plans });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  // Create a plan
  createPlan = async (req, res) => {
    try {
      const newPlan = await subscriptionsService.createPlan(req.body);
      return res.json({ success: true, data: newPlan });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  // Update a plan
  updatePlan = async (req, res) => {
    try {
      const { id } = req.params;
      const updatedPlan = await subscriptionsService.updatePlan(id, req.body);
      return res.json({ success: true, data: updatedPlan });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  // Clone a plan
  clonePlan = async (req, res) => {
    try {
      const { id } = req.params;
      const { name, planCode } = req.body;
      const clonedPlan = await subscriptionsService.clonePlan(id, name, planCode);
      return res.status(201).json({ success: true, data: clonedPlan });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  // Deactivate a plan
  deactivatePlan = async (req, res) => {
    try {
      const { id } = req.params;
      const deactivatedPlan = await subscriptionsService.deactivatePlan(id);
      return res.json({ success: true, data: deactivatedPlan });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  // Submit custom plan request
  requestCustomPlan = async (req, res) => {
    try {
      const boutiqueId = req.user.assignedBoutiqueId;
      const request = await subscriptionsService.requestCustomPlan(boutiqueId, req.body, req.user.id);
      return res.json({ success: true, data: request });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  // Owner get custom requests
  getOwnerCustomRequests = async (req, res) => {
    try {
      const boutiqueId = req.user.assignedBoutiqueId;
      const requests = await subscriptionsService.getOwnerCustomRequests(boutiqueId);
      return res.json({ success: true, data: requests });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  // Admin get custom requests
  getAdminCustomRequests = async (req, res) => {
    try {
      const requests = await subscriptionsService.getAdminCustomRequests();
      return res.json({ success: true, data: requests });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  // Admin update custom request (approve/reject)
  updateAdminCustomRequest = async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updatedRequest = await subscriptionsService.updateAdminCustomRequest(id, status);
      return res.json({ success: true, data: updatedRequest });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  // Superadmin subscription analytics
  getSuperadminAnalytics = async (req, res) => {
    try {
      const analytics = await subscriptionsService.getSuperadminAnalytics();
      return res.json({ success: true, data: analytics });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };
}

module.exports = new SubscriptionsController();

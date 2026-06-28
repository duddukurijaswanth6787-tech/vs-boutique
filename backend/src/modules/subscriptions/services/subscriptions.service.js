const crypto = require('crypto');
const Razorpay = require('razorpay');
const subscriptionsRepository = require('../repositories/subscriptions.repository');
const { logAction } = require('../../../services/auditService');
const { syncSubscriptionUsage, getActiveSubscription } = require('../../../services/subscriptionService');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
});

const parseDecimalVal = (val) => {
  if (val === null || val === undefined || val === '') return 0.00;
  if (typeof val === 'number') return val;
  const parsed = parseFloat(val.toString().replace(/[^0-9.]/g, ''));
  return isNaN(parsed) ? 0.00 : parsed;
};

const parsePlanPayload = (body) => {
  const parseNum = (val, def = 0) => {
    const p = parseInt(val);
    return isNaN(p) ? def : p;
  };
  const parseDec = (val, def = 0.00) => {
    const p = parseFloat(val);
    return isNaN(p) ? def : p;
  };
  const parseBool = (val, def = false) => {
    if (val === undefined || val === null) return def;
    return !!val;
  };

  return {
    name: body.name,
    planCode: body.planCode,
    description: body.description || '',
    monthlyPrice: parseDec(body.monthlyPrice || body.price, 0.00),
    yearlyPrice: parseDec(body.yearlyPrice, 0.00),
    trialPeriodDays: parseNum(body.trialPeriodDays, 14),
    gracePeriodDays: parseNum(body.gracePeriodDays, 3),
    sortOrder: parseNum(body.sortOrder, 0),
    isActive: parseBool(body.isActive, true),
    isFeatured: parseBool(body.isFeatured, false),
    recommendedPlan: parseBool(body.recommendedPlan || body.recommended, false),
    
    allowDirectSelling: parseBool(body.allowDirectSelling, true),
    allowCustomTailoring: parseBool(body.allowCustomTailoring, false),
    
    maxReadyMadeProducts: parseNum(body.maxReadyMadeProducts, -1),
    maxCustomDesigns: parseNum(body.maxCustomDesigns, 50),
    maxOrdersPerMonth: parseNum(body.maxOrdersPerMonth, 100),
    maxBookingsPerMonth: parseNum(body.maxBookingsPerMonth, 50),
    maxCustomers: parseNum(body.maxCustomers, -1),
    maxMeasurements: parseNum(body.maxMeasurements, -1),
    maxGalleryImages: parseNum(body.maxGalleryImages, 20),
    maxStaffAccounts: parseNum(body.maxStaffAccounts, 5),
    maxBranches: parseNum(body.maxBranches, 1),

    canManageProducts: parseBool(body.canManageProducts, false),
    canManageStock: parseBool(body.canManageStock, false),
    canManageShipping: parseBool(body.canManageShipping, false),
    canManageReturns: parseBool(body.canManageReturns, false),
    canManageCoupons: parseBool(body.canManageCoupons, false),
    canManageOffers: parseBool(body.canManageOffers, false),
    canManageProductVariants: parseBool(body.canManageProductVariants, false),
    canManageReviews: parseBool(body.canManageReviews, true),

    canUseCustomMeasurements: parseBool(body.canUseCustomMeasurements, true),
    canUseMeasurementHistory: parseBool(body.canUseMeasurementHistory, false),
    canCreateCustomOrders: parseBool(body.canCreateCustomOrders, true),
    canManageTailoringOrders: parseBool(body.canManageTailoringOrders, true),
    canManageProductionWorkflow: parseBool(body.canManageProductionWorkflow, false),
    canManageTailorAssignments: parseBool(body.canManageTailorAssignments, false),

    canManageCustomers: parseBool(body.canManageCustomers, true),
    canManageCustomerNotes: parseBool(body.canManageCustomerNotes, true),
    canManageRewards: parseBool(body.canManageRewards, false),
    canManageReferrals: parseBool(body.canManageReferrals, false),
    canManageWallet: parseBool(body.canManageWallet, false),

    canManageStaff: parseBool(body.canManageStaff, true),
    canManageAttendance: parseBool(body.canManageAttendance, false),
    canManageTasks: parseBool(body.canManageTasks, false),
    canManagePayroll: parseBool(body.canManagePayroll, false),

    canUseWhatsAppMarketing: parseBool(body.canUseWhatsAppMarketing, false),
    canUseSmsMarketing: parseBool(body.canUseSmsMarketing, false),
    canUseEmailMarketing: parseBool(body.canUseEmailMarketing, false),
    canCreateCampaigns: parseBool(body.canCreateCampaigns, false),

    canViewAnalytics: parseBool(body.canViewAnalytics, false),
    canViewAdvancedAnalytics: parseBool(body.canViewAdvancedAnalytics, false),
    canViewFinancialReports: parseBool(body.canViewFinancialReports, false),

    canListInMarketplace: parseBool(body.canListInMarketplace, true),
    canFeatureProducts: parseBool(body.canFeatureProducts, false),
    canFeatureBoutique: parseBool(body.canFeatureBoutique, false),
    canSellPremiumDesigns: parseBool(body.canSellPremiumDesigns, false),

    canUseAiAssistant: parseBool(body.canUseAiAssistant, false),
    canUseAiRecommendations: parseBool(body.canUseAiRecommendations, false),
    canUseAiDesignSuggestions: parseBool(body.canUseAiDesignSuggestions, false),

    canUseApiAccess: parseBool(body.canUseApiAccess, false),
    canUseCustomBranding: parseBool(body.canUseCustomBranding, false),
    canUseWhiteLabel: parseBool(body.canUseWhiteLabel, false),
    canUseMultiBranch: parseBool(body.canUseMultiBranch, false)
  };
};

class SubscriptionsService {
  async getOwnerSubscriptionStatus(boutiqueId) {
    if (!boutiqueId) throw { status: 400, message: 'Owner has no assigned boutique' };

    const subscription = await syncSubscriptionUsage(boutiqueId);
    if (!subscription) {
      throw { status: 404, message: 'No subscription found for this boutique' };
    }

    const billingHistory = await subscriptionsRepository.findBillingHistoryBySubscriptionId(subscription.id);

    let trialDaysRemaining = null;
    if (subscription.status === 'TRIAL' && subscription.trialEndsAt) {
      const diffTime = new Date(subscription.trialEndsAt).getTime() - new Date().getTime();
      trialDaysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    const calculateProgress = (curr, max) => {
      if (max === -1 || max >= 999999) return { current: curr, max: 'Unlimited', percentage: 0, warning: false };
      const pct = Number(((curr / max) * 100).toFixed(1));
      return {
        current: curr,
        max,
        percentage: pct,
        warning: pct >= 80
      };
    };

    const usageProgress = {
      readyMadeProducts: calculateProgress(subscription.currentReadyMadeProductsCount, subscription.plan.maxReadyMadeProducts),
      customDesigns: calculateProgress(subscription.currentCustomDesignsCount, subscription.plan.maxCustomDesigns),
      designs: calculateProgress(subscription.currentCustomDesignsCount, subscription.plan.maxCustomDesigns),
      orders: calculateProgress(subscription.currentOrderCount, subscription.plan.maxOrdersPerMonth),
      bookings: calculateProgress(subscription.currentBookingCount, subscription.plan.maxBookingsPerMonth),
      customers: calculateProgress(subscription.currentCustomerCount, subscription.plan.maxCustomers),
      measurements: calculateProgress(subscription.currentMeasurementsCount, subscription.plan.maxMeasurements),
      gallery: calculateProgress(subscription.currentGalleryImages, subscription.plan.maxGalleryImages),
      staff: calculateProgress(subscription.currentStaffAccounts, subscription.plan.maxStaffAccounts),
      branches: calculateProgress(subscription.currentBranchCount, subscription.plan.maxBranches)
    };

    let upgradeRecommendation = null;
    if (subscription.plan.name === 'FREE') {
      upgradeRecommendation = 'STARTER';
    } else if (subscription.plan.name === 'STARTER') {
      upgradeRecommendation = 'PRO';
    } else if (subscription.plan.name === 'PRO') {
      upgradeRecommendation = 'ENTERPRISE';
    }

    return {
      success: true,
      data: {
        subscription: {
          id: subscription.id,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          trialEndsAt: subscription.trialEndsAt,
          trialDaysRemaining,
          plan: {
            id: subscription.plan.id,
            name: subscription.plan.name,
            price: Number(subscription.plan.monthlyPrice),
            billingInterval: 'month',
            features: {
              analyticsAccess: subscription.plan.canViewAnalytics,
              featuredListingAccess: subscription.plan.canFeatureBoutique,
              marketingToolsAccess: subscription.plan.canCreateCampaigns,
              aiAssistantAccess: subscription.plan.canUseAiAssistant,
              allowDirectSelling: subscription.plan.allowDirectSelling,
              allowCustomTailoring: subscription.plan.allowCustomTailoring,
              canManageProducts: subscription.plan.canManageProducts,
              canManageStock: subscription.plan.canManageStock,
              canManageShipping: subscription.plan.canManageShipping,
              canManageReturns: subscription.plan.canManageReturns,
              canManageCoupons: subscription.plan.canManageCoupons,
              canManageOffers: subscription.plan.canManageOffers,
              canManageProductVariants: subscription.plan.canManageProductVariants,
              canManageReviews: subscription.plan.canManageReviews,
              canUseCustomMeasurements: subscription.plan.canUseCustomMeasurements,
              canUseMeasurementHistory: subscription.plan.canUseMeasurementHistory,
              canCreateCustomOrders: subscription.plan.canCreateCustomOrders,
              canManageTailoringOrders: subscription.plan.canManageTailoringOrders,
              canManageProductionWorkflow: subscription.plan.canManageProductionWorkflow,
              canManageTailorAssignments: subscription.plan.canManageTailorAssignments,
              canManageCustomers: subscription.plan.canManageCustomers,
              canManageCustomerNotes: subscription.plan.canManageCustomerNotes,
              canManageRewards: subscription.plan.canManageRewards,
              canManageReferrals: subscription.plan.canManageReferrals,
              canManageWallet: subscription.plan.canManageWallet,
              canManageStaff: subscription.plan.canManageStaff,
              canManageAttendance: subscription.plan.canManageAttendance,
              canManageTasks: subscription.plan.canManageTasks,
              canManagePayroll: subscription.plan.canManagePayroll,
              canUseWhatsAppMarketing: subscription.plan.canUseWhatsAppMarketing,
              canUseSmsMarketing: subscription.plan.canUseSmsMarketing,
              canUseEmailMarketing: subscription.plan.canUseEmailMarketing,
              canViewAnalytics: subscription.plan.canViewAnalytics,
              canViewAdvancedAnalytics: subscription.plan.canViewAdvancedAnalytics,
              canViewFinancialReports: subscription.plan.canViewFinancialReports,
              canListInMarketplace: subscription.plan.canListInMarketplace,
              canFeatureProducts: subscription.plan.canFeatureProducts,
              canFeatureBoutique: subscription.plan.canFeatureBoutique,
              canSellPremiumDesigns: subscription.plan.canSellPremiumDesigns,
              canUseAiAssistant: subscription.plan.canUseAiAssistant,
              canUseAiRecommendations: subscription.plan.canUseAiRecommendations,
              canUseAiDesignSuggestions: subscription.plan.canUseAiDesignSuggestions,
              canUseApiAccess: subscription.plan.canUseApiAccess,
              canUseCustomBranding: subscription.plan.canUseCustomBranding,
              canUseWhiteLabel: subscription.plan.canUseWhiteLabel,
              canUseMultiBranch: subscription.plan.canUseMultiBranch
            }
          },
          usageProgress,
          billingHistory: billingHistory.map(h => ({
            id: h.id,
            amount: Number(h.amount),
            paymentStatus: h.paymentStatus,
            paymentMethod: h.paymentMethod,
            invoiceUrl: h.invoiceUrl,
            createdAt: h.createdAt
          })),
          upgradeRecommendation
        }
      }
    };
  }

  async createPaymentOrder(boutiqueId, planName) {
    if (!boutiqueId) throw { status: 400, message: 'Owner has no assigned boutique' };
    if (!['STARTER', 'PRO', 'ENTERPRISE'].includes(planName)) {
      throw { status: 400, message: 'Invalid plan selected' };
    }

    const plan = await subscriptionsRepository.findPlanByNameAndStatus(planName, true);
    if (!plan) throw { status: 404, message: 'Plan template not found or inactive' };

    const activeSub = await subscriptionsRepository.findSubscriptionByBoutiqueId(boutiqueId);
    if (!activeSub) throw { status: 404, message: 'Active subscription not found' };

    const amountInPaise = Math.round(Number(plan.monthlyPrice || plan.price) * 100);
    if (amountInPaise <= 0) {
      throw { status: 400, message: 'Cannot pay for a free or zero-priced plan' };
    }

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_sub_${activeSub.id.substring(0, 8)}_${Date.now()}`
    };

    let order;
    let isMock = false;

    if (process.env.RAZORPAY_KEY_ID === 'rzp_test_your_key_id' || 
        process.env.RAZORPAY_KEY_ID?.includes('placeholder') || 
        !process.env.RAZORPAY_KEY_SECRET || 
        process.env.RAZORPAY_KEY_SECRET === 'your_key_secret') {
      isMock = true;
    }

    if (!isMock) {
      try {
        order = await razorpay.orders.create(options);
      } catch (razorpayErr) {
        console.warn('⚠️ Razorpay order creation failed. Falling back to mock.', razorpayErr.message);
        isMock = true;
      }
    }

    if (isMock) {
      order = {
        id: `order_mock_${Math.random().toString(36).substring(2, 11)}`,
        amount: amountInPaise,
        currency: 'INR'
      };
    }

    return {
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        planId: plan.id,
        planName: plan.name,
        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        isMock
      }
    };
  }

  async verifyPayment(boutiqueId, body, userId) {
    if (!boutiqueId) throw { status: 400, message: 'Owner has no assigned boutique' };

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, planId } = body;

    if (!razorpay_payment_id || !razorpay_order_id || !planId) {
      throw { status: 400, message: 'Missing payment details' };
    }

    const isMock = razorpay_order_id.startsWith('order_mock_') || 
                   process.env.RAZORPAY_KEY_ID === 'rzp_test_your_key_id' || 
                   process.env.RAZORPAY_KEY_ID?.includes('placeholder');

    if (!isMock) {
      if (!razorpay_signature) {
        throw { status: 400, message: 'Missing signature details' };
      }
      const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder');
      hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
      const generated_signature = hmac.digest('hex');

      if (generated_signature !== razorpay_signature) {
        throw { status: 400, message: 'Payment signature verification failed' };
      }
    }

    const plan = await subscriptionsRepository.findPlanById(planId);
    if (!plan) throw { status: 404, message: 'Selected plan not found' };

    const activeSub = await subscriptionsRepository.findSubscriptionByBoutiqueId(boutiqueId);
    if (!activeSub) throw { status: 404, message: 'Active subscription not found' };

    const isTrial = activeSub.status === 'TRIAL';

    const result = await subscriptionsRepository.upgradeSubscriptionTransaction(
      activeSub, plan, razorpay_order_id, razorpay_payment_id, isMock, isTrial
    );

    await logAction('UPGRADE_SUBSCRIPTION', 'BoutiqueSubscription', activeSub.id, userId, {
      from: activeSub.plan.name,
      to: plan.name,
      paymentId: razorpay_payment_id
    });

    return { success: true, data: result.updatedSub };
  }

  async upgradeSubscription(boutiqueId, planName, userId) {
    if (!boutiqueId) throw { status: 400, message: 'Owner has no assigned boutique' };
    if (!['STARTER', 'PRO', 'ENTERPRISE'].includes(planName)) {
      throw { status: 400, message: 'Invalid plan selected' };
    }

    const plan = await subscriptionsRepository.findPlanByNameAndStatus(planName);
    if (!plan) throw { status: 404, message: 'Plan template not found' };

    const activeSub = await subscriptionsRepository.findSubscriptionByBoutiqueId(boutiqueId);
    if (!activeSub) throw { status: 404, message: 'Active subscription not found' };

    const result = await subscriptionsRepository.mockUpgradeSubscriptionTransaction(activeSub, plan, planName, boutiqueId);

    await logAction('UPGRADE_SUBSCRIPTION', 'BoutiqueSubscription', activeSub.id, userId, {
      from: activeSub.plan.name,
      to: planName
    });

    return { success: true, data: result.updatedSub };
  }

  async cancelSubscription(boutiqueId, userId) {
    if (!boutiqueId) throw { status: 400, message: 'Owner has no assigned boutique' };

    const subscription = await subscriptionsRepository.findSubscriptionByBoutiqueId(boutiqueId);
    if (!subscription) throw { status: 404, message: 'Subscription not found' };

    const updatedSub = await subscriptionsRepository.updateSubscription(subscription.id, { status: 'CANCELLED' });

    await logAction('CANCEL_SUBSCRIPTION', 'BoutiqueSubscription', subscription.id, userId);

    return { success: true, data: updatedSub };
  }

  async listPlans(includeInactive) {
    const whereClause = includeInactive === 'true' ? {} : { isActive: true };
    const plans = await subscriptionsRepository.findManyPlans(whereClause);
    return plans.map(p => ({
      ...p,
      price: Number(p.monthlyPrice)
    }));
  }

  async createPlan(body) {
    const data = parsePlanPayload(body);
    return subscriptionsRepository.createPlan(data);
  }

  async updatePlan(id, body) {
    const { propagationStrategy } = body;
    const planData = parsePlanPayload(body);

    if (propagationStrategy === 'NEW_ONLY') {
      await subscriptionsRepository.updatePlan(id, { isActive: false });
      return subscriptionsRepository.createPlan({ ...planData, isActive: true });
    }

    if (propagationStrategy === 'DEFERRED') {
      await subscriptionsRepository.updatePlan(id, { isActive: false });
      const newPlan = await subscriptionsRepository.createPlan({ ...planData, isActive: true });
      await subscriptionsRepository.updateManySubscriptions({ planId: id }, { pendingPlanId: newPlan.id });
      return newPlan;
    }

    return subscriptionsRepository.updatePlan(id, planData);
  }

  async clonePlan(id, name, planCode) {
    if (!name || !planCode) {
      throw { status: 400, message: 'Name and planCode are required to clone a plan.' };
    }

    const sourcePlan = await subscriptionsRepository.findPlanById(id);
    if (!sourcePlan) {
      throw { status: 404, message: 'Source plan not found.' };
    }

    const planData = { ...sourcePlan };
    delete planData.id;
    delete planData.createdAt;
    delete planData.updatedAt;

    planData.name = name;
    planData.planCode = planCode;
    planData.isActive = true;

    return subscriptionsRepository.createPlan(planData);
  }

  async deactivatePlan(id) {
    return subscriptionsRepository.updatePlan(id, { isActive: false });
  }

  async requestCustomPlan(boutiqueId, body, userId) {
    if (!boutiqueId) throw { status: 400, message: 'Owner has no assigned boutique' };

    const { requestedDesigns, requestedOrders, requestedGallery, requestedStaff, reason } = body;

    return subscriptionsRepository.createCustomPlanRequest({
      boutiqueId,
      ownerId: userId,
      requestedDesigns: parseInt(requestedDesigns) || 0,
      requestedOrders: parseInt(requestedOrders) || 0,
      requestedGallery: parseInt(requestedGallery) || 0,
      requestedStaff: parseInt(requestedStaff) || 0,
      reason,
      status: 'PENDING'
    });
  }

  async getOwnerCustomRequests(boutiqueId) {
    if (!boutiqueId) throw { status: 400, message: 'Owner has no assigned boutique' };
    return subscriptionsRepository.findCustomPlanRequestsByBoutiqueId(boutiqueId);
  }

  async getAdminCustomRequests() {
    return subscriptionsRepository.findManyCustomPlanRequests();
  }

  async updateAdminCustomRequest(id, status) {
    const request = await subscriptionsRepository.findCustomPlanRequestById(id);
    if (!request) throw { status: 404, message: 'Request not found' };

    if (status === 'APPROVED') {
      const customPlanData = {
        name: 'CUSTOM',
        planCode: `custom_${request.boutiqueId.substring(0, 8)}_${Date.now()}`,
        description: `Custom Plan - ${request.boutique.name}`,
        monthlyPrice: 0.00,
        yearlyPrice: 0.00,
        trialPeriodDays: 0,
        gracePeriodDays: 3,
        isActive: false,
        allowDirectSelling: true,
        allowCustomTailoring: true,
        maxReadyMadeProducts: request.requestedDesigns,
        maxCustomDesigns: request.requestedDesigns,
        maxOrdersPerMonth: request.requestedOrders,
        maxGalleryImages: request.requestedGallery,
        maxStaffAccounts: request.requestedStaff,
        canViewAnalytics: true,
        canFeatureBoutique: false,
        canCreateCampaigns: false,
        canUseAiAssistant: false
      };

      await subscriptionsRepository.approveCustomRequestTransaction(request, customPlanData);
    }

    return subscriptionsRepository.updateCustomPlanRequest(id, status);
  }

  async getSuperadminAnalytics() {
    const [activeCount, trialCount, expiredCount] = await Promise.all([
      subscriptionsRepository.countSubscriptionsByStatus('ACTIVE'),
      subscriptionsRepository.countSubscriptionsByStatus('TRIAL'),
      subscriptionsRepository.countSubscriptionsByStatus('EXPIRED')
    ]);

    const activeSubs = await subscriptionsRepository.findActiveSubscriptionsWithPlans();
    const mrr = activeSubs.reduce((sum, sub) => sum + Number(sub.plan.monthlyPrice || sub.plan.price), 0);

    const allSubs = await subscriptionsRepository.findAllSubscriptionsWithPlans();
    const planDistribution = {
      FREE: 0,
      STARTER: 0,
      PRO: 0,
      ENTERPRISE: 0
    };

    allSubs.forEach(sub => {
      const name = sub.plan.name;
      if (planDistribution[name] !== undefined) {
        planDistribution[name]++;
      }
    });

    return {
      activeSubscriptions: activeCount,
      trialUsers: trialCount,
      expiredUsers: expiredCount,
      monthlyRecurringRevenue: mrr,
      planDistribution
    };
  }
}

module.exports = new SubscriptionsService();

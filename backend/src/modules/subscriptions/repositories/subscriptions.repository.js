const prisma = require('../../../utils/prisma');

class SubscriptionsRepository {
  async findSubscriptionByBoutiqueId(boutiqueId) {
    return prisma.boutiqueSubscription.findFirst({
      where: { boutiqueId },
      include: { plan: true }
    });
  }

  async findBillingHistoryBySubscriptionId(subscriptionId) {
    return prisma.subscriptionBillingHistory.findMany({
      where: { subscriptionId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findPlanByNameAndStatus(name, isActive = true) {
    return prisma.subscriptionPlan.findFirst({
      where: { name, isActive }
    });
  }

  async findPlanById(id) {
    return prisma.subscriptionPlan.findUnique({
      where: { id }
    });
  }

  async updateSubscription(id, data) {
    return prisma.boutiqueSubscription.update({
      where: { id },
      data
    });
  }

  async createBillingHistory(data) {
    return prisma.subscriptionBillingHistory.create({
      data
    });
  }

  async findManyPlans(where) {
    return prisma.subscriptionPlan.findMany({
      where,
      orderBy: { monthlyPrice: 'asc' }
    });
  }

  async createPlan(data) {
    return prisma.subscriptionPlan.create({
      data
    });
  }

  async updatePlan(id, data) {
    return prisma.subscriptionPlan.update({
      where: { id },
      data
    });
  }

  async updateManySubscriptions(where, data) {
    return prisma.boutiqueSubscription.updateMany({
      where,
      data
    });
  }

  async createCustomPlanRequest(data) {
    return prisma.customPlanRequest.create({
      data
    });
  }

  async findCustomPlanRequestsByBoutiqueId(boutiqueId) {
    return prisma.customPlanRequest.findMany({
      where: { boutiqueId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findManyCustomPlanRequests() {
    return prisma.customPlanRequest.findMany({
      include: {
        boutique: { select: { name: true } },
        owner: { select: { ownerName: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findCustomPlanRequestById(id) {
    return prisma.customPlanRequest.findUnique({
      where: { id },
      include: { boutique: true }
    });
  }

  async updateCustomPlanRequest(id, status) {
    return prisma.customPlanRequest.update({
      where: { id },
      data: { status }
    });
  }

  async countSubscriptionsByStatus(status) {
    return prisma.boutiqueSubscription.count({
      where: { status }
    });
  }

  async findActiveSubscriptionsWithPlans() {
    return prisma.boutiqueSubscription.findMany({
      where: { status: 'ACTIVE' },
      include: { plan: true }
    });
  }

  async findAllSubscriptionsWithPlans() {
    return prisma.boutiqueSubscription.findMany({
      include: { plan: true }
    });
  }

  async upgradeSubscriptionTransaction(activeSub, plan, razorpay_order_id, razorpay_payment_id, isTrial) {
    return prisma.$transaction(async (tx) => {
      const now = new Date();
      const nextMonth = new Date();
      nextMonth.setDate(now.getDate() + 30);

      const updatedSub = await tx.boutiqueSubscription.update({
        where: { id: activeSub.id },
        data: {
          planId: plan.id,
          status: 'ACTIVE',
          startDate: now,
          endDate: nextMonth,
          trialEndsAt: null,
          convertedAt: isTrial ? now : undefined,
          trialEndedAt: isTrial ? now : undefined,
          gatewayCustomerId: `cust_${activeSub.boutiqueId.substring(0, 8)}`,
          gatewaySubscriptionId: razorpay_order_id,
          gatewayPaymentId: razorpay_payment_id,
          pendingPlanId: null
        }
      });

      const bill = await tx.subscriptionBillingHistory.create({
        data: {
          subscriptionId: activeSub.id,
          amount: plan.monthlyPrice || plan.price,
          paymentStatus: 'PAID',
          paymentMethod: 'RAZORPAY',
          invoiceUrl: `/invoices/razorpay_${razorpay_payment_id}.pdf`
        }
      });

      return { updatedSub, bill };
    });
  }

  async approveCustomRequestTransaction(request, customPlanData) {
    return prisma.$transaction(async (tx) => {
      const customPlan = await tx.subscriptionPlan.create({
        data: customPlanData
      });

      const activeSub = await tx.boutiqueSubscription.findFirst({
        where: { boutiqueId: request.boutiqueId }
      });

      if (activeSub) {
        await tx.boutiqueSubscription.update({
          where: { id: activeSub.id },
          data: {
            planId: customPlan.id,
            status: 'ACTIVE'
          }
        });
      }

      return customPlan;
    });
  }
}

module.exports = new SubscriptionsRepository();

const prisma = require('../utils/prisma');

function db(tx) {
    return tx || prisma;
}

const checkPendingPlanTransition = async (subscription, tx) => {
    if (!subscription || !subscription.pendingPlanId) return subscription;
    const now = new Date();
    const orm = db(tx);

    const isCycleEnded = subscription.plan.name === 'FREE'
        ? (now.getTime() - new Date(subscription.startDate).getTime() >= 30 * 24 * 60 * 60 * 1000)
        : (subscription.endDate && subscription.endDate < now);

    if (isCycleEnded) {
        const nextMonth = new Date();
        nextMonth.setDate(nextMonth.getDate() + 30);

        const pendingPlan = await orm.subscriptionPlan.findUnique({
            where: { id: subscription.pendingPlanId }
        });

        return await orm.boutiqueSubscription.update({
            where: { id: subscription.id },
            data: {
                planId: subscription.pendingPlanId,
                pendingPlanId: null,
                startDate: new Date(),
                endDate: (pendingPlan && pendingPlan.name === 'FREE') ? nextMonth : subscription.endDate
            },
            include: { plan: true }
        });
    }
    return subscription;
};

const checkTrialExpiration = async (subscription, tx) => {
    if (!subscription || !subscription.plan) return null;
    const now = new Date();
    const gracePeriodDays = subscription.plan.gracePeriodDays || 0;
    const orm = db(tx);

    if (subscription.status === 'TRIAL' && subscription.trialEndsAt) {
        if (subscription.trialEndsAt < now) {
            const graceEnd = new Date(subscription.trialEndsAt.getTime() + gracePeriodDays * 24 * 3600 * 1000);
            if (now <= graceEnd) {
                if (subscription.status !== 'PAST_DUE') {
                    return await orm.boutiqueSubscription.update({
                        where: { id: subscription.id },
                        data: { status: 'PAST_DUE' },
                        include: { plan: true }
                    });
                }
            } else {
                return await orm.boutiqueSubscription.update({
                    where: { id: subscription.id },
                    data: {
                        status: 'EXPIRED',
                        trialEndedAt: subscription.trialEndsAt
                    },
                    include: { plan: true }
                });
            }
        }
    }

    if (subscription.status === 'ACTIVE' && subscription.endDate) {
        if (subscription.endDate < now) {
            const graceEnd = new Date(subscription.endDate.getTime() + gracePeriodDays * 24 * 3600 * 1000);
            if (now <= graceEnd) {
                return await orm.boutiqueSubscription.update({
                    where: { id: subscription.id },
                    data: { status: 'PAST_DUE' },
                    include: { plan: true }
                });
            } else {
                return await orm.boutiqueSubscription.update({
                    where: { id: subscription.id },
                    data: { status: 'EXPIRED' },
                    include: { plan: true }
                });
            }
        }
    }

    if (subscription.status === 'PAST_DUE') {
        const referenceDate = subscription.trialEndsAt || subscription.endDate;
        if (referenceDate) {
            const graceEnd = new Date(referenceDate.getTime() + gracePeriodDays * 24 * 3600 * 1000);
            if (now > graceEnd) {
                return await orm.boutiqueSubscription.update({
                    where: { id: subscription.id },
                    data: { status: 'EXPIRED' },
                    include: { plan: true }
                });
            }
        }
    }

    return subscription;
};

const getActiveSubscription = async (boutiqueId, tx) => {
    const orm = db(tx);
    let subscription = await orm.boutiqueSubscription.findFirst({
        where: { boutiqueId },
        include: { plan: true }
    });

    if (subscription) {
        subscription = await checkPendingPlanTransition(subscription, tx);
        subscription = await checkTrialExpiration(subscription, tx);
    }
    return subscription;
};

const syncSubscriptionUsage = async (boutiqueId, tx) => {
    const orm = db(tx);
    let subscription = await orm.boutiqueSubscription.findFirst({
        where: { boutiqueId },
        include: { plan: true }
    });

    if (!subscription) return null;

    subscription = await checkPendingPlanTransition(subscription, tx);
    subscription = await checkTrialExpiration(subscription, tx);

    const plan = subscription.plan;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
        readyMadeCount,
        customDesignCount,
        currentOrderCount,
        boutique,
        currentStaffAccounts,
        currentBookingCount,
        uniqueCustomerCount,
    ] = await Promise.all([
        orm.design.count({
            where: { boutiqueId, isDeleted: false, isReadyMade: true }
        }),
        orm.design.count({
            where: { boutiqueId, isDeleted: false, isReadyMade: false }
        }),
        orm.order.count({
            where: {
                boutiqueId,
                isDeleted: false,
                createdAt: { gte: startOfMonth }
            }
        }),
        orm.boutique.findUnique({
            where: { id: boutiqueId },
            select: { galleryUrls: true, ownerId: true }
        }),
        orm.owner.count({
            where: {
                assignedBoutiqueId: boutiqueId,
                isDeleted: false
            }
        }),
        orm.booking.count({
            where: {
                boutiqueId,
                createdAt: { gte: startOfMonth }
            }
        }),
        orm.order.findMany({
            where: { boutiqueId, isDeleted: false },
            select: { customerPhone: true },
            distinct: ['customerPhone']
        }),
    ]);

    let currentReadyMadeProductsCount = readyMadeCount;
    let currentCustomDesignsCount = customDesignCount;

    if (plan && !plan.allowCustomTailoring) {
        currentReadyMadeProductsCount = readyMadeCount + customDesignCount;
        currentCustomDesignsCount = 0;
    } else if (plan && !plan.allowDirectSelling) {
        currentCustomDesignsCount = readyMadeCount + customDesignCount;
        currentReadyMadeProductsCount = 0;
    }

    const currentCustomerCount = uniqueCustomerCount.length;
    const customerPhones = uniqueCustomerCount.map(c => c.customerPhone);

    let currentMeasurementsCount = 0;
    if (customerPhones.length > 0) {
        currentMeasurementsCount = await orm.measurement.count({
            where: {
                user: {
                    phone: { in: customerPhones }
                }
            }
        });
    }

    const currentGalleryImages = boutique && Array.isArray(boutique.galleryUrls) ? boutique.galleryUrls.length : 0;
    const currentBranchCount = 1;

    const countsChanged =
        subscription.currentReadyMadeProductsCount !== currentReadyMadeProductsCount ||
        subscription.currentCustomDesignsCount !== currentCustomDesignsCount ||
        subscription.currentOrderCount !== currentOrderCount ||
        subscription.currentBookingCount !== currentBookingCount ||
        subscription.currentCustomerCount !== currentCustomerCount ||
        subscription.currentMeasurementsCount !== currentMeasurementsCount ||
        subscription.currentGalleryImages !== currentGalleryImages ||
        subscription.currentStaffAccounts !== currentStaffAccounts ||
        subscription.currentBranchCount !== currentBranchCount;

    if (!countsChanged) {
        return subscription;
    }

    return await orm.boutiqueSubscription.update({
        where: { id: subscription.id },
        data: {
            currentReadyMadeProductsCount,
            currentCustomDesignsCount,
            currentOrderCount,
            currentBookingCount,
            currentCustomerCount,
            currentMeasurementsCount,
            currentGalleryImages,
            currentStaffAccounts,
            currentBranchCount
        },
        include: { plan: true }
    });
};

function throwIfLimitReached(syncedSub, feature) {
    const plan = syncedSub.plan;

    const checkLimit = (current, max, name) => {
        if (max === -1 || max >= 999999) return;
        if (current >= max) {
            throw new Error(`${name} limit reached. Max limit is ${max}.`);
        }
    };

    switch (feature) {
        case 'readyMadeProducts':
        case 'ready_made_products':
            if (!plan.allowDirectSelling) {
                throw new Error('Direct Selling (Ready-Made Products) is not allowed on your plan.');
            }
            checkLimit(syncedSub.currentReadyMadeProductsCount, plan.maxReadyMadeProducts, 'Ready-Made Product');
            break;
        case 'customDesigns':
        case 'custom_designs':
        case 'designs':
            if (!plan.allowCustomTailoring) {
                throw new Error('Custom Tailoring is not allowed on your plan.');
            }
            checkLimit(syncedSub.currentCustomDesignsCount, plan.maxCustomDesigns, 'Custom Design');
            break;
        case 'orders':
            checkLimit(syncedSub.currentOrderCount, plan.maxOrdersPerMonth, 'Monthly Order');
            break;
        case 'bookings':
            if (!plan.allowCustomTailoring) {
                throw new Error('Custom Tailoring (Booking) is not allowed on your plan.');
            }
            checkLimit(syncedSub.currentBookingCount, plan.maxBookingsPerMonth, 'Monthly Booking');
            break;
        case 'customers':
            checkLimit(syncedSub.currentCustomerCount, plan.maxCustomers, 'Customer');
            break;
        case 'measurements':
            if (!plan.allowCustomTailoring) {
                throw new Error('Custom Tailoring (Measurements) is not allowed on your plan.');
            }
            checkLimit(syncedSub.currentMeasurementsCount, plan.maxMeasurements, 'Measurement');
            break;
        case 'gallery':
            checkLimit(syncedSub.currentGalleryImages, plan.maxGalleryImages, 'Gallery Image');
            break;
        case 'staff':
            checkLimit(syncedSub.currentStaffAccounts, plan.maxStaffAccounts, 'Staff Account');
            break;
        case 'branches':
            checkLimit(syncedSub.currentBranchCount, plan.maxBranches, 'Branch');
            break;
        case 'directSelling':
        case 'direct_selling':
            if (!plan.allowDirectSelling) {
                throw new Error('Direct Selling is not enabled on your plan.');
            }
            break;
        case 'customTailoring':
        case 'custom_tailoring':
            if (!plan.allowCustomTailoring) {
                throw new Error('Custom Tailoring is not enabled on your plan.');
            }
            break;
        case 'canManageProducts':
            if (!plan.canManageProducts) throw new Error('Product management is not enabled on your plan.');
            break;
        case 'canManageStock':
            if (!plan.canManageStock) throw new Error('Stock management is not enabled on your plan.');
            break;
        case 'canManageShipping':
            if (!plan.canManageShipping) throw new Error('Shipping management is not enabled on your plan.');
            break;
        case 'canManageReturns':
            if (!plan.canManageReturns) throw new Error('Returns management is not enabled on your plan.');
            break;
        case 'canManageCoupons':
            if (!plan.canManageCoupons) throw new Error('Coupon management is not enabled on your plan.');
            break;
        case 'canManageOffers':
            if (!plan.canManageOffers) throw new Error('Offers management is not enabled on your plan.');
            break;
        case 'canManageProductVariants':
            if (!plan.canManageProductVariants) throw new Error('Product variants management is not enabled on your plan.');
            break;
        case 'canManageReviews':
            if (!plan.canManageReviews) throw new Error('Reviews management is not enabled on your plan.');
            break;
        case 'canUseCustomMeasurements':
            if (!plan.canUseCustomMeasurements) throw new Error('Custom measurements is not enabled on your plan.');
            break;
        case 'canUseMeasurementHistory':
            if (!plan.canUseMeasurementHistory) throw new Error('Measurement history is not enabled on your plan.');
            break;
        case 'canCreateCustomOrders':
            if (!plan.canCreateCustomOrders) throw new Error('Custom order creation is not enabled on your plan.');
            break;
        case 'canManageTailoringOrders':
            if (!plan.canManageTailoringOrders) throw new Error('Tailoring order management is not enabled on your plan.');
            break;
        case 'canManageProductionWorkflow':
            if (!plan.canManageProductionWorkflow) throw new Error('Production workflow management is not enabled on your plan.');
            break;
        case 'canManageTailorAssignments':
            if (!plan.canManageTailorAssignments) throw new Error('Tailor assignments management is not enabled on your plan.');
            break;
        case 'canManageCustomers':
            if (!plan.canManageCustomers) throw new Error('Customer management is not enabled on your plan.');
            break;
        case 'canManageCustomerNotes':
            if (!plan.canManageCustomerNotes) throw new Error('Customer notes is not enabled on your plan.');
            break;
        case 'canManageRewards':
            if (!plan.canManageRewards) throw new Error('Customer rewards is not enabled on your plan.');
            break;
        case 'canManageReferrals':
            if (!plan.canManageReferrals) throw new Error('Customer referrals is not enabled on your plan.');
            break;
        case 'canManageWallet':
            if (!plan.canManageWallet) throw new Error('Boutique customer wallet is not enabled on your plan.');
            break;
        case 'canManageStaff':
            if (!plan.canManageStaff) throw new Error('Staff management is not enabled on your plan.');
            break;
        case 'canManageAttendance':
            if (!plan.canManageAttendance) throw new Error('Staff attendance tracking is not enabled on your plan.');
            break;
        case 'canManageTasks':
            if (!plan.canManageTasks) throw new Error('Staff tasks management is not enabled on your plan.');
            break;
        case 'canManagePayroll':
            if (!plan.canManagePayroll) throw new Error('Staff payroll management is not enabled on your plan.');
            break;
        case 'canUseWhatsAppMarketing':
            if (!plan.canUseWhatsAppMarketing) throw new Error('WhatsApp marketing is not enabled on your plan.');
            break;
        case 'canUseSmsMarketing':
            if (!plan.canUseSmsMarketing) throw new Error('SMS marketing is not enabled on your plan.');
            break;
        case 'canUseEmailMarketing':
            if (!plan.canUseEmailMarketing) throw new Error('Email marketing is not enabled on your plan.');
            break;
        case 'canCreateCampaigns':
            if (!plan.canCreateCampaigns) throw new Error('Campaign creation is not enabled on your plan.');
            break;
        case 'canViewAnalytics':
            if (!plan.canViewAnalytics) throw new Error('Analytics dashboard is not enabled on your plan.');
            break;
        case 'canViewAdvancedAnalytics':
            if (!plan.canViewAdvancedAnalytics) throw new Error('Advanced analytics is not enabled on your plan.');
            break;
        case 'canViewFinancialReports':
            if (!plan.canViewFinancialReports) throw new Error('Financial reports are not enabled on your plan.');
            break;
        case 'canListInMarketplace':
            if (!plan.canListInMarketplace) throw new Error('Marketplace listing is not enabled on your plan.');
            break;
        case 'canFeatureProducts':
            if (!plan.canFeatureProducts) throw new Error('Featured product promotion is not enabled on your plan.');
            break;
        case 'canFeatureBoutique':
            if (!plan.canFeatureBoutique) throw new Error('Featured boutique promotion is not enabled on your plan.');
            break;
        case 'canSellPremiumDesigns':
            if (!plan.canSellPremiumDesigns) throw new Error('Premium designs selling is not enabled on your plan.');
            break;
        case 'canUseAiAssistant':
            if (!plan.canUseAiAssistant) throw new Error('AI assistant is not enabled on your plan.');
            break;
        case 'canUseAiRecommendations':
            if (!plan.canUseAiRecommendations) throw new Error('AI recommendations are not enabled on your plan.');
            break;
        case 'canUseAiDesignSuggestions':
            if (!plan.canUseAiDesignSuggestions) throw new Error('AI design suggestions are not enabled on your plan.');
            break;
        case 'canUseApiAccess':
            if (!plan.canUseApiAccess) throw new Error('API Access is not enabled on your plan.');
            break;
        case 'canUseCustomBranding':
            if (!plan.canUseCustomBranding) throw new Error('Custom branding is not enabled on your plan.');
            break;
        case 'canUseWhiteLabel':
            if (!plan.canUseWhiteLabel) throw new Error('White label service is not enabled on your plan.');
            break;
        case 'canUseMultiBranch':
            if (!plan.canUseMultiBranch) throw new Error('Multi-branch setup is not enabled on your plan.');
            break;
        default:
            break;
    }
}

const validateSubscriptionLimit = async (boutiqueId, feature) => {
    const boutique = await prisma.boutique.findUnique({
        where: { id: boutiqueId },
        select: { subscriptionEnforcement: true }
    });

    if (boutique && boutique.subscriptionEnforcement === false) {
        return true;
    }

    return await prisma.$transaction(async (tx) => {
        await tx.$queryRawUnsafe(
            `SELECT id FROM boutique_subscriptions WHERE boutique_id = $1::uuid FOR UPDATE`,
            boutiqueId
        );

        const subscription = await getActiveSubscription(boutiqueId, tx);
        if (!subscription) {
            throw new Error('No active subscription plan found.');
        }

        if (subscription.status === 'EXPIRED') {
            throw new Error('Subscription EXPIRED. View-Only Mode is active.');
        }

        const syncedSub = await syncSubscriptionUsage(boutiqueId, tx);
        throwIfLimitReached(syncedSub, feature);
        return true;
    });
};

async function withSubscriptionGuard(boutiqueId, feature, executeFn) {
    const boutique = await prisma.boutique.findUnique({
        where: { id: boutiqueId },
        select: { subscriptionEnforcement: true }
    });

    if (boutique && boutique.subscriptionEnforcement === false) {
        return await executeFn(prisma);
    }

    return await prisma.$transaction(async (tx) => {
        await tx.$queryRawUnsafe(
            `SELECT id FROM boutique_subscriptions WHERE boutique_id = $1::uuid FOR UPDATE`,
            boutiqueId
        );

        const subscription = await getActiveSubscription(boutiqueId, tx);
        if (!subscription) {
            throw new Error('No active subscription plan found.');
        }

        if (subscription.status === 'EXPIRED') {
            throw new Error('Subscription EXPIRED. View-Only Mode is active.');
        }

        const syncedSub = await syncSubscriptionUsage(boutiqueId, tx);
        throwIfLimitReached(syncedSub, feature);

        return await executeFn(tx);
    });
}

module.exports = {
    getActiveSubscription,
    syncSubscriptionUsage,
    validateSubscriptionLimit,
    withSubscriptionGuard,
    checkTrialExpiration
};

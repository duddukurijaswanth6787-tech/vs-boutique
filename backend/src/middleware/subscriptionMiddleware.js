const { getActiveSubscription } = require('../services/subscriptionService');
const prisma = require('../utils/prisma');

async function resolveSubscriptionContext(req) {
    if (req.user && req.user.role === 'super-admin') {
        req._subscriptionEnforced = false;
        return null;
    }

    const boutiqueId = req.user && req.user.assignedBoutiqueId;
    if (!boutiqueId) return null;

    if (req._subscription !== undefined) return req._subscription;

    if (!req._boutiqueEnforcement) {
        const boutique = await prisma.boutique.findUnique({
            where: { id: boutiqueId },
            select: { subscriptionEnforcement: true }
        });
        req._boutiqueEnforcement = boutique;
    }

    if (req._boutiqueEnforcement && req._boutiqueEnforcement.subscriptionEnforcement === false) {
        req._subscriptionEnforced = false;
        req._subscription = null;
        return null;
    }

    req._subscriptionEnforced = true;
    req._subscription = await getActiveSubscription(boutiqueId);
    return req._subscription;
}

exports.checkPlanFeature = (featureName) => {
    return async (req, res, next) => {
        if (req.user && req.user.role === 'super-admin') {
            return next();
        }

        const boutiqueId = req.user.assignedBoutiqueId;
        if (!boutiqueId) {
            return res.status(400).json({ message: 'No boutique assigned to owner' });
        }

        try {
            const subscription = await resolveSubscriptionContext(req);

            if (req._subscriptionEnforced === false) {
                return next();
            }

            if (!subscription) {
                return res.status(403).json({ message: 'No active subscription plan found.' });
            }

            if (subscription.status === 'EXPIRED') {
                const isWrite = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
                if (isWrite) {
                    return res.status(403).json({ message: 'Subscription EXPIRED. View-Only Mode is active.' });
                }
            }

            const plan = subscription.plan;
            if (!plan) {
                return res.status(403).json({ message: 'Plan details not found.' });
            }

            if (plan[featureName] === false) {
                return res.status(403).json({
                    success: false,
                    message: `Access Denied: The '${featureName}' feature is not enabled on your plan.`
                });
            }

            next();
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    };
};

exports.requireDirectSelling = async (req, res, next) => {
    if (req.user && req.user.role === 'super-admin') {
        return next();
    }
    const boutiqueId = req.user.assignedBoutiqueId;
    if (!boutiqueId) return res.status(400).json({ message: 'No boutique assigned' });

    try {
        const subscription = await resolveSubscriptionContext(req);

        if (req._subscriptionEnforced === false) {
            return next();
        }

        if (subscription && !subscription.plan.allowDirectSelling) {
            return res.status(403).json({
                message: "Access Denied: Direct Selling features are not available on your plan."
            });
        }
        next();
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.requireCustomTailoring = async (req, res, next) => {
    if (req.user && req.user.role === 'super-admin') {
        return next();
    }
    const boutiqueId = req.user.assignedBoutiqueId;
    if (!boutiqueId) return res.status(400).json({ message: 'No boutique assigned' });

    try {
        const subscription = await resolveSubscriptionContext(req);

        if (req._subscriptionEnforced === false) {
            return next();
        }

        if (subscription && !subscription.plan.allowCustomTailoring) {
            return res.status(403).json({
                message: "Access Denied: Custom Tailoring modules are not available on your plan."
            });
        }
        next();
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const prisma = require('../../../utils/prisma');

const TIER_HIERARCHY = { FREE: 0, STARTER: 1, PROFESSIONAL: 2, ENTERPRISE: 3 };

function checkTierAccess(templateTier) {
  return async (req, res, next) => {
    try {
      const userTier = req.user?.tier || 'FREE';

      const templateLevel = TIER_HIERARCHY[templateTier] ?? 0;
      const userLevel = TIER_HIERARCHY[userTier] ?? 0;

      if (userLevel >= templateLevel) return next();

      const templateId = req.params.id;
      if (templateId) {
        const assignment = await prisma.businessTemplateAssignment.findFirst({
          where: { templateId, businessId: req.user.businessId }
        });
        if (assignment) return next();
      }

      return res.status(403).json({
        success: false,
        message: `Template requires ${templateTier} tier or higher. Your current tier: ${userTier}`,
        requiredTier: templateTier,
        currentTier: userTier
      });
    } catch (err) {
      next(err);
    }
  };
}

function checkTemplateTierFromBody(req, res, next) {
  const tier = req.body?.tier || 'FREE';
  return checkTierAccess(tier)(req, res, next);
}

async function checkTemplateTierFromParam(req, res, next) {
  try {
    const template = await prisma.cmsTemplate.findUnique({
      where: { id: req.params.id },
      select: { tier: true }
    });
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    return checkTierAccess(template.tier)(req, res, next);
  } catch (err) {
    next(err);
  }
}

module.exports = { checkTierAccess, checkTemplateTierFromBody, checkTemplateTierFromParam };

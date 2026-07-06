const prisma = require('../../../utils/prisma');

const RISK_WEIGHTS = {
  auditGaps: 20,
  violations: 20,
  deploymentFailures: 15,
  openIssues: 15,
  securityWeaknesses: 15,
  policyCompliance: 15
};

async function calculateRiskScore(businessId) {
  const results = await Promise.allSettled([
    _auditGapScore(businessId),
    _violationScore(businessId),
    _deploymentScore(businessId),
    _issueScore(businessId),
    _securityScore(businessId),
    _policyScore(businessId)
  ]);

  let totalRisk = 0;
  const details = {};
  const keys = ['auditGaps', 'violations', 'deploymentFailures', 'openIssues', 'securityWeaknesses', 'policyCompliance'];

  results.forEach((r, i) => {
    if (r.status === 'fulfilled' && r.value !== null) {
      details[keys[i]] = r.value;
      totalRisk += r.value.score;
    }
  });

  const overall = Math.min(100, Math.max(0, Math.round(totalRisk)));
  let riskLevel = 'low';
  if (overall > 75) riskLevel = 'critical';
  else if (overall > 50) riskLevel = 'high';
  else if (overall > 25) riskLevel = 'medium';

  return { businessId, overall, riskLevel, details, calculatedAt: new Date().toISOString() };
}

async function _auditGapScore(businessId) {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 864e5);
    const auditCount = await prisma.auditLog.count({
      where: { timestamp: { gte: sevenDaysAgo } }
    });
    if (auditCount > 100) return { score: 5, max: RISK_WEIGHTS.auditGaps, label: 'Healthy audit coverage', weight: RISK_WEIGHTS.auditGaps };
    if (auditCount > 20) return { score: 10, max: RISK_WEIGHTS.auditGaps, label: 'Moderate audit coverage', weight: RISK_WEIGHTS.auditGaps };
    return { score: 20, max: RISK_WEIGHTS.auditGaps, label: 'Low audit coverage', weight: RISK_WEIGHTS.auditGaps };
  } catch { return null; }
}

async function _violationScore(businessId) {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 864e5);
    const violations = await prisma.auditLog.count({
      where: {
        actionType: { in: ['PERMISSION_DENIED', 'RATE_LIMIT_EXCEEDED', 'LOGIN_FAILED', 'UNAUTHORIZED_ACCESS'] },
        timestamp: { gte: thirtyDaysAgo }
      }
    });
    if (violations === 0) return { score: 0, max: RISK_WEIGHTS.violations, label: 'No violations', weight: RISK_WEIGHTS.violations };
    if (violations < 10) return { score: 8, max: RISK_WEIGHTS.violations, label: `${violations} violations`, weight: RISK_WEIGHTS.violations };
    return { score: 20, max: RISK_WEIGHTS.violations, label: `${violations} violations`, weight: RISK_WEIGHTS.violations };
  } catch { return null; }
}

async function _deploymentScore(businessId) {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 864e5);
    const recentDeployments = await prisma.deployment.findMany({
      where: { businessId, createdAt: { gte: sevenDaysAgo } },
      select: { status: true }
    });
    if (!recentDeployments.length) return { score: 5, max: RISK_WEIGHTS.deploymentFailures, label: 'No recent deployments', weight: RISK_WEIGHTS.deploymentFailures };
    const failed = recentDeployments.filter(d => d.status === 'FAILED' || d.status === 'BUILD_FAILED').length;
    const ratio = failed / recentDeployments.length;
    const score = Math.round(ratio * RISK_WEIGHTS.deploymentFailures);
    return { score, max: RISK_WEIGHTS.deploymentFailures, label: `${failed}/${recentDeployments.length} failed`, weight: RISK_WEIGHTS.deploymentFailures };
  } catch { return null; }
}

async function _issueScore(businessId) {
  try {
    const openTickets = await prisma.supportTicket.count({
      where: { boutique: { businessId }, status: { in: ['OPEN', 'IN_PROGRESS'] } }
    });
    if (openTickets === 0) return { score: 0, max: RISK_WEIGHTS.openIssues, label: 'No open issues', weight: RISK_WEIGHTS.openIssues };
    if (openTickets <= 3) return { score: 5, max: RISK_WEIGHTS.openIssues, label: `${openTickets} open issues`, weight: RISK_WEIGHTS.openIssues };
    if (openTickets <= 7) return { score: 10, max: RISK_WEIGHTS.openIssues, label: `${openTickets} open issues`, weight: RISK_WEIGHTS.openIssues };
    return { score: 15, max: RISK_WEIGHTS.openIssues, label: `${openTickets} open issues`, weight: RISK_WEIGHTS.openIssues };
  } catch { return null; }
}

async function _securityScore(businessId) {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 864e5);
    const securityEvents = await prisma.auditLog.count({
      where: {
        actionType: { in: ['UNAUTHORIZED_ACCESS', 'LOGIN_FAILED'] },
        timestamp: { gte: sevenDaysAgo }
      }
    });
    if (securityEvents === 0) return { score: 0, max: RISK_WEIGHTS.securityWeaknesses, label: 'No security events', weight: RISK_WEIGHTS.securityWeaknesses };
    if (securityEvents < 5) return { score: 8, max: RISK_WEIGHTS.securityWeaknesses, label: `${securityEvents} security events`, weight: RISK_WEIGHTS.securityWeaknesses };
    return { score: 15, max: RISK_WEIGHTS.securityWeaknesses, label: `${securityEvents} security events`, weight: RISK_WEIGHTS.securityWeaknesses };
  } catch { return null; }
}

async function _policyScore(businessId) {
  try {
    const key = `compliance:policies:${businessId}`;
    const setting = await prisma.cmsAiSettings.findUnique({ where: { key } });
    if (!setting || !setting.value) return { score: 15, max: RISK_WEIGHTS.policyCompliance, label: 'No policies configured', weight: RISK_WEIGHTS.policyCompliance };
    const policies = setting.value;
    if (!Array.isArray(policies) || policies.length === 0) {
      return { score: 15, max: RISK_WEIGHTS.policyCompliance, label: 'No policies configured', weight: RISK_WEIGHTS.policyCompliance };
    }
    const missingStandards = policies.filter(p => !p.framework || !p.status);
    const risk = Math.round((missingStandards.length / policies.length) * RISK_WEIGHTS.policyCompliance);
    return { score: risk, max: RISK_WEIGHTS.policyCompliance, label: `${policies.length} policies, ${missingStandards.length} incomplete`, weight: RISK_WEIGHTS.policyCompliance };
  } catch { return null; }
}

module.exports = { calculateRiskScore };

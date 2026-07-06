const prisma = require('../../../utils/prisma');

const WEIGHTS = {
  subscription: 25,
  paymentStatus: 15,
  websiteUptime: 10,
  deploymentFailures: 10,
  workflowFailures: 10,
  openIssues: 10,
  aiUsage: 5,
  storage: 5
};

async function calculateHealth(businessId) {
  const results = await Promise.allSettled([
    _subscriptionScore(businessId),
    _paymentScore(businessId),
    _websiteScore(businessId),
    _deploymentScore(businessId),
    _workflowScore(businessId),
    _supportScore(businessId),
    _aiUsageScore(businessId),
    _storageScore(businessId)
  ]);

  let totalScore = 0;
  const details = {};

  const keys = ['subscription', 'paymentStatus', 'websiteUptime', 'deploymentFailures', 'workflowFailures', 'openIssues', 'aiUsage', 'storage'];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled' && r.value !== null) {
      details[keys[i]] = r.value;
      totalScore += r.value.score;
    }
  });

  const overall = Math.min(100, Math.max(0, Math.round(totalScore)));
  let riskLevel = 'low';
  if (overall < 40) riskLevel = 'critical';
  else if (overall < 60) riskLevel = 'high';
  else if (overall < 75) riskLevel = 'medium';

  return {
    businessId,
    overall,
    riskLevel,
    trend: 0,
    details,
    calculatedAt: new Date().toISOString()
  };
}

async function _subscriptionScore(businessId) {
  try {
    const boutique = await prisma.boutique.findFirst({ where: { businessId }, select: { id: true } });
    if (!boutique) return { score: 0, max: WEIGHTS.subscription, label: 'No boutique', weight: WEIGHTS.subscription };
    const sub = await prisma.boutiqueSubscription.findFirst({
      where: { boutiqueId: boutique.id },
      include: { plan: true },
      orderBy: { createdAt: 'desc' }
    });
    if (!sub) return { score: 0, max: WEIGHTS.subscription, label: 'No subscription', weight: WEIGHTS.subscription };
    const statusScores = { ACTIVE: 25, TRIAL: 20, PAST_DUE: 10, CANCELLED: 5, EXPIRED: 0 };
    const base = statusScores[sub.status] || 0;
    return { score: base, max: WEIGHTS.subscription, label: `Subscription: ${sub.status}`, weight: WEIGHTS.subscription };
  } catch { return null; }
}

async function _paymentScore(businessId) {
  try {
    const boutiques = await prisma.boutique.findMany({ where: { businessId }, select: { id: true } });
    const boutiqueIds = boutiques.map(b => b.id);
    if (!boutiqueIds.length) return { score: 5, max: WEIGHTS.paymentStatus, label: 'No boutiques', weight: WEIGHTS.paymentStatus };
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const failedPayments = await prisma.commercePayment.count({
      where: { boutiqueId: { in: boutiqueIds }, status: 'FAILED', createdAt: { gte: thirtyDaysAgo } }
    });
    if (failedPayments === 0) return { score: 15, max: WEIGHTS.paymentStatus, label: 'No recent failures', weight: WEIGHTS.paymentStatus };
    if (failedPayments <= 2) return { score: 10, max: WEIGHTS.paymentStatus, label: `${failedPayments} recent failures`, weight: WEIGHTS.paymentStatus };
    return { score: 5, max: WEIGHTS.paymentStatus, label: `${failedPayments} recent failures`, weight: WEIGHTS.paymentStatus };
  } catch { return null; }
}

async function _websiteScore(businessId) {
  try {
    const websites = await prisma.website.findMany({ where: { businessId }, select: { status: true } });
    if (!websites.length) return { score: 5, max: WEIGHTS.websiteUptime, label: 'No websites', weight: WEIGHTS.websiteUptime };
    const active = websites.filter(w => w.status === 'ACTIVE' || w.status === 'PUBLISHED').length;
    const ratio = active / websites.length;
    const score = Math.round(ratio * WEIGHTS.websiteUptime);
    return { score, max: WEIGHTS.websiteUptime, label: `${active}/${websites.length} active`, weight: WEIGHTS.websiteUptime };
  } catch { return null; }
}

async function _deploymentScore(businessId) {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recent = await prisma.deployment.findMany({
      where: { businessId, createdAt: { gte: sevenDaysAgo } },
      select: { status: true }
    });
    if (!recent.length) return { score: 10, max: WEIGHTS.deploymentFailures, label: 'No recent deployments', weight: WEIGHTS.deploymentFailures };
    const failed = recent.filter(d => d.status === 'FAILED' || d.status === 'BUILD_FAILED').length;
    const ratio = 1 - (failed / recent.length);
    const score = Math.round(ratio * WEIGHTS.deploymentFailures);
    return { score, max: WEIGHTS.deploymentFailures, label: `${failed}/${recent.length} failed`, weight: WEIGHTS.deploymentFailures };
  } catch { return null; }
}

async function _workflowScore(businessId) {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const executions = await prisma.workflowExecution.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { status: true }
    });
    if (!executions.length) return { score: 8, max: WEIGHTS.workflowFailures, label: 'No recent executions', weight: WEIGHTS.workflowFailures };
    const failed = executions.filter(e => e.status === 'FAILED').length;
    const ratio = 1 - (failed / executions.length);
    const score = Math.round(ratio * WEIGHTS.workflowFailures);
    return { score, max: WEIGHTS.workflowFailures, label: `${failed}/${executions.length} failed`, weight: WEIGHTS.workflowFailures };
  } catch { return null; }
}

async function _supportScore(businessId) {
  try {
    const openTickets = await prisma.supportTicket.count({
      where: { boutique: { businessId }, status: { in: ['OPEN', 'IN_PROGRESS'] } }
    });
    if (openTickets === 0) return { score: 10, max: WEIGHTS.openIssues, label: 'No open tickets', weight: WEIGHTS.openIssues };
    if (openTickets <= 3) return { score: 7, max: WEIGHTS.openIssues, label: `${openTickets} open tickets`, weight: WEIGHTS.openIssues };
    if (openTickets <= 7) return { score: 4, max: WEIGHTS.openIssues, label: `${openTickets} open tickets`, weight: WEIGHTS.openIssues };
    return { score: 1, max: WEIGHTS.openIssues, label: `${openTickets} open tickets`, weight: WEIGHTS.openIssues };
  } catch { return null; }
}

async function _aiUsageScore(businessId) {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const count = await prisma.cmsAiExecutionStep.count({
      where: { createdAt: { gte: thirtyDaysAgo } }
    });
    if (count > 10) return { score: 5, max: WEIGHTS.aiUsage, label: 'Active AI usage', weight: WEIGHTS.aiUsage };
    if (count > 0) return { score: 3, max: WEIGHTS.aiUsage, label: 'Low AI usage', weight: WEIGHTS.aiUsage };
    return { score: 1, max: WEIGHTS.aiUsage, label: 'No AI usage', weight: WEIGHTS.aiUsage };
  } catch { return null; }
}

async function _storageScore(businessId) {
  try {
    const assets = await prisma.assetLibrary.findMany({
      where: { businessId },
      select: { fileSize: true }
    });
    const totalBytes = assets.reduce((sum, a) => sum + (a.fileSize || 0), 0);
    const totalMB = totalBytes / (1024 * 1024);
    if (totalMB < 100) return { score: 5, max: WEIGHTS.storage, label: `${Math.round(totalMB)} MB used`, weight: WEIGHTS.storage };
    if (totalMB < 500) return { score: 3, max: WEIGHTS.storage, label: `${Math.round(totalMB)} MB used`, weight: WEIGHTS.storage };
    return { score: 1, max: WEIGHTS.storage, label: `${Math.round(totalMB)} MB used`, weight: WEIGHTS.storage };
  } catch { return null; }
}

module.exports = { calculateHealth };

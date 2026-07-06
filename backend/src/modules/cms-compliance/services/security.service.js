const prisma = require('../../../utils/prisma');

const SECURITY_WEIGHTS = {
  authentication: 20,
  rateLimiting: 15,
  encryption: 15,
  sslStatus: 15,
  headers: 10,
  backups: 10,
  accessPattern: 15
};

async function getSecurityPosture(businessId) {
  const results = await Promise.allSettled([
    _authScore(businessId),
    _rateLimitScore(),
    _encryptionScore(),
    _sslScore(),
    _headersScore(),
    _backupScore(businessId),
    _accessPatternScore(businessId)
  ]);

  let totalScore = 0;
  const details = {};
  const keys = ['authentication', 'rateLimiting', 'encryption', 'sslStatus', 'headers', 'backups', 'accessPattern'];

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

  return { businessId, overall, riskLevel, details, calculatedAt: new Date().toISOString() };
}

async function _authScore(businessId) {
  try {
    const owners = await prisma.owner.findMany({
      where: { businessId },
      select: { twoFactorEnabled: true, twoFactorMethod: true, lastLogin: true }
    });
    if (!owners.length) return { score: 5, max: SECURITY_WEIGHTS.authentication, label: 'No owners', weight: SECURITY_WEIGHTS.authentication };
    const with2fa = owners.filter(o => o.twoFactorEnabled).length;
    const ratio = with2fa / owners.length;
    const score = Math.round(ratio * SECURITY_WEIGHTS.authentication);
    return { score, max: SECURITY_WEIGHTS.authentication, label: `${with2fa}/${owners.length} with 2FA`, weight: SECURITY_WEIGHTS.authentication };
  } catch { return null; }
}

async function _rateLimitScore() {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 864e5);
    const recentLogs = await prisma.auditLog.count({
      where: { actionType: 'RATE_LIMIT_EXCEEDED', timestamp: { gte: sevenDaysAgo } }
    });
    if (recentLogs === 0) return { score: 15, max: SECURITY_WEIGHTS.rateLimiting, label: 'No rate limit events', weight: SECURITY_WEIGHTS.rateLimiting };
    if (recentLogs < 5) return { score: 10, max: SECURITY_WEIGHTS.rateLimiting, label: `${recentLogs} rate limit events`, weight: SECURITY_WEIGHTS.rateLimiting };
    return { score: 5, max: SECURITY_WEIGHTS.rateLimiting, label: `${recentLogs} rate limit events`, weight: SECURITY_WEIGHTS.rateLimiting };
  } catch { return null; }
}

async function _encryptionScore() {
  try {
    const settingsCount = await prisma.platformSetting.count({
      where: { key: { in: ['encryption_enabled', 'aes_key_rotated'] }, value: 'true' }
    });
    if (settingsCount >= 2) return { score: 15, max: SECURITY_WEIGHTS.encryption, label: 'Encryption active', weight: SECURITY_WEIGHTS.encryption };
    if (settingsCount === 1) return { score: 8, max: SECURITY_WEIGHTS.encryption, label: 'Partial encryption', weight: SECURITY_WEIGHTS.encryption };
    return { score: 3, max: SECURITY_WEIGHTS.encryption, label: 'Encryption not configured', weight: SECURITY_WEIGHTS.encryption };
  } catch { return null; }
}

async function _sslScore() {
  try {
    const sslSettings = await prisma.platformSetting.findFirst({
      where: { key: 'ssl_certificate_expiry' }
    });
    if (!sslSettings) return { score: 5, max: SECURITY_WEIGHTS.sslStatus, label: 'SSL status unknown', weight: SECURITY_WEIGHTS.sslStatus };
    const expiry = new Date(sslSettings.value);
    const daysLeft = Math.round((expiry - Date.now()) / 864e5);
    if (daysLeft > 30) return { score: 15, max: SECURITY_WEIGHTS.sslStatus, label: `SSL expires in ${daysLeft}d`, weight: SECURITY_WEIGHTS.sslStatus };
    if (daysLeft > 7) return { score: 10, max: SECURITY_WEIGHTS.sslStatus, label: `SSL expires in ${daysLeft}d`, weight: SECURITY_WEIGHTS.sslStatus };
    return { score: 3, max: SECURITY_WEIGHTS.sslStatus, label: `SSL expires in ${daysLeft}d`, weight: SECURITY_WEIGHTS.sslStatus };
  } catch { return null; }
}

async function _headersScore() {
  try {
    const hstsSetting = await prisma.platformSetting.findFirst({
      where: { key: 'hsts_enabled', value: 'true' }
    });
    if (hstsSetting) return { score: 10, max: SECURITY_WEIGHTS.headers, label: 'HSTS enabled', weight: SECURITY_WEIGHTS.headers };
    return { score: 3, max: SECURITY_WEIGHTS.headers, label: 'HSTS not configured', weight: SECURITY_WEIGHTS.headers };
  } catch { return null; }
}

async function _backupScore(businessId) {
  try {
    const backups = await prisma.auditLog.count({
      where: { actionType: 'BACKUP_CREATED', entityType: 'system' }
    });
    if (backups > 10) return { score: 10, max: SECURITY_WEIGHTS.backups, label: `${backups} backups recorded`, weight: SECURITY_WEIGHTS.backups };
    if (backups > 0) return { score: 5, max: SECURITY_WEIGHTS.backups, label: `${backups} backups recorded`, weight: SECURITY_WEIGHTS.backups };
    return { score: 1, max: SECURITY_WEIGHTS.backups, label: 'No backups found', weight: SECURITY_WEIGHTS.backups };
  } catch { return null; }
}

async function _accessPatternScore(businessId) {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 864e5);
    const [failedLogins, permissionDenied] = await Promise.all([
      prisma.auditLog.count({ where: { actionType: 'LOGIN_FAILED', timestamp: { gte: sevenDaysAgo } } }),
      prisma.auditLog.count({ where: { actionType: 'PERMISSION_DENIED', timestamp: { gte: sevenDaysAgo } } })
    ]);
    const totalIncidents = failedLogins + permissionDenied;
    if (totalIncidents === 0) return { score: 15, max: SECURITY_WEIGHTS.accessPattern, label: 'Clean access pattern', weight: SECURITY_WEIGHTS.accessPattern };
    if (totalIncidents < 10) return { score: 10, max: SECURITY_WEIGHTS.accessPattern, label: `${totalIncidents} access incidents`, weight: SECURITY_WEIGHTS.accessPattern };
    return { score: 3, max: SECURITY_WEIGHTS.accessPattern, label: `${totalIncidents} access incidents`, weight: SECURITY_WEIGHTS.accessPattern };
  } catch { return null; }
}

module.exports = { getSecurityPosture };

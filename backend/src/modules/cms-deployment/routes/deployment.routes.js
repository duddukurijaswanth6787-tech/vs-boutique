const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../../middleware/authMiddleware');
const deploymentService = require('../services/deployment.service');
const domainService = require('../services/domain.service');
const envVariableService = require('../services/env-variable.service');
const rollbackService = require('../services/rollback.service');
const { getAuditLogs } = require('../../../services/auditService');
const acmeService = require('../services/acme.service');
const antivirusService = require('../services/antivirus.service');
const deploymentQueue = require('../services/deployment.queue');
const metricsService = require('../services/metrics.service');

const superAdminOnly = authorize('super-admin', 'super_admin');

// ========================
// ENVIRONMENT MANAGEMENT
// ========================

router.get('/environments', protect, superAdminOnly, async (req, res) => {
  try {
    const businessId = req.query.businessId || req.user.businessId;
    const environments = await deploymentService.listEnvironments(businessId);
    res.json({ success: true, environments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/environments', protect, superAdminOnly, async (req, res) => {
  try {
    const businessId = req.body.businessId || req.user.businessId;
    const environment = await deploymentService.createEnvironment(businessId, req.body);
    res.status(201).json({ success: true, environment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/environments/:id', protect, superAdminOnly, async (req, res) => {
  try {
    const environment = await deploymentService.updateEnvironment(req.params.id, req.body);
    res.json({ success: true, environment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/environments/:id', protect, superAdminOnly, async (req, res) => {
  try {
    const environment = await deploymentService.deleteEnvironment(req.params.id);
    res.json({ success: true, environment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ========================
// DEPLOYMENT MANAGEMENT
// ========================

router.get('/', protect, superAdminOnly, async (req, res) => {
  try {
    const businessId = req.query.businessId || req.user.businessId;
    const result = await deploymentService.listDeployments(businessId, req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', protect, superAdminOnly, async (req, res) => {
  try {
    const deployment = await deploymentService.getDeployment(req.params.id);
    if (!deployment) {
      return res.status(404).json({ success: false, message: 'Deployment not found' });
    }
    res.json({ success: true, deployment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', protect, superAdminOnly, async (req, res) => {
  try {
    const businessId = req.body.businessId || req.user.businessId;
    const deployment = await deploymentService.createDeployment(businessId, req.user.id, req.body);
    res.status(201).json({ success: true, deployment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/:id/build', protect, superAdminOnly, async (req, res) => {
  try {
    const deployment = await deploymentService.startBuild(req.params.id);
    res.json({ success: true, deployment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/:id/deploy', protect, superAdminOnly, async (req, res) => {
  try {
    const { artifactUrl, checksum } = req.body;
    const deployment = await deploymentService.deployArtifacts(req.params.id);
    const completed = await deploymentService.completeDeployment(req.params.id, artifactUrl, checksum);
    res.json({ success: true, deployment: completed });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/:id/cancel', protect, superAdminOnly, async (req, res) => {
  try {
    const deployment = await deploymentService.cancelDeployment(req.params.id);
    res.json({ success: true, deployment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.get('/:id/logs', protect, superAdminOnly, async (req, res) => {
  try {
    const logs = await deploymentService.getDeploymentLogs(req.params.id);
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ========================
// DOMAIN MANAGEMENT
// ========================

router.get('/domains', protect, superAdminOnly, async (req, res) => {
  try {
    const businessId = req.query.businessId || req.user.businessId;
    const result = await domainService.listDomains(businessId, req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/domains/:id', protect, superAdminOnly, async (req, res) => {
  try {
    const domain = await domainService.getDomain(req.params.id);
    if (!domain) {
      return res.status(404).json({ success: false, message: 'Domain not found' });
    }
    res.json({ success: true, domain });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/domains', protect, superAdminOnly, async (req, res) => {
  try {
    const businessId = req.body.businessId || req.user.businessId;
    const domain = await domainService.createDomain(businessId, req.body);
    res.status(201).json({ success: true, domain });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/domains/:id/verify-dns', protect, superAdminOnly, async (req, res) => {
  try {
    const result = await domainService.verifyDns(req.params.id);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/domains/:id/check-propagation', protect, superAdminOnly, async (req, res) => {
  try {
    const result = await domainService.checkPropagation(req.params.id);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/domains/:id/request-ssl', protect, superAdminOnly, async (req, res) => {
  try {
    const domain = await domainService.requestSsl(req.params.id);
    res.json({ success: true, domain });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/domains/:id/activate', protect, superAdminOnly, async (req, res) => {
  try {
    const domain = await domainService.activateDomain(req.params.id);
    res.json({ success: true, domain });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/domains/:id/primary', protect, superAdminOnly, async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const domain = await domainService.setPrimary(req.params.id, businessId);
    res.json({ success: true, domain });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/domains/:id', protect, superAdminOnly, async (req, res) => {
  try {
    const domain = await domainService.deleteDomain(req.params.id);
    res.json({ success: true, domain });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.get('/domains/stats', protect, superAdminOnly, async (req, res) => {
  try {
    const businessId = req.query.businessId || req.user.businessId;
    const stats = await domainService.getDomainStats(businessId);
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ========================
// ENVIRONMENT VARIABLES
// ========================

router.get('/environments/:envId/variables', protect, superAdminOnly, async (req, res) => {
  try {
    const variables = await envVariableService.listVariables(req.params.envId);
    res.json({ success: true, variables });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/environments/:envId/variables', protect, superAdminOnly, async (req, res) => {
  try {
    const variable = await envVariableService.createVariable(req.params.envId, req.body, req.user.id);
    res.status(201).json({ success: true, variable });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/variables/:id', protect, superAdminOnly, async (req, res) => {
  try {
    const variable = await envVariableService.updateVariable(req.params.id, req.body, req.user.id);
    res.json({ success: true, variable });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/variables/:id', protect, superAdminOnly, async (req, res) => {
  try {
    await envVariableService.deleteVariable(req.params.id);
    res.json({ success: true, message: 'Variable deleted' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.get('/variables/:id/history', protect, superAdminOnly, async (req, res) => {
  try {
    const history = await envVariableService.getVariableHistory(req.params.id);
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/variables/:id/rollback', protect, superAdminOnly, async (req, res) => {
  try {
    const { version } = req.body;
    if (!version) return res.status(400).json({ success: false, message: 'Target version required' });
    const variable = await envVariableService.rollbackVariable(req.params.id, version, req.user.id);
    res.json({ success: true, variable });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ========================
// ROLLBACK MANAGEMENT
// ========================

router.get('/rollback/targets', protect, superAdminOnly, async (req, res) => {
  try {
    const businessId = req.query.businessId || req.user.businessId;
    const targets = await rollbackService.getRollbackTargets(businessId, req.query.environmentId);
    res.json({ success: true, targets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/rollback/:id', protect, superAdminOnly, async (req, res) => {
  try {
    const deployment = await rollbackService.rollback(req.params.id, req.user.id);
    res.json({ success: true, deployment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.get('/rollback/history', protect, superAdminOnly, async (req, res) => {
  try {
    const businessId = req.query.businessId || req.user.businessId;
    const result = await rollbackService.getRollbackHistory(businessId, parseInt(req.query.limit) || 50, parseInt(req.query.offset) || 0);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ========================
// HEALTH & STATS
// ========================

router.get('/health/status', protect, superAdminOnly, async (req, res) => {
  try {
    const businessId = req.query.businessId || req.user.businessId;
    const health = await deploymentService.getHealthStatus(businessId);
    res.json({ success: true, health });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/stats/overview', protect, superAdminOnly, async (req, res) => {
  try {
    const businessId = req.query.businessId || req.user.businessId;
    const stats = await deploymentService.getDeploymentStats(businessId);
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ========================
// QUEUE MANAGEMENT
// ========================

router.get('/queue/metrics', protect, superAdminOnly, async (req, res) => {
  try {
    const metrics = await deploymentQueue.getQueueMetrics();
    res.json({ success: true, metrics });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ========================
// ACME / LETS ENCRYPT SSL
// ========================

router.post('/domains/:id/provision-ssl', protect, superAdminOnly, async (req, res) => {
  try {
    const domain = await domainService.getDomain(req.params.id);
    if (!domain) return res.status(404).json({ success: false, message: 'Domain not found' });
    const result = await acmeService.provisionCertificate(domain.domain);
    res.json({ success: true, ssl: result });
  } catch (err) {
    const isAcme = err.message && (err.message.includes('ACME') || err.message.includes('letsencrypt'));
    res.status(isAcme ? 502 : 400).json({
      success: false,
      message: err.message,
      hint: isAcme ? 'Check ACME_EMAIL environment variable and ensure domain DNS resolves to this server' : undefined
    });
  }
});

router.get('/domains/:id/ssl-status', protect, superAdminOnly, async (req, res) => {
  try {
    const domain = await domainService.getDomain(req.params.id);
    if (!domain) return res.status(404).json({ success: false, message: 'Domain not found' });
    const status = await acmeService.checkCertificateStatus(domain.domain);
    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ========================
// ANTIVIRUS SCAN
// ========================

router.post('/scan', protect, superAdminOnly, async (req, res) => {
  try {
    const { filePath } = req.body;
    if (!filePath) return res.status(400).json({ success: false, message: 'filePath is required' });

    const result = await antivirusService.scanFile(filePath);
    metricsService.recordBuildLog(result.infected ? 'WARN' : 'INFO');

    res.json({
      success: true,
      scan: {
        infected: result.infected,
        threat: result.threat || null,
        scanner: result.scanner,
        fallback: result.fallback || false,
        warning: result.warning || null,
        duration: result.duration
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/validate-zip', protect, superAdminOnly, async (req, res) => {
  try {
    const { entries } = req.body;
    if (!entries || !Array.isArray(entries)) {
      return res.status(400).json({ success: false, message: 'entries array is required' });
    }
    const result = antivirusService.validateZipBomb(entries);
    res.json({ success: true, validation: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ========================
// AUDIT LOGS
// ========================

router.get('/audit-logs', protect, superAdminOnly, async (req, res) => {
  try {
    const { entityType, entityId, actionType, limit, offset } = req.query;
    const result = await getAuditLogs(entityType, entityId, {
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
      actionType
    });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/audit-logs/deployment/:deploymentId', protect, superAdminOnly, async (req, res) => {
  try {
    const result = await getAuditLogs('Deployment', req.params.deploymentId);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ========================
// PROMETHEUS METRICS
// ========================

router.get('/metrics', async (req, res) => {
  try {
    const metrics = await metricsService.getMetrics();
    res.set('Content-Type', metricsService.getContentType());
    res.end(metrics);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

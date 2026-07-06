const prisma = require('../../../utils/prisma');
const cache = require('../middleware/workflow-cache');
const auditService = require('../../../services/auditService');
const { eventBus, Events } = require('../../../services/eventBus');
const templatesService = require('./templates.service');

class CmsWorkflowService {
  async discover() {
    const cached = await cache.get('discover');
    if (cached) return cached;

    const [aiWorkflows, certDefs, templatePipelines, workflowDefs] = await Promise.all([
      prisma.cmsAiWorkflow.findMany({ orderBy: { createdAt: 'desc' } }).catch(() => []),
      prisma.certificationWorkflowDefinition.findMany({ orderBy: { createdAt: 'desc' } }).catch(() => []),
      this._getTemplatePipelineSummary(),
      prisma.workflowDefinition.findMany({ orderBy: { createdAt: 'desc' }, include: { _count: { select: { executions: true } } } }).catch(() => [])
    ]);

    const result = {
      aiWorkflows: { count: aiWorkflows.length, items: aiWorkflows.map(w => ({ id: w.id, name: w.name, status: w.status, trigger: w.trigger, type: 'ai' })) },
      certificationWorkflows: { count: certDefs.length, items: certDefs.map(w => ({ id: w.id, name: w.name || w.id.substring(0, 8), status: 'active', type: 'certification' })) },
      templatePipelines: { count: templatePipelines.length, items: templatePipelines },
      workflowDefinitions: { count: workflowDefs.length, items: workflowDefs.map(w => ({ id: w.id, name: w.name, executionCount: w._count.executions, type: 'definition' })) },
      total: aiWorkflows.length + certDefs.length + templatePipelines.length + workflowDefs.length
    };

    await cache.set('discover', result, 120);
    return result;
  }

  async getTemplates() {
    return templatesService.list();
  }

  async launch(templateSlug, payload = {}, userId = 'SYSTEM', ipAddress = null) {
    const template = await templatesService.get(templateSlug);
    if (!template) throw new Error(`Workflow template not found: ${templateSlug}`);

    const engine = template.engine || 'ai-workflow';
    let execution;

    switch (engine) {
      case 'ai-workflow': {
        const aiWorkflowService = require('../../cms-ai-center/services/workflow.service');
        const created = await aiWorkflowService.create({
          name: payload.name || template.name,
          description: payload.description || template.description,
          stages: template.stages || [],
          trigger: 'manual',
          status: 'active'
        });
        execution = await aiWorkflowService.execute(created.id);
        execution.type = 'ai';
        execution.workflowId = created.id;
        break;
      }
      case 'certification': {
        const certService = require('../../website-certification/services/certification.service');
        const businessId = payload.businessId;
        const releaseTag = payload.releaseTag || 'latest';
        if (!businessId) throw new Error('businessId required for certification workflow');
        const certExecution = await certService.runAudit(businessId, releaseTag, payload.targetType, payload.targetId);
        execution = { status: 'completed', type: 'certification', result: certExecution };
        break;
      }
      case 'template-pipeline': {
        const templatesSvc = require('../../cms-templates/services/templates.service');
        const businessId = payload.businessId;
        const templateId = payload.templateId;
        if (!businessId || !templateId) throw new Error('businessId and templateId required for template pipeline');
        const result = await templatesSvc.assignToBusiness(templateId, businessId, payload.config, userId);
        execution = { status: 'completed', type: 'template-pipeline', result };
        break;
      }
      case 'deployment': {
        const deploymentService = require('../../cms-deployment/services/deployment.service');
        const businessId = payload.businessId;
        if (!businessId) throw new Error('businessId required for deployment workflow');
        const deployment = await deploymentService.createDeployment(businessId, userId, payload.config || {});
        execution = { status: 'completed', type: 'deployment', result: deployment };
        break;
      }
      case 'business-assignment': {
        const assignmentService = require('../../cms-business-assignment/services/assignment.service');
        const businessId = payload.businessId;
        const templateId = payload.templateId;
        if (!businessId || !templateId) throw new Error('businessId and templateId required for business assignment');
        const assignment = await assignmentService.beginAssignment(businessId, templateId, userId);
        execution = { status: 'completed', type: 'business-assignment', result: assignment };
        break;
      }
      case 'ai-core': {
        const aiCoreService = require('../../ai-core/services/aiCore.service');
        const session = await aiCoreService.createSession(payload.name || template.name, payload.vertical || 'general');
        const result = await aiCoreService.executeSession(session.id);
        execution = { status: 'completed', type: 'ai-core', sessionId: session.id, result };
        break;
      }
      default:
        throw new Error(`Unknown engine type: ${engine}`);
    }

    eventBus.emit(Events.WORKFLOW_STARTED, { templateSlug, engine, userId, timestamp: new Date() });
    if (execution.status === 'completed') {
      eventBus.emit(Events.WORKFLOW_COMPLETED, { templateSlug, engine, userId, timestamp: new Date() });
    } else {
      eventBus.emit(Events.WORKFLOW_FAILED, { templateSlug, engine, userId, error: 'Execution did not complete', timestamp: new Date() });
    }

    auditService.logAction('LAUNCH_WORKFLOW', 'workflow', templateSlug, userId, { template: templateSlug, engine, payload }, ipAddress);

    await cache.del('discover');
    return { template: templateSlug, engine, execution };
  }

  async getExecutions(filters = {}) {
    const { page = 1, limit = 20, status, type } = filters;
    const skip = (page - 1) * limit;
    const cacheKey = `executions:${page}:${limit}:${status || 'all'}:${type || 'all'}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const results = { executions: [], total: 0 };

    const promises = [];

    if (!type || type === 'ai') {
      promises.push(
        prisma.cmsAiExecutionStep.findMany({
          where: status ? { status } : {},
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip,
          include: { execution: true }
        }).then(steps => {
          results.executions.push(...steps.map(s => ({
            id: s.id,
            type: 'ai',
            name: s.agentName || s.agentKey,
            status: s.status,
            createdAt: s.createdAt,
            tokensUsed: s.tokensUsed,
            latencyMs: s.latencyMs,
            retryCount: s.retryCount,
            errorMessage: s.errorMessage
          })));
        }).catch(() => {})
      );
    }

    if (!type || type === 'certification') {
      promises.push(
        prisma.certificationWorkflow.findMany({
          where: status ? { status } : {},
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip
        }).then(certs => {
          results.executions.push(...certs.map(c => ({
            id: c.id,
            type: 'certification',
            name: `Certification ${c.id.substring(0, 8)}`,
            status: c.status,
            createdAt: c.createdAt,
            progress: c.progress
          })));
        }).catch(() => {})
      );
    }

    if (!type || type === 'workflow_execution') {
      promises.push(
        prisma.workflowExecution.findMany({
          where: status ? { status } : {},
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip
        }).then(wfEx => {
          results.executions.push(...wfEx.map(e => ({
            id: e.id,
            type: 'workflow_execution',
            name: `Execution ${e.id.substring(0, 8)}`,
            status: e.status,
            createdAt: e.createdAt,
            progress: e.progress
          })));
        }).catch(() => {})
      );
    }

    await Promise.all(promises);

    results.executions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    results.total = results.executions.length;

    await cache.set(cacheKey, results, 60);
    return results;
  }

  async getAnalytics() {
    const cached = await cache.get('analytics');
    if (cached) return cached;

    const [aiCount, aiCompleted, aiFailed, certCount, certCompleted, certFailed, wfExCount, wfExCompleted, wfExFailed] = await Promise.all([
      prisma.cmsAiExecutionStep.count().catch(() => 0),
      prisma.cmsAiExecutionStep.count({ where: { status: 'COMPLETED' } }).catch(() => 0),
      prisma.cmsAiExecutionStep.count({ where: { status: 'FAILED' } }).catch(() => 0),
      prisma.certificationWorkflow.count().catch(() => 0),
      prisma.certificationWorkflow.count({ where: { status: 'COMPLETED' } }).catch(() => 0),
      prisma.certificationWorkflow.count({ where: { status: 'FAILED' } }).catch(() => 0),
      prisma.workflowExecution.count().catch(() => 0),
      prisma.workflowExecution.count({ where: { status: 'COMPLETED' } }).catch(() => 0),
      prisma.workflowExecution.count({ where: { status: 'FAILED' } }).catch(() => 0)
    ]);

    const total = aiCount + certCount + wfExCount;
    const completed = aiCompleted + certCompleted + wfExCompleted;
    const failed = aiFailed + certFailed + wfExFailed;

    const result = {
      total,
      completed,
      failed,
      pending: total - completed - failed,
      successRate: total > 0 ? Math.round((completed / total) * 100) : 100,
      breakdown: {
        ai: { total: aiCount, completed: aiCompleted, failed: aiFailed },
        certification: { total: certCount, completed: certCompleted, failed: certFailed },
        workflowExecution: { total: wfExCount, completed: wfExCompleted, failed: wfExFailed }
      }
    };

    await cache.set('analytics', result, 120);
    return result;
  }

  async getExecutionDetail(id, type) {
    switch (type) {
      case 'ai': {
        const step = await prisma.cmsAiExecutionStep.findUnique({
          where: { id },
          include: { execution: true }
        });
        return step;
      }
      case 'certification': {
        const certWf = await prisma.certificationWorkflow.findUnique({
          where: { id }
        });
        return certWf;
      }
      case 'workflow_execution': {
        const wfEx = await prisma.workflowExecution.findUnique({
          where: { id },
          include: { workflow: true }
        });
        return wfEx;
      }
      default:
        throw new Error(`Unknown execution type: ${type}`);
    }
  }

  async _getTemplatePipelineSummary() {
    try {
      const stages = await prisma.cmsTemplatePipelineStage.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        distinct: ['templateId']
      });
      return stages.map(s => ({
        id: s.id,
        name: s.stageName || s.id.substring(0, 8),
        status: s.status || 'unknown',
        type: 'template-pipeline'
      }));
    } catch { return []; }
  }
}

module.exports = new CmsWorkflowService();

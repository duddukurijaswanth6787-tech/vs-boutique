const prisma = require('../../../utils/prisma');
const cache = require('../middleware/ai-center-cache');
const eventBus = require('../../../services/eventBus').eventBus;
const queueManager = require('../../ai-core/queues/queueManager');
const aiCoreService = require('../../ai-core/services/aiCore.service');

class AiWorkflowService {
  async list() {
    const cached = await cache.get('ai:workflows:list');
    if (cached) return cached;
    const workflows = await prisma.cmsAiWorkflow.findMany({ orderBy: { createdAt: 'desc' } });
    await cache.set('ai:workflows:list', workflows);
    return workflows;
  }

  async get(id) {
    const cacheKey = `ai:workflows:${id}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;
    const workflow = await prisma.cmsAiWorkflow.findUnique({ where: { id } });
    if (workflow) await cache.set(cacheKey, workflow);
    return workflow;
  }

  async create(data) {
    const workflow = await prisma.cmsAiWorkflow.create({
      data: {
        name: data.name,
        description: data.description,
        stages: data.stages || [],
        status: data.status || 'active',
        trigger: data.trigger || 'manual',
        schedule: data.schedule,
        eventTrigger: data.eventTrigger
      }
    });
    eventBus.emit('ai:workflow:started', { workflowId: workflow.id, workflowName: workflow.name });
    await cache.del('ai:workflows:*');
    return workflow;
  }

  async update(id, data) {
    const workflow = await prisma.cmsAiWorkflow.update({ where: { id }, data });
    await cache.del('ai:workflows:*');
    return workflow;
  }

  async remove(id) {
    await prisma.cmsAiWorkflow.delete({ where: { id } });
    await cache.del('ai:workflows:*');
    return { deleted: true };
  }

  async execute(id) {
    const workflow = await this.get(id);
    if (!workflow) throw new Error('Workflow not found');

    const stages = workflow.stages;
    if (!stages || stages.length === 0) throw new Error('Workflow has no stages');

    const executionResults = [];
    for (const stage of stages) {
      try {
        const result = await this._executeStage(stage, workflow);
        executionResults.push({ stage: stage.name, agentKey: stage.agentKey, status: 'completed', result });
      } catch (err) {
        executionResults.push({ stage: stage.name, agentKey: stage.agentKey, status: 'failed', error: err.message });
        eventBus.emit('ai:workflow:failed', { workflowId: id, workflowName: workflow.name, stage: stage.name, error: err.message });
        return { workflow: workflow.name, status: 'failed', results: executionResults };
      }
    }

    eventBus.emit('ai:workflow:completed', { workflowId: id, workflowName: workflow.name, stages: stages.length });
    await cache.del('ai:workflows:*');
    return { workflow: workflow.name, status: 'completed', results: executionResults };
  }

  async _executeStage(stage, workflow) {
    switch (stage.type) {
      case 'prompt':
      case 'prompt-library':
        return this._executePromptStage(stage);
      case 'blueprint':
        return this._executeBlueprintStage(stage);
      case 'verification':
        return this._executeVerificationStage(stage);
      case 'certification':
        return this._executeCertificationStage(stage);
      case 'ai-fix':
        return this._executeAiFixStage(stage);
      case 'validation-report':
        return this._executeValidationReportStage(stage);
      case 'template':
        return this._executeTemplateStage(stage);
      case 'business-assignment':
        return this._executeAssignmentStage(stage);
      case 'deployment':
        return this._executeDeploymentStage(stage);
      case 'agent':
      case 'pipeline':
        return this._executePipelineAgent(stage, workflow);
      default:
        if (stage.agentKey) return this._executePipelineAgent(stage, workflow);
        throw new Error(`Unknown stage type: ${stage.type}`);
    }
  }

  async _executePromptStage(stage) {
    const promptsService = require('../../cms-prompts/services/prompts.service');
    if (stage.promptId) return promptsService.renderPrompt(stage.promptId, stage.variables || {});
    return { rendered: true, stage: stage.name };
  }

  async _executeBlueprintStage(stage) {
    const blueprintService = require('../../cms-blueprints/services/blueprint.service');
    if (stage.requirementId) return blueprintsService.generateFromRequirement(stage.requirementId);
    return { generated: true, stage: stage.name };
  }

  async _executeVerificationStage(stage) {
    const verificationService = require('../../cms-verification/services/verification.service');
    if (stage.projectId) return verificationService.verifyProject(stage.projectId);
    return { verified: true, stage: stage.name };
  }

  async _executeCertificationStage(stage) {
    const certService = require('../../website-certification/services/certification.service');
    if (stage.releaseTag) return certService.runAudit(stage.businessId, stage.releaseTag, stage.targetType, stage.targetId);
    return { certified: true, stage: stage.name };
  }

  async _executeAiFixStage(stage) {
    const certService = require('../../website-certification/services/certification.service');
    if (stage.autoFixId) return certService.applyAutoFix(stage.autoFixId, stage.userId);
    return { fixed: true, stage: stage.name };
  }

  async _executeValidationReportStage(stage) {
    const reportsService = require('../../cms-reports/services/reports.service');
    if (stage.certificationId) return reportsService.generateReport(stage.certificationId);
    return { reported: true, stage: stage.name };
  }

  async _executeTemplateStage(stage) {
    const templatesService = require('../../cms-templates/services/templates.service');
    if (stage.businessId && stage.templateId) return templatesService.assignToBusiness(stage.templateId, stage.businessId, stage.config, stage.userId);
    return { templated: true, stage: stage.name };
  }

  async _executeAssignmentStage(stage) {
    const assignmentService = require('../../cms-business-assignment/services/assignment.service');
    if (stage.businessId && stage.templateId) return assignmentService.beginAssignment(stage.businessId, stage.templateId, stage.userId || 'system');
    return { assigned: true, stage: stage.name };
  }

  async _executeDeploymentStage(stage) {
    const deploymentService = require('../../cms-deployment/services/deployment.service');
    if (stage.businessId) return deploymentService.createDeployment(stage.businessId, stage.userId || 'system', stage.config || {});
    return { deployed: true, stage: stage.name };
  }

  async _executePipelineAgent(stage, workflow) {
    const agent = await prisma.cmsAiAgent.findFirst({ where: { key: stage.agentKey } });
    if (!agent) throw new Error(`Agent not found: ${stage.agentKey}`);

    const session = await aiCoreService.createSession(workflow.name || 'Workflow Execution', stage.vertical || 'general');
    await aiCoreService.executeSession(session.id);
    return { sessionId: session.id, agentKey: stage.agentKey };
  }

  async pause(id) {
    await this.update(id, { status: 'paused' });
    return { paused: true };
  }

  async resume(id) {
    await this.update(id, { status: 'active' });
    return { resumed: true };
  }

  async cancel(id) {
    await this.update(id, { status: 'cancelled' });
    eventBus.emit('ai:workflow:failed', { workflowId: id, workflowName: id, error: 'Cancelled by user' });
    return { cancelled: true };
  }

  async getEngineIntegrations() {
    return [
      { type: 'prompt', name: 'Prompt Library', module: 'cms-prompts', endpoint: '/api/v1/cms/prompts' },
      { type: 'blueprint', name: 'Blueprint Engine', module: 'cms-blueprints', endpoint: '/api/v1/cms/blueprints' },
      { type: 'verification', name: 'Verification Engine', module: 'cms-verification', endpoint: '/api/v1/cms/projects' },
      { type: 'certification', name: 'Certification Engine', module: 'website-certification', endpoint: '/api/v1/cms/certification' },
      { type: 'ai-fix', name: 'AI Fix Engine', module: 'website-certification', endpoint: '/api/v1/cms/certification/autofix' },
      { type: 'validation-report', name: 'Validation Reports', module: 'cms-reports', endpoint: '/api/v1/cms/reports' },
      { type: 'template', name: 'Template Library', module: 'cms-templates', endpoint: '/api/v1/cms/templates' },
      { type: 'business-assignment', name: 'Business Assignment', module: 'cms-business-assignment', endpoint: '/api/v1/cms/business-assignment' },
      { type: 'deployment', name: 'Deployment Platform', module: 'cms-deployment', endpoint: '/api/v1/cms/deployment' }
    ];
  }

  async toggle(id, action) {
    if (action === 'pause') return this.pause(id);
    if (action === 'resume') return this.resume(id);
    if (action === 'cancel') return this.cancel(id);
    throw new Error(`Unknown action: ${action}`);
  }
}

module.exports = new AiWorkflowService();

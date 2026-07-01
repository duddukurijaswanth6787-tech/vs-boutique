const prisma = require('../../../utils/prisma');
const { eventBus } = require('../../../services/eventBus');
const aiEventBus = require('../../ai-core/utils/eventBus');
const templatesService = require('./templates.service');
const { invalidateCache } = require('../middleware/cache');

class TemplateIntegrationService {
  constructor() {
    this._initSubscriptions();
  }

  _initSubscriptions() {
    // Certifications from AI-core eventBus
    aiEventBus.on('CertificationCompleted', async (data) => {
      try {
        await this._onCertificationCompleted(data);
      } catch (err) {
        console.error('[TemplateIntegration] CertificationCompleted handler error:', err.message);
      }
    });

    aiEventBus.on('AutoFixApplied', async (data) => {
      try {
        await this._onAutoFixApplied(data);
      } catch (err) {
        console.error('[TemplateIntegration] AutoFixApplied handler error:', err.message);
      }
    });

    // Lookup event — triggered when upload completes, for pipeline automation
    aiEventBus.on('CertificationStarted', async (data) => {
      try {
        await this._onCertificationStarted(data);
      } catch (err) {
        console.error('[TemplateIntegration] CertificationStarted handler error:', err.message);
      }
    });

    // Template assignment events from main eventBus
    eventBus.on('template:assigned', async (data) => {
      try {
        await this._onTemplateAssigned(data);
      } catch (err) {
        console.error('[TemplateIntegration] template:assigned handler error:', err.message);
      }
    });
  }

  // ==========================================
  // CERTIFICATION INTEGRATION
  // ==========================================

  async _onCertificationStarted(data) {
    const { workflowId, releaseTag, businessId } = data;

    const cert = await prisma.boutiqueCertification.findFirst({
      where: { releaseTag, businessId },
      orderBy: { createdAt: 'desc' }
    });
    if (!cert) return;

    // If there's a template linked to this certification, advance pipeline
    const template = await prisma.cmsTemplate.findFirst({
      where: { certificationId: cert.id }
    });

    if (template) {
      await this._advancePipelineStage(template.id, 'CERTIFICATION', {
        status: 'RUNNING',
        startedAt: new Date(),
        inputArtifact: `workflow:${workflowId}`,
        agent: 'certification-engine'
      });
    }
  }

  async _onCertificationCompleted(data) {
    const { workflowId, releaseTag, overallScore } = data;

    // Find the certification record
    const cert = await prisma.boutiqueCertification.findFirst({
      where: {
        releaseTag,
        workflow: { id: workflowId }
      },
      include: { profile: true },
      orderBy: { createdAt: 'desc' }
    });
    if (!cert) return;

    // Check if a template already exists for this certification
    let template = await prisma.cmsTemplate.findFirst({
      where: { certificationId: cert.id }
    });

    if (!template) {
      // Look for an existing DRAFT template for this release
      template = await prisma.cmsTemplate.findFirst({
        where: {
          status: { in: ['DRAFT', 'VERIFYING', 'CERTIFYING', 'FIXING'] },
          promptId: cert.targetType === 'WEBSITE' ? { not: null } : undefined
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (!template) return;

    // Update certificationId on template
    await prisma.cmsTemplate.update({
      where: { id: template.id },
      data: { certificationId: cert.id }
    });

    // Store certification report in template manifest
    const existingManifest = template.manifest || {};
    const updatedManifest = {
      ...existingManifest,
      certification: {
        id: cert.id,
        profileId: cert.profileId,
        profileName: cert.profile?.name,
        overallScore,
        scoresMap: cert.scoresMap,
        issues: cert.issues,
        suggestions: cert.suggestions,
        completedAt: new Date().toISOString()
      }
    };

    await prisma.cmsTemplate.update({
      where: { id: template.id },
      data: { manifest: updatedManifest }
    });

    // Advance pipeline to completed certification stage
    await this._advancePipelineStage(template.id, 'CERTIFICATION', {
      status: 'COMPLETED',
      finishedAt: new Date(),
      duration: null,
      outputArtifact: `certification:${cert.id}:score=${overallScore}`,
      agent: 'certification-engine'
    });

    // Auto-advance to AI_FIX stage
    await this._advancePipelineStage(template.id, 'AI_FIX', {
      status: 'PENDING',
      agent: 'autofix-engine'
    });

    await invalidateCache(`template:*`);
  }

  async _onAutoFixApplied(data) {
    const { queueItemId, releaseTag } = data;

    const queueItem = await prisma.autoFixQueueItem.findUnique({
      where: { id: queueItemId }
    });
    if (!queueItem) return;

    // Find related template
    const template = await prisma.cmsTemplate.findFirst({
      where: {
        OR: [
          { blueprintId: queueItem.businessId },
          { promptId: { not: null } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!template) return;

    // Advance AI_FIX pipeline stage
    await this._advancePipelineStage(template.id, 'AI_FIX', {
      status: 'COMPLETED',
      finishedAt: new Date(),
      outputArtifact: `autofix:${queueItemId}`,
      agent: 'autofix-engine'
    });

    // Auto-promote template to CERTIFIED
    await prisma.cmsTemplate.update({
      where: { id: template.id },
      data: { status: 'CERTIFIED', updatedBy: null }
    });

    // Record pipeline completion for TEMPLATE stage
    await this._advancePipelineStage(template.id, 'TEMPLATE', {
      status: 'COMPLETED',
      finishedAt: new Date(),
      outputArtifact: `template:${template.id}`,
      agent: 'template-pipeline'
    });

    // Auto-publish certified templates
    await prisma.cmsTemplate.update({
      where: { id: template.id },
      data: { status: 'PUBLISHED', isActive: true }
    });

    await invalidateCache(`template:*`);
  }

  // ==========================================
  // DEPLOYMENT INTEGRATION
  // ==========================================

  async _onTemplateAssigned(data) {
    const { templateId, businessId, userId } = data;

    // Find the assignment record
    const assignment = await prisma.businessTemplateAssignment.findFirst({
      where: { templateId, businessId },
      include: { template: true }
    });
    if (!assignment) return;

    // Get or create a deployment environment for the business
    let env = await prisma.deploymentEnvironment.findFirst({
      where: { businessId, isActive: true },
      orderBy: { sortOrder: 'asc' }
    });

    if (!env) {
      env = await prisma.deploymentEnvironment.create({
        data: {
          businessId,
          name: 'production',
          type: 'PRODUCTION',
          sortOrder: 0
        }
      });
    }

    // Create deployment record linked to template assignment
    const deployment = await prisma.deployment.create({
      data: {
        businessId,
        environmentId: env.id,
        version: assignment.template?.version?.toString() || '1.0.0',
        builder: 'template-assignment',
        status: 'PENDING',
        deployedBy: userId || assignment.assignedBy,
        metadata: {
          templateId,
          templateName: assignment.template?.name,
          assignmentId: assignment.id,
          source: 'template-library'
        }
      }
    });

    // Update assignment with deployment reference
    await prisma.businessTemplateAssignment.update({
      where: { id: assignment.id },
      data: {
        deploymentId: deployment.id,
        environmentId: env.id,
        status: 'IN_PROGRESS'
      }
    });

    await invalidateCache(`template:*`);
  }

  // ==========================================
  // PIPELINE AUTOMATION
  // ==========================================

  async _advancePipelineStage(templateId, stage, data) {
    return templatesService.advancePipeline(templateId, stage, {
      status: data.status || 'COMPLETED',
      startedAt: data.startedAt,
      finishedAt: data.finishedAt,
      duration: data.duration,
      inputArtifact: data.inputArtifact,
      outputArtifact: data.outputArtifact,
      retryCount: data.retryCount || 0,
      agent: data.agent,
      error: data.error
    }, null);
  }

  // ==========================================
  // MANUAL PIPELINE TRIGGER (for external calls)
  // ==========================================

  async triggerPipelineAdvancement(templateId, stage, status, metadata = {}) {
    const template = await prisma.cmsTemplate.findUnique({ where: { id: templateId } });
    if (!template) throw new Error('Template not found');

    const stageOrder = ['PROMPT', 'GENERATION', 'UPLOAD', 'VERIFICATION', 'CERTIFICATION', 'AI_FIX', 'TEMPLATE'];
    const currentIdx = stageOrder.indexOf(stage === 'TEMPLATE' ? 'TEMPLATE' : stage);

    // Advance the requested stage
    await this._advancePipelineStage(templateId, stage, {
      status,
      ...metadata,
      agent: metadata.agent || 'manual-trigger'
    });

    // If completed, advance to next stage automatically
    if (status === 'COMPLETED' && currentIdx >= 0 && currentIdx < stageOrder.length - 1) {
      const nextStage = stageOrder[currentIdx + 1];
      await this._advancePipelineStage(templateId, nextStage, {
        status: 'PENDING',
        agent: 'auto-advance'
      });

      // Update template status
      const statusMap = {
        UPLOAD: 'VERIFYING',
        VERIFICATION: 'CERTIFYING',
        CERTIFICATION: 'FIXING',
        AI_FIX: 'CERTIFIED'
      };
      const newStatus = statusMap[nextStage];
      if (newStatus) {
        await prisma.cmsTemplate.update({
          where: { id: templateId },
          data: { status: newStatus }
        });
      }
    }

    return { templateId, stage, status };
  }

  // ==========================================
  // LINK CERTIFICATION RESULT TO TEMPLATE
  // ==========================================

  async linkCertificationToTemplate(templateId, certificationId, userId) {
    const cert = await prisma.boutiqueCertification.findUnique({
      where: { id: certificationId },
      include: { profile: true }
    });
    if (!cert) return null;

    const template = await prisma.cmsTemplate.update({
      where: { id: templateId },
      data: {
        certificationId: cert.id,
        manifest: {
          ...((await prisma.cmsTemplate.findUnique({ where: { id: templateId } }))?.manifest || {}),
          certification: {
            id: cert.id,
            profileId: cert.profileId,
            profileName: cert.profile?.name,
            overallScore: cert.overallScore,
            scoresMap: cert.scoresMap,
            issues: cert.issues,
            suggestions: cert.suggestions,
            completedAt: new Date().toISOString()
          }
        }
      }
    });

    await invalidateCache(`template:*`);
    return template;
  }
}

module.exports = new TemplateIntegrationService();

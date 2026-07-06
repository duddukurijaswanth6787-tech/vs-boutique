const prisma = require('../../../utils/prisma');
const eventBus = require('../../../services/eventBus').eventBus;
const templatesService = require('../../cms-templates/services/templates.service');
const cache = require('../middleware/assignment-cache');
const deploymentQueue = require('../../cms-deployment/services/deployment.queue');

class AssignmentOrchestrator {
  async listAssignments(params = {}) {
    const cacheKey = `assignments:list:${JSON.stringify(params)}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const { page = 1, limit = 20, search, sortBy = 'assignedAt', sortOrder = 'desc', status, businessId, templateId } = params;
    const where = {};
    if (businessId) where.businessId = businessId;
    if (templateId) where.templateId = templateId;
    if (status) where.status = status;
    if (search) {
      where.OR = [{ id: { contains: search } }];
    }
    const orderBy = {};
    orderBy[sortBy] = sortOrder;
    const [data, total] = await Promise.all([
      prisma.businessTemplateAssignment.findMany({
        where, orderBy, skip: (page - 1) * limit, take: limit,
        include: {
          template: { select: { id: true, name: true, status: true, tier: true } },
          config: true,
          history: { orderBy: { createdAt: 'desc' }, take: 1 }
        }
      }),
      prisma.businessTemplateAssignment.count({ where })
    ]);
    const result = { assignments: data, total, page, limit, totalPages: Math.ceil(total / limit) };
    await cache.set(cacheKey, result);
    return result;
  }

  async getAssignment(id) {
    const cacheKey = `assignment:${id}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const result = await prisma.businessTemplateAssignment.findUnique({
      where: { id },
      include: {
        template: { select: { id: true, name: true, status: true, tier: true, description: true, industry: true, version: true } },
        config: true,
        history: { orderBy: { createdAt: 'desc' }, take: 20 }
      }
    });
    if (result) await cache.set(cacheKey, result);
    return result;
  }

  async getAssignmentsByBusiness(businessId) {
    const cacheKey = `assignments:business:${businessId}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const result = await prisma.businessTemplateAssignment.findMany({
      where: { businessId },
      include: {
        template: { select: { id: true, name: true, status: true, tier: true } },
        config: true
      },
      orderBy: { assignedAt: 'desc' }
    });
    await cache.set(cacheKey, result);
    return result;
  }

  async getAssignmentsByTemplate(templateId) {
    const cacheKey = `assignments:template:${templateId}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const result = await prisma.businessTemplateAssignment.findMany({
      where: { templateId },
      include: { config: true },
      orderBy: { assignedAt: 'desc' }
    });
    await cache.set(cacheKey, result);
    return result;
  }

  async beginAssignment(businessId, templateId, userId) {
    const assignment = await templatesService.assignToBusiness(templateId, businessId, { status: 'DRAFT' }, userId);
    await this._recordHistory(assignment.id, 'ASSIGNMENT_CREATED', null, 'DRAFT', { businessId, templateId }, userId);
    eventBus.emit('assignment:created', { assignmentId: assignment.id, businessId, templateId });
    await this._invalidateCache();
    return this.getAssignment(assignment.id);
  }

  async configureAssignment(id, configData, userId) {
    const assignment = await prisma.businessTemplateAssignment.findUnique({ where: { id } });
    if (!assignment) throw new Error('Assignment not found');

    const config = await prisma.cmsAssignmentConfiguration.upsert({
      where: { assignmentId: id },
      create: {
        assignmentId: id,
        businessId: assignment.businessId,
        ...configData,
        createdBy: userId
      },
      update: { ...configData, updatedAt: new Date() }
    });

    await this._updateStatus(id, 'CONFIGURING', userId, { configUpdated: true });
    eventBus.emit('assignment:configured', { assignmentId: id, businessId: assignment.businessId });
    await this._invalidateCache();
    return config;
  }

  async getConfiguration(id) {
    const cacheKey = `assignment:config:${id}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const result = await prisma.cmsAssignmentConfiguration.findUnique({ where: { assignmentId: id } });
    if (result) await cache.set(cacheKey, result);
    return result;
  }

  async validateAndPrepare(id, userId) {
    const assignment = await this.getAssignment(id);
    if (!assignment) throw new Error('Assignment not found');

    const validations = {
      business: await this._validateBusiness(assignment.businessId),
      subscription: await this._validateSubscription(assignment.businessId),
      template: await this._validateTemplate(assignment.templateId),
      configuration: assignment.config ? true : false
    };

    const allPassed = Object.values(validations).every(v => v.valid === true);
    if (allPassed) {
      await this._updateStatus(id, 'READY', userId, { validations });
      eventBus.emit('assignment:validated', { assignmentId: id, businessId: assignment.businessId, validations });
      eventBus.emit('assignment:ready', { assignmentId: id, businessId: assignment.businessId });
    } else {
      await this._updateStatus(id, 'CONFIGURING', userId, { validations });
      eventBus.emit('assignment:ready', { assignmentId: id, businessId: assignment.businessId, ready: false });
      eventBus.emit('assignment:failed', { assignmentId: id, businessId: assignment.businessId, reason: 'Validation failed', validations });
    }

    await this._invalidateCache();
    return { validations, ready: allPassed };
  }

  async prepareDeployment(id, userId) {
    const assignment = await this.getAssignment(id);
    if (!assignment) throw new Error('Assignment not found');
    if (assignment.status !== 'READY') throw new Error('Assignment must be READY before deployment');

    await this._updateStatus(id, 'DEPLOYING', userId, { deploymentStarted: true });
    eventBus.emit('assignment:deploying', { assignmentId: id, businessId: assignment.businessId });

    const deploymentService = require('../../cms-deployment/services/deployment.service');
    const domainService = require('../../cms-deployment/services/domain.service');
    const envVarService = require('../../cms-deployment/services/env-variable.service');

    let environment = null;
    if (assignment.environmentId) {
      environment = await prisma.deploymentEnvironment.findUnique({ where: { id: assignment.environmentId } });
    }
    if (!environment) {
      const envs = await deploymentService.listEnvironments(assignment.businessId);
      environment = envs.find(e => e.type === 'PRODUCTION') || envs[0];
      if (!environment) {
        environment = await deploymentService.createEnvironment(assignment.businessId, { name: 'production', type: 'PRODUCTION' });
      }
      await prisma.businessTemplateAssignment.update({ where: { id }, data: { environmentId: environment.id } });
    }

    const config = assignment.config;
    if (config) {
      const existingVars = await envVarService.listVariables(environment.id);
      const desiredVars = {
        SITE_NAME: assignment.template?.name || 'Antaire Site',
        PRIMARY_COLOR: config.primaryColor || '#3B82F6',
        SECONDARY_COLOR: config.secondaryColor || '#10B981',
        DEFAULT_LANGUAGE: config.language || 'en',
        DEFAULT_CURRENCY: config.currency || 'INR',
        TIMEZONE: config.timezone || 'Asia/Kolkata',
        CONTACT_EMAIL: config.contactEmail || '',
        CONTACT_PHONE: config.contactPhone || '',
        META_TITLE: config.metaTitle || '',
        META_DESCRIPTION: config.metaDescription || '',
        GOOGLE_ANALYTICS_ID: config.googleAnalyticsId || '',
        FACEBOOK_PIXEL_ID: config.facebookPixelId || '',
        LOGO_URL: config.logoUrl || '',
        FAVICON_URL: config.faviconUrl || ''
      };
      for (const [key, value] of Object.entries(desiredVars)) {
        const existing = existingVars.find(v => v.key === key);
        if (existing) {
          if (existing.encryptedValue !== value) {
            await envVarService.updateVariable(existing.id, { value, changedBy: userId });
          }
        } else if (value) {
          await envVarService.createVariable(environment.id, { key, value, isSecret: false }, userId);
        }
      }
    }

    const deployment = await deploymentService.createDeployment(assignment.businessId, userId, {
      environmentId: environment.id,
      version: `v${assignment.template?.version || 1}-${Date.now()}`,
      builder: 'assignment'
    });

    await prisma.businessTemplateAssignment.update({
      where: { id },
      data: { deploymentId: deployment.id }
    });

    eventBus.emit('assignment:deployment-ready', {
      assignmentId: id, deploymentId: deployment.id, businessId: assignment.businessId
    });

    deploymentQueue.enqueue('assignment-deployment', {
      assignmentId: id,
      deploymentId: deployment.id,
      businessId: assignment.businessId,
      environmentId: environment.id
    });

    await this._invalidateCache();
    return { deployment, environment };
  }

  async activateAssignment(id, userId) {
    const assignment = await this.getAssignment(id);
    if (!assignment) throw new Error('Assignment not found');
    if (assignment.status !== 'DEPLOYING' && assignment.status !== 'READY') {
      throw new Error('Assignment must be in DEPLOYING or READY status to activate');
    }
    await this._updateStatus(id, 'ACTIVE', userId, { activatedAt: new Date() });
    eventBus.emit('assignment:activated', { assignmentId: id, businessId: assignment.businessId });
    eventBus.emit('assignment:active', { assignmentId: id, businessId: assignment.businessId });
    await this._invalidateCache();
    return this.getAssignment(id);
  }

  async suspendAssignment(id, userId) {
    const assignment = await this.getAssignment(id);
    if (!assignment) throw new Error('Assignment not found');
    if (assignment.status !== 'ACTIVE') throw new Error('Only ACTIVE assignments can be suspended');
    await this._updateStatus(id, 'SUSPENDED', userId, { suspendedAt: new Date() });
    eventBus.emit('assignment:suspended', { assignmentId: id, businessId: assignment.businessId });
    await this._invalidateCache();
    return this.getAssignment(id);
  }

  async archiveAssignment(id, userId) {
    const assignment = await this.getAssignment(id);
    if (!assignment) throw new Error('Assignment not found');
    await this._updateStatus(id, 'ARCHIVED', userId, { archivedAt: new Date() });
    eventBus.emit('assignment:archived', { assignmentId: id, businessId: assignment.businessId });
    await this._invalidateCache();
    return this.getAssignment(id);
  }

  async rollbackAssignment(id, userId) {
    const assignment = await this.getAssignment(id);
    if (!assignment) throw new Error('Assignment not found');
    if (assignment.status !== 'ACTIVE' && assignment.status !== 'DEPLOYING') {
      throw new Error('Only ACTIVE or DEPLOYING assignments can be rolled back');
    }
    if (assignment.deploymentId) {
      try {
        const rollbackService = require('../../cms-deployment/services/rollback.service');
        await rollbackService.rollback(assignment.deploymentId, userId);
      } catch (err) {
        console.error('[AssignmentOrchestrator] Rollback failed:', err.message);
      }
    }
    await this._updateStatus(id, 'CONFIGURING', userId, { rolledBack: true, previousStatus: assignment.status });
    eventBus.emit('assignment:rollback', { assignmentId: id, businessId: assignment.businessId });
    await this._invalidateCache();
    return this.getAssignment(id);
  }

  async deleteAssignment(id, userId) {
    const assignment = await prisma.businessTemplateAssignment.findUnique({ where: { id } });
    if (!assignment) throw new Error('Assignment not found');
    await prisma.cmsAssignmentHistory.deleteMany({ where: { assignmentId: id } });
    if (assignment.configId) {
      await prisma.cmsAssignmentConfiguration.delete({ where: { id: assignment.configId } });
    }
    await templatesService.unassignFromBusiness(assignment.templateId, assignment.businessId, userId);
    eventBus.emit('assignment:deleted', { assignmentId: id, businessId: assignment.businessId });
    await this._invalidateCache();
    return { deleted: true };
  }

  async getAssignmentHistory(id) {
    return prisma.cmsAssignmentHistory.findMany({
      where: { assignmentId: id },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getAssignmentStats() {
    const cacheKey = 'assignment:stats';
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const [total, byStatus] = await Promise.all([
      prisma.businessTemplateAssignment.count(),
      prisma.businessTemplateAssignment.groupBy({ by: ['status'], _count: true })
    ]);
    const statusBreakdown = {};
    byStatus.forEach(s => { statusBreakdown[s.status] = s._count; });
    const result = { total, statusBreakdown };
    await cache.set(cacheKey, result);
    return result;
  }

  async findBusinesses(search) {
    const cacheKey = `assignment:businesses:${search || ''}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { id: { contains: search } }
      ]
    } : {};
    const result = await prisma.business.findMany({
      where,
      select: { id: true, name: true, status: true },
      take: 20,
      orderBy: { name: 'asc' }
    });
    await cache.set(cacheKey, result);
    return result;
  }

  async getDashboard() {
    const cacheKey = 'assignment:dashboard';
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const [
      total, activeCount, readyCount, byStatus,
      deploymentData, templateUsage, dailyTrends, monthlyTrends
    ] = await Promise.all([
      prisma.businessTemplateAssignment.count(),
      prisma.businessTemplateAssignment.count({ where: { status: 'ACTIVE' } }),
      prisma.businessTemplateAssignment.count({ where: { status: 'READY' } }),
      prisma.businessTemplateAssignment.groupBy({ by: ['status'], _count: true }),
      prisma.deployment.aggregate({
        _count: { id: true },
        _avg: { completedAt: true, createdAt: true }
      }).catch(() => ({ _count: { id: 0 }, _avg: { completedAt: null, createdAt: null } })),
      prisma.businessTemplateAssignment.groupBy({
        by: ['templateId'],
        _count: true,
        orderBy: { _count: { id: 'desc' } },
        take: 10
      }),
      this._getDailyTrends(),
      this._getMonthlyTrends()
    ]);

    const statusDistribution = {};
    byStatus.forEach(s => { statusDistribution[s.status] = s._count; });

    const deploymentSuccess = await prisma.deployment.count({
      where: { status: 'COMPLETED' }
    }).catch(() => 0);

    const deploymentFailed = await prisma.deployment.count({
      where: { status: 'FAILED' }
    }).catch(() => 0);

    const totalDeployments = deploymentData._count?.id || 0;
    const deploySuccessRate = totalDeployments > 0
      ? Math.round((deploymentSuccess / totalDeployments) * 100) : 0;

    const result = {
      totalAssignments: total,
      activeAssignments: activeCount,
      readyAssignments: readyCount,
      statusDistribution,
      deploymentSuccessRate: deploySuccessRate,
      deploymentFailureCount: deploymentFailed,
      totalDeployments,
      templateUsage,
      dailyTrends,
      monthlyTrends
    };

    await cache.set(cacheKey, result);
    return result;
  }

  async _getDailyTrends() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const history = await prisma.cmsAssignmentHistory.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' }
    });
    const daily = {};
    history.forEach(h => {
      const day = h.createdAt.toISOString().slice(0, 10);
      daily[day] = (daily[day] || 0) + 1;
    });
    return Object.entries(daily).map(([date, count]) => ({ date, count }));
  }

  async _getMonthlyTrends() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const history = await prisma.cmsAssignmentHistory.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' }
    });
    const monthly = {};
    history.forEach(h => {
      const m = h.createdAt.toISOString().slice(0, 7);
      monthly[m] = (monthly[m] || 0) + 1;
    });
    return Object.entries(monthly).map(([month, count]) => ({ month, count }));
  }

  async getJobs() {
    const metrics = await deploymentQueue.getQueueMetrics();
    const assignmentQueues = {};
    for (const [name, data] of Object.entries(metrics.queues || {})) {
      if (name.startsWith('deployment-assignment-')) {
        assignmentQueues[name.replace('deployment-', '')] = data;
      }
    }
    return { redis: metrics.redis, queues: assignmentQueues };
  }

  async getJob(jobType, jobId) {
    try {
      const queue = deploymentQueue.queues?.[`deployment-${jobType}`];
      if (!queue) return null;
      const job = await queue.getJob(jobId);
      if (!job) return null;
      return {
        id: job.id,
        name: job.name,
        data: job.data,
        status: await job.getState(),
        progress: job.progress,
        attemptsMade: job.attemptsMade,
        failedReason: job.failedReason,
        timestamp: job.timestamp,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn
      };
    } catch {
      return null;
    }
  }

  async retryJob(jobType, jobId) {
    try {
      const queue = deploymentQueue.queues?.[`deployment-${jobType}`];
      if (!queue) return false;
      const job = await queue.getJob(jobId);
      if (!job) return false;
      await job.retry();
      return true;
    } catch {
      return false;
    }
  }

  async clearCache() {
    await cache.del('assignment:*');
    return { cleared: true };
  }

  async recalculateAnalytics() {
    await this.clearCache();
    const dashboard = await this.getDashboard();
    return dashboard;
  }

  async _validateBusiness(businessId) {
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return { valid: false, reason: 'Business not found' };
    if (business.status !== 'ACTIVE') return { valid: false, reason: `Business status is ${business.status}` };
    return { valid: true, business: business.name };
  }

  async _validateSubscription(businessId) {
    const boutique = await prisma.boutique.findUnique({ where: { businessId } });
    if (!boutique) return { valid: false, reason: 'No boutique linked to business' };
    const subscription = await prisma.boutiqueSubscription.findFirst({
      where: { boutiqueId: boutique.id },
      include: { plan: true },
      orderBy: { createdAt: 'desc' }
    });
    if (!subscription) return { valid: false, reason: 'No active subscription' };
    if (subscription.status !== 'ACTIVE' && subscription.status !== 'TRIAL') {
      return { valid: false, reason: `Subscription status is ${subscription.status}` };
    }
    return { valid: true, plan: subscription.plan?.name || 'Unknown', status: subscription.status };
  }

  async _validateTemplate(templateId) {
    const template = await prisma.cmsTemplate.findUnique({
      where: { id: templateId },
      select: { id: true, name: true, status: true, tier: true, isActive: true, isDeleted: true }
    });
    if (!template) return { valid: false, reason: 'Template not found' };
    const errors = [];
    if (template.status !== 'PUBLISHED') errors.push(`Template status is ${template.status}`);
    if (!template.isActive) errors.push('Template is inactive');
    if (template.isDeleted) errors.push('Template is deleted');
    if (errors.length > 0) return { valid: false, reason: errors.join('; ') };
    return { valid: true, template: template.name, tier: template.tier };
  }

  async _updateStatus(id, newStatus, userId, changes) {
    const prev = await prisma.businessTemplateAssignment.findUnique({ where: { id }, select: { status: true } });
    await prisma.businessTemplateAssignment.update({ where: { id }, data: { status: newStatus } });
    await this._recordHistory(id, 'STATUS_CHANGED', prev?.status, newStatus, changes, userId);
    eventBus.emit('assignment:updated', { assignmentId: id, previousStatus: prev?.status, newStatus });
  }

  async _recordHistory(assignmentId, action, previousStatus, newStatus, changes, userId) {
    const assignment = await prisma.businessTemplateAssignment.findUnique({
      where: { id: assignmentId },
      include: { config: true, template: { select: { id: true, name: true } } }
    });
    const snapshot = assignment ? {
      businessId: assignment.businessId,
      templateId: assignment.templateId,
      templateName: assignment.template?.name,
      status: newStatus || assignment.status,
      config: assignment.config ? {
        theme: assignment.config.theme,
        primaryColor: assignment.config.primaryColor,
        language: assignment.config.language,
        currency: assignment.config.currency
      } : null
    } : null;
    return prisma.cmsAssignmentHistory.create({
      data: { assignmentId, action, previousStatus, newStatus, changes, snapshot, performedBy: userId }
    });
  }

  async _invalidateCache() {
    await cache.del('assignment:*');
  }
}

module.exports = new AssignmentOrchestrator();

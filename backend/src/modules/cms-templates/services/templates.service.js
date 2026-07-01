const prisma = require('../../../utils/prisma');
const { eventBus, Events } = require('../../../services/eventBus');

class TemplatesService {
  async listTemplates({ page = 1, limit = 20, category, industry, tier, status, q, sort = 'createdAt', order = 'desc', tags, isDeleted = false } = {}) {
    const skip = (page - 1) * limit;
    const where = { isDeleted };

    if (category) where.categoryId = category;
    if (industry) where.industry = industry;
    if (tier) where.tier = tier;
    if (status) where.status = status;
    if (tags) {
      where.tags = {
        some: { tag: { key: { in: Array.isArray(tags) ? tags : [tags] } } }
      };
    }
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { industry: { contains: q, mode: 'insensitive' } }
      ];
    }

    const [templates, total] = await Promise.all([
      prisma.cmsTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sort]: order },
        include: {
          category: { select: { id: true, name: true, key: true } },
          tags: { include: { tag: { select: { id: true, name: true, key: true } } } },
          builderCompat: { select: { builderKey: true } },
          _count: { select: { favorites: true, ratings: true, assignments: true } }
        }
      }),
      prisma.cmsTemplate.count({ where })
    ]);

    return { templates, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getTemplate(id) {
    const template = await prisma.cmsTemplate.findUnique({
      where: { id },
      include: {
        category: true,
        tags: { include: { tag: true } },
        versions: { orderBy: { version: 'desc' }, take: 5 },
        pipelineStages: { orderBy: { stage: 'asc' } },
        builderCompat: { select: { builderKey: true } },
        _count: { select: { favorites: true, ratings: true, assignments: true } }
      }
    });
    return template;
  }

  async createTemplate(data, userId) {
    const { tags, builderCompat, ...fields } = data;

    const template = await prisma.cmsTemplate.create({
      data: {
        ...fields,
        status: data.status || 'DRAFT',
        createdBy: userId,
        updatedBy: userId,
        tags: tags?.length ? {
          create: await this._resolveTags(tags)
        } : undefined,
        builderCompat: builderCompat?.length ? {
          create: builderCompat.map(key => ({ builderKey: key }))
        } : undefined
      },
      include: {
        category: true,
        tags: { include: { tag: true } },
        builderCompat: { select: { builderKey: true } }
      }
    });

    await this._createVersion(template, 1, userId, 'Initial version');
    await this._trackUsage(template.id, 'created', userId);
    eventBus.emit('template:created', { templateId: template.id, userId });

    return template;
  }

  async updateTemplate(id, data, userId) {
    const existing = await prisma.cmsTemplate.findUnique({
      where: { id },
      include: { tags: true, builderCompat: true }
    });
    if (!existing) return null;

    const { tags, builderCompat, changeNotes, ...fields } = data;

    const template = await prisma.cmsTemplate.update({
      where: { id },
      data: {
        ...fields,
        version: existing.version + 1,
        updatedBy: userId,
        tags: tags ? {
          deleteMany: {},
          create: await this._resolveTags(tags)
        } : undefined,
        builderCompat: builderCompat ? {
          deleteMany: {},
          create: builderCompat.map(key => ({ builderKey: key }))
        } : undefined
      },
      include: {
        category: true,
        tags: { include: { tag: true } },
        builderCompat: { select: { builderKey: true } }
      }
    });

    await this._createVersion(template, existing.version + 1, userId, data.changeNotes || 'Updated');
    await this._trackUsage(template.id, 'updated', userId);
    eventBus.emit('template:updated', { templateId: id, userId });

    return template;
  }

  async deleteTemplate(id, userId) {
    const existing = await prisma.cmsTemplate.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) return null;

    const template = await prisma.cmsTemplate.update({
      where: { id },
      data: { isDeleted: true, updatedBy: userId }
    });

    await this._trackUsage(id, 'deleted', userId);
    eventBus.emit('template:deleted', { templateId: id, userId });

    return template;
  }

  async publishTemplate(id, userId) {
    const existing = await prisma.cmsTemplate.findUnique({ where: { id } });
    if (!existing) return null;

    const template = await prisma.cmsTemplate.update({
      where: { id },
      data: { status: 'PUBLISHED', updatedBy: userId }
    });

    await this._createVersion(template, existing.version + 1, userId, 'Published');
    await this._trackUsage(id, 'published', userId);
    eventBus.emit('template:published', { templateId: id, userId });

    return template;
  }

  async archiveTemplate(id, userId) {
    const existing = await prisma.cmsTemplate.findUnique({ where: { id } });
    if (!existing) return null;

    const template = await prisma.cmsTemplate.update({
      where: { id },
      data: { status: 'ARCHIVED', isActive: false, updatedBy: userId }
    });

    await this._trackUsage(id, 'archived', userId);
    eventBus.emit('template:archived', { templateId: id, userId });

    return template;
  }

  async deprecateTemplate(id, userId) {
    const existing = await prisma.cmsTemplate.findUnique({ where: { id } });
    if (!existing) return null;

    const template = await prisma.cmsTemplate.update({
      where: { id },
      data: { status: 'ARCHIVED', isActive: false, updatedBy: userId }
    });

    await this._trackUsage(id, 'deprecated', userId);
    eventBus.emit('template:deprecated', { templateId: id, userId });

    return template;
  }

  async advancePipeline(id, stage, data = {}, userId) {
    const existing = await prisma.cmsTemplate.findUnique({ where: { id } });
    if (!existing) return null;

    const pipelineStage = await prisma.cmsTemplatePipelineStage.create({
      data: {
        templateId: id,
        stage,
        status: data.status || 'COMPLETED',
        startedAt: data.startedAt || new Date(),
        finishedAt: data.finishedAt || new Date(),
        duration: data.duration || null,
        inputArtifact: data.inputArtifact || null,
        outputArtifact: data.outputArtifact || null,
        retryCount: data.retryCount || 0,
        agent: data.agent || null,
        error: data.error || null
      }
    });

    const statusMap = {
      PROMPT: 'VERIFYING',
      GENERATION: 'VERIFYING',
      UPLOAD: 'VERIFYING',
      VERIFICATION: 'CERTIFYING',
      CERTIFICATION: 'FIXING',
      AI_FIX: 'CERTIFIED',
      TEMPLATE: 'PUBLISHED'
    };

    const newStatus = statusMap[stage] || existing.status;
    if (newStatus !== existing.status) {
      await prisma.cmsTemplate.update({
        where: { id },
        data: { status: newStatus, updatedBy: userId }
      });
    }

    await this._trackUsage(id, `pipeline:${stage}`, userId);
    eventBus.emit('template:pipeline', { templateId: id, stage, status: data.status, userId });

    return pipelineStage;
  }

  async getPipelineStatus(id) {
    return prisma.cmsTemplatePipelineStage.findMany({
      where: { templateId: id },
      orderBy: { stage: 'asc' }
    });
  }

  async createVersion(id, data, userId) {
    const template = await prisma.cmsTemplate.findUnique({ where: { id } });
    if (!template) return null;

    const version = await prisma.cmsTemplateVersion.create({
      data: {
        templateId: id,
        version: template.version + 1,
        name: data.name || template.name,
        description: data.description || template.description,
        manifest: data.manifest || template.manifest,
        thumbnail: data.thumbnail || template.thumbnail,
        previewImage: data.previewImage || template.previewImage,
        previewVideo: data.previewVideo || template.previewVideo,
        liveDemoUrl: data.liveDemoUrl || template.liveDemoUrl,
        zipArtifact: data.zipArtifact || template.zipArtifact,
        manifestUrl: data.manifestUrl || template.manifestUrl,
        changeNotes: data.changeNotes || 'Version created',
        createdBy: userId
      }
    });

    await this._trackUsage(id, 'version_created', userId);
    return version;
  }

  async getVersions(id) {
    return prisma.cmsTemplateVersion.findMany({
      where: { templateId: id },
      orderBy: { version: 'desc' }
    });
  }

  async rollbackVersion(id, version, userId) {
    const versionData = await prisma.cmsTemplateVersion.findUnique({
      where: { templateId_version: { templateId: id, version } }
    });
    if (!versionData) return null;

    const template = await prisma.cmsTemplate.update({
      where: { id },
      data: {
        name: versionData.name,
        description: versionData.description,
        manifest: versionData.manifest,
        thumbnail: versionData.thumbnail,
        previewImage: versionData.previewImage,
        previewVideo: versionData.previewVideo,
        liveDemoUrl: versionData.liveDemoUrl,
        zipArtifact: versionData.zipArtifact,
        manifestUrl: versionData.manifestUrl,
        updatedBy: userId,
        version: { increment: 1 }
      }
    });

    await this._trackUsage(id, 'rollback', userId);
    return template;
  }

  async listCategories() {
    return prisma.cmsTemplateCategory.findMany({
      orderBy: { displayOrder: 'asc' },
      include: { _count: { select: { templates: true } } }
    });
  }

  async createCategory(data) {
    return prisma.cmsTemplateCategory.create({ data });
  }

  async listTags() {
    return prisma.cmsTemplateTag.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { templates: true } } }
    });
  }

  async createTag(data) {
    const existing = await prisma.cmsTemplateTag.findUnique({ where: { key: data.key } });
    if (existing) return existing;
    return prisma.cmsTemplateTag.create({ data });
  }

  async toggleFavorite(templateId, userId) {
    const existing = await prisma.cmsTemplateFavorite.findUnique({
      where: { templateId_userId: { templateId, userId } }
    });

    if (existing) {
      await prisma.cmsTemplateFavorite.delete({ where: { id: existing.id } });
      await this._trackUsage(templateId, 'unfavorited', userId);
      return { favorited: false };
    }

    await prisma.cmsTemplateFavorite.create({ data: { templateId, userId } });
    await this._trackUsage(templateId, 'favorited', userId);
    return { favorited: true };
  }

  async listFavorites(userId, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.cmsTemplateFavorite.findMany({
        where: { userId, template: { isDeleted: false } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          template: {
            include: {
              category: { select: { id: true, name: true, key: true } },
              builderCompat: { select: { builderKey: true } },
              _count: { select: { favorites: true } }
            }
          }
        }
      }),
      prisma.cmsTemplateFavorite.count({ where: { userId } })
    ]);

    return { favorites: items.map(f => ({ ...f.template, favoritedAt: f.createdAt })), total, page, limit };
  }

  async rateTemplate(templateId, userId, rating, comment) {
    return prisma.cmsTemplateRating.upsert({
      where: { templateId_userId: { templateId, userId } },
      create: { templateId, userId, rating, comment },
      update: { rating, comment }
    });
  }

  async getAnalytics({ templateId, dateFrom, dateTo } = {}) {
    const where = {};
    if (templateId) where.templateId = templateId;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [usageByAction, totalDeployments] = await Promise.all([
      prisma.cmsTemplateAnalytics.groupBy({
        by: ['action'],
        where,
        _count: true
      }),
      prisma.cmsTemplateAnalytics.count({
        where: { ...where, action: 'deployed' }
      })
    ]);

    return { usageByAction, totalDeployments };
  }

  async getFeatured({ limit = 10 } = {}) {
    return prisma.cmsTemplate.findMany({
      where: { isFeatured: true, isDeleted: false, status: 'PUBLISHED', isActive: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true, key: true } },
        builderCompat: { select: { builderKey: true } },
        _count: { select: { favorites: true, ratings: true } }
      }
    });
  }

  async getLatest({ limit = 10 } = {}) {
    return prisma.cmsTemplate.findMany({
      where: { isDeleted: false, status: 'PUBLISHED' },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true, key: true } },
        builderCompat: { select: { builderKey: true } },
        _count: { select: { favorites: true } }
      }
    });
  }

  async getPopular({ limit = 10 } = {}) {
    return prisma.cmsTemplate.findMany({
      where: { isDeleted: false, status: 'PUBLISHED' },
      take: limit,
      orderBy: { assignments: { _count: 'desc' } },
      include: {
        category: { select: { id: true, name: true, key: true } },
        builderCompat: { select: { builderKey: true } },
        _count: { select: { favorites: true, assignments: true } }
      }
    });
  }

  async getByTier(tier, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const where = { tier, isDeleted: false, status: 'PUBLISHED', isActive: true };

    const [templates, total] = await Promise.all([
      prisma.cmsTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true, key: true } },
          builderCompat: { select: { builderKey: true } },
          _count: { select: { favorites: true } }
        }
      }),
      prisma.cmsTemplate.count({ where })
    ]);

    return { templates, total, page, limit };
  }

  async checkTierAccess(templateTier, userTier) {
    const tierHierarchy = { FREE: 0, STARTER: 1, PROFESSIONAL: 2, ENTERPRISE: 3 };
    const templateLevel = tierHierarchy[templateTier] ?? 0;
    const userLevel = tierHierarchy[userTier] ?? 0;
    return userLevel >= templateLevel;
  }

  async assignToBusiness(templateId, businessId, data = {}, userId) {
    const existing = await prisma.cmsTemplate.findUnique({ where: { id: templateId } });
    if (!existing) return null;

    const assignment = await prisma.businessTemplateAssignment.upsert({
      where: { businessId_templateId: { businessId, templateId } },
      create: {
        businessId,
        templateId,
        subscriptionId: data.subscriptionId || null,
        deploymentId: data.deploymentId || null,
        environmentId: data.environmentId || null,
        assignedBy: userId,
        status: data.status || 'ASSIGNED'
      },
      update: {
        subscriptionId: data.subscriptionId || undefined,
        deploymentId: data.deploymentId || undefined,
        environmentId: data.environmentId || undefined,
        status: data.status || undefined
      },
      include: { template: { select: { id: true, name: true } } }
    });

    await this._trackUsage(templateId, 'assigned', userId);
    eventBus.emit('template:assigned', { templateId, businessId, userId });

    return assignment;
  }

  async unassignFromBusiness(templateId, businessId, userId) {
    const result = await prisma.businessTemplateAssignment.deleteMany({
      where: { businessId, templateId }
    });

    await this._trackUsage(templateId, 'unassigned', userId);
    return result;
  }

  async getBusinessAssignments(businessId) {
    return prisma.businessTemplateAssignment.findMany({
      where: { businessId },
      include: {
        template: {
          include: {
            category: { select: { id: true, name: true, key: true } },
            _count: { select: { favorites: true } }
          }
        }
      },
      orderBy: { assignedAt: 'desc' }
    });
  }

  async exportTemplate(id, format = 'json') {
    const template = await prisma.cmsTemplate.findUnique({
      where: { id },
      include: {
        tags: { include: { tag: true } },
        category: true,
        builderCompat: { select: { builderKey: true } }
      }
    });
    if (!template) return null;

    const exportData = {
      name: template.name,
      description: template.description,
      industry: template.industry,
      tier: template.tier,
      category: template.category?.key,
      manifest: template.manifest,
      tags: template.tags?.map(t => t.tag.key),
      builderCompat: template.builderCompat?.map(b => b.builderKey),
      thumbnail: template.thumbnail,
      previewImage: template.previewImage,
      previewVideo: template.previewVideo,
      liveDemoUrl: template.liveDemoUrl,
      zipArtifact: template.zipArtifact,
      manifestUrl: template.manifestUrl
    };

    if (format === 'markdown') {
      return this._toMarkdown(exportData);
    }
    return exportData;
  }

  async importTemplate(data, userId) {
    const { tags: tagKeys, category: categoryKey, builderCompat: builderKeys, ...fields } = data;

    let categoryId = null;
    if (categoryKey) {
      const cat = await prisma.cmsTemplateCategory.findUnique({ where: { key: categoryKey } });
      if (cat) categoryId = cat.id;
    }

    const template = await prisma.cmsTemplate.create({
      data: {
        ...fields,
        categoryId,
        version: 1,
        createdBy: userId,
        updatedBy: userId,
        tags: tagKeys?.length ? {
          create: await this._resolveTags(tagKeys)
        } : undefined,
        builderCompat: builderKeys?.length ? {
          create: builderKeys.map(key => ({ builderKey: key }))
        } : undefined
      }
    });

    await this._createVersion(template, 1, userId, 'Imported');
    return template;
  }

  async getStats() {
    const [total, byTier, byStatus, totalDeployments] = await Promise.all([
      prisma.cmsTemplate.count({ where: { isDeleted: false } }),
      prisma.cmsTemplate.groupBy({
        by: ['tier'],
        where: { isDeleted: false },
        _count: true
      }),
      prisma.cmsTemplate.groupBy({
        by: ['status'],
        where: { isDeleted: false },
        _count: true
      }),
      prisma.businessTemplateAssignment.count()
    ]);

    return { total, byTier, byStatus, totalDeployments };
  }

  async _resolveTags(tags) {
    const resolved = [];
    for (const tag of tags) {
      const key = typeof tag === 'string' ? tag : tag.key || tag;
      const existing = await prisma.cmsTemplateTag.upsert({
        where: { key },
        create: { key, name: key.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) },
        update: {}
      });
      resolved.push({ tagId: existing.id });
    }
    return resolved;
  }

  async _createVersion(template, version, userId, changeNotes) {
    await prisma.cmsTemplateVersion.create({
      data: {
        templateId: template.id,
        version,
        name: template.name,
        description: template.description,
        manifest: template.manifest,
        thumbnail: template.thumbnail,
        previewImage: template.previewImage,
        previewVideo: template.previewVideo,
        liveDemoUrl: template.liveDemoUrl,
        zipArtifact: template.zipArtifact,
        manifestUrl: template.manifestUrl,
        changeNotes: changeNotes || null,
        createdBy: userId
      }
    });
  }

  async _trackUsage(templateId, action, userId) {
    await prisma.cmsTemplateAnalytics.create({
      data: { templateId, action, userId }
    });
  }

  _toMarkdown(data) {
    let md = `# ${data.name}\n\n`;
    if (data.description) md += `${data.description}\n\n`;
    md += `**Tier:** ${data.tier}  \n`;
    md += `**Industry:** ${data.industry || 'N/A'}  \n`;
    md += `**Category:** ${data.category || 'N/A'}  \n`;
    md += '\n---\n\n';
    if (data.manifest) {
      md += `## Manifest\n\n\`\`\`json\n${JSON.stringify(data.manifest, null, 2)}\n\`\`\`\n\n`;
    }
    if (data.tags?.length) md += `**Tags:** ${data.tags.join(', ')}\n`;
    if (data.builderCompat?.length) md += `**Compatible Builders:** ${data.builderCompat.join(', ')}\n`;
    return md;
  }
}

module.exports = new TemplatesService();

const prisma = require('../../../utils/prisma');
const { eventBus, Events } = require('../../../services/eventBus');

class PromptsService {
  async listPrompts({ page = 1, limit = 20, category, type, builderId, q, sort = 'createdAt', order = 'desc', tags, businessId, referenceType, referenceId, isDeleted = false } = {}) {
    const skip = (page - 1) * limit;
    const where = { isDeleted };

    if (category) where.categoryId = category;
    if (type) where.promptType = type;
    if (builderId) where.builderId = builderId;
    if (businessId) where.businessId = businessId;
    if (referenceType) where.referenceType = referenceType;
    if (referenceId) where.referenceId = referenceId;
    if (tags) {
      where.tags = {
        some: { tag: { key: { in: Array.isArray(tags) ? tags : [tags] } } }
      };
    }
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { framework: { contains: q, mode: 'insensitive' } }
      ];
    }

    const [prompts, total] = await Promise.all([
      prisma.cmsPrompt.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sort]: order },
        include: {
          category: { select: { id: true, name: true, key: true } },
          builder: { select: { id: true, name: true, provider: true, model: true } },
          tags: { include: { tag: { select: { id: true, name: true, key: true } } } },
          _count: { select: { favorites: true, executions: true, ratings: true } }
        }
      }),
      prisma.cmsPrompt.count({ where })
    ]);

    return { prompts, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getPrompt(id) {
    const prompt = await prisma.cmsPrompt.findUnique({
      where: { id },
      include: {
        category: true,
        builder: true,
        tags: { include: { tag: true } },
        versions: { orderBy: { version: 'desc' }, take: 5 },
        _count: { select: { favorites: true, executions: true, ratings: true } }
      }
    });
    return prompt;
  }

  async createPrompt(data, userId) {
    const { tags, categoryId, ...fields } = data;

    const highest = await prisma.cmsPrompt.findFirst({ orderBy: { version: 'desc' }, select: { version: true } });
    const version = (highest?.version || 0) + 1;

    const prompt = await prisma.cmsPrompt.create({
      data: {
        ...fields,
        version: 1,
        categoryId: categoryId || null,
        createdBy: userId,
        updatedBy: userId,
        tags: tags?.length ? {
          create: await this._resolveTags(tags)
        } : undefined
      },
      include: {
        category: true,
        builder: true,
        tags: { include: { tag: true } }
      }
    });

    await this._createVersion(prompt, 1, userId, 'Initial version');
    await this._recordHistory(prompt.id, 'created', userId);
    await this._trackUsage(prompt.id, 'created', userId);

    return prompt;
  }

  async updatePrompt(id, data, userId) {
    const existing = await prisma.cmsPrompt.findUnique({ where: { id }, include: { tags: true } });
    if (!existing) return null;

    const { tags, changeNotes, ...fields } = data;

    const prompt = await prisma.cmsPrompt.update({
      where: { id },
      data: {
        ...fields,
        version: existing.version + 1,
        updatedBy: userId,
        tags: tags ? {
          deleteMany: {},
          create: await this._resolveTags(tags)
        } : undefined
      },
      include: {
        category: true,
        builder: true,
        tags: { include: { tag: true } }
      }
    });

    await this._createVersion(prompt, existing.version + 1, userId, data.changeNotes || 'Updated');
    await this._recordHistory(prompt.id, 'updated', userId);
    await this._trackUsage(prompt.id, 'updated', userId);
    await this._auditLog(id, 'update', userId, existing, prompt);

    return prompt;
  }

  async deletePrompt(id, userId) {
    const existing = await prisma.cmsPrompt.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) return null;

    const prompt = await prisma.cmsPrompt.update({
      where: { id },
      data: { isDeleted: true, updatedBy: userId }
    });

    await this._recordHistory(id, 'deleted', userId);
    await this._trackUsage(id, 'deleted', userId);
    await this._auditLog(id, 'delete', userId, existing, prompt);

    return prompt;
  }

  async clonePrompt(id, userId) {
    const source = await prisma.cmsPrompt.findUnique({
      where: { id },
      include: { tags: { include: { tag: true } } }
    });
    if (!source) return null;

    const prompt = await prisma.cmsPrompt.create({
      data: {
        title: `${source.title} (Clone)`,
        description: source.description,
        promptType: source.promptType,
        categoryId: source.categoryId,
        builderId: source.builderId,
        instructions: source.instructions,
        rules: source.rules,
        outputFormat: source.outputFormat,
        expectedFiles: source.expectedFiles,
        expectedFolderStructure: source.expectedFolderStructure,
        codingStandards: source.codingStandards,
        framework: source.framework,
        libraries: source.libraries,
        dependencies: source.dependencies,
        apiRequirements: source.apiRequirements,
        dbRequirements: source.dbRequirements,
        responsiveRules: source.responsiveRules,
        performanceRules: source.performanceRules,
        securityRules: source.securityRules,
        accessibilityRules: source.accessibilityRules,
        seoRules: source.seoRules,
        testingRules: source.testingRules,
        acceptanceCriteria: source.acceptanceCriteria,
        variables: source.variables,
        templateContent: source.templateContent,
        version: 1,
        createdBy: userId,
        updatedBy: userId,
        tags: source.tags?.length ? {
          create: source.tags.map(t => ({ tagId: t.tagId }))
        } : undefined
      },
      include: { tags: { include: { tag: true } }, category: true, builder: true }
    });

    await this._createVersion(prompt, 1, userId, 'Cloned from ' + source.id);
    await this._recordHistory(prompt.id, 'cloned', userId);
    await this._trackUsage(prompt.id, 'cloned', userId);

    return prompt;
  }

  async favoritePrompt(promptId, userId) {
    const existing = await prisma.cmsPromptFavorite.findUnique({
      where: { promptId_userId: { promptId, userId } }
    });

    if (existing) {
      await prisma.cmsPromptFavorite.delete({ where: { id: existing.id } });
      await this._trackUsage(promptId, 'unfavorited', userId);
      return { favorited: false };
    }

    await prisma.cmsPromptFavorite.create({ data: { promptId, userId } });
    await this._trackUsage(promptId, 'favorited', userId);
    return { favorited: true };
  }

  async listFavorites(userId, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.cmsPromptFavorite.findMany({
        where: { userId, prompt: { isDeleted: false } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          prompt: {
            include: {
              category: { select: { id: true, name: true, key: true } },
              builder: { select: { id: true, name: true, provider: true } },
              _count: { select: { favorites: true } }
            }
          }
        }
      }),
      prisma.cmsPromptFavorite.count({ where: { userId } })
    ]);

    return { favorites: items.map(f => ({ ...f.prompt, favoritedAt: f.createdAt })), total, page, limit };
  }

  async renderPrompt(id, variables = {}) {
    const prompt = await prisma.cmsPrompt.findUnique({ where: { id } });
    if (!prompt) return null;

    let content = prompt.templateContent || '';
    const mergedVars = { ...(prompt.variables || {}), ...variables };

    for (const [key, value] of Object.entries(mergedVars)) {
      content = content.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), String(value ?? ''));
    }

    return { content, variables: mergedVars, prompt: { id: prompt.id, title: prompt.title } };
  }

  async executePrompt(id, { variables = {}, builderId, userId } = {}) {
    const rendered = await this.renderPrompt(id, variables);
    if (!rendered) return null;

    const startTime = Date.now();
    const execution = await prisma.cmsPromptExecution.create({
      data: {
        promptId: id,
        builderId: builderId || null,
        renderedContent: rendered.content,
        variables: rendered.variables,
        status: 'COMPLETED',
        startedAt: new Date(startTime),
        completedAt: new Date(),
        durationMs: Date.now() - startTime,
        performedBy: userId
      }
    });

    await this._trackUsage(id, 'executed', userId);
    return { ...execution, renderedContent: rendered.content };
  }

  async previewPrompt(id) {
    return this.renderPrompt(id);
  }

  async listCategories() {
    return prisma.cmsPromptCategory.findMany({
      orderBy: { displayOrder: 'asc' },
      include: { _count: { select: { prompts: true } } }
    });
  }

  async createCategory(data) {
    return prisma.cmsPromptCategory.create({ data });
  }

  async listBuilders() {
    return prisma.cmsAiBuilder.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { displayOrder: 'asc' }
    });
  }

  async createBuilder(data) {
    return prisma.cmsAiBuilder.create({ data });
  }

  async listVariables() {
    return prisma.cmsPromptVariable.findMany({ orderBy: { displayOrder: 'asc' } });
  }

  async createVariable(data) {
    return prisma.cmsPromptVariable.create({ data });
  }

  async listTags() {
    return prisma.cmsPromptTag.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { prompts: true } } }
    });
  }

  async createTag(data) {
    const existing = await prisma.cmsPromptTag.findUnique({ where: { key: data.key } });
    if (existing) return existing;
    return prisma.cmsPromptTag.create({ data });
  }

  async getHistory(promptId, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.cmsPromptHistory.findMany({
        where: { promptId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.cmsPromptHistory.count({ where: { promptId } })
    ]);
    return { history: items, total, page, limit };
  }

  async getAnalytics({ promptId, dateFrom, dateTo } = {}) {
    const where = {};
    if (promptId) where.promptId = promptId;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [usageByAction, totalExecutions, totalViews] = await Promise.all([
      prisma.cmsPromptUsageAnalytics.groupBy({
        by: ['action'],
        where,
        _count: true
      }),
      prisma.cmsPromptExecution.count({
        where: promptId ? { promptId, status: 'COMPLETED' } : { status: 'COMPLETED' }
      }),
      prisma.cmsPromptUsageAnalytics.count({
        where: { ...where, action: 'viewed' }
      })
    ]);

    return { usageByAction, totalExecutions, totalViews };
  }

  async listRecent(userId, { page = 1, limit = 10 } = {}) {
    const skip = (page - 1) * limit;
    const recent = await prisma.cmsPromptHistory.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      distinct: ['promptId'],
      include: {
        prompt: {
          include: {
            category: { select: { id: true, name: true, key: true } },
            builder: { select: { id: true, name: true } }
          }
        }
      }
    });
    return { recent: recent.filter(r => r.prompt && !r.prompt.isDeleted) };
  }

  async listPopular({ page = 1, limit = 10 } = {}) {
    const skip = (page - 1) * limit;
    const prompts = await prisma.cmsPrompt.findMany({
      where: { isDeleted: false },
      skip,
      take: limit,
      orderBy: { favorites: { _count: 'desc' } },
      include: {
        category: { select: { id: true, name: true, key: true } },
        builder: { select: { id: true, name: true } },
        _count: { select: { favorites: true, executions: true } }
      }
    });
    return { prompts };
  }

  async manageCollections(userId) {
    return prisma.cmsPromptCollection.findMany({
      where: { userId, isDeleted: false },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { items: true } } }
    });
  }

  async createCollection(data, userId) {
    return prisma.cmsPromptCollection.create({ data: { ...data, userId } });
  }

  async addToCollection(collectionId, promptId, displayOrder = 0) {
    return prisma.cmsPromptCollectionItem.upsert({
      where: { collectionId_promptId: { collectionId, promptId } },
      create: { collectionId, promptId, displayOrder },
      update: { displayOrder }
    });
  }

  async removeFromCollection(collectionId, promptId) {
    return prisma.cmsPromptCollectionItem.deleteMany({
      where: { collectionId, promptId }
    });
  }

  async ratePrompt(promptId, userId, rating, comment) {
    return prisma.cmsPromptRating.upsert({
      where: { promptId_userId: { promptId, userId } },
      create: { promptId, userId, rating, comment },
      update: { rating, comment }
    });
  }

  async exportPrompt(id, format = 'json') {
    const prompt = await prisma.cmsPrompt.findUnique({
      where: { id },
      include: { tags: { include: { tag: true } }, category: true, builder: true }
    });
    if (!prompt) return null;

    const exportData = {
      title: prompt.title,
      description: prompt.description,
      promptType: prompt.promptType,
      category: prompt.category?.key,
      builder: prompt.builder?.key,
      framework: prompt.framework,
      instructions: prompt.instructions,
      rules: prompt.rules,
      outputFormat: prompt.outputFormat,
      expectedFiles: prompt.expectedFiles,
      expectedFolderStructure: prompt.expectedFolderStructure,
      codingStandards: prompt.codingStandards,
      templateContent: prompt.templateContent,
      variables: prompt.variables,
      tags: prompt.tags?.map(t => t.tag.key)
    };

    if (format === 'markdown') {
      return this._toMarkdown(exportData);
    }
    return exportData;
  }

  async importPrompt(data, userId) {
    const { tags: tagKeys, category: categoryKey, builder: builderKey, ...fields } = data;

    let categoryId = null;
    if (categoryKey) {
      const cat = await prisma.cmsPromptCategory.findUnique({ where: { key: categoryKey } });
      if (cat) categoryId = cat.id;
    }

    let builderId = null;
    if (builderKey) {
      const b = await prisma.cmsAiBuilder.findUnique({ where: { key: builderKey } });
      if (b) builderId = b.id;
    }

    const prompt = await prisma.cmsPrompt.create({
      data: {
        ...fields,
        categoryId,
        builderId,
        version: 1,
        createdBy: userId,
        updatedBy: userId,
        tags: tagKeys?.length ? {
          create: await this._resolveTags(tagKeys)
        } : undefined
      }
    });

    await this._createVersion(prompt, 1, userId, 'Imported');
    return prompt;
  }

  async getVersions(promptId) {
    return prisma.cmsPromptVersion.findMany({
      where: { promptId },
      orderBy: { version: 'desc' }
    });
  }

  async rollbackVersion(promptId, version, userId) {
    const versionData = await prisma.cmsPromptVersion.findUnique({
      where: { promptId_version: { promptId, version } }
    });
    if (!versionData) return null;

    const prompt = await prisma.cmsPrompt.update({
      where: { id: promptId },
      data: {
        title: versionData.title,
        instructions: versionData.instructions,
        rules: versionData.rules,
        outputFormat: versionData.outputFormat,
        expectedFiles: versionData.expectedFiles,
        expectedFolderStructure: versionData.expectedFolderStructure,
        codingStandards: versionData.codingStandards,
        templateContent: versionData.templateContent,
        variables: versionData.variables,
        updatedBy: userId,
        version: { increment: 1 }
      }
    });

    await this._recordHistory(promptId, 'rollback', userId);
    return prompt;
  }

  async getAuditLogs(promptId) {
    return prisma.cmsPromptAuditLog.findMany({
      where: { promptId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async _resolveTags(tags) {
    const resolved = [];
    for (const tag of tags) {
      const key = typeof tag === 'string' ? tag : tag.key || tag;
      const existing = await prisma.cmsPromptTag.upsert({
        where: { key },
        create: { key, name: key.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) },
        update: {}
      });
      resolved.push({ tagId: existing.id });
    }
    return resolved;
  }

  async _createVersion(prompt, version, userId, changeNotes) {
    await prisma.cmsPromptVersion.create({
      data: {
        promptId: prompt.id,
        version,
        title: prompt.title,
        description: prompt.description,
        instructions: prompt.instructions,
        rules: prompt.rules,
        outputFormat: prompt.outputFormat,
        expectedFiles: prompt.expectedFiles,
        expectedFolderStructure: prompt.expectedFolderStructure,
        codingStandards: prompt.codingStandards,
        templateContent: prompt.templateContent,
        variables: prompt.variables,
        changeNotes: changeNotes || null,
        createdBy: userId
      }
    });
  }

  async _recordHistory(promptId, action, userId) {
    await prisma.cmsPromptHistory.create({
      data: { promptId, action, userId }
    });
  }

  async _trackUsage(promptId, action, userId) {
    await prisma.cmsPromptUsageAnalytics.create({
      data: { promptId, action, userId }
    });
  }

  async _auditLog(promptId, action, userId, oldData, newData) {
    const changedFields = [];
    if (oldData && newData) {
      for (const key of Object.keys(newData)) {
        if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
          changedFields.push({ field: key, oldValue: oldData[key], newValue: newData[key] });
        }
      }
    }

    for (const change of changedFields) {
      await prisma.cmsPromptAuditLog.create({
        data: {
          promptId,
          action,
          field: change.field,
          oldValue: change.oldValue,
          newValue: change.newValue,
          performedBy: userId
        }
      });
    }
  }

  _toMarkdown(data) {
    let md = `# ${data.title}\n\n`;
    if (data.description) md += `${data.description}\n\n`;
    md += `**Type:** ${data.promptType}  \n`;
    md += `**Category:** ${data.category || 'N/A'}  \n`;
    md += `**Builder:** ${data.builder || 'N/A'}  \n`;
    if (data.framework) md += `**Framework:** ${data.framework}  \n`;
    md += '\n---\n\n';
    if (data.instructions) md += `## Instructions\n\n${data.instructions}\n\n`;
    if (data.rules) md += `## Rules\n\n${data.rules}\n\n`;
    if (data.outputFormat) md += `## Output Format\n\n${data.outputFormat}\n\n`;
    if (data.codingStandards) md += `## Coding Standards\n\n${data.codingStandards}\n\n`;
    if (data.templateContent) {
      md += `## Prompt Template\n\n\`\`\`\n${data.templateContent}\n\`\`\`\n\n`;
    }
    if (data.tags?.length) md += `**Tags:** ${data.tags.join(', ')}\n`;
    return md;
  }

  // ==========================================
  // CMS ENGINE INTEGRATION METHODS
  // ==========================================

  async findByReference(referenceType, referenceId) {
    return prisma.cmsPrompt.findMany({
      where: { referenceType, referenceId, isDeleted: false },
      include: {
        category: { select: { id: true, name: true, key: true } },
        builder: { select: { id: true, name: true, provider: true } },
        tags: { include: { tag: { select: { id: true, name: true, key: true } } } }
      }
    });
  }

  async linkToReference(id, referenceType, referenceId, userId) {
    const existing = await prisma.cmsPrompt.findUnique({ where: { id } });
    if (!existing) return null;

    return prisma.cmsPrompt.update({
      where: { id },
      data: { referenceType, referenceId, updatedBy: userId }
    });
  }

  async unlinkFromReference(id, userId) {
    const existing = await prisma.cmsPrompt.findUnique({ where: { id } });
    if (!existing) return null;

    return prisma.cmsPrompt.update({
      where: { id },
      data: { referenceType: null, referenceId: null, updatedBy: userId }
    });
  }

  async getPromptsForEngine(referenceType, options = {}) {
    const where = { referenceType, isDeleted: false };
    if (options.businessId) where.businessId = options.businessId;
    if (options.promptType) where.promptType = options.promptType;

    return prisma.cmsPrompt.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true, key: true } },
        builder: { select: { id: true, name: true } }
      }
    });
  }

  async getEnginePromptByType(referenceType, promptType) {
    return prisma.cmsPrompt.findFirst({
      where: { referenceType, promptType, isDeleted: false },
      include: {
        builder: { select: { id: true, name: true, provider: true, model: true } },
        category: { select: { id: true, name: true } }
      }
    });
  }

  async getStandardsIntegration() {
    return this.getPromptsForEngine('standard');
  }

  async getRequirementsIntegration() {
    return this.getPromptsForEngine('requirement');
  }

  async getBlueprintsIntegration() {
    return this.getPromptsForEngine('blueprint');
  }

  async getVerificationIntegration() {
    return this.getPromptsForEngine('verification');
  }

  async getCertificationIntegration() {
    return this.getPromptsForEngine('certification');
  }

  async getAIFixIntegration() {
    return this.getPromptsForEngine('ai-fix');
  }

  async getDeploymentIntegration() {
    return this.getPromptsForEngine('deployment');
  }

  async compileEnginePrompts(referenceType) {
    const prompts = await this.getPromptsForEngine(referenceType);
    const compiled = [];
    for (const prompt of prompts) {
      const rendered = await this.renderPrompt(prompt.id, {});
      compiled.push({ prompt, rendered: rendered?.content || '' });
    }
    return compiled;
  }
}

module.exports = new PromptsService();

const prisma = require('../../../utils/prisma');

class RequirementsService {
  // ==========================================
  // 1. REQUIREMENTS CRUD OPERATIONS
  // ==========================================

  /**
   * Lists all available requirements in the platform
   * @param {string} [category] - Optional category filter
   * @param {string} [search] - Optional search filter on key/name
   * @returns {Promise<Array>} List of requirements
   */
  async listRequirements(category, search) {
    const where = { isDeleted: false };
    if (category) {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { key: { contains: search, mode: 'insensitive' } }
      ];
    }
    return prisma.cmsRequirement.findMany({
      where,
      orderBy: { key: 'asc' }
    });
  }

  /**
   * Resolves a single requirement by ID or Key string
   * @param {string} idOrKey - Requirement ID or Unique Key
   * @returns {Promise<Object|null>} Requirement object
   */
  async getRequirement(idOrKey) {
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(idOrKey);
    return prisma.cmsRequirement.findFirst({
      where: {
        AND: [
          isUuid ? { id: idOrKey } : { key: idOrKey },
          { isDeleted: false }
        ]
      },
      include: {
        versions: true,
        sourceRelations: true,
        targetRelations: true
      }
    });
  }

  /**
   * Creates a new requirement definition with initial version snapshot
   * @param {Object} data - Requirement parameters
   * @param {string} userId - User creating the requirement
   * @returns {Promise<Object>} Created requirement
   */
  async createRequirement(data, userId) {
    const { key, name, category, description, configSchema, priority, criticality, businessValue, developmentCost, aiComplexity, verificationWeight, certificationWeight } = data;

    if (!key || !name || !category || !configSchema) {
      throw new Error('Missing required fields: key, name, category, and configSchema are mandatory.');
    }

    return prisma.$transaction(async (tx) => {
      // 1. Create base requirement
      const req = await tx.cmsRequirement.create({
        data: {
          key,
          name,
          category,
          description,
          configSchema,
          priority: priority || 3,
          criticality: criticality || 3,
          businessValue: businessValue || 3,
          developmentCost: developmentCost || 3,
          aiComplexity: aiComplexity || 3,
          verificationWeight: verificationWeight || 1.0,
          certificationWeight: certificationWeight || 1.0,
          status: 'ACTIVE'
        }
      });

      // 2. Create version history snapshot
      await tx.cmsRequirementVersion.create({
        data: {
          requirementId: req.id,
          version: 1,
          configSchema,
          status: 'ACTIVE',
          description: 'Initial creation',
          createdBy: userId
        }
      });

      return req;
    });
  }

  /**
   * Updates an existing requirement and creates a new version history log
   * @param {string} id - Requirement ID
   * @param {Object} data - Update payload
   * @param {string} userId - User updating the requirement
   * @returns {Promise<Object>} Updated requirement
   */
  async updateRequirement(id, data, userId) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.cmsRequirement.findUnique({
        where: { id },
        include: { versions: true }
      });

      if (!existing || existing.isDeleted) {
        throw new Error('Requirement not found or has been deleted.');
      }

      const nextVersion = existing.version + 1;
      const updatedConfig = data.configSchema || existing.configSchema;

      const updated = await tx.cmsRequirement.update({
        where: { id },
        data: {
          name: data.name || existing.name,
          category: data.category || existing.category,
          description: data.description || existing.description,
          configSchema: updatedConfig,
          priority: data.priority !== undefined ? data.priority : existing.priority,
          criticality: data.criticality !== undefined ? data.criticality : existing.criticality,
          businessValue: data.businessValue !== undefined ? data.businessValue : existing.businessValue,
          developmentCost: data.developmentCost !== undefined ? data.developmentCost : existing.developmentCost,
          aiComplexity: data.aiComplexity !== undefined ? data.aiComplexity : existing.aiComplexity,
          verificationWeight: data.verificationWeight !== undefined ? data.verificationWeight : existing.verificationWeight,
          certificationWeight: data.certificationWeight !== undefined ? data.certificationWeight : existing.certificationWeight,
          status: data.status || existing.status,
          version: nextVersion
        }
      });

      await tx.cmsRequirementVersion.create({
        data: {
          requirementId: id,
          version: nextVersion,
          configSchema: updatedConfig,
          status: data.status || existing.status,
          description: data.changeLogReason || `Updated version ${nextVersion}`,
          createdBy: userId
        }
      });

      return updated;
    });
  }

  /**
   * Soft deletes a requirement definition
   * @param {string} id - Requirement ID
   * @returns {Promise<Object>} Marked requirement
   */
  async deleteRequirement(id) {
    return prisma.cmsRequirement.update({
      where: { id },
      data: { isDeleted: true }
    });
  }

  // ==========================================
  // 2. DEPENDENCY & RELATION MANAGEMENT
  // ==========================================

  /**
   * Creates a relationship (e.g. REQUIRES, CONFLICTS_WITH) between two requirements
   * @param {string} sourceId - Source requirement ID
   * @param {string} targetId - Target requirement ID
   * @param {string} type - Relation type (DEPENDS_ON, REQUIRES, CONFLICTS_WITH, etc.)
   * @returns {Promise<Object>} Created relationship
   */
  async addRelationship(sourceId, targetId, type) {
    if (sourceId === targetId) {
      throw new Error('A requirement cannot link to itself.');
    }
    return prisma.cmsRequirementRelation.create({
      data: {
        sourceRequirementId: sourceId,
        targetRequirementId: targetId,
        type
      }
    });
  }

  /**
   * Removes a relationship between requirements
   * @param {string} relationId - Relation primary ID
   * @returns {Promise<Object>} Removed relation record
   */
  async removeRelationship(relationId) {
    return prisma.cmsRequirementRelation.delete({
      where: { id: relationId }
    });
  }

  // ==========================================
  // 3. GRAPH TRAVERSAL & COMPILATION ENGINES
  // ==========================================

  /**
   * Performs recursive traversal of requirements to resolve all dependencies.
   * Includes circular dependency protection.
   * @param {Array<string>} inputKeys - Starting active keys
   * @returns {Promise<Object>} Fully resolved dependencies, conflicts, and compiled blueprints
   */
  async resolveRequirements(inputKeys) {
    if (!inputKeys || !Array.isArray(inputKeys) || inputKeys.length === 0) {
      return { resolved: [], conflicts: [], isValid: true, compiledPrompt: '', blueprint: { pages: [], apis: [], features: [] } };
    }

    // 1. Fetch all requirements from DB
    const allReqs = await prisma.cmsRequirement.findMany({
      where: { isDeleted: false },
      include: {
        sourceRelations: true,
        targetRelations: true
      }
    });

    const reqMap = new Map(allReqs.map(r => [r.key, r]));
    const idMap = new Map(allReqs.map(r => [r.id, r]));

    const visited = new Set();
    const stack = new Set();
    const resolvedKeys = new Set();

    // Helper recursive depth-first graph traverser
    const traverse = (key) => {
      const node = reqMap.get(key);
      if (!node) return;

      if (stack.has(node.id)) {
        throw new Error(`Circular dependency detected: Cycle path includes requirement '${node.key}'.`);
      }

      if (visited.has(node.id)) return;

      stack.add(node.id);

      // Resolve REQUIRES and DEPENDS_ON relations
      const dependencies = node.sourceRelations.filter(rel => 
        rel.type === 'REQUIRES' || rel.type === 'DEPENDS_ON'
      );

      for (const rel of dependencies) {
        const targetNode = idMap.get(rel.targetRequirementId);
        if (targetNode) {
          traverse(targetNode.key);
        }
      }

      stack.delete(node.id);
      visited.add(node.id);
      resolvedKeys.add(node.key);
    };

    // Run graph traversal starting from active keys
    for (const key of inputKeys) {
      traverse(key);
    }

    const resolvedRequirements = Array.from(resolvedKeys).map(k => reqMap.get(k));

    // 2. Perform Conflict Audits
    const conflicts = [];
    const resolvedIdsSet = new Set(resolvedRequirements.map(r => r.id));

    for (const req of resolvedRequirements) {
      // Find CONFLICTS_WITH relationships originating from active nodes
      const conflictRels = req.sourceRelations.filter(rel => rel.type === 'CONFLICTS_WITH');
      for (const rel of conflictRels) {
        if (resolvedIdsSet.has(rel.targetRequirementId)) {
          const target = idMap.get(rel.targetRequirementId);
          conflicts.push({
            sourceKey: req.key,
            targetKey: target.key,
            message: `Feature '${req.name}' conflicts with '${target.name}'.`
          });
        }
      }
    }

    const isValid = conflicts.length === 0;

    // 3. Compile AI Prompt Instructions & Blueprint Inputs
    let compiledPrompt = '';
    const compiledPages = [];
    const compiledApis = [];
    const compiledFeatures = [];

    if (isValid) {
      for (const req of resolvedRequirements) {
        // Append AI prompt instructions
        if (req.description) {
          compiledPrompt += `- ${req.name}: ${req.description}\n`;
        }

        // Deep merge config schema outputs
        const config = req.configSchema;
        if (config) {
          if (config.pages && Array.isArray(config.pages)) {
            compiledPages.push(...config.pages);
          }
          if (config.apis && Array.isArray(config.apis)) {
            compiledApis.push(...config.apis);
          }
          if (config.features && Array.isArray(config.features)) {
            compiledFeatures.push(...config.features);
          }
        }
      }
    }

    return {
      resolved: resolvedRequirements.map(r => ({
        id: r.id,
        key: r.key,
        name: r.name,
        category: r.category,
        priority: r.priority,
        criticality: r.criticality
      })),
      conflicts,
      isValid,
      compiledPrompt: compiledPrompt.trim(),
      blueprint: {
        pages: [...new Set(compiledPages)],
        apis: [...new Set(compiledApis)],
        features: [...new Set(compiledFeatures)]
      }
    };
  }

  // ==========================================
  // 4. TEMPLATE MANAGEMENT OPERATIONS
  // ==========================================

  /**
   * Lists all requirement preset templates
   * @returns {Promise<Array>} Preset templates
   */
  async listTemplates() {
    return prisma.cmsRequirementTemplate.findMany({
      include: {
        requirements: {
          include: {
            requirement: true
          }
        }
      },
      orderBy: { key: 'asc' }
    });
  }

  /**
   * Compiles the full resolved requirement tree for a preset template
   * @param {string} keyOrId - Template key or template primary UUID
   * @returns {Promise<Object>} Resolved requirements compilation
   */
  async compileTemplate(keyOrId) {
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(keyOrId);
    const template = await prisma.cmsRequirementTemplate.findFirst({
      where: isUuid ? { id: keyOrId } : { key: keyOrId },
      include: {
        requirements: {
          include: {
            requirement: true
          }
        }
      }
    });

    if (!template) {
      throw new Error(`Requirement template not found for key/id: ${keyOrId}`);
    }

    const startKeys = template.requirements.map(j => j.requirement.key);
    const compiled = await this.resolveRequirements(startKeys);

    return {
      templateKey: template.key,
      templateName: template.name,
      ...compiled
    };
  }
}

module.exports = new RequirementsService();

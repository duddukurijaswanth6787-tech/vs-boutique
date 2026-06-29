const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper to deep-merge configurations recursively
function deepMerge(target, source) {
  const output = Object.assign({}, target);
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

class StandardsService {
  // ==========================================
  // 1. STANDARDS MANAGEMENT (Layer 1)
  // ==========================================

  async listStandards(category, search) {
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
    return prisma.cmsStandard.findMany({
      where,
      include: {
        parent: true
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async getStandard(idOrKey) {
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(idOrKey);
    const where = { isDeleted: false };
    if (isUuid) {
      where.OR = [{ id: idOrKey }, { key: idOrKey }];
    } else {
      where.key = idOrKey;
    }
    return prisma.cmsStandard.findFirst({
      where,
      include: {
        parent: true,
        versions: {
          orderBy: { version: 'desc' }
        }
      }
    });
  }

  async createStandard(data, userId) {
    const { category, key, name, parentId, config } = data;
    const standard = await prisma.cmsStandard.create({
      data: {
        category,
        key,
        name,
        parentId,
        config: config || {},
        version: 1
      }
    });

    // Create version snapshot
    await prisma.cmsStandardVersion.create({
      data: {
        standardId: standard.id,
        version: 1,
        config: config || {},
        status: 'DRAFT',
        createdBy: userId,
        description: 'Initial creation'
      }
    });

    // Create Audit Log
    await prisma.cmsStandardAuditLog.create({
      data: {
        standardId: standard.id,
        action: 'CREATE',
        userId,
        newValue: config || {},
        ipAddress: '127.0.0.1',
        reason: 'Initial standard creation'
      }
    });

    return standard;
  }

  async updateStandard(id, data, description, userId) {
    const standard = await prisma.cmsStandard.findUnique({
      where: { id }
    });
    if (!standard) throw new Error('Standard not found');

    const newVersionNum = standard.version + 1;
    const oldConfig = standard.config;

    const updated = await prisma.cmsStandard.update({
      where: { id },
      data: {
        name: data.name || standard.name,
        parentId: data.parentId !== undefined ? data.parentId : standard.parentId,
        config: data.config || standard.config,
        status: data.status || standard.status,
        version: newVersionNum
      }
    });

    // Save Version Snapshot
    await prisma.cmsStandardVersion.create({
      data: {
        standardId: id,
        version: newVersionNum,
        config: updated.config,
        status: updated.status,
        description: description || `Update to version ${newVersionNum}`,
        createdBy: userId
      }
    });

    // Audit Log
    await prisma.cmsStandardAuditLog.create({
      data: {
        standardId: id,
        action: 'UPDATE',
        userId,
        oldValue: oldConfig,
        newValue: updated.config,
        ipAddress: '127.0.0.1',
        reason: description || 'Configuration update'
      }
    });

    return updated;
  }

  async rollbackStandard(id, versionNumber, userId) {
    const snapshot = await prisma.cmsStandardVersion.findFirst({
      where: { standardId: id, version: versionNumber }
    });
    if (!snapshot) throw new Error(`Snapshot version ${versionNumber} not found`);

    const standard = await prisma.cmsStandard.findUnique({
      where: { id }
    });
    if (!standard) throw new Error('Standard not found');

    return this.updateStandard(id, { config: snapshot.config }, `Rollback to version ${versionNumber}`, userId);
  }

  // RECURSIVE DEEP MERGE RESOLVER
  async resolveInheritedConfig(idOrKey) {
    const chain = [];
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(idOrKey);
    const where = { isDeleted: false };
    if (isUuid) {
      where.OR = [{ id: idOrKey }, { key: idOrKey }];
    } else {
      where.key = idOrKey;
    }
    let current = await prisma.cmsStandard.findFirst({ where });

    while (current) {
      chain.unshift(current); // Parent goes first so child overrides it
      if (current.parentId) {
        current = await prisma.cmsStandard.findUnique({
          where: { id: current.parentId }
        });
      } else {
        current = null;
      }
    }

    let resolved = {};
    for (const node of chain) {
      resolved = deepMerge(resolved, node.config);
    }
    return resolved;
  }

  // ==========================================
  // 2. BLUEPRINT TEMPLATES MANAGEMENT
  // ==========================================

  async listBlueprints(search) {
    const where = { isDeleted: false };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { key: { contains: search, mode: 'insensitive' } }
      ];
    }
    return prisma.cmsBlueprintTemplate.findMany({
      where,
      include: { standard: true },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async getBlueprint(idOrKey) {
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(idOrKey);
    const where = { isDeleted: false };
    if (isUuid) {
      where.OR = [{ id: idOrKey }, { key: idOrKey }];
    } else {
      where.key = idOrKey;
    }
    return prisma.cmsBlueprintTemplate.findFirst({
      where,
      include: {
        standard: true,
        versions: {
          orderBy: { version: 'desc' }
        }
      }
    });
  }

  async createBlueprint(data, userId) {
    const blueprint = await prisma.cmsBlueprintTemplate.create({
      data: {
        key: data.key,
        name: data.name,
        standardId: data.standardId,
        pages: data.pages || {},
        components: data.components || {},
        apis: data.apis || {},
        databaseModels: data.databaseModels || {},
        features: data.features || {}
      }
    });

    await prisma.cmsBlueprintTemplateVersion.create({
      data: {
        blueprintTemplateId: blueprint.id,
        version: 1,
        pages: data.pages || {},
        components: data.components || {},
        apis: data.apis || {},
        databaseModels: data.databaseModels || {},
        features: data.features || {},
        status: 'DRAFT',
        createdBy: userId,
        description: 'Initial creation'
      }
    });

    return blueprint;
  }

  async updateBlueprint(id, data, description, userId) {
    const bp = await prisma.cmsBlueprintTemplate.findUnique({
      where: { id }
    });
    if (!bp) throw new Error('Blueprint template not found');

    const newVersionNum = bp.version + 1;

    const updated = await prisma.cmsBlueprintTemplate.update({
      where: { id },
      data: {
        name: data.name || bp.name,
        standardId: data.standardId !== undefined ? data.standardId : bp.standardId,
        pages: data.pages || bp.pages,
        components: data.components || bp.components,
        apis: data.apis || bp.apis,
        databaseModels: data.databaseModels || bp.databaseModels,
        features: data.features || bp.features,
        status: data.status || bp.status,
        version: newVersionNum
      }
    });

    await prisma.cmsBlueprintTemplateVersion.create({
      data: {
        blueprintTemplateId: id,
        version: newVersionNum,
        pages: updated.pages,
        components: updated.components,
        apis: updated.apis,
        databaseModels: updated.databaseModels,
        features: updated.features,
        status: updated.status,
        description: description || `Update to version ${newVersionNum}`,
        createdBy: userId
      }
    });

    return updated;
  }

  // ==========================================
  // 3. BUILDER PROFILES MANAGEMENT
  // ==========================================

  async listBuilderProfiles(search) {
    const where = { isDeleted: false };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { key: { contains: search, mode: 'insensitive' } }
      ];
    }
    return prisma.cmsBuilderProfile.findMany({
      where,
      include: { standard: true },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async getBuilderProfile(idOrKey) {
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(idOrKey);
    const where = { isDeleted: false };
    if (isUuid) {
      where.OR = [{ id: idOrKey }, { key: idOrKey }];
    } else {
      where.key = idOrKey;
    }
    return prisma.cmsBuilderProfile.findFirst({
      where,
      include: {
        standard: true,
        versions: {
          orderBy: { version: 'desc' }
        }
      }
    });
  }

  async createBuilderProfile(data, userId) {
    const profile = await prisma.cmsBuilderProfile.create({
      data: {
        key: data.key,
        name: data.name,
        standardId: data.standardId,
        framework: data.framework,
        promptTemplate: data.promptTemplate,
        folderStructure: data.folderStructure || {},
        limitations: data.limitations || {}
      }
    });

    await prisma.cmsBuilderProfileVersion.create({
      data: {
        builderProfileId: profile.id,
        version: 1,
        framework: data.framework,
        promptTemplate: data.promptTemplate,
        folderStructure: data.folderStructure || {},
        limitations: data.limitations || {},
        status: 'DRAFT',
        createdBy: userId,
        description: 'Initial profile setup'
      }
    });

    return profile;
  }

  async updateBuilderProfile(id, data, description, userId) {
    const profile = await prisma.cmsBuilderProfile.findUnique({
      where: { id }
    });
    if (!profile) throw new Error('Builder profile not found');

    const newVersionNum = profile.version + 1;

    const updated = await prisma.cmsBuilderProfile.update({
      where: { id },
      data: {
        name: data.name || profile.name,
        standardId: data.standardId !== undefined ? data.standardId : profile.standardId,
        framework: data.framework || profile.framework,
        promptTemplate: data.promptTemplate || profile.promptTemplate,
        folderStructure: data.folderStructure || profile.folderStructure,
        limitations: data.limitations || profile.limitations,
        status: data.status || profile.status,
        version: newVersionNum
      }
    });

    await prisma.cmsBuilderProfileVersion.create({
      data: {
        builderProfileId: id,
        version: newVersionNum,
        framework: updated.framework,
        promptTemplate: updated.promptTemplate,
        folderStructure: updated.folderStructure,
        limitations: updated.limitations,
        status: updated.status,
        description: description || `Update to version ${newVersionNum}`,
        createdBy: userId
      }
    });

    return updated;
  }

  // ==========================================
  // 4. AUDIT LOGS TIMELINE
  // ==========================================

  async listAuditLogs() {
    return prisma.cmsStandardAuditLog.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }
}

module.exports = new StandardsService();

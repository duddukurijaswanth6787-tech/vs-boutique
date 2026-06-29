const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const requirementsService = require('../../cms-requirements/services/requirements.service');

class BlueprintService {
  /**
   * Lists all blueprint templates in the platform
   * @param {string} [search] - Optional search filter
   * @returns {Promise<Array>} List of blueprints
   */
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
      include: {
        standard: true
      },
      orderBy: { key: 'asc' }
    });
  }

  /**
   * Fetches a blueprint template by key or UUID
   * @param {string} idOrKey - Template Key or ID
   * @returns {Promise<Object|null>} Blueprint details
   */
  async getBlueprint(idOrKey) {
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(idOrKey);
    return prisma.cmsBlueprintTemplate.findFirst({
      where: {
        AND: [
          isUuid ? { id: idOrKey } : { key: idOrKey },
          { isDeleted: false }
        ]
      },
      include: {
        versions: true,
        blueprintPages: {
          include: {
            components: true
          }
        },
        blueprintApis: true,
        blueprintFeatures: {
          include: {
            requirement: true
          }
        }
      }
    });
  }

  /**
   * Creates a new blueprint template record
   * @param {Object} data - Blueprint parameters
   * @param {string} userId - User identifier
   * @returns {Promise<Object>} Created blueprint template
   */
  async createBlueprint(data, userId) {
    const { key, name, standardId, description } = data;

    if (!key || !name) {
      throw new Error('Key and Name are required fields.');
    }

    return prisma.$transaction(async (tx) => {
      const template = await tx.cmsBlueprintTemplate.create({
        data: {
          key,
          name,
          standardId,
          status: 'DRAFT',
          version: 1,
          pages: {},
          components: {},
          apis: {},
          databaseModels: {},
          features: {}
        }
      });

      await tx.cmsBlueprintTemplateVersion.create({
        data: {
          blueprintTemplateId: template.id,
          version: 1,
          pages: {},
          components: {},
          apis: {},
          databaseModels: {},
          features: {},
          status: 'DRAFT',
          description: 'Initial blueprint creation',
          createdBy: userId
        }
      });

      return template;
    });
  }

  /**
   * Compiles the blueprint by resolving requirements sitemaps and API criteria,
   * then writing them to normalized tables in a single transaction.
   * @param {string} blueprintId - Template UUID
   * @param {string} userId - User executing compile
   * @returns {Promise<Object>} Compiled manifest summary
   */
  async compileBlueprint(blueprintId, userId) {
    return prisma.$transaction(async (tx) => {
      const template = await tx.cmsBlueprintTemplate.findUnique({
        where: { id: blueprintId },
        include: {
          blueprintFeatures: {
            include: {
              requirement: true
            }
          }
        }
      });

      if (!template || template.isDeleted) {
        throw new Error('Blueprint template not found.');
      }

      // Gather active requirement keys mapped by features links
      const startKeys = template.blueprintFeatures.map(f => f.requirement.key);
      const resolved = await requirementsService.resolveRequirements(startKeys);

      if (!resolved.isValid) {
        throw new Error(`Blueprint compilation failed: Conflict violations detected: ${resolved.conflicts.map(c => c.message).join('; ')}`);
      }

      // 1. Delete all old normalized sitemaps/pages, components, and APIs linked to this blueprint
      // Cascade deletes are enforced at DB level but clean them up cleanly
      await tx.cmsBlueprintPage.deleteMany({ where: { blueprintTemplateId: template.id } });
      await tx.cmsBlueprintApi.deleteMany({ where: { blueprintTemplateId: template.id } });

      // 2. Insert compiled sitemap pages & nested components
      const pagesConfig = {};
      const componentsConfig = {};

      for (const pagePath of resolved.blueprint.pages) {
        const page = await tx.cmsBlueprintPage.create({
          data: {
            blueprintTemplateId: template.id,
            route: pagePath,
            title: `${pagePath === '/' ? 'Home' : pagePath.slice(1).charAt(0).toUpperCase() + pagePath.slice(2)} Page`
          }
        });

        pagesConfig[pagePath] = page.title;

        // Auto-assign default components depending on the path
        const componentsToCreate = [];
        if (pagePath === '/') {
          componentsToCreate.push({ name: 'Navbar', props: {} }, { name: 'HeroSection', props: {} }, { name: 'Footer', props: {} });
        } else if (pagePath === '/cart') {
          componentsToCreate.push({ name: 'Navbar', props: {} }, { name: 'CartGrid', props: {} }, { name: 'Footer', props: {} });
        } else {
          componentsToCreate.push({ name: 'Navbar', props: {} }, { name: 'GenericContainer', props: {} }, { name: 'Footer', props: {} });
        }

        componentsConfig[pagePath] = componentsToCreate.map(c => c.name);

        for (const comp of componentsToCreate) {
          await tx.cmsBlueprintComponent.create({
            data: {
              pageId: page.id,
              componentName: comp.name,
              propsSchema: comp.props
            }
          });
        }
      }

      // 3. Insert compiled APIs list
      const apisConfig = {};
      for (const apiRoute of resolved.blueprint.apis) {
        // Expected format: "METHOD /path" e.g. "POST /api/v1/cart/add"
        const parts = apiRoute.split(' ');
        const method = parts.length > 1 ? parts[0] : 'GET';
        const path = parts.length > 1 ? parts[1] : parts[0];

        await tx.cmsBlueprintApi.create({
          data: {
            blueprintTemplateId: template.id,
            path,
            method,
            responseSchema: { success: 'boolean' }
          }
        });

        apisConfig[`${method} ${path}`] = 'Json';
      }

      const nextVersion = template.version + 1;

      // 4. Update blueprint template status, version, and backward-compatible JSON fields
      const updated = await tx.cmsBlueprintTemplate.update({
        where: { id: template.id },
        data: {
          status: 'TESTING',
          version: nextVersion,
          pages: pagesConfig,
          components: componentsConfig,
          apis: apisConfig,
          features: resolved.blueprint.features
        }
      });

      // 5. Commit version history snapshot log
      await tx.cmsBlueprintTemplateVersion.create({
        data: {
          blueprintTemplateId: template.id,
          version: nextVersion,
          pages: pagesConfig,
          components: componentsConfig,
          apis: apisConfig,
          databaseModels: {},
          features: resolved.blueprint.features,
          status: 'TESTING',
          description: `Compiled blueprint version ${nextVersion}`,
          createdBy: userId
        }
      });

      return {
        success: true,
        version: nextVersion,
        status: updated.status,
        summary: {
          pagesCount: resolved.blueprint.pages.length,
          apisCount: resolved.blueprint.apis.length,
          featuresCount: resolved.blueprint.features.length
        }
      };
    });
  }

  /**
   * Restores a blueprint template back to a historical version configuration
   * @param {string} id - Blueprint Template UUID
   * @param {number} versionNumber - Version number to restore
   * @param {string} userId - User executing rollback
   * @returns {Promise<Object>} Updated blueprint template
   */
  async rollbackBlueprint(id, versionNumber, userId) {
    return prisma.$transaction(async (tx) => {
      const versionSnap = await tx.cmsBlueprintTemplateVersion.findFirst({
        where: {
          blueprintTemplateId: id,
          version: versionNumber
        }
      });

      if (!versionSnap) {
        throw new Error(`Historical version snapshot ${versionNumber} not found.`);
      }

      // Revert base template record to version configs
      const updated = await tx.cmsBlueprintTemplate.update({
        where: { id },
        data: {
          version: versionNumber,
          pages: versionSnap.pages,
          components: versionSnap.components,
          apis: versionSnap.apis,
          features: versionSnap.features,
          status: versionSnap.status
        }
      });

      // Insert audit roll snapshot
      await tx.cmsBlueprintTemplateVersion.create({
        data: {
          blueprintTemplateId: id,
          version: versionNumber + 1,
          pages: versionSnap.pages,
          components: versionSnap.components,
          apis: versionSnap.apis,
          databaseModels: versionSnap.databaseModels,
          features: versionSnap.features,
          status: versionSnap.status,
          description: `Rolled back to version ${versionNumber}`,
          createdBy: userId
        }
      });

      return updated;
    });
  }
}

module.exports = new BlueprintService();

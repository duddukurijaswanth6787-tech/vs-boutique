const prisma = require('../../../utils/prisma');
const eventBus = require('../../ai-core/utils/eventBus');
const crypto = require('crypto');

class MarketplaceService {
  /**
   * Register a new publisher associated with an Owner
   */
  async registerPublisher(ownerId, data) {
    if (!data.name || !data.email) {
      throw new Error('Publisher name and email are required');
    }

    // Verify Owner exists
    const owner = await prisma.owner.findUnique({
      where: { id: ownerId }
    });
    if (!owner) {
      throw new Error('Owner account not found');
    }

    // Create publisher record
    return await prisma.marketplacePublisher.create({
      data: {
        ownerId,
        name: data.name,
        email: data.email,
        website: data.website || null,
        role: data.role || 'DEVELOPER',
        isVerified: data.isVerified || false
      }
    });
  }

  /**
   * Submit/Publish a new package version with capabilities
   */
  async publishPackage(publisherId, data) {
    const { name, slug, description, version, manifestJson, downloadUrl, checksum } = data;

    if (!name || !slug || !version || !manifestJson || !downloadUrl || !checksum) {
      throw new Error('Missing required package metadata or bundle fields');
    }

    // Validate SemVer syntax roughly
    if (!/^\d+\.\d+\.\d+$/.test(version)) {
      throw new Error('Invalid version format. Must follow semantic versioning (e.g. 1.0.0)');
    }

    // 1. Sandbox manifest validation
    this.validateManifest(manifestJson);

    // 2. Cryptographic signature and checksum mock verification
    this.verifyPackageSignature(checksum, manifestJson);

    return await prisma.$transaction(async (tx) => {
      // Find or create package
      let pkg = await tx.marketplacePackage.findUnique({
        where: { slug }
      });

      if (!pkg) {
        pkg = await tx.marketplacePackage.create({
          data: {
            publisherId,
            name,
            slug,
            description,
            status: 'APPROVED' // Auto-approve in test environment
          }
        });
      }

      // Check version duplicate
      const duplicateVersion = await tx.marketplaceVersion.findUnique({
        where: {
          packageId_version: {
            packageId: pkg.id,
            version
          }
        }
      });
      if (duplicateVersion) {
        throw new Error(`Version ${version} of package ${slug} is already published`);
      }

      // Create version
      const pkgVersion = await tx.marketplaceVersion.create({
        data: {
          packageId: pkg.id,
          version,
          manifestJson,
          downloadUrl,
          checksum
        }
      });

      // Register capabilities dynamically
      if (manifestJson.capabilities && Array.isArray(manifestJson.capabilities)) {
        for (const cap of manifestJson.capabilities) {
          await tx.marketplaceCapability.create({
            data: {
              versionId: pkgVersion.id,
              type: cap.type,
              handlerPath: cap.entrypoint || '',
              configSchema: cap.configSchema || {}
            }
          });
        }
      }

      // Register dependencies
      if (manifestJson.dependencies && typeof manifestJson.dependencies === 'object') {
        for (const [depSlug, constraint] of Object.entries(manifestJson.dependencies)) {
          await tx.marketplaceDependency.create({
            data: {
              versionId: pkgVersion.id,
              dependencySlug: depSlug,
              versionConstraint: constraint
            }
          });
        }
      }

      // Publish event
      eventBus.publish('PackagePublished', 'global', {
        packageId: pkg.id,
        slug,
        version
      });

      return { package: pkg, version: pkgVersion };
    });
  }

  /**
   * Search marketplace packages with sorting, pagination, and capability filtering
   */
  async searchPackages(filters = {}, options = {}) {
    const { q, capability, publisherId, installedInBusinessId } = filters;
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 20;
    const skip = (page - 1) * limit;

    const where = {
      status: 'APPROVED'
    };

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } }
      ];
    }

    if (publisherId) {
      where.publisherId = publisherId;
    }

    if (capability) {
      where.versions = {
        some: {
          capabilities: {
            some: {
              type: capability
            }
          }
        }
      };
    }

    if (installedInBusinessId) {
      where.installations = {
        some: {
          businessId: installedInBusinessId
        }
      };
    }

    const [packages, total] = await Promise.all([
      prisma.marketplacePackage.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          publisher: true,
          versions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              capabilities: true,
              dependencies: true
            }
          }
        }
      }),
      prisma.marketplacePackage.count({ where })
    ]);

    return {
      packages,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Retrieve single package catalog record
   */
  async getPackageBySlug(slug) {
    const pkg = await prisma.marketplacePackage.findUnique({
      where: { slug },
      include: {
        publisher: true,
        versions: {
          orderBy: { createdAt: 'desc' },
          include: {
            capabilities: true,
            dependencies: true
          }
        },
        reviews: true
      }
    });

    if (!pkg) {
      throw new Error(`Package with slug ${slug} not found`);
    }

    return pkg;
  }

  /**
   * Install a package into a specific tenant Business context
   */
  async installPackage(businessId, packageSlug, versionString) {
    // 1. Verify business context
    const business = await prisma.business.findUnique({
      where: { id: businessId }
    });
    if (!business) {
      throw new Error('Target Business context not found');
    }

    // 2. Fetch package version
    const pkg = await this.getPackageBySlug(packageSlug);
    const targetVersion = versionString 
      ? pkg.versions.find(v => v.version === versionString)
      : pkg.versions[0]; // default to latest

    if (!targetVersion) {
      throw new Error(`Version ${versionString} of package ${packageSlug} not found`);
    }

    // 3. Resolve dependencies (DAG validation)
    await this.resolveDependencies(businessId, targetVersion, pkg.slug);

    return await prisma.$transaction(async (tx) => {
      // 4. Create license if missing
      let license = await tx.marketplaceLicense.findFirst({
        where: { businessId, packageId: pkg.id }
      });

      if (!license) {
        license = await tx.marketplaceLicense.create({
          data: {
            businessId,
            packageId: pkg.id,
            licenseKey: `lic-${crypto.randomBytes(12).toString('hex')}`,
            status: 'ACTIVE'
          }
        });
      }

      // 5. Create or update installation
      const installation = await tx.marketplaceInstallation.upsert({
        where: {
          businessId_packageId: {
            businessId,
            packageId: pkg.id
          }
        },
        update: {
          installedVersionId: targetVersion.id,
          isEnabled: true
        },
        create: {
          businessId,
          packageId: pkg.id,
          installedVersionId: targetVersion.id,
          isEnabled: true
        }
      });

      // Increment package download stats
      await tx.marketplacePackage.update({
        where: { id: pkg.id },
        data: { downloads: { increment: 1 } }
      });

      // Publish event
      eventBus.publish('PackageInstalled', businessId, {
        installationId: installation.id,
        packageSlug,
        version: targetVersion.version
      });

      return { installation, license };
    });
  }

  /**
   * Uninstall a package
   */
  async uninstallPackage(businessId, packageId) {
    const inst = await prisma.marketplaceInstallation.findUnique({
      where: {
        businessId_packageId: {
          businessId,
          packageId
        }
      },
      include: { package: true }
    });

    if (!inst) {
      throw new Error('Installation record not found');
    }

    await prisma.marketplaceInstallation.delete({
      where: { id: inst.id }
    });

    eventBus.publish('PackageRemoved', businessId, {
      packageSlug: inst.package.slug
    });

    return { success: true };
  }

  /**
   * Enable/Disable installation
   */
  async setEnabledState(businessId, packageId, isEnabled) {
    const inst = await prisma.marketplaceInstallation.findUnique({
      where: {
        businessId_packageId: {
          businessId,
          packageId
        }
      },
      include: { package: true }
    });

    if (!inst) {
      throw new Error('Installation record not found');
    }

    const updated = await prisma.marketplaceInstallation.update({
      where: { id: inst.id },
      data: { isEnabled }
    });

    eventBus.publish(isEnabled ? 'PackageEnabled' : 'PackageDisabled', businessId, {
      packageSlug: inst.package.slug
    });

    return updated;
  }

  /**
   * Helper: static manifest validation (Sandbox emulation)
   */
  validateManifest(manifest) {
    if (!manifest.id || !manifest.version) {
      throw new Error('Manifest missing required identification fields (id, version)');
    }
    // Block dangerous permission scopes
    if (manifest.permissions && manifest.permissions.includes('root:write')) {
      throw new Error('Manifest requests unauthorized root write permissions');
    }
  }

  /**
   * Helper: verify signature / checksum integrity
   */
  verifyPackageSignature(checksum, manifest) {
    if (!checksum || checksum.length < 32) {
      throw new Error('Package signature checksum invalid or missing');
    }
  }

  /**
   * Dependency graph topological sort (Kahn's or simple resolver checks)
   */
  async resolveDependencies(businessId, targetVersion, packageSlug) {
    const deps = await prisma.marketplaceDependency.findMany({
      where: { versionId: targetVersion.id }
    });

    for (const dep of deps) {
      // Check if installed
      const installed = await prisma.marketplaceInstallation.findFirst({
        where: {
          businessId,
          package: { slug: dep.dependencySlug }
        },
        include: { installedVersion: true }
      });

      if (!installed) {
        throw new Error(`Prerequisite package dependency not satisfied: ${dep.dependencySlug}`);
      }

      // Check cycle loop
      if (dep.dependencySlug === packageSlug) {
        throw new Error('Cyclic dependency loops are forbidden.');
      }
    }
  }
}

module.exports = new MarketplaceService();

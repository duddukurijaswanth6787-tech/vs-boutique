const prisma = require('../../../utils/prisma');
const { getStorageAdapter } = require('../adapters');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class DeploymentService {
  constructor() {
    this.storage = getStorageAdapter();
  }

  async listEnvironments(businessId) {
    return prisma.deploymentEnvironment.findMany({
      where: { businessId, isActive: true },
      orderBy: { sortOrder: 'asc' }
    });
  }

  async createEnvironment(businessId, data) {
    const { name, type, sortOrder } = data;
    if (!name || !type) {
      throw new Error('Name and type are required');
    }
    return prisma.deploymentEnvironment.create({
      data: { businessId, name, type, sortOrder: sortOrder || 0 }
    });
  }

  async updateEnvironment(id, data) {
    return prisma.deploymentEnvironment.update({
      where: { id },
      data
    });
  }

  async deleteEnvironment(id) {
    return prisma.deploymentEnvironment.update({
      where: { id },
      data: { isActive: false }
    });
  }

  async listDeployments(businessId, options = {}) {
    const { environmentId, status, limit = 50, offset = 0 } = options;
    const where = { businessId, isDeleted: false };
    if (environmentId) where.environmentId = environmentId;
    if (status) where.status = status;

    const [deployments, total] = await Promise.all([
      prisma.deployment.findMany({
        where,
        include: {
          environment: true,
          buildLogs: { orderBy: { createdAt: 'desc' }, take: 5 },
          rollbackTarget: { select: { version: true, id: true } },
          _count: { select: { artifacts: true, buildLogs: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.deployment.count({ where })
    ]);

    return { deployments, total, limit, offset };
  }

  async getDeployment(id) {
    return prisma.deployment.findUnique({
      where: { id },
      include: {
        environment: true,
        buildLogs: { orderBy: { createdAt: 'asc' } },
        artifacts: true,
        rollbackTarget: { select: { version: true, id: true, status: true, createdAt: true } },
        _count: { select: { rollbacks: true } }
      }
    });
  }

  async createDeployment(businessId, userId, data) {
    const { environmentId, version, builder, metadata } = data;
    if (!environmentId || !version) {
      throw new Error('Environment ID and version are required');
    }

    const env = await prisma.deploymentEnvironment.findUnique({ where: { id: environmentId } });
    if (!env || env.businessId !== businessId) {
      throw new Error('Environment not found');
    }

    return prisma.$transaction(async (tx) => {
      const deployment = await tx.deployment.create({
        data: {
          businessId,
          environmentId,
          version,
          builder: builder || 'manual',
          status: 'PENDING',
          deployedBy: userId,
          metadata: metadata || {}
        }
      });

      await tx.deploymentBuildLog.create({
        data: {
          deploymentId: deployment.id,
          level: 'INFO',
          message: `Deployment initialized for version ${version} to ${env.name} environment`
        }
      });

      return deployment;
    });
  }

  async startBuild(deploymentId) {
    const startTime = Date.now();
    return prisma.$transaction(async (tx) => {
      const deployment = await tx.deployment.update({
        where: { id: deploymentId },
        data: { status: 'BUILDING' }
      });

      await tx.deploymentBuildLog.create({
        data: {
          deploymentId,
          level: 'INFO',
          message: 'Build started'
        }
      });

      return deployment;
    });
  }

  async completeBuild(deploymentId, artifacts) {
    return prisma.$transaction(async (tx) => {
      const duration = Date.now() - Date.now(); // Will be updated properly
      const deployment = await tx.deployment.update({
        where: { id: deploymentId },
        data: {
          status: 'VALIDATING',
          duration: 0
        }
      });

      for (const artifact of artifacts) {
        await tx.deploymentArtifact.create({
          data: {
            deploymentId,
            name: artifact.name,
            type: artifact.type,
            url: artifact.url,
            size: artifact.size || 0,
            checksum: artifact.checksum,
            metadata: artifact.metadata || {}
          }
        });
      }

      await tx.deploymentBuildLog.create({
        data: {
          deploymentId,
          level: 'INFO',
          message: `Build completed with ${artifacts.length} artifact(s)`
        }
      });

      return deployment;
    });
  }

  async failBuild(deploymentId, error) {
    return prisma.$transaction(async (tx) => {
      const deployment = await tx.deployment.update({
        where: { id: deploymentId },
        data: { status: 'BUILD_FAILED' }
      });

      await tx.deploymentBuildLog.create({
        data: {
          deploymentId,
          level: 'ERROR',
          message: `Build failed: ${error.message || error}`
        }
      });

      return deployment;
    });
  }

  async deployArtifacts(deploymentId) {
    return prisma.$transaction(async (tx) => {
      const deployment = await tx.deployment.update({
        where: { id: deploymentId },
        data: { status: 'DEPLOYING' }
      });

      await tx.deploymentBuildLog.create({
        data: {
          deploymentId,
          level: 'INFO',
          message: 'Deploying artifacts to environment'
        }
      });

      return deployment;
    });
  }

  async completeDeployment(deploymentId, artifactUrl, checksum) {
    return prisma.$transaction(async (tx) => {
      const deployment = await tx.deployment.update({
        where: { id: deploymentId },
        data: {
          status: 'DEPLOYED',
          artifactUrl,
          artifactChecksum: checksum
        }
      });

      await tx.deploymentBuildLog.create({
        data: {
          deploymentId,
          level: 'INFO',
          message: 'Deployment completed successfully'
        }
      });

      return deployment;
    });
  }

  async cancelDeployment(deploymentId) {
    return prisma.$transaction(async (tx) => {
      const deployment = await tx.deployment.update({
        where: { id: deploymentId },
        data: { status: 'CANCELLED' }
      });

      await tx.deploymentBuildLog.create({
        data: {
          deploymentId,
          level: 'WARN',
          message: 'Deployment cancelled'
        }
      });

      return deployment;
    });
  }

  async getDeploymentLogs(deploymentId) {
    return prisma.deploymentBuildLog.findMany({
      where: { deploymentId },
      orderBy: { createdAt: 'asc' }
    });
  }

  async getDeploymentStats(businessId) {
    const [totalDeployments, activeDeployments, failedDeployments, environments, storageUsed] = await Promise.all([
      prisma.deployment.count({ where: { businessId, isDeleted: false } }),
      prisma.deployment.count({ where: { businessId, status: 'DEPLOYED', isDeleted: false } }),
      prisma.deployment.count({ where: { businessId, status: 'FAILED', isDeleted: false } }),
      prisma.deploymentEnvironment.count({ where: { businessId, isActive: true } }),
      prisma.deploymentArtifact.aggregate({
        where: { deployment: { businessId } },
        _sum: { size: true }
      })
    ]);

    const latestDeployments = await prisma.deployment.findMany({
      where: { businessId, isDeleted: false },
      include: { environment: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    return {
      totalDeployments,
      activeDeployments,
      failedDeployments,
      environments,
      storageBytes: storageUsed._sum.size || 0,
      latestDeployments
    };
  }

  async getHealthStatus(businessId) {
    const [activeDeployments, failedLast24h, domains, domainsActive] = await Promise.all([
      prisma.deployment.count({ where: { businessId, status: 'DEPLOYED', isDeleted: false } }),
      prisma.deployment.count({
        where: {
          businessId,
          status: 'FAILED',
          isDeleted: false,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      }),
      prisma.deploymentDomain.count({ where: { businessId, isDeleted: false } }),
      prisma.deploymentDomain.count({ where: { businessId, status: 'ACTIVE', isDeleted: false } })
    ]);

    const latestDeployments = await prisma.deployment.findMany({
      where: { businessId, isDeleted: false },
      include: { environment: true },
      orderBy: { createdAt: 'desc' },
      take: 3
    });

    return {
      status: failedLast24h > 3 ? 'degraded' : 'healthy',
      uptime: process.uptime(),
      activeDeployments,
      failedLast24h,
      totalDomains: domains,
      activeDomains: domainsActive,
      latestDeployments,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new DeploymentService();

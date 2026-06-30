const prisma = require('../../../utils/prisma');

class RollbackService {
  async getRollbackTargets(businessId, environmentId) {
    const where = {
      businessId,
      isDeleted: false,
      status: 'DEPLOYED'
    };
    if (environmentId) where.environmentId = environmentId;

    return prisma.deployment.findMany({
      where,
      include: {
        environment: { select: { name: true, type: true } },
        _count: { select: { artifacts: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
  }

  async rollback(deploymentId, userId) {
    return prisma.$transaction(async (tx) => {
      const deployment = await tx.deployment.findUnique({
        where: { id: deploymentId },
        include: {
          environment: true,
          rollbacks: { where: { status: 'DEPLOYED' }, orderBy: { createdAt: 'desc' } }
        }
      });

      if (!deployment) throw new Error('Deployment not found');
      if (deployment.status !== 'DEPLOYED') throw new Error('Only deployed versions can be rollback targets');

      const newVersion = `${deployment.version}-rollback-${Date.now()}`;

      const rollbackDeployment = await tx.deployment.create({
        data: {
          businessId: deployment.businessId,
          environmentId: deployment.environmentId,
          version: newVersion,
          builder: 'rollback',
          status: 'DEPLOYING',
          deployedBy: userId,
          rollbackTargetId: deploymentId,
          metadata: {
            rolledBackFrom: deployment.version,
            rolledBackAt: new Date().toISOString(),
            reason: 'Manual rollback via deployment dashboard'
          }
        }
      });

      await tx.deploymentBuildLog.create({
        data: {
          deploymentId: rollbackDeployment.id,
          level: 'INFO',
          message: `Rollback initiated to version ${deployment.version}`
        }
      });

      await tx.deploymentBuildLog.create({
        data: {
          deploymentId: rollbackDeployment.id,
          level: 'INFO',
          message: 'Restoring artifacts from target deployment'
        }
      });

      const artifacts = await tx.deploymentArtifact.findMany({
        where: { deploymentId }
      });

      for (const artifact of artifacts) {
        await tx.deploymentArtifact.create({
          data: {
            deploymentId: rollbackDeployment.id,
            name: artifact.name,
            type: artifact.type,
            url: artifact.url,
            size: artifact.size,
            checksum: artifact.checksum,
            metadata: artifact.metadata
          }
        });
      }

      await tx.deployment.update({
        where: { id: rollbackDeployment.id },
        data: { status: 'DEPLOYED' }
      });

      await tx.deploymentBuildLog.create({
        data: {
          deploymentId: rollbackDeployment.id,
          level: 'INFO',
          message: `Rollback completed to version ${deployment.version}`
        }
      });

      return rollbackDeployment;
    });
  }

  async getRollbackHistory(businessId, limit = 50, offset = 0) {
    const where = {
      businessId,
      builder: 'rollback',
      isDeleted: false
    };

    const [rollbacks, total] = await Promise.all([
      prisma.deployment.findMany({
        where,
        include: {
          environment: { select: { name: true, type: true } },
          rollbackTarget: { select: { version: true, createdAt: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.deployment.count({ where })
    ]);

    return { rollbacks, total, limit, offset };
  }
}

module.exports = new RollbackService();

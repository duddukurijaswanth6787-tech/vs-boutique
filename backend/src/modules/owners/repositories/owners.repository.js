const prisma = require('../../../utils/prisma');

class OwnersRepository {
  async findUnassignedOwners() {
    return prisma.owner.findMany({
      where: {
        role: 'owner',
        assignedBoutiqueId: null,
        isDeleted: false
      }
    });
  }

  async findOwnerById(id) {
    return prisma.owner.findUnique({
      where: { id }
    });
  }

  async findOwnerByEmailOrUsername(email, username) {
    return prisma.owner.findFirst({
      where: {
        OR: [{ email }, { username }],
        isDeleted: false
      }
    });
  }

  async findBoutiqueById(boutiqueId) {
    return prisma.boutique.findUnique({
      where: { id: boutiqueId }
    });
  }

  async countBoutiqueOwners(boutiqueId) {
    return prisma.owner.count({
      where: {
        assignedBoutiqueId: boutiqueId,
        isDeleted: false
      }
    });
  }

  async updateOwner(id, data) {
    return prisma.owner.update({
      where: { id },
      data
    });
  }

  async updateBoutique(id, data) {
    return prisma.boutique.update({
      where: { id },
      data
    });
  }

  async unlinkOwnerTransaction(ownerId, boutiqueId) {
    return prisma.$transaction(async (tx) => {
      const owner = await tx.owner.findUnique({ where: { id: ownerId } });
      if (owner) {
        await tx.owner.update({
          where: { id: ownerId },
          data: { assignedBoutiqueId: null }
        });
      }

      const boutique = await tx.boutique.findUnique({ where: { id: boutiqueId } });
      if (boutique && boutique.ownerId === ownerId) {
        const nextOwner = await tx.owner.findFirst({
          where: { assignedBoutiqueId: boutiqueId, id: { not: ownerId }, isDeleted: false },
          orderBy: { createdAt: 'asc' }
        });

        await tx.boutique.update({
          where: { id: boutiqueId },
          data: { ownerId: nextOwner ? nextOwner.id : null }
        });
      }
    });
  }

  async findStaffByBoutiqueId(boutiqueId) {
    return prisma.owner.findMany({
      where: {
        assignedBoutiqueId: boutiqueId,
        isDeleted: false
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  async getDashboardStats(boutiqueId) {
    const [totalOrders, totalBookings, totalDesigns, recentOrders, boutique] = await Promise.all([
      prisma.order.count({ where: { boutiqueId, isDeleted: false } }),
      prisma.booking.count({ where: { boutiqueId, isDeleted: false } }),
      prisma.design.count({ where: { boutiqueId, isDeleted: false } }),
      prisma.order.findMany({
        where: { boutiqueId, isDeleted: false },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      prisma.boutique.findUnique({
        where: { id: boutiqueId }
      })
    ]);

    return {
      totalOrders,
      totalBookings,
      totalDesigns,
      recentOrders,
      boutique
    };
  }
}

module.exports = new OwnersRepository();

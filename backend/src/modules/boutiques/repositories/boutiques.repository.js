const prisma = require('../../../utils/prisma');

class BoutiquesRepository {
  async findPublicBoutiques() {
    return prisma.boutique.findMany({
      where: {
        isDeleted: false,
        status: 'Active'
      },
      orderBy: [
        { featuredBoutique: 'desc' },
        { createdAt: 'desc' }
      ]
    });
  }

  async findPublicBoutiqueById(id) {
    return prisma.boutique.findFirst({
      where: {
        id,
        isDeleted: false,
        status: 'Active'
      },
      include: {
        designs: {
          where: {
            isDeleted: false
          },
          take: 10
        }
      }
    });
  }

  async findAllBoutiques() {
    return prisma.boutique.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findBoutiqueById(id) {
    return prisma.boutique.findFirst({
      where: { id, isDeleted: false }
    });
  }

  async findBoutiqueByIdRaw(id) {
    return prisma.boutique.findUnique({
      where: { id }
    });
  }

  async findOwnersByBoutiqueId(boutiqueId) {
    return prisma.owner.findMany({
      where: {
        assignedBoutiqueId: boutiqueId,
        isDeleted: false
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  async findOwnerById(id) {
    return prisma.owner.findUnique({
      where: { id }
    });
  }

  async checkDuplicateOwner(username, email) {
    return prisma.owner.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });
  }

  async createBoutiqueAndOwnerTransaction(boutiqueInsertData, ownerDetails) {
    return prisma.$transaction(async (tx) => {
      // Create boutique
      const createdBoutique = await tx.boutique.create({
        data: boutiqueInsertData
      });

      let primaryOwnerId = null;

      if (ownerDetails && ownerDetails.username) {
        // Double check username/email uniqueness inside transaction
        const existingOwner = await tx.owner.findFirst({
          where: {
            OR: [
              { username: ownerDetails.username },
              { email: ownerDetails.email || boutiqueInsertData.email }
            ]
          }
        });

        if (existingOwner) {
          throw new Error('Duplicate value: a record with this username or email already exists.');
        }

        const createdOwner = await tx.owner.create({
          data: {
            ownerName: boutiqueInsertData.ownerName,
            username: ownerDetails.username,
            email: ownerDetails.email || boutiqueInsertData.email,
            mobileNumber: ownerDetails.mobileNumber || boutiqueInsertData.mobileNumber,
            password: ownerDetails.password,
            role: 'owner',
            assignedBoutiqueId: createdBoutique.id,
            status: ownerDetails.status || 'Active',
            mustResetPassword: ownerDetails.mustResetPassword || false,
            emailVerified: ownerDetails.emailVerified || false
          }
        });

        primaryOwnerId = createdOwner.id;
      }

      // Update Boutique primary owner reference if owner was created
      let finalBoutique = createdBoutique;
      if (primaryOwnerId) {
        finalBoutique = await tx.boutique.update({
          where: { id: createdBoutique.id },
          data: { ownerId: primaryOwnerId }
        });
      }

      return { boutique: finalBoutique, ownerId: primaryOwnerId };
    });
  }

  async updateBoutique(id, data) {
    return prisma.boutique.update({
      where: { id },
      data
    });
  }

  async softDeleteBoutiqueTransaction(id) {
    return prisma.$transaction([
      prisma.boutique.update({
        where: { id },
        data: { isDeleted: true, deletedAt: new Date() }
      }),
      prisma.owner.updateMany({
        where: { assignedBoutiqueId: id },
        data: { isDeleted: true }
      })
    ]);
  }
}

module.exports = new BoutiquesRepository();

const prisma = require('../../../utils/prisma');

class DesignsRepository {
  async getDesignsByBoutique(boutiqueId) {
    return prisma.design.findMany({
      where: { 
        boutiqueId, 
        isDeleted: false 
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getDesignByIdAndBoutique(id, boutiqueId) {
    return prisma.design.findFirst({
      where: { id, boutiqueId }
    });
  }

  async createDesign(tx, data) {
    return tx.design.create({
      data
    });
  }

  async updateDesign(id, data) {
    return prisma.design.update({
      where: { id },
      data
    });
  }

  async softDeleteDesign(id) {
    return prisma.design.update({
      where: { id },
      data: { isDeleted: true }
    });
  }
}

module.exports = new DesignsRepository();

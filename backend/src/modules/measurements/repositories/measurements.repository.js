const prisma = require('../../../utils/prisma');

class MeasurementsRepository {
  async getMeasurementByUserId(userId) {
    return prisma.measurement.findUnique({
      where: { userId }
    });
  }

  async findUserById(id) {
    return prisma.user.findUnique({ where: { id } });
  }

  async findUserByPhone(phone) {
    return prisma.user.findUnique({ where: { phone } });
  }

  async createUser(data) {
    return prisma.user.create({ data });
  }

  async upsertMeasurement(userId, data) {
    return prisma.measurement.upsert({
      where: { userId },
      update: {
        ...data,
        updatedAt: new Date()
      },
      create: {
        userId,
        ...data,
        updatedAt: new Date()
      }
    });
  }

  async deleteMeasurementByUserId(userId) {
    return prisma.measurement.deleteMany({
      where: { userId }
    });
  }

  async findBoutiqueById(id) {
    return prisma.boutique.findUnique({ where: { id } });
  }
}

module.exports = new MeasurementsRepository();

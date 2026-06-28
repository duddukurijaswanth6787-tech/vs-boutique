const prisma = require('../../../utils/prisma');

class UsersRepository {
  async findAddressesByUserId(userId) {
    return prisma.shippingAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
    });
  }

  async countAddressesByUserId(userId) {
    return prisma.shippingAddress.count({
      where: { userId }
    });
  }

  async unsetExistingDefault(userId) {
    return prisma.shippingAddress.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false }
    });
  }

  async unsetExistingDefaultExcept(userId, id) {
    return prisma.shippingAddress.updateMany({
      where: { userId, isDefault: true, id: { not: id } },
      data: { isDefault: false }
    });
  }

  async createAddress(userId, data) {
    return prisma.shippingAddress.create({
      data: {
        userId,
        ...data
      }
    });
  }

  async findAddressByIdAndUserId(id, userId) {
    return prisma.shippingAddress.findFirst({
      where: { id, userId }
    });
  }

  async updateAddress(id, data) {
    return prisma.shippingAddress.update({
      where: { id },
      data
    });
  }

  async deleteAddress(id) {
    return prisma.shippingAddress.delete({
      where: { id }
    });
  }

  async findFirstAddressByUserId(userId) {
    return prisma.shippingAddress.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }
}

module.exports = new UsersRepository();

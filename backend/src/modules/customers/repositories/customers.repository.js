const prisma = require('../../../utils/prisma');

class CustomersRepository {
  async findManyCustomers(where, skip, limit) {
    return prisma.user.findMany({
      where,
      include: {
        payments: true,
        addresses: true
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });
  }

  async countCustomers(where) {
    return prisma.user.count({ where });
  }

  async findCustomerById(id) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        payments: {
          include: { order: true, boutique: true },
          orderBy: { createdAt: 'desc' }
        },
        addresses: true,
        measurement: true
      }
    });
  }

  async updateCustomer(id, data) {
    return prisma.user.update({
      where: { id },
      data
    });
  }

  async findCustomerByPhone(phone) {
    return prisma.user.findUnique({
      where: { phone }
    });
  }

  async countOrdersByPhone(phone) {
    return prisma.order.count({
      where: {
        customerPhone: phone,
        isDeleted: false
      }
    });
  }

  async findOrdersByPhone(phone) {
    return prisma.order.findMany({
      where: {
        customerPhone: phone,
        isDeleted: false
      },
      include: { boutique: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findAddressesByUserId(userId) {
    return prisma.customerAddress.findMany({
      where: { userId }
    });
  }

  async findAddressByIdAndUserId(addressId, userId) {
    return prisma.customerAddress.findFirst({
      where: { id: addressId, userId }
    });
  }

  async unsetExistingDefault(userId) {
    return prisma.customerAddress.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false }
    });
  }

  async createAddress(userId, data) {
    return prisma.customerAddress.create({
      data: {
        userId,
        ...data
      }
    });
  }

  async updateAddress(addressId, data) {
    return prisma.customerAddress.update({
      where: { id: addressId },
      data
    });
  }

  async deleteAddress(addressId) {
    return prisma.customerAddress.delete({
      where: { id: addressId }
    });
  }
}

module.exports = new CustomersRepository();

const customersRepository = require('../repositories/customers.repository');
const { logAction } = require('../../../services/auditService');

class CustomersService {
  async syncAndGetSegment(user) {
    if (user.status === 'BLOCKED') return 'BLOCKED';

    const totalSpent = user.payments
      ? user.payments
          .filter(p => p.status === 'captured')
          .reduce((sum, p) => sum + Number(p.amount), 0)
      : 0;

    const ordersCount = await customersRepository.countOrdersByPhone(user.phone);

    let segment = 'NEW';
    if (totalSpent >= 10000 || ordersCount >= 5) {
      segment = 'VIP';
    } else if (ordersCount > 0) {
      segment = 'ACTIVE';
    } else {
      const diffTime = Math.abs(new Date() - new Date(user.createdAt));
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 7) {
        segment = 'INACTIVE';
      }
    }

    if (user.segment !== segment) {
      await customersRepository.updateCustomer(user.id, { segment });
    }

    return segment;
  }

  async listCustomers(params) {
    const { search, status, segment, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    let where = {};
    if (status) {
      where.status = status;
    }
    if (segment) {
      where.segment = segment;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    const users = await customersRepository.findManyCustomers(where, skip, limit);
    const total = await customersRepository.countCustomers(where);

    const formattedUsers = await Promise.all(users.map(async (u) => {
      const currentSegment = await this.syncAndGetSegment(u);
      const totalSpent = u.payments
        .filter(p => p.status === 'captured')
        .reduce((sum, p) => sum + Number(p.amount), 0);

      const ordersCount = await customersRepository.countOrdersByPhone(u.phone);

      return {
        id: u.id,
        name: u.name || 'New User',
        phone: u.phone,
        status: u.status,
        segment: currentSegment,
        totalSpent,
        ordersCount,
        addressesCount: u.addresses.length,
        createdAt: u.createdAt
      };
    }));

    return {
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: formattedUsers
    };
  }

  async getCustomerProfile(id) {
    const user = await customersRepository.findCustomerById(id);
    if (!user) {
      throw { status: 404, message: 'Customer not found' };
    }

    const segment = await this.syncAndGetSegment(user);
    const orders = await customersRepository.findOrdersByPhone(user.phone);

    const totalSpent = user.payments
      .filter(p => p.status === 'captured')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const aov = orders.length > 0 ? (totalSpent / orders.length) : 0;

    return {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        status: user.status,
        segment,
        createdAt: user.createdAt,
        stats: {
          totalSpent,
          ordersCount: orders.length,
          averageOrderValue: parseFloat(aov.toFixed(2))
        },
        addresses: user.addresses,
        measurement: user.measurement,
        orders: orders.map(o => ({
          id: o.id,
          orderId: o.orderId,
          boutique: o.boutique.name,
          price: Number(o.price),
          orderStatus: o.orderStatus,
          paymentStatus: o.paymentStatus,
          createdAt: o.createdAt
        })),
        payments: user.payments.map(p => ({
          id: p.id,
          amount: Number(p.amount),
          status: p.status,
          boutique: p.boutique.name,
          createdAt: p.createdAt
        }))
      }
    };
  }

  async toggleCustomerBlock(id, status, performedBy, reason = 'No reason provided') {
    if (!['ACTIVE', 'BLOCKED'].includes(status)) {
      throw { status: 400, message: 'Invalid status. Choose ACTIVE or BLOCKED' };
    }

    const user = await customersRepository.findCustomerById(id);
    if (!user) {
      throw { status: 404, message: 'Customer not found' };
    }

    const updatedUser = await customersRepository.updateCustomer(id, {
      status,
      segment: status === 'BLOCKED' ? 'BLOCKED' : 'NEW'
    });

    if (status === 'ACTIVE') {
      await this.syncAndGetSegment(updatedUser);
    }

    await logAction(
      status === 'BLOCKED' ? 'BLOCK_CUSTOMER' : 'UNBLOCK_CUSTOMER',
      'User',
      id,
      performedBy,
      { reason }
    );

    return {
      success: true,
      message: `Customer account successfully ${status === 'BLOCKED' ? 'blocked' : 'unblocked'}`
    };
  }

  async exportCustomerData(id) {
    const user = await customersRepository.findCustomerById(id);
    if (!user) {
      throw { status: 404, message: 'Customer not found' };
    }

    const orders = await customersRepository.findOrdersByPhone(user.phone);

    return {
      exporter: 'VS Boutique Marketplace Superadmin',
      timestamp: new Date().toISOString(),
      profile: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        status: user.status,
        segment: user.segment,
        registeredAt: user.createdAt
      },
      addresses: user.addresses.map(a => ({
        addressLine1: a.addressLine1,
        addressLine2: a.addressLine2,
        city: a.city,
        state: a.state,
        pincode: a.pincode,
        isDefault: a.isDefault
      })),
      measurements: user.measurement ? {
        chest: Number(user.measurement.chest),
        waist: Number(user.measurement.waist),
        length: Number(user.measurement.length),
        shoulder: Number(user.measurement.shoulder),
        sleeveLength: Number(user.measurement.sleeveLength),
        neck: Number(user.measurement.neck),
        notes: user.measurement.notes,
        updatedAt: user.measurement.updatedAt
      } : null,
      orders: orders.map(o => ({
        orderId: o.orderId,
        boutique: o.boutique.name,
        category: o.category,
        price: Number(o.price),
        advancePaid: Number(o.advancePaid),
        orderStatus: o.orderStatus,
        paymentStatus: o.paymentStatus,
        orderDate: o.orderDate
      })),
      transactions: user.payments.map(p => ({
        id: p.id,
        amount: Number(p.amount),
        status: p.status,
        method: p.method,
        receipt: p.receipt,
        date: p.createdAt
      }))
    };
  }

  async getCustomerAddresses(id) {
    const user = await customersRepository.findCustomerById(id);
    if (!user) {
      throw { status: 404, message: 'Customer not found' };
    }
    const addresses = await customersRepository.findAddressesByUserId(id);
    return { success: true, data: addresses };
  }

  async addCustomerAddress(id, data) {
    const { addressLine1, addressLine2, city, state, pincode, isDefault = false } = data;

    if (!addressLine1 || !city || !state || !pincode) {
      throw { status: 400, message: 'Address, city, state, and pincode are required' };
    }

    const user = await customersRepository.findCustomerById(id);
    if (!user) {
      throw { status: 404, message: 'Customer not found' };
    }

    if (isDefault) {
      await customersRepository.unsetExistingDefault(id);
    }

    const address = await customersRepository.createAddress(id, {
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      isDefault
    });

    return { success: true, data: address };
  }

  async updateCustomerAddress(id, addressId, data) {
    const address = await customersRepository.findAddressByIdAndUserId(addressId, id);
    if (!address) {
      throw { status: 404, message: 'Address not found for this customer' };
    }

    const { addressLine1, addressLine2, city, state, pincode, isDefault } = data;
    let updateData = {};
    if (addressLine1 !== undefined) updateData.addressLine1 = addressLine1;
    if (addressLine2 !== undefined) updateData.addressLine2 = addressLine2;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (pincode !== undefined) updateData.pincode = pincode;

    if (isDefault === true) {
      await customersRepository.unsetExistingDefault(id);
      updateData.isDefault = true;
    } else if (isDefault === false) {
      updateData.isDefault = false;
    }

    const updatedAddress = await customersRepository.updateAddress(addressId, updateData);
    return { success: true, data: updatedAddress };
  }

  async deleteCustomerAddress(id, addressId) {
    const address = await customersRepository.findAddressByIdAndUserId(addressId, id);
    if (!address) {
      throw { status: 404, message: 'Address not found for this customer' };
    }

    await customersRepository.deleteAddress(addressId);
    return { success: true, message: 'Address deleted successfully' };
  }
}

module.exports = new CustomersService();

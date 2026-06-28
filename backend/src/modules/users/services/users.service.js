const usersRepository = require('../repositories/users.repository');

class UsersService {
  async getShippingAddresses(userId) {
    return usersRepository.findAddressesByUserId(userId);
  }

  async createShippingAddress(userId, data) {
    const { fullName, phone, addressLine1, addressLine2, city, state, pincode, isDefault } = data;

    if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
      throw {
        status: 400,
        message: 'fullName, phone, addressLine1, city, state, and pincode are required'
      };
    }

    if (isDefault) {
      await usersRepository.unsetExistingDefault(userId);
    }

    const existingCount = await usersRepository.countAddressesByUserId(userId);

    const address = await usersRepository.createAddress(userId, {
      fullName,
      phone,
      addressLine1,
      addressLine2: addressLine2 || null,
      city,
      state,
      pincode,
      isDefault: existingCount === 0 ? true : (isDefault || false)
    });

    return address;
  }

  async updateShippingAddress(id, userId, data) {
    const existing = await usersRepository.findAddressByIdAndUserId(id, userId);
    if (!existing) {
      throw { status: 404, message: 'Shipping address not found' };
    }

    const { fullName, phone, addressLine1, addressLine2, city, state, pincode, isDefault } = data;

    if (isDefault) {
      await usersRepository.unsetExistingDefaultExcept(userId, id);
    }

    const address = await usersRepository.updateAddress(id, {
      ...(fullName !== undefined && { fullName }),
      ...(phone !== undefined && { phone }),
      ...(addressLine1 !== undefined && { addressLine1 }),
      ...(addressLine2 !== undefined && { addressLine2 }),
      ...(city !== undefined && { city }),
      ...(state !== undefined && { state }),
      ...(pincode !== undefined && { pincode }),
      ...(isDefault !== undefined && { isDefault })
    });

    return address;
  }

  async deleteShippingAddress(id, userId) {
    const existing = await usersRepository.findAddressByIdAndUserId(id, userId);
    if (!existing) {
      throw { status: 404, message: 'Shipping address not found' };
    }

    const wasDefault = existing.isDefault;

    await usersRepository.deleteAddress(id);

    if (wasDefault) {
      const next = await usersRepository.findFirstAddressByUserId(userId);
      if (next) {
        await usersRepository.updateAddress(next.id, { isDefault: true });
      }
    }

    return { message: 'Shipping address deleted' };
  }

  async setDefaultAddress(id, userId) {
    const existing = await usersRepository.findAddressByIdAndUserId(id, userId);
    if (!existing) {
      throw { status: 404, message: 'Shipping address not found' };
    }

    await usersRepository.unsetExistingDefault(userId);

    const address = await usersRepository.updateAddress(id, { isDefault: true });
    return address;
  }
}

module.exports = new UsersService();

const { parseDecimalOrNull } = require('../../../utils/parseDecimal');
const { eventBus, Events } = require('../../../services/eventBus');
const repository = require('../repositories/measurements.repository');
const { validateSubscriptionLimit } = require('../../../services/subscriptionService');

class MeasurementsService {
  mapMeasurementResponse(m, originalUserId) {
    if (!m) return null;
    return {
      id: m.id,
      _id: m.id,
      userId: originalUserId || m.userId,
      measurements: {
        chest: m.chest !== null ? Number(m.chest) : null,
        waist: m.waist !== null ? Number(m.waist) : null,
        length: m.length !== null ? Number(m.length) : null,
        shoulder: m.shoulder !== null ? Number(m.shoulder) : null,
        sleeveLength: m.sleeveLength !== null ? Number(m.sleeveLength) : null,
        neck: m.neck !== null ? Number(m.neck) : null
      },
      notes: m.notes || '',
      updatedAt: m.updatedAt
    };
  }

  async getMeasurementByUserId(userId) {
    const measurement = await repository.getMeasurementByUserId(userId);
    if (!measurement) return null;
    return this.mapMeasurementResponse(measurement, userId);
  }

  async updateCustomerSelfMeasurement(userId, measurements, notes) {
    const parsed = {
      chest: parseDecimalOrNull(measurements?.chest),
      waist: parseDecimalOrNull(measurements?.waist),
      length: parseDecimalOrNull(measurements?.length),
      shoulder: parseDecimalOrNull(measurements?.shoulder),
      sleeveLength: parseDecimalOrNull(measurements?.sleeveLength),
      neck: parseDecimalOrNull(measurements?.neck),
      notes: notes || ''
    };

    const updated = await repository.upsertMeasurement(userId, parsed);
    return this.mapMeasurementResponse(updated, userId);
  }

  async deleteCustomerSelfMeasurement(userId) {
    await repository.deleteMeasurementByUserId(userId);
    return { message: 'Measurements deleted' };
  }

  async recordMeasurementByOwner({ userIdInput, measurements, notes, boutiqueId, ownerBoutiqueId }) {
    const targetBoutiqueId = boutiqueId || ownerBoutiqueId;
    if (targetBoutiqueId) {
      await validateSubscriptionLimit(targetBoutiqueId, 'canUseCustomMeasurements');
    }

    if (!userIdInput) {
      throw new Error('userId is required');
    }

    let user;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (uuidRegex.test(userIdInput)) {
      user = await repository.findUserById(userIdInput);
      if (!user) {
        user = await repository.createUser({
          id: userIdInput,
          phone: `dummy-${userIdInput.substring(0, 10)}`,
          name: 'New User'
        });
      }
    } else {
      const phone = userIdInput.substring(0, 20);
      user = await repository.findUserByPhone(phone);
      if (!user) {
        user = await repository.createUser({
          phone,
          name: 'New User'
        });
      }
    }

    const parsedData = {
      chest: parseDecimalOrNull(measurements?.chest),
      waist: parseDecimalOrNull(measurements?.waist),
      length: parseDecimalOrNull(measurements?.length),
      shoulder: parseDecimalOrNull(measurements?.shoulder),
      sleeveLength: parseDecimalOrNull(measurements?.sleeveLength),
      neck: parseDecimalOrNull(measurements?.neck),
      notes: notes || ''
    };

    const updated = await repository.upsertMeasurement(user.id, parsedData);

    if (targetBoutiqueId) {
      const mBoutique = await repository.findBoutiqueById(targetBoutiqueId);
      if (mBoutique && mBoutique.ownerId) {
        eventBus.emit(Events.MEASUREMENT_SUBMITTED, { measurements: updated, boutique: mBoutique });
      }
    }

    return this.mapMeasurementResponse(updated, userIdInput);
  }

  async getMeasurementByUserInput(userIdInput) {
    let user;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (uuidRegex.test(userIdInput)) {
      user = await repository.findUserById(userIdInput);
    } else {
      user = await repository.findUserByPhone(userIdInput);
    }

    if (!user) return null;

    const measurement = await repository.getMeasurementByUserId(user.id);
    if (!measurement) return null;

    return this.mapMeasurementResponse(measurement, userIdInput);
  }
}

module.exports = new MeasurementsService();

const repository = require('../repositories/measurements.repository');
const notificationsService = require('../../notifications/services/notifications.service');
const { validateSubscriptionLimit } = require('../../../services/subscriptionService');

class MeasurementsService {
  parseDecimalVal(val) {
    if (val === null || val === undefined || val === '') return null;
    if (typeof val === 'number') return val;
    const parsed = parseFloat(val.toString().replace(/[^0-9.]/g, ''));
    return isNaN(parsed) ? null : parsed;
  }

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
      chest: this.parseDecimalVal(measurements?.chest),
      waist: this.parseDecimalVal(measurements?.waist),
      length: this.parseDecimalVal(measurements?.length),
      shoulder: this.parseDecimalVal(measurements?.shoulder),
      sleeveLength: this.parseDecimalVal(measurements?.sleeveLength),
      neck: this.parseDecimalVal(measurements?.neck),
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
      chest: this.parseDecimalVal(measurements?.chest),
      waist: this.parseDecimalVal(measurements?.waist),
      length: this.parseDecimalVal(measurements?.length),
      shoulder: this.parseDecimalVal(measurements?.shoulder),
      sleeveLength: this.parseDecimalVal(measurements?.sleeveLength),
      neck: this.parseDecimalVal(measurements?.neck),
      notes: notes || ''
    };

    const updated = await repository.upsertMeasurement(user.id, parsedData);

    if (targetBoutiqueId) {
      const mBoutique = await repository.findBoutiqueById(targetBoutiqueId);
      if (mBoutique && mBoutique.ownerId) {
        await notificationsService.createAdminNotification({
          recipientType: 'OWNER',
          recipientId: mBoutique.ownerId,
          boutiqueId: targetBoutiqueId,
          type: 'NEW_MEASUREMENT',
          priority: 'LOW',
          title: 'New Measurements Recorded',
          message: `Measurements for customer ${user.name || user.phone} have been recorded.`,
          entityType: 'measurement',
          entityId: updated.id,
        });
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

const service = require('../services/measurements.service');

class MeasurementsController {
  async getCustomerSelfMeasurement(req, res) {
    try {
      const measurement = await service.getMeasurementByUserId(req.user.id);
      if (!measurement) {
        return res.status(404).json({ message: 'No measurements found' });
      }
      return res.json(measurement);
    } catch (err) {
      console.error('[MeasurementsController.getCustomerSelfMeasurement]', err);
      return res.status(500).json({ message: err.message });
    }
  }

  async updateCustomerSelfMeasurement(req, res) {
    try {
      const { measurements, notes } = req.body;
      const updated = await service.updateCustomerSelfMeasurement(req.user.id, measurements, notes);
      return res.json(updated);
    } catch (err) {
      console.error('[MeasurementsController.updateCustomerSelfMeasurement]', err);
      return res.status(400).json({ message: err.message });
    }
  }

  async deleteCustomerSelfMeasurement(req, res) {
    try {
      const result = await service.deleteCustomerSelfMeasurement(req.user.id);
      return res.json(result);
    } catch (err) {
      console.error('[MeasurementsController.deleteCustomerSelfMeasurement]', err);
      return res.status(500).json({ message: err.message });
    }
  }

  async recordMeasurementByOwner(req, res) {
    try {
      const { userId, measurements, notes, boutiqueId } = req.body;
      const result = await service.recordMeasurementByOwner({
        userIdInput: userId,
        measurements,
        notes,
        boutiqueId,
        ownerBoutiqueId: req.user?.assignedBoutiqueId
      });
      return res.json(result);
    } catch (err) {
      console.error('[MeasurementsController.recordMeasurementByOwner]', err);
      return res.status(400).json({ message: err.message });
    }
  }

  async getMeasurementByUser(req, res) {
    try {
      const { userId } = req.params;
      const measurement = await service.getMeasurementByUserInput(userId);
      if (!measurement) {
        return res.status(404).json({ message: 'No measurements found' });
      }
      return res.json(measurement);
    } catch (err) {
      console.error('[MeasurementsController.getMeasurementByUser]', err);
      return res.status(500).json({ message: err.message });
    }
  }
}

module.exports = new MeasurementsController();

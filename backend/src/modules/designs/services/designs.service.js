const repository = require('../repositories/designs.repository');
const { logAction } = require('../../../services/auditService');
const { validateSubscriptionLimit, withSubscriptionGuard } = require('../../../services/subscriptionService');

class DesignsService {
  mapDesignResponse(design) {
    if (!design) return null;
    return {
      ...design,
      id: design.id,
      _id: design.id,
      price: Number(design.price) || 0
    };
  }

  parseDecimalVal(val) {
    if (val === null || val === undefined || val === '') return 0.00;
    if (typeof val === 'number') return val;
    const parsed = parseFloat(val.toString().replace(/[^0-9.]/g, ''));
    return isNaN(parsed) ? 0.00 : parsed;
  }

  async listDesigns(boutiqueId) {
    const designs = await repository.getDesignsByBoutique(boutiqueId);
    return designs.map(d => this.mapDesignResponse(d));
  }

  async createDesign(boutiqueId, body, userId) {
    if (!boutiqueId) {
      throw new Error('No boutique assigned');
    }

    const { id, _id, boutiqueId: bodyBoutiqueId, createdAt, updatedAt, isDeleted, price, ...allowedData } = body;
    const feature = body.isReadyMade === true ? 'readyMadeProducts' : 'customDesigns';

    const newDesign = await withSubscriptionGuard(boutiqueId, feature, async (tx) => {
      return repository.createDesign(tx, {
        ...allowedData,
        price: this.parseDecimalVal(price),
        boutiqueId
      });
    });

    await logAction('CREATE_DESIGN', 'Design', newDesign.id, userId);
    return this.mapDesignResponse(newDesign);
  }

  async updateDesign(id, boutiqueId, body, userId) {
    if (!boutiqueId) {
      throw new Error('No boutique assigned');
    }

    await validateSubscriptionLimit(boutiqueId, 'update');

    const design = await repository.getDesignByIdAndBoutique(id, boutiqueId);
    if (!design) {
      throw new Error('Design not found');
    }

    const { id: bodyId, _id, boutiqueId: bodyBoutiqueId, createdAt, updatedAt, isDeleted, price, ...allowedData } = body;

    const updated = await repository.updateDesign(id, {
      ...allowedData,
      price: price !== undefined ? this.parseDecimalVal(price) : undefined
    });

    await logAction('UPDATE_DESIGN', 'Design', updated.id, userId);
    return this.mapDesignResponse(updated);
  }

  async deleteDesign(id, boutiqueId, userId) {
    const design = await repository.getDesignByIdAndBoutique(id, boutiqueId);
    if (!design) {
      throw new Error('Design not found');
    }

    await validateSubscriptionLimit(boutiqueId, 'update');

    await repository.softDeleteDesign(id);
    await logAction('DELETE_DESIGN', 'Design', id, userId);
    return { message: 'Design deleted successfully' };
  }
}

module.exports = new DesignsService();

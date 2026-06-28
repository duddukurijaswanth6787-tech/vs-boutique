const IProviderService = require('../interfaces/IProviderService');

class ProviderAdapter extends IProviderService {
  constructor(config) {
    super();
    this.config = config;
  }
}

module.exports = ProviderAdapter;

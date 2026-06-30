const IProviderService = require('../interfaces/IProviderService');
const providerFactory = require('../adapters/provider.factory');

class ProviderService extends IProviderService {
  constructor() {
    super();
  }

  async generate(systemPrompt, userPrompt, schema = null, providerName = null) {
    const provider = providerFactory.getProvider(providerName);
    return provider.generate(systemPrompt, userPrompt, schema);
  }

  async stream(systemPrompt, userPrompt, onChunk, providerName = null) {
    const provider = providerFactory.getProvider(providerName);
    return provider.stream(systemPrompt, userPrompt, onChunk);
  }

  async countTokens(text, providerName = null) {
    const provider = providerFactory.getProvider(providerName);
    return provider.countTokens(text);
  }

  async estimateCost(tokensCount, providerName = null) {
    const provider = providerFactory.getProvider(providerName);
    return provider.estimateCost(tokensCount);
  }

  async validateConnection(providerName = null) {
    const provider = providerFactory.getProvider(providerName);
    if (!provider.apiKey) {
      return { status: 'Warning', message: 'API Key not configured.' };
    }
    try {
      await provider.countTokens('Health Check');
      return { status: 'Healthy', message: 'Connection verified successfully.' };
    } catch (err) {
      return { status: 'Unhealthy', message: `Connection test failed: ${err.message}` };
    }
  }
}

module.exports = new ProviderService();

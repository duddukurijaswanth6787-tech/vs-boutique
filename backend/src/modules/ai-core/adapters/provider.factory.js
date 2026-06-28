const GeminiAdapter = require('./gemini.adapter');
const ClaudeAdapter = require('./claude.adapter');
const OpenAIAdapter = require('./openai.adapter');
const OllamaAdapter = require('./ollama.adapter');
const config = require('../config/ai.config');
const logger = require('../utils/logger');

class ProviderFactory {
  constructor() {
    this.providers = new Map();
    this._initializeProviders();
  }

  _initializeProviders() {
    logger.info('Initializing AI Provider Adapters...');
    this.providers.set('gemini', new GeminiAdapter(config.gemini));
    this.providers.set('claude', new ClaudeAdapter(config.openai)); // Claude fallback uses placeholder config keys
    this.providers.set('openai', new OpenAIAdapter(config.openai));
    this.providers.set('ollama', new OllamaAdapter({}));
  }

  getProvider(name) {
    const providerName = (name || config.provider).toLowerCase();
    if (!this.providers.has(providerName)) {
      throw new Error(`AI Provider '${name}' is not registered in the Provider Factory.`);
    }
    return this.providers.get(providerName);
  }

  getActiveProvider() {
    return this.getProvider(config.provider);
  }
}

// Export a singleton instance
module.exports = new ProviderFactory();

const ProviderAdapter = require('./provider.adapter');
const logger = require('../utils/logger');

class OllamaAdapter extends ProviderAdapter {
  constructor(config) {
    super(config);
    this.endpoint = config.endpoint || process.env.OLLAMA_ENDPOINT || 'http://localhost:11434';
    this.model = config.model || 'llama3';
  }

  async generate(systemPrompt, userPrompt, schema = null) {
    const url = `${this.endpoint}/api/generate`;
    const body = {
      model: this.model,
      prompt: userPrompt,
      system: systemPrompt,
      stream: false
    };

    if (schema) {
      body.format = 'json';
    }

    try {
      logger.info(`Sending generation request to local Ollama model: ${this.model}`);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`Ollama responded with status ${response.status}`);
      }

      const resJson = await response.json();
      const contentText = resJson.response;
      
      if (!contentText) {
        throw new Error('Invalid empty content returned from Ollama.');
      }

      return contentText.trim();
    } catch (err) {
      logger.error('Ollama local API connection failed.', { error: err.message });
      throw err;
    }
  }

  async stream(systemPrompt, userPrompt, onChunk) {
    const url = `${this.endpoint}/api/generate`;
    const body = {
      model: this.model,
      prompt: userPrompt,
      system: systemPrompt,
      stream: true
    };

    try {
      logger.info(`Sending streaming request to Ollama local model: ${this.model}`);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`Ollama responded with status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const cleaned = line.trim();
          if (!cleaned) continue;

          try {
            const parsed = JSON.parse(cleaned);
            const chunk = parsed.response;
            if (chunk) {
              onChunk(chunk);
              fullContent += chunk;
            }
          } catch (e) {
          }
        }
      }
      return fullContent;
    } catch (err) {
      logger.error('Ollama streaming failed.', { error: err.message });
      throw err;
    }
  }

  async countTokens(text) {
    return Math.ceil(text.length / 4);
  }

  async estimateCost(tokensCount) {
    return 0.00;
  }
}

module.exports = OllamaAdapter;

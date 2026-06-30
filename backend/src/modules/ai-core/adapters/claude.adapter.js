const ProviderAdapter = require('./provider.adapter');
const logger = require('../utils/logger');

class ClaudeAdapter extends ProviderAdapter {
  constructor(config) {
    super(config);
    this.apiKey = config.apiKey || process.env.CLAUDE_API_KEY;
    this.model = config.model || 'claude-3-5-sonnet-20260620';
    this.temperature = config.temperature ?? 0.2;
    this.maxTokens = config.maxTokens ?? 2048;
  }

  async generate(systemPrompt, userPrompt, schema = null) {
    if (!this.apiKey) {
      throw new Error('Claude API Key is not configured. Set CLAUDE_API_KEY environment variable.');
    }

    const url = 'https://api.anthropic.com/v1/messages';
    const body = {
      model: this.model,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    };

    try {
      logger.info(`Sending generation request to Claude model: ${this.model}`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Claude API responded with status ${response.status}: ${errorText}`);
      }

      const resJson = await response.json();
      const contentText = resJson.content?.[0]?.text;
      
      if (!contentText) {
        throw new Error('Invalid empty content returned from Claude API.');
      }

      return contentText.trim();
    } catch (err) {
      logger.error('Claude API execution failed.', { error: err.message });
      throw err;
    }
  }

  async stream(systemPrompt, userPrompt, onChunk) {
    if (!this.apiKey) {
      throw new Error('Claude API Key is not configured. Set CLAUDE_API_KEY environment variable.');
    }

    const url = 'https://api.anthropic.com/v1/messages';
    const body = {
      model: this.model,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      stream: true
    };

    try {
      logger.info(`Sending streaming request to Claude model: ${this.model}`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Claude Stream API responded with status ${response.status}: ${errorText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const matches = [...buffer.matchAll(/"text"\s*:\s*"(.*?)"/g)];
        for (const match of matches) {
          const textVal = match[1];
          const unescaped = textVal.replace(/\\n/g, '\n').replace(/\\"/g, '"');
          if (!fullContent.includes(unescaped)) {
            onChunk(unescaped);
            fullContent += unescaped;
          }
        }
      }
      return fullContent;
    } catch (err) {
      logger.error('Claude streaming failed.', { error: err.message });
      throw err;
    }
  }

  async countTokens(text) {
    return Math.ceil(text.length / 4);
  }

  async estimateCost(tokensCount) {
    const inputCost = (tokensCount.input || 0) * (3.00 / 1000000);
    const outputCost = (tokensCount.output || 0) * (15.00 / 1000000);
    return Number((inputCost + outputCost).toFixed(6));
  }
}

module.exports = ClaudeAdapter;

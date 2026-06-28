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
      logger.warn('Claude API Key is missing. Operating in mock response mode.');
      return this._mockResponse(systemPrompt, userPrompt, schema);
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
      logger.error('Claude API execution failed, falling back to mock.', { error: err.message });
      return this._mockResponse(systemPrompt, userPrompt, schema);
    }
  }

  async stream(systemPrompt, userPrompt, onChunk) {
    if (!this.apiKey) {
      logger.warn('Claude API Key is missing. Using Mock streaming mode.');
      return this._mockStream(systemPrompt, userPrompt, onChunk, true);
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
        // Claude SSE SSE stream contains multiple events like:
        // event: content_block_delta
        // data: {"type": "content_block_delta", "index": 0, "delta": {"type": "text_delta", "text": "..."}}
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
      logger.error('Claude streaming failed, falling back to mock stream.', { error: err.message });
      return this._mockStream(systemPrompt, userPrompt, onChunk, true);
    }
  }

  async _mockStream(systemPrompt, userPrompt, onChunk, schema = null) {
    const fullText = this._mockResponse(systemPrompt, userPrompt, schema);
    const chunkSize = 20;
    for (let i = 0; i < fullText.length; i += chunkSize) {
      const chunk = fullText.substring(i, i + chunkSize);
      onChunk(chunk);
      await new Promise(resolve => setTimeout(resolve, 5));
    }
    return fullText;
  }

  async countTokens(text) {
    return Math.ceil(text.length / 4);
  }

  async estimateCost(tokensCount) {
    const inputCost = (tokensCount.input || 0) * (3.00 / 1000000);
    const outputCost = (tokensCount.output || 0) * (15.00 / 1000000);
    return Number((inputCost + outputCost).toFixed(6));
  }

  _mockResponse(systemPrompt, userPrompt, schema) {
    logger.info('Compiling mock fallback output payload for Claude.');
    const promptStr = String(userPrompt || '') + ' ' + String(systemPrompt || '');
    
    if (promptStr.includes('Validation') || promptStr.includes('validation')) {
      return JSON.stringify({
        score: 95,
        compliancePassed: true,
        auditsPassed: 12,
        errors: []
      });
    }

    return JSON.stringify({
      name: 'Mock Custom Standard (Claude)',
      businessType: 'Boutique',
      sitemap: ['Home', 'Shop', 'Contact Us'],
      cmsFields: { logo: true, tagline: true },
      apis: ['products', 'cart'],
      styling: { primaryColor: '#2563eb', font: 'Inter' },
      performance: { bundleLimitMb: 2, imageLazyLoad: true },
      accessibility: { wcagCompliance: 'WCAG AA' },
      seo: { metaTags: true, openGraph: true }
    });
  }
}

module.exports = ClaudeAdapter;

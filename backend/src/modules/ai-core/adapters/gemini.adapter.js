const ProviderAdapter = require('./provider.adapter');
const logger = require('../utils/logger');

class GeminiAdapter extends ProviderAdapter {
  constructor(config) {
    super(config);
    this.apiKey = config.apiKey;
    this.model = config.model || 'gemini-1.5-pro';
    this.temperature = config.temperature ?? 0.2;
    this.maxTokens = config.maxTokens ?? 2048;
  }

  async generate(systemPrompt, userPrompt, schema = null) {
    if (!this.apiKey) {
      throw new Error('Gemini API Key is not configured. Set GEMINI_API_KEY environment variable.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    
    const body = {
      contents: [{ parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        temperature: this.temperature,
        maxOutputTokens: this.maxTokens
      }
    };

    if (schema) {
      body.generationConfig.responseMimeType = 'application/json';
      body.generationConfig.responseSchema = schema;
    }

    try {
      logger.info(`Sending generation request to Gemini model: ${this.model}`);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API responded with status ${response.status}: ${errorText}`);
      }

      const resJson = await response.json();
      const contentText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!contentText) {
        throw new Error('Invalid empty content returned from Gemini API.');
      }

      let cleanedText = contentText.trim();
      if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '');
      }

      return cleanedText.trim();
    } catch (err) {
      logger.error('Gemini API execution failed.', { error: err.message });
      throw err;
    }
  }

  async stream(systemPrompt, userPrompt, onChunk) {
    if (!this.apiKey) {
      throw new Error('Gemini API Key is not configured. Set GEMINI_API_KEY environment variable.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:streamGenerateContent?key=${this.apiKey}`;
    const body = {
      contents: [{ parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        temperature: this.temperature,
        maxOutputTokens: this.maxTokens
      }
    };

    try {
      logger.info(`Sending streaming request to Gemini model: ${this.model}`);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini Stream API responded with status ${response.status}: ${errorText}`);
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
      logger.error('Gemini streaming failed.', { error: err.message });
      throw err;
    }
  }

  async countTokens(text) {
    if (!this.apiKey) {
      return Math.ceil(text.length / 4);
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:countTokens?key=${this.apiKey}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text }] }]
        })
      });

      if (!response.ok) return Math.ceil(text.length / 4);

      const resJson = await response.json();
      return resJson.totalTokens || Math.ceil(text.length / 4);
    } catch (err) {
      return Math.ceil(text.length / 4);
    }
  }

  async estimateCost(tokensCount) {
    const inputRate = 0.075 / 1000000;
    const outputRate = 0.225 / 1000000;

    const inputCost = (tokensCount.input || 0) * inputRate;
    const outputCost = (tokensCount.output || 0) * outputRate;

    return Number((inputCost + outputCost).toFixed(6));
  }
}

module.exports = GeminiAdapter;

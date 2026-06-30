const ProviderAdapter = require('./provider.adapter');
const logger = require('../utils/logger');

class OpenAIAdapter extends ProviderAdapter {
  constructor(config) {
    super(config);
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    this.model = config.model || 'gpt-4o';
    this.temperature = config.temperature ?? 0.2;
    this.maxTokens = config.maxTokens ?? 2048;
  }

  async generate(systemPrompt, userPrompt, schema = null) {
    if (!this.apiKey) {
      throw new Error('OpenAI API Key is not configured. Set OPENAI_API_KEY environment variable.');
    }

    const url = 'https://api.openai.com/v1/chat/completions';
    const body = {
      model: this.model,
      temperature: this.temperature,
      max_tokens: this.maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    };

    if (schema) {
      body.response_format = {
        type: 'json_object'
      };
    }

    try {
      logger.info(`Sending generation request to OpenAI model: ${this.model}`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API responded with status ${response.status}: ${errorText}`);
      }

      const resJson = await response.json();
      const contentText = resJson.choices?.[0]?.message?.content;
      
      if (!contentText) {
        throw new Error('Invalid empty content returned from OpenAI API.');
      }

      return contentText.trim();
    } catch (err) {
      logger.error('OpenAI API execution failed.', { error: err.message });
      throw err;
    }
  }

  async stream(systemPrompt, userPrompt, onChunk) {
    if (!this.apiKey) {
      throw new Error('OpenAI API Key is not configured. Set OPENAI_API_KEY environment variable.');
    }

    const url = 'https://api.openai.com/v1/chat/completions';
    const body = {
      model: this.model,
      temperature: this.temperature,
      max_tokens: this.maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      stream: true
    };

    try {
      logger.info(`Sending streaming request to OpenAI model: ${this.model}`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI Stream API responded with status ${response.status}: ${errorText}`);
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
          if (!cleaned.startsWith('data:')) continue;
          if (cleaned.includes('[DONE]')) continue;

          try {
            const jsonText = cleaned.substring(5).trim();
            const parsed = JSON.parse(jsonText);
            const chunk = parsed.choices?.[0]?.delta?.content;
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
      logger.error('OpenAI streaming failed.', { error: err.message });
      throw err;
    }
  }

  async countTokens(text) {
    return Math.ceil(text.length / 4);
  }

  async estimateCost(tokensCount) {
    const inputCost = (tokensCount.input || 0) * (5.00 / 1000000);
    const outputCost = (tokensCount.output || 0) * (15.00 / 1000000);
    return Number((inputCost + outputCost).toFixed(6));
  }
}

module.exports = OpenAIAdapter;

// AI Orchestrator Configuration Manager
require('dotenv').config();

module.exports = {
  provider: process.env.AI_PROVIDER || 'gemini',
  
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
    temperature: parseFloat(process.env.GEMINI_TEMP || '0.2'),
    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '2048', 10)
  },
  
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    temperature: 0.2,
    maxTokens: 2048
  },

  claude: {
    apiKey: process.env.CLAUDE_API_KEY || '',
    model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20260620',
    temperature: parseFloat(process.env.CLAUDE_TEMP || '0.2'),
    maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS || '2048', 10)
  },
  
  costs: {
    gemini: {
      inputPerMillion: 0.075, // $0.075 per 1M input tokens
      outputPerMillion: 0.225 // $0.225 per 1M output tokens
    },
    openai: {
      inputPerMillion: 5.00,
      outputPerMillion: 15.00
    }
  },
  
  retry: {
    maxRetries: 3,
    backoffMs: 1000
  },
  
  cache: {
    ttl: 86400, // 24 Hours in seconds
    enabled: true
  },
  
  security: {
    redactPii: true,
    sanitizeInput: true
  }
};

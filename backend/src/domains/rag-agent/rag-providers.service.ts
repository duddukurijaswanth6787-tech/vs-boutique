import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  LlmProvider,
  EmbeddingProvider,
  LlmMessage,
  LlmChatOptions,
  LlmResponse,
} from './rag-agent.types';
import { BusinessException, ExternalApiException } from '@common/exceptions';

@Injectable()
export class GeminiLlmProvider implements LlmProvider {
  private readonly apiKey: string;
  private readonly apiBase: string;
  private readonly logger = new Logger('GeminiLlmProvider');

  constructor(private readonly configService: ConfigService) {
    this.apiKey =
      this.configService.get<string>('app.gemini.apiKey', '') ||
      process.env.GEMINI_API_KEY ||
      '';
    this.apiBase = 'https://generativelanguage.googleapis.com/v1beta';
  }

  getProviderName(): string {
    return 'gemini';
  }

  async healthCheck(): Promise<boolean> {
    return (
      !!this.apiKey &&
      this.apiKey !== 'mock_key' &&
      this.apiKey !== 'mock_secret'
    );
  }

  async chat(
    messages: LlmMessage[],
    options: LlmChatOptions,
  ): Promise<LlmResponse> {
    if (
      !this.apiKey ||
      this.apiKey === 'mock_key' ||
      this.apiKey === 'mock_secret'
    ) {
      throw new BusinessException(
        'RAG LLM provider "gemini" is unconfigured. Please configure GEMINI_API_KEY.',
        'RAG_PROVIDER_UNCONFIGURED',
      );
    }

    let model =
      options.model ||
      this.configService.get<string>('app.gemini.llmModel') ||
      process.env.GEMINI_LLM_MODEL ||
      'gemini-2.5-flash';

    if (model === 'gemini-1.5-flash') {
      model = 'gemini-2.5-flash';
    }

    try {
      const url = `${this.apiBase}/models/${model}:generateContent?key=${this.apiKey}`;

      // Gemini requires contents roles to alternate (user, model, user, model...).
      // We will filter out system messages and merge any consecutive messages with the same role.
      const contents: any[] = [];
      for (const m of messages) {
        if (m.role === 'system') continue;
        const role = m.role === 'assistant' ? 'model' : 'user';
        if (
          contents.length > 0 &&
          contents[contents.length - 1].role === role
        ) {
          contents[contents.length - 1].parts[0].text += '\n' + m.content;
        } else {
          contents.push({
            role,
            parts: [{ text: m.content }],
          });
        }
      }

      const systemMsg = messages.find((m) => m.role === 'system');
      const body: any = {
        contents,
        generationConfig: {
          temperature: Number(options.temperature),
          maxOutputTokens: options.maxTokens,
        },
      };

      if (systemMsg || options.systemPrompt) {
        body.systemInstruction = {
          parts: [{ text: systemMsg?.content || options.systemPrompt }],
        };
      }

      const timeoutMs = Number(
        this.configService.get<number>('app.rag.requestTimeoutMs') ||
          process.env.RAG_REQUEST_TIMEOUT_MS ||
          30000,
      );
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new ExternalApiException(
            `Gemini API Error: ${res.status} - ${errorText}`,
            'RAG_GENERATION_FAILED',
            res.status,
          );
        }

        const data = await res.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        const promptTokens = data.usageMetadata?.promptTokenCount || 0;
        const completionTokens = data.usageMetadata?.candidatesTokenCount || 0;

        return {
          content,
          promptTokens,
          completionTokens,
        };
      } catch (err: any) {
        if (err.name === 'AbortError') {
          throw new BusinessException(
            'RAG LLM request timed out.',
            'RAG_PROVIDER_TIMEOUT',
          );
        }
        throw err;
      } finally {
        clearTimeout(id);
      }
    } catch (err: any) {
      if (err instanceof BaseException) {
        throw err;
      }
      this.logger.error(`Gemini request failed: ${err.message}`);
      throw new BusinessException(
        `Gemini LLM request failed: ${err.message}`,
        'RAG_GENERATION_FAILED',
      );
    }
  }
}

import { BaseException } from '@common/exceptions';

@Injectable()
export class OpenAiLlmProvider implements LlmProvider {
  private readonly apiKey: string;
  private readonly logger = new Logger('OpenAiLlmProvider');

  constructor(private readonly configService: ConfigService) {
    this.apiKey =
      this.configService.get<string>('app.openai.apiKey', '') ||
      process.env.OPENAI_API_KEY ||
      '';
  }

  getProviderName(): string {
    return 'openai';
  }

  async healthCheck(): Promise<boolean> {
    return (
      !!this.apiKey &&
      this.apiKey !== 'mock_key' &&
      this.apiKey !== 'mock_secret'
    );
  }

  async chat(
    messages: LlmMessage[],
    options: LlmChatOptions,
  ): Promise<LlmResponse> {
    if (
      !this.apiKey ||
      this.apiKey === 'mock_key' ||
      this.apiKey === 'mock_secret'
    ) {
      throw new BusinessException(
        'RAG LLM provider "openai" is unconfigured. Please configure OPENAI_API_KEY.',
        'RAG_PROVIDER_UNCONFIGURED',
      );
    }

    const model =
      options.model ||
      this.configService.get<string>('app.openai.llmModel') ||
      process.env.OPENAI_LLM_MODEL ||
      'gpt-4o-mini';

    try {
      const url = 'https://api.openai.com/v1/chat/completions';

      const payload: any = {
        model,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        temperature: Number(options.temperature),
        max_tokens: options.maxTokens,
      };

      const timeoutMs = Number(
        this.configService.get<number>('app.rag.requestTimeoutMs') ||
          process.env.RAG_REQUEST_TIMEOUT_MS ||
          30000,
      );
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new ExternalApiException(
            `OpenAI API Error: ${res.status} - ${errorText}`,
            'RAG_GENERATION_FAILED',
            res.status,
          );
        }

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || '';

        return {
          content,
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
        };
      } catch (err: any) {
        if (err.name === 'AbortError') {
          throw new BusinessException(
            'RAG LLM request timed out.',
            'RAG_PROVIDER_TIMEOUT',
          );
        }
        throw err;
      } finally {
        clearTimeout(id);
      }
    } catch (err: any) {
      if (err instanceof BaseException) {
        throw err;
      }
      this.logger.error(`OpenAI request failed: ${err.message}`);
      throw new BusinessException(
        `OpenAI LLM request failed: ${err.message}`,
        'RAG_GENERATION_FAILED',
      );
    }
  }
}

@Injectable()
export class GeminiEmbeddingProvider implements EmbeddingProvider {
  private readonly apiKey: string;
  private readonly logger = new Logger('GeminiEmbeddingProvider');
  readonly dimensions = 3072; // gemini-embedding-2

  constructor(private readonly configService: ConfigService) {
    this.apiKey =
      this.configService.get<string>('app.gemini.apiKey', '') ||
      process.env.GEMINI_API_KEY ||
      '';
  }

  getProviderName(): string {
    return 'gemini';
  }

  async healthCheck(): Promise<boolean> {
    return (
      !!this.apiKey &&
      this.apiKey !== 'mock_key' &&
      this.apiKey !== 'mock_secret'
    );
  }

  async embed(text: string, model?: string): Promise<number[]> {
    const vectors = await this.embedBatch([text], model);
    return vectors[0];
  }

  async embedBatch(texts: string[], model?: string): Promise<number[][]> {
    if (
      !this.apiKey ||
      this.apiKey === 'mock_key' ||
      this.apiKey === 'mock_secret'
    ) {
      throw new BusinessException(
        'RAG Embedding provider "gemini" is unconfigured. Please configure GEMINI_API_KEY.',
        'RAG_PROVIDER_UNCONFIGURED',
      );
    }

    const isLlmModel =
      model &&
      (model.includes('flash') ||
        model.includes('pro') ||
        model.includes('gpt') ||
        model.includes('claude'));
    const resolvedModel = model && !isLlmModel ? model : undefined;

    let embedModel =
      resolvedModel ||
      this.configService.get<string>('app.gemini.embeddingModel') ||
      process.env.GEMINI_EMBEDDING_MODEL ||
      'gemini-embedding-2';

    if (embedModel === 'text-embedding-004') {
      embedModel = 'gemini-embedding-2';
    }

    try {
      const formattedModel = embedModel.startsWith('models/')
        ? embedModel
        : `models/${embedModel}`;
      const url = `https://generativelanguage.googleapis.com/v1beta/${formattedModel}:batchEmbedContents?key=${this.apiKey}`;

      const requests = texts.map((text) => ({
        model: formattedModel,
        content: { parts: [{ text }] },
      }));

      const timeoutMs = Number(
        this.configService.get<number>('app.rag.requestTimeoutMs') ||
          process.env.RAG_REQUEST_TIMEOUT_MS ||
          30000,
      );
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requests }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new ExternalApiException(
            `Gemini API Error: ${res.status} - ${errorText}`,
            'RAG_EMBEDDING_FAILED',
            res.status,
          );
        }

        const data = await res.json();
        const embeddingsList = data.embeddings;

        if (!embeddingsList || !Array.isArray(embeddingsList)) {
          throw new BusinessException(
            'Failed to retrieve embeddings from Gemini batch API.',
            'RAG_EMBEDDING_FAILED',
          );
        }

        const results: number[][] = [];
        for (const item of embeddingsList) {
          const values = item.values;
          if (!values || !Array.isArray(values)) {
            throw new BusinessException(
              'Invalid embedding format returned from Gemini API.',
              'RAG_EMBEDDING_FAILED',
            );
          }
          if (values.length !== this.dimensions) {
            throw new BusinessException(
              `Embedding dimension mismatch. Expected ${this.dimensions}, got ${values.length}.`,
              'RAG_EMBEDDING_DIMENSION_MISMATCH',
            );
          }
          results.push(values);
        }

        return results;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          throw new BusinessException(
            'RAG Embedding request timed out.',
            'RAG_PROVIDER_TIMEOUT',
          );
        }
        throw err;
      } finally {
        clearTimeout(id);
      }
    } catch (err: any) {
      if (err instanceof BaseException) {
        throw err;
      }
      this.logger.error(`Gemini embedding failed: ${err.message}`);
      throw new BusinessException(
        `Gemini Embedding generation failed: ${err.message}`,
        'RAG_EMBEDDING_FAILED',
      );
    }
  }
}

@Injectable()
export class OpenAiEmbeddingProvider implements EmbeddingProvider {
  private readonly apiKey: string;
  private readonly logger = new Logger('OpenAiEmbeddingProvider');
  readonly dimensions = 1536; // text-embedding-3-small

  constructor(private readonly configService: ConfigService) {
    this.apiKey =
      this.configService.get<string>('app.openai.apiKey', '') ||
      process.env.OPENAI_API_KEY ||
      '';
  }

  getProviderName(): string {
    return 'openai';
  }

  async healthCheck(): Promise<boolean> {
    return (
      !!this.apiKey &&
      this.apiKey !== 'mock_key' &&
      this.apiKey !== 'mock_secret'
    );
  }

  async embed(text: string, model?: string): Promise<number[]> {
    const vectors = await this.embedBatch([text], model);
    return vectors[0];
  }

  async embedBatch(texts: string[], model?: string): Promise<number[][]> {
    if (
      !this.apiKey ||
      this.apiKey === 'mock_key' ||
      this.apiKey === 'mock_secret'
    ) {
      throw new BusinessException(
        'RAG Embedding provider "openai" is unconfigured. Please configure OPENAI_API_KEY.',
        'RAG_PROVIDER_UNCONFIGURED',
      );
    }

    const isLlmModel =
      model &&
      (model.includes('gpt') ||
        model.includes('flash') ||
        model.includes('pro') ||
        model.includes('claude'));
    const resolvedModel = model && !isLlmModel ? model : undefined;

    const embedModel =
      resolvedModel ||
      this.configService.get<string>('app.openai.embeddingModel') ||
      process.env.OPENAI_EMBEDDING_MODEL ||
      'text-embedding-3-small';

    try {
      const url = 'https://api.openai.com/v1/embeddings';

      const timeoutMs = Number(
        this.configService.get<number>('app.rag.requestTimeoutMs') ||
          process.env.RAG_REQUEST_TIMEOUT_MS ||
          30000,
      );
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            input: texts,
            model: embedModel,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new ExternalApiException(
            `OpenAI API Error: ${res.status} - ${errorText}`,
            'RAG_EMBEDDING_FAILED',
            res.status,
          );
        }

        const data = await res.json();
        if (!data.data || !Array.isArray(data.data)) {
          throw new BusinessException(
            'Failed to retrieve embeddings from OpenAI API.',
            'RAG_EMBEDDING_FAILED',
          );
        }

        const results = data.data.map((item: any) => item.embedding);
        for (const embedding of results) {
          if (embedding.length !== this.dimensions) {
            throw new BusinessException(
              `Embedding dimension mismatch. Expected ${this.dimensions}, got ${embedding.length}.`,
              'RAG_EMBEDDING_DIMENSION_MISMATCH',
            );
          }
        }

        return results;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          throw new BusinessException(
            'RAG Embedding request timed out.',
            'RAG_PROVIDER_TIMEOUT',
          );
        }
        throw err;
      } finally {
        clearTimeout(id);
      }
    } catch (err: any) {
      if (err instanceof BaseException) {
        throw err;
      }
      this.logger.error(`OpenAI embedding failed: ${err.message}`);
      throw new BusinessException(
        `OpenAI Embedding generation failed: ${err.message}`,
        'RAG_EMBEDDING_FAILED',
      );
    }
  }
}

@Injectable()
export class LlmProviderRegistry {
  private readonly providers = new Map<string, LlmProvider>();

  constructor(gemini: GeminiLlmProvider, openai: OpenAiLlmProvider) {
    this.providers.set(gemini.getProviderName(), gemini);
    this.providers.set(openai.getProviderName(), openai);
  }

  getProvider(name: string): LlmProvider {
    const provider = this.providers.get(name.toLowerCase());
    if (!provider) {
      throw new BusinessException(
        `LLM provider "${name}" is unknown or unsupported.`,
        'RAG_PROVIDER_UNKNOWN',
      );
    }
    return provider;
  }
}

@Injectable()
export class EmbeddingProviderRegistry {
  private readonly providers = new Map<string, EmbeddingProvider>();

  constructor(
    gemini: GeminiEmbeddingProvider,
    openai: OpenAiEmbeddingProvider,
  ) {
    this.providers.set(gemini.getProviderName(), gemini);
    this.providers.set(openai.getProviderName(), openai);
  }

  getProvider(name: string): EmbeddingProvider {
    const provider = this.providers.get(name.toLowerCase());
    if (!provider) {
      throw new BusinessException(
        `Embedding provider "${name}" is unknown or unsupported.`,
        'RAG_PROVIDER_UNKNOWN',
      );
    }
    return provider;
  }
}

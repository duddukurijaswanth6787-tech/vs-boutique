import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  EmbeddingProvider,
  EmbeddingResult,
} from './embedding-provider.interface';

@Injectable()
export class GeminiEmbeddingProvider implements EmbeddingProvider {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly dimension: number;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly retryDelay: number;

  constructor(configService: ConfigService) {
    this.apiKey = configService.get<string>('app.RAG_GEMINI_API_KEY', '')!;
    this.model = configService.get<string>(
      'app.RAG_GEMINI_EMBEDDING_MODEL',
      'text-embedding-004',
    )!;
    this.dimension = configService.get<number>(
      'app.RAG_EMBEDDING_DIMENSION',
      768,
    )!;
    this.timeout = configService.get<number>(
      'app.RAG_EMBEDDING_TIMEOUT',
      30000,
    )!;
    this.maxRetries = configService.get<number>(
      'app.RAG_EMBEDDING_MAX_RETRIES',
      3,
    )!;
    this.retryDelay = configService.get<number>(
      'app.RAG_EMBEDDING_RETRY_DELAY',
      1000,
    )!;
  }

  getModel(): string {
    return this.model;
  }
  getDimension(): number {
    return this.dimension;
  }

  async health(): Promise<{ ok: boolean; message: string }> {
    if (!this.apiKey)
      return { ok: false, message: 'GEMINI_API_KEY not configured' };
    return {
      ok: true,
      message: `model=${this.model}, dimension=${this.dimension}`,
    };
  }

  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    const start = Date.now();
    const data = await this.request('/models/' + this.model + ':embedContent', {
      content: { parts: [{ text }] },
    });
    const vector = data.embedding.values as number[];
    return {
      vector,
      model: this.model,
      dimension: this.dimension,
      provider: 'gemini',
      processingTimeMs: Date.now() - start,
    };
  }

  async generateBatch(texts: string[]): Promise<EmbeddingResult[]> {
    // ponytail: Gemini batch API uses multiple requests in a single call
    const start = Date.now();
    const data = await this.request(
      '/models/' + this.model + ':batchEmbedContents',
      {
        requests: texts.map((text) => ({ content: { parts: [{ text }] } })),
      },
    );
    return data.embeddings.map((e: { values: number[] }) => ({
      vector: e.values,
      model: this.model,
      dimension: this.dimension,
      provider: 'gemini',
      processingTimeMs: Date.now() - start,
    }));
  }

  private async request(path: string, body: unknown): Promise<any> {
    const url = `https://generativelanguage.googleapis.com/v1beta${path}?key=${this.apiKey}`;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeout);

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        clearTimeout(timer);

        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          throw new Error(`Gemini API ${res.status}: ${errText}`);
        }

        return res.json();
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < this.maxRetries) {
          await new Promise((r) =>
            setTimeout(r, this.retryDelay * Math.pow(2, attempt)),
          );
        }
      }
    }

    throw lastError ?? new Error('Embedding request failed');
  }
}

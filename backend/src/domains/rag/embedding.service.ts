import { Injectable, BadRequestException } from '@nestjs/common';
import { RagRepository } from './rag.repository';
import { GeminiEmbeddingProvider } from './gemini-embedding.provider';
import type {
  EmbeddingProvider,
  EmbeddingResult,
} from './embedding-provider.interface';

@Injectable()
export class EmbeddingService {
  private readonly batchSize: number;

  constructor(
    private readonly geminiProvider: GeminiEmbeddingProvider,
    private readonly ragRepository: RagRepository,
  ) {
    this.batchSize = 10;
  }

  private getProvider(): EmbeddingProvider {
    // ponytail: only Gemini provider implemented. OpenAI added when config specifies 'openai'.
    return this.geminiProvider;
  }

  async generateEmbedding(
    text: string,
    _model?: string,
  ): Promise<EmbeddingResult> {
    this.validateText(text);
    const provider = this.getProvider();
    const result = await provider.generateEmbedding(text);
    this.validateVector(result.vector, result.dimension);
    return result;
  }

  async generateBatch(
    texts: string[],
    _model?: string,
  ): Promise<EmbeddingResult[]> {
    if (texts.length === 0) throw new BadRequestException('Empty batch');
    if (texts.length > 100)
      throw new BadRequestException('Batch exceeds max size of 100');
    texts.forEach((t) => this.validateText(t));

    const provider = this.getProvider();
    const results: EmbeddingResult[] = [];

    // ponytail: split into configured batch size to avoid overwhelming the API
    for (let i = 0; i < texts.length; i += this.batchSize) {
      const batch = texts.slice(i, i + this.batchSize);
      const batchResults = await provider.generateBatch(batch);
      for (const r of batchResults) {
        this.validateVector(r.vector, r.dimension);
      }
      results.push(...batchResults);
    }

    return results;
  }

  async storeEmbedding(
    chunkId: string,
    result: EmbeddingResult,
  ): Promise<void> {
    await this.ragRepository.insertVector(
      chunkId,
      result.vector,
      result.dimension,
      result.model,
      1,
    );
  }

  async generateAndStore(
    text: string,
    chunkId: string,
  ): Promise<EmbeddingResult> {
    const result = await this.generateEmbedding(text);
    await this.storeEmbedding(chunkId, result);
    return result;
  }

  async getProviderInfo(): Promise<
    {
      name: string;
      model: string;
      dimension: number;
      ok: boolean;
      message: string;
    }[]
  > {
    const provider = this.getProvider();
    const health = await provider.health();
    return [
      {
        name: 'gemini',
        model: provider.getModel(),
        dimension: provider.getDimension(),
        ok: health.ok,
        message: health.message,
      },
    ];
  }

  async healthCheck(): Promise<{
    ok: boolean;
    providers: {
      name: string;
      ok: boolean;
      model: string;
      dimension: number;
      message: string;
    }[];
  }> {
    const providers = await this.getProviderInfo();
    return { ok: providers.every((p) => p.ok), providers };
  }

  private validateText(text: string): void {
    if (!text || text.trim().length === 0)
      throw new BadRequestException('Text cannot be empty');
    if (text.length > 10000)
      throw new BadRequestException(
        'Text exceeds maximum length of 10000 characters',
      );
  }

  private validateVector(vector: number[], expectedDimension: number): void {
    if (!vector || vector.length === 0)
      throw new BadRequestException('Empty vector from provider');
    if (vector.length !== expectedDimension)
      throw new BadRequestException(
        `Dimension mismatch: expected ${expectedDimension}, got ${vector.length}`,
      );
    for (const v of vector) {
      if (typeof v !== 'number' || !Number.isFinite(v))
        throw new BadRequestException('Vector contains NaN or Infinity');
    }
  }
}

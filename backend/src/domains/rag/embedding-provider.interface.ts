export interface EmbeddingResult {
  vector: number[];
  model: string;
  dimension: number;
  provider: string;
  processingTimeMs: number;
}

export interface EmbeddingProvider {
  generateEmbedding(text: string): Promise<EmbeddingResult>;
  generateBatch(texts: string[]): Promise<EmbeddingResult[]>;
  getModel(): string;
  getDimension(): number;
  health(): Promise<{ ok: boolean; message: string }>;
}

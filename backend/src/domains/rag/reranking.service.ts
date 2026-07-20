import { Injectable } from '@nestjs/common';
import type { RetrievedChunkDto } from './retrieval.types';

// ponytail: reranking interface — local fallback only for now.
// Add Gemini/OpenAI/Cohere providers when API keys are available.
// The local scorer uses keyword overlap (cheap, no network) as a first-pass reranker.

@Injectable()
export class RerankingService {
  /**
   * Rerank chunks by keyword overlap with the original query.
   * ponytail: simple term-frequency overlap — upgrade to cross-encoder when a reranking API is configured.
   */
  rerank(query: string, chunks: RetrievedChunkDto[]): RetrievedChunkDto[] {
    if (!chunks.length) return chunks;
    const queryTerms = this.tokenize(query);
    if (!queryTerms.size) return chunks;

    const scored = chunks.map((chunk) => {
      const chunkTerms = this.tokenize(chunk.content);
      let overlap = 0;
      for (const term of queryTerms) {
        if (chunkTerms.has(term)) overlap++;
      }
      // Blend: 70% original vector/keyword score + 30% keyword overlap
      const rerankScore = overlap / queryTerms.size;
      return { ...chunk, score: chunk.score * 0.7 + rerankScore * 0.3 };
    });

    return scored.sort((a, b) => b.score - a.score);
  }

  private tokenize(text: string): Set<string> {
    return new Set(
      text
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 2),
    );
  }
}

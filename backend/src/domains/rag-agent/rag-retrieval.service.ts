import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';
import { RetrievalResult } from './rag-agent.types';

@Injectable()
export class RagRetrievalService {
  constructor(private readonly prisma: PrismaService) {}

  async retrieve(params: {
    agentId: string;
    query: string;
    queryEmbedding: number[];
    limit?: number;
    minScore?: number;
  }): Promise<RetrievalResult[]> {
    const {
      agentId,
      query,
      queryEmbedding,
      limit = 8,
      minScore = 0.65,
    } = params;

    // Get active and assigned knowledge sources for the agent
    const assignedSources = await this.prisma.ragAgentKnowledgeSource.findMany({
      where: { agentId },
      include: {
        knowledgeSource: true,
      },
    });

    const activeSourceIds = assignedSources
      .filter(
        (as) =>
          as.knowledgeSource.status === 'INDEXED' &&
          !as.knowledgeSource.deletedAt,
      )
      .map((as) => as.knowledgeSourceId);

    if (activeSourceIds.length === 0) {
      return [];
    }

    // Convert query embedding to PostgreSQL array syntax: '{0.123, 0.456, ...}'
    const pgVectorString = `{${queryEmbedding.join(',')}}`;

    // Execute raw SQL dot product calculation for cosine similarity
    // ponytail: dot product sum(a * b) computes similarity since embeddings are normalized
    const rawChunks = await this.prisma.$queryRaw<any[]>`
      SELECT 
        c.id, 
        c."documentId", 
        c."knowledgeSourceId", 
        c.content, 
        c.metadata,
        (
          SELECT sum(a * b) 
          FROM unnest(c.embedding) WITH ORDINALITY AS x(a, i) 
          JOIN unnest(CAST(${pgVectorString} as double precision[])) WITH ORDINALITY AS y(b, j) ON i = j
        ) AS "vectorScore"
      FROM rag_document_chunks c
      WHERE c."knowledgeSourceId" IN (${Prisma.join(activeSourceIds)})
      ORDER BY "vectorScore" DESC
      LIMIT ${limit * 2}
    `;

    const results: RetrievalResult[] = [];

    for (const chunk of rawChunks) {
      const vScore = Number(chunk.vectorScore || 0);

      // Perform dynamic keyword match boost (ILIKE search)
      const queryTerms = query
        .toLowerCase()
        .split(/\s+/)
        .filter((t) => t.length > 2);
      let keywordCount = 0;
      const contentLower = chunk.content.toLowerCase();

      queryTerms.forEach((term) => {
        if (contentLower.includes(term)) {
          keywordCount++;
        }
      });

      const keywordScore =
        queryTerms.length > 0 ? keywordCount / queryTerms.length : 0;

      // Hybrid score: 80% vector + 20% keyword match boost
      const finalScore = vScore * 0.8 + keywordScore * 0.2;

      if (finalScore >= minScore) {
        results.push({
          chunkId: chunk.id,
          documentId: chunk.documentId,
          knowledgeSourceId: chunk.knowledgeSourceId,
          content: chunk.content,
          vectorScore: vScore,
          keywordScore,
          finalScore,
          metadata: chunk.metadata || {},
        });
      }
    }

    // Sort by hybrid score and take top-K
    results.sort((a, b) => b.finalScore - a.finalScore);

    // Deduplicate chunks to suppress redundant content from the same document range
    const seen = new Set<string>();
    return results
      .filter((r) => {
        const key = `${r.documentId}_${r.content.substring(0, 30)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, limit);
  }
}

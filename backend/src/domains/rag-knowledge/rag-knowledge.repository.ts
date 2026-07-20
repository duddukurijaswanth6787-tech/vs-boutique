import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class RagKnowledgeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { page: number; limit: number }) {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.ragKnowledgeSource.findMany({
        where: { deletedAt: null },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.ragKnowledgeSource.count({ where: { deletedAt: null } }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNext: page < Math.ceil(total / limit),
        hasPrevious: page > 1,
      },
    };
  }

  async findById(id: string) {
    return this.prisma.ragKnowledgeSource.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async create(data: Prisma.RagKnowledgeSourceCreateInput) {
    return this.prisma.ragKnowledgeSource.create({ data });
  }

  async update(id: string, data: Prisma.RagKnowledgeSourceUpdateInput) {
    return this.prisma.ragKnowledgeSource.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    return this.prisma.ragKnowledgeSource.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: string) {
    return this.prisma.ragKnowledgeSource.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  async deleteChunksBySourceId(knowledgeSourceId: string) {
    // ponytail: delete chunks and document entries atomically in transaction
    return this.prisma.$transaction(async (tx) => {
      await tx.ragDocumentChunk.deleteMany({
        where: { knowledgeSourceId },
      });
      await tx.ragDocument.deleteMany({
        where: { knowledgeSourceId },
      });
    });
  }

  async saveDocumentAndChunks(params: {
    knowledgeSourceId: string;
    title: string;
    contentHash: string;
    chunks: Array<{
      chunkIndex: number;
      content: string;
      tokenCount: number;
      embedding: number[];
      metadata: any;
    }>;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const doc = await tx.ragDocument.create({
        data: {
          knowledgeSourceId: params.knowledgeSourceId,
          title: params.title,
          contentHash: params.contentHash,
        },
      });

      await tx.ragDocumentChunk.createMany({
        data: params.chunks.map((c) => ({
          documentId: doc.id,
          knowledgeSourceId: params.knowledgeSourceId,
          chunkIndex: c.chunkIndex,
          content: c.content,
          tokenCount: c.tokenCount,
          embedding: c.embedding,
          metadata: c.metadata || {},
        })),
      });

      return doc;
    });
  }

  async findChunksBySourceId(
    knowledgeSourceId: string,
    params: { page: number; limit: number },
  ) {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.ragDocumentChunk.findMany({
        where: { knowledgeSourceId },
        skip,
        take: limit,
        orderBy: { chunkIndex: 'asc' },
      }),
      this.prisma.ragDocumentChunk.count({ where: { knowledgeSourceId } }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNext: page < Math.ceil(total / limit),
        hasPrevious: page > 1,
      },
    };
  }
}

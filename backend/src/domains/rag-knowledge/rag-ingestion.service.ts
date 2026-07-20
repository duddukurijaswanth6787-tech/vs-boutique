import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { RagKnowledgeRepository } from './rag-knowledge.repository';
import { EmbeddingProviderRegistry } from '../rag-agent/rag-providers.service';
import { ConfigService } from '@nestjs/config';
import { StorageService } from '@infrastructure/storage/storage.service';
import * as crypto from 'crypto';

@Injectable()
export class RagIngestionService {
  private readonly logger = new Logger('RagIngestionService');

  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: RagKnowledgeRepository,
    private readonly embeddingRegistry: EmbeddingProviderRegistry,
    private readonly configService: ConfigService,
    private readonly storageService: StorageService,
  ) {}

  async processIngestion(sourceId: string) {
    this.logger.log(`Starting ingestion processor for source: ${sourceId}`);

    // Mark processing
    await this.repository.update(sourceId, {
      status: 'PROCESSING',
      indexingError: null,
    });

    try {
      const source = await this.prisma.ragKnowledgeSource.findUnique({
        where: { id: sourceId },
      });

      if (!source || source.deletedAt) {
        throw new Error('Knowledge source not found or deleted');
      }

      let contentText = '';

      // 1. Extract content based on source type
      if (source.sourceType === 'TEXT') {
        contentText = source.rawText || '';
      } else if (source.sourceType === 'FAQ') {
        const faqs = await this.prisma.faq.findMany({
          where: { isActive: true },
        });
        contentText = faqs
          .map(
            (f) =>
              `Question: ${f.question}\nAnswer: ${f.answer}\nCategory: ${f.category || 'General'}`,
          )
          .join('\n\n');
      } else if (source.sourceType === 'CMS') {
        const pages = await this.prisma.cmsPage.findMany({
          where: { status: 'PUBLISHED', deletedAt: null },
        });
        contentText = pages
          .map(
            (p) =>
              `Title: ${p.title}\nSlug: ${p.slug}\nContent: ${p.content || ''}`,
          )
          .join('\n\n');
      } else if (source.sourceType === 'DOCUMENT') {
        if (!source.s3Key) {
          throw new Error('S3 Key is missing for document source');
        }

        if (source.mimeType !== 'text/plain') {
          throw new Error(
            `Unsupported document MIME type: ${source.mimeType}. Only text/plain is supported.`,
          );
        }

        const buffer = await this.storageService.get(source.s3Key);
        contentText = buffer.toString('utf-8');
      } else if (source.sourceType === 'URL') {
        if (!source.sourceUrl) {
          throw new Error('Source URL is missing');
        }
        // Fetch raw HTML/Text parsed from URL
        contentText = source.rawText || '';
        if (!contentText) {
          throw new Error('URL content has not been fetched or parsed.');
        }
      }

      if (!contentText.trim()) {
        throw new Error('Ingested content is empty');
      }

      // 2. Normalize Text
      const normalized = contentText
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]+/g, ' ')
        .trim();

      // 3. Compute Checksum to prevent redundant indexing
      const checksum = crypto
        .createHash('sha256')
        .update(normalized)
        .digest('hex');
      if (source.checksum === checksum && source.status === 'INDEXED') {
        this.logger.log(`Content checksum is identical. Skipping re-indexing.`);
        await this.repository.update(sourceId, {
          status: 'INDEXED',
          lastIndexedAt: new Date(),
        });
        return;
      }

      // 4. Chunk text (respecting paragraph boundaries)
      const chunkSize = Number(this.configService.get('RAG_CHUNK_SIZE') || 800);
      const overlap = Number(
        this.configService.get('RAG_CHUNK_OVERLAP') || 120,
      );

      const chunks = this.splitIntoChunks(normalized, chunkSize, overlap);

      if (chunks.length === 0) {
        throw new Error('No valid chunks generated');
      }

      // 5. Generate embeddings
      const embeddingProvider = this.embeddingRegistry.getProvider('gemini'); // Default gemini

      const chunkEmbeddings = await embeddingProvider.embedBatch(
        chunks.map((c) => c.text),
        'text-embedding-004',
      );

      // 6. Delete old chunks & save new chunks in single transaction
      await this.repository.deleteChunksBySourceId(sourceId);

      const chunkData = chunks.map((c, idx) => ({
        chunkIndex: idx,
        content: c.text,
        tokenCount: Math.round(c.text.length / 4), // Estimate tokens
        embedding: chunkEmbeddings[idx],
        metadata: { length: c.text.length, range: c.range },
      }));

      await this.repository.saveDocumentAndChunks({
        knowledgeSourceId: sourceId,
        title: source.name,
        contentHash: checksum,
        chunks: chunkData,
      });

      // 7. Update status INDEXED
      await this.repository.update(sourceId, {
        status: 'INDEXED',
        checksum,
        lastIndexedAt: new Date(),
      });

      this.logger.log(
        `Ingestion completed successfully for source ${sourceId}. Total chunks: ${chunks.length}`,
      );
    } catch (err: any) {
      this.logger.error(
        `Ingestion failed for source ${sourceId}: ${err.message}`,
      );
      await this.repository.update(sourceId, {
        status: 'FAILED',
        indexingError: err.message,
      });
    }
  }

  private splitIntoChunks(
    text: string,
    size: number,
    overlap: number,
  ): Array<{ text: string; range: string }> {
    const paragraphs = text.split('\n\n');
    const chunks: Array<{ text: string; range: string }> = [];

    let currentChunk = '';
    let startIdx = 0;

    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i];

      if ((currentChunk + '\n\n' + p).length <= size) {
        currentChunk = currentChunk ? currentChunk + '\n\n' + p : p;
      } else {
        if (currentChunk) {
          chunks.push({
            text: currentChunk,
            range: `${startIdx}-${startIdx + currentChunk.length}`,
          });
          startIdx += currentChunk.length - overlap;
        }

        // Handle single paragraph larger than max size
        if (p.length > size) {
          let cursor = 0;
          while (cursor < p.length) {
            const sub = p.substring(cursor, cursor + size);
            chunks.push({
              text: sub,
              range: `${startIdx + cursor}-${startIdx + cursor + sub.length}`,
            });
            cursor += size - overlap;
          }
          currentChunk = '';
        } else {
          currentChunk = p;
        }
      }
    }

    if (currentChunk) {
      chunks.push({
        text: currentChunk,
        range: `${startIdx}-${startIdx + currentChunk.length}`,
      });
    }

    return chunks;
  }
}

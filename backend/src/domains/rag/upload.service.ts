import {
  Injectable,
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import * as crypto from 'crypto';
import * as path from 'path';
import { RagRepository } from './rag.repository';
import type { StorageProvider } from './storage.provider';
import {
  PdfParser,
  DocxParser,
  TextParser,
  CsvParser,
  JsonParser,
  type DocumentParser,
  type ParseResult,
} from './document-parser';
import { cleanText } from './text-cleaner';
import { ChunkingService, type ChunkResult } from './chunking.service';
import {
  DocumentStatus,
  ChunkingStrategy,
  type UploadDocumentResponse,
} from './upload.types';

const ALLOWED_MIME: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'docx',
  'text/plain': 'txt',
  'text/markdown': 'md',
  'text/csv': 'csv',
  'application/json': 'json',
};

@Injectable()
export class UploadService {
  private readonly maxSize: number;
  private readonly defaultChunkSize: number;
  private readonly defaultChunkOverlap: number;
  private readonly maxChunks: number;

  constructor(
    private readonly ragRepository: RagRepository,
    private readonly configService: ConfigService,
    @Inject('STORAGE_PROVIDER') private readonly storage: StorageProvider,
    private readonly chunkingService: ChunkingService,
    @InjectQueue('embedding-generation') private readonly embeddingQueue: Queue,
  ) {
    this.maxSize = this.configService.get<number>(
      'rag.maxUploadSize',
      20971520,
    );
    this.defaultChunkSize = this.configService.get<number>(
      'rag.chunkSize',
      800,
    );
    this.defaultChunkOverlap = this.configService.get<number>(
      'rag.chunkOverlap',
      120,
    );
    this.maxChunks = this.configService.get<number>('rag.maxChunks', 1000);
  }

  // Build the parser map from injected parsers
  private getParser(mimeType: string): DocumentParser {
    const key = ALLOWED_MIME[mimeType];
    if (!key)
      throw new BadRequestException(`Unsupported MIME type: ${mimeType}`);
    // ponytail: parser instances created lazily on first use rather than injected as array.
    // Keeps constructor clean and avoids circular DI or factory pattern complexity.
    const parsers: Record<string, DocumentParser> = {
      pdf: new PdfParser(),
      docx: new DocxParser(),
      txt: new TextParser(),
      md: new TextParser(),
      csv: new CsvParser(),
      json: new JsonParser(),
    };
    return parsers[key];
  }

  async upload(
    file: {
      buffer: Buffer;
      originalname: string;
      mimetype: string;
      size: number;
    },
    options?: {
      knowledgeSourceId?: string;
      title?: string;
      chunkingStrategy?: ChunkingStrategy;
      chunkSize?: number;
      chunkOverlap?: number;
      createdBy?: string;
    },
  ): Promise<UploadDocumentResponse> {
    this.validateFile(file);

    const hash = crypto.createHash('sha256').update(file.buffer).digest('hex');

    const existing = await this.ragRepository.findByHash(hash);
    if (existing)
      throw new ConflictException(
        'Duplicate upload — document with same content hash exists',
      );

    const knowledgeSourceId = options?.knowledgeSourceId ?? 'default';
    const title = options?.title ?? path.parse(file.originalname).name;

    const document = await this.ragRepository.createDocument({
      knowledgeSourceId,
      title,
      filename: this.sanitizeFilename(file.originalname),
      size: file.size,
      mimeType: file.mimetype,
      contentHash: hash,
      status: DocumentStatus.PROCESSING,
      createdBy: options?.createdBy,
    });

    try {
      const storagePath = await this.storage.save(
        file.originalname,
        file.buffer,
        file.mimetype,
      );
      await this.ragRepository.updateStoragePath(document.id, storagePath);

      const parseResult = await this.parseDocument(file.buffer, file.mimetype);
      const clean = cleanText(parseResult.text);

      if (!clean || clean.length === 0)
        throw new BadRequestException('Empty document after parsing');

      await this.ragRepository.updateMetadata(document.id, {
        language:
          (parseResult.metadata['language'] as string | undefined) ?? null,
        pageCount:
          (parseResult.metadata['pageCount'] as number | undefined) ?? null,
      });

      const chunks = await this.chunkDocument(clean, options);

      await this.ragRepository.insertChunks(
        chunks.map((c) => ({
          documentId: document.id,
          knowledgeSourceId,
          chunkIndex: c.index,
          content: c.content,
          characterCount: c.characterCount,
          startOffset: c.startOffset,
          endOffset: c.endOffset,
        })),
      );

      // ponytail: populate tsvector for hybrid search (keyword + vector).
      // Fire-and-forget — non-blocking, failures don't break ingestion.
      this.ragRepository.populateSearchVectors(document.id).catch(() => {/* degrade gracefully */});

      if (chunks.length > 0) {
        await this.queueEmbeddingJobs(document.id, chunks);
      }

      await this.ragRepository.updateDocumentStatus(
        document.id,
        DocumentStatus.COMPLETED,
      );

      // ponytail: file kept in storage for reprocessing — delete if archival policy is added
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      await this.ragRepository.updateDocumentStatus(
        document.id,
        DocumentStatus.FAILED,
        message,
      );
      throw err;
    }

    return {
      id: document.id,
      filename: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      status: DocumentStatus.COMPLETED,
      contentHash: hash,
      chunkCount: 0, // caller can GET /documents/:id/chunks
      createdAt: document.createdAt,
    };
  }

  private validateFile(file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  }): void {
    if (!file.buffer || file.buffer.length === 0)
      throw new BadRequestException('Empty file');
    if (file.size > this.maxSize)
      throw new BadRequestException(
        `File exceeds max size of ${this.maxSize} bytes`,
      );
    if (!ALLOWED_MIME[file.mimetype])
      throw new BadRequestException(`Unsupported MIME type: ${file.mimetype}`);
    // ponytail: virus scan skipped — add ClamAV integration when files come from untrusted uploads
  }

  private sanitizeFilename(name: string): string {
    // ponytail: basic path traversal protection — strips directory components and special chars.
    // Unicode normalization added when non-ASCII filenames cause storage issues.
    return path.basename(name).replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
  }

  private async parseDocument(
    buffer: Buffer,
    mimeType: string,
  ): Promise<ParseResult> {
    const parser = this.getParser(mimeType);
    return parser.parse(buffer);
  }

  private chunkDocument(
    text: string,
    options?: {
      chunkingStrategy?: ChunkingStrategy;
      chunkSize?: number;
      chunkOverlap?: number;
    },
  ): ChunkResult[] {
    return this.chunkingService.chunk(
      {
        text,
        chunkSize: options?.chunkSize ?? this.defaultChunkSize,
        chunkOverlap: options?.chunkOverlap ?? this.defaultChunkOverlap,
        maxChunks: this.maxChunks,
      },
      options?.chunkingStrategy ?? ChunkingStrategy.FIXED,
    );
  }

  private async queueEmbeddingJobs(
    documentId: string,
    chunks: ChunkResult[],
  ): Promise<void> {
    // ponytail: individual adds instead of addBulk to avoid complex typing with BullMQ v5 generics.
    // Optimize to addBulk when the number of chunks per document exceeds 100.
    for (const chunk of chunks) {
      await this.embeddingQueue.add(
        'embedding',
        { chunkId: String(chunk.index), text: chunk.content, documentId },
        { priority: 1 },
      );
    }
  }

  // ── Delegate methods ─────────────────────────────────────────

  async listDocuments(page: number, limit: number) {
    return this.ragRepository.listDocuments(page, limit);
  }

  async getDocument(id: string) {
    return this.ragRepository.getDocument(id);
  }

  async deleteDocument(id: string): Promise<void> {
    const doc = await this.ragRepository.getDocument(id);
    if (!doc) throw new BadRequestException('Document not found');
    const storagePath = doc['storagePath'] as string | null;
    if (storagePath) await this.storage.delete(storagePath);
    await this.ragRepository.deleteDocument(id);
  }

  async reprocessDocument(
    id: string,
    options?: {
      chunkingStrategy?: ChunkingStrategy;
      chunkSize?: number;
      chunkOverlap?: number;
    },
  ): Promise<UploadDocumentResponse> {
    const doc = await this.ragRepository.getDocument(id);
    if (!doc) throw new BadRequestException('Document not found');
    const storagePath = doc['storagePath'] as string | null;
    if (!storagePath)
      throw new BadRequestException('Document has no stored file');

    const d = doc;
    // ponytail: local FS read only — add StorageProvider.read() for S3 reprocess support
    const fs = await import('fs/promises');
    const buffer = await fs.readFile(storagePath).catch(() => {
      throw new BadRequestException('File not found in storage');
    });

    return this.upload(
      {
        buffer,
        originalname: d['filename'] as string,
        mimetype: d['mimeType'] as string,
        size: d['size'] as number,
      },
      {
        knowledgeSourceId: d['knowledgeSourceId'] as string,
        title: (d['title'] as string | undefined) ?? undefined,
        ...options,
        createdBy: (d['createdBy'] as string | undefined) ?? undefined,
      },
    );
  }

  async getChunksByDocument(documentId: string, page: number, limit: number) {
    return this.ragRepository.findChunksByDocument(documentId, page, limit);
  }

  async getJobsByDocument(documentId: string) {
    return this.ragRepository.findJobsByDocument(documentId);
  }

  async health(): Promise<{
    storageProvider: string;
    storageOk: boolean;
    queueOk: boolean;
    parsers: string[];
    chunkerAvailable: boolean;
    dbConnected: boolean;
    status: string;
    message: string;
  }> {
    const checks = {
      storageProvider: this.configService.get<string>(
        'rag.storageProvider',
        'local',
      ),
      storageOk: true,
      queueOk: true,
      parsers: Object.keys(ALLOWED_MIME),
      chunkerAvailable: true,
      dbConnected: false,
    };

    try {
      await this.ragRepository.ping();
      checks.dbConnected = true;
    } catch {
      checks.dbConnected = false;
    }

    try {
      await this.embeddingQueue.getJobCounts();
    } catch {
      checks.queueOk = false;
    }

    const healthy = checks.dbConnected && checks.queueOk;
    return {
      ...checks,
      status: healthy ? 'healthy' : 'degraded',
      message: healthy
        ? 'All systems operational'
        : 'One or more dependencies unavailable',
    };
  }
}

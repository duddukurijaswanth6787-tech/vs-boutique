import {
  Injectable,
  Logger,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { RagKnowledgeRepository } from './rag-knowledge.repository';
import { BusinessException, ValidationException } from '@common/exceptions';
import {
  CreateKnowledgeSourceDto,
  UpdateKnowledgeSourceDto,
  UploadUrlRequestDto,
} from './rag-knowledge.types';
import { StorageService } from '@infrastructure/storage/storage.service';
import { AuditService } from '@domains/audit/audit.service';
import { RagIngestionService } from './rag-ingestion.service';
import { Queue } from 'bullmq';
import * as dns from 'dns';
import { promisify } from 'util';
import * as crypto from 'crypto';

const resolve4 = promisify(dns.resolve4);

@Injectable()
export class RagKnowledgeService {
  private readonly logger = new Logger('RagKnowledgeService');
  private readonly isBullMQEnabled = process.env.ENABLE_BULLMQ !== 'false';

  constructor(
    _prisma: PrismaService,
    private readonly repository: RagKnowledgeRepository,
    private readonly storageService: StorageService,
    private readonly auditService: AuditService,
    private readonly ingestionService: RagIngestionService,
    @Inject('BullQueue_rag-ingestion')
    private readonly queue: Queue,
  ) {}

  async findAll(page: number, limit: number) {
    return this.repository.findAll({ page, limit });
  }

  async findById(id: string) {
    const source = await this.repository.findById(id);
    if (!source) throw new BusinessException('Knowledge source not found', 'RAG_SOURCE_NOT_FOUND');
    return source;
  }

  async create(dto: CreateKnowledgeSourceDto, userId: string) {
    let crawledText = dto.rawText || '';

    // SSRF validation for URL sources
    if (dto.sourceType === 'URL' && dto.sourceUrl) {
      crawledText = await this.crawlUrl(dto.sourceUrl);
    }

    const source = await this.repository.create({
      name: dto.name,
      sourceType: dto.sourceType,
      sourceUrl: dto.sourceUrl || null,
      rawText: crawledText || null,
      status: 'PENDING',
      createdBy: userId,
      metadata: {},
    });

    await this.auditService.log({
      userId,
      action: 'CREATE',
      module: 'RAG_KNOWLEDGE',
      resource: 'RAG',
      resourceId: source.id,
      metadata: { sourceType: source.sourceType },
    });

    // Trigger Ingestion
    await this.triggerIngestion(source.id);

    return source;
  }

  async update(id: string, dto: UpdateKnowledgeSourceDto, userId: string) {
    await this.findById(id);
    let crawledText = dto.rawText;

    if (dto.sourceUrl) {
      crawledText = await this.crawlUrl(dto.sourceUrl);
    }

    const updated = await this.repository.update(id, {
      name: dto.name || undefined,
      sourceUrl: dto.sourceUrl || undefined,
      rawText: crawledText || undefined,
      status: 'PENDING',
      updatedBy: userId,
    });

    await this.auditService.log({
      userId,
      action: 'UPDATE',
      module: 'RAG_KNOWLEDGE',
      resource: 'RAG',
      resourceId: id,
    });

    await this.triggerIngestion(id);

    return updated;
  }

  async softDelete(id: string, userId: string) {
    await this.findById(id);
    const source = await this.repository.softDelete(id);

    await this.auditService.log({
      userId,
      action: 'DELETE',
      module: 'RAG_KNOWLEDGE',
      resource: 'RAG',
      resourceId: id,
    });

    return source;
  }

  async restore(id: string, userId: string) {
    await this.repository.restore(id);

    await this.auditService.log({
      userId,
      action: 'RESTORE',
      module: 'RAG_KNOWLEDGE',
      resource: 'RAG',
      resourceId: id,
    });

    return { success: true };
  }

  async getUploadUrl(dto: UploadUrlRequestDto) {
    // MIME type check: only text/plain is supported currently
    if (dto.mimeType !== 'text/plain') {
      throw new ValidationException(
        'Unsupported document MIME type. Only text/plain is supported.',
      );
    }

    const sourceId = crypto.randomUUID();
    const fileId = crypto.randomUUID();

    // S3 Key prefix schema constraints: rag/knowledge/{sourceId}/{uuid}-{safeFileName}
    const safeName = dto.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const s3Key = `rag/knowledge/${sourceId}/${fileId}-${safeName}`;

    // Get Presigned upload URL
    const uploadUrl = await this.storageService.getSignedUploadUrl(
      s3Key,
      dto.mimeType,
    );

    return {
      sourceId,
      s3Key,
      uploadUrl,
    };
  }

  async confirmUpload(
    id: string,
    s3Key: string,
    fileName: string,
    mimeType: string,
    size: number,
    userId: string,
  ) {
    // Validate s3Prefix path match
    if (!s3Key.startsWith(`rag/knowledge/${id}/`)) {
      throw new ValidationException(
        'S3 Key does not match the knowledge source ID prefix.',
      );
    }

    // Verify S3 object exists using StorageService
    const exists = await this.storageService.exists(s3Key);
    if (!exists) {
      throw new ValidationException(
        'Uploaded file not found in storage bucket.',
      );
    }

    const source = await this.repository.create({
      id,
      name: fileName,
      sourceType: 'DOCUMENT',
      status: 'PENDING',
      s3Key,
      originalFileName: fileName,
      mimeType,
      metadata: { size },
      createdBy: userId,
    });

    await this.auditService.log({
      userId,
      action: 'CONFIRM_UPLOAD',
      module: 'RAG_KNOWLEDGE',
      resource: 'RAG',
      resourceId: id,
      metadata: { s3Key },
    });

    await this.triggerIngestion(id);

    return source;
  }

  async reindex(id: string, userId: string) {
    await this.findById(id);

    await this.repository.update(id, { status: 'PENDING', updatedBy: userId });

    await this.auditService.log({
      userId,
      action: 'REINDEX',
      module: 'RAG_KNOWLEDGE',
      resource: 'RAG',
      resourceId: id,
    });

    await this.triggerIngestion(id);
    return { success: true };
  }

  private async triggerIngestion(sourceId: string) {
    if (this.isBullMQEnabled) {
      await this.queue.add('ingest', { sourceId });
      this.logger.log(`Ingestion job queued for source: ${sourceId}`);
    } else {
      // In development/test with BullMQ disabled, run ingestion asynchronously in background
      // ponytail: in-memory fallback avoids local redis setup
      setTimeout(() => {
        void (async () => {
          try {
            await this.ingestionService.processIngestion(sourceId);
          } catch (err: any) {
            this.logger.error(
              `Synchronous background ingestion failed: ${err.message}`,
            );
          }
        })();
      }, 100);
    }
  }

  private async crawlUrl(urlStr: string): Promise<string> {
    const url = new URL(urlStr);

    // 1. Allow only http/https protocols
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new ValidationException(
        'Protocol not allowed. Only HTTP and HTTPS are permitted.',
      );
    }

    // 2. DNS resolve hostname to IP
    let ip: string;
    try {
      const addresses = await resolve4(url.hostname);
      ip = addresses[0];
    } catch {
      throw new ValidationException('Failed to resolve hostname');
    }

    // 3. SSRF guard blacklist checks
    if (this.isPrivateIp(ip)) {
      throw new ValidationException(
        'SSRF Detected: Forbidden destination IP address.',
      );
    }

    // 4. Fetch content under strict timeout
    try {
      const res = await fetch(url.toString(), {
        signal: AbortSignal.timeout(5000), // 5s timeout
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      // Size limit: maximum 5MB (5242880 bytes)
      const buffer = await res.arrayBuffer();
      if (buffer.byteLength > 5242880) {
        throw new ValidationException('Content exceeds maximum limit of 5MB', 'RAG_CONTENT_TOO_LARGE');
      }

      const contentType = res.headers.get('content-type') || '';
      if (
        !contentType.includes('text/html') &&
        !contentType.includes('text/plain')
      ) {
        throw new ValidationException('Content-Type not allowed', 'RAG_CONTENT_TYPE');
      }

      const text = new TextDecoder('utf-8').decode(buffer);

      // Strip script/style tags and clean HTML tag markers
      return text
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    } catch (err: any) {
      throw new ValidationException(`URL crawling failed: ${err.message}`);
    }
  }

  private isPrivateIp(ip: string): boolean {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4) return true;

    // loopback
    if (parts[0] === 127) return true;
    // class A private
    if (parts[0] === 10) return true;
    // class B private
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // class C private
    if (parts[0] === 192 && parts[1] === 168) return true;
    // link-local
    if (parts[0] === 169 && parts[1] === 254) return true;
    // zero/wildcard
    if (parts[0] === 0) return true;

    return false;
  }

  async findChunks(id: string, page: number, limit: number) {
    await this.findById(id);
    return this.repository.findChunksBySourceId(id, { page, limit });
  }
}

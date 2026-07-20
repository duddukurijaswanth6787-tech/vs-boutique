import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import { LoggerService } from '@common/logger/logger.service';
import { FileUploadException, StorageException } from '@common/exceptions';
import { FILE_LIMITS } from '@common/constants';
import { STORAGE_PROVIDER } from './storage.constants';
import type {
  StorageProvider,
  FileMetadata,
  ImageVariants,
} from './storage.types';
import { StorageUtils } from './storage.utils';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(
    @Inject(STORAGE_PROVIDER)
    private readonly provider: StorageProvider,
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
  ) {}

  async upload(
    data: Buffer,
    options: {
      originalName: string;
      mimeType: string;
      folder?: string;
      entityId?: string;
    },
  ): Promise<FileMetadata> {
    this.validate(data, options.mimeType);
    const key = StorageUtils.generateKey(
      options.folder,
      options.entityId,
      options.originalName,
    );
    try {
      const result = await this.provider.write(key, data, options.mimeType);
      this.loggerService.log(
        `File uploaded: ${key} (${data.length} bytes)`,
        'StorageService',
      );
      return result;
    } catch (err: any) {
      this.logger.error(`Upload failed: ${key}`, err.stack);
      if (err instanceof StorageException) throw err;
      throw new StorageException(
        `Failed to upload file`,
        'STORAGE_UPLOAD_FAILED',
        { key },
      );
    }
  }

  async uploadImage(
    data: Buffer,
    options: {
      originalName: string;
      mimeType: string;
      folder?: string;
      entityId?: string;
    },
  ): Promise<ImageVariants> {
    this.validate(data, options.mimeType);
    if (!this.isImage(options.mimeType)) {
      throw new FileUploadException(
        'File is not an image',
        'INVALID_FILE_TYPE',
      );
    }

    const key = StorageUtils.generateKey(
      options.folder,
      options.entityId,
      options.originalName,
    );
    const baseKey = key.replace(/\.[^.]+$/, '');

    try {
      const [original, thumbnail, medium, large] = await Promise.all([
        this.provider.write(
          `${baseKey}.webp`,
          await this.toWebp(data),
          'image/webp',
        ),
        this.provider.write(
          `${baseKey}_thumb.webp`,
          await this.toWebp(data, 150),
          'image/webp',
        ),
        this.provider.write(
          `${baseKey}_medium.webp`,
          await this.toWebp(data, 600),
          'image/webp',
        ),
        this.provider.write(
          `${baseKey}_large.webp`,
          await this.toWebp(data, 1200),
          'image/webp',
        ),
      ]);

      this.loggerService.log(
        `Image uploaded with variants: ${baseKey}`,
        'StorageService',
      );
      return { original, thumbnail, medium, large };
    } catch (err: any) {
      this.logger.error(`Image upload failed: ${baseKey}`, err.stack);
      if (err instanceof StorageException) throw err;
      throw new StorageException(
        `Failed to upload image`,
        'STORAGE_UPLOAD_FAILED',
        { baseKey },
      );
    }
  }

  async delete(storagePath: string): Promise<void> {
    try {
      await this.provider.delete(storagePath);
      this.loggerService.log(`File deleted: ${storagePath}`, 'StorageService');
    } catch (err: any) {
      this.logger.error(`Delete failed: ${storagePath}`, err.stack);
      if (err instanceof StorageException) throw err;
      throw new StorageException(
        `Failed to delete file`,
        'STORAGE_DELETE_FAILED',
        { storagePath },
      );
    }
  }

  async deleteImageVariants(baseKey: string): Promise<void> {
    const keys = [
      `${baseKey}.webp`,
      `${baseKey}_thumb.webp`,
      `${baseKey}_medium.webp`,
      `${baseKey}_large.webp`,
    ];
    // ponytail: log each failure instead of silently swallowing; one failure shouldn't abort the rest
    await Promise.all(
      keys.map(async (k) => {
        try {
          await this.provider.delete(k);
        } catch (err: any) {
          this.logger.warn(`Failed to delete variant ${k}: ${err.message}`);
        }
      }),
    );
  }

  async get(storagePath: string): Promise<Buffer> {
    return this.provider.read(storagePath);
  }

  async exists(storagePath: string): Promise<boolean> {
    return this.provider.exists(storagePath);
  }

  async copy(sourceKey: string, destKey: string): Promise<void> {
    return this.provider.copy(sourceKey, destKey);
  }

  async move(sourceKey: string, destKey: string): Promise<void> {
    return this.provider.move(sourceKey, destKey);
  }

  getPublicUrl(filePath: string): string {
    return this.provider.getPublicUrl(filePath);
  }

  async getSignedUploadUrl(
    filePath: string,
    contentType?: string,
  ): Promise<string> {
    return this.provider.getSignedUploadUrl(filePath, contentType);
  }

  async getSignedDownloadUrl(filePath: string): Promise<string> {
    return this.provider.getSignedDownloadUrl(filePath);
  }

  async getDisplayUrl(input: string): Promise<string> {
    return this.provider.getDisplayUrl(input);
  }

  async healthCheck(): Promise<{
    writable: boolean;
    provider: string;
    root: string;
    bucket?: string;
    region?: string;
    status: 'up' | 'down';
    lastCheckedAt: string;
  }> {
    return this.provider.healthCheck();
  }

  private validate(data: Buffer, mimeType: string): void {
    const maxSize =
      this.configService.get<number>('app.storage.maxFileSize') ??
      FILE_LIMITS.MAX_FILE_SIZE;
    const allowedMimeTypes: string[] = [
      ...(this.configService
        .get<string>('app.storage.allowedMimeTypes')
        ?.split(',') ?? [...FILE_LIMITS.ALLOWED_MIME_TYPES]),
      'text/csv',
    ];

    if (!allowedMimeTypes.includes(mimeType)) {
      throw new FileUploadException(
        `File type ${mimeType} is not allowed`,
        'INVALID_FILE_TYPE',
        { allowedMimeTypes, mimeType },
      );
    }
    if (data.length > maxSize) {
      throw new FileUploadException(
        `File size ${data.length} exceeds maximum ${maxSize}`,
        'FILE_TOO_LARGE',
        { maxSize, fileSize: data.length },
      );
    }
    // ponytail: verify file magic bytes match declared MIME — prevents disguised executables
    if (data.length >= 4) {
      this.validateFileSignature(data, mimeType);
    }
  }

  // ponytail: magic bytes check for common types — extensible for malware scan hook
  private validateFileSignature(data: Buffer, mimeType: string): void {
    const sig = data.slice(0, 4);
    const signatures: Record<string, (buf: Buffer) => boolean> = {
      'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
      'image/png': (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
      'image/gif': (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46,
      'image/webp': (b) => b.slice(0, 4).toString() === 'RIFF',
      'application/pdf': (b) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46,
      'video/mp4': (b) => b.slice(4, 8).toString() === 'ftyp',
    };
    const check = signatures[mimeType];
    if (check && !check(sig)) {
      throw new FileUploadException(
        `File signature does not match declared type ${mimeType}`,
        'FILE_SIGNATURE_MISMATCH',
        { mimeType },
      );
    }
  }

  private isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  private async toWebp(data: Buffer, maxWidth?: number): Promise<Buffer> {
    let pipeline = sharp(data).webp({ quality: 80 });
    if (maxWidth) {
      pipeline = pipeline.resize(maxWidth, null, { withoutEnlargement: true });
    }
    return pipeline.toBuffer();
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { StorageProvider, FileMetadata } from './storage.types';
import { StorageException } from '@common/exceptions';

@Injectable()
export class S3StorageProvider implements StorageProvider {
  private readonly logger = new Logger(S3StorageProvider.name);
  private _client?: S3Client;
  private readonly region: string;
  private readonly endpoint?: string;
  private readonly forcePathStyle: boolean;
  private readonly accessKeyId: string;
  private readonly secretAccessKey: string;
  private readonly bucket: string;
  private readonly publicUrl: string;
  private readonly signedUrlExpiry: number;

  constructor(private readonly configService: ConfigService) {
    this.region = this.configService.get<string>(
      'app.storage.s3.region',
      'ap-south-1',
    );
    this.endpoint = this.configService.get<string>('app.storage.s3.endpoint');
    this.forcePathStyle = this.configService.get<boolean>(
      'app.storage.s3.forcePathStyle',
      false,
    );
    this.accessKeyId = this.configService.get<string>(
      'app.storage.s3.accessKeyId',
      '',
    );
    this.secretAccessKey = this.configService.get<string>(
      'app.storage.s3.secretAccessKey',
      '',
    );
    this.bucket = this.configService.get<string>('app.storage.s3.bucket', '');
    this.publicUrl = this.configService.get<string>(
      'app.storage.s3.publicUrl',
      '',
    );
    this.signedUrlExpiry = this.configService.get<number>(
      'app.storage.s3.signedUrlExpiry',
      3600,
    );
  }

  // ponytail: lazy client — only constructed/validated when S3 is actually used,
  // so STORAGE_PROVIDER=local doesn't crash at startup on missing S3 creds
  private get client(): S3Client {
    if (this._client) return this._client;
    if (
      !this.accessKeyId ||
      !this.secretAccessKey ||
      this.accessKeyId.includes('${') ||
      this.secretAccessKey.includes('${')
    ) {
      throw new Error(
        'S3 storage misconfigured: AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY are missing or unresolved (placeholder "${...}" found). Set STORAGE_PROVIDER=local in development or provide real S3 credentials.',
      );
    }
    this._client = new S3Client({
      region: this.region,
      ...(this.endpoint && { endpoint: this.endpoint }),
      forcePathStyle: this.forcePathStyle,
      credentials: {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey,
      },
    });
    return this._client;
  }

  async write(
    filePath: string,
    data: Buffer,
    contentType?: string,
  ): Promise<FileMetadata> {
    const ct = contentType ?? this.getContentType(filePath);
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: filePath,
          Body: data,
          ContentType: ct,
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );
      return {
        url: this.getPublicUrl(filePath),
        key: filePath,
        bucket: this.bucket,
        mimeType: ct,
        size: data.length,
        uploadedAt: new Date(),
      };
    } catch (err: any) {
      this.logger.error(`S3 write failed for ${filePath}`, err.stack);
      throw new StorageException(
        `Failed to upload file to storage`,
        'STORAGE_UPLOAD_FAILED',
        { key: filePath },
      );
    }
  }

  async read(filePath: string): Promise<Buffer> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: filePath }),
      );
      const chunks: Uint8Array[] = [];
      const stream = response.Body as AsyncIterable<Uint8Array>;
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    } catch (err: any) {
      this.logger.error(`S3 read failed for ${filePath}`, err.stack);
      throw new StorageException(
        `Failed to read file from storage`,
        'STORAGE_READ_FAILED',
        { key: filePath },
      );
    }
  }

  async delete(filePath: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: filePath }),
      );
    } catch (err: any) {
      this.logger.error(`S3 delete failed for ${filePath}`, err.stack);
      throw new StorageException(
        `Failed to delete file from storage`,
        'STORAGE_DELETE_FAILED',
        { key: filePath },
      );
    }
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: filePath }),
      );
      return true;
    } catch (err: any) {
      // ponytail: 404/NoSuchKey is expected for a missing object — log only unexpected failures
      if (err?.$metadata?.httpStatusCode !== 404) {
        this.logger.warn(`S3 exists check failed for ${filePath}`, err.stack);
      }
      return false;
    }
  }

  async copy(sourceKey: string, destKey: string): Promise<void> {
    try {
      await this.client.send(
        new CopyObjectCommand({
          Bucket: this.bucket,
          CopySource: `${this.bucket}/${sourceKey}`,
          Key: destKey,
        }),
      );
    } catch (err: any) {
      this.logger.error(`S3 copy failed ${sourceKey} -> ${destKey}`, err.stack);
      throw new StorageException(
        `Failed to copy file in storage`,
        'STORAGE_COPY_FAILED',
        { sourceKey, destKey },
      );
    }
  }

  async move(sourceKey: string, destKey: string): Promise<void> {
    await this.copy(sourceKey, destKey);
    await this.delete(sourceKey);
  }

  getPublicUrl(filePath: string): string {
    if (this.publicUrl) {
      return `${this.publicUrl}/${filePath}`;
    }
    return `https://${this.bucket}.s3.amazonaws.com/${filePath}`;
  }

  async getSignedUploadUrl(
    filePath: string,
    contentType?: string,
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: filePath,
        ...(contentType && { ContentType: contentType }),
      });
      return getSignedUrl(this.client, command, {
        expiresIn: this.signedUrlExpiry,
      });
    } catch (err: any) {
      this.logger.error(
        `S3 signed upload URL failed for ${filePath}`,
        err.stack,
      );
      throw new StorageException(
        `Failed to generate upload URL`,
        'STORAGE_SIGNED_URL_FAILED',
        { key: filePath },
      );
    }
  }

  async getSignedDownloadUrl(filePath: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: filePath,
      });
      return getSignedUrl(this.client, command, {
        expiresIn: this.signedUrlExpiry,
      });
    } catch (err: any) {
      this.logger.error(
        `S3 signed download URL failed for ${filePath}`,
        err.stack,
      );
      throw new StorageException(
        `Failed to generate download URL`,
        'STORAGE_SIGNED_URL_FAILED',
        { key: filePath },
      );
    }
  }

  async getDisplayUrl(input: string): Promise<string> {
    if (!input) return input;
    if (input.startsWith('http://') || input.startsWith('https://')) {
      let key: string | undefined;
      if (this.publicUrl && input.startsWith(`${this.publicUrl}/`)) {
        key = input.slice(this.publicUrl.length + 1);
      } else if (input.includes(this.bucket)) {
        const m = input.match(/^https?:\/\/[^/]+\/(.+)$/);
        key = m ? m[1] : undefined;
      }
      if (key) return this.getSignedDownloadUrl(key);
      return input;
    }
    return this.getSignedDownloadUrl(input);
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
    const lastCheckedAt = new Date().toISOString();
    try {
      const testKey = `.health-check/${Date.now()}`;
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: testKey,
          Body: 'health-check',
        }),
      );
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: testKey }),
      );
      return {
        writable: true,
        provider: 's3',
        root: this.bucket,
        bucket: this.bucket,
        region: this.region,
        status: 'up',
        lastCheckedAt,
      };
    } catch (err: any) {
      this.logger.warn(`S3 health check failed`, err.stack);
      return {
        writable: false,
        provider: 's3',
        root: this.bucket,
        bucket: this.bucket,
        region: this.region,
        status: 'down',
        lastCheckedAt,
      };
    }
  }

  private getContentType(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      avif: 'image/avif',
      gif: 'image/gif',
      pdf: 'application/pdf',
      mp4: 'video/mp4',
    };
    return mimeTypes[ext ?? ''] ?? 'application/octet-stream';
  }
}

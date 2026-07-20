import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface StorageProvider {
  save(filename: string, buffer: Buffer, mimeType: string): Promise<string>;
  delete(storagePath: string): Promise<void>;
  getUrl(storagePath: string): string;
}

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly root: string;

  constructor(config: ConfigService) {
    this.root = config.get<string>('rag.storageRoot', './storage/documents');
  }

  async save(
    _filename: string,
    buffer: Buffer,
    _mimeType: string,
  ): Promise<string> {
    const id = randomUUID();
    // ponytail: two-level sharding to avoid single-directory bottlenecks.
    // Replace with hash-based tree when >100K files per shard.
    const shard = id.slice(0, 2);
    const dir = path.join(this.root, shard);
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, id);
    await fs.writeFile(filePath, buffer);
    return filePath;
  }

  async delete(storagePath: string): Promise<void> {
    await fs.unlink(storagePath).catch(() => {});
  }

  getUrl(storagePath: string): string {
    const rel = path.relative(this.root, storagePath).replace(/\\/g, '/');
    return `/storage/documents/${rel}`;
  }
}

// ponytail: S3 provider added alongside Local because spec explicitly requires both.
// Azure Blob / GCS skipped — add when STORAGE_PROVIDER=azure|gcs is configured.
@Injectable()
export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly prefix: string;

  constructor(config: ConfigService) {
    this.client = new S3Client({
      region: config.get<string>('AWS_REGION', 'ap-south-1'),
      credentials: {
        accessKeyId: config.get<string>('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: config.get<string>('AWS_SECRET_ACCESS_KEY', ''),
      },
      endpoint: config.get<string>('AWS_S3_ENDPOINT') || undefined,
      forcePathStyle: config.get<boolean>('AWS_S3_FORCE_PATH_STYLE', false),
    });
    this.bucket = config.get<string>('AWS_S3_BUCKET', '');
    this.prefix = 'documents';
  }

  async save(
    _filename: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    const key = `${this.prefix}/${randomUUID()}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    );
    return key;
  }

  async delete(storagePath: string): Promise<void> {
    await this.client
      .send(new DeleteObjectCommand({ Bucket: this.bucket, Key: storagePath }))
      .catch(() => {});
  }

  getUrl(storagePath: string): string {
    return `https://${this.bucket}.s3.amazonaws.com/${storagePath}`;
  }
}

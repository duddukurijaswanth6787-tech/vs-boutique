import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  mkdir,
  writeFile,
  readFile,
  unlink,
  access,
  copyFile,
} from 'fs/promises';
import { resolve, join } from 'path';
import type { StorageProvider, FileMetadata } from './storage.types';
import { StorageUtils } from './storage.utils';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly storageRoot: string;
  private readonly publicUrlBase: string;

  constructor(private readonly configService: ConfigService) {
    this.storageRoot = resolve(
      this.configService.get<string>('app.storage.root', './storage'),
    );
    this.publicUrlBase = this.configService.get<string>(
      'app.storage.publicUrl',
      '/storage',
    );
  }

  async write(
    filePath: string,
    data: Buffer,
    contentType?: string,
  ): Promise<FileMetadata> {
    StorageUtils.assertSafePath(filePath);
    const fullPath = join(this.storageRoot, filePath);
    await mkdir(join(fullPath, '..'), { recursive: true });
    await writeFile(fullPath, data);
    return {
      url: this.getPublicUrl(filePath),
      key: filePath,
      bucket: 'local',
      mimeType: contentType ?? 'application/octet-stream',
      size: data.length,
      uploadedAt: new Date(),
    };
  }

  async read(filePath: string): Promise<Buffer> {
    StorageUtils.assertSafePath(filePath);
    return readFile(join(this.storageRoot, filePath));
  }

  async delete(filePath: string): Promise<void> {
    StorageUtils.assertSafePath(filePath);
    await unlink(join(this.storageRoot, filePath));
  }

  async exists(filePath: string): Promise<boolean> {
    StorageUtils.assertSafePath(filePath);
    try {
      await access(join(this.storageRoot, filePath));
      return true;
    } catch {
      return false;
    }
  }

  async copy(sourceKey: string, destKey: string): Promise<void> {
    StorageUtils.assertSafePath(sourceKey);
    StorageUtils.assertSafePath(destKey);
    const destDir = join(this.storageRoot, destKey, '..');
    await mkdir(destDir, { recursive: true });
    await copyFile(
      join(this.storageRoot, sourceKey),
      join(this.storageRoot, destKey),
    );
  }

  async move(sourceKey: string, destKey: string): Promise<void> {
    await this.copy(sourceKey, destKey);
    await this.delete(sourceKey);
  }

  getPublicUrl(filePath: string): string {
    StorageUtils.assertSafePath(filePath);
    return `${this.publicUrlBase}/${filePath.replace(/\\/g, '/')}`;
  }

  async getSignedUploadUrl(filePath: string): Promise<string> {
    // ponytail: local storage doesn't support signed URLs, return public URL
    return this.getPublicUrl(filePath);
  }

  async getSignedDownloadUrl(filePath: string): Promise<string> {
    return this.getPublicUrl(filePath);
  }

  async getDisplayUrl(input: string): Promise<string> {
    if (!input) return input;
    if (input.startsWith('http://') || input.startsWith('https://')) {
      return input;
    }
    return this.getPublicUrl(input);
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
      await mkdir(this.storageRoot, { recursive: true });
      return {
        writable: true,
        provider: 'local',
        root: this.storageRoot,
        bucket: 'local',
        region: 'local',
        status: 'up',
        lastCheckedAt,
      };
    } catch {
      return {
        writable: false,
        provider: 'local',
        root: this.storageRoot,
        bucket: 'local',
        region: 'local',
        status: 'down',
        lastCheckedAt,
      };
    }
  }
}

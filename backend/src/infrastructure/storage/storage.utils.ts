import crypto from 'crypto';
import { extname } from 'path';

export class StorageUtils {
  static generateFilename(originalName: string): string {
    const ext = extname(originalName) || '';
    return `${crypto.randomUUID()}${ext}`;
  }

  static generateKey(
    folder?: string,
    entityId?: string,
    originalName?: string,
  ): string {
    const uuid = crypto.randomUUID();
    const ext = originalName ? extname(originalName) : '';
    const parts = [folder, entityId, `${uuid}${ext}`].filter(Boolean);
    return parts.join('/');
  }

  static assertSafePath(filePath: string): void {
    if (
      filePath.includes('..') ||
      filePath.startsWith('/') ||
      filePath.startsWith('\\')
    ) {
      throw new Error('INVALID_STORAGE_PATH');
    }
  }
}

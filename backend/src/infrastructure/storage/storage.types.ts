export interface FileMetadata {
  url: string;
  key: string;
  bucket: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  etag?: string;
  thumbnailUrl?: string;
  originalName?: string;
  uploadedAt: Date;
}

export interface ImageVariants {
  original: FileMetadata;
  thumbnail?: FileMetadata;
  medium?: FileMetadata;
  large?: FileMetadata;
}

export interface StorageProvider {
  write(
    filePath: string,
    data: Buffer,
    contentType?: string,
  ): Promise<FileMetadata>;
  read(filePath: string): Promise<Buffer>;
  delete(filePath: string): Promise<void>;
  exists(filePath: string): Promise<boolean>;
  copy(sourceKey: string, destKey: string): Promise<void>;
  move(sourceKey: string, destKey: string): Promise<void>;
  getPublicUrl(filePath: string): string;
  getSignedUploadUrl(filePath: string, contentType?: string): Promise<string>;
  getSignedDownloadUrl(filePath: string): Promise<string>;
  getDisplayUrl(input: string): Promise<string>;
  healthCheck(): Promise<{
    writable: boolean;
    provider: string;
    root: string;
    bucket?: string;
    region?: string;
    status: 'up' | 'down';
    lastCheckedAt: string;
  }>;
}

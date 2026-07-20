import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { Global, Module } from '@nestjs/common';
import { resolve } from 'path';
import sharp from 'sharp';
import appConfig from '@config/app.config';
import { StorageModule } from '@infrastructure/storage/storage.module';
import { StorageService } from '@infrastructure/storage/storage.service';
import { LoggerService } from '@common/logger/logger.service';

const loggerStub = {
  log: () => {},
  error: () => {},
  warn: () => {},
  debug: () => {},
  verbose: () => {},
};

@Global()
@Module({
  providers: [{ provide: LoggerService, useValue: loggerStub }],
  exports: [LoggerService],
})
class TestLoggerModule {}

describe('StorageService S3 E2E (real AWS)', () => {
  let storage: StorageService;
  let png: Buffer;
  const written: string[] = [];

  beforeAll(async () => {
    png = await sharp({
      create: { width: 8, height: 8, channels: 3, background: '#ffffff' },
    })
      .png()
      .toBuffer();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [appConfig],
          envFilePath: resolve(__dirname, '../.env'),
        }),
        TestLoggerModule,
        StorageModule,
      ],
    }).compile();

    storage = module.get(StorageService);

    const provider = (
      storage as unknown as { provider: { constructor: { name: string } } }
    ).provider.constructor.name;
    if (provider !== 'S3StorageProvider') {
      throw new Error(
        `E2E requires STORAGE_PROVIDER=s3 (real AWS). Active provider: ${provider}`,
      );
    }
  });

  afterAll(async () => {
    await Promise.all(written.map((k) => storage.delete(k).catch(() => {})));
  });

  it('WRITE -> EXISTS -> READ -> SIGNED READ URL -> DELETE -> CONFIRM DELETE', async () => {
    const key = `e2e/health-check/${Date.now()}.png`;
    written.push(key);

    const meta = await storage.upload(png, {
      originalName: 'hello.png',
      mimeType: 'image/png',
    });
    expect(meta.key).toBeTruthy();

    expect(await storage.exists(meta.key)).toBe(true);

    const data = await storage.get(meta.key);
    expect(data.toString()).toBe('hello-s3');

    const signed = await storage.getSignedDownloadUrl(meta.key);
    expect(signed).toContain('X-Amz-Signature');

    await storage.delete(meta.key);
    expect(await storage.exists(meta.key)).toBe(false);
  });

  it('image upload produces original, thumbnail, medium, large variants', async () => {
    const variants = await storage.uploadImage(png, {
      originalName: 'logo.png',
      mimeType: 'image/png',
      folder: 'e2e/images',
    });

    for (const v of [
      variants.original,
      variants.thumbnail,
      variants.medium,
      variants.large,
    ]) {
      expect(v).toBeDefined();
      written.push(v!.key);
      expect(await storage.exists(v!.key)).toBe(true);
    }

    expect(variants.original.key).toMatch(/e2e\/images\/.*\.webp$/);
    expect(variants.thumbnail!.key).toContain('_thumb.webp');
    expect(variants.medium!.key).toContain('_medium.webp');
    expect(variants.large!.key).toContain('_large.webp');
  });

  it('report export storage path uses exports/<type>/<jobId> prefix', async () => {
    const result = await storage.upload(Buffer.from('a,b,c\n1,2,3\n'), {
      originalName: 'export_customer_test.csv',
      mimeType: 'text/csv',
      folder: 'exports/customer/e2e-job-1',
    });
    written.push(result.key);
    expect(result.key).toMatch(/^exports\/customer\/e2e-job-1\//);
    expect(await storage.exists(result.key)).toBe(true);
  });

  it('social post/reel media paths route through S3 signed URLs', async () => {
    const reelVideo = await storage.getSignedUploadUrl(
      `social/reels/e2e-post-1/videos/${Date.now()}.mp4`,
      'video/mp4',
    );
    expect(reelVideo).toContain('X-Amz-Signature');

    const reelThumb = await storage.getSignedUploadUrl(
      `social/reels/e2e-post-1/thumbnails/${Date.now()}.webp`,
      'image/webp',
    );
    expect(reelThumb).toContain('X-Amz-Signature');

    const postImage = await storage.getSignedUploadUrl(
      `social/posts/e2e-post-2/images/${Date.now()}.webp`,
      'image/webp',
    );
    expect(postImage).toContain('X-Amz-Signature');
  });
});

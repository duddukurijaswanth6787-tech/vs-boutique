import { InstagramReelsWorker } from './instagram-reels.worker';

// ponytail: direct instantiation, no TestingModule
describe('InstagramReelsWorker', () => {
  let worker: InstagramReelsWorker;
  let mockService: any;

  beforeEach(() => {
    mockService = {
      runScheduler: jest.fn(),
      runMediaHealthCheck: jest.fn(),
      runStorageCleanup: jest.fn(),
    };
    worker = new InstagramReelsWorker(mockService);
  });

  it('processes scheduler job', async () => {
    mockService.runScheduler.mockResolvedValue({
      published: 2,
      archived: 1,
      expired: 0,
    });
    const result = await worker.process({ name: 'scheduler', data: {} } as any);
    expect(result).toEqual({ published: 2, archived: 1, expired: 0 });
  });

  it('processes media-health job', async () => {
    mockService.runMediaHealthCheck.mockResolvedValue({
      checked: 10,
      brokenVideos: 0,
      brokenThumbnails: 0,
      ok: 10,
    });
    await worker.process({ name: 'media-health', data: {} } as any);
    expect(mockService.runMediaHealthCheck).toHaveBeenCalled();
  });

  it('processes storage-cleanup with dryRun default', async () => {
    mockService.runStorageCleanup.mockResolvedValue({
      dryRun: true,
      deleted: 0,
      freedBytes: 0,
      details: [],
    });
    await worker.process({ name: 'storage-cleanup', data: {} } as any);
    expect(mockService.runStorageCleanup).toHaveBeenCalledWith(true);
  });

  it('processes storage-cleanup with dryRun false', async () => {
    mockService.runStorageCleanup.mockResolvedValue({
      dryRun: false,
      deleted: 5,
      freedBytes: 0,
      details: ['x'],
    });
    await worker.process({
      name: 'storage-cleanup',
      data: { dryRun: false },
    } as any);
    expect(mockService.runStorageCleanup).toHaveBeenCalledWith(false);
  });

  it('handles unknown job gracefully', async () => {
    await expect(
      worker.process({ name: 'unknown', data: {} } as any),
    ).resolves.toBeUndefined();
  });
});
